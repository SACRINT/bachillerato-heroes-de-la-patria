/**
 * 🔧 FIX CRÍTICO: Corregir CHECK constraint en estado de pendientes_aprobacion
 * Problema: La tabla tiene un CHECK constraint que NO permite 'pendiente_confirmacion'
 * Solución: Eliminar constraint viejo y crear uno nuevo que acepte todos los estados
 * Fecha: 5 Noviembre 2025
 */

-- =====================================================================
-- PASO 1: Identificar y eliminar constraint existente
-- =====================================================================

-- Ver constraints actuales
SELECT constraint_name, constraint_definition
FROM information_schema.check_constraints
WHERE constraint_schema='public' AND table_name='pendientes_aprobacion';

-- Eliminar constraint viejo (si existe)
-- Los constraints suelen llamarse: estado_check, pendientes_aprobacion_estado_check, etc.
ALTER TABLE IF EXISTS pendientes_aprobacion
DROP CONSTRAINT IF EXISTS estado_check;

ALTER TABLE IF EXISTS pendientes_aprobacion
DROP CONSTRAINT IF EXISTS pendientes_aprobacion_estado_check;

-- =====================================================================
-- PASO 2: Crear constraint NUEVO que acepte todos los estados válidos
-- =====================================================================

ALTER TABLE pendientes_aprobacion
ADD CONSTRAINT estado_check CHECK (
    estado IN ('pendiente_confirmacion', 'pendiente', 'aprobado', 'rechazado')
);

-- =====================================================================
-- PASO 3: Verificar que el constraint se creó correctamente
-- =====================================================================

SELECT constraint_name, constraint_definition
FROM information_schema.check_constraints
WHERE constraint_schema='public'
  AND table_name='pendientes_aprobacion'
  AND constraint_name='estado_check';

-- Resultado esperado: Debe mostrar un constraint que permite:
-- estado IN ('pendiente_confirmacion', 'pendiente', 'aprobado', 'rechazado')
