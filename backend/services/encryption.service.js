"use strict";
/**
 * 🔒 ENCRYPTION SERVICE - TypeScript Version
 * Servicio de encriptación de datos sensibles
 *
 * Features:
 * - AES-256-GCM encryption
 * - Key rotation
 * - Field-level encryption
 * - Hash functions
 * - Secure random
 *
 * Refactorizado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const devLogger = require('../utils/devLogger');
// ============================================
// ENCRYPTION SERVICE CLASS
// ============================================
class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32;
        this.ivLength = 16;
        this.tagLength = 16;
        // Usar key de ambiente o generar una
        this.encryptionKey = process.env.ENCRYPTION_KEY
            ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
            : this.generateKey();
    }
    generateKey() {
        return crypto_1.default.randomBytes(this.keyLength);
    }
    encrypt(plaintext) {
        if (!plaintext)
            return null;
        const iv = crypto_1.default.randomBytes(this.ivLength);
        const cipher = crypto_1.default.createCipheriv(this.algorithm, this.encryptionKey, iv);
        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const tag = cipher.getAuthTag();
        // Format: iv:tag:encrypted
        return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    }
    decrypt(ciphertext) {
        if (!ciphertext)
            return null;
        try {
            const parts = ciphertext.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid ciphertext format');
            }
            const iv = Buffer.from(parts[0], 'hex');
            const tag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];
            const decipher = crypto_1.default.createDecipheriv(this.algorithm, this.encryptionKey, iv);
            decipher.setAuthTag(tag);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            devLogger.error('[Encryption] Decrypt error:', error.message);
            return null;
        }
    }
    // Hash para passwords (bcrypt-like sin dependencia)
    async hashPassword(password) {
        const salt = crypto_1.default.randomBytes(16).toString('hex');
        const hash = crypto_1.default.scryptSync(password, salt, 64).toString('hex');
        return `${salt}:${hash}`;
    }
    async verifyPassword(password, storedHash) {
        const [salt, hash] = storedHash.split(':');
        const testHash = crypto_1.default.scryptSync(password, salt, 64).toString('hex');
        return crypto_1.default.timingSafeEqual(Buffer.from(hash), Buffer.from(testHash));
    }
    // Hash simple (SHA-256)
    hash(data, algorithm = 'sha256') {
        return crypto_1.default.createHash(algorithm).update(data).digest('hex');
    }
    // HMAC
    hmac(data, key = this.encryptionKey) {
        return crypto_1.default.createHmac('sha256', key).update(data).digest('hex');
    }
    // Random string
    randomString(length = 32) {
        return crypto_1.default.randomBytes(length).toString('hex');
    }
    // Random number
    randomInt(min, max) {
        return crypto_1.default.randomInt(min, max);
    }
    // UUID v4
    uuid() {
        return crypto_1.default.randomUUID();
    }
    // Encrypt object
    encryptObject(obj) {
        return this.encrypt(JSON.stringify(obj));
    }
    decryptObject(ciphertext) {
        const decrypted = this.decrypt(ciphertext);
        return decrypted ? JSON.parse(decrypted) : null;
    }
    // Field-level encryption helper
    encryptFields(obj, fields) {
        const result = { ...obj };
        for (const field of fields) {
            if (result[field]) {
                result[field] = this.encrypt(String(result[field]));
            }
        }
        return result;
    }
    decryptFields(obj, fields) {
        const result = { ...obj };
        for (const field of fields) {
            if (result[field]) {
                result[field] = this.decrypt(String(result[field]));
            }
        }
        return result;
    }
    // Mask sensitive data
    mask(value, visibleChars = 4) {
        if (!value || value.length <= visibleChars)
            return '****';
        const visible = value.slice(-visibleChars);
        const masked = '*'.repeat(value.length - visibleChars);
        return masked + visible;
    }
    // Mask email
    maskEmail(email) {
        if (!email)
            return '****@****.***';
        const [local, domain] = email.split('@');
        const maskedLocal = local.length > 2
            ? local[0] + '***' + local.slice(-1)
            : '***';
        return `${maskedLocal}@${domain}`;
    }
}
exports.EncryptionService = EncryptionService;
// ============================================
// EXPORTS
// ============================================
const encryptionService = new EncryptionService();
exports.default = encryptionService;
module.exports = encryptionService;
module.exports.EncryptionService = EncryptionService;
//# sourceMappingURL=encryption.service.js.map