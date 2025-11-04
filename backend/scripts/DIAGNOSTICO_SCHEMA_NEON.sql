-- ============================================================================
-- 🔍 SCRIPT DE DIAGNÓSTICO - Ver estructura real de tablas
-- Copia y ejecuta ESTE script en Neon Console
-- ============================================================================

-- Ver estructura de tabla usuarios
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- Ver estructura de tabla docentes
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'docentes'
ORDER BY ordinal_position;

-- Ver estructura de tabla parents
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'parents'
ORDER BY ordinal_position;

-- Ver estructura de tabla solicitudes
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'solicitudes'
ORDER BY ordinal_position;

-- Ver estructura de tabla citas
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'citas'
ORDER BY ordinal_position;

-- Ver estructura de tabla pendientes_aprobacion
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'pendientes_aprobacion'
ORDER BY ordinal_position;

-- ============================================================================
-- ⚠️ COPIAR TODO EL OUTPUT y enviar a Claude
-- ============================================================================
