/**
 * 🔐 WEBAUTHN SERVICE - TypeScript Version
 * Autenticación biométrica FIDO2/WebAuthn
 * Refactorizado: 07 Diciembre 2025
 */

const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse
} = require('@simplewebauthn/server');
const WebAuthnDAO = require('../data/webauthn.dao');
const devLogger = require('../utils/devLogger');

// ============================================
// INTERFACES
// ============================================

export interface WebAuthnCredential {
    id: number;
    user_id: number;
    credential_id: string;
    public_key?: string;
    credential_public_key?: string;
    counter: number;
    transports?: string[];
    device_name?: string;
    created_at: Date;
    last_used?: Date;
}

export interface RegistrationOptionsResult {
    success: boolean;
    options: any;
}

export interface VerifyRegistrationResult {
    success: boolean;
    verified: boolean;
    credentialId: string;
}

export interface AuthenticationOptionsResult {
    success: boolean;
    options: any;
}

export interface VerifyAuthenticationResult {
    success: boolean;
    verified: boolean;
    userId: number;
    credentialId: string;
}

export interface CredentialData {
    userId: number;
    credentialId: string;
    publicKey: string;
    counter: number;
    transports: string[];
    deviceName: string;
}

// ============================================
// WEBAUTHN SERVICE CLASS
// ============================================

class WebAuthnService {
    private rpName: string;
    private rpID: string;
    private origin: string;

    constructor() {
        this.rpName = 'BGE Héroes de la Patria';
        this.rpID = this.getRPID();
        this.origin = this.getOrigin();
        devLogger.log('WEBAUTHN', `Inicializado - RP ID: ${this.rpID}, Origin: ${this.origin}`);
    }

