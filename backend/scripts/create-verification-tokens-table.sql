-- ============================================
-- 🔐 TABLA: verification_tokens
-- Sistema de verificación de email con tokens
-- Usado por verificationService.js
-- ============================================

-- Primero, se crea la tabla sin los índices dentro de la definición.
CREATE TABLE IF NOT EXISTS verification_tokens (
    id SERIAL PRIMARY KEY,
    token UUID NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    form_data JSONB NOT NULL,
    form_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Luego, se crean los índices por separado, que es la sintaxis correcta para PostgreSQL.
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens (token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_email ON verification_tokens (email);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires_at ON verification_tokens (expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_created_at ON verification_tokens (created_at);

-- Comentarios
COMMENT ON TABLE verification_tokens IS 'Tokens de verificación de email para formularios de contacto';
COMMENT ON COLUMN verification_tokens.token IS 'UUID único del token de verificación';
COMMENT ON COLUMN verification_tokens.email IS 'Email del usuario que envió el formulario';
COMMENT ON COLUMN verification_tokens.form_data IS 'Datos completos del formulario en formato JSON';
COMMENT ON COLUMN verification_tokens.expires_at IS 'Timestamp de expiración (30 minutos desde creación)';
COMMENT ON COLUMN verification_tokens.used_at IS 'Timestamp cuando el token fue usado (NULL = no usado)';

-- ============================================
-- Tarea programada: Limpiar tokens expirados
-- ============================================
-- En PostgreSQL, esto requiere extensión pg_cron
-- Alternativamente, ejecutar manualmente o desde backend

-- Ejemplo de query para limpiar (ejecutar periódicamente):
-- DELETE FROM verification_tokens
-- WHERE expires_at < NOW() OR used_at IS NOT NULL AND used_at < NOW() - INTERVAL '7 days';
