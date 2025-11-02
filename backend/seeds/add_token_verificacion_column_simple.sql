-- =========================================
-- AGREGAR COLUMNA token_verificacion A suscriptores_notificaciones
-- Fecha: 01 de Noviembre 2025
-- Versión simplificada sin bloques DO $$
-- =========================================

-- Agregar columna token_verificacion si no existe
ALTER TABLE suscriptores_notificaciones
ADD COLUMN IF NOT EXISTS token_verificacion VARCHAR(64) UNIQUE;

-- Crear índice para búsquedas rápidas por token
CREATE INDEX IF NOT EXISTS idx_suscriptores_token_verificacion
ON suscriptores_notificaciones(token_verificacion)
WHERE token_verificacion IS NOT NULL;

-- Verificar estructura actualizada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'suscriptores_notificaciones'
AND column_name IN ('token_verificacion', 'verificado', 'fecha_verificacion', 'estado')
ORDER BY ordinal_position;
