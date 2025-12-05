/**
 * 📊 PERFORMANCE MONITOR SERVICE - v2.0.0
 * Servicio de monitoreo de rendimiento del sistema
 *
 * Refactorizado: 04 Diciembre 2025
 * - Migrado a usar PerformanceMonitorDAO
 * - Sin SQL directo en el servicio
 */

const PerformanceMonitorDAO = require('../data/performance-monitor.dao');
const devLogger = require('../utils/devLogger');
const os = require('os');

class ServiceError extends Error { constructor(message, statusCode = 500) { super(message); this.name = 'ServiceError'; this.statusCode = statusCode; } }

const metricsStore = { requests: [], errors: [], queries: [], maxEntries: 1000 };
const THRESHOLDS = { cpu: 80, memory: 85, responseTime: 2000, errorRate: 5, queryTime: 1000 };

class PerformanceMonitorService {
  constructor() { this.startTime = Date.now(); }

  async getSystemMetrics() {
    devLogger.log('[PerformanceMonitor] Obteniendo métricas del sistema');
    try {
      const cpus = os.cpus();
      const totalMemory = os.totalmem(); const freeMemory = os.freemem(); const usedMemory = totalMemory - freeMemory;
      const cpuUsage = cpus.reduce((acc, cpu) => { const total = Object.values(cpu.times).reduce((a, b) => a + b, 0); return acc + ((total - cpu.times.idle) / total * 100); }, 0) / cpus.length;
      return {
        success: true, data: {
          cpu: { usage: cpuUsage.toFixed(2), cores: cpus.length, model: cpus[0]?.model || 'Unknown', status: cpuUsage > THRESHOLDS.cpu ? 'warning' : 'ok' },
          memory: { total: this._formatBytes(totalMemory), used: this._formatBytes(usedMemory), free: this._formatBytes(freeMemory), usagePercent: ((usedMemory / totalMemory) * 100).toFixed(2), status: (usedMemory / totalMemory * 100) > THRESHOLDS.memory ? 'warning' : 'ok' },
          system: { platform: os.platform(), arch: os.arch(), hostname: os.hostname(), uptime: this._formatUptime(os.uptime()), nodeVersion: process.version },
          process: { pid: process.pid, uptime: this._formatUptime((Date.now() - this.startTime) / 1000), memoryUsage: { rss: this._formatBytes(process.memoryUsage().rss), heapTotal: this._formatBytes(process.memoryUsage().heapTotal), heapUsed: this._formatBytes(process.memoryUsage().heapUsed) } }
        }, timestamp: new Date().toISOString()
      };
    } catch (error) { devLogger.error('[PerformanceMonitor] Error:', error.message); throw new ServiceError('Error al obtener métricas del sistema', 500); }
  }

