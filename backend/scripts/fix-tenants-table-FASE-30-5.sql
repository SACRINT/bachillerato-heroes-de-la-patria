-- ============================================
-- FIX CRÍTICO FASE 30.5 - Agregar columna 'dominio' a tabla tenants
-- Ejecutar en: Neon Console (https://console.neon.tech)
-- Base de datos: neondb
-- ============================================

-- PASO 1: Verificar si la columna ya existe
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'tenants' AND column_name = 'dominio';

-- PASO 2: Agregar la columna 'dominio' si no existe
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS dominio VARCHAR(255) DEFAULT 'default';

-- PASO 3: Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_tenants_dominio ON tenants(dominio);

-- PASO 4: Verificar que la columna fue agregada correctamente
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'tenants'
ORDER BY ordinal_position;

-- PASO 5: Listar registros en tenants (verificar que existan)
SELECT id, nombre, dominio, created_at
FROM tenants
LIMIT 10;

-- PASO 6: Si tenants está vacía, insertar registro default
INSERT INTO tenants (id, nombre, dominio, created_at, updated_at)
VALUES (
    'default',
    'BGE Héroes de la Patria',
    'default',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    dominio = 'default',
    updated_at = NOW();

-- PASO 7: Verificación final - mostrar estructura de la tabla
\d tenants
