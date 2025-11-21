/**
 * 🔐 WEBAUTHN SERVICE - SEMANA 25
 * Servicio de autenticación biométrica con FIDO2/WebAuthn
 *
 * Features:
 * - Registro de credenciales biométricas (Touch ID, Face ID, Windows Hello, YubiKey)
 * - Autenticación passwordless con biometría
 * - Soporte para múltiples dispositivos por usuario
 * - Gestión de credenciales
 *
 * Fecha: 20 Noviembre 2025
 */

const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse
} = require('@simplewebauthn/server');
const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger');

class WebAuthnService {
    constructor() {
        // RP (Relying Party) configuration
        this.rpName = 'BGE Héroes de la Patria';
        this.rpID = this.getRPID();
        this.origin = this.getOrigin();

        devLogger.log('WEBAUTHN', `Inicializado - RP ID: ${this.rpID}, Origin: ${this.origin}`);
    }

    /**
     * GET RELYING PARTY ID (domain)
     */
    getRPID() {
        const hostname = process.env.WEBAUTHN_RP_ID || process.env.DOMAIN || 'localhost';
        return hostname.replace(/^https?:\/\//, '').split(':')[0];
    }

    /**
     * GET ORIGIN (full URL)
     */
    getOrigin() {
        if (process.env.NODE_ENV === 'production') {
            return process.env.WEBAUTHN_ORIGIN || `https://${this.getRPID()}`;
        }
        return process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';
    }

    /**
     * GENERAR OPCIONES DE REGISTRO
     * Llamado cuando el usuario quiere registrar un nuevo dispositivo biométrico
     */
    async generateRegistrationOptions(userId, userName, userEmail) {
        try {
            devLogger.log('WEBAUTHN', `Generando opciones de registro para userId=${userId}`);

            // Get existing credentials to exclude (prevent duplicate registration)
            const existingCredentials = await this.getUserCredentials(userId);
            const excludeCredentials = existingCredentials.map(cred => ({
                id: Buffer.from(cred.credential_id, 'base64'),
                type: 'public-key',
                transports: cred.transports || ['usb', 'ble', 'nfc', 'internal']
            }));

            const options = await generateRegistrationOptions({
                rpName: this.rpName,
                rpID: this.rpID,
                userID: userId.toString(),
                userName: userName || userEmail,
                userDisplayName: userName || userEmail,
                // Timeout after 5 minutes
                timeout: 300000,
                // Prefer platform authenticators (Touch ID, Face ID, Windows Hello)
                authenticatorSelection: {
                    authenticatorAttachment: 'platform', // 'platform' or 'cross-platform' (YubiKey)
                    requireResidentKey: false,
                    userVerification: 'preferred' // 'required', 'preferred', or 'discouraged'
                },
                // Exclude existing credentials
                excludeCredentials,
                // Support both algorithms
                supportedAlgorithmIDs: [-7, -257] // ES256 and RS256
            });

            // Store challenge in database for verification
            await this.storeChallenge(userId, options.challenge, 'registration');

            devLogger.log('WEBAUTHN', `Opciones generadas, challenge stored`);

            return {
                success: true,
                options
            };

        } catch (error) {
            devLogger.error('WEBAUTHN', 'Error generando opciones de registro:', error);
            throw error;
        }
    }

    /**
     * VERIFICAR RESPUESTA DE REGISTRO
     * Llamado después de que el usuario completa el registro biométrico
     */
    async verifyRegistrationResponse(userId, response, deviceName = 'Dispositivo Biométrico') {
        try {
            devLogger.log('WEBAUTHN', `Verificando respuesta de registro para userId=${userId}`);

            // Get stored challenge
            const challenge = await this.getChallenge(userId, 'registration');
            if (!challenge) {
                throw new Error('Challenge no encontrado o expirado');
            }

            // Verify the registration response
            const verification = await verifyRegistrationResponse({
                response,
                expectedChallenge: challenge,
                expectedOrigin: this.origin,
                expectedRPID: this.rpID,
                requireUserVerification: false
            });

            if (!verification.verified || !verification.registrationInfo) {
                throw new Error('Verificación fallida');
            }

            const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

            // Store credential in database
            const credentialData = {
                userId,
                credentialId: Buffer.from(credentialID).toString('base64'),
                credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64'),
                counter,
                transports: response.response.transports || ['internal'],
                deviceName
            };

            await this.storeCredential(credentialData);

            // Clear challenge
            await this.clearChallenge(userId, 'registration');

            devLogger.log('WEBAUTHN', `Credencial registrada exitosamente para userId=${userId}`);

            return {
                success: true,
                verified: true,
                credentialId: credentialData.credentialId
            };

        } catch (error) {
            devLogger.error('WEBAUTHN', 'Error verificando registro:', error);
            throw error;
        }
    }

    /**
     * GENERAR OPCIONES DE AUTENTICACIÓN
     * Llamado cuando el usuario quiere hacer login con biometría
     */
    async generateAuthenticationOptions(userId = null) {
        try {
            devLogger.log('WEBAUTHN', `Generando opciones de autenticación${userId ? ` para userId=${userId}` : ' (discoverable credential)'}`);

            let allowCredentials = [];

            if (userId) {
                // User-specific authentication (require specific credentials)
                const credentials = await this.getUserCredentials(userId);
                allowCredentials = credentials.map(cred => ({
                    id: Buffer.from(cred.credential_id, 'base64'),
                    type: 'public-key',
                    transports: cred.transports || ['usb', 'ble', 'nfc', 'internal']
                }));

                if (allowCredentials.length === 0) {
                    throw new Error('Usuario no tiene credenciales biométricas registradas');
                }
            }

            const options = await generateAuthenticationOptions({
                rpID: this.rpID,
                timeout: 300000,
                // If userId provided, limit to specific credentials
                allowCredentials: userId ? allowCredentials : [],
                userVerification: 'preferred'
            });

            // Store challenge
            const challengeUserId = userId || 'anonymous';
            await this.storeChallenge(challengeUserId, options.challenge, 'authentication');

            devLogger.log('WEBAUTHN', 'Opciones de autenticación generadas');

            return {
                success: true,
                options
            };

        } catch (error) {
            devLogger.error('WEBAUTHN', 'Error generando opciones de autenticación:', error);
            throw error;
        }
    }

    /**
     * VERIFICAR RESPUESTA DE AUTENTICACIÓN
     * Llamado después de que el usuario completa la autenticación biométrica
     */
    async verifyAuthenticationResponse(response, userId = null) {
        try {
            devLogger.log('WEBAUTHN', `Verificando respuesta de autenticación`);

            // Get credential from database
            const credentialId = Buffer.from(response.id, 'base64url').toString('base64');
            const credential = await this.getCredential(credentialId);

            if (!credential) {
                throw new Error('Credencial no encontrada');
            }

            // If userId provided, verify it matches
            if (userId && credential.user_id !== userId) {
                throw new Error('Credencial no pertenece al usuario');
            }

            // Get stored challenge
            const challengeUserId = userId || 'anonymous';
            const challenge = await this.getChallenge(challengeUserId, 'authentication');
            if (!challenge) {
                throw new Error('Challenge no encontrado o expirado');
            }

            // Verify the authentication response
            const verification = await verifyAuthenticationResponse({
                response,
                expectedChallenge: challenge,
                expectedOrigin: this.origin,
                expectedRPID: this.rpID,
                authenticator: {
                    credentialID: Buffer.from(credential.credential_id, 'base64'),
                    credentialPublicKey: Buffer.from(credential.credential_public_key, 'base64'),
                    counter: parseInt(credential.counter)
                },
                requireUserVerification: false
            });

            if (!verification.verified) {
                throw new Error('Autenticación fallida');
            }

            // Update counter
            await this.updateCounter(credential.id, verification.authenticationInfo.newCounter);

            // Update last used
            await this.updateLastUsed(credential.id);

            // Clear challenge
            await this.clearChallenge(challengeUserId, 'authentication');

            devLogger.log('WEBAUTHN', `Autenticación exitosa para userId=${credential.user_id}`);

            return {
                success: true,
                verified: true,
                userId: credential.user_id,
                credentialId: credential.credential_id
            };

        } catch (error) {
            devLogger.error('WEBAUTHN', 'Error verificando autenticación:', error);
            throw error;
        }
    }

    /**
     * ALMACENAR CHALLENGE EN BD
     */
    async storeChallenge(userId, challenge, type) {
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

        await pool.query(`
            INSERT INTO webauthn_challenges (user_id, challenge, type, expires_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, type) DO UPDATE
            SET challenge = $2, expires_at = $4, created_at = NOW()
        `, [userId.toString(), challenge, type, expiresAt]);
    }

    /**
     * OBTENER CHALLENGE DE BD
     */
    async getChallenge(userId, type) {
        const result = await pool.query(`
            SELECT challenge FROM webauthn_challenges
            WHERE user_id = $1 AND type = $2 AND expires_at > NOW()
        `, [userId.toString(), type]);

        return result.rows[0]?.challenge || null;
    }

    /**
     * LIMPIAR CHALLENGE
     */
    async clearChallenge(userId, type) {
        await pool.query(`
            DELETE FROM webauthn_challenges
            WHERE user_id = $1 AND type = $2
        `, [userId.toString(), type]);
    }

    /**
     * ALMACENAR CREDENCIAL EN BD
     */
    async storeCredential(data) {
        const { userId, credentialId, credentialPublicKey, counter, transports, deviceName } = data;

        const result = await pool.query(`
            INSERT INTO webauthn_credentials
            (user_id, credential_id, credential_public_key, counter, transports, device_name, created_at, last_used_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            RETURNING id
        `, [userId, credentialId, credentialPublicKey, counter, JSON.stringify(transports), deviceName]);

        return result.rows[0].id;
    }

    /**
     * OBTENER CREDENCIALES DEL USUARIO
     */
    async getUserCredentials(userId) {
        const result = await pool.query(`
            SELECT * FROM webauthn_credentials
            WHERE user_id = $1
            ORDER BY created_at DESC
        `, [userId]);

        return result.rows;
    }

    /**
     * OBTENER CREDENCIAL POR ID
     */
    async getCredential(credentialId) {
        const result = await pool.query(`
            SELECT * FROM webauthn_credentials
            WHERE credential_id = $1
        `, [credentialId]);

        return result.rows[0] || null;
    }

    /**
     * ACTUALIZAR COUNTER (para prevenir replay attacks)
     */
    async updateCounter(id, newCounter) {
        await pool.query(`
            UPDATE webauthn_credentials
            SET counter = $1
            WHERE id = $2
        `, [newCounter, id]);
    }

    /**
     * ACTUALIZAR LAST USED
     */
    async updateLastUsed(id) {
        await pool.query(`
            UPDATE webauthn_credentials
            SET last_used_at = NOW()
            WHERE id = $2
        `, [id]);
    }

    /**
     * ELIMINAR CREDENCIAL
     */
    async deleteCredential(id, userId) {
        const result = await pool.query(`
            DELETE FROM webauthn_credentials
            WHERE id = $1 AND user_id = $2
            RETURNING id
        `, [id, userId]);

        return result.rowCount > 0;
    }

    /**
     * VERIFICAR SI USUARIO TIENE CREDENCIALES
     */
    async hasCredentials(userId) {
        const result = await pool.query(`
            SELECT COUNT(*) as count FROM webauthn_credentials
            WHERE user_id = $1
        `, [userId]);

        return parseInt(result.rows[0].count) > 0;
    }
}

module.exports = new WebAuthnService();
