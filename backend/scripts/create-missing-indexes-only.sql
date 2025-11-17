-- =====================================================
-- 🚀 CREAR SOLO ÍNDICES FALTANTES
-- Versión segura que verifica existencia primero
-- =====================================================

-- VERIFICAR QUÉ ÍNDICES EXISTEN
SELECT 'Índices existentes antes de comenzar:' as status;
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- =====================================================
-- CREAR ÍNDICES SI NO EXISTEN (PostgreSQL 9.5+)
-- =====================================================

-- TABLA: docentes
CREATE INDEX IF NOT EXISTS idx_docentes_apellidos_nombre ON docentes(apellido_paterno, apellido_materno, nombre);
CREATE INDEX IF NOT EXISTS idx_docentes_usuario_id ON docentes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_docentes_created_at ON docentes(created_at DESC);

-- TABLA: estudiantes
CREATE INDEX IF NOT EXISTS idx_estudiantes_apellidos_nombre ON estudiantes(apellido_paterno, apellido_materno, nombre);
CREATE INDEX IF NOT EXISTS idx_estudiantes_usuario_id ON estudiantes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_estudiantes_semestre ON estudiantes(semestre);
CREATE INDEX IF NOT EXISTS idx_estudiantes_created_at ON estudiantes(created_at DESC);

-- TABLA: calificaciones
CREATE INDEX IF NOT EXISTS idx_calificaciones_docente_id ON calificaciones(docente_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_estudiante_materia ON calificaciones(estudiante_id, materia_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_created_at ON calificaciones(created_at DESC);

-- TABLA: usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_created_at ON usuarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usuarios_last_login ON usuarios(last_login DESC);

-- TABLA: citas (si existe)
CREATE INDEX IF NOT EXISTS idx_citas_created_at ON citas(created_at DESC);

-- TABLA: solicitudes_documentos (si existe)
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha ON solicitudes_documentos(fecha_solicitud DESC);

-- TABLA: noticias (si existe)
CREATE INDEX IF NOT EXISTS idx_noticias_created_at ON noticias(created_at DESC);

-- TABLA: eventos (si existe)
CREATE INDEX IF NOT EXISTS idx_eventos_created_at ON eventos(created_at DESC);

-- ACTUALIZAR ESTADÍSTICAS
ANALYZE docentes;
ANALYZE estudiantes;
ANALYZE calificaciones;
ANALYZE usuarios;

-- VERIFICAR ÍNDICES CREADOS
SELECT 'Índices totales después:' as status;
SELECT count(*) as total_indices
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%';

SELECT 'Lista completa de índices:' as status;
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
