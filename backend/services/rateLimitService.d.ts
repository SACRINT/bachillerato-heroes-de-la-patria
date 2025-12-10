declare const _exports: {
    limits: Map<any, any>;
    whitelist: Set<any>;
    defaultLimits: {
        public: {
            requests: number;
            window: number;
        };
        authenticated: {
            requests: number;
            window: number;
        };
        admin: {
            requests: number;
            window: number;
        };
    };
    check(key: any, tier?: string): {
        allowed: boolean;
        remaining: number;
        resetAt?: undefined;
        retryAfter?: undefined;
        limit?: undefined;
    } | {
        allowed: boolean;
        remaining: number;
        resetAt: Date;
        retryAfter: number;
        limit?: undefined;
    } | {
        allowed: boolean;
        remaining: number;
        limit: any;
        resetAt: Date;
        retryAfter?: undefined;
    };
    middleware(options?: {}): (req: any, res: any, next: any) => void;
    setLimit(tier: any, requests: any, windowMs: any): void;
    addToWhitelist(key: any): void;
    removeFromWhitelist(key: any): void;
    reset(key: any): void;
    cleanup(): void;
    getStats(): {
        totalKeys: number;
        whitelisted: number;
        byTier: {};
    };
    readonly __esModule: boolean;
    default: {
        limits: Map<any, any>;
        whitelist: Set<any>;
        defaultLimits: {
            public: {
                requests: number;
                window: number;
            };
            authenticated: {
                requests: number;
                window: number;
            };
            admin: {
                requests: number;
                window: number;
            };
        };
        check(key: any, tier?: string): {
            allowed: boolean;
            remaining: number;
            resetAt?: undefined;
            retryAfter?: undefined;
            limit?: undefined;
        } | {
            allowed: boolean;
            remaining: number;
            resetAt: Date;
            retryAfter: number;
            limit?: undefined;
        } | {
            allowed: boolean;
            remaining: number;
            limit: any;
            resetAt: Date;
            retryAfter?: undefined;
        };
        middleware(options?: {}): (req: any, res: any, next: any) => void;
        setLimit(tier: any, requests: any, windowMs: any): void;
        addToWhitelist(key: any): void;
        removeFromWhitelist(key: any): void;
        reset(key: any): void;
        cleanup(): void;
        getStats(): {
            totalKeys: number;
            whitelisted: number;
            byTier: {};
        };
    };
};
export = _exports;
//# sourceMappingURL=rateLimitService.d.ts.map