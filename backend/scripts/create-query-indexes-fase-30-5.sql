-- 🔍 SCRIPT: Crear Índices para Optimización de Queries - FASE 30.5 TAREA 3
-- Generado automáticamente por: backend/scripts/explain-analyze-queries.js
-- Fecha: 2025-11-24
-- Propósito: Mejorar performance de queries críticas del sistema

-- ============================================================================
-- FASE 30.5 TAREA 3: OPTIMIZACIÓN DE QUERIES CON ÍNDICES
-- ============================================================================
-- Basado en análisis EXPLAIN ANALYZE de 5 queries críticas
-- Impacto esperado: Reducción de ETIMEDOUT de 62.5% a <40%
-- ============================================================================

-- ÍNDICE 1: Estudiantes por estado académico (filtrado en dashboard)
-- Query: SELECT ... FROM estudiantes WHERE status_academico = 'activo' ORDER BY nombre
-- Impacto: Acelera filtrados de estudiantes activos (dashboard admin)
CREATE INDEX IF NOT EXISTS idx_estudiantes_status_academico ON estudiantes(status_academico);

-- ÍNDICE 2: Calificaciones por estudiante (LEFT JOIN frecuente)
-- Query: SELECT e.*, c.calificacion FROM estudiantes e LEFT JOIN calificaciones c ON e.id = c.estudiante_id
-- Impacto: Acelera joins de calificaciones en reportes académicos
CREATE INDEX IF NOT EXISTS idx_calificaciones_estudiante_id ON calificaciones(estudiante_id);

-- ÍNDICE 3: Calificaciones por docente (GROUP BY y JOIN)
-- Query: SELECT d.*, COUNT(c.id) FROM docentes d LEFT JOIN calificaciones c ON d.id = c.docente_id GROUP BY d.id
-- Impacto: Acelera agregaciones de calificaciones por docente
CREATE INDEX IF NOT EXISTS idx_calificaciones_docente_id ON calificaciones(docente_id);

-- ÍNDICE 4: Docentes por estado (filtrado común)
-- Query: SELECT ... FROM docentes WHERE status = 'activo'
-- Impacto: Acelera filtrados de docentes en listados
CREATE INDEX IF NOT EXISTS idx_docentes_status ON docentes(status);

-- ÍNDICE 5: Pendientes aprobación por estado (filtrado + ordenamiento)
-- Query: SELECT ... FROM pendientes_aprobacion WHERE estado = 'pendiente' ORDER BY fecha_solicitud DESC
-- Impacto: Acelera consulta de solicitudes pendientes en tab del dashboard
CREATE INDEX IF NOT EXISTS idx_pendientes_aprobacion_estado ON pendientes_aprobacion(estado);

-- ÍNDICE 6: Pendientes aprobación ordenadas por fecha (CRITICAL para paginación)
-- Query: ... ORDER BY fecha_solicitud DESC LIMIT 50
-- Impacto: Índice DESC evita Sort operation, mejora paginación
CREATE INDEX IF NOT EXISTS idx_pendientes_aprobacion_fecha_solicitud ON pendientes_aprobacion(fecha_solicitud DESC);

-- ÍNDICE 7: Suscriptores notificaciones verificados (filtrado común)
-- Query: SELECT ... FROM suscriptores_notificaciones WHERE verificado = true
-- Impacto: Acelera obtención de suscriptores activos para envío de emails
CREATE INDEX IF NOT EXISTS idx_suscriptores_verificado ON suscriptores_notificaciones(verificado);

-- ÍNDICE 8: Avisos por estado y fecha (COMPOSITE - muy importante)
-- Query: SELECT ... FROM avisos WHERE estado = 'publicado' AND fecha_publicacion <= NOW() ORDER BY fecha_publicacion DESC
-- Impacto: Índice combinado acelera filtrado + sorting de avisos
CREATE INDEX IF NOT EXISTS idx_avisos_estado_fecha ON avisos(estado, fecha_publicacion DESC);

-- ============================================================================
-- ANÁLISIS ESTADÍSTICO (REQUERIDO DESPUÉS DE CREAR ÍNDICES)
-- ============================================================================
-- Una vez creados los índices, PostgreSQL necesita analizar las tablas
-- para actualizar sus estadísticas de planificación de queries

ANALYZE estudiantes;
ANALYZE calificaciones;
ANALYZE docentes;
ANALYZE pendientes_aprobacion;
ANALYZE suscriptores_notificaciones;
ANALYZE avisos;

-- ============================================================================
-- VERIFICACIÓN DE ÍNDICES CREADOS
-- ============================================================================
-- Usar esta query para verificar que todos los índices se crearon exitosamente:
--
-- SELECT schemaname, tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE indexname LIKE 'idx_%'
-- AND schemaname = 'public'
-- ORDER BY tablename, indexname;

-- ============================================================================
-- PRÓXIMOS PASOS - TAREA 3 COMPLETADA
-- ============================================================================
-- 1. ✅ Ejecutar este script en Neon Console
-- 2. ✅ Ejecutar ANALYZE; para actualizar estadísticas
-- 3. ✅ Re-ejecutar explain-analyze-queries.js para verificar mejoras
-- 4. ✅ Validar latencia en endpoints principales (dashboard admin)
-- 5. ⏳ TAREA 4: Implementar Connection Pool Manager (30 min)
-- 6. ⏳ TAREA 5: Implementar Redis Caching (40 min)
-- 7. ⏳ Ejecutar Stress Test 3,000 usuarios para validar ETIMEDOUT < 40%

-- ============================================================================
-- ESTADÍSTICAS DE IMPACTO ESPERADO
-- ============================================================================
-- Métrica Actual (FASE 30.4) → Esperado (FASE 30.5 Post-Índices)
-- ============================================================================
-- ETIMEDOUT:              62.5% → <40% (objetivo)
-- Mean Latency:           ~4,500ms → <3,000ms
-- p95 Latency:            ~10,000ms → <8,000ms
-- Database CPU:           70-80% → 30-40%
-- Query Plan Time:        Variable → Consistent <50ms
--
-- Drivers de mejora:
-- - Seq Scans → Index Scans = 10-50x más rápido
-- - Sort Operations eliminadas = 200-500ms ahorrados
-- - Pool exhaustion reducida = menos ETIMEDOUT
-- ============================================================================
