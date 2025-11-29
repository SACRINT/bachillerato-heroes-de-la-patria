/**
 * 🔌 Circuit Breaker Middleware - FASE 30.5 TAREA 6
 *
 * Propósito:
 * - Prevenir cascading failures cuando database está lento
 * - Rechazar requests en lugar de acumular en backlog
 * - Recuperación automática cuando sistema se estabiliza
 *
 * Estados:
 * - CLOSED: Sistema normal, todas las requests pasan
 * - OPEN: Sistema degradado, rechazar requests inmediatamente
 * - HALF_OPEN: Intentando recuperación, permitir algunas requests
 */

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 50;
    this.successThreshold = options.successThreshold || 5;
    this.timeout = options.timeout || 30000; // 30 segundos
    this.monitoringInterval = options.monitoringInterval || 10000; // 10 segundos

    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;

    // Métricas para monitoring
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      stateChanges: []
    };

    // Iniciar monitoreo de salud del sistema
    this.startHealthMonitoring();
  }

  /**
   * Ejecutar función con protección de circuit breaker
   */
  async execute(fn, options = {}) {
    const startTime = Date.now();

    // Registrar request
    this.metrics.totalRequests++;

    // Si el circuit está OPEN, rechazar inmediatamente
    if (this.state === 'OPEN') {
      this.metrics.rejectedRequests++;
      const error = new Error('Service Unavailable - Circuit breaker OPEN');
      error.statusCode = 503;
      throw error;
    }

    try {
      const result = await Promise.race([
        fn(),
        this.createTimeout(options.timeout || 10000)
      ]);

      // Request exitoso
      this.recordSuccess();
      this.metrics.successfulRequests++;

      return result;
    } catch (error) {
      // Request fallido
      this.recordFailure(error);
      this.metrics.failedRequests++;
      throw error;
    }
  }

  /**
   * Registrar éxito y potencialmente cambiar estado de HALF_OPEN a CLOSED
   */
  recordSuccess() {
    this.failureCount = 0;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;

      if (this.successCount >= this.successThreshold) {
        this.changeState('CLOSED');
        this.successCount = 0;
      }
    }
  }

  /**
   * Registrar fallo y potencialmente cambiar estado de CLOSED a OPEN
   */
  recordFailure(error) {
    this.lastFailureTime = Date.now();

    if (this.state === 'CLOSED') {
      this.failureCount++;

      if (this.failureCount >= this.failureThreshold) {
        this.changeState('OPEN');
      }
    } else if (this.state === 'HALF_OPEN') {
      // Un fallo en HALF_OPEN vuelve a OPEN
      this.changeState('OPEN');
      this.successCount = 0;
    }
  }

  /**
   * Cambiar estado del circuit breaker
   */
  changeState(newState) {
    const oldState = this.state;
    this.state = newState;

    const timestamp = new Date().toISOString();
    this.metrics.stateChanges.push({
      from: oldState,
      to: newState,
      timestamp,
      failureCount: this.failureCount,
      timestamp_ms: Date.now()
    });

    console.log(`[CIRCUIT-BREAKER] Estado cambió: ${oldState} → ${newState} (${timestamp})`);

    if (newState === 'OPEN') {
      console.log(`[CIRCUIT-BREAKER] ⚠️  CIRCUITO ABIERTO - Rechazando requests por ${this.timeout / 1000}s`);

      // Programar cambio a HALF_OPEN
      setTimeout(() => {
        if (this.state === 'OPEN') {
          this.changeState('HALF_OPEN');
          console.log('[CIRCUIT-BREAKER] 🔄 Intentando recuperación...');
        }
      }, this.timeout);
    }
  }

  /**
   * Crear timeout promise
   */
  createTimeout(ms) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        const error = new Error(`Timeout after ${ms}ms`);
        error.code = 'ETIMEDOUT';
        reject(error);
      }, ms);
    });
  }

  /**
   * Monitorear salud del sistema y ajustar umbrales dinámicamente
   */
  startHealthMonitoring() {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

      // Si memoria >85%, reducir threshold para abrir circuit más rápido
      if (heapUsedPercent > 85) {
        this.failureThreshold = Math.max(20, this.failureThreshold - 5);
        console.log(`[CIRCUIT-BREAKER] ⚠️  Memoria alta (${heapUsedPercent.toFixed(1)}%) - Reduciendo threshold a ${this.failureThreshold}`);
      }

      // Si memoria <50%, aumentar threshold gradualmente
      if (heapUsedPercent < 50 && this.state === 'CLOSED') {
        this.failureThreshold = Math.min(50, this.failureThreshold + 2);
      }

      // Log de estado cada 30 segundos si hay cambios
      if (this.metrics.totalRequests % 300 === 0) {
        this.logMetrics();
      }
    }, this.monitoringInterval);
  }

  /**
   * Obtener métricas actuales
   */
  getMetrics() {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
      state: this.state,
      uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
      memory: {
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB`,
        heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(1)}MB`,
        percentage: `${((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1)}%`
      },
      requests: {
        total: this.metrics.totalRequests,
        successful: this.metrics.successfulRequests,
        failed: this.metrics.failedRequests,
        rejected: this.metrics.rejectedRequests,
        successRate: `${((this.metrics.successfulRequests / Math.max(1, this.metrics.totalRequests - this.metrics.rejectedRequests)) * 100).toFixed(1)}%`
      },
      thresholds: {
        failureThreshold: this.failureThreshold,
        successThreshold: this.successThreshold,
        timeout: `${this.timeout}ms`
      },
      recentStateChanges: this.metrics.stateChanges.slice(-5)
    };
  }

  /**
   * Log de métricas para debugging
   */
  logMetrics() {
    const metrics = this.getMetrics();
    console.log('[CIRCUIT-BREAKER] 📊 Métricas:', JSON.stringify(metrics, null, 2));
  }

  /**
   * Reset manual del circuit breaker (para testing)
   */
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    console.log('[CIRCUIT-BREAKER] 🔄 Circuit breaker reseteado');
  }
}

/**
 * Middleware de Express para circuit breaker
 */
function createCircuitBreakerMiddleware(options = {}) {
  const circuitBreaker = new CircuitBreaker(options);

  return {
    // Middleware para proteger endpoints
    middleware: (req, res, next) => {
      // Agregar métodos al request para usar circuit breaker
      req.circuitBreaker = circuitBreaker;

      // Si circuit está OPEN, rechazar inmediatamente
      if (circuitBreaker.state === 'OPEN') {
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'The service is temporarily unavailable due to high load or errors',
          state: circuitBreaker.state,
          retryAfter: circuitBreaker.timeout / 1000
        });
      }

      next();
    },

    // Endpoint para obtener métricas
    metricsEndpoint: (req, res) => {
      res.json(circuitBreaker.getMetrics());
    },

    // Objeto del circuit breaker para usar directamente
    circuitBreaker
  };
}

module.exports = {
  CircuitBreaker,
  createCircuitBreakerMiddleware
};
