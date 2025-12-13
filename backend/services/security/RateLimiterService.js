"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiterService = void 0;
const config_1 = require("./config");
class RateLimiterService {
    constructor() {
        this.requests = new Map();
    }
    /**
     * Verifica límite de tasa
     */
    check(key, windowType = 'api') {
        const config = config_1.SECURITY_CONFIG.rateLimiting.windows[windowType];
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
    reset(key, windowType = 'api') {
        const windowKey = `${key}:${windowType}`;
        this.requests.delete(windowKey);
    }
    cleanup() {
        const now = Date.now();
        for (const [key, data] of this.requests.entries()) {
            const windowType = key.split(':').pop();
            const config = config_1.SECURITY_CONFIG.rateLimiting.windows[windowType];
            if (config && now - data.windowStart > config.windowMs) {
                this.requests.delete(key);
            }
        }
    }
}
exports.RateLimiterService = RateLimiterService;
