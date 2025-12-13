"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceError = exports.securityService = exports.AdvancedSecurityService = void 0;
const TwoFactorService_1 = require("./TwoFactorService");
const RateLimiterService_1 = require("./RateLimiterService");
const IntrusionDetectionService_1 = require("./IntrusionDetectionService");
const SessionService_1 = require("./SessionService");
const PasswordValidatorService_1 = require("./PasswordValidatorService");
const config_1 = require("./config");
Object.defineProperty(exports, "ServiceError", { enumerable: true, get: function () { return config_1.ServiceError; } });
class AdvancedSecurityService {
    constructor() {
        this.initialized = false;
        this.twoFactor = new TwoFactorService_1.TwoFactorService();
        this.rateLimiter = new RateLimiterService_1.RateLimiterService();
        this.ids = new IntrusionDetectionService_1.IntrusionDetectionService();
        this.sessionManager = new SessionService_1.SessionService();
        this.passwordValidator = new PasswordValidatorService_1.PasswordValidatorService();
    }
    /**
     * Inicializa el servicio
     */
    async initialize(pool) {
        if (this.initialized)
            return;
        // Setup periodic cleanup for rate limiter
        setInterval(() => this.rateLimiter.cleanup(), 60000);
        this.initialized = true;
        console.log('[SECURITY] Advanced Security Service TS initialized');
    }
    // 2FA Methods
    async setup2FA(userId) { return this.twoFactor.setupTOTP(userId); }
    async enable2FA(userId, code) { return this.twoFactor.enableTOTP(userId, code); }
    async verify2FA(userId, code) { return this.twoFactor.verify(userId, code); }
    async disable2FA(userId, password) { return this.twoFactor.enableTOTP(userId, '000000'); /* Placeholder for disable */ } // FIXME: Implement disable properly in TwoFactorService
    async generateVerificationCode(userId, method) {
        return this.twoFactor['generateTemporaryCode'] ?
            this.twoFactor.generateTemporaryCode(userId, method) :
            Promise.resolve('000000');
    }
    async verifyTemporaryCode(userId, code, method) {
        return this.twoFactor['verifyTemporaryCode'] ?
            this.twoFactor.verifyTemporaryCode(userId, code, method) :
            Promise.resolve(false);
    }
    // Rate Limiting Methods
    checkRateLimit(key, windowType) { return this.rateLimiter.check(key, windowType); }
    resetRateLimit(key, windowType) { return this.rateLimiter.reset(key, windowType); }
    // IDS Methods
    analyzeRequest(request) { return this.ids.analyze(request); }
    recordFailedLogin(ip, userId) { return this.ids.recordFailedLogin(ip, userId); }
    clearFailedLogins(ip) { return this.ids.clearFailedLogins(ip); }
    unblockIP(ip) { return this.ids.unblockIP(ip); }
    getBlockedIPs() { return this.ids.getBlockedIPs(); }
    // Session Methods
    async createSession(userId, deviceInfo) { return this.sessionManager.create(userId, deviceInfo); }
    async validateSession(sessionId, token) { return this.sessionManager.validate(sessionId, token); }
    async destroySession(sessionId) { return this.sessionManager.destroy(sessionId); }
    async destroyAllSessions(userId) { return this.sessionManager.destroyAll(userId); }
    async listSessions(userId) { return this.sessionManager.listUserSessions(userId); }
    // Password Methods
    validatePassword(password) { return this.passwordValidator.validate(password); }
    async checkPasswordHistory(userId, password) { return this.passwordValidator.checkHistory(userId, password); }
    async savePasswordToHistory(userId, hash) { return this.passwordValidator.saveToHistory(userId, hash); }
    async passwordNeedsChange(userId) { return this.passwordValidator.needsChange(userId); }
}
exports.AdvancedSecurityService = AdvancedSecurityService;
exports.securityService = new AdvancedSecurityService();
