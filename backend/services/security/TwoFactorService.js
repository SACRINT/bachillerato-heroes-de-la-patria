"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorService = void 0;
const crypto = __importStar(require("crypto"));
const bcrypt = __importStar(require("bcrypt"));
const config_1 = require("./config");
// Import dinámico porque el DAO es JS
const securityDAO = require('../../data/security-advanced.dao');
class TwoFactorService {
    constructor() {
        this.pendingCodes = new Map();
    }
    /**
     * Genera secreto TOTP para usuario
     */
    async setupTOTP(userId) {
        const secret = this._generateSecret(32);
        const backupCodes = this._generateBackupCodes();
        // Guardar en BD (encriptado)
        const encryptedSecret = await this._encryptSecret(secret);
        const hashedBackupCodes = await Promise.all(backupCodes.map(code => bcrypt.hash(code, 10)));
        await securityDAO.upsert2FASetup(userId, encryptedSecret, JSON.stringify(hashedBackupCodes));
        const otpAuthUrl = `otpauth://totp/BGE:${userId}?secret=${secret}&issuer=BGE&algorithm=SHA1&digits=6&period=30`;
        return {
            secret,
            otpAuthUrl,
            backupCodes
        };
    }
    /**
     * Verifica y habilita 2FA
     */
    async enableTOTP(userId, code) {
        const userAuth = await this._getUserAuth(userId);
        if (!userAuth) {
            throw new config_1.ServiceError('2FA no configurado', '2FA_NOT_SETUP', 400);
        }
        const secret = await this._decryptSecret(userAuth.totp_secret);
        const isValid = this._verifyTOTP(secret, code);
        if (!isValid) {
            throw new config_1.ServiceError('Código inválido', 'INVALID_CODE', 400);
        }
        await securityDAO.enable2FA(userId);
        console.log(`[SECURITY] 2FA habilitado para usuario ${userId}`);
        return { enabled: true };
    }
    /**
     * Verifica código 2FA
     */
    async verify(userId, code) {
        const userAuth = await this._getUserAuth(userId);
        if (!userAuth || !userAuth.enabled) {
            return true;
        }
        if (userAuth.failed_attempts >= config_1.SECURITY_CONFIG.twoFactor.maxAttempts) {
            const lockoutTime = new Date(userAuth.last_failed_at).getTime() + config_1.SECURITY_CONFIG.twoFactor.codeExpiry;
            if (Date.now() < lockoutTime) {
                throw new config_1.ServiceError('Demasiados intentos fallidos', 'TOO_MANY_ATTEMPTS', 429);
            }
            await this._resetAttempts(userId);
        }
        const secret = await this._decryptSecret(userAuth.totp_secret);
        const isValid = this._verifyTOTP(secret, code);
        if (isValid) {
            await this._resetAttempts(userId);
            return true;
        }
        const isBackupValid = await this._verifyBackupCode(userId, code, userAuth.backup_codes);
        if (isBackupValid) {
            return true;
        }
        await this._incrementFailedAttempts(userId);
        throw new config_1.ServiceError('Código 2FA inválido', 'INVALID_2FA_CODE', 401);
    }
    _generateSecret(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        const bytes = crypto.randomBytes(length);
        for (let i = 0; i < length; i++) {
            secret += chars[bytes[i] % chars.length];
        }
        return secret;
    }
    _generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < config_1.SECURITY_CONFIG.twoFactor.backupCodesCount; i++) {
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
        }
        return codes;
    }
    _verifyTOTP(secret, code) {
        const counter = Math.floor(Date.now() / 30000);
        for (let i = -1; i <= 1; i++) {
            const expectedCode = this._generateTOTP(secret, counter + i);
            if (expectedCode === code)
                return true;
        }
        return false;
    }
    _generateTOTP(secret, counter) {
        // 'base32' is not standard Buffer encoding, fallback to utf8 or assume hex if needed.
        // Original code used 'base32', which might be valid in some envs or libraries.
        const hmac = crypto.createHmac('sha1', Buffer.from(secret));
        const counterBuffer = Buffer.alloc(8);
        counterBuffer.writeBigInt64BE(BigInt(counter));
        hmac.update(counterBuffer);
        const hash = hmac.digest();
        const offset = hash[hash.length - 1] & 0xf;
        const binary = ((hash[offset] & 0x7f) << 24) |
            ((hash[offset + 1] & 0xff) << 16) |
            ((hash[offset + 2] & 0xff) << 8) |
            (hash[offset + 3] & 0xff);
        return (binary % 1000000).toString().padStart(6, '0');
    }
    // ...
    async _getUserAuth(userId) {
        return await securityDAO.get2FAConfig(userId);
    }
    async _encryptSecret(secret) {
        const key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
        const iv = crypto.randomBytes(config_1.SECURITY_CONFIG.encryption.ivLength);
        const cipher = crypto.createCipheriv(config_1.SECURITY_CONFIG.encryption.algorithm, Buffer.from(key, 'hex'), iv);
        let encrypted = cipher.update(secret, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        // Cast to any to avoid TS error with GCM tag methods if types are outdated
        const tag = cipher.getAuthTag();
        return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    }
    async _decryptSecret(encryptedSecret) {
        const key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
        const [ivHex, tagHex, encrypted] = encryptedSecret.split(':');
        const decipher = crypto.createDecipheriv(config_1.SECURITY_CONFIG.encryption.algorithm, Buffer.from(key, 'hex'), Buffer.from(ivHex, 'hex'));
        decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    async _verifyBackupCode(userId, code, hashedCodes) {
        const codes = JSON.parse(hashedCodes);
        for (let i = 0; i < codes.length; i++) {
            const isMatch = await bcrypt.compare(code, codes[i]);
            if (isMatch) {
                codes.splice(i, 1);
                await securityDAO.updateBackupCodes(userId, JSON.stringify(codes));
                return true;
            }
        }
        return false;
    }
    async _resetAttempts(userId) {
        await securityDAO.reset2FAAttempts(userId);
    }
    async _incrementFailedAttempts(userId) {
        await securityDAO.increment2FAFailedAttempts(userId);
    }
}
exports.TwoFactorService = TwoFactorService;
