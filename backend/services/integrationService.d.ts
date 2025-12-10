declare const _exports: IntegrationService;
export = _exports;
declare class IntegrationService {
    services: Map<any, any>;
    dependencies: Map<any, any>;
    healthChecks: Map<any, any>;
    config: {};
    register(name: any, service: any, options?: {}): this;
    get(name: any): any;
    checkDependencies(name: any): {
        satisfied: boolean;
        missing: any[];
    };
    getSystemHealth(): Promise<{
        status: string;
        timestamp: string;
        services: {};
    }>;
    setConfig(key: any, value: any): void;
    getConfig(key: any, defaultValue?: any): any;
    getSystemStatus(): {
        timestamp: string;
        environment: string;
        nodeVersion: string;
        uptime: number;
        services: {
            name: any;
            version: any;
            status: any;
            dependencies: {
                required: any;
                satisfied: boolean;
                missing: any[];
            };
        }[];
        config: string[];
    };
    initialize(): Promise<void>;
    getInitializationOrder(): any[];
    shutdown(): Promise<void>;
    list(): {
        name: any;
        version: any;
        status: any;
        hasMethods: {
            init: boolean;
            shutdown: boolean;
            healthCheck: boolean;
        };
    }[];
}
//# sourceMappingURL=integrationService.d.ts.map