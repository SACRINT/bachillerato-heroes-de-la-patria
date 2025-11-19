-- ========================================
-- SCRIPT DE VERIFICACIÓN DE ÍNDICES
-- BGE Héroes de la Patria
-- Fecha: 19 Noviembre 2025
-- ========================================

-- 1. LISTAR TODOS LOS ÍNDICES CREADOS
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 2. CONTAR ÍNDICES POR TABLA
SELECT
    tablename,
    COUNT(*) as total_indexes
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY total_indexes DESC;

-- 3. VERIFICAR TAMAÑO DE ÍNDICES
SELECT
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- 4. EJEMPLOS DE EXPLAIN ANALYZE (antes vs después)

-- Query de login
EXPLAIN ANALYZE
SELECT * FROM usuarios
WHERE email = 'admin@bge.edu.mx';

-- Query de citas disponibles
EXPLAIN ANALYZE
SELECT * FROM citas
WHERE fecha_solicitada > CURRENT_DATE
AND estado = 'pendiente';

-- Query de pending approvals
EXPLAIN ANALYZE
SELECT * FROM pending_approvals
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Query de avisos públicos
EXPLAIN ANALYZE
SELECT * FROM avisos
WHERE estado = 'publicado'
ORDER BY fecha_publicacion DESC
LIMIT 10;

-- Query de notificaciones no leídas
EXPLAIN ANALYZE
SELECT COUNT(*) FROM notificaciones
WHERE usuario_id = 1
AND leida = false;

-- 5. ESTADÍSTICAS DE USO DE ÍNDICES
SELECT
    schemaname,
    relname,
    indexrelname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- ========================================
-- RESULTADO ESPERADO
-- ========================================
-- - Queries deben mostrar "Index Scan" en lugar de "Seq Scan"
-- - Tiempo de ejecución debe reducirse 40-60%
-- - idx_scan debe incrementar con el uso
