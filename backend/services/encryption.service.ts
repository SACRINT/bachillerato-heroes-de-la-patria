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

import crypto from 'crypto';
const devLogger = require('../utils/devLogger');

// ============================================
// INTERFACES
// ============================================

export type HashAlgorithm = 'sha256' | 'sha512' | 'md5';

export interface EncryptedData {
    iv: string;
    tag: string;
    data: string;
}

// ============================================
// ENCRYPTION SERVICE CLASS
// ============================================

class EncryptionService {
    private algorithm: string;
    private keyLength: number;
    private ivLength: number;
    private tagLength: number;
    private encryptionKey: Buffer;

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

    generateKey(): Buffer {
        return crypto.randomBytes(this.keyLength);
    }

    encrypt(plaintext: string): string | null {
        if (!plaintext) return null;

        const iv = crypto.randomBytes(this.ivLength);
        const cipher = crypto.createCipheriv(this.algorithm as any, this.encryptionKey, iv) as crypto.CipherGCM;

        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const tag = cipher.getAuthTag();

        // Format: iv:tag:encrypted
        return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    }

    decrypt(ciphertext: string): string | null {
        if (!ciphertext) return null;

        try {
            const parts = ciphertext.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid ciphertext format');
            }

            const iv = Buffer.from(parts[0], 'hex');
            const tag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];

            const decipher = crypto.createDecipheriv(this.algorithm as any, this.encryptionKey, iv) as crypto.DecipherGCM;
            decipher.setAuthTag(tag);

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;

        } catch (error: any) {
            devLogger.error('[Encryption] Decrypt error:', error.message);
            return null;
        }
    }

    // Hash para passwords (bcrypt-like sin dependencia)
    async hashPassword(password: string): Promise<string> {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.scryptSync(password, salt, 64).toString('hex');
        return `${salt}:${hash}`;
    }

    async verifyPassword(password: string, storedHash: string): Promise<boolean> {
        const [salt, hash] = storedHash.split(':');
        const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
        return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(testHash));
    }

    // Hash simple (SHA-256)
    hash(data: string, algorithm: HashAlgorithm = 'sha256'): string {
        return crypto.createHash(algorithm).update(data).digest('hex');
    }

    // HMAC
    hmac(data: string, key: Buffer = this.encryptionKey): string {
        return crypto.createHmac('sha256', key).update(data).digest('hex');
    }

    // Random string
    randomString(length: number = 32): string {
        return crypto.randomBytes(length).toString('hex');
    }

    // Random number
    randomInt(min: number, max: number): number {
        return crypto.randomInt(min, max);
    }

    // UUID v4
    uuid(): string {
        return crypto.randomUUID();
    }

    // Encrypt object
    encryptObject(obj: Record<string, any>): string | null {
        return this.encrypt(JSON.stringify(obj));
    }

    decryptObject(ciphertext: string): Record<string, any> | null {
        const decrypted = this.decrypt(ciphertext);
        return decrypted ? JSON.parse(decrypted) : null;
    }

    // Field-level encryption helper
    encryptFields<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): T {
        const result = { ...obj };
        for (const field of fields) {
            if (result[field]) {
                (result as any)[field] = this.encrypt(String(result[field]));
            }
        }
        return result;
    }

    decryptFields<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): T {
        const result = { ...obj };
        for (const field of fields) {
            if (result[field]) {
                (result as any)[field] = this.decrypt(String(result[field]));
            }
        }
        return result;
    }

    // Mask sensitive data
    mask(value: string, visibleChars: number = 4): string {
        if (!value || value.length <= visibleChars) return '****';

        const visible = value.slice(-visibleChars);
        const masked = '*'.repeat(value.length - visibleChars);

        return masked + visible;
    }

    // Mask email
    maskEmail(email: string): string {
        if (!email) return '****@****.***';

        const [local, domain] = email.split('@');
        const maskedLocal = local.length > 2
            ? local[0] + '***' + local.slice(-1)
            : '***';

        return `${maskedLocal}@${domain}`;
    }
}

// ============================================
// EXPORTS
// ============================================

const encryptionService = new EncryptionService();

export { EncryptionService };
export default encryptionService;

module.exports = encryptionService;
module.exports.EncryptionService = EncryptionService;
