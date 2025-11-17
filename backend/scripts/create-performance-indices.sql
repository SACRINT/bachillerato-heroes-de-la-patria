-- ============================================
-- PERFORMANCE INDICES - SEMANA 3
-- Optimización de queries lentas >100ms
-- ============================================

-- Fecha: 17 Noviembre 2025
-- Objetivo: Reducir query time de 800ms a 200ms (75%)

BEGIN;

-- ============================================
-- ÍNDICES PARA AUTENTICACIÓN (Queries frecuentes)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_usuarios_email
    ON usuarios(email);

CREATE INDEX IF NOT EXISTS idx_usuarios_role
    ON usuarios(role);

CREATE INDEX IF NOT EXISTS idx_usuarios_status
    ON usuarios(status);

CREATE INDEX IF NOT EXISTS idx_usuarios_email_status
    ON usuarios(email, status);

-- ============================================
-- ÍNDICES PARA ESTUDIANTES (Dashboard queries)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_estudiantes_status
    ON estudiantes(status);

CREATE INDEX IF NOT EXISTS idx_estudiantes_grado
    ON estudiantes(grado, grupo);

CREATE INDEX IF NOT EXISTS idx_estudiantes_fecha_registro
    ON estudiantes(fecha_registro DESC);

CREATE INDEX IF NOT EXISTS idx_estudiantes_nombre
    ON estudiantes(nombre, apellido_paterno);

-- ============================================
-- ÍNDICES PARA CALIFICACIONES (Performance crítico)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_calificaciones_estudiante
    ON calificaciones(estudiante_id);

CREATE INDEX IF NOT EXISTS idx_calificaciones_periodo
    ON calificaciones(periodo_academico);

CREATE INDEX IF NOT EXISTS idx_calificaciones_estudiante_periodo
    ON calificaciones(estudiante_id, periodo_academico);

CREATE INDEX IF NOT EXISTS idx_calificaciones_materia
    ON calificaciones(materia_id);

-- Índice para cálculo de promedio
CREATE INDEX IF NOT EXISTS idx_calificaciones_estudiante_calificacion
    ON calificaciones(estudiante_id, calificacion_final);

-- ============================================
-- ÍNDICES PARA ASISTENCIA (Reportes diarios)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_asistencia_estudiante
    ON asistencia(estudiante_id);

CREATE INDEX IF NOT EXISTS idx_asistencia_fecha
    ON asistencia(fecha DESC);

CREATE INDEX IF NOT EXISTS idx_asistencia_estudiante_fecha
    ON asistencia(estudiante_id, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_asistencia_status
    ON asistencia(status);

-- ============================================
-- ÍNDICES PARA PAGOS (Finanzas)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_pagos_estudiante
    ON pagos_pendientes(estudiante_id);

CREATE INDEX IF NOT EXISTS idx_pagos_estado
    ON pagos_pendientes(estado);

CREATE INDEX IF NOT EXISTS idx_pagos_fecha_vencimiento
    ON pagos_pendientes(fecha_vencimiento);

CREATE INDEX IF NOT EXISTS idx_pagos_estudiante_estado
    ON pagos_pendientes(estudiante_id, estado);

-- Índice para queries de reportes financieros
CREATE INDEX IF NOT EXISTS idx_pagos_periodo
    ON pagos_pendientes(periodo);

-- ============================================
-- ÍNDICES PARA INSCRIPCIONES (Joins frecuentes)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_inscripciones_estudiante
    ON inscripciones(estudiante_id);

CREATE INDEX IF NOT EXISTS idx_inscripciones_curso
    ON inscripciones(curso_id);

CREATE INDEX IF NOT EXISTS idx_inscripciones_periodo
    ON inscripciones(periodo_academico);

-- Índice compuesto para verificar inscripción duplicada
CREATE UNIQUE INDEX IF NOT EXISTS idx_inscripciones_unique
    ON inscripciones(estudiante_id, curso_id, periodo_academico);

-- ============================================
-- ÍNDICES PARA NOTICIAS & EVENTOS (Content)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_noticias_fecha
    ON noticias(fecha_publicacion DESC);

CREATE INDEX IF NOT EXISTS idx_noticias_categoria
    ON noticias(categoria);

CREATE INDEX IF NOT EXISTS idx_noticias_status
    ON noticias(estado);

CREATE INDEX IF NOT EXISTS idx_eventos_fecha_inicio
    ON eventos(fecha_inicio);

CREATE INDEX IF NOT EXISTS idx_eventos_fecha_rango
    ON eventos(fecha_inicio, fecha_fin);

CREATE INDEX IF NOT EXISTS idx_eventos_tipo
    ON eventos(tipo);

-- ============================================
-- ÍNDICES PARA CITAS (Appointments)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_citas_fecha
    ON citas(fecha_solicitada);

CREATE INDEX IF NOT EXISTS idx_citas_estado
    ON citas(estado);

CREATE INDEX IF NOT EXISTS idx_citas_solicitante
    ON citas(solicitante_email);

CREATE INDEX IF NOT EXISTS idx_citas_docente
    ON citas(docente_asignado);

-- ============================================
-- ÍNDICES PARA EGRESADOS & BOLSA TRABAJO
-- ============================================

CREATE INDEX IF NOT EXISTS idx_egresados_email
    ON egresados(email);

CREATE INDEX IF NOT EXISTS idx_egresados_generacion
    ON egresados(generacion);

CREATE INDEX IF NOT EXISTS idx_egresados_estatus
    ON egresados(estatus_laboral);

CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_email
    ON bolsa_trabajo(email);

CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_fecha
    ON bolsa_trabajo(fecha_registro DESC);

-- ============================================
-- ÍNDICES PARA MULTI-TENANCY (Si aplica)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tenants_dominio
    ON tenants(dominio);

CREATE INDEX IF NOT EXISTS idx_tenants_status
    ON tenants(status);

-- ============================================
-- ANÁLISIS Y VACUUM
-- ============================================

-- Actualizar estadísticas para el query planner
ANALYZE;

-- Vacuum para recuperar espacio
VACUUM ANALYZE;

COMMIT;

-- ============================================
-- VERIFICACIÓN DE ÍNDICES
-- ============================================

-- Query para verificar índices creados
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Query para ver tamaño de índices
SELECT
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================
-- NOTAS DE IMPLEMENTACIÓN
-- ============================================

/*
EJECUCIÓN:
  psql $DATABASE_URL -f backend/scripts/create-performance-indices.sql

IMPACTO ESPERADO:
  - Queries de dashboard: 800ms → 150ms (81% mejora)
  - Búsquedas de estudiantes: 450ms → 80ms (82% mejora)
  - Reportes de calificaciones: 1.2s → 220ms (82% mejora)
  - Login/autenticación: 120ms → 25ms (79% mejora)

MONITOREO POST-IMPLEMENTACIÓN:
  -- Ver queries lentas
  SELECT * FROM pg_stat_statements
  ORDER BY total_time DESC LIMIT 10;

  -- Ver índices no utilizados
  SELECT * FROM pg_stat_user_indexes
  WHERE idx_scan = 0;

MANTENIMIENTO:
  -- Re-indexar periódicamente (mensual)
  REINDEX DATABASE nombre_bd;

  -- Actualizar estadísticas (semanal)
  ANALYZE;
*/
