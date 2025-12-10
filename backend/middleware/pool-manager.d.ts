export = poolManager;
declare const poolManager: PoolManager;
declare class PoolManager {
    stats: {
        totalRequests: number;
        activeConnections: number;
        maxConnections: any;
        utilizationHistory: any[];
        alertsSent: number;
        lastAlertTime: any;
        peakUtilization: number;
    };
    thresholds: {
        warning: number;
        critical: number;
        severe: number;
    };
    MAX_HISTORY: number;
    prefix: string;
    /**
     * Obtener métricas actuales del pool
     */
    getPoolMetrics(): {
        total: any;
        idle: any;
        active: number;
        waiting: any;
        maxConnections: any;
        utilization: number;
        utilizationPercent: string;
        available: number;
        timestamp: string;
    };
    /**
     * Registrar métrica en histórico
     */
    recordMetric(metrics: any): void;
    /**
     * Analizar utilización y generar alertas
     */
    analyzeUtilization(metrics: any): {
        alertLevel: string;
        message: string;
    };
    /**
     * Middleware Express para monitorear cada request
     */
    middleware: (req: any, res: any, next: any) => void;
    /**
     * Endpoint para obtener estado actual del pool
     * GET /api/health/pool
     */
    getPoolStatusEndpoint: (req: any, res: any) => void;
    /**
     * Endpoint para obtener histórico de métricas
     * GET /api/health/pool/history
     */
    getPoolHistoryEndpoint: (req: any, res: any) => void;
    /**
     * Endpoint para obtener estadísticas resumidas
     * GET /api/health/pool/stats
     */
    getPoolStatsEndpoint: (req: any, res: any) => void;
    /**
     * Resetear contadores (para testing)
     */
    reset(): void;
}
//# sourceMappingURL=pool-manager.d.ts.map