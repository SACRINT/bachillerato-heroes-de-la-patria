export const SECURITY_CONFIG = {
    // 2FA Configuration
    twoFactor: {
        codeLength: 6,
        codeExpiry: 300000,        // 5 minutes
        maxAttempts: 3,
        backupCodesCount: 10
    },

    // Rate Limiting
    rateLimiting: {
        windows: {
            login: { maxRequests: 5, windowMs: 900000 },      // 5 per 15 min
            api: { maxRequests: 100, windowMs: 60000 },       // 100 per min
            password: { maxRequests: 3, windowMs: 3600000 }   // 3 per hour
        }
    },

    // Session Security
    session: {
        maxConcurrent: 5,
        absoluteTimeout: 86400000,   // 24 hours
        idleTimeout: 1800000,        // 30 minutes
        rotateOnUse: true
    },

    // Intrusion Detection
    ids: {
        bruteForceThreshold: 10,
        suspiciousPatterns: [
            /union\s+select/i,
            /;.*drop\s+table/i,
            /<script[^>]*>/i,
            /javascript:/i,
            /on\w+\s*=/i
        ],
        blockDuration: 3600000       // 1 hour
    },

    // Password Policy
    password: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecial: true,
        maxAge: 90 * 24 * 3600000,   // 90 days
        historyCount: 5
    },

    // Encryption
    encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 32,
        ivLength: 16,
        tagLength: 16
    }
};

export class ServiceError extends Error {
    public code: string;
    public statusCode: number;

    constructor(message: string, code: string, statusCode: number = 500) {
        super(message);
        this.name = 'ServiceError';
        this.code = code;
        this.statusCode = statusCode;
    }
}
