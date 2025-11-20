-- ========================================
-- MIGRACIÓN: Índices Adicionales de Rendimiento
-- BGE Héroes de la Patria - Neon PostgreSQL
-- Fecha: 20 Noviembre 2025
-- SEMANA 1 - TAREA 1.1 (Expansión)
-- ========================================

-- IMPORTANTE: Ejecutar en Neon Console
-- Índices adicionales para tablas críticas del sistema

-- ========================================
-- ÍNDICES PARA TABLA: estudiantes
-- ========================================

-- Índice para filtrar por grado
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estudiantes_grado
ON estudiantes(grado);

-- Índice para filtrar por grupo
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estudiantes_grupo
ON estudiantes(grupo);

-- Índice para filtrar por status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estudiantes_status
ON estudiantes(status);

-- Índice para búsqueda por CURP
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estudiantes_curp
ON estudiantes(curp);

-- Índice para búsqueda por matrícula
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estudiantes_matricula
ON estudiantes(matricula);

-- Índice compuesto para queries de grupo
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estudiantes_grado_grupo
ON estudiantes(grado, grupo);

-- Índice para tenant (multi-tenancy)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estudiantes_tenant
ON estudiantes(tenant_id);

-- ========================================
-- ÍNDICES PARA TABLA: calificaciones
-- ========================================

-- Índice para búsqueda por estudiante
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calificaciones_estudiante
ON calificaciones(estudiante_id);

-- Índice para búsqueda por materia
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calificaciones_materia
ON calificaciones(materia_id);

-- Índice para filtrar por parcial
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calificaciones_parcial
ON calificaciones(parcial);

-- Índice para filtrar por ciclo escolar
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calificaciones_ciclo
ON calificaciones(ciclo_escolar);

-- Índice compuesto para boletas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calificaciones_estudiante_ciclo
ON calificaciones(estudiante_id, ciclo_escolar);

-- Índice compuesto para reportes de materia
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calificaciones_materia_ciclo
ON calificaciones(materia_id, ciclo_escolar);

-- Índice para docente (auditoría)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calificaciones_docente
ON calificaciones(docente_id);

-- ========================================
-- ÍNDICES PARA TABLA: materias
-- ========================================

-- Índice para filtrar por semestre
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_materias_semestre
ON materias(semestre);

-- Índice para filtrar por área
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_materias_area
ON materias(area);

-- Índice para búsqueda por clave
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_materias_clave
ON materias(clave);

-- ========================================
-- ÍNDICES PARA TABLA: pending_approvals
-- ========================================

-- Índice para filtrar por status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pending_status
ON pending_approvals(status);

-- Índice para filtrar por tipo de formulario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pending_form_type
ON pending_approvals(form_type);

-- Índice para ordenar por fecha
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pending_created
ON pending_approvals(created_at DESC);

-- Índice compuesto para dashboard de aprobaciones
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pending_status_type
ON pending_approvals(status, form_type);

-- Índice para tenant (multi-tenancy)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pending_tenant
ON pending_approvals(tenant_id);

-- ========================================
-- ÍNDICES PARA TABLA: iacoins_balances
-- ========================================

-- Índice para búsqueda por usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_iacoins_balances_user
ON iacoins_balances(user_id);

-- Índice para leaderboard (top earners)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_iacoins_balances_total_earned
ON iacoins_balances(total_earned DESC);

-- Índice para filtrar por nivel
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_iacoins_balances_level
ON iacoins_balances(level);

-- ========================================
-- ÍNDICES PARA TABLA: iacoins_transactions
-- ========================================

-- Índice para búsqueda por usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_iacoins_transactions_user
ON iacoins_transactions(user_id);

-- Índice para filtrar por tipo
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_iacoins_transactions_type
ON iacoins_transactions(type);

-- Índice para ordenar por fecha
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_iacoins_transactions_date
ON iacoins_transactions(created_at DESC);

-- Índice compuesto para historial de usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_iacoins_transactions_user_date
ON iacoins_transactions(user_id, created_at DESC);

-- Índice para referencia (challenges, etc)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_iacoins_transactions_ref
ON iacoins_transactions(reference_type, reference_id);

-- ========================================
-- ÍNDICES PARA TABLA: iacoins_challenges
-- ========================================

-- Índice para filtrar activos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_iacoins_challenges_active
ON iacoins_challenges(is_active);

-- Índice para filtrar por categoría
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_iacoins_challenges_category
ON iacoins_challenges(category);

-- Índice para filtrar por dificultad
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_iacoins_challenges_difficulty
ON iacoins_challenges(difficulty);

-- Índice compuesto para listado de retos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_iacoins_challenges_active_cat
ON iacoins_challenges(is_active, category);

-- ========================================
-- ÍNDICES PARA TABLA: iacoins_challenge_progress
-- ========================================

