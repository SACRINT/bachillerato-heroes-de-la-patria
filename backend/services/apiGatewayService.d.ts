declare const _exports: APIGatewayService;
export = _exports;
declare class APIGatewayService {
    services: Map<any, any>;
    circuitBreakers: Map<any, any>;
    defaultTimeout: number;
    registerService(name: any, config: any): void;
    aggregate(requests: any): Promise<{}>;
    executeRequest(request: any): Promise<any>;
    callService(config: any, endpoint: any, method: any, data: any): Promise<any>;
    compose(pipeline: any): Promise<{}>;
    getCircuitBreakerStatus(service: any): any;
    getServiceStatus(): {};
    resetCircuitBreaker(service: any): void;
}
//# sourceMappingURL=apiGatewayService.d.ts.map