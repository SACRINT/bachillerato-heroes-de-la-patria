/**
 * 📊 PERFORMANCE MONITOR SERVICE - v1.0.0
 * Servicio de monitoreo de rendimiento del sistema
 *
 * SEMANA 23 - Plan 24 Semanas
 * Fecha: 19 Noviembre 2025
 *
 * Features:
 * - Métricas de sistema (CPU, memoria, disco)
 * - Métricas de aplicación (requests, latencia)
 * - Métricas de base de datos (queries, conexiones)
 * - Alertas y thresholds
 * - Dashboard de rendimiento
 */

const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger');
const os = require('os');

/**
 * Clase de error personalizada
 */
class ServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
  }
}

// Almacenamiento en memoria para métricas
const metricsStore = {
  requests: [],
  errors: [],
  queries: [],
  maxEntries: 1000
};

// Thresholds de alertas
const THRESHOLDS = {
  cpu: 80,           // %
  memory: 85,        // %
  responseTime: 2000, // ms
  errorRate: 5,      // %
  queryTime: 1000    // ms
};

class PerformanceMonitorService {
  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Obtener métricas del sistema
   * @returns {Promise<Object>} Métricas del sistema
   */
  async getSystemMetrics() {
    devLogger.log('[PerformanceMonitor] Obteniendo métricas del sistema');

    try {
      const cpus = os.cpus();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;

      // Calcular uso de CPU
      const cpuUsage = cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
        const idle = cpu.times.idle;
        return acc + ((total - idle) / total * 100);
      }, 0) / cpus.length;

      const metrics = {
        cpu: {
          usage: cpuUsage.toFixed(2),
          cores: cpus.length,
          model: cpus[0]?.model || 'Unknown',
          status: cpuUsage > THRESHOLDS.cpu ? 'warning' : 'ok'
        },
        memory: {
          total: this._formatBytes(totalMemory),
          used: this._formatBytes(usedMemory),
          free: this._formatBytes(freeMemory),
          usagePercent: ((usedMemory / totalMemory) * 100).toFixed(2),
          status: (usedMemory / totalMemory * 100) > THRESHOLDS.memory ? 'warning' : 'ok'
        },
        system: {
          platform: os.platform(),
          arch: os.arch(),
          hostname: os.hostname(),
          uptime: this._formatUptime(os.uptime()),
          nodeVersion: process.version
        },
        process: {
          pid: process.pid,
          uptime: this._formatUptime((Date.now() - this.startTime) / 1000),
          memoryUsage: {
            rss: this._formatBytes(process.memoryUsage().rss),
            heapTotal: this._formatBytes(process.memoryUsage().heapTotal),
            heapUsed: this._formatBytes(process.memoryUsage().heapUsed)
          }
        }
      };

