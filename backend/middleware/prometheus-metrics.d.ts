export const register: any;
/**
 * Middleware para trackear métricas HTTP
 */
export function metricsMiddleware(req: any, res: any, next: any): void;
/**
 * Endpoint para exponer métricas a Prometheus
 */
export function metricsEndpoint(req: any, res: any): Promise<void>;
declare const httpRequestDuration: any;
declare const httpRequestsTotal: any;
declare const httpRequestsInProgress: any;
declare const dbQueryDuration: any;
declare const dbQueriesTotal: any;
declare const dbConnectionsActive: any;
declare const loginAttempts: any;
declare const userRegistrations: any;
declare const activeUsers: any;
declare const emailsSent: any;
declare const pageLoadTime: any;
declare const cacheHits: any;
declare const cacheMisses: any;
/**
 * Registrar métrica de query SQL
 */
export function trackDatabaseQuery(queryType: any, table: any, duration: any, status?: string): void;
/**
 * Registrar login attempt
 */
export function trackLoginAttempt(status: any, role: any): void;
/**
 * Registrar registro de usuario
 */
export function trackUserRegistration(role: any, status?: string): void;
/**
 * Actualizar usuarios activos
 */
export function updateActiveUsers(role: any, delta: any): void;
/**
 * Registrar email enviado
 */
export function trackEmailSent(template: any, status?: string): void;
/**
 * Registrar cache hit/miss
 */
export function trackCacheAccess(cacheKey: any, hit?: boolean): void;
/**
 * Actualizar conexiones de BD activas
 */
export function updateDatabaseConnections(count: any): void;
export declare namespace metrics {
    export { httpRequestDuration };
    export { httpRequestsTotal };
    export { httpRequestsInProgress };
    export { dbQueryDuration };
    export { dbQueriesTotal };
    export { dbConnectionsActive };
    export { loginAttempts };
    export { userRegistrations };
    export { activeUsers };
    export { emailsSent };
    export { pageLoadTime };
    export { cacheHits };
    export { cacheMisses };
}
export {};
//# sourceMappingURL=prometheus-metrics.d.ts.map