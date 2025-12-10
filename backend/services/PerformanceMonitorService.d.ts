export class ServiceError extends Error {
    constructor(message: any, statusCode?: number);
    statusCode: number;
}
export declare let startTime: number;
export declare function getSystemMetrics(): Promise<{
    success: boolean;
    data: {
        cpu: {
            usage: string;
            cores: number;
            model: string;
            status: string;
        };
        memory: {
            total: string;
            used: string;
            free: string;
            usagePercent: string;
            status: string;
        };
        system: {
            platform: NodeJS.Platform;
            arch: NodeJS.Architecture;
            hostname: string;
            uptime: string;
            nodeVersion: string;
        };
        process: {
            pid: number;
            uptime: string;
            memoryUsage: {
                rss: string;
                heapTotal: string;
                heapUsed: string;
            };
        };
    };
    timestamp: string;
}>;
export declare function getApplicationMetrics(): Promise<{
    success: boolean;
    data: {
        requests: {
            total: number;
            rpm: string;
            avgResponseTime: string;
            status: string;
        };
        errors: {
            total: number;
            rate: string;
            status: string;
        };
        distribution: any;
        topEndpoints: {
            endpoint: string;
            count: any;
        }[];
        slowestEndpoints: {
            endpoint: string;
            avgTime: string;
            count: any;
        }[];
    };
    timestamp: string;
}>;
export declare function getDatabaseMetrics(): Promise<{
    success: boolean;
    data: {
        pool: any;
        database: {
            size: any;
            activeConnections: any;
        };
        queries: {
            recent: number;
            avgTime: string;
            status: string;
        };
        tables: any;
        slowQueries: any;
        unusedIndexes: any;
    };
    timestamp: string;
}>;
export declare function getAlerts(): Promise<{
    success: boolean;
    data: {
        alerts: {
            type: string;
            severity: string;
            message: string;
            threshold: number;
            current: string;
        }[];
        summary: {
            total: number;
            critical: number;
            warning: number;
        };
    };
    timestamp: string;
}>;
export declare function getDashboard(): Promise<{
    success: boolean;
    data: {
        healthScore: {
            score: number;
            status: string;
            issues: string[];
        };
        system: {
            cpu: {
                usage: string;
                cores: number;
                model: string;
                status: string;
            };
            memory: {
                total: string;
                used: string;
                free: string;
                usagePercent: string;
                status: string;
            };
            system: {
                platform: NodeJS.Platform;
                arch: NodeJS.Architecture;
                hostname: string;
                uptime: string;
                nodeVersion: string;
            };
            process: {
                pid: number;
                uptime: string;
                memoryUsage: {
                    rss: string;
                    heapTotal: string;
                    heapUsed: string;
                };
            };
        };
        application: {
            requests: {
                total: number;
                rpm: string;
                avgResponseTime: string;
                status: string;
            };
            errors: {
                total: number;
                rate: string;
                status: string;
            };
            distribution: any;
            topEndpoints: {
                endpoint: string;
                count: any;
            }[];
            slowestEndpoints: {
                endpoint: string;
                avgTime: string;
                count: any;
            }[];
        };
        database: {
            pool: any;
            database: {
                size: any;
                activeConnections: any;
            };
            queries: {
                recent: number;
                avgTime: string;
                status: string;
            };
            tables: any;
            slowQueries: any;
            unusedIndexes: any;
        };
        alerts: {
            alerts: {
                type: string;
                severity: string;
                message: string;
                threshold: number;
                current: string;
            }[];
            summary: {
                total: number;
                critical: number;
                warning: number;
            };
        };
    };
    timestamp: string;
}>;
export declare function recordRequest(data: any): void;
export declare function recordError(data: any): void;
export declare function recordQuery(data: any): void;
export declare function _formatBytes(bytes: any): string;
export declare function _formatUptime(seconds: any): string;
export declare function _calculateHealthScore(system: any, app: any, db: any): {
    score: number;
    status: string;
    issues: string[];
};
//# sourceMappingURL=PerformanceMonitorService.d.ts.map