    private getRPID(): string {
        const hostname = process.env.WEBAUTHN_RP_ID || process.env.DOMAIN || 'localhost';
        return hostname.replace(/^https?:\/\//, '').split(':')[0];
    }

    private getOrigin(): string {
        return process.env.NODE_ENV === 'production'
            ? (process.env.WEBAUTHN_ORIGIN || `https://${this.getRPID()}`)
            : (process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000');
    }

    async generateRegistrationOptions(
        userId: number,
        userName: string,
        userEmail: string
    ): Promise<RegistrationOptionsResult> {
        try {
            devLogger.log('WEBAUTHN', `Generando opciones de registro para userId=${userId}`);

            const existingCredentials = await WebAuthnDAO.getUserCredentials(userId);
            const excludeCredentials = existingCredentials.map((cred: WebAuthnCredential) => ({
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
                timeout: 300000,
                authenticatorSelection: {
                    authenticatorAttachment: 'platform',
                    requireResidentKey: false,
                    userVerification: 'preferred'
                },
                excludeCredentials,
                supportedAlgorithmIDs: [-7, -257]
            });

            await WebAuthnDAO.storeChallenge(userId, options.challenge, 'registration');
            return { success: true, options };

        } catch (error: any) {
            devLogger.error('WEBAUTHN', 'Error generando opciones:', error);
            throw error;
        }
    }

    async verifyRegistrationResponse(
        userId: number,
        response: any,
        deviceName: string = 'Dispositivo Biométrico'
    ): Promise<VerifyRegistrationResult> {
        try {
            devLogger.log('WEBAUTHN', `Verificando respuesta de registro para userId=${userId}`);

            const challenge = await WebAuthnDAO.getChallenge(userId, 'registration');
            if (!challenge) throw new Error('Challenge no encontrado o expirado');

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

            await WebAuthnDAO.storeCredential({
                userId,
                credentialId: Buffer.from(credentialID).toString('base64'),
                publicKey: Buffer.from(credentialPublicKey).toString('base64'),
                counter,
                transports: response.response.transports || ['internal'],
                deviceName
            });

            await WebAuthnDAO.clearChallenge(userId, 'registration');
            devLogger.log('WEBAUTHN', `Credencial registrada exitosamente para userId=${userId}`);

            return {
                success: true,
                verified: true,
                credentialId: Buffer.from(credentialID).toString('base64')
            };

        } catch (error: any) {
            devLogger.error('WEBAUTHN', 'Error verificando registro:', error);
            throw error;
        }
    }

    async generateAuthenticationOptions(userId: number | null = null): Promise<AuthenticationOptionsResult> {
        try {
            devLogger.log('WEBAUTHN', `Generando opciones de autenticación${userId ? ` para userId=${userId}` : ' (discoverable credential)'}`);

            let allowCredentials: any[] = [];

            if (userId) {
                const credentials = await WebAuthnDAO.getUserCredentials(userId);
                allowCredentials = credentials.map((cred: WebAuthnCredential) => ({
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
                allowCredentials: userId ? allowCredentials : [],
                userVerification: 'preferred'
            });

            await WebAuthnDAO.storeChallenge(userId || 'anonymous', options.challenge, 'authentication');
            return { success: true, options };

        } catch (error: any) {
            devLogger.error('WEBAUTHN', 'Error generando opciones de autenticación:', error);
            throw error;
        }
    }

    async verifyAuthenticationResponse(
        response: any,
        userId: number | null = null
    ): Promise<VerifyAuthenticationResult> {
        try {
            devLogger.log('WEBAUTHN', 'Verificando respuesta de autenticación');

            const credentialId = Buffer.from(response.id, 'base64url').toString('base64');
            const credential = await WebAuthnDAO.getCredentialByCredentialId(credentialId);

            if (!credential) throw new Error('Credencial no encontrada');
            if (userId && credential.user_id !== userId) {
                throw new Error('Credencial no pertenece al usuario');
            }

            const challengeUserId = userId || 'anonymous';
            const challenge = await WebAuthnDAO.getChallenge(challengeUserId, 'authentication');
            if (!challenge) throw new Error('Challenge no encontrado o expirado');

            const verification = await verifyAuthenticationResponse({
                response,
                expectedChallenge: challenge,
                expectedOrigin: this.origin,
                expectedRPID: this.rpID,
                authenticator: {
                    credentialID: Buffer.from(credential.credential_id, 'base64'),
                    credentialPublicKey: Buffer.from(credential.public_key || credential.credential_public_key, 'base64'),
                    counter: parseInt(credential.counter)
                },
                requireUserVerification: false
            });

            if (!verification.verified) throw new Error('Autenticación fallida');

            await WebAuthnDAO.updateCounter(credential.id, verification.authenticationInfo.newCounter);
            await WebAuthnDAO.updateLastUsed(credential.id);
            await WebAuthnDAO.clearChallenge(challengeUserId, 'authentication');

            devLogger.log('WEBAUTHN', `Autenticación exitosa para userId=${credential.user_id}`);

            return {
                success: true,
                verified: true,
                userId: credential.user_id,
                credentialId: credential.credential_id
            };

        } catch (error: any) {
            devLogger.error('WEBAUTHN', 'Error verificando autenticación:', error);
            throw error;
        }
    }

    // Helper methods
    async storeChallenge(userId: string | number, challenge: string, type: string): Promise<void> {
        await WebAuthnDAO.storeChallenge(userId, challenge, type);
    }

    async getChallenge(userId: string | number, type: string): Promise<string | null> {
        return WebAuthnDAO.getChallenge(userId, type);
    }

    async clearChallenge(userId: string | number, type: string): Promise<void> {
        await WebAuthnDAO.clearChallenge(userId, type);
    }

    async storeCredential(data: CredentialData): Promise<any> {
        return WebAuthnDAO.storeCredential(data);
    }

    async getUserCredentials(userId: number): Promise<WebAuthnCredential[]> {
        return WebAuthnDAO.getUserCredentials(userId);
    }

    async getCredential(credentialId: string): Promise<WebAuthnCredential | null> {
        return WebAuthnDAO.getCredentialByCredentialId(credentialId);
    }

    async updateCounter(id: number, newCounter: number): Promise<void> {
        await WebAuthnDAO.updateCounter(id, newCounter);
    }

    async updateLastUsed(id: number): Promise<void> {
        await WebAuthnDAO.updateLastUsed(id);
    }

    async deleteCredential(id: number, userId: number): Promise<boolean> {
        return WebAuthnDAO.deleteCredential(id, userId);
    }

    async hasCredentials(userId: number): Promise<boolean> {
        return WebAuthnDAO.hasCredentials(userId);
    }
}

// ============================================
// EXPORTS
// ============================================

const webAuthnService = new WebAuthnService();

export { WebAuthnService };
export default webAuthnService;

module.exports = webAuthnService;
module.exports.WebAuthnService = WebAuthnService;
