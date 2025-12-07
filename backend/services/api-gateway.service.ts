/**
 * 🚀 API GATEWAY SERVICE - TypeScript Version
 * Agregación y orquestación de APIs con circuit breaker
 * Migrado: 07 Diciembre 2025
 */

import devLogger from '../utils/devLogger';

// ==================== INTERFACES ====================

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

// ==================== API GATEWAY SERVICE ====================

class APIGatewayService {
    private services: Map<string, ServiceConfig>;
    private circuitBreakers: Map<string, CircuitBreaker>;
    private defaultTimeout: number;

    constructor() {
        this.services = new Map();
        this.circuitBreakers = new Map();
        this.defaultTimeout = 5000;
    }

    /**
     * Registrar un servicio en el gateway
     */
    registerService(name: string, config: Partial<ServiceConfig>): void {
        this.services.set(name, {
            name,
            baseUrl: config.baseUrl || '',
            timeout: config.timeout || this.defaultTimeout,
            retries: config.retries || 3,
            healthCheck: config.healthCheck || '/health'
        });

        this.circuitBreakers.set(name, {
            failures: 0,
            lastFailure: null,
            state: 'closed',
            threshold: 5,
            resetTimeout: 30000
        });

        devLogger.log(`[API-GATEWAY] Servicio "${name}" registrado`);
    }

    /**
     * Agregar múltiples requests en paralelo
     */
    async aggregate(requests: GatewayRequest[]): Promise<Record<string, any>> {
        devLogger.log(`[API-GATEWAY] Agregando ${requests.length} requests`);

        const results = await Promise.allSettled(
            requests.map(req => this.executeRequest(req))
        );

        const aggregated: Record<string, any> = {};
        results.forEach((result, index) => {
            const key = requests[index].key || `result_${index}`;
            if (result.status === 'fulfilled') {
                aggregated[key] = result.value;
            } else {
                aggregated[key] = { error: result.reason.message };
            }
        });

        return aggregated;
    }

    /**
     * Ejecutar una request con circuit breaker
     */
    async executeRequest(request: GatewayRequest): Promise<any> {
        const { service, endpoint, method = 'GET', data, transform } = request;

        const breaker = this.circuitBreakers.get(service);
        if (breaker && breaker.state === 'open') {
            if (breaker.lastFailure && Date.now() - breaker.lastFailure > breaker.resetTimeout) {
                breaker.state = 'half-open';
            } else {
                throw new Error(`Servicio "${service}" no disponible (circuit open)`);
            }
        }

        const serviceConfig = this.services.get(service);
        if (!serviceConfig) {
            throw new Error(`Servicio "${service}" no registrado`);
        }

        try {
            const response = await this.callService(serviceConfig, endpoint, method, data);

            if (breaker) {
                breaker.failures = 0;
                breaker.state = 'closed';
            }

            if (transform && typeof transform === 'function') {
                return transform(response);
            }

            return response;
        } catch (error: any) {
            if (breaker) {
                breaker.failures++;
                breaker.lastFailure = Date.now();
                if (breaker.failures >= breaker.threshold) {
                    breaker.state = 'open';
                    devLogger.warn(`[API-GATEWAY] Circuit breaker OPEN para "${service}"`);
                }
            }
            throw error;
        }
    }

    /**
     * Llamar a un servicio (simulado)
     */
    private async callService(config: ServiceConfig, endpoint: string, method: string, data: any): Promise<any> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    service: config.name,
                    endpoint,
                    method,
                    data: data || null,
                    timestamp: new Date().toISOString()
                });
            }, 100);
        });
    }

    /**
     * Composición de APIs en pipeline
     */
    async compose(pipeline: PipelineStep[]): Promise<Record<string, any>> {
        devLogger.log(`[API-GATEWAY] Ejecutando pipeline de ${pipeline.length} pasos`);

        let context: Record<string, any> = {};

        for (const step of pipeline) {
            const { name, request, condition, transform } = step;

            if (condition && !condition(context)) {
                devLogger.log(`[API-GATEWAY] Paso "${name}" saltado por condición`);
                continue;
            }

            const actualRequest = typeof request === 'function' ? request(context) : request;
            const result = await this.executeRequest(actualRequest);
            context[name] = transform ? transform(result, context) : result;
        }

        return context;
    }

    getCircuitBreakerStatus(service: string): CircuitBreaker | null {
        return this.circuitBreakers.get(service) || null;
    }

    getServiceStatus(): Record<string, ServiceStatus> {
        const status: Record<string, ServiceStatus> = {};
        for (const [name, config] of this.services) {
            const breaker = this.circuitBreakers.get(name);
            status[name] = {
                ...config,
                circuitState: breaker ? breaker.state : 'unknown',
                failures: breaker ? breaker.failures : 0
            };
        }
        return status;
    }

    resetCircuitBreaker(service: string): void {
        const breaker = this.circuitBreakers.get(service);
        if (breaker) {
            breaker.failures = 0;
            breaker.state = 'closed';
            breaker.lastFailure = null;
            devLogger.log(`[API-GATEWAY] Circuit breaker reseteado para "${service}"`);
        }
    }
}

// ==================== EXPORTS ====================

const apiGatewayService = new APIGatewayService();
export default apiGatewayService;
export { APIGatewayService, GatewayRequest, ServiceConfig, CircuitBreaker };
