-- =====================================================
-- 🚀 OPTIMIZACIÓN: Índice Compuesto para ORDER BY
-- Tabla: estudiantes
-- Performance esperada: 800ms → 200ms
-- Fecha: 9 de Noviembre de 2025
-- =====================================================

-- 1. Crear índice B-Tree (estructura óptima para ORDER BY)
CREATE INDEX CONCURRENTLY idx_estudiantes_apellidos_nombre
ON estudiantes (apellido_paterno ASC, apellido_materno ASC, nombre ASC);

-- 2. Analizar tabla para actualizar estadísticas
ANALYZE estudiantes;

-- 3. Verificar creación
SELECT
    indexname,
    indexdef,
    pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size
FROM pg_indexes
WHERE tablename = 'estudiantes'
ORDER BY indexname;
