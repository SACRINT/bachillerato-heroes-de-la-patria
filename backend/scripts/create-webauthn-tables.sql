/**
 * ✅ SEMANA 25: TABLAS DE WEBAUTHN (BIOMETRÍA)
 * Fecha: 20 Noviembre 2025
 */

-- Tabla de credenciales WebAuthn (dispositivos biométricos registrados)
CREATE TABLE IF NOT EXISTS webauthn_credentials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL UNIQUE,
    credential_public_key TEXT NOT NULL,
    counter BIGINT NOT NULL DEFAULT 0,
    transports JSON,
    device_name VARCHAR(255) DEFAULT 'Dispositivo Biométrico',
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP DEFAULT NOW()
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_credential_id ON webauthn_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_last_used ON webauthn_credentials(last_used_at DESC);

-- Tabla de challenges temporales (para registro y autenticación)
CREATE TABLE IF NOT EXISTS webauthn_challenges (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    challenge TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'registration' o 'authentication'
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    UNIQUE(user_id, type)
);

-- Índice para limpieza automática de challenges expirados
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires ON webauthn_challenges(expires_at);

-- Comentarios de documentación
COMMENT ON TABLE webauthn_credentials IS 'Credenciales biométricas (Touch ID, Face ID, Windows Hello, YubiKey) de usuarios';
COMMENT ON COLUMN webauthn_credentials.credential_id IS 'ID único de la credencial WebAuthn (base64)';
COMMENT ON COLUMN webauthn_credentials.credential_public_key IS 'Clave pública de la credencial (base64)';
COMMENT ON COLUMN webauthn_credentials.counter IS 'Contador de uso para prevenir replay attacks';
COMMENT ON COLUMN webauthn_credentials.transports IS 'Métodos de transporte soportados (usb, ble, nfc, internal)';

COMMENT ON TABLE webauthn_challenges IS 'Challenges temporales para registro y autenticación WebAuthn';
COMMENT ON COLUMN webauthn_challenges.type IS 'Tipo de operación: registration o authentication';
COMMENT ON COLUMN webauthn_challenges.expires_at IS 'Fecha de expiración del challenge (5 minutos)';

-- ✅ Datos de prueba (opcional - comentar para producción)
/*
-- Ejemplo: Usuario con ID 1 registra Touch ID
INSERT INTO webauthn_credentials (user_id, credential_id, credential_public_key, counter, transports, device_name)
VALUES (
    1,
    'mock_credential_id_base64',
    'mock_public_key_base64',
    0,
    '["internal"]',
    'MacBook Pro - Touch ID'
);
*/
