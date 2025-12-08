-- =====================================================================
-- PASO 1: DIAGNÓSTICO SEGURO - Ver estructura de usuarios
-- =====================================================================
-- Ejecuta ESTO PRIMERO para ver la estructura exacta de tu tabla usuarios

\echo '=== ESTRUCTURA DE TABLA usuarios ==='
\d usuarios

\echo ''
\echo '=== COLUMNAS DE TABLA usuarios ==='
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'usuarios'
ORDER BY ordinal_position;

\echo ''
\echo '=== PRIMARY KEY de usuarios ==='
SELECT constraint_name, column_name
FROM information_schema.key_column_usage
WHERE table_schema = 'public'
AND table_name = 'usuarios'
AND constraint_type = 'PRIMARY KEY';

\echo ''
\echo '=== PRIMERAS 5 FILAS de usuarios ==='
SELECT * FROM usuarios LIMIT 5;
