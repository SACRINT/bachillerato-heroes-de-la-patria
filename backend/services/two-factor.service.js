"use strict";
/**
 * 🔐 TWO FACTOR AUTH SERVICE - TypeScript Version
 * Autenticación de dos factores con TOTP
 * Refactorizado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const TwoFactorDAO = require('../data/two-factor.dao');
// ============================================
// TWO FACTOR SERVICE CLASS
// ============================================
class TwoFactorService {
    constructor() {
        this.issuer = 'BGE Heroes de la Patria';
        this.algorithm = 'SHA1';
        this.digits = 6;
        this.period = 30;
    }
    async enable(userId) {
        const secret = this.generateSecret();
        const backupCodes = this.generateBackupCodes();
        await TwoFactorDAO.save(userId, secret, backupCodes);
        const email = await TwoFactorDAO.getUserEmail(userId);
        return {
            success: true,
            secret,
            qrUri: this.generateQRUri(email, secret),
            backupCodes
        };
    }
    async verify(userId, token) {
        const record = await TwoFactorDAO.getSecretAndStatus(userId);
        if (!record)
            return { success: false, message: '2FA no configurado' };
        const { secret, enabled } = record;
        if (this.verifyToken(token, secret)) {
            if (!enabled)
                await TwoFactorDAO.enable(userId);
            return { success: true };
        }
        return { success: false, message: 'Código inválido' };
    }
    async verifyBackupCode(userId, code) {
        const record = await TwoFactorDAO.getBackupCodes(userId);
        if (!record)
            return { success: false };
        let backupCodes = JSON.parse(record.backup_codes || '[]');
        const index = backupCodes.indexOf(code);
        if (index === -1)
            return { success: false, message: 'Código de respaldo inválido' };
        backupCodes.splice(index, 1);
        await TwoFactorDAO.updateBackupCodes(userId, backupCodes);
        return { success: true, remainingCodes: backupCodes.length };
    }
    async disable(userId) {
        await TwoFactorDAO.disable(userId);
        return { success: true };
    }
    async isEnabled(userId) {
        return TwoFactorDAO.isEnabled(userId);
    }
    generateSecret() {
        return crypto_1.default.randomBytes(20).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
    }
    generateBackupCodes(count = 10) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            codes.push(crypto_1.default.randomBytes(4).toString('hex').toUpperCase());
        }
        return codes;
    }
    generateQRUri(email, secret) {
        const params = new URLSearchParams({
            secret,
            issuer: this.issuer,
            algorithm: this.algorithm,
            digits: this.digits.toString(),
            period: this.period.toString()
        });
        return `otpauth://totp/${encodeURIComponent(`${this.issuer}:${email}`)}?${params}`;
    }
    verifyToken(token, secret) {
        return token === this.generateToken(secret, 0) ||
            token === this.generateToken(secret, -1) ||
            token === this.generateToken(secret, 1);
    }
    generateToken(secret, offset = 0) {
        const counter = Math.floor(Date.now() / 1000 / this.period) + offset;
        const counterBuffer = Buffer.alloc(8);
        counterBuffer.writeBigUInt64BE(BigInt(counter));
        const hmac = crypto_1.default.createHmac('sha1', Buffer.from(secret, 'base64'));
        hmac.update(counterBuffer);
        const hash = hmac.digest();
        const offsetByte = hash[hash.length - 1] & 0x0f;
        const code = (((hash[offsetByte] & 0x7f) << 24) |
            ((hash[offsetByte + 1] & 0xff) << 16) |
            ((hash[offsetByte + 2] & 0xff) << 8) |
            (hash[offsetByte + 3] & 0xff)) % Math.pow(10, this.digits);
        return code.toString().padStart(this.digits, '0');
    }
    async regenerateBackupCodes(userId) {
        const backupCodes = this.generateBackupCodes();
        await TwoFactorDAO.updateBackupCodes(userId, backupCodes);
        return { success: true, backupCodes };
    }
}
exports.TwoFactorService = TwoFactorService;
// ============================================
// EXPORTS
// ============================================
const twoFactorService = new TwoFactorService();
exports.default = twoFactorService;
module.exports = twoFactorService;
module.exports.TwoFactorService = TwoFactorService;
//# sourceMappingURL=two-factor.service.js.map