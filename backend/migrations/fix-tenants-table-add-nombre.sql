-- ============================================
-- FIX: Agregar columna 'nombre' a tabla tenants
-- Fecha: 17 Noviembre 2025
-- Razón: tenant-context.js requiere columna 'nombre'
-- ============================================

-- 1. Verificar estructura actual de tabla tenants
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tenants'
ORDER BY ordinal_position;

-- 2. Agregar columna 'nombre' si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tenants'
        AND column_name = 'nombre'
    ) THEN
        ALTER TABLE tenants
        ADD COLUMN nombre VARCHAR(255) DEFAULT 'Tenant';

        RAISE NOTICE 'Columna "nombre" agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna "nombre" ya existe';
    END IF;
END $$;

-- 3. Crear índice para mejorar performance en búsquedas
CREATE INDEX IF NOT EXISTS idx_tenants_nombre ON tenants(nombre);

-- 4. Actualizar tenants existentes con nombre descriptivo
UPDATE tenants
SET nombre = COALESCE(
    config_json->>'school_name',
    subdomain,
    dominio,
    'Tenant'
)
WHERE nombre IS NULL OR nombre = 'Tenant';

-- 5. Verificar que la columna fue creada correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tenants'
AND column_name = 'nombre';

-- 6. Verificar datos de ejemplo
SELECT id, nombre, subdomain, dominio, status
FROM tenants
LIMIT 5;

-- ============================================
-- RESULTADO ESPERADO:
-- ✅ Columna 'nombre' creada en tabla tenants
-- ✅ Índice idx_tenants_nombre creado
-- ✅ Tenants existentes actualizados con nombre
-- ============================================
