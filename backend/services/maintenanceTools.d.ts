export class MaintenanceTools {
    maintenanceDir: string;
    reportsDir: string;
    scriptsDir: string;
    /**
     * Inicializar herramientas de mantenimiento
     */
    init(): Promise<void>;
    /**
     * Asegurar que existen los directorios necesarios
     */
    ensureDirectories(): Promise<void>;
    /**
     * Diagnóstico completo del sistema
     */
    systemDiagnostic(): Promise<{
        timestamp: string;
        system: {
            platform: NodeJS.Platform;
            architecture: NodeJS.Architecture;
            release: string;
            hostname: string;
            uptime: number;
            uptimeFormatted: string;
            loadAverage: number[];
            totalMemory: number;
            freeMemory: number;
            memoryUsage: string;
            cpuCount: number;
            cpuModel: string;
            networkInterfaces: number;
        };
        nodejs: {
            version: string;
            pid: number;
            uptime: number;
            uptimeFormatted: string;
            memoryUsage: {
                rss: number;
                heapTotal: number;
                heapUsed: number;
                external: number;
                arrayBuffers: number;
            };
            memoryUsageFormatted: {
                rss: string;
                heapTotal: string;
                heapUsed: string;
                external: string;
            };
            environment: string;
            execPath: string;
            cwd: string;
        };
        database: {
            connected: boolean;
            type: string;
            mode: string;
        } | {
            connected: boolean;
            error: any;
            type: string;
        };
        security: {
            httpsEnabled: boolean;
            certificateStatus: string;
            backupSystem: boolean;
            logSystem: boolean;
            rateLimiting: boolean;
            corsEnabled: boolean;
            helmetEnabled: boolean;
        };
        performance: {
            ioTestMs: number;
            ioTestResult: string;
            eventLoopDelay: any;
            processUptime: number;
            systemUptime: number;
            loadAverage: number[];
            memoryPressure: {
                heapPressure: number;
                systemPressure: number;
                rssToSystem: number;
            };
            error?: undefined;
        } | {
            ioTestMs: number;
            ioTestResult: string;
            error: any;
            eventLoopDelay?: undefined;
            processUptime?: undefined;
            systemUptime?: undefined;
            loadAverage?: undefined;
            memoryPressure?: undefined;
        };
        storage: {
            projectSize: number;
            backupSize: number;
            logSize: number;
            freeSpace: string;
        };
        network: {
            interfaces: {};
            interfaceCount: number;
            activeInterfaces: number;
        };
        services: {
            webServer: {
                status: string;
                port: string | number;
                uptime: number;
            };
            database: {
                status: string;
                type: string;
            };
            backup: {
                status: string;
                enabled: boolean;
            };
            ssl: {
                status: string;
                enabled: boolean;
            };
        };
        logs: {
            available: boolean;
            logFiles: number;
            totalSize: number;
            oldestLog: any;
            newestLog: any;
        };
    }>;
    /**
     * Información del sistema operativo
     */
    getSystemInfo(): Promise<{
        platform: NodeJS.Platform;
        architecture: NodeJS.Architecture;
        release: string;
        hostname: string;
        uptime: number;
        uptimeFormatted: string;
        loadAverage: number[];
        totalMemory: number;
        freeMemory: number;
        memoryUsage: string;
        cpuCount: number;
        cpuModel: string;
        networkInterfaces: number;
    }>;
    /**
     * Información de Node.js
     */
    getNodeJSInfo(): Promise<{
        version: string;
        pid: number;
        uptime: number;
        uptimeFormatted: string;
        memoryUsage: {
            rss: number;
            heapTotal: number;
            heapUsed: number;
            external: number;
            arrayBuffers: number;
        };
        memoryUsageFormatted: {
            rss: string;
            heapTotal: string;
            heapUsed: string;
            external: string;
        };
        environment: string;
        execPath: string;
        cwd: string;
    }>;
    /**
     * Información de la base de datos
     */
    getDatabaseInfo(): Promise<{
        connected: boolean;
        type: string;
        mode: string;
    } | {
        connected: boolean;
        error: any;
        type: string;
    }>;
    /**
     * Información de seguridad
     */
    getSecurityInfo(): Promise<{
        httpsEnabled: boolean;
        certificateStatus: string;
        backupSystem: boolean;
        logSystem: boolean;
        rateLimiting: boolean;
        corsEnabled: boolean;
        helmetEnabled: boolean;
    }>;
    /**
     * Información de rendimiento
     */
    getPerformanceInfo(): Promise<{
        ioTestMs: number;
        ioTestResult: string;
        eventLoopDelay: any;
        processUptime: number;
        systemUptime: number;
        loadAverage: number[];
        memoryPressure: {
            heapPressure: number;
            systemPressure: number;
            rssToSystem: number;
        };
        error?: undefined;
    } | {
        ioTestMs: number;
        ioTestResult: string;
        error: any;
        eventLoopDelay?: undefined;
        processUptime?: undefined;
        systemUptime?: undefined;
        loadAverage?: undefined;
        memoryPressure?: undefined;
    }>;
    /**
     * Información de almacenamiento
     */
    getStorageInfo(): Promise<{
        projectSize: number;
        backupSize: number;
        logSize: number;
        freeSpace: string;
    }>;
    /**
     * Información de red
     */
    getNetworkInfo(): Promise<{
        interfaces: {};
        interfaceCount: number;
        activeInterfaces: number;
    }>;
    /**
     * Información de servicios
     */
    getServicesInfo(): Promise<{
        webServer: {
            status: string;
            port: string | number;
            uptime: number;
        };
        database: {
            status: string;
            type: string;
        };
        backup: {
            status: string;
            enabled: boolean;
        };
        ssl: {
            status: string;
            enabled: boolean;
        };
    }>;
    /**
     * Información de logs
     */
    getLogsInfo(): Promise<{
        available: boolean;
        logFiles: number;
        totalSize: number;
        oldestLog: any;
        newestLog: any;
    }>;
    /**
     * Limpiar archivos temporales y cache
     */
    cleanupSystem(): Promise<{
        timestamp: string;
        cleaned: any[];
        errors: any[];
        totalSpaceFreed: number;
    }>;
    /**
     * Optimizar base de datos
     */
    optimizeDatabase(): Promise<{
        timestamp: string;
        optimizations: any[];
        errors: any[];
    }>;
    /**
     * Verificar integridad del sistema
     */
    checkSystemIntegrity(): Promise<{
        timestamp: string;
        checks: any[];
        issues: any[];
        warnings: any[];
        overall: string;
    }>;
    /**
     * Generar reporte de mantenimiento
     */
    generateMaintenanceReport(): Promise<{
        report: {
            timestamp: string;
            diagnostic: {
                timestamp: string;
                system: {
                    platform: NodeJS.Platform;
                    architecture: NodeJS.Architecture;
                    release: string;
                    hostname: string;
                    uptime: number;
                    uptimeFormatted: string;
                    loadAverage: number[];
                    totalMemory: number;
                    freeMemory: number;
                    memoryUsage: string;
                    cpuCount: number;
                    cpuModel: string;
                    networkInterfaces: number;
                };
                nodejs: {
                    version: string;
                    pid: number;
                    uptime: number;
                    uptimeFormatted: string;
                    memoryUsage: {
                        rss: number;
                        heapTotal: number;
                        heapUsed: number;
                        external: number;
                        arrayBuffers: number;
                    };
                    memoryUsageFormatted: {
                        rss: string;
                        heapTotal: string;
                        heapUsed: string;
                        external: string;
                    };
                    environment: string;
                    execPath: string;
                    cwd: string;
                };
                database: {
                    connected: boolean;
                    type: string;
                    mode: string;
                } | {
                    connected: boolean;
                    error: any;
                    type: string;
                };
                security: {
                    httpsEnabled: boolean;
                    certificateStatus: string;
                    backupSystem: boolean;
                    logSystem: boolean;
                    rateLimiting: boolean;
                    corsEnabled: boolean;
                    helmetEnabled: boolean;
                };
                performance: {
                    ioTestMs: number;
                    ioTestResult: string;
                    eventLoopDelay: any;
                    processUptime: number;
                    systemUptime: number;
                    loadAverage: number[];
                    memoryPressure: {
                        heapPressure: number;
                        systemPressure: number;
                        rssToSystem: number;
                    };
                    error?: undefined;
                } | {
                    ioTestMs: number;
                    ioTestResult: string;
                    error: any;
                    eventLoopDelay?: undefined;
                    processUptime?: undefined;
                    systemUptime?: undefined;
                    loadAverage?: undefined;
                    memoryPressure?: undefined;
                };
                storage: {
                    projectSize: number;
                    backupSize: number;
                    logSize: number;
                    freeSpace: string;
                };
                network: {
                    interfaces: {};
                    interfaceCount: number;
                    activeInterfaces: number;
                };
                services: {
                    webServer: {
                        status: string;
                        port: string | number;
                        uptime: number;
                    };
                    database: {
                        status: string;
                        type: string;
                    };
                    backup: {
                        status: string;
                        enabled: boolean;
                    };
                    ssl: {
                        status: string;
                        enabled: boolean;
                    };
                };
                logs: {
                    available: boolean;
                    logFiles: number;
                    totalSize: number;
                    oldestLog: any;
                    newestLog: any;
                };
            };
            integrity: {
                timestamp: string;
                checks: any[];
                issues: any[];
                warnings: any[];
                overall: string;
            };
            recommendations: {
                type: string;
                priority: string;
                message: string;
                action: string;
            }[];
        };
        reportPath: string;
    }>;
    /**
     * Generar recomendaciones
     */
    generateRecommendations(): {
        type: string;
        priority: string;
        message: string;
        action: string;
    }[];
    /**
     * Utilidades auxiliares
     */
    formatUptime(seconds: any): string;
    formatBytes(bytes: any, decimals?: number): string;
    getDirectorySize(dirPath: any): Promise<number>;
    measureEventLoopDelay(): Promise<any>;
    calculateMemoryPressure(): {
        heapPressure: number;
        systemPressure: number;
        rssToSystem: number;
    };
}
/**
 * Obtener instancia de herramientas de mantenimiento
 */
export function getMaintenanceTools(): any;
//# sourceMappingURL=maintenanceTools.d.ts.map