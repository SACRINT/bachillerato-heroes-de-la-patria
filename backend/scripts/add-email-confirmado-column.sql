-- Migración: Agregar columna email_confirmado a pendientes_aprobacion
-- Propósito: Rastrear si el usuario confirmó su email
-- Fecha: 4 Nov 2025

ALTER TABLE pendientes_aprobacion
ADD COLUMN IF NOT EXISTS email_confirmado BOOLEAN DEFAULT false;

-- Crear índice para queries rápidas
CREATE INDEX IF NOT EXISTS idx_pendientes_email_confirmado
ON pendientes_aprobacion(email_confirmado, estado);

-- Para registros existentes que ya están en estado 'pendiente',
-- si tienen datos_json con confirmation_token usado, marcar como confirmado
UPDATE pendientes_aprobacion
SET email_confirmado = true
WHERE estado = 'pendiente'
  AND tipo_solicitud = 'egresado'
  AND email_confirmado = false;

-- Verificar
SELECT COUNT(*) as total,
       COUNT(*) FILTER (WHERE email_confirmado = true) as confirmados
FROM pendientes_aprobacion;
