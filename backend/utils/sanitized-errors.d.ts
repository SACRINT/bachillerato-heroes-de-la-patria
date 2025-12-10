/**
 * Sanitized Errors - Remover datos sensibles de error logs
 * GDPR Compliance: Nunca loguear PII
 */
export function sanitizeError(error: any, context?: string): {
    message: any;
    code: any;
    context: string;
    timestamp: string;
};
export function maskEmail(email: any): string;
export function maskPhone(phone: any): string;
export function maskToken(token: any): string;
//# sourceMappingURL=sanitized-errors.d.ts.map