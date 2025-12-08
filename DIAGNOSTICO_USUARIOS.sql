-- =====================================================
-- DIAGNÓSTICO: Estructura REAL de tabla usuarios
-- Ejecuta SOLO esta query en Neon Console
-- =====================================================

-- Ver estructura exacta de tabla usuarios
\d usuarios

-- Alternativa si lo anterior no funciona:
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'usuarios'
ORDER BY ordinal_position;

-- Ver todas las tablas que existen
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Ver si la tabla usuarios tiene PRIMARY KEY
SELECT constraint_name, column_name
FROM information_schema.key_column_usage
WHERE table_schema = 'public'
AND table_name = 'usuarios';
