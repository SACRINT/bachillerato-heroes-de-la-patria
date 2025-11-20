/**
 * 🚀 API GATEWAY SERVICE - SEMANA 21
 * Agregación y orquestación de APIs
 *
 * Features:
 * - Request aggregation
 * - Response transformation
 * - Circuit breaker
 * - Load balancing
 * - API composition
 *
 * Fecha: 20 Noviembre 2025
 */

const devLogger = require('../utils/devLogger');

class APIGatewayService {
  constructor() {
    this.services = new Map();
    this.circuitBreakers = new Map();
    this.defaultTimeout = 5000;
  }

  registerService(name, config) {
    this.services.set(name, {
      name,
      baseUrl: config.baseUrl || '',
      timeout: config.timeout || this.defaultTimeout,
      retries: config.retries || 3,
      healthCheck: config.healthCheck || '/health'
    });

    // Inicializar circuit breaker
    this.circuitBreakers.set(name, {
      failures: 0,
      lastFailure: null,
      state: 'closed', // closed, open, half-open
      threshold: 5,
      resetTimeout: 30000
    });

    devLogger.log(`[API-GATEWAY] Servicio "${name}" registrado`);
  }

  async aggregate(requests) {
    devLogger.log(`[API-GATEWAY] Agregando ${requests.length} requests`);

    const results = await Promise.allSettled(
      requests.map(req => this.executeRequest(req))
    );

    const aggregated = {};
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

  async executeRequest(request) {
    const { service, endpoint, method = 'GET', data, transform } = request;

    // Verificar circuit breaker
    const breaker = this.circuitBreakers.get(service);
    if (breaker && breaker.state === 'open') {
      if (Date.now() - breaker.lastFailure > breaker.resetTimeout) {
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
      // Simular llamada al servicio (en producción usar fetch/axios)
      const response = await this.callService(serviceConfig, endpoint, method, data);

      // Reset circuit breaker on success
      if (breaker) {
        breaker.failures = 0;
        breaker.state = 'closed';
      }

      // Transformar respuesta si se especifica
      if (transform && typeof transform === 'function') {
        return transform(response);
      }

      return response;

    } catch (error) {
      // Incrementar failures en circuit breaker
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

  async callService(config, endpoint, method, data) {
    // Implementación simulada - en producción usar fetch real
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

  // Composición de APIs
  async compose(pipeline) {
    devLogger.log(`[API-GATEWAY] Ejecutando pipeline de ${pipeline.length} pasos`);

    let context = {};

    for (const step of pipeline) {
      const { name, request, condition, transform } = step;

      // Evaluar condición
      if (condition && !condition(context)) {
        devLogger.log(`[API-GATEWAY] Paso "${name}" saltado por condición`);
        continue;
      }

      // Ejecutar request (puede usar datos de contexto)
      const actualRequest = typeof request === 'function'
        ? request(context)
        : request;

      const result = await this.executeRequest(actualRequest);

      // Transformar y agregar a contexto
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
      devLogger.log(`[API-GATEWAY] Circuit breaker reseteado para "${service}"`);
    }
  }
}

module.exports = new APIGatewayService();
