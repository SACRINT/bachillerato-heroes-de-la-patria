/**
 * 🔧 CREAR TABLA TEMPORAL PARA BOLSA DE TRABAJO
 * Almacena datos mientras usuario confirma email
 * Fecha: 5 Noviembre 2025
 */

-- =====================================================================
-- CREAR TABLA TEMPORAL SI NO EXISTE
-- =====================================================================

CREATE TABLE IF NOT EXISTS bolsa_trabajo_pending_confirmation (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE,

    -- Email y datos del usuario
    email_usuario VARCHAR(255) NOT NULL UNIQUE,
    datos_json JSONB NOT NULL,

    -- Token de confirmación
    token_confirmacion VARCHAR(255) NOT NULL UNIQUE,
    token_expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours'),

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================================
-- CREAR ÍNDICES PARA OPTIMIZAR BÚSQUEDAS
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_temp_email
    ON bolsa_trabajo_pending_confirmation(email_usuario);

CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_temp_token
    ON bolsa_trabajo_pending_confirmation(token_confirmacion);

CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_temp_expires
    ON bolsa_trabajo_pending_confirmation(token_expires_at);

-- =====================================================================
-- VERIFICAR QUE LA TABLA FUE CREADA CORRECTAMENTE
-- =====================================================================

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'bolsa_trabajo_pending_confirmation'
ORDER BY ordinal_position;

-- Resultado esperado: Debe mostrar estas columnas:
-- - id (integer)
-- - uuid (uuid)
-- - email_usuario (character varying)
-- - datos_json (jsonb)
-- - token_confirmacion (character varying)
-- - token_expires_at (timestamp)
-- - created_at (timestamp)
-- - updated_at (timestamp)
