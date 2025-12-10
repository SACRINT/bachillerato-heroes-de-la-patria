/**
 * CORS estándar para la aplicación
 */
export const corsMiddleware: (req: cors.CorsRequest, res: {
    statusCode
    /**
     * Verificar si un origen está permitido
     */
    ?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void;
/**
 * CORS estricto para endpoints sensibles (auth, admin)
 */
export const strictCorsMiddleware: (req: cors.CorsRequest, res: {
    statusCode
    /**
     * Verificar si un origen está permitido
     */
    ?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void;
/**
 * CORS público para endpoints read-only
 */
export const publicCorsMiddleware: (req: cors.CorsRequest, res: {
    statusCode
    /**
     * Verificar si un origen está permitido
     */
    ?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void;
/**
 * Middleware personalizado con logging
 */
export function corsWithLogging(req: any, res: any, next: any): void;
/**
 * Obtener lista de orígenes permitidos según ambiente
 */
export function getAllowedOrigins(): any[];
/**
 * Verificar si un origen está permitido
 */
export function isOriginAllowed(origin: any): boolean;
/**
 * Agregar origen a whitelist dinámicamente (solo en desarrollo)
 */
export function addOriginToWhitelist(origin: any): void;
export namespace corsOptions {
    function origin(origin: any, callback: any): any;
    let credentials: boolean;
    let methods: string[];
    let allowedHeaders: string[];
    let exposedHeaders: string[];
    let maxAge: number;
    let optionsSuccessStatus: number;
    let preflightContinue: boolean;
}
export namespace strictCorsOptions {
    export function origin_1(origin: any, callback: any): any;
    export { origin_1 as origin };
}
export namespace publicCorsOptions {
    export function origin_2(origin: any, callback: any): void;
    export { origin_2 as origin };
    let credentials_1: boolean;
    export { credentials_1 as credentials };
}
import cors = require("cors");
//# sourceMappingURL=cors-secure.d.ts.map