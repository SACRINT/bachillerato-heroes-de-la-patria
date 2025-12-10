declare const _exports: PerformanceService;
export = _exports;
declare class PerformanceService {
    metrics: {
        queries: any[];
        requests: any[];
        memory: any[];
    };
    thresholds: {
        slowQuery: number;
        slowRequest: number;
        highMemory: number;
    };
    trackQuery(query: any, duration: any, rows?: number): {
        query: any;
        duration: any;
        rows: number;
        timestamp: number;
        slow: boolean;
    };
    trackRequest(method: any, path: any, duration: any, statusCode: any): {
        method: any;
        path: any;
        duration: any;
        statusCode: any;
        timestamp: number;
        slow: boolean;
    };
    captureMemorySnapshot(): {
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
        heapUsedPercent: string;
        timestamp: number;
    };
    getSlowQueries(limit?: number): any[];
    getSlowRequests(limit?: number): any[];
    getStats(): {
        queries: {
            total: number;
            slow: number;
            avgDuration: number;
            p95Duration: any;
            p99Duration: any;
        };
        requests: {
            total: number;
            slow: number;
            avgDuration: number;
            p95Duration: any;
            p99Duration: any;
        };
        memory: any;
    };
    detectBottlenecks(): ({
        type: string;
        severity: string;
        description: string;
        pattern: string;
        endpoint?: undefined;
        heapUsed?: undefined;
    } | {
        type: string;
        severity: string;
        description: string;
        endpoint: string;
        pattern?: undefined;
        heapUsed?: undefined;
    } | {
        type: string;
        severity: string;
        description: string;
        heapUsed: any;
        pattern?: undefined;
        endpoint?: undefined;
    })[];
    getRecommendations(): {
        priority: string;
        category: string;
        action: string;
        details: string;
    }[];
    average(arr: any): number;
    percentile(arr: any, p: any): any;
    middleware(): (req: any, res: any, next: any) => void;
    reset(): void;
}
//# sourceMappingURL=performanceService.d.ts.map