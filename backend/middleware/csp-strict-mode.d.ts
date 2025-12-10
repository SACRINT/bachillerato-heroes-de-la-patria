/**
 * Middleware CSP principal
 */
export function cspMiddleware(options?: {}): (req: any, res: any, next: any) => void;
/**
 * Middleware CSP para modo report-only (testing)
 */
export function cspReportOnlyMiddleware(options?: {}): (req: any, res: any, next: any) => void;
/**
 * Middleware para agregar nonce a scripts inline
 */
export function injectNonceToScripts(html: any, nonce: any): any;
/**
 * Helper para usar en templates EJS/Handlebars
 */
export function getNonceForTemplate(res: any): any;
/**
 * Generar nonce criptográficamente seguro
 */
export function generateNonce(): string;
export namespace CSP_POLICIES {
    let development: {
        'default-src': string[];
        'script-src': string[];
        'script-src-elem': string[];
        'style-src': string[];
        'style-src-elem': string[];
        'font-src': string[];
        'img-src': string[];
        'connect-src': string[];
        'frame-src': string[];
        'object-src': string[];
        'base-uri': string[];
        'form-action': string[];
        'frame-ancestors': string[];
        'upgrade-insecure-requests': any[];
    };
    let production: {
        'default-src': string[];
        'script-src': string[];
        'script-src-elem': string[];
        'style-src': string[];
        'style-src-elem': string[];
        'font-src': string[];
        'img-src': string[];
        'connect-src': string[];
        'frame-src': string[];
        'object-src': string[];
        'base-uri': string[];
        'form-action': string[];
        'frame-ancestors': string[];
        'upgrade-insecure-requests': any[];
        'block-all-mixed-content': any[];
        'require-trusted-types-for': string[];
    };
}
//# sourceMappingURL=csp-strict-mode.d.ts.map