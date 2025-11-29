-- ============================================
-- FASE 30.5: 18 ÍNDICES CRÍTICOS PARA OPTIMIZAR DATABASE LATENCY
-- ============================================
-- Este script debe ejecutarse EN NEON CONSOLE
-- Fecha: 27 Noviembre 2025
-- Objetivo: Reducir latency de 1.6s a <200ms
--
-- INSTRUCCIONES:
-- 1. Abrir https://console.neon.tech/
-- 2. Seleccionar base de datos
-- 3. Abrir SQL Editor
-- 4. Copiar y pegar CADA índice por separado
-- 5. Ejecutar (boton verde "Run")
-- 6. Validar que diga "CREATE INDEX" sin errores
-- ============================================

-- ============================================
-- TABLA: usuarios (4 índices)
-- ============================================

-- Índice 1: Búsquedas por role (crítico para /api/admin/students, /api/admin/teachers)
CREATE INDEX IF NOT EXISTS idx_usuarios_role
  ON usuarios(role);

-- Índice 2: Búsquedas por email (crítico para login, google oauth)
CREATE INDEX IF NOT EXISTS idx_usuarios_email
  ON usuarios(email);

-- Índice 3: Búsquedas por status
CREATE INDEX IF NOT EXISTS idx_usuarios_status
  ON usuarios(status);

-- Índice 4: Combinado role + nombre (para ordenamiento)
CREATE INDEX IF NOT EXISTS idx_usuarios_role_nombre
  ON usuarios(role, nombre);


-- ============================================
-- TABLA: calificaciones (3 índices)
-- ============================================

-- Índice 5: Búsquedas por user_id (crítico para /api/admin/students)
CREATE INDEX IF NOT EXISTS idx_calificaciones_user_id
  ON calificaciones(user_id);

-- Índice 6: Combinado user_id + fecha DESC (para historial ordenado)
CREATE INDEX IF NOT EXISTS idx_calificaciones_user_fecha
  ON calificaciones(user_id, fecha DESC);

-- Índice 7: Búsquedas por asignatura
CREATE INDEX IF NOT EXISTS idx_calificaciones_asignatura
  ON calificaciones(asignatura_id);


-- ============================================
-- TABLA: asistencia (2 índices)
-- ============================================

-- Índice 8: Búsquedas por user_id (crítico para /api/admin/students)
CREATE INDEX IF NOT EXISTS idx_asistencia_user_id
  ON asistencia(user_id);

-- Índice 9: Combinado user_id + fecha DESC (para historial ordenado)
CREATE INDEX IF NOT EXISTS idx_asistencia_user_fecha
  ON asistencia(user_id, fecha DESC);


-- ============================================
-- TABLA: citas / appointments (2 índices)
-- ============================================

-- Índice 10: Búsquedas por estado + fecha
CREATE INDEX IF NOT EXISTS idx_citas_estado_fecha
  ON citas(estado, fecha_solicitada DESC);

-- Índice 11: Búsquedas por user_id
CREATE INDEX IF NOT EXISTS idx_citas_user_id
  ON citas(user_id);


-- ============================================
-- TABLA: notificaciones (2 índices)
-- ============================================

-- Índice 12: Búsquedas por user_id + fecha (crítico para notificaciones)
CREATE INDEX IF NOT EXISTS idx_notificaciones_user_fecha
  ON notificaciones(user_id, created_at DESC);

-- Índice 13: Búsquedas por leído
CREATE INDEX IF NOT EXISTS idx_notificaciones_leido
  ON notificaciones(leido);


-- ============================================
-- TABLA: suscriptores_notificaciones (2 índices)
-- ============================================

-- Índice 14: Búsquedas por tipo_interes (crítico para filtros de suscripción)
CREATE INDEX IF NOT EXISTS idx_suscriptores_tipo_interes
  ON suscriptores_notificaciones(tipo_interes);

-- Índice 15: Combinado tipo_interes + user_id (para búsquedas específicas)
CREATE INDEX IF NOT EXISTS idx_suscriptores_tipo_user
  ON suscriptores_notificaciones(tipo_interes, user_id);


-- ============================================
-- TABLA: pending_approvals (2 índices)
-- ============================================

-- Índice 16: Búsquedas por status (para dashboard de aprobaciones)
CREATE INDEX IF NOT EXISTS idx_pending_approvals_status
  ON pending_approvals(status);

-- Índice 17: Búsquedas por form_type
CREATE INDEX IF NOT EXISTS idx_pending_approvals_form_type
  ON pending_approvals(form_type);

-- Índice 18: Combinado status + created_at DESC (para historial)
CREATE INDEX IF NOT EXISTS idx_pending_approvals_status_fecha
  ON pending_approvals(status, created_at DESC);


-- ============================================
-- VERIFICACIÓN POST-CREACIÓN
-- ============================================
-- Ejecutar estas queries DESPUÉS de crear todos los índices:

-- 1. Verificar que todos los índices fueron creados:
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- 2. Contar índices creados:
SELECT COUNT(*) as total_indices
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%';

-- Esperado: 18 o más índices

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
--
-- - Cada INDEX tarda ~1-2 segundos en crear
-- - Total estimado: 18-36 segundos
-- - NO necesita reiniciar servidor
-- - Los cambios son INMEDIATOS en queries
-- - Verificar con EXPLAIN ANALYZE después de crear
--
-- EJEMPLO de query optimizada:
-- EXPLAIN ANALYZE
-- SELECT * FROM usuarios WHERE role = 'estudiante' LIMIT 10;
--
-- ANTES (Seq Scan):
--   Seq Scan on usuarios  (cost=0.00..35.50 rows=100)
--   Execution Time: 1200.456 ms
--
-- DESPUÉS (Index Scan):
--   Index Scan using idx_usuarios_role on usuarios
--   Execution Time: 45.123 ms
--
-- ============================================
