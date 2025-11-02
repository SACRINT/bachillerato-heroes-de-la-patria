-- =========================================
-- AGREGAR COLUMNA token_verificacion A suscriptores_notificaciones
-- Fecha: 01 de Noviembre 2025
-- =========================================

-- Agregar columna token_verificacion si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'suscriptores_notificaciones'
        AND column_name = 'token_verificacion'
    ) THEN
        ALTER TABLE suscriptores_notificaciones
        ADD COLUMN token_verificacion VARCHAR(64) UNIQUE;

        RAISE NOTICE 'Columna token_verificacion agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna token_verificacion ya existe';
    END IF;
END $$;

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

RAISE NOTICE '✅ Migración completada exitosamente';
