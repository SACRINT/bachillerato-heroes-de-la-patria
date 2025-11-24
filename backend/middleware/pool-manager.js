/**
 * 🔌 Connection Pool Manager Middleware - FASE 30.5 TAREA 4
 *
 * Propósito:
 * - Monitorear utilización del pool de conexiones en tiempo real
 * - Detectar exhaustión de pool (>80%)
 * - Registrar métricas para análisis de performance
 * - Proporcionar alertas cuando pool se acerca al límite
 *
 * Uso:
 * app.use(poolManager.middleware);
 * GET /api/health/pool → Obtener estado actual del pool
 */

const pool = require('../config/database');

class PoolManager {
  constructor() {
    this.stats = {
      totalRequests: 0,
      activeConnections: 0,
      maxConnections: pool.options.max,
      utilizationHistory: [],
      alertsSent: 0,
      lastAlertTime: null,
      peakUtilization: 0,
    };

    this.thresholds = {
      warning: 0.70,  // 70% = warning
      critical: 0.80, // 80% = critical
      severe: 0.90,   // 90% = severe
    };

    // Intervalo de limpieza de histórico (mantener últimas 1000 muestras)
    this.MAX_HISTORY = 1000;

    // Logging prefix
    this.prefix = '[POOL-MANAGER]';
  }