  async getApplicationMetrics() {
    devLogger.log('[PerformanceMonitor] Obteniendo métricas de aplicación');
    try {
      const now = Date.now(), lastHour = now - 3600000, last5Min = now - 300000;
      const recentRequests = metricsStore.requests.filter(r => r.timestamp > lastHour);
      const last5MinRequests = recentRequests.filter(r => r.timestamp > last5Min);
      const totalRequests = recentRequests.length;
      const avgResponseTime = recentRequests.length > 0 ? recentRequests.reduce((acc, r) => acc + r.duration, 0) / recentRequests.length : 0;
      const errorCount = metricsStore.errors.filter(e => e.timestamp > lastHour).length;
      const errorRate = totalRequests > 0 ? (errorCount / totalRequests * 100) : 0;
      const rpm = last5MinRequests.length / 5;
      const statusDistribution = recentRequests.reduce((acc, r) => { const key = `${Math.floor(r.status / 100)}xx`; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
      const endpointCounts = recentRequests.reduce((acc, r) => { acc[r.endpoint] = (acc[r.endpoint] || 0) + 1; return acc; }, {});
      const topEndpoints = Object.entries(endpointCounts).sort(([, a], [, b]) => b - a).slice(0, 10).map(([endpoint, count]) => ({ endpoint, count }));
      const endpointTimes = {}; recentRequests.forEach(r => { if (!endpointTimes[r.endpoint]) endpointTimes[r.endpoint] = []; endpointTimes[r.endpoint].push(r.duration); });
      const slowestEndpoints = Object.entries(endpointTimes).map(([endpoint, times]) => ({ endpoint, avgTime: times.reduce((a, b) => a + b, 0) / times.length, count: times.length })).sort((a, b) => b.avgTime - a.avgTime).slice(0, 10).map(e => ({ endpoint: e.endpoint, avgTime: e.avgTime.toFixed(2), count: e.count }));
      return {
        success: true, data: {
          requests: { total: totalRequests, rpm: rpm.toFixed(2), avgResponseTime: avgResponseTime.toFixed(2), status: avgResponseTime > THRESHOLDS.responseTime ? 'warning' : 'ok' },
          errors: { total: errorCount, rate: errorRate.toFixed(2), status: errorRate > THRESHOLDS.errorRate ? 'warning' : 'ok' },
          distribution: statusDistribution, topEndpoints, slowestEndpoints
        }, timestamp: new Date().toISOString()
      };
    } catch (error) { devLogger.error('[PerformanceMonitor] Error:', error.message); throw new ServiceError('Error al obtener métricas de aplicación', 500); }
  }

  async getDatabaseMetrics() {
    devLogger.log('[PerformanceMonitor] Obteniendo métricas de BD');
    try {
      const poolStats = PerformanceMonitorDAO.getPoolStats();
      const dbSize = await PerformanceMonitorDAO.getDatabaseSize();
      const activeConnections = await PerformanceMonitorDAO.getActiveConnections();
      const slowQueries = await PerformanceMonitorDAO.getSlowQueries();
      const tableStats = await PerformanceMonitorDAO.getTableStats();
      const unusedIndexes = await PerformanceMonitorDAO.getUnusedIndexes();
      const recentQueries = metricsStore.queries.filter(q => q.timestamp > Date.now() - 3600000);
      const avgQueryTime = recentQueries.length > 0 ? recentQueries.reduce((acc, q) => acc + q.duration, 0) / recentQueries.length : 0;
      return {
        success: true, data: {
          pool: poolStats,
          database: { size: dbSize, activeConnections },
          queries: { recent: recentQueries.length, avgTime: avgQueryTime.toFixed(2), status: avgQueryTime > THRESHOLDS.queryTime ? 'warning' : 'ok' },
          tables: tableStats.map(t => ({ name: t.table_name, rows: parseInt(t.row_count), deadRows: parseInt(t.dead_rows), size: t.total_size })),
          slowQueries, unusedIndexes
        }, timestamp: new Date().toISOString()
      };
    } catch (error) { devLogger.error('[PerformanceMonitor] Error:', error.message); throw new ServiceError('Error al obtener métricas de base de datos', 500); }
  }

  async getAlerts() {
    devLogger.log('[PerformanceMonitor] Verificando alertas');
    try {
      const alerts = [];
      const [systemMetrics, appMetrics, dbMetrics] = await Promise.all([this.getSystemMetrics(), this.getApplicationMetrics(), this.getDatabaseMetrics()]);
      if (parseFloat(systemMetrics.data.cpu.usage) > THRESHOLDS.cpu) alerts.push({ type: 'system', severity: 'warning', message: `Alto uso de CPU: ${systemMetrics.data.cpu.usage}%`, threshold: THRESHOLDS.cpu, current: systemMetrics.data.cpu.usage });
      if (parseFloat(systemMetrics.data.memory.usagePercent) > THRESHOLDS.memory) alerts.push({ type: 'system', severity: 'warning', message: `Alto uso de memoria: ${systemMetrics.data.memory.usagePercent}%`, threshold: THRESHOLDS.memory, current: systemMetrics.data.memory.usagePercent });
      if (parseFloat(appMetrics.data.requests.avgResponseTime) > THRESHOLDS.responseTime) alerts.push({ type: 'application', severity: 'warning', message: `Tiempo de respuesta alto: ${appMetrics.data.requests.avgResponseTime}ms`, threshold: THRESHOLDS.responseTime, current: appMetrics.data.requests.avgResponseTime });
      if (parseFloat(appMetrics.data.errors.rate) > THRESHOLDS.errorRate) alerts.push({ type: 'application', severity: 'critical', message: `Alta tasa de errores: ${appMetrics.data.errors.rate}%`, threshold: THRESHOLDS.errorRate, current: appMetrics.data.errors.rate });
      if (parseFloat(dbMetrics.data.queries.avgTime) > THRESHOLDS.queryTime) alerts.push({ type: 'database', severity: 'warning', message: `Queries lentas: ${dbMetrics.data.queries.avgTime}ms promedio`, threshold: THRESHOLDS.queryTime, current: dbMetrics.data.queries.avgTime });
      return { success: true, data: { alerts, summary: { total: alerts.length, critical: alerts.filter(a => a.severity === 'critical').length, warning: alerts.filter(a => a.severity === 'warning').length } }, timestamp: new Date().toISOString() };
    } catch (error) { devLogger.error('[PerformanceMonitor] Error:', error.message); throw new ServiceError('Error al obtener alertas', 500); }
  }

  async getDashboard() {
    devLogger.log('[PerformanceMonitor] Generando dashboard');
    try {
      const [system, app, db, alerts] = await Promise.all([this.getSystemMetrics(), this.getApplicationMetrics(), this.getDatabaseMetrics(), this.getAlerts()]);
      const healthScore = this._calculateHealthScore(system.data, app.data, db.data);
      return { success: true, data: { healthScore, system: system.data, application: app.data, database: db.data, alerts: alerts.data }, timestamp: new Date().toISOString() };
    } catch (error) { devLogger.error('[PerformanceMonitor] Error:', error.message); throw new ServiceError('Error al generar dashboard', 500); }
  }

  recordRequest(data) { metricsStore.requests.push({ timestamp: Date.now(), endpoint: data.endpoint, method: data.method, status: data.status, duration: data.duration }); if (metricsStore.requests.length > metricsStore.maxEntries) metricsStore.requests = metricsStore.requests.slice(-metricsStore.maxEntries); }
  recordError(data) { metricsStore.errors.push({ timestamp: Date.now(), endpoint: data.endpoint, message: data.message, status: data.status }); if (metricsStore.errors.length > metricsStore.maxEntries) metricsStore.errors = metricsStore.errors.slice(-metricsStore.maxEntries); }
  recordQuery(data) { metricsStore.queries.push({ timestamp: Date.now(), query: data.query, duration: data.duration }); if (metricsStore.queries.length > metricsStore.maxEntries) metricsStore.queries = metricsStore.queries.slice(-metricsStore.maxEntries); }

  _formatBytes(bytes) { const units = ['B', 'KB', 'MB', 'GB', 'TB']; let i = 0; let v = bytes; while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; } return `${v.toFixed(2)} ${units[i]}`; }
  _formatUptime(seconds) { const d = Math.floor(seconds / 86400); const h = Math.floor((seconds % 86400) / 3600); const m = Math.floor((seconds % 3600) / 60); const parts = []; if (d > 0) parts.push(`${d}d`); if (h > 0) parts.push(`${h}h`); if (m > 0) parts.push(`${m}m`); return parts.join(' ') || '< 1m'; }
  _calculateHealthScore(system, app, db) {
    let score = 100; const issues = [];
    const cpuUsage = parseFloat(system.cpu.usage); if (cpuUsage > 90) { score -= 20; issues.push('CPU crítico'); } else if (cpuUsage > THRESHOLDS.cpu) { score -= 10; issues.push('CPU alto'); }
    const memUsage = parseFloat(system.memory.usagePercent); if (memUsage > 95) { score -= 20; issues.push('Memoria crítica'); } else if (memUsage > THRESHOLDS.memory) { score -= 10; issues.push('Memoria alta'); }
    const responseTime = parseFloat(app.requests.avgResponseTime); if (responseTime > THRESHOLDS.responseTime * 2) { score -= 15; issues.push('Respuesta muy lenta'); } else if (responseTime > THRESHOLDS.responseTime) { score -= 8; issues.push('Respuesta lenta'); }
    const errorRate = parseFloat(app.errors.rate); if (errorRate > THRESHOLDS.errorRate * 2) { score -= 25; issues.push('Errores críticos'); } else if (errorRate > THRESHOLDS.errorRate) { score -= 12; issues.push('Errores elevados'); }
    const queryTime = parseFloat(db.queries.avgTime); if (queryTime > THRESHOLDS.queryTime) { score -= 8; issues.push('Queries lentas'); }
    return { score: Math.max(0, score), status: score >= 80 ? 'healthy' : score >= 50 ? 'degraded' : 'unhealthy', issues };
  }
}

module.exports = new PerformanceMonitorService();
module.exports.ServiceError = ServiceError;
