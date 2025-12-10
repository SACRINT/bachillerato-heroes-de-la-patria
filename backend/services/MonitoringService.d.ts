declare const _exports: MonitoringService;
export = _exports;
declare class MonitoringService {
    metrics: {
        requests: {
            total: number;
            success: number;
            errors: number;
            byEndpoint: Map<any, any>;
            byStatusCode: Map<any, any>;
        };
        performance: {
            avgResponseTime: number;
            totalResponseTime: number;
            requestCount: number;
            slowRequests: number;
        };
        errors: any[];
        uptime: number;
    };
    alertConfig: {
        errorRateThreshold: number;
        avgResponseTimeThreshold: number;
        memoryThreshold: number;
        cpuThreshold: number;
        diskThreshold: number;
    };
    activeAlerts: any[];
    metricsHistory: any[];
    maxHistoryLength: number;
    /**
     * Middleware para tracking de requests
     */
    middleware(): (req: any, res: any, next: any) => void;
    /**
     * Registrar métricas de request
     */
    recordRequest(req: any, res: any, duration: any): void;
    /**
     * Registrar error
     */
    recordError(error: any, req?: any): void;
    /**
     * Iniciar recolección periódica de métricas
     */
    startMetricsCollection(): void;
    /**
     * Recolectar métricas del sistema
     */
    collectSystemMetrics(): void;
    /**
     * Obtener métricas del sistema operativo
     */
    getSystemMetrics(): {
        platform: NodeJS.Platform;
        arch: NodeJS.Architecture;
        hostname: string;
        uptime: number;
        loadAverage: number[];
        cpu: {
            count: number;
            model: string;
            usage: number;
        };
        memory: {
            total: number;
            used: number;
            free: number;
            usage: number;
        };
        process: {
            pid: number;
            uptime: number;
            memoryUsage: NodeJS.MemoryUsage;
            nodeVersion: string;
        };
    };
    /**
     * Health check completo
     */
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
        checks: {};
    }>;
    /**
     * Verificar y generar alertas
     */
    checkAlerts(): void;
    /**
     * Crear alerta
     */
    createAlert(type: any, severity: any, data: any): {
        id: string;
        type: any;
        severity: any;
        data: any;
        timestamp: string;
        acknowledged: boolean;
    };
    /**
     * Obtener dashboard de métricas
     */
    getDashboard(): {
        overview: {
            status: string;
            uptime: number;
            requests: number;
            errorRate: string;
        };
        requests: {
            total: number;
            success: number;
            errors: number;
            topEndpoints: {
                endpoint: any;
                count: any;
            }[];
        };
        performance: {
            avgResponseTime: string;
            slowRequests: number;
        };
        system: {
            cpu: string;
            memory: string;
            loadAverage: number[];
            processMemory: NodeJS.MemoryUsage;
        };
        alerts: {
            active: number;
            recent: any[];
        };
        timestamp: string;
    };
    /**
     * Obtener top endpoints por requests
     */
    getTopEndpoints(limit?: number): {
        endpoint: any;
        count: any;
    }[];
    /**
     * Obtener historial de métricas
     */
    getHistory(hours?: number): any[];
    /**
     * Obtener errores recientes
     */
    getRecentErrors(limit?: number): any[];
    /**
     * Reconocer alerta
     */
    acknowledgeAlert(alertId: any): boolean;
    /**
     * Resetear métricas
     */
    reset(): void;
    /**
     * Exportar métricas en formato Prometheus
     */
    getPrometheusMetrics(): string;
}
//# sourceMappingURL=MonitoringService.d.ts.map