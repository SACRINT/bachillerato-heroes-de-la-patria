-- 062-public-profiles.sql
-- Sistema de Perfiles Públicos (Semana 5)
-- 1. Tabla de Perfiles Extendidos
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    bio TEXT,
    location VARCHAR(100),
    website VARCHAR(255),
    social_links JSON,
    -- {"twitter": "...", "instagram": "..."}
    interests JSON,
    -- ["programming", "art"]
    -- Configuración de Privacidad
    privacy_show_email BOOLEAN DEFAULT FALSE,
    privacy_show_activity BOOLEAN DEFAULT TRUE,
    privacy_show_achievements BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 2. Trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_update_user_profiles ON user_profiles;
CREATE TRIGGER trg_update_user_profiles BEFORE
UPDATE ON user_profiles FOR EACH ROW EXECUTE PROCEDURE update_user_profiles_timestamp();
-- 3. Seed data (Opcional, para admin o usuarios existentes)
INSERT INTO user_profiles (user_id, bio, location, privacy_show_activity)
SELECT id,
    'Estudiante de Héroes de la Patria',
    'Puebla, MX',
    true
FROM usuarios ON CONFLICT DO NOTHING;