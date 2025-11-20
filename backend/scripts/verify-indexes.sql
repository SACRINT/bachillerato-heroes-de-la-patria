-- ========================================
-- SCRIPT DE VERIFICACIÓN DE ÍNDICES
-- BGE Héroes de la Patria
-- ========================================

-- 1. Listar todos los índices por tabla
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 2. Conteo de índices por tabla
SELECT
    tablename,
    COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY index_count DESC;

-- 3. Tamaño de índices
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;

-- 4. Índices no utilizados (para limpieza futura)
SELECT
    schemaname || '.' || relname AS table,
    indexrelname AS index,
    pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size,
    idx_scan as index_scans
FROM pg_stat_user_indexes ui
JOIN pg_index i ON ui.indexrelid = i.indexrelid
WHERE NOT indisunique
AND idx_scan = 0
ORDER BY pg_relation_size(i.indexrelid) DESC;

-- 5. Queries de ejemplo con EXPLAIN ANALYZE
-- (descomentar para ejecutar)

-- EXPLAIN ANALYZE SELECT * FROM usuarios WHERE email = 'admin@bge.edu.mx';
-- EXPLAIN ANALYZE SELECT * FROM estudiantes WHERE grado = '3' AND grupo = 'A';
-- EXPLAIN ANALYZE SELECT * FROM calificaciones WHERE estudiante_id = 1;
-- EXPLAIN ANALYZE SELECT * FROM pending_approvals WHERE status = 'pending';
-- EXPLAIN ANALYZE SELECT * FROM iacoins_balances ORDER BY total_earned DESC LIMIT 10;
