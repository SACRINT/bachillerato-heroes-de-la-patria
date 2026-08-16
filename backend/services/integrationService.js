/**
 * 🔗 INTEGRATION SERVICE - SEMANA 24
 * Integración y orquestación final del sistema
 *
 * Features:
 * - Health aggregation
 * - Service discovery
 * - Configuration sync
 * - Dependency injection
 * - System status
 *
 * Fecha: 20 Noviembre 2025
 */

const devLogger = require('../utils/devLogger.js');

class IntegrationService {
  constructor() {
    this.services = new Map();
    this.dependencies = new Map();
    this.healthChecks = new Map();
    this.config = {};
  }

  // Registrar servicio
  register(name, service, options = {}) {
    this.services.set(name, {
      instance: service,
      version: options.version || '1.0.0',
      dependencies: options.dependencies || [],
      healthCheck: options.healthCheck || null,
      status: 'registered'
    });

    // Registrar dependencias
    if (options.dependencies) {
      this.dependencies.set(name, options.dependencies);
    }

    devLogger.log(`[INTEGRATION] Servicio "${name}" registrado v${options.version || '1.0.0'}`);

    return this;
  }

  // Obtener servicio
  get(name) {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Servicio "${name}" no encontrado`);
    }
    return service.instance;
  }

  // Verificar dependencias
  checkDependencies(name) {
    const deps = this.dependencies.get(name) || [];
    const missing = [];

    for (const dep of deps) {
      if (!this.services.has(dep)) {
        missing.push(dep);
      }
    }

    return {
      satisfied: missing.length === 0,
      missing
    };
  }

  // Health check agregado
  async getSystemHealth() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {}
    };

    for (const [name, service] of this.services) {
      try {
        if (service.healthCheck) {
          const result = await service.healthCheck();
          health.services[name] = {
            status: result.status || 'healthy',
            ...result
          };
        } else {
          health.services[name] = {
            status: 'unknown',
            message: 'Sin health check configurado'
          };
        }
      } catch (error) {
        health.services[name] = {
          status: 'unhealthy',
          error: error.message
        };
        health.status = 'degraded';
      }
    }

    // Verificar dependencias
    for (const [name] of this.services) {
      const depCheck = this.checkDependencies(name);
      if (!depCheck.satisfied) {
        health.services[name].dependencies = {
          status: 'missing',
          missing: depCheck.missing
        };
        health.status = 'degraded';
      }
    }

    return health;
  }

  // Configuración centralizada
  setConfig(key, value) {
    this.config[key] = value;
    devLogger.log(`[INTEGRATION] Config "${key}" actualizada`);
  }

  getConfig(key, defaultValue = null) {
    return this.config[key] !== undefined ? this.config[key] : defaultValue;
  }

  // Estado del sistema
  getSystemStatus() {
    const services = [];

    for (const [name, service] of this.services) {
      const depCheck = this.checkDependencies(name);
      services.push({
        name,
        version: service.version,
        status: service.status,
        dependencies: {
          required: this.dependencies.get(name) || [],
          satisfied: depCheck.satisfied,
          missing: depCheck.missing
        }
      });
    }

    return {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      uptime: process.uptime(),
      services,
      config: Object.keys(this.config)
    };
  }

  // Inicializar todos los servicios
  async initialize() {
    devLogger.log('[INTEGRATION] Inicializando sistema...');

    // Ordenar por dependencias
    const order = this.getInitializationOrder();

    for (const name of order) {
      const service = this.services.get(name);

      // Verificar dependencias
      const depCheck = this.checkDependencies(name);
      if (!depCheck.satisfied) {
        devLogger.error(`[INTEGRATION] "${name}" tiene dependencias faltantes:`, depCheck.missing);
        service.status = 'failed';
        continue;
      }

      // Inicializar si tiene método init
      if (service.instance.init && typeof service.instance.init === 'function') {
        try {
          await service.instance.init();
          service.status = 'initialized';
          devLogger.log(`[INTEGRATION] "${name}" inicializado`);
        } catch (error) {
          service.status = 'failed';
          devLogger.error(`[INTEGRATION] Error inicializando "${name}":`, error.message);
        }
      } else {
        service.status = 'ready';
      }
    }

    devLogger.log('[INTEGRATION] Sistema inicializado');
  }

  // Orden de inicialización basado en dependencias
  getInitializationOrder() {
    const order = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (name) => {
      if (visited.has(name)) return;
      if (visiting.has(name)) {
        throw new Error(`Dependencia circular detectada: ${name}`);
      }

      visiting.add(name);

      const deps = this.dependencies.get(name) || [];
      for (const dep of deps) {
        if (this.services.has(dep)) {
          visit(dep);
        }
      }

      visiting.delete(name);
      visited.add(name);
      order.push(name);
    };

    for (const name of this.services.keys()) {
      visit(name);
    }

    return order;
  }

  // Shutdown graceful
  async shutdown() {
    devLogger.log('[INTEGRATION] Iniciando shutdown...');

    // Shutdown en orden inverso
    const order = this.getInitializationOrder().reverse();

    for (const name of order) {
      const service = this.services.get(name);

      if (service.instance.shutdown && typeof service.instance.shutdown === 'function') {
        try {
          await service.instance.shutdown();
          devLogger.log(`[INTEGRATION] "${name}" shutdown completado`);
        } catch (error) {
          devLogger.error(`[INTEGRATION] Error en shutdown de "${name}":`, error.message);
        }
      }
    }

    devLogger.log('[INTEGRATION] Shutdown completado');
  }

  // Listar servicios
  list() {
    const list = [];
    for (const [name, service] of this.services) {
      list.push({
        name,
        version: service.version,
        status: service.status,
        hasMethods: {
          init: typeof service.instance.init === 'function',
          shutdown: typeof service.instance.shutdown === 'function',
          healthCheck: service.healthCheck !== null
        }
      });
    }
    return list;
  }
}

module.exports = new IntegrationService();