  /**
   * Obtener métricas actuales del pool
   */
  getPoolMetrics() {
    const total = pool.totalCount;
    const idle = pool.idleCount;
    const active = total - idle;
    const waiting = pool.waitingCount || 0;
    const utilization = total > 0 ? active / this.stats.maxConnections : 0;

    return {
      total,
      idle,
      active,
      waiting,
      maxConnections: this.stats.maxConnections,
      utilization: parseFloat((utilization * 100).toFixed(2)),
      utilizationPercent: `${(utilization * 100).toFixed(1)}%`,
      available: this.stats.maxConnections - active,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Registrar métrica en histórico
   */
  recordMetric(metrics) {
    this.stats.utilizationHistory.push({
      ...metrics,
      recordedAt: metrics.timestamp,
    });

    // Mantener solo últimas 1000 muestras
    if (this.stats.utilizationHistory.length > this.MAX_HISTORY) {
      this.stats.utilizationHistory.shift();
    }

    // Actualizar peak utilization
    if (metrics.utilization > this.stats.peakUtilization) {
      this.stats.peakUtilization = metrics.utilization;
    }
  }

  /**
   * Analizar utilización y generar alertas
   */
  analyzeUtilization(metrics) {
    const utilization = metrics.utilization / 100; // Convertir a decimal
    const timestamp = new Date();

    let alertLevel = null;
    let message = null;

    if (utilization >= this.thresholds.severe) {
      alertLevel = 'SEVERE';
      message = `🔴 SEVERE: Pool utilizado ${metrics.utilizationPercent} (${metrics.active}/${this.stats.maxConnections} conexiones activas)`;
    } else if (utilization >= this.thresholds.critical) {
      alertLevel = 'CRITICAL';
      message = `🟠 CRITICAL: Pool utilizado ${metrics.utilizationPercent} (${metrics.active}/${this.stats.maxConnections} conexiones activas)`;
    } else if (utilization >= this.thresholds.warning) {
      alertLevel = 'WARNING';
      message = `🟡 WARNING: Pool utilizado ${metrics.utilizationPercent} (${metrics.active}/${this.stats.maxConnections} conexiones activas)`;
    } else {
      alertLevel = 'NORMAL';
      message = `✅ NORMAL: Pool utilizado ${metrics.utilizationPercent} (${metrics.active}/${this.stats.maxConnections} conexiones activas)`;
    }

    // Enviar alerta si supera threshold warning
    if (alertLevel !== 'NORMAL') {
      const timeSinceLastAlert = this.stats.lastAlertTime
        ? (timestamp - this.stats.lastAlertTime) / 1000
        : Infinity;

      // Mostrar alerta solo si pasaron 30+ segundos desde la última
      if (timeSinceLastAlert >= 30) {
        console.warn(`${this.prefix} ${message}`);
        this.stats.lastAlertTime = timestamp;
        this.stats.alertsSent++;
      }
    }

    return { alertLevel, message };
  }

  /**
   * Middleware Express para monitorear cada request
   */
  middleware = (req, res, next) => {
    const metrics = this.getPoolMetrics();
    this.recordMetric(metrics);
    this.analyzeUtilization(metrics);

    this.stats.totalRequests++;

    // Agregar metrics al request para acceso posterior
    req.poolMetrics = metrics;

    // Log en intervals grandes
    if (this.stats.totalRequests % 100 === 0) {
      console.log(`${this.prefix} [REQUEST ${this.stats.totalRequests}] Pool: ${metrics.utilizationPercent} | Active: ${metrics.active}/${this.stats.maxConnections}`);
    }

    next();
  }

  /**
   * Endpoint para obtener estado actual del pool
   * GET /api/health/pool
   */
  getPoolStatusEndpoint = (req, res) => {
    try {
      const metrics = this.getPoolMetrics();
      const alert = this.analyzeUtilization(metrics);

      // Calcular estadísticas del histórico
      const avgUtilization = this.stats.utilizationHistory.length > 0
        ? (this.stats.utilizationHistory.reduce((sum, m) => sum + m.utilization, 0) / this.stats.utilizationHistory.length).toFixed(2)
        : 0;

      res.json({
        status: 'ok',
        pool: metrics,
        alert: alert,
        statistics: {
          totalRequests: this.stats.totalRequests,
          peakUtilization: `${this.stats.peakUtilization.toFixed(1)}%`,
          averageUtilization: `${avgUtilization}%`,
          alertsSent: this.stats.alertsSent,
          historySize: this.stats.utilizationHistory.length,
          maxConnections: this.stats.maxConnections,
        },
        thresholds: {
          warning: `${(this.thresholds.warning * 100).toFixed(0)}%`,
          critical: `${(this.thresholds.critical * 100).toFixed(0)}%`,
          severe: `${(this.thresholds.severe * 100).toFixed(0)}%`,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`${this.prefix} Error getting pool status:`, error.message);
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  /**
   * Endpoint para obtener histórico de métricas
   * GET /api/health/pool/history
   */
  getPoolHistoryEndpoint = (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 100, this.MAX_HISTORY);
      const history = this.stats.utilizationHistory.slice(-limit);

      res.json({
        status: 'ok',
        historySize: history.length,
        maxSize: this.MAX_HISTORY,
        data: history,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`${this.prefix} Error getting pool history:`, error.message);
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  /**
   * Endpoint para obtener estadísticas resumidas
   * GET /api/health/pool/stats
   */
  getPoolStatsEndpoint = (req, res) => {
    try {
      const metrics = this.getPoolMetrics();
      const avgUtilization = this.stats.utilizationHistory.length > 0
        ? (this.stats.utilizationHistory.reduce((sum, m) => sum + m.utilization, 0) / this.stats.utilizationHistory.length).toFixed(2)
        : 0;

      // Calcular p95 utilization
      const sorted = [...this.stats.utilizationHistory].sort((a, b) => a.utilization - b.utilization);
      const p95Index = Math.floor(sorted.length * 0.95);
      const p95Utilization = sorted.length > 0 ? sorted[p95Index]?.utilization : 0;

      res.json({
        status: 'ok',
        current: {
          utilization: metrics.utilizationPercent,
          active: metrics.active,
          idle: metrics.idle,
          waiting: metrics.waiting,
          available: metrics.available,
        },
        statistics: {
          totalRequests: this.stats.totalRequests,
          peakUtilization: `${this.stats.peakUtilization.toFixed(1)}%`,
          averageUtilization: `${avgUtilization}%`,
          p95Utilization: `${p95Utilization.toFixed(1)}%`,
          alertsSent: this.stats.alertsSent,
        },
        pool: {
          maxConnections: this.stats.maxConnections,
          minConnections: pool.options.min || 0,
          idleTimeoutMs: pool.options.idleTimeoutMillis || 0,
          connectionTimeoutMs: pool.options.connectionTimeoutMillis || 0,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`${this.prefix} Error getting pool stats:`, error.message);
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  /**
   * Resetear contadores (para testing)
   */
  reset() {
    this.stats = {
      totalRequests: 0,
      activeConnections: 0,
      maxConnections: this.stats.maxConnections,
      utilizationHistory: [],
      alertsSent: 0,
      lastAlertTime: null,
      peakUtilization: 0,
    };
  }
}

// Crear instancia global
const poolManager = new PoolManager();

module.exports = poolManager;