-- Índice para búsqueda por usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_iacoins_progress_user
ON iacoins_challenge_progress(user_id);

-- Índice para búsqueda por challenge
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_iacoins_progress_challenge
ON iacoins_challenge_progress(challenge_id);

-- Índice compuesto para estado de usuario en reto
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_iacoins_progress_user_challenge
ON iacoins_challenge_progress(user_id, challenge_id);

-- ========================================
-- ÍNDICES PARA TABLA: iacoins_achievements
-- ========================================

-- Índice para filtrar activos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_iacoins_achievements_active
ON iacoins_achievements(is_active);

-- Índice para filtrar por categoría
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_iacoins_achievements_category
ON iacoins_achievements(category);

-- ========================================
-- ÍNDICES PARA TABLA: docentes
-- ========================================

-- Índice para búsqueda por email
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_docentes_email
ON docentes(email);

-- Índice para filtrar por status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_docentes_status
ON docentes(status);

-- Índice para búsqueda por especialidad
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_docentes_especialidad
ON docentes(especialidad);

-- Índice para tenant (multi-tenancy)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_docentes_tenant
ON docentes(tenant_id);

-- ========================================
-- ÍNDICES PARA TABLA: audit_logs
-- ========================================

-- Índice para búsqueda por usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_user
ON audit_logs(user_id);

-- Índice para filtrar por acción
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_action
ON audit_logs(action);

-- Índice para filtrar por entidad
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_entity
ON audit_logs(entity_type);

-- Índice para ordenar por fecha
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_date
ON audit_logs(created_at DESC);

-- Índice compuesto para reportes de auditoría
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_entity_action
ON audit_logs(entity_type, action);

-- Índice para tenant (multi-tenancy)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_tenant
ON audit_logs(tenant_id);

-- ========================================
-- ÍNDICES PARA TABLA: sessions (si existe)
-- ========================================

-- Índice para búsqueda por token
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_token
ON sessions(token) WHERE token IS NOT NULL;

-- Índice para búsqueda por usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user
ON sessions(user_id);

-- Índice para limpiar expiradas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expires
ON sessions(expires_at);

-- ========================================
-- VERIFICACIÓN DE ÍNDICES CREADOS
-- ========================================

-- Ejecutar para ver todos los índices:
-- SELECT indexname, tablename, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;

-- Ver tamaño de índices:
-- SELECT
--     schemaname,
--     tablename,
--     indexname,
--     pg_size_pretty(pg_relation_size(indexrelid)) as index_size
-- FROM pg_stat_user_indexes
-- ORDER BY pg_relation_size(indexrelid) DESC;

-- ========================================
-- ANÁLISIS DE PERFORMANCE
-- ========================================

-- Ejemplos de queries para validar mejoras con EXPLAIN ANALYZE:

-- Estudiantes por grupo:
-- EXPLAIN ANALYZE SELECT * FROM estudiantes WHERE grado = '3' AND grupo = 'A';

-- Calificaciones de estudiante:
-- EXPLAIN ANALYZE SELECT * FROM calificaciones WHERE estudiante_id = 1 AND ciclo_escolar = '2024-2025';

-- Aprobaciones pendientes:
-- EXPLAIN ANALYZE SELECT * FROM pending_approvals WHERE status = 'pending' ORDER BY created_at DESC;

-- Leaderboard IACoins:
-- EXPLAIN ANALYZE SELECT * FROM iacoins_balances ORDER BY total_earned DESC LIMIT 10;

-- Historial de transacciones:
-- EXPLAIN ANALYZE SELECT * FROM iacoins_transactions WHERE user_id = 1 ORDER BY created_at DESC;

-- ========================================
-- DOCUMENTACIÓN DE ÍNDICES
-- ========================================

COMMENT ON INDEX idx_estudiantes_grado_grupo IS 'Optimiza queries de listas por grupo';
COMMENT ON INDEX idx_calificaciones_estudiante_ciclo IS 'Optimiza generación de boletas';
COMMENT ON INDEX idx_calificaciones_materia_ciclo IS 'Optimiza reportes por materia';
COMMENT ON INDEX idx_pending_status_type IS 'Optimiza dashboard de aprobaciones';
COMMENT ON INDEX idx_iacoins_balances_total_earned IS 'Optimiza leaderboard';
COMMENT ON INDEX idx_iacoins_transactions_user_date IS 'Optimiza historial de usuario';
COMMENT ON INDEX idx_audit_entity_action IS 'Optimiza reportes de auditoría';

-- ========================================
-- ESTADÍSTICAS
-- ========================================

-- Total de índices en esta migración: ~50
-- Tablas cubiertas: 12
-- Mejora esperada: 40-70% en queries frecuentes

-- ========================================
-- FIN DE MIGRACIÓN 005
-- ========================================
