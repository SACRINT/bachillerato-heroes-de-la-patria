/**
 * 🛡️ ENTERPRISE SECURITY HEADERS - SEMANA 25
 * Middleware con 12 security headers para producción
 *
 * Headers implementados:
 * 1. Strict-Transport-Security (HSTS)
 * 2. X-Frame-Options
 * 3. X-Content-Type-Options
 * 4. X-XSS-Protection
 * 5. Content-Security-Policy (CSP)
 * 6. Referrer-Policy
 * 7. Permissions-Policy
 * 8. X-Download-Options
 * 9. X-Permitted-Cross-Domain-Policies
 * 10. Cross-Origin-Embedder-Policy (COEP)
 * 11. Cross-Origin-Opener-Policy (COOP)
 * 12. Cross-Origin-Resource-Policy (CORP)
 *
 * Fecha: 20 Noviembre 2025
 */

const devLogger = require('../utils/devLogger');

class SecurityHeaders {
    constructor() {
        this.isProduction = process.env.NODE_ENV === 'production';

        // CSP configuration
        this.cspConfig = {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "https://cdn.jsdelivr.net",
                    "https://unpkg.com",
                    "https://cdnjs.cloudflare.com",
                    "https://www.gstatic.com",
                    "https://accounts.google.com",
                    "https://cdn.tiny.cloud",
                    "https://*.tiny.cloud",
                    "https://www.googletagmanager.com",
                    "https:",  // Wildcard para CDNs
                    "'unsafe-inline'",  // Temporal - remover en producción
                    "'unsafe-eval'"     // Temporal - remover en producción
                ],
                styleSrc: [
                    "'self'",
                    "https://cdn.jsdelivr.net",
                    "https://cdnjs.cloudflare.com",
                    "https://fonts.googleapis.com",
                    "https:",
                    "'unsafe-inline'"
                ],
                fontSrc: [
                    "'self'",
                    "https://fonts.gstatic.com",
                    "https://cdnjs.cloudflare.com",
                    "data:"
                ],
                imgSrc: [
                    "'self'",
                    "https:",
                    "data:",
                    "blob:"
                ],
                connectSrc: [
                    "'self'",
                    "https://accounts.google.com",
                    "https://www.googleapis.com",
                    "https://cdn.tiny.cloud",
                    "https:",
                    "wss:"  // WebSocket
                ],
                frameSrc: [
                    "'self'",
                    "https://accounts.google.com",
                    "https://www.google.com"
                ],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'", "https:", "data:"],
                workerSrc: ["'self'", "blob:"],
                childSrc: ["'self'", "blob:"],
                formAction: ["'self'"],
                frameAncestors: ["'self'"],
                baseUri: ["'self'"],
                upgradeInsecureRequests: []
            }
        };
    }

    /**
     * MIDDLEWARE PRINCIPAL
     */
    middleware() {
        return (req, res, next) => {
            // 1. Strict-Transport-Security (HSTS)
            if (this.isProduction) {
                res.setHeader(
                    'Strict-Transport-Security',
                    'max-age=31536000; includeSubDomains; preload'
                );
            }

            // 2. X-Frame-Options (clickjacking protection)
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');

            // 3. X-Content-Type-Options (MIME type sniffing prevention)
            res.setHeader('X-Content-Type-Options', 'nosniff');

            // 4. X-XSS-Protection (legacy but still useful)
            res.setHeader('X-XSS-Protection', '1; mode=block');

            // 5. Content-Security-Policy
            const csp = this.buildCSP();
            res.setHeader('Content-Security-Policy', csp);

            // 6. Referrer-Policy (privacy)
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

            // 7. Permissions-Policy (feature policy)
            res.setHeader(
                'Permissions-Policy',
                'geolocation=(self), microphone=(), camera=(), payment=(self), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
            );

            // 8. X-Download-Options (IE8+)
            res.setHeader('X-Download-Options', 'noopen');

            // 9. X-Permitted-Cross-Domain-Policies
            res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

            // 10. Cross-Origin-Embedder-Policy (COEP)
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

            // 11. Cross-Origin-Opener-Policy (COOP)
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

            // 12. Cross-Origin-Resource-Policy (CORP)
            res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

            // Bonus: Remove server header (security through obscurity)
            res.removeHeader('X-Powered-By');
            res.removeHeader('Server');

            next();
        };
    }

    /**
     * BUILD CONTENT SECURITY POLICY HEADER
     */
    buildCSP() {
        const directives = [];

        for (const [key, values] of Object.entries(this.cspConfig.directives)) {
            // Convert camelCase to kebab-case
            const directiveName = key.replace(/([A-Z])/g, '-$1').toLowerCase();

            if (values.length === 0) {
                // Directive without values (like upgrade-insecure-requests)
                directives.push(directiveName);
            } else {
                directives.push(`${directiveName} ${values.join(' ')}`);
            }
        }

        return directives.join('; ');
    }

    /**
     * UPDATE CSP FOR SPECIFIC ROUTE
     */
    updateCSP(req, res, additionalDirectives) {
        const newCSP = { ...this.cspConfig.directives, ...additionalDirectives };
        const csp = this.buildCSPFromDirectives(newCSP);
        res.setHeader('Content-Security-Policy', csp);
    }

    /**
     * BUILD CSP FROM CUSTOM DIRECTIVES
     */
    buildCSPFromDirectives(directives) {
        const directivesList = [];

        for (const [key, values] of Object.entries(directives)) {
            const directiveName = key.replace(/([A-Z])/g, '-$1').toLowerCase();

            if (Array.isArray(values) && values.length === 0) {
                directivesList.push(directiveName);
            } else if (Array.isArray(values)) {
                directivesList.push(`${directiveName} ${values.join(' ')}`);
            }
        }

        return directivesList.join('; ');
    }

    /**
     * GET SECURITY SCORE
     */
    getSecurityScore(headers) {
        const requiredHeaders = [
            'strict-transport-security',
            'x-frame-options',
            'x-content-type-options',
            'x-xss-protection',
            'content-security-policy',
            'referrer-policy',
            'permissions-policy',
            'cross-origin-embedder-policy',
            'cross-origin-opener-policy',
            'cross-origin-resource-policy'
        ];

        let score = 0;
        const maxScore = requiredHeaders.length;

        for (const header of requiredHeaders) {
            if (headers[header]) {
                score++;
            }
        }

        return {
            score,
            maxScore,
            percentage: Math.round((score / maxScore) * 100),
            grade: this.getGrade(score, maxScore)
        };
    }

    /**
     * GET SECURITY GRADE
     */
    getGrade(score, maxScore) {
        const percentage = (score / maxScore) * 100;

        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B';
        if (percentage >= 60) return 'C';
        if (percentage >= 50) return 'D';
        return 'F';
    }

    /**
     * LOG SECURITY HEADERS STATUS
     */
    logStatus() {
        devLogger.log('SECURITY', '🛡️ Security Headers Status:');
        devLogger.log('SECURITY', `  - HSTS: ${this.isProduction ? 'ENABLED' : 'DISABLED (dev)'}`);
        devLogger.log('SECURITY', '  - X-Frame-Options: ENABLED');
        devLogger.log('SECURITY', '  - X-Content-Type-Options: ENABLED');
        devLogger.log('SECURITY', '  - X-XSS-Protection: ENABLED');
        devLogger.log('SECURITY', '  - CSP: ENABLED');
        devLogger.log('SECURITY', '  - Referrer-Policy: ENABLED');
        devLogger.log('SECURITY', '  - Permissions-Policy: ENABLED');
        devLogger.log('SECURITY', '  - COEP: ENABLED');
        devLogger.log('SECURITY', '  - COOP: ENABLED');
        devLogger.log('SECURITY', '  - CORP: ENABLED');
        devLogger.log('SECURITY', '  - Total: 12 security headers');
    }
}

// Exportar instancia singleton
const securityHeaders = new SecurityHeaders();

// Log status on module load
securityHeaders.logStatus();

module.exports = securityHeaders;
