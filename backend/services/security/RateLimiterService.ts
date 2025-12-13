import { SECURITY_CONFIG } from './config';

interface RateLimitData {
    windowStart: number;
    count: number;
}

interface RateLimitResult {
    allowed: boolean;
    retryAfter?: number;
    limit?: number;
    remaining?: number;
}

export class RateLimiterService {
    private requests = new Map<string, RateLimitData>();

    /**
     * Verifica límite de tasa
     */
    check(key: string, windowType: 'login' | 'api' | 'password' = 'api'): RateLimitResult {
        const config = SECURITY_CONFIG.rateLimiting.windows[windowType];
        if (!config) {
            return { allowed: true };
        }

        const now = Date.now();
        const windowKey = `${key}:${windowType}`;

        let windowData = this.requests.get(windowKey);

        if (!windowData || now - windowData.windowStart > config.windowMs) {
            windowData = {
                windowStart: now,
                count: 0
            };
        }

        windowData.count++;

        if (windowData.count > config.maxRequests) {
            const resetTime = windowData.windowStart + config.windowMs;
            return {
                allowed: false,
                retryAfter: Math.ceil((resetTime - now) / 1000),
                limit: config.maxRequests,
                remaining: 0
            };
        }

        this.requests.set(windowKey, windowData);

        return {
            allowed: true,
            limit: config.maxRequests,
            remaining: config.maxRequests - windowData.count
        };
    }

    reset(key: string, windowType: 'login' | 'api' | 'password' = 'api'): void {
        const windowKey = `${key}:${windowType}`;
        this.requests.delete(windowKey);
    }

    cleanup(): void {
        const now = Date.now();
        for (const [key, data] of this.requests.entries()) {
            const windowType = key.split(':').pop() as 'login' | 'api' | 'password';
            const config = SECURITY_CONFIG.rateLimiting.windows[windowType];

            if (config && now - data.windowStart > config.windowMs) {
                this.requests.delete(key);
            }
        }
    }
}
