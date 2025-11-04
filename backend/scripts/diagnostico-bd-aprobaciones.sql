-- ============================================================================
-- 🔍 SCRIPT DE DIAGNÓSTICO - TABLA pendientes_aprobacion
-- Propósito: Entender qué está en la BD y por qué los botones no funcionan
-- ============================================================================

-- PASO 1: Ver estructura de la tabla
\d pendientes_aprobacion

-- PASO 2: Contar registros TOTALES
SELECT
    'TOTAL REGISTROS' as metrica,
    COUNT(*) as cantidad
FROM pendientes_aprobacion;

-- PASO 3: Desglose por estado
SELECT
    estado,
    COUNT(*) as cantidad
FROM pendientes_aprobacion
GROUP BY estado
ORDER BY cantidad DESC;

-- PASO 4: Desglose por estado Y confirmación
SELECT
    estado,
    email_confirmado,
    COUNT(*) as cantidad
FROM pendientes_aprobacion
GROUP BY estado, email_confirmado
ORDER BY estado, email_confirmado;

-- PASO 5: Ver primeros 10 registros pendientes
SELECT
    id,
    tipo_solicitud,
    email_usuario,
    estado,
    email_confirmado,
    fecha_solicitud,
    created_at
FROM pendientes_aprobacion
WHERE estado = 'pendiente'
ORDER BY fecha_solicitud DESC
LIMIT 10;

-- PASO 6: Verificar si hay triggers o constraints que afecten
SELECT
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'pendientes_aprobacion';

-- PASO 7: Ver esquema completo de la tabla
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'pendientes_aprobacion'
ORDER BY ordinal_position;

-- PASO 8: Intentar actualizar 1 registro como prueba
-- DESCOMENTA LA SIGUIENTE LÍNEA SOLO PARA PROBAR:
-- UPDATE pendientes_aprobacion
-- SET email_confirmado = true
-- WHERE id = 1 AND estado = 'pendiente'
-- RETURNING id, email_confirmado;

-- PASO 9: Ver si hay permisos de escritura
-- SELECT * FROM pg_tables WHERE tablename = 'pendientes_aprobacion';

-- ============================================================================
-- NOTAS PARA INTERPRETAR RESULTADOS:
-- - Si no hay columna email_confirmado: TABLE MIGRATION FALTA
-- - Si todos muestran email_confirmado=false: UPDATE NO FUNCIONÓ
-- - Si hay 6 pendientes pero 5 no confirmados: PROBLEMA EN EL SQL ANTERIOR
-- ============================================================================
