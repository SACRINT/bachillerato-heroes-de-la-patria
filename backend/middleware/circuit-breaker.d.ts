/**
 * 🔌 Circuit Breaker Middleware - FASE 30.5 TAREA 6
 *
 * Propósito:
 * - Prevenir cascading failures cuando database está lento
 * - Rechazar requests en lugar de acumular en backlog
 * - Recuperación automática cuando sistema se estabiliza
 *
 * Estados:
 * - CLOSED: Sistema normal, todas las requests pasan
 * - OPEN: Sistema degradado, rechazar requests inmediatamente
 * - HALF_OPEN: Intentando recuperación, permitir algunas requests
 */
export class CircuitBreaker {
    constructor(options?: {});
    failureThreshold: any;
    successThreshold: any;
    timeout: any;
    monitoringInterval: any;
    state: string;
    failureCount: number;
    successCount: number;
    lastFailureTime: number;
    metrics: {
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        rejectedRequests: number;
        stateChanges: any[];
    };
    /**
     * Ejecutar función con protección de circuit breaker
     */
    execute(fn: any, options?: {}): Promise<any>;
    /**
     * Registrar éxito y potencialmente cambiar estado de HALF_OPEN a CLOSED
     */
    recordSuccess(): void;
    /**
     * Registrar fallo y potencialmente cambiar estado de CLOSED a OPEN
     */
    recordFailure(error: any): void;
    /**
     * Cambiar estado del circuit breaker
     */
    changeState(newState: any): void;
    /**
     * Crear timeout promise
     */
    createTimeout(ms: any): Promise<any>;
    /**
     * Monitorear salud del sistema y ajustar umbrales dinámicamente
     */
    startHealthMonitoring(): void;
    /**
     * Obtener métricas actuales
     */
    getMetrics(): {
        state: string;
        uptime: string;
        memory: {
            heapUsed: string;
            heapTotal: string;
            percentage: string;
        };
        requests: {
            total: number;
            successful: number;
            failed: number;
            rejected: number;
            successRate: string;
        };
        thresholds: {
            failureThreshold: any;
            successThreshold: any;
            timeout: string;
        };
        recentStateChanges: any[];
    };
    /**
     * Log de métricas para debugging
     */
    logMetrics(): void;
    /**
     * Reset manual del circuit breaker (para testing)
     */
    reset(): void;
}
/**
 * Middleware de Express para circuit breaker
 */
export function createCircuitBreakerMiddleware(options?: {}): {
    middleware: (req: any, res: any, next: any) => any;
    metricsEndpoint: (req: any, res: any) => void;
    circuitBreaker: CircuitBreaker;
};
//# sourceMappingURL=circuit-breaker.d.ts.map