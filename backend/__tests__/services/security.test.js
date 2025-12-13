const mockDAO = {
    get2FAConfig: jest.fn(),
    createSession: jest.fn(),
    validateSession: jest.fn(),
    logSecurityThreat: jest.fn(),
    recordFailedLogin: jest.fn(),
    getPasswordHistory: jest.fn(),
    savePasswordToHistory: jest.fn(),
    cleanOldPasswordHistory: jest.fn(),
    checkPasswordAge: jest.fn(),
    checkHistory: jest.fn(), // Añadido por si acaso
    destroySession: jest.fn(),
    destroyOldestSessions: jest.fn(),
    updateSessionActivity: jest.fn(),
    countActiveSessions: jest.fn()
};

// Mockear el DAO antes de importar el servicio
jest.mock('../../data/security-advanced.dao', () => mockDAO);

const { securityService } = require('../../services/security/index');
const securityDAO = require('../../data/security-advanced.dao');

describe('Advaced Security Service (Refactored)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset rate limiter manually
        if (securityService.rateLimiter) {
            securityService.rateLimiter.requests = new Map();
        }
        // Reset IDS state
        if (securityService.ids) {
            securityService.ids.failedAttempts = new Map();
            securityService.ids.blockedIPs = new Map();
        }
    });

    test('should initialize correctly', async () => {
        await securityService.initialize();
        expect(securityService.initialized).toBe(true);
    });

    describe('Password Validator', () => {
        test('should validate strong password', () => {
            const result = securityService.validatePassword('Strong.Pass123!AndLongEnough');
            expect(result.valid).toBe(true);
            expect(result.strength).toBeGreaterThan(3);
        });

        test('should reject weak password', () => {
            const result = securityService.validatePassword('weak');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Mínimo 12 caracteres');
        });

        test('should check password history', async () => {
            // Mock hash comparison logic handling inside service is tricky without mocking bcrypt
            // But we can test that DAO is called
            securityDAO.getPasswordHistory.mockResolvedValue([]);

            const result = await securityService.checkPasswordHistory(1, 'NewPass123!');
            expect(securityDAO.getPasswordHistory).toHaveBeenCalled();
            expect(result.used).toBe(false);
        });
    });

    describe('Rate Limiter', () => {
        test('should allow requests within limit', () => {
            const key = '127.0.0.1';
            const result = securityService.checkRateLimit(key, 'api');
            expect(result.allowed).toBe(true);
        });

        test('should block requests exceeding limit', () => {
            const key = '127.0.0.2';
            for (let i = 0; i < 101; i++) {
                securityService.checkRateLimit(key, 'api');
            }
            const result = securityService.checkRateLimit(key, 'api');
            expect(result.allowed).toBe(false);
        });
    });

    describe('Intrusion Detection', () => {
        test('should detect SQL injection pattern', () => {
            const req = {
                ip: '10.0.0.1',
                path: '/login',
                body: { user: "UNION SELECT * FROM users" }, // Patrón que sí está en config
                query: {},
                headers: { 'user-agent': 'Mozilla/5.0 Valid Agent' } // UA válido
            };

            const result = securityService.analyzeRequest(req);
            const patterns = result.threats.map(t => t.type);
            expect(patterns).toContain('SUSPICIOUS_PATTERN');
        });

        test('should block IP after brute force attempt', () => {
            const ip = '10.0.0.5';

            // Simulate failed logins (Threshold is 10)
            for (let i = 0; i < 10; i++) {
                securityService.recordFailedLogin(ip, 123);
            }

            // The 11th attempt (or check) should show blocked
            const result = securityService.recordFailedLogin(ip, 123);
            expect(result.blocked).toBe(true);
        });
    });
});
