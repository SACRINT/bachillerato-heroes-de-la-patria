/**
 * 🔧 FIX: Asegurar que tabla pendientes_aprobacion tenga la estructura correcta
 * Ejecutar en Neon Console si hay error 500 en bolsa-trabajo
 * Fecha: 5 Noviembre 2025
 */

-- =====================================================================
-- 1. CREAR TABLA SI NO EXISTE (con estructura completa)
-- =====================================================================
CREATE TABLE IF NOT EXISTS pendientes_aprobacion (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE,

    -- Tipo de solicitud
    tipo_solicitud VARCHAR(50) NOT NULL,  -- 'bolsa_trabajo', 'egresados'

    -- Email y datos
    email_usuario VARCHAR(255) NOT NULL,
    datos_json JSONB NOT NULL,

    -- Estado del proceso
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',  -- 'pendiente_confirmacion', 'pendiente', 'aprobado', 'rechazado'
    email_confirmado BOOLEAN DEFAULT false,

    -- Información de aprobación
    fecha_solicitud TIMESTAMP DEFAULT NOW(),
    admin_id INT,
    admin_notas TEXT,
    fecha_procesado TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================================
-- 2. AGREGAR COLUMNAS SI NO EXISTEN (sin fallar si ya están)
-- =====================================================================

-- Columna: estado (si no existe)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name='pendientes_aprobacion' AND column_name='estado'
    ) THEN
        ALTER TABLE pendientes_aprobacion ADD COLUMN estado VARCHAR(50) NOT NULL DEFAULT 'pendiente';
    END IF;
END $$;

-- Columna: email_confirmado (si no existe)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name='pendientes_aprobacion' AND column_name='email_confirmado'
    ) THEN
        ALTER TABLE pendientes_aprobacion ADD COLUMN email_confirmado BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Columna: admin_notas (si no existe)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name='pendientes_aprobacion' AND column_name='admin_notas'
    ) THEN
        ALTER TABLE pendientes_aprobacion ADD COLUMN admin_notas TEXT;
    END IF;
END $$;

-- Columna: datos_json (si no existe)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name='pendientes_aprobacion' AND column_name='datos_json'
    ) THEN
        ALTER TABLE pendientes_aprobacion ADD COLUMN datos_json JSONB;
    END IF;
END $$;

-- =====================================================================
-- 3. CREAR ÍNDICES (si no existen)
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_pendientes_aprobacion_tipo
    ON pendientes_aprobacion(tipo_solicitud);

CREATE INDEX IF NOT EXISTS idx_pendientes_aprobacion_estado
    ON pendientes_aprobacion(estado);

CREATE INDEX IF NOT EXISTS idx_pendientes_aprobacion_email
    ON pendientes_aprobacion(email_usuario);

CREATE INDEX IF NOT EXISTS idx_pendientes_aprobacion_estado_confirmado
    ON pendientes_aprobacion(estado, email_confirmado);

-- =====================================================================
-- 4. VERIFICAR ESTRUCTURA
-- =====================================================================

-- Verificar que la tabla existe y tiene las columnas correctas
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'pendientes_aprobacion'
ORDER BY ordinal_position;

-- Resultado esperado: Debe mostrar estas columnas:
-- - id (integer)
-- - uuid (uuid)
-- - tipo_solicitud (character varying)
-- - email_usuario (character varying)
-- - datos_json (jsonb)
-- - estado (character varying)
-- - email_confirmado (boolean)
-- - fecha_solicitud (timestamp)
-- - admin_id (integer)
-- - admin_notas (text)
-- - fecha_procesado (timestamp)
-- - created_at (timestamp)
-- - updated_at (timestamp)
