import { TwoFactorService } from './TwoFactorService';
import { RateLimiterService } from './RateLimiterService';
import { IntrusionDetectionService } from './IntrusionDetectionService';
import { SessionService } from './SessionService';
import { PasswordValidatorService } from './PasswordValidatorService';
import { ServiceError, SECURITY_CONFIG } from './config';

export class AdvancedSecurityService {
    public twoFactor: TwoFactorService;
    public rateLimiter: RateLimiterService;
    public ids: IntrusionDetectionService;
    public sessionManager: SessionService;
    public passwordValidator: PasswordValidatorService;
    private initialized = false;

    constructor() {
        this.twoFactor = new TwoFactorService();
        this.rateLimiter = new RateLimiterService();
        this.ids = new IntrusionDetectionService();
        this.sessionManager = new SessionService();
        this.passwordValidator = new PasswordValidatorService();
    }

    /**
     * Inicializa el servicio
     */
    async initialize(pool?: any): Promise<void> {
        if (this.initialized) return;

        // Setup periodic cleanup for rate limiter
        setInterval(() => this.rateLimiter.cleanup(), 60000);

        this.initialized = true;
        console.log('[SECURITY] Advanced Security Service TS initialized');
    }

    // 2FA Methods
    async setup2FA(userId: number | string) { return this.twoFactor.setupTOTP(userId); }
    async enable2FA(userId: number | string, code: string) { return this.twoFactor.enableTOTP(userId, code); }
    async verify2FA(userId: number | string, code: string) { return this.twoFactor.verify(userId, code); }
    async disable2FA(userId: number | string, password?: string) { return this.twoFactor.enableTOTP(userId, '000000'); /* Placeholder for disable */ } // FIXME: Implement disable properly in TwoFactorService

    async generateVerificationCode(userId: number | string, method?: string) {
        return this.twoFactor['generateTemporaryCode'] ?
            (this.twoFactor as any).generateTemporaryCode(userId, method) :
            Promise.resolve('000000');
    }

    async verifyTemporaryCode(userId: number | string, code: string, method?: string) {
        return this.twoFactor['verifyTemporaryCode'] ?
            (this.twoFactor as any).verifyTemporaryCode(userId, code, method) :
            Promise.resolve(false);
    }

    // Rate Limiting Methods
    checkRateLimit(key: string, windowType: any) { return this.rateLimiter.check(key, windowType); }
    resetRateLimit(key: string, windowType: any) { return this.rateLimiter.reset(key, windowType); }

    // IDS Methods
    analyzeRequest(request: any) { return this.ids.analyze(request); }
    recordFailedLogin(ip: string, userId: string | number) { return this.ids.recordFailedLogin(ip, userId); }
    clearFailedLogins(ip: string) { return this.ids.clearFailedLogins(ip); }
    unblockIP(ip: string) { return this.ids.unblockIP(ip); }
    getBlockedIPs() { return this.ids.getBlockedIPs(); }

    // Session Methods
    async createSession(userId: string | number, deviceInfo: any) { return this.sessionManager.create(userId, deviceInfo); }
    async validateSession(sessionId: string, token: string) { return this.sessionManager.validate(sessionId, token); }
    async destroySession(sessionId: string) { return this.sessionManager.destroy(sessionId); }
    async destroyAllSessions(userId: string | number) { return this.sessionManager.destroyAll(userId); }
    async listSessions(userId: string | number) { return this.sessionManager.listUserSessions(userId); }

    // Password Methods
    validatePassword(password: string) { return this.passwordValidator.validate(password); }
    async checkPasswordHistory(userId: string | number, password: string) { return this.passwordValidator.checkHistory(userId, password); }
    async savePasswordToHistory(userId: string | number, hash: string) { return this.passwordValidator.saveToHistory(userId, hash); }
    async passwordNeedsChange(userId: string | number) { return this.passwordValidator.needsChange(userId); }
}

export const securityService = new AdvancedSecurityService();
export { ServiceError };
