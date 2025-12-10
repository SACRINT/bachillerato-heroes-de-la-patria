"use strict";
/**
 * 🔐 WEBAUTHN SERVICE - TypeScript Version
 * Autenticación biométrica FIDO2/WebAuthn
 * Refactorizado: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebAuthnService = void 0;
const { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } = require('@simplewebauthn/server');
const WebAuthnDAO = require('../data/webauthn.dao');
const devLogger = require('../utils/devLogger');
// ============================================
// WEBAUTHN SERVICE CLASS
// ============================================
class WebAuthnService {
    constructor() {
        this.rpName = 'BGE Héroes de la Patria';
        this.rpID = this.getRPID();
        this.origin = this.getOrigin();
        devLogger.log('WEBAUTHN', `Inicializado - RP ID: ${this.rpID}, Origin: ${this.origin}`);
    }
    getRPID() {
        const hostname = process.env.WEBAUTHN_RP_ID || process.env.DOMAIN || 'localhost';
        return hostname.replace(/^https?:\/\//, '').split(':')[0];
    }
    getOrigin() {
        return process.env.NODE_ENV === 'production'
            ? (process.env.WEBAUTHN_ORIGIN || `https://${this.getRPID()}`)
            : (process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000');
    }
    async generateRegistrationOptions(userId, userName, userEmail) {
        try {
            devLogger.log('WEBAUTHN', `Generando opciones de registro para userId=${userId}`);
            const existingCredentials = await WebAuthnDAO.getUserCredentials(userId);
            const excludeCredentials = existingCredentials.map((cred) => ({
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
        }
        catch (error) {
            devLogger.error('WEBAUTHN', 'Error generando opciones:', error);
            throw error;
        }
    }
    async verifyRegistrationResponse(userId, response, deviceName = 'Dispositivo Biométrico') {
        try {
            devLogger.log('WEBAUTHN', `Verificando respuesta de registro para userId=${userId}`);
            const challenge = await WebAuthnDAO.getChallenge(userId, 'registration');
            if (!challenge)
                throw new Error('Challenge no encontrado o expirado');
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
        }
        catch (error) {
            devLogger.error('WEBAUTHN', 'Error verificando registro:', error);
            throw error;
        }
    }
    async generateAuthenticationOptions(userId = null) {
        try {
            devLogger.log('WEBAUTHN', `Generando opciones de autenticación${userId ? ` para userId=${userId}` : ' (discoverable credential)'}`);
            let allowCredentials = [];
            if (userId) {
                const credentials = await WebAuthnDAO.getUserCredentials(userId);
                allowCredentials = credentials.map((cred) => ({
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
        }
        catch (error) {
            devLogger.error('WEBAUTHN', 'Error generando opciones de autenticación:', error);
            throw error;
        }
    }
    async verifyAuthenticationResponse(response, userId = null) {
        try {
            devLogger.log('WEBAUTHN', 'Verificando respuesta de autenticación');
            const credentialId = Buffer.from(response.id, 'base64url').toString('base64');
            const credential = await WebAuthnDAO.getCredentialByCredentialId(credentialId);
            if (!credential)
                throw new Error('Credencial no encontrada');
            if (userId && credential.user_id !== userId) {
                throw new Error('Credencial no pertenece al usuario');
            }
            const challengeUserId = userId || 'anonymous';
            const challenge = await WebAuthnDAO.getChallenge(challengeUserId, 'authentication');
            if (!challenge)
                throw new Error('Challenge no encontrado o expirado');
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
            if (!verification.verified)
                throw new Error('Autenticación fallida');
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
        }
        catch (error) {
            devLogger.error('WEBAUTHN', 'Error verificando autenticación:', error);
            throw error;
        }
    }
    // Helper methods
    async storeChallenge(userId, challenge, type) {
        await WebAuthnDAO.storeChallenge(userId, challenge, type);
    }
    async getChallenge(userId, type) {
        return WebAuthnDAO.getChallenge(userId, type);
    }
    async clearChallenge(userId, type) {
        await WebAuthnDAO.clearChallenge(userId, type);
    }
    async storeCredential(data) {
        return WebAuthnDAO.storeCredential(data);
    }
    async getUserCredentials(userId) {
        return WebAuthnDAO.getUserCredentials(userId);
    }
    async getCredential(credentialId) {
        return WebAuthnDAO.getCredentialByCredentialId(credentialId);
    }
    async updateCounter(id, newCounter) {
        await WebAuthnDAO.updateCounter(id, newCounter);
    }
    async updateLastUsed(id) {
        await WebAuthnDAO.updateLastUsed(id);
    }
    async deleteCredential(id, userId) {
        return WebAuthnDAO.deleteCredential(id, userId);
    }
    async hasCredentials(userId) {
        return WebAuthnDAO.hasCredentials(userId);
    }
}
exports.WebAuthnService = WebAuthnService;
// ============================================
// EXPORTS
// ============================================
const webAuthnService = new WebAuthnService();
exports.default = webAuthnService;
module.exports = webAuthnService;
module.exports.WebAuthnService = WebAuthnService;
//# sourceMappingURL=webauthn.service.js.map