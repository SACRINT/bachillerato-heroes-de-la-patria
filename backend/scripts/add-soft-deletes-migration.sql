-- =====================================================
-- 🗑️ SOFT DELETES - MIGRATION
-- Fecha: 16 Noviembre 2025
-- Descripción: Agregar columna deleted_at a tablas principales
-- =====================================================

-- IMPACTO:
-- - Previene pérdida accidental de datos
-- - Permite recuperación de registros eliminados
-- - Auditoría completa de eliminaciones
-- - Cumplimiento GDPR (derecho al olvido)

-- =====================================================
-- AGREGAR COLUMNA deleted_at A TABLAS PRINCIPALES
-- =====================================================

-- TABLA: usuarios
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_deleted_at
ON usuarios(deleted_at)
WHERE deleted_at IS NOT NULL;

-- TABLA: estudiantes
ALTER TABLE estudiantes
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_estudiantes_deleted_at
ON estudiantes(deleted_at)
WHERE deleted_at IS NOT NULL;

-- TABLA: docentes
ALTER TABLE docentes
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_docentes_deleted_at
ON docentes(deleted_at)
WHERE deleted_at IS NOT NULL;

-- TABLA: calificaciones
ALTER TABLE calificaciones
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_calificaciones_deleted_at
ON calificaciones(deleted_at)
WHERE deleted_at IS NOT NULL;

-- TABLA: noticias
ALTER TABLE noticias
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_noticias_deleted_at
ON noticias(deleted_at)
WHERE deleted_at IS NOT NULL;

-- TABLA: eventos
ALTER TABLE eventos
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_eventos_deleted_at
ON eventos(deleted_at)
WHERE deleted_at IS NOT NULL;

-- TABLA: avisos
ALTER TABLE avisos
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_avisos_deleted_at
ON avisos(deleted_at)
WHERE deleted_at IS NOT NULL;

-- TABLA: citas
ALTER TABLE citas
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_citas_deleted_at
ON citas(deleted_at)
WHERE deleted_at IS NOT NULL;

-- TABLA: solicitudes_documentos
ALTER TABLE solicitudes_documentos
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_solicitudes_deleted_at
ON solicitudes_documentos(deleted_at)
WHERE deleted_at IS NOT NULL;

-- TABLA: contactos
ALTER TABLE contactos
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_contactos_deleted_at
ON contactos(deleted_at)
WHERE deleted_at IS NOT NULL;

-- =====================================================
-- FUNCIONES DE UTILIDAD PARA SOFT DELETE
-- =====================================================

-- Función genérica para soft delete
CREATE OR REPLACE FUNCTION soft_delete(table_name TEXT, record_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    EXECUTE format('UPDATE %I SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL', table_name)
    USING record_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Función para restaurar registro
CREATE OR REPLACE FUNCTION restore_deleted(table_name TEXT, record_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    EXECUTE format('UPDATE %I SET deleted_at = NULL WHERE id = $1', table_name)
    USING record_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Función para eliminar permanentemente (usar con CUIDADO)
CREATE OR REPLACE FUNCTION hard_delete(table_name TEXT, record_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    EXECUTE format('DELETE FROM %I WHERE id = $1', table_name)
    USING record_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS PARA FACILITAR QUERIES
-- =====================================================

-- View de usuarios activos (no eliminados)
CREATE OR REPLACE VIEW usuarios_activos AS
SELECT * FROM usuarios WHERE deleted_at IS NULL;

-- View de estudiantes activos
CREATE OR REPLACE VIEW estudiantes_activos AS
SELECT * FROM estudiantes WHERE deleted_at IS NULL;

-- View de docentes activos
CREATE OR REPLACE VIEW docentes_activos AS
SELECT * FROM docentes WHERE deleted_at IS NULL;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar columnas agregadas
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE column_name = 'deleted_at'
AND table_schema = 'public'
ORDER BY table_name;

-- Verificar índices creados
SELECT
    tablename,
    indexname
FROM pg_indexes
WHERE indexname LIKE '%deleted_at%'
ORDER BY tablename;

-- Verificar funciones creadas
SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name IN ('soft_delete', 'restore_deleted', 'hard_delete')
AND routine_schema = 'public';

-- =====================================================
-- EJEMPLOS DE USO
-- =====================================================

/*
-- Soft delete de un usuario
SELECT soft_delete('usuarios', 123);

-- Restaurar usuario eliminado
SELECT restore_deleted('usuarios', 123);

-- Hard delete (permanente - usar con CUIDADO)
SELECT hard_delete('usuarios', 123);

-- Query con filtro manual
SELECT * FROM usuarios WHERE deleted_at IS NULL;

-- Query usando view
SELECT * FROM usuarios_activos;

-- Ver registros eliminados
SELECT * FROM usuarios WHERE deleted_at IS NOT NULL;
*/

-- =====================================================
-- NOTAS DE IMPLEMENTACIÓN
-- =====================================================

/*
PRÓXIMOS PASOS EN CÓDIGO:

1. Actualizar DAL (database-access.js):
   - Agregar WHERE deleted_at IS NULL a todos los SELECT
   - Modificar delete functions para usar soft_delete
   - Agregar función restoreRecord(table, id)

2. Actualizar Routes:
   - Endpoint DELETE debe llamar soft_delete
   - Nuevo endpoint POST /restore para restaurar
   - Admin endpoint GET /deleted para ver eliminados

3. Testing:
   - Verificar que queries filtren deleted
   - Test de soft delete + restore
   - Test de hard delete (solo admin)

4. Documentación:
   - Actualizar CHANGELOG.md
   - Documenta En docs/SOFT_DELETES.md
*/
