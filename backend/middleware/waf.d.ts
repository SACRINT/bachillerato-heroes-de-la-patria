export = waf;
declare const waf: WAF;
declare class WAF {
    sqlPatterns: RegExp[];
    xssPatterns: RegExp[];
    pathTraversalPatterns: RegExp[];
    commandInjectionPatterns: RegExp[];
    config: {
        maxRequestSize: number;
        maxUrlLength: number;
        maxHeaderSize: number;
        allowedContentTypes: string[];
        blockedUserAgents: RegExp[];
        whitelistedPaths: string[];
    };
    blacklistedIPs: Set<any>;
    whitelistedIPs: Set<any>;
    rateLimitMap: Map<any, any>;
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    /**
     * MIDDLEWARE PRINCIPAL
     */
    middleware(): (req: any, res: any, next: any) => Promise<void>;
    /**
     * OBTENER IP DEL CLIENTE
     */
    getClientIP(req: any): any;
    /**
     * VERIFICAR SI IP ESTÁ EN BLACKLIST
     */
    isBlacklisted(ip: any): boolean;
    /**
     * AGREGAR IP A BLACKLIST
     */
    addToBlacklist(ip: any, duration?: number): void;
    /**
     * RATE LIMITING
     */
    isRateLimited(ip: any): boolean;
    /**
     * VALIDAR TAMAÑO DE REQUEST
     */
    validateRequestSize(req: any): boolean;
    /**
     * VALIDAR LONGITUD DE URL
     */
    validateUrlLength(req: any): boolean;
    /**
     * DETECTAR SQL INJECTION
     */
    detectSQLInjection(req: any): boolean;
    /**
     * DETECTAR XSS
     */
    detectXSS(req: any): boolean;
    /**
     * DETECTAR PATH TRAVERSAL
     */
    detectPathTraversal(req: any): boolean;
    /**
     * DETECTAR COMMAND INJECTION
     */
    detectCommandInjection(req: any): boolean;
    /**
     * VALIDAR CONTENT-TYPE
     */
    validateContentType(req: any): boolean;
    /**
     * VERIFICAR USER-AGENT BLOQUEADO
     */
    isBlockedUserAgent(req: any): boolean;
    /**
     * BLOQUEAR REQUEST
     */
    blockRequest(res: any, message: any, statusCode?: number): void;
    /**
     * LIMPIAR RATE LIMIT MAP (llamar periódicamente)
     */
    cleanup(): void;
}
//# sourceMappingURL=waf.d.ts.map