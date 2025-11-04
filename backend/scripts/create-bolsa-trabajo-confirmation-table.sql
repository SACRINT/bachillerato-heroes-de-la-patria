-- ============================================================================
-- 📧 CREAR TABLA: bolsa_trabajo_pending_confirmation
-- Propósito: Almacenar registros de CV que aún no han confirmado su email
-- Descripción: Cuando un usuario rellena el formulario de CV, se guarda aquí
--             temporalmente hasta que confirme su email. Luego se mueve a
--             pendientes_aprobacion para revisión del administrador.
-- ============================================================================

CREATE TABLE IF NOT EXISTS bolsa_trabajo_pending_confirmation (
    -- Identificadores
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,

    -- Email del usuario
    email VARCHAR(255) NOT NULL UNIQUE,

    -- Token de confirmación
    confirmation_token VARCHAR(255) NOT NULL UNIQUE,
    token_expires_at TIMESTAMP NOT NULL,

    -- Datos del formulario en JSON
    form_data JSONB NOT NULL,
    -- Contiene: { name, phone, graduationYear, subject, message, skills, ip_address, user_agent }

    -- Información de rastreo
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    ip_address VARCHAR(50),
    user_agent TEXT,

    -- Intentos de envío de email
    email_sent_count INT DEFAULT 1,
    last_email_sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT token_expires_check CHECK (token_expires_at > created_at)
);

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índice para búsquedas por email (para evitar duplicados)
CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_confirmation_email
    ON bolsa_trabajo_pending_confirmation(email);

-- Índice para búsquedas por token de confirmación
CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_confirmation_token
    ON bolsa_trabajo_pending_confirmation(confirmation_token);

-- Índice para limpiar tokens expirados
CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_confirmation_expires
    ON bolsa_trabajo_pending_confirmation(token_expires_at);

-- Índice compuesto para búsquedas de registros sin confirmar
CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_confirmation_pending
    ON bolsa_trabajo_pending_confirmation(confirmed_at, token_expires_at DESC);

-- ============================================================================
-- FUNCIÓN PARA LIMPIAR TOKENS EXPIRADOS (OPCIONAL)
-- ============================================================================

CREATE OR REPLACE FUNCTION clean_expired_confirmation_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM bolsa_trabajo_pending_confirmation
    WHERE token_expires_at < NOW() AND confirmed_at IS NULL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMENTARIOS SOBRE LA TABLA
-- ============================================================================
COMMENT ON TABLE bolsa_trabajo_pending_confirmation IS
    'Registros temporales de CVs pendientes de confirmación de email';

COMMENT ON COLUMN bolsa_trabajo_pending_confirmation.confirmation_token IS
    'Token único para confirmar el email (enviado por email al usuario)';

COMMENT ON COLUMN bolsa_trabajo_pending_confirmation.token_expires_at IS
    'Fecha de expiración del token (24 horas después de creación)';

COMMENT ON COLUMN bolsa_trabajo_pending_confirmation.confirmed_at IS
    'Timestamp cuando el usuario confirma. NULL = no confirmado aún';

COMMENT ON COLUMN bolsa_trabajo_pending_confirmation.form_data IS
    'Datos del formulario en JSON: {name, email, phone, graduationYear, subject, message, skills}';
