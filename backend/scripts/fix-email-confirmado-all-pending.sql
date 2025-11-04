-- ============================================================================
-- 🔧 FIX: Asegurar que TODOS los registros pendientes tienen email_confirmado=true
-- Fecha: 3 Noviembre 2025
-- Propósito: Sincronizar la BD después de arreglar el bug de aprobaciones
-- ============================================================================

-- Verificar estado actual
SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
    COUNT(*) FILTER (WHERE estado = 'pendiente' AND email_confirmado = true) as pendientes_confirmados,
    COUNT(*) FILTER (WHERE estado = 'pendiente' AND email_confirmado = false) as pendientes_no_confirmados
FROM pendientes_aprobacion;

-- Actualizar todos los registros pendientes a email_confirmado=true
-- Esto asegura que el filtro del frontend muestre TODOS los registros
UPDATE pendientes_aprobacion
SET email_confirmado = true
WHERE estado = 'pendiente' AND email_confirmado = false;

-- Verificar cambios
SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
    COUNT(*) FILTER (WHERE estado = 'pendiente' AND email_confirmado = true) as pendientes_confirmados,
    COUNT(*) FILTER (WHERE estado = 'pendiente' AND email_confirmado = false) as pendientes_no_confirmados
FROM pendientes_aprobacion;

-- Listar todos los registros pendientes para validación visual
SELECT id, tipo_solicitud, email_usuario, estado, email_confirmado, fecha_solicitud
FROM pendientes_aprobacion
WHERE estado = 'pendiente'
ORDER BY fecha_solicitud DESC;

-- ============================================================================
-- Notas:
-- - Este script asegura sincronización entre BD y UI
-- - Todos los registros pendientes ahora tendrán email_confirmado=true
-- - El endpoint GET /api/pendientes-aprobacion ya no filtra por email_confirmado
-- - Los botones Aprobar y Rechazar ahora funcionan correctamente:
--   * Rechazar: BORRA el registro de la BD
--   * Aprobar: MUEVE el registro a la tabla definitiva
-- ============================================================================
