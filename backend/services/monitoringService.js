/**
 * 📊 MONITORING SERVICE - SEMANA 17
 * Sistema de monitoreo y métricas
 *
 * Features:
 * - Health checks
 * - Performance metrics
 * - Error tracking
 * - Alerting
 * - Dashboard data
 *
 * Fecha: 20 Noviembre 2025
 */

const os = require('os');
const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger');

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      startTime: Date.now()
    };
    this.alerts = [];
    this.thresholds = {
      errorRate: 5,         // %
      responseTime: 1000,   // ms
      memoryUsage: 85,      // %
      cpuUsage: 80          // %
    };
  }

  async getHealthStatus() {
    const checks = {};

    // Database
    try {
      const start = Date.now();
      await pool.query('SELECT 1');
      checks.database = {
        status: 'healthy',
        latency: Date.now() - start
      };
    } catch (error) {
      checks.database = {
        status: 'unhealthy',
        error: error.message
      };
    }

    // Memory
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memPercent = ((totalMem - freeMem) / totalMem * 100).toFixed(2);

    checks.memory = {
      status: memPercent < this.thresholds.memoryUsage ? 'healthy' : 'warning',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      systemPercent: memPercent
    };

    // CPU
    const cpuUsage = os.loadavg()[0];
    const cpuCount = os.cpus().length;
    const cpuPercent = ((cpuUsage / cpuCount) * 100).toFixed(2);

    checks.cpu = {
      status: cpuPercent < this.thresholds.cpuUsage ? 'healthy' : 'warning',
      load: cpuUsage.toFixed(2),
      cores: cpuCount,
      percent: cpuPercent
    };

    // Uptime
    checks.uptime = {
      status: 'healthy',
      process: Math.round(process.uptime()),
      system: Math.round(os.uptime())
    };

    const overallStatus = Object.values(checks).every(
      c => c.status === 'healthy'
    ) ? 'healthy' : 'degraded';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks
    };
  }

  recordRequest(duration, statusCode) {
    this.metrics.requests++;

    if (statusCode >= 400) {
      this.metrics.errors++;
    }

    this.metrics.responseTime.push(duration);

    // Mantener últimos 1000 requests
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime.shift();
    }

    // Check thresholds
    this.checkThresholds(duration, statusCode);
  }

  checkThresholds(duration, statusCode) {
    // Response time
    if (duration > this.thresholds.responseTime) {
      this.addAlert('warning', `Respuesta lenta: ${duration}ms`);
    }

    // Error rate
    const errorRate = (this.metrics.errors / this.metrics.requests) * 100;
    if (errorRate > this.thresholds.errorRate) {
      this.addAlert('error', `Tasa de errores alta: ${errorRate.toFixed(2)}%`);
    }
  }

  addAlert(severity, message) {
    this.alerts.push({
      severity,
      message,
      timestamp: new Date().toISOString()
    });

    // Mantener últimas 100 alertas
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    devLogger.warn(`[Monitoring] ${severity}: ${message}`);
  }

  getMetrics() {
    const responseTime = this.metrics.responseTime;
    const avgResponseTime = responseTime.length > 0
      ? responseTime.reduce((a, b) => a + b, 0) / responseTime.length
      : 0;

    return {
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: this.metrics.requests > 0
        ? ((this.metrics.errors / this.metrics.requests) * 100).toFixed(2)
        : '0',
      avgResponseTime: avgResponseTime.toFixed(2),
      uptime: Date.now() - this.metrics.startTime
    };
  }

  getAlerts(limit = 20) {
    return this.alerts.slice(-limit);
  }

  // Middleware para Express
  middleware() {
    return (req, res, next) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        this.recordRequest(duration, res.statusCode);
      });

      next();
    };
  }

  reset() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      startTime: Date.now()
    };
    this.alerts = [];
  }
}

module.exports = new MonitoringService();
