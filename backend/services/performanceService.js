/**
 * ⚡ PERFORMANCE SERVICE - SEMANA 23
 * Optimización y análisis de rendimiento
 *
 * Features:
 * - Query optimization
 * - Memory profiling
 * - Response time tracking
 * - Bottleneck detection
 * - Performance recommendations
 *
 * Fecha: 20 Noviembre 2025
 */

const devLogger = require('../utils/devLogger.js');

class PerformanceService {
  constructor() {
    this.metrics = {
      queries: [],
      requests: [],
      memory: []
    };
    this.thresholds = {
      slowQuery: 100,      // ms
      slowRequest: 500,    // ms
      highMemory: 80       // % de heap
    };
  }

  // Tracking de queries
  trackQuery(query, duration, rows = 0) {
    const metric = {
      query: query.substring(0, 200),
      duration,
      rows,
      timestamp: Date.now(),
      slow: duration > this.thresholds.slowQuery
    };

    this.metrics.queries.push(metric);

    // Mantener últimas 1000 queries
    if (this.metrics.queries.length > 1000) {
      this.metrics.queries.shift();
    }

    if (metric.slow) {
      devLogger.warn(`[PERFORMANCE] Query lenta (${duration}ms): ${query.substring(0, 100)}...`);
    }

    return metric;
  }

  // Tracking de requests HTTP
  trackRequest(method, path, duration, statusCode) {
    const metric = {
      method,
      path,
      duration,
      statusCode,
      timestamp: Date.now(),
      slow: duration > this.thresholds.slowRequest
    };

    this.metrics.requests.push(metric);

    if (this.metrics.requests.length > 1000) {
      this.metrics.requests.shift();
    }

    if (metric.slow) {
      devLogger.warn(`[PERFORMANCE] Request lenta (${duration}ms): ${method} ${path}`);
    }

    return metric;
  }

  // Snapshot de memoria
  captureMemorySnapshot() {
    const usage = process.memoryUsage();
    const heapUsedPercent = (usage.heapUsed / usage.heapTotal * 100).toFixed(2);

    const snapshot = {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024),
      heapUsedPercent,
      timestamp: Date.now()
    };

    this.metrics.memory.push(snapshot);

    if (this.metrics.memory.length > 100) {
      this.metrics.memory.shift();
    }

    if (parseFloat(heapUsedPercent) > this.thresholds.highMemory) {
      devLogger.warn(`[PERFORMANCE] Memoria alta: ${heapUsedPercent}% de heap usado`);
    }

    return snapshot;
  }

  // Análisis de queries lentas
  getSlowQueries(limit = 20) {
    return this.metrics.queries
      .filter(q => q.slow)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  // Análisis de requests lentas
  getSlowRequests(limit = 20) {
    return this.metrics.requests
      .filter(r => r.slow)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  // Estadísticas generales
  getStats() {
    const queryDurations = this.metrics.queries.map(q => q.duration);
    const requestDurations = this.metrics.requests.map(r => r.duration);

    return {
      queries: {
        total: this.metrics.queries.length,
        slow: this.metrics.queries.filter(q => q.slow).length,
        avgDuration: this.average(queryDurations),
        p95Duration: this.percentile(queryDurations, 95),
        p99Duration: this.percentile(queryDurations, 99)
      },
      requests: {
        total: this.metrics.requests.length,
        slow: this.metrics.requests.filter(r => r.slow).length,
        avgDuration: this.average(requestDurations),
        p95Duration: this.percentile(requestDurations, 95),
        p99Duration: this.percentile(requestDurations, 99)
      },
      memory: this.metrics.memory.length > 0
        ? this.metrics.memory[this.metrics.memory.length - 1]
        : null
    };
  }

  // Detectar cuellos de botella
  detectBottlenecks() {
    const bottlenecks = [];

    // Queries lentas frecuentes
    const slowQueryPatterns = {};
    for (const query of this.getSlowQueries(100)) {
      const pattern = query.query.substring(0, 50);
      slowQueryPatterns[pattern] = (slowQueryPatterns[pattern] || 0) + 1;
    }

    for (const [pattern, count] of Object.entries(slowQueryPatterns)) {
      if (count >= 5) {
        bottlenecks.push({
          type: 'slow_query_pattern',
          severity: 'high',
          description: `Query pattern ejecutada ${count} veces lentamente`,
          pattern
        });
      }
    }

    // Endpoints lentos
    const slowEndpoints = {};
    for (const request of this.getSlowRequests(100)) {
      const key = `${request.method} ${request.path}`;
      slowEndpoints[key] = (slowEndpoints[key] || 0) + 1;
    }

    for (const [endpoint, count] of Object.entries(slowEndpoints)) {
      if (count >= 5) {
        bottlenecks.push({
          type: 'slow_endpoint',
          severity: 'high',
          description: `Endpoint con ${count} requests lentas`,
          endpoint
        });
      }
    }

    // Memoria alta
    const latestMemory = this.metrics.memory[this.metrics.memory.length - 1];
    if (latestMemory && parseFloat(latestMemory.heapUsedPercent) > this.thresholds.highMemory) {
      bottlenecks.push({
        type: 'high_memory',
        severity: 'critical',
        description: `Uso de memoria: ${latestMemory.heapUsedPercent}%`,
        heapUsed: latestMemory.heapUsed
      });
    }

    return bottlenecks;
  }

  // Recomendaciones de optimización
  getRecommendations() {
    const recommendations = [];
    const bottlenecks = this.detectBottlenecks();

    for (const bottleneck of bottlenecks) {
      if (bottleneck.type === 'slow_query_pattern') {
        recommendations.push({
          priority: 'high',
          category: 'database',
          action: 'Agregar índice o optimizar query',
          details: bottleneck.pattern
        });
      }

      if (bottleneck.type === 'slow_endpoint') {
        recommendations.push({
          priority: 'high',
          category: 'api',
          action: 'Implementar caching o optimizar lógica',
          details: bottleneck.endpoint
        });
      }

      if (bottleneck.type === 'high_memory') {
        recommendations.push({
          priority: 'critical',
          category: 'memory',
          action: 'Revisar memory leaks y reducir buffering',
          details: `${bottleneck.heapUsed}MB usado`
        });
      }
    }

    return recommendations;
  }

  // Helpers matemáticos
  average(arr) {
    if (arr.length === 0) return 0;
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  }

  percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  // Middleware para Express
  middleware() {
    return (req, res, next) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        this.trackRequest(req.method, req.path, duration, res.statusCode);
      });

      next();
    };
  }

  reset() {
    this.metrics = {
      queries: [],
      requests: [],
      memory: []
    };
  }
}

module.exports = new PerformanceService();
