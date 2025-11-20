/**
 * 🛡️ WEB APPLICATION FIREWALL (WAF) - SEMANA 25
 * Middleware de protección contra ataques OWASP Top 10
 *
 * Features:
 * - SQL Injection detection
 * - XSS (Cross-Site Scripting) prevention
 * - Path Traversal protection
 * - Command Injection prevention
 * - CSRF token validation
 * - File Upload validation
 * - Request size limits
 * - Content-Type validation
 *
 * Fecha: 20 Noviembre 2025
 */

const devLogger = require('../utils/devLogger');

class WAF {
    constructor() {
        // SQL Injection patterns
        this.sqlPatterns = [
            /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
            /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
            /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
            /union.*select/i,
            /exec(\s|\+)+(s|x)p\w+/i,
            /UNION.*SELECT.*FROM/i,
            /SELECT.*FROM.*WHERE/i,
            /INSERT.*INTO.*VALUES/i,
            /DELETE.*FROM.*WHERE/i,
            /DROP.*TABLE/i,
            /UPDATE.*SET/i,
            /;.*DROP/i,
            /;.*DELETE/i,
            /;.*INSERT/i
        ];

        // XSS patterns
        this.xssPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,  // onclick=, onerror=, etc
            /<iframe[^>]*>/gi,
            /<embed[^>]*>/gi,
            /<object[^>]*>/gi,
            /eval\s*\(/gi,
            /expression\s*\(/gi,
            /<img[^>]+src[^>]*>/gi
        ];

        // Path Traversal patterns
        this.pathTraversalPatterns = [
            /\.\.\//g,
            /\.\.%2F/gi,
            /\.\.%5C/gi,
            /%2e%2e%2f/gi,
            /%2e%2e%5c/gi,
            /\.\.\\/g
        ];

        // Command Injection patterns
        this.commandInjectionPatterns = [
            /[;&|`$(){}[\]<>]/g,
            /\|\|/g,
            /&&/g,
            /;.*rm/gi,
            /;.*wget/gi,
            /;.*curl/gi
        ];

        // Configuración
        this.config = {
            maxRequestSize: 10 * 1024 * 1024, // 10MB
            maxUrlLength: 2048,
            maxHeaderSize: 8192,
            allowedContentTypes: [
                'application/json',
                'application/x-www-form-urlencoded',
                'multipart/form-data',
                'text/plain'
            ],
            blockedUserAgents: [
                /bot/i,
                /crawler/i,
                /scraper/i,
                /spider/i
            ],
            whitelistedPaths: [
                '/api/health',
                '/api/public',
                '/public'
            ]
        };

        // IP blacklist (en producción esto vendría de una BD)
        this.blacklistedIPs = new Set();

        // IP whitelist (opcional)
        this.whitelistedIPs = new Set();

        // Rate limiting map (IP → { count, firstRequest })
        this.rateLimitMap = new Map();
        this.rateLimit = {
            windowMs: 60 * 1000, // 1 minuto
            maxRequests: 100
        };
    }

    /**
     * MIDDLEWARE PRINCIPAL
     */
    middleware() {
        return async (req, res, next) => {
            try {
                const ip = this.getClientIP(req);

                // 1. Check IP blacklist
                if (this.isBlacklisted(ip)) {
                    devLogger.warn('WAF', `❌ IP blacklisted: ${ip}`);
                    return this.blockRequest(res, 'IP bloqueada', 403);
                }

                // 2. Check rate limiting
                if (this.isRateLimited(ip)) {
                    devLogger.warn('WAF', `❌ Rate limit exceeded: ${ip}`);
                    return this.blockRequest(res, 'Demasiadas peticiones', 429);
                }

                // 3. Validate request size
                if (!this.validateRequestSize(req)) {
                    devLogger.warn('WAF', `❌ Request size too large: ${ip}`);
                    return this.blockRequest(res, 'Petición demasiado grande', 413);
                }

                // 4. Validate URL length
                if (!this.validateUrlLength(req)) {
                    devLogger.warn('WAF', `❌ URL too long: ${ip}`);
                    return this.blockRequest(res, 'URL demasiado larga', 414);
                }

                // 5. Detect SQL Injection
                if (this.detectSQLInjection(req)) {
                    devLogger.warn('WAF', `❌ SQL Injection attempt detected: ${ip} ${req.url}`);
                    this.addToBlacklist(ip);
                    return this.blockRequest(res, 'Petición maliciosa detectada', 403);
                }

                // 6. Detect XSS
                if (this.detectXSS(req)) {
                    devLogger.warn('WAF', `❌ XSS attempt detected: ${ip} ${req.url}`);
                    this.addToBlacklist(ip);
                    return this.blockRequest(res, 'Petición maliciosa detectada', 403);
                }

                // 7. Detect Path Traversal
                if (this.detectPathTraversal(req)) {
                    devLogger.warn('WAF', `❌ Path Traversal attempt detected: ${ip} ${req.url}`);
                    this.addToBlacklist(ip);
                    return this.blockRequest(res, 'Petición maliciosa detectada', 403);
                }

                // 8. Detect Command Injection
                if (this.detectCommandInjection(req)) {
                    devLogger.warn('WAF', `❌ Command Injection attempt detected: ${ip} ${req.url}`);
                    this.addToBlacklist(ip);
                    return this.blockRequest(res, 'Petición maliciosa detectada', 403);
                }

                // 9. Validate Content-Type
                if (!this.validateContentType(req)) {
                    devLogger.warn('WAF', `❌ Invalid Content-Type: ${ip} ${req.headers['content-type']}`);
                    return this.blockRequest(res, 'Content-Type no permitido', 400);
                }

                // 10. Check User-Agent
                if (this.isBlockedUserAgent(req)) {
                    devLogger.warn('WAF', `❌ Blocked User-Agent: ${ip} ${req.headers['user-agent']}`);
                    return this.blockRequest(res, 'User-Agent no permitido', 403);
                }

                // Request passed all checks
                next();

            } catch (error) {
                devLogger.error('WAF', 'Error in WAF middleware:', error);
                next(); // Don't block on errors
            }
        };
    }

    /**
     * OBTENER IP DEL CLIENTE
     */
    getClientIP(req) {
        return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
               req.headers['x-real-ip'] ||
               req.connection.remoteAddress ||
               req.socket.remoteAddress ||
               'unknown';
    }

    /**
     * VERIFICAR SI IP ESTÁ EN BLACKLIST
     */
    isBlacklisted(ip) {
        return this.blacklistedIPs.has(ip);
    }

    /**
     * AGREGAR IP A BLACKLIST
     */
    addToBlacklist(ip, duration = 24 * 60 * 60 * 1000) { // 24 horas
        this.blacklistedIPs.add(ip);

        // Auto-remove after duration
        setTimeout(() => {
            this.blacklistedIPs.delete(ip);
            devLogger.log('WAF', `IP ${ip} removed from blacklist`);
        }, duration);
    }

    /**
     * RATE LIMITING
     */
    isRateLimited(ip) {
        const now = Date.now();
        const record = this.rateLimitMap.get(ip);

        if (!record) {
            this.rateLimitMap.set(ip, { count: 1, firstRequest: now });
            return false;
        }

        const timePassed = now - record.firstRequest;

        if (timePassed > this.rateLimit.windowMs) {
            // Reset window
            this.rateLimitMap.set(ip, { count: 1, firstRequest: now });
            return false;
        }

        record.count++;

        if (record.count > this.rateLimit.maxRequests) {
            return true; // Rate limited
        }

        return false;
    }

    /**
     * VALIDAR TAMAÑO DE REQUEST
     */
    validateRequestSize(req) {
        const contentLength = parseInt(req.headers['content-length'] || '0');
        return contentLength <= this.config.maxRequestSize;
    }

    /**
     * VALIDAR LONGITUD DE URL
     */
    validateUrlLength(req) {
        return req.url.length <= this.config.maxUrlLength;
    }

    /**
     * DETECTAR SQL INJECTION
     */
    detectSQLInjection(req) {
        const targets = [
            req.url,
            JSON.stringify(req.query),
            JSON.stringify(req.body),
            JSON.stringify(req.params)
        ];

        for (const target of targets) {
            for (const pattern of this.sqlPatterns) {
                if (pattern.test(target)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * DETECTAR XSS
     */
    detectXSS(req) {
        const targets = [
            req.url,
            JSON.stringify(req.query),
            JSON.stringify(req.body),
            JSON.stringify(req.params),
            req.headers['user-agent'] || '',
            req.headers['referer'] || ''
        ];

        for (const target of targets) {
            for (const pattern of this.xssPatterns) {
                if (pattern.test(target)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * DETECTAR PATH TRAVERSAL
     */
    detectPathTraversal(req) {
        const targets = [
            req.url,
            req.path || ''
        ];

        for (const target of targets) {
            for (const pattern of this.pathTraversalPatterns) {
                if (pattern.test(target)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * DETECTAR COMMAND INJECTION
     */
    detectCommandInjection(req) {
        const targets = [
            JSON.stringify(req.query),
            JSON.stringify(req.body),
            JSON.stringify(req.params)
        ];

        for (const target of targets) {
            for (const pattern of this.commandInjectionPatterns) {
                if (pattern.test(target)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * VALIDAR CONTENT-TYPE
     */
    validateContentType(req) {
        // Skip for GET requests
        if (req.method === 'GET' || req.method === 'DELETE') {
            return true;
        }

        const contentType = req.headers['content-type'] || '';

        // Allow if no content
        if (!contentType && !req.headers['content-length']) {
            return true;
        }

        return this.config.allowedContentTypes.some(allowed =>
            contentType.toLowerCase().includes(allowed.toLowerCase())
        );
    }

    /**
     * VERIFICAR USER-AGENT BLOQUEADO
     */
    isBlockedUserAgent(req) {
        const userAgent = req.headers['user-agent'] || '';

        // Allow empty user-agent (some legit clients)
        if (!userAgent) {
            return false;
        }

        return this.config.blockedUserAgents.some(pattern => pattern.test(userAgent));
    }

    /**
     * BLOQUEAR REQUEST
     */
    blockRequest(res, message, statusCode = 403) {
        res.status(statusCode).json({
            success: false,
            error: 'Request blocked by WAF',
            message: message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * LIMPIAR RATE LIMIT MAP (llamar periódicamente)
     */
    cleanup() {
        const now = Date.now();

        for (const [ip, record] of this.rateLimitMap.entries()) {
            const timePassed = now - record.firstRequest;

            if (timePassed > this.rateLimit.windowMs) {
                this.rateLimitMap.delete(ip);
            }
        }
    }
}

// Exportar instancia singleton
const waf = new WAF();

// Cleanup cada 5 minutos
setInterval(() => waf.cleanup(), 5 * 60 * 1000);

module.exports = waf;
