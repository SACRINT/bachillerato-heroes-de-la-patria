"use strict";
/**
 * 🚀 API GATEWAY SERVICE - TypeScript Version
 * Agregación y orquestación de APIs con circuit breaker
 * Migrado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIGatewayService = void 0;
const devLogger_1 = __importDefault(require('../utils/devLogger.js'));
// ==================== API GATEWAY SERVICE ====================
class APIGatewayService {
    constructor() {
        this.services = new Map();
        this.circuitBreakers = new Map();
        this.defaultTimeout = 5000;
    }
    /**
     * Registrar un servicio en el gateway
     */
    registerService(name, config) {
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
        devLogger_1.default.log(`[API-GATEWAY] Servicio "${name}" registrado`);
    }
    /**
     * Agregar múltiples requests en paralelo
     */
    async aggregate(requests) {
        devLogger_1.default.log(`[API-GATEWAY] Agregando ${requests.length} requests`);
        const results = await Promise.allSettled(requests.map(req => this.executeRequest(req)));
        const aggregated = {};
        results.forEach((result, index) => {
            const key = requests[index].key || `result_${index}`;
            if (result.status === 'fulfilled') {
                aggregated[key] = result.value;
            }
            else {
                aggregated[key] = { error: result.reason.message };
            }
        });
        return aggregated;
    }
    /**
     * Ejecutar una request con circuit breaker
     */
    async executeRequest(request) {
        const { service, endpoint, method = 'GET', data, transform } = request;
        const breaker = this.circuitBreakers.get(service);
        if (breaker && breaker.state === 'open') {
            if (breaker.lastFailure && Date.now() - breaker.lastFailure > breaker.resetTimeout) {
                breaker.state = 'half-open';
            }
            else {
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
        }
        catch (error) {
            if (breaker) {
                breaker.failures++;
                breaker.lastFailure = Date.now();
                if (breaker.failures >= breaker.threshold) {
                    breaker.state = 'open';
                    devLogger_1.default.warn(`[API-GATEWAY] Circuit breaker OPEN para "${service}"`);
                }
            }
            throw error;
        }
    }
    /**
     * Llamar a un servicio (simulado)
     */
    async callService(config, endpoint, method, data) {
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
    async compose(pipeline) {
        devLogger_1.default.log(`[API-GATEWAY] Ejecutando pipeline de ${pipeline.length} pasos`);
        let context = {};
        for (const step of pipeline) {
            const { name, request, condition, transform } = step;
            if (condition && !condition(context)) {
                devLogger_1.default.log(`[API-GATEWAY] Paso "${name}" saltado por condición`);
                continue;
            }
            const actualRequest = typeof request === 'function' ? request(context) : request;
            const result = await this.executeRequest(actualRequest);
            context[name] = transform ? transform(result, context) : result;
        }
        return context;
    }
    getCircuitBreakerStatus(service) {
        return this.circuitBreakers.get(service) || null;
    }
    getServiceStatus() {
        const status = {};
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
    resetCircuitBreaker(service) {
        const breaker = this.circuitBreakers.get(service);
        if (breaker) {
            breaker.failures = 0;
            breaker.state = 'closed';
            breaker.lastFailure = null;
            devLogger_1.default.log(`[API-GATEWAY] Circuit breaker reseteado para "${service}"`);
        }
    }
}
exports.APIGatewayService = APIGatewayService;
// ==================== EXPORTS ====================
const apiGatewayService = new APIGatewayService();
exports.default = apiGatewayService;
//# sourceMappingURL=api-gateway.service.js.map