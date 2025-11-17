/**
 * 📈 PROMETHEUS METRICS - Métricas de Performance
 * Middleware para recolección de métricas con Prometheus
 * Semana 9-10 - Monitoring y Observability
 */

const promClient = require('prom-client');

// Crear registro personalizado
const register = new promClient.Registry();

// Configurar prefix global
register.setDefaultLabels({
  app: 'bge-heroes-patria',
  env: process.env.NODE_ENV || 'development',
});

// Habilitar métricas por defecto (CPU, memoria, etc)
promClient.collectDefaultMetrics({
  register,
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  eventLoopMonitoringPrecision: 10,
});

// ============================================================================
// MÉTRICAS HTTP
// ============================================================================

// Histograma: Duración de requests HTTP
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10], // Segundos
});

// Contador: Total de requests HTTP
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Gauge: Requests activos
const httpRequestsInProgress = new promClient.Gauge({
  name: 'http_requests_in_progress',
  help: 'Number of HTTP requests currently in progress',
  labelNames: ['method', 'route'],
  registers: [register],
});

// ============================================================================
// MÉTRICAS DE BASE DE DATOS
// ============================================================================

// Histograma: Duración de queries SQL
const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type', 'table'],
  registers: [register],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

// Contador: Total de queries
const dbQueriesTotal = new promClient.Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['query_type', 'table', 'status'],
  registers: [register],
});

// Gauge: Conexiones de BD activas
const dbConnectionsActive = new promClient.Gauge({
  name: 'db_connections_active',
  help: 'Number of active database connections',
  registers: [register],
});

// ============================================================================
// MÉTRICAS DE NEGOCIO (CUSTOM)
// ============================================================================

// Contador: Login exitosos/fallidos
const loginAttempts = new promClient.Counter({
  name: 'login_attempts_total',
  help: 'Total number of login attempts',
  labelNames: ['status', 'role'],
  registers: [register],
});

// Contador: Registros de usuarios
const userRegistrations = new promClient.Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
  labelNames: ['role', 'status'],
  registers: [register],
});

// Gauge: Usuarios activos
const activeUsers = new promClient.Gauge({
  name: 'active_users',
  help: 'Number of currently active users',
  labelNames: ['role'],
  registers: [register],
});

// Contador: Emails enviados
const emailsSent = new promClient.Counter({
  name: 'emails_sent_total',
  help: 'Total number of emails sent',
  labelNames: ['template', 'status'],
  registers: [register],
});

// Histograma: Tiempo de carga de páginas
const pageLoadTime = new promClient.Histogram({
  name: 'page_load_time_seconds',
  help: 'Page load time in seconds',
  labelNames: ['page'],
  registers: [register],
  buckets: [0.1, 0.5, 1, 2, 3, 5, 10],
});

// ============================================================================
// MÉTRICAS DE CACHE (REDIS)
// ============================================================================

// Contador: Cache hits
const cacheHits = new promClient.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_key'],
  registers: [register],
});

// Contador: Cache misses
const cacheMisses = new promClient.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_key'],
  registers: [register],
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Middleware para trackear métricas HTTP
 */
function metricsMiddleware(req, res, next) {
  const start = Date.now();
  const route = req.route?.path || req.path;

  // Incrementar requests en progreso
  httpRequestsInProgress.inc({ method: req.method, route });

  // Capturar cuando la respuesta termina
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convertir a segundos

    // Decrementar requests en progreso
    httpRequestsInProgress.dec({ method: req.method, route });

    // Registrar métricas
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
  });

  next();
}

/**
 * Endpoint para exponer métricas a Prometheus
 */
async function metricsEndpoint(req, res) {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end(error.message);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Registrar métrica de query SQL
 */
function trackDatabaseQuery(queryType, table, duration, status = 'success') {
  dbQueryDuration.observe({ query_type: queryType, table }, duration / 1000);
  dbQueriesTotal.inc({ query_type: queryType, table, status });
}

/**
 * Registrar login attempt
 */
function trackLoginAttempt(status, role) {
  loginAttempts.inc({ status, role });
}

/**
 * Registrar registro de usuario
 */
function trackUserRegistration(role, status = 'success') {
  userRegistrations.inc({ role, status });
}

/**
 * Actualizar usuarios activos
 */
function updateActiveUsers(role, delta) {
  activeUsers.inc({ role }, delta);
}

/**
 * Registrar email enviado
 */
function trackEmailSent(template, status = 'success') {
  emailsSent.inc({ template, status });
}

/**
 * Registrar cache hit/miss
 */
function trackCacheAccess(cacheKey, hit = true) {
  if (hit) {
    cacheHits.inc({ cache_key: cacheKey });
  } else {
    cacheMisses.inc({ cache_key: cacheKey });
  }
}

/**
 * Actualizar conexiones de BD activas
 */
function updateDatabaseConnections(count) {
  dbConnectionsActive.set(count);
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  register,
  metricsMiddleware,
  metricsEndpoint,

  // Métricas individuales (para uso directo)
  metrics: {
    httpRequestDuration,
    httpRequestsTotal,
    httpRequestsInProgress,
    dbQueryDuration,
    dbQueriesTotal,
    dbConnectionsActive,
    loginAttempts,
    userRegistrations,
    activeUsers,
    emailsSent,
    pageLoadTime,
    cacheHits,
    cacheMisses,
  },

  // Helper functions
  trackDatabaseQuery,
  trackLoginAttempt,
  trackUserRegistration,
  updateActiveUsers,
  trackEmailSent,
  trackCacheAccess,
  updateDatabaseConnections,
};
