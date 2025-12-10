/**
 * Middleware combinado (generar + validar)
 */
export function csrfProtection(req: any, res: any, next: any): void;
/**
 * Middleware para generar y proveer token CSRF
 */
export function csrfMiddleware(req: any, res: any, next: any): void;
/**
 * Middleware para validar token CSRF
 */
export function validateCsrfMiddleware(req: any, res: any, next: any): any;
/**
 * Agregar token CSRF a formularios HTML (helper para templates)
 */
export function csrfHiddenInput(token: any): string;
/**
 * Agregar token CSRF a meta tag (para AJAX)
 */
export function csrfMetaTag(token: any): string;
/**
 * Obtener token desde meta tag en cliente
 */
export const clientSideHelper: "\n// Cliente: Obtener token CSRF desde meta tag\nfunction getCSRFToken() {\n    const meta = document.querySelector('meta[name=\"csrf-token\"]');\n    return meta ? meta.getAttribute('content') : null;\n}\n\n// Cliente: Agregar token a fetch requests\nfunction fetchWithCSRF(url, options = {}) {\n    const token = getCSRFToken();\n\n    if (!token) {\n        console.error('CSRF token not found');\n        return Promise.reject(new Error('CSRF token not found'));\n    }\n\n    const headers = options.headers || {};\n    headers['X-CSRF-Token'] = token;\n\n    return fetch(url, {\n        ...options,\n        headers: headers\n    });\n}\n\n// Cliente: Agregar token a todos los formularios\ndocument.addEventListener('DOMContentLoaded', function() {\n    const token = getCSRFToken();\n    if (!token) return;\n\n    // Agregar a todos los forms que no tengan el token\n    document.querySelectorAll('form').forEach(form => {\n        if (form.method.toLowerCase() === 'post' && !form.querySelector('[name=\"_csrf\"]')) {\n            const input = document.createElement('input');\n            input.type = 'hidden';\n            input.name = '_csrf';\n            input.value = token;\n            form.appendChild(input);\n        }\n    });\n});\n";
/**
 * Generar token CSRF criptográficamente seguro
 */
export function generateToken(): string;
/**
 * Verificar token CSRF
 */
export function verifyToken(token: any, secret: any): boolean;
export namespace CSRF_CONFIG {
    let tokenLength: number;
    let cookieName: string;
    let headerName: string;
    let bodyField: string;
    namespace cookieOptions {
        let httpOnly: boolean;
        let secure: boolean;
        let sameSite: string;
        let maxAge: number;
    }
    let safeMethods: string[];
    let excludedPaths: string[];
}
//# sourceMappingURL=csrf-protection.d.ts.map