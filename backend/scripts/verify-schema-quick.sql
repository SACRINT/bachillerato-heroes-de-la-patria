-- =====================================================
-- 🔍 VERIFICACIÓN DE SCHEMA - DIAGNÓSTICO RÁPIDO
-- =====================================================

-- 1. Verificar columnas de tabla estudiantes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'estudiantes'
ORDER BY ordinal_position;

-- 2. Verificar columnas de tabla docentes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'docentes'
ORDER BY ordinal_position;

-- 3. Verificar columnas de tabla calificaciones
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'calificaciones'
ORDER BY ordinal_position;

-- 4. Verificar si existen las tablas problemáticas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('padres', 'parents', 'parents_students', 'materias', 'cursos', 'inscripciones_materias');

-- 5. Listar TODOS los índices actuales
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
