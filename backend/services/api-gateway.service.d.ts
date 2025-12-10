/**
 * 🚀 API GATEWAY SERVICE - TypeScript Version
 * Agregación y orquestación de APIs con circuit breaker
 * Migrado: 07 Diciembre 2025
 */
interface ServiceConfig {
    name: string;
    baseUrl: string;
    timeout: number;
    retries: number;
    healthCheck: string;
}
interface CircuitBreaker {
    failures: number;
    lastFailure: number | null;
    state: 'closed' | 'open' | 'half-open';
    threshold: number;
    resetTimeout: number;
}
interface GatewayRequest {
    service: string;
    endpoint: string;
    method?: string;
    data?: any;
    key?: string;
    transform?: (response: any) => any;
}
interface PipelineStep {
    name: string;
    request: GatewayRequest | ((context: any) => GatewayRequest);
    condition?: (context: any) => boolean;
    transform?: (result: any, context: any) => any;
}
interface ServiceStatus {
    name: string;
    baseUrl: string;
    timeout: number;
    retries: number;
    healthCheck: string;
    circuitState: string;
    failures: number;
}
declare class APIGatewayService {
    private services;
    private circuitBreakers;
    private defaultTimeout;
    constructor();
    /**
     * Registrar un servicio en el gateway
     */
    registerService(name: string, config: Partial<ServiceConfig>): void;
    /**
     * Agregar múltiples requests en paralelo
     */
    aggregate(requests: GatewayRequest[]): Promise<Record<string, any>>;
    /**
     * Ejecutar una request con circuit breaker
     */
    executeRequest(request: GatewayRequest): Promise<any>;
    /**
     * Llamar a un servicio (simulado)
     */
    private callService;
    /**
     * Composición de APIs en pipeline
     */
    compose(pipeline: PipelineStep[]): Promise<Record<string, any>>;
    getCircuitBreakerStatus(service: string): CircuitBreaker | null;
    getServiceStatus(): Record<string, ServiceStatus>;
    resetCircuitBreaker(service: string): void;
}
declare const apiGatewayService: APIGatewayService;
export default apiGatewayService;
export { APIGatewayService, GatewayRequest, ServiceConfig, CircuitBreaker };
//# sourceMappingURL=api-gateway.service.d.ts.map