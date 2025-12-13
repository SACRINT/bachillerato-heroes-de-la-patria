/**
 * 📊 MONITORING ROUTES - SEMANA 31-32
 * Endpoints para monitoring y health checks
 *
 * Endpoints:
 * - GET /metrics - Prometheus-compatible metrics
 * - GET /health - Health check detallado
 * - GET /health/live - Liveness probe (K8s)
 * - GET /health/ready - Readiness probe (K8s)
 * - GET /monitoring/stats - Estadísticas completas
 * - GET /monitoring/alerts - Alertas activas
 *
 * Fecha: 20 Noviembre 2025
 */
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=monitoring.d.ts.map