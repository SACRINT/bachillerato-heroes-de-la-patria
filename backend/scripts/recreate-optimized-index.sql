-- =====================================================
-- 🔧 RECREACIÓN DE ÍNDICE CON COLLATE "C"
-- Tabla: estudiantes
-- Fecha: 10 de Noviembre de 2025
-- Propósito: Forzar el uso de Index Scan sobre Seq Scan
-- =====================================================

-- PASO 1: Eliminar el índice anterior si existe para evitar conflictos
DROP INDEX IF EXISTS idx_estudiantes_apellidos_nombre;

-- PASO 2: Crear el nuevo índice optimizado con COLLATE "C"
-- COLLATE "C" fuerza una comparación binaria, lo que permite al planificador
-- estar más seguro de que puede usar el índice para ORDER BY
CREATE INDEX CONCURRENTLY idx_estudiantes_apellidos_nombre_collate
ON estudiantes (
    apellido_paterno COLLATE "C" ASC,
    apellido_materno COLLATE "C" ASC,
    nombre COLLATE "C" ASC
);

-- PASO 3: Analizar la tabla para actualizar estadísticas
ANALYZE estudiantes;

-- PASO 4: Verificar que el índice fue creado exitosamente
SELECT
    indexname,
    indexdef,
    pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size
FROM pg_indexes
WHERE tablename = 'estudiantes'
AND indexname LIKE '%apellidos%'
ORDER BY indexname;
