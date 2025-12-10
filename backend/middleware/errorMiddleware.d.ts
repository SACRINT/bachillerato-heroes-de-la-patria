/**
 * NOT FOUND HANDLER (404)
 */
export function notFound(req: any, res: any, next: any): void;
/**
 * GLOBAL ERROR HANDLER
 */
export function errorHandler(err: any, req: any, res: any, next: any): void;
/**
 * ASYNC ERROR WRAPPER
 * Wrapper para async route handlers que catch automáticamente errores
 */
export function asyncHandler(fn: any): (req: any, res: any, next: any) => void;
/**
 * VALIDATION ERROR HANDLER
 */
export function validationErrorHandler(err: any, req: any, res: any, next: any): void;
/**
 * DATABASE ERROR HANDLER
 */
export function databaseErrorHandler(err: any, req: any, res: any, next: any): void;
/**
 * AUTHENTICATION ERROR HANDLER
 */
export function authErrorHandler(err: any, req: any, res: any, next: any): void;
/**
 * CREATE CUSTOM ERROR
 */
export class AppError extends Error {
    constructor(message: any, statusCode?: number, code?: string);
    statusCode: number;
    code: string;
}
//# sourceMappingURL=errorMiddleware.d.ts.map