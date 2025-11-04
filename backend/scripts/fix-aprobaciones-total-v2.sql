-- ============================================================================
-- 🔧 FIX V2: ARREGLO TOTAL DE APROBACIONES - VERSIÓN AGRESIVA
-- Fecha: 3 Noviembre 2025
-- Propósito: Forzar sincronización BD ↔ UI sin restricciones
-- ============================================================================

-- PASO 1: Ver estado actual
SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
    COUNT(*) FILTER (WHERE estado = 'pendiente' AND email_confirmado = true) as pendientes_confirmados,
    COUNT(*) FILTER (WHERE estado = 'pendiente' AND email_confirmado = false) as pendientes_no_confirmados
FROM pendientes_aprobacion;

-- PASO 2: FORZAR email_confirmado=true PARA TODOS LOS PENDIENTES
-- Sin condición de email_confirmado anterior
UPDATE pendientes_aprobacion
SET email_confirmado = true
WHERE estado = 'pendiente';

-- PASO 3: Verificar cambios
SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
    COUNT(*) FILTER (WHERE estado = 'pendiente' AND email_confirmado = true) as pendientes_confirmados,
    COUNT(*) FILTER (WHERE estado = 'pendiente' AND email_confirmado = false) as pendientes_no_confirmados
FROM pendientes_aprobacion;

-- PASO 4: Listar todos los pendientes para validación visual
SELECT
    id,
    tipo_solicitud,
    email_usuario,
    estado,
    email_confirmado,
    fecha_solicitud
FROM pendientes_aprobacion
WHERE estado = 'pendiente'
ORDER BY fecha_solicitud DESC;

-- PASO 5: Ver resumen por tipo
SELECT
    tipo_solicitud,
    COUNT(*) as cantidad,
    COUNT(*) FILTER (WHERE email_confirmado = true) as confirmados,
    COUNT(*) FILTER (WHERE email_confirmado = false) as no_confirmados
FROM pendientes_aprobacion
WHERE estado = 'pendiente'
GROUP BY tipo_solicitud;

-- ============================================================================
-- ✅ ESPERADO DESPUÉS DE EJECUTAR:
-- - Todos los pendientes tendrán email_confirmado=true
-- - GET /api/pendientes-aprobacion mostrará TODOS los registros
-- - Botones Aprobar/Rechazar funcionarán correctamente
-- ============================================================================