      return {
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      devLogger.error('[PerformanceMonitor] Error en métricas del sistema:', error.message);
      throw new ServiceError('Error al obtener métricas del sistema', 500);
    }
  }

  /**
   * Obtener métricas de la aplicación
   * @returns {Promise<Object>} Métricas de la aplicación
   */
  async getApplicationMetrics() {
    devLogger.log('[PerformanceMonitor] Obteniendo métricas de aplicación');

    try {
      const now = Date.now();
      const lastHour = now - (60 * 60 * 1000);
      const last5Min = now - (5 * 60 * 1000);

      // Filtrar requests por tiempo
      const recentRequests = metricsStore.requests.filter(r => r.timestamp > lastHour);
      const last5MinRequests = recentRequests.filter(r => r.timestamp > last5Min);

      // Calcular métricas
      const totalRequests = recentRequests.length;
      const avgResponseTime = recentRequests.length > 0
        ? recentRequests.reduce((acc, r) => acc + r.duration, 0) / recentRequests.length
        : 0;

      const errorCount = metricsStore.errors.filter(e => e.timestamp > lastHour).length;
      const errorRate = totalRequests > 0 ? (errorCount / totalRequests * 100) : 0;

      // Requests por minuto (últimos 5 min)
      const rpm = last5MinRequests.length / 5;

      // Distribución de status codes
      const statusDistribution = recentRequests.reduce((acc, r) => {
        const key = `${Math.floor(r.status / 100)}xx`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      // Top endpoints por requests
      const endpointCounts = recentRequests.reduce((acc, r) => {
        acc[r.endpoint] = (acc[r.endpoint] || 0) + 1;
        return acc;
      }, {});

      const topEndpoints = Object.entries(endpointCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([endpoint, count]) => ({ endpoint, count }));

      // Endpoints más lentos
      const endpointTimes = {};
      recentRequests.forEach(r => {
        if (!endpointTimes[r.endpoint]) {
          endpointTimes[r.endpoint] = [];
        }
        endpointTimes[r.endpoint].push(r.duration);
      });

      const slowestEndpoints = Object.entries(endpointTimes)
        .map(([endpoint, times]) => ({
          endpoint,
          avgTime: times.reduce((a, b) => a + b, 0) / times.length,
          count: times.length
        }))
        .sort((a, b) => b.avgTime - a.avgTime)
        .slice(0, 10);

      const metrics = {
        requests: {
          total: totalRequests,
          rpm: rpm.toFixed(2),
          avgResponseTime: avgResponseTime.toFixed(2),
          status: avgResponseTime > THRESHOLDS.responseTime ? 'warning' : 'ok'
        },
        errors: {
          total: errorCount,
          rate: errorRate.toFixed(2),
          status: errorRate > THRESHOLDS.errorRate ? 'warning' : 'ok'
        },
        distribution: statusDistribution,
        topEndpoints,
        slowestEndpoints: slowestEndpoints.map(e => ({
          endpoint: e.endpoint,
          avgTime: e.avgTime.toFixed(2),
          count: e.count
        }))
      };

      return {
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      devLogger.error('[PerformanceMonitor] Error en métricas de aplicación:', error.message);
      throw new ServiceError('Error al obtener métricas de aplicación', 500);
    }
  }

  /**
   * Obtener métricas de base de datos
   * @returns {Promise<Object>} Métricas de BD
   */
  async getDatabaseMetrics() {
    devLogger.log('[PerformanceMonitor] Obteniendo métricas de BD');

    try {
      // Estadísticas de conexión del pool
      const poolStats = {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      };

      // Tamaño de la base de datos
      const dbSizeQuery = `
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `;
      const dbSize = await pool.query(dbSizeQuery);

      // Conexiones activas
      const connectionsQuery = `
        SELECT count(*) as active_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;
      const connections = await pool.query(connectionsQuery);

      // Queries más lentas (si pg_stat_statements está habilitado)
      let slowQueries = [];
      try {
        const slowQueriesQuery = `
          SELECT
            query,
            calls,
            mean_exec_time,
            total_exec_time
          FROM pg_stat_statements
          ORDER BY mean_exec_time DESC
          LIMIT 10
        `;
        const slowResult = await pool.query(slowQueriesQuery);
        slowQueries = slowResult.rows.map(q => ({
          query: q.query.substring(0, 100) + '...',
          calls: q.calls,
          avgTime: parseFloat(q.mean_exec_time).toFixed(2),
          totalTime: parseFloat(q.total_exec_time).toFixed(2)
        }));
      } catch {
        // pg_stat_statements no disponible
        devLogger.log('[PerformanceMonitor] pg_stat_statements no disponible');
      }

      // Estadísticas de tablas
      const tableStatsQuery = `
        SELECT
          relname as table_name,
          n_live_tup as row_count,
          n_dead_tup as dead_rows,
          pg_size_pretty(pg_total_relation_size(relid)) as total_size
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
        LIMIT 10
      `;
      const tableStats = await pool.query(tableStatsQuery);

      // Índices no utilizados
      const unusedIndexesQuery = `
        SELECT
          schemaname,
          relname as table_name,
          indexrelname as index_name,
          idx_scan as scans
        FROM pg_stat_user_indexes
        WHERE idx_scan = 0
        LIMIT 10
      `;
      const unusedIndexes = await pool.query(unusedIndexesQuery);

      // Métricas de queries recientes
      const recentQueries = metricsStore.queries.filter(
        q => q.timestamp > Date.now() - (60 * 60 * 1000)
      );
      const avgQueryTime = recentQueries.length > 0
        ? recentQueries.reduce((acc, q) => acc + q.duration, 0) / recentQueries.length
        : 0;

      const metrics = {
        pool: poolStats,
        database: {
          size: dbSize.rows[0]?.size || 'N/A',
          activeConnections: parseInt(connections.rows[0]?.active_connections || 0)
        },
        queries: {
          recent: recentQueries.length,
          avgTime: avgQueryTime.toFixed(2),
          status: avgQueryTime > THRESHOLDS.queryTime ? 'warning' : 'ok'
        },
        tables: tableStats.rows.map(t => ({
          name: t.table_name,
          rows: parseInt(t.row_count),
          deadRows: parseInt(t.dead_rows),
          size: t.total_size
        })),
        slowQueries,
        unusedIndexes: unusedIndexes.rows
      };

      return {
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      devLogger.error('[PerformanceMonitor] Error en métricas de BD:', error.message);
      throw new ServiceError('Error al obtener métricas de base de datos', 500);
    }
  }

  /**
   * Obtener alertas activas
   * @returns {Promise<Object>} Alertas
   */
  async getAlerts() {
    devLogger.log('[PerformanceMonitor] Verificando alertas');

    try {
      const alerts = [];

      // Verificar métricas del sistema
      const systemMetrics = await this.getSystemMetrics();
      const appMetrics = await this.getApplicationMetrics();
      const dbMetrics = await this.getDatabaseMetrics();

      // Alerta de CPU
      if (parseFloat(systemMetrics.data.cpu.usage) > THRESHOLDS.cpu) {
        alerts.push({
          type: 'system',
          severity: 'warning',
          message: `Alto uso de CPU: ${systemMetrics.data.cpu.usage}%`,
          threshold: THRESHOLDS.cpu,
          current: systemMetrics.data.cpu.usage
        });
      }

      // Alerta de memoria
      if (parseFloat(systemMetrics.data.memory.usagePercent) > THRESHOLDS.memory) {
        alerts.push({
          type: 'system',
          severity: 'warning',
          message: `Alto uso de memoria: ${systemMetrics.data.memory.usagePercent}%`,
          threshold: THRESHOLDS.memory,
          current: systemMetrics.data.memory.usagePercent
        });
      }

      // Alerta de tiempo de respuesta
      if (parseFloat(appMetrics.data.requests.avgResponseTime) > THRESHOLDS.responseTime) {
        alerts.push({
          type: 'application',
          severity: 'warning',
          message: `Tiempo de respuesta alto: ${appMetrics.data.requests.avgResponseTime}ms`,
          threshold: THRESHOLDS.responseTime,
          current: appMetrics.data.requests.avgResponseTime
        });
      }

      // Alerta de errores
      if (parseFloat(appMetrics.data.errors.rate) > THRESHOLDS.errorRate) {
        alerts.push({
          type: 'application',
          severity: 'critical',
          message: `Alta tasa de errores: ${appMetrics.data.errors.rate}%`,
          threshold: THRESHOLDS.errorRate,
          current: appMetrics.data.errors.rate
        });
      }

      // Alerta de queries lentas
      if (parseFloat(dbMetrics.data.queries.avgTime) > THRESHOLDS.queryTime) {
        alerts.push({
          type: 'database',
          severity: 'warning',
          message: `Queries lentas: ${dbMetrics.data.queries.avgTime}ms promedio`,
          threshold: THRESHOLDS.queryTime,
          current: dbMetrics.data.queries.avgTime
        });
      }

      return {
        success: true,
        data: {
          alerts,
          summary: {
            total: alerts.length,
            critical: alerts.filter(a => a.severity === 'critical').length,
            warning: alerts.filter(a => a.severity === 'warning').length
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      devLogger.error('[PerformanceMonitor] Error en alertas:', error.message);
      throw new ServiceError('Error al obtener alertas', 500);
    }
  }

  /**
   * Obtener dashboard completo
   * @returns {Promise<Object>} Dashboard
   */
  async getDashboard() {
    devLogger.log('[PerformanceMonitor] Generando dashboard');

    try {
      const [system, app, db, alerts] = await Promise.all([
        this.getSystemMetrics(),
        this.getApplicationMetrics(),
        this.getDatabaseMetrics(),
        this.getAlerts()
      ]);

      // Calcular health score
      const healthScore = this._calculateHealthScore(system.data, app.data, db.data);

      return {
        success: true,
        data: {
          healthScore,
          system: system.data,
          application: app.data,
          database: db.data,
          alerts: alerts.data
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      devLogger.error('[PerformanceMonitor] Error en dashboard:', error.message);
      throw new ServiceError('Error al generar dashboard', 500);
    }
  }

  /**
   * Registrar request para métricas
   * @param {Object} data - Datos del request
   */
  recordRequest(data) {
    metricsStore.requests.push({
      timestamp: Date.now(),
      endpoint: data.endpoint,
      method: data.method,
      status: data.status,
      duration: data.duration
    });

    // Limpiar entradas antiguas
    if (metricsStore.requests.length > metricsStore.maxEntries) {
      metricsStore.requests = metricsStore.requests.slice(-metricsStore.maxEntries);
    }
  }

  /**
   * Registrar error para métricas
   * @param {Object} data - Datos del error
   */
  recordError(data) {
    metricsStore.errors.push({
      timestamp: Date.now(),
      endpoint: data.endpoint,
      message: data.message,
      status: data.status
    });

    // Limpiar entradas antiguas
    if (metricsStore.errors.length > metricsStore.maxEntries) {
      metricsStore.errors = metricsStore.errors.slice(-metricsStore.maxEntries);
    }
  }

  /**
   * Registrar query para métricas
   * @param {Object} data - Datos del query
   */
  recordQuery(data) {
    metricsStore.queries.push({
      timestamp: Date.now(),
      query: data.query,
      duration: data.duration
    });

    // Limpiar entradas antiguas
    if (metricsStore.queries.length > metricsStore.maxEntries) {
      metricsStore.queries = metricsStore.queries.slice(-metricsStore.maxEntries);
    }
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Formatear bytes a unidades legibles
   * @private
   */
  _formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let value = bytes;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Formatear uptime a formato legible
   * @private
   */
  _formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.join(' ') || '< 1m';
  }

  /**
   * Calcular score de salud del sistema
   * @private
   */
  _calculateHealthScore(system, app, db) {
    let score = 100;
    let issues = [];

    // CPU
    const cpuUsage = parseFloat(system.cpu.usage);
    if (cpuUsage > 90) {
      score -= 20;
      issues.push('CPU crítico');
    } else if (cpuUsage > THRESHOLDS.cpu) {
      score -= 10;
      issues.push('CPU alto');
    }

    // Memoria
    const memUsage = parseFloat(system.memory.usagePercent);
    if (memUsage > 95) {
      score -= 20;
      issues.push('Memoria crítica');
    } else if (memUsage > THRESHOLDS.memory) {
      score -= 10;
      issues.push('Memoria alta');
    }

    // Tiempo de respuesta
    const responseTime = parseFloat(app.requests.avgResponseTime);
    if (responseTime > THRESHOLDS.responseTime * 2) {
      score -= 15;
      issues.push('Respuesta muy lenta');
    } else if (responseTime > THRESHOLDS.responseTime) {
      score -= 8;
      issues.push('Respuesta lenta');
    }

    // Tasa de errores
    const errorRate = parseFloat(app.errors.rate);
    if (errorRate > THRESHOLDS.errorRate * 2) {
      score -= 25;
      issues.push('Errores críticos');
    } else if (errorRate > THRESHOLDS.errorRate) {
      score -= 12;
      issues.push('Errores elevados');
    }

    // Queries lentas
    const queryTime = parseFloat(db.queries.avgTime);
    if (queryTime > THRESHOLDS.queryTime) {
      score -= 8;
      issues.push('Queries lentas');
    }

    return {
      score: Math.max(0, score),
      status: score >= 80 ? 'healthy' : score >= 50 ? 'degraded' : 'unhealthy',
      issues
    };
  }
}

module.exports = new PerformanceMonitorService();
module.exports.ServiceError = ServiceError;
