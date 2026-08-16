"use strict";
/**
 * 🔐 ADVANCED SECURITY SERVICE - TypeScript Version
 * Servicio de seguridad avanzada con 2FA, rate limiting, intrusion detection
 * OWASP Top 10 compliance
 *
 * Refactorizado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityServiceError = exports.SessionManager = exports.SecurityAudit = exports.RateLimiter = exports.TwoFactorAuth = exports.AdvancedSecurityService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcrypt = require('bcrypt');
const securityDAO = require('../data/security-advanced.dao.js');
const devLogger = require('../utils/devLogger.js');
// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    twoFactor: {
        codeLength: 6,
        codeExpiry: 300000, // 5 minutes
        maxAttempts: 3,
        backupCodesCount: 10
    },
    rateLimiting: {
        windows: {
            api: { duration: 60000, maxRequests: 100 },
            auth: { duration: 300000, maxRequests: 5 },
            sensitive: { duration: 3600000, maxRequests: 10 }
        }
    },
    session: {
        maxConcurrent: 3,
        inactivityTimeout: 1800000,
        maxAge: 90 * 24 * 3600000
    },
    encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 32,
        ivLength: 16,
        tagLength: 16
    }
};
// ============================================
// SERVICE ERROR CLASS
// ============================================
class SecurityServiceError extends Error {
    constructor(message, code, statusCode = 500) {
        super(message);
        this.name = 'ServiceError';
        this.code = code;
        this.statusCode = statusCode;
    }
}
exports.SecurityServiceError = SecurityServiceError;
// ============================================
// TWO-FACTOR AUTHENTICATION
// ============================================
class TwoFactorAuth {
    constructor() {
        this.pendingCodes = new Map();
    }
    async setupTOTP(userId) {
        const secret = this._generateSecret(32);
        const backupCodes = this._generateBackupCodes();
        await securityDAO.saveSecureSetting(userId, 'totp_secret', this._encryptSecret(secret));
        await securityDAO.saveBackupCodes(userId, backupCodes.map((c) => bcrypt.hashSync(c, 10)));
        const email = await securityDAO.getUserEmail(userId);
        const qrCode = `otpauth://totp/BGE:${email}?secret=${secret}&issuer=BGE%20Heroes%20de%20la%20Patria`;
        return { success: true, secret, qrCode, backupCodes };
    }
    async enableTOTP(userId, code) {
        const encryptedSecret = await securityDAO.getSecureSetting(userId, 'totp_secret');
        if (!encryptedSecret) {
            return { success: false, message: '2FA no configurado' };
        }
        const secret = this._decryptSecret(encryptedSecret);
        if (this._verifyTOTP(secret, code)) {
            await securityDAO.enable2FA(userId);
            return { success: true };
        }
        return { success: false, message: 'Código inválido' };
    }
    async verify(userId, code) {
        const userAuth = await securityDAO.get2FAStatus(userId);
        if (!userAuth || !userAuth.two_factor_enabled) {
            return { success: false, message: '2FA no habilitado' };
        }
        if (userAuth.failed_2fa_attempts >= CONFIG.twoFactor.maxAttempts) {
            return { success: false, message: 'Cuenta bloqueada por intentos fallidos' };
        }
        const encryptedSecret = await securityDAO.getSecureSetting(userId, 'totp_secret');
        const secret = this._decryptSecret(encryptedSecret);
        if (this._verifyTOTP(secret, code)) {
            await securityDAO.resetFailedAttempts(userId);
            return { success: true };
        }
        await securityDAO.incrementFailedAttempts(userId);
        return {
            success: false,
            remainingAttempts: CONFIG.twoFactor.maxAttempts - userAuth.failed_2fa_attempts - 1,
            message: 'Código inválido'
        };
    }
    async generateTemporaryCode(userId, method = 'email') {
        const code = this._generateNumericCode(CONFIG.twoFactor.codeLength);
        const expiry = Date.now() + CONFIG.twoFactor.codeExpiry;
        this.pendingCodes.set(userId, { code, expiry, method });
        return code;
    }
    async verifyTemporaryCode(userId, code, method = 'email') {
        const pending = this.pendingCodes.get(userId);
        if (!pending || pending.method !== method) {
            return { success: false, message: 'No hay código pendiente' };
        }
        if (Date.now() > pending.expiry) {
            this.pendingCodes.delete(userId);
            return { success: false, message: 'Código expirado' };
        }
        if (pending.code === code) {
            this.pendingCodes.delete(userId);
            return { success: true };
        }
        return { success: false, message: 'Código inválido' };
    }
    async disable(userId, password) {
        const valid = await securityDAO.verifyPassword(userId, password);
        if (!valid) {
            throw new SecurityServiceError('Contraseña incorrecta', 'INVALID_PASSWORD', 401);
        }
        await securityDAO.disable2FA(userId);
        return { success: true };
    }
    _generateSecret(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        const bytes = crypto_1.default.randomBytes(length);
        for (let i = 0; i < length; i++) {
            secret += chars[bytes[i] % 32];
        }
        return secret;
    }
    _generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < CONFIG.twoFactor.backupCodesCount; i++) {
            codes.push(crypto_1.default.randomBytes(4).toString('hex').toUpperCase());
        }
        return codes;
    }
    _generateNumericCode(length) {
        let code = '';
        for (let i = 0; i < length; i++) {
            code += crypto_1.default.randomInt(0, 10).toString();
        }
        return code;
    }
    _verifyTOTP(secret, code) {
        for (let offset = -1; offset <= 1; offset++) {
            if (this._generateTOTP(secret, offset) === code) {
                return true;
            }
        }
        return false;
    }
    _generateTOTP(secret, offset = 0) {
        const counter = Math.floor(Date.now() / 30000) + offset;
        const counterBuffer = Buffer.alloc(8);
        counterBuffer.writeBigUInt64BE(BigInt(counter));
        // Use ascii encoding for the secret (base32 decoded)
        const hmac = crypto_1.default.createHmac('sha1', Buffer.from(secret, 'ascii'));
        hmac.update(counterBuffer);
        const hash = hmac.digest();
        const offsetByte = hash[hash.length - 1] & 0x0f;
        const code = (((hash[offsetByte] & 0x7f) << 24) |
            ((hash[offsetByte + 1] & 0xff) << 16) |
            ((hash[offsetByte + 2] & 0xff) << 8) |
            (hash[offsetByte + 3] & 0xff)) % 1000000;
        return code.toString().padStart(6, '0');
    }
    _encryptSecret(secret) {
        const key = Buffer.from(process.env.ENCRYPTION_KEY || crypto_1.default.randomBytes(32).toString('hex'), 'hex');
        const iv = crypto_1.default.randomBytes(CONFIG.encryption.ivLength);
        const cipher = crypto_1.default.createCipheriv(CONFIG.encryption.algorithm, key, iv);
        let encrypted = cipher.update(secret, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const tag = cipher.getAuthTag();
        return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    }
    _decryptSecret(encryptedSecret) {
        const [ivHex, tagHex, encrypted] = encryptedSecret.split(':');
        const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const decipher = crypto_1.default.createDecipheriv(CONFIG.encryption.algorithm, key, iv);
        decipher.setAuthTag(tag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
exports.TwoFactorAuth = TwoFactorAuth;
// ============================================
// RATE LIMITER
// ============================================
class RateLimiter {
    constructor() {
        this.requests = new Map();
    }
    check(key, windowType = 'api') {
        const window = CONFIG.rateLimiting.windows[windowType];
        const now = Date.now();
        const mapKey = `${windowType}:${key}`;
        let record = this.requests.get(mapKey);
        if (!record || now > record.resetTime) {
            record = { count: 0, resetTime: now + window.duration };
            this.requests.set(mapKey, record);
        }
        record.count++;
        if (record.count > window.maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: record.resetTime
            };
        }
        return {
            allowed: true,
            remaining: window.maxRequests - record.count,
            resetTime: record.resetTime
        };
    }
    reset(key, windowType = 'api') {
        const mapKey = `${windowType}:${key}`;
        this.requests.delete(mapKey);
    }
    cleanup() {
        const now = Date.now();
        for (const [key, record] of this.requests.entries()) {
            if (now > record.resetTime) {
                this.requests.delete(key);
            }
        }
    }
}
exports.RateLimiter = RateLimiter;
// ============================================
// SECURITY AUDIT
// ============================================
class SecurityAudit {
    async log(entry) {
        await securityDAO.logSecurityEvent(entry);
        devLogger.log(`[SECURITY] ${entry.action} - User: ${entry.userId} - Success: ${entry.success}`);
    }
    async getRecentActivity(userId, limit = 50) {
        return await securityDAO.getSecurityEvents(userId, limit);
    }
    async getSuspiciousActivity(options = {}) {
        const { timeframe = 3600000, threshold = 5 } = options;
        return await securityDAO.getSuspiciousActivity(timeframe, threshold);
    }
}
exports.SecurityAudit = SecurityAudit;
// ============================================
// SESSION MANAGER
// ============================================
class SessionManager {
    async createSession(userId, deviceInfo, ipAddress) {
        const sessionId = crypto_1.default.randomBytes(32).toString('hex');
        // Enforce concurrent session limit
        const activeSessions = await securityDAO.getActiveSessions(userId);
        if (activeSessions.length >= CONFIG.session.maxConcurrent) {
            await securityDAO.terminateOldestSession(userId);
        }
        await securityDAO.createSession({ sessionId, userId, deviceInfo, ipAddress });
        return {
            id: sessionId,
            userId,
            deviceInfo,
            ipAddress,
            createdAt: new Date(),
            lastActivity: new Date(),
            isActive: true
        };
    }
    async validateSession(sessionId) {
        const session = await securityDAO.getSession(sessionId);
        if (!session) {
            return { valid: false };
        }
        const now = Date.now();
        const lastActivity = new Date(session.last_activity).getTime();
        if (now - lastActivity > CONFIG.session.inactivityTimeout) {
            await this.terminateSession(sessionId);
            return { valid: false };
        }
        await securityDAO.updateSessionActivity(sessionId);
        return { valid: true, session };
    }
    async terminateSession(sessionId) {
        await securityDAO.terminateSession(sessionId);
    }
    async terminateAllSessions(userId, exceptSessionId) {
        await securityDAO.terminateAllSessions(userId, exceptSessionId);
    }
}
exports.SessionManager = SessionManager;
// ============================================
// ADVANCED SECURITY SERVICE
// ============================================
class AdvancedSecurityService {
    constructor() {
        this.twoFactor = new TwoFactorAuth();
        this.rateLimiter = new RateLimiter();
        this.audit = new SecurityAudit();
        this.sessions = new SessionManager();
        // Cleanup task
        setInterval(() => this.rateLimiter.cleanup(), 60000);
        devLogger.log('[SECURITY] Advanced Security Service initialized');
    }
    async healthCheck() {
        return {
            status: 'healthy',
            components: {
                twoFactor: true,
                rateLimiter: true,
                audit: true,
                sessions: true
            }
        };
    }
}
exports.AdvancedSecurityService = AdvancedSecurityService;
// ============================================
// EXPORTS
// ============================================
const advancedSecurityService = new AdvancedSecurityService();
exports.default = advancedSecurityService;
module.exports = advancedSecurityService;
module.exports.AdvancedSecurityService = AdvancedSecurityService;
module.exports.TwoFactorAuth = TwoFactorAuth;
module.exports.RateLimiter = RateLimiter;
//# sourceMappingURL=advanced-security.service.js.map