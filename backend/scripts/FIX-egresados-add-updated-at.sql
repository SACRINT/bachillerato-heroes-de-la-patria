-- ============================================================================
-- 🔧 FIX: Agregar columna updated_at a tabla egresados
-- Problema: El trigger intenta actualizar updated_at pero la columna no existe
-- Solución: Agregar la columna y crear el trigger
-- ============================================================================

-- 1. VERIFICAR si la columna ya existe
SELECT column_name FROM information_schema.columns
WHERE table_name='egresados' AND column_name='updated_at';

-- 2. Si no existe, agregarla
ALTER TABLE egresados
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 3. CREAR O REEMPLAZAR FUNCIÓN DEL TRIGGER
CREATE OR REPLACE FUNCTION update_egresados_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. CREAR TRIGGER (si no existe)
DROP TRIGGER IF EXISTS trigger_update_egresados_updated_at ON egresados;
CREATE TRIGGER trigger_update_egresados_updated_at
    BEFORE UPDATE ON egresados
    FOR EACH ROW
    EXECUTE FUNCTION update_egresados_updated_at();

-- 5. VERIFICAR
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name='egresados'
ORDER BY ordinal_position;

SELECT '✅ Campo updated_at agregado correctamente' AS status;

-- ============================================================================
-- Ejecutar este script en Neon Console si el formulario de egresados falla
-- ============================================================================
