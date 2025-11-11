-- =====================================================
-- 🔍 DIAGNÓSTICO: Análisis del Problema del Índice
-- Tabla: estudiantes
-- Fecha: 10 de Noviembre de 2025
-- =====================================================

-- =================================================
-- PASO 1: VERIFICAR COLLATION DE LAS COLUMNAS
-- =================================================
-- Este paso verifica qué collation tienen las columnas en la tabla
-- Si el collation es diferente al del índice, PostgreSQL no lo usará

SELECT
    a.attname as column_name,
    c.collname as collation_name,
    c.collencoding as encoding
FROM pg_attribute a
JOIN pg_collation c ON a.attcollation = c.oid
JOIN pg_class cl ON a.attrelid = cl.oid
WHERE cl.relname = 'estudiantes'
AND a.attname IN ('apellido_paterno', 'apellido_materno', 'nombre')
ORDER BY a.attnum;

-- =================================================
-- PASO 2: CONSULTA CON COLLATE "C" FORZADO EN ORDER BY
-- =================================================
-- ESTE ES EL PASO CRÍTICO
-- Si esta consulta SÍ usa Index Scan, el problema está en cómo
-- la aplicación interpreta las columnas (sin COLLATE en la query)

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT
    id,
    matricula,
    nombre,
    apellido_paterno,
    apellido_materno,
    especialidad,
    semestre,
    promedio,
    status_academico
FROM estudiantes
ORDER BY
    apellido_paterno COLLATE "C" ASC,
    apellido_materno COLLATE "C" ASC,
    nombre COLLATE "C" ASC;

-- =================================================
-- PASO 3: ESTADÍSTICAS DE DISTINCTIVIDAD
-- =================================================
-- Un valor n_distinct bajo podría explicar por qué el planificador
-- prefiere un Seq Scan (si los valores no son muy únicos)

SELECT
    attname,
    n_distinct,
    n_distinct_inherited,
    avg_width,
    null_frac
FROM pg_stats
WHERE tablename = 'estudiantes'
AND attname IN ('apellido_paterno', 'apellido_materno', 'nombre')
ORDER BY attname;

-- =================================================
-- PASO 4: INFORMACIÓN DEL ÍNDICE (si existe)
-- =================================================
-- Ver detalles del índice creado

SELECT
    indexname,
    indexdef,
    pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size,
    idx_scan as times_used,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_indexes
LEFT JOIN pg_stat_user_indexes ON pg_indexes.indexname = pg_stat_user_indexes.indexrelname
WHERE tablename = 'estudiantes'
AND indexname LIKE '%apellidos%'
ORDER BY indexname;

-- =================================================
-- PASO 5: CONFIGURACIÓN DE QUERY PLANNER
-- =================================================
-- Ver parámetros que afectan cómo el planificador elige estrategias

SHOW random_page_cost;
SHOW seq_page_cost;
SHOW cpu_tuple_cost;
SHOW cpu_index_tuple_cost;
SHOW effective_cache_size;

-- =================================================
-- PASO 6: ESTADÍSTICAS GENERALES DE LA TABLA
-- =================================================

SELECT
    schemaname,
    tablename,
    n_live_tup,
    n_dead_tup,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename = 'estudiantes';
