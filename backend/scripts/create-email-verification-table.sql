-- =====================================================
-- SCRIPT: Crear Tabla de Verificación de Email
-- Fecha: 19 Nov 2025
--
-- Propósito: Almacenar tokens temporales para verificar
-- que los usuarios tienen acceso a su correo electrónico
-- =====================================================

-- Tabla de tokens de verificación
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) DEFAULT 'registration' CHECK (type IN ('registration', 'email_change', 'password_reset')),
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW(),

    -- Índices para búsquedas rápidas
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índices para optimizar queries
CREATE INDEX IF NOT EXISTS idx_verification_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_user ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_expires ON email_verification_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_type ON email_verification_tokens(type);

-- Agregar columna email_verified a usuarios si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
        ALTER TABLE usuarios ADD COLUMN email_verified_at TIMESTAMP NULL;
    END IF;
END $$;

-- Actualizar usuarios existentes como verificados (para no romper sistema actual)
UPDATE usuarios SET email_verified = TRUE WHERE email_verified IS NULL;

-- Comentarios de documentación
COMMENT ON TABLE email_verification_tokens IS 'Tokens temporales para verificación de email de usuarios';
COMMENT ON COLUMN email_verification_tokens.type IS 'Tipo: registration (nuevo usuario), email_change (cambio de email), password_reset';
COMMENT ON COLUMN email_verification_tokens.used_at IS 'Fecha en que el token fue usado (NULL si no usado)';

-- Verificar que la tabla fue creada
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'email_verification_tokens'
ORDER BY ordinal_position;
