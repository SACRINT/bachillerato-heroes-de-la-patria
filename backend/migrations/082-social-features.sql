-- Tabla para Historias (Stories) efímeras de logros
CREATE TABLE IF NOT EXISTS social_stories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    -- URL de la imagen/video
    media_type VARCHAR(20) CHECK (media_type IN ('image', 'video')),
    caption TEXT,
    related_achievement_id INTEGER,
    -- Opcional: Vincular a un logro obtenido
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMP DEFAULT NOW()
);
-- Tabla para Reacciones a historias
CREATE TABLE IF NOT EXISTS story_reactions (
    id SERIAL PRIMARY KEY,
    story_id INTEGER REFERENCES social_stories(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL,
    -- 'like', 'fire', 'clap', 'heart'
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(story_id, user_id)
);
-- Tabla para Salas de Estudio en Vivo
CREATE TABLE IF NOT EXISTS study_rooms (
    id SERIAL PRIMARY KEY,
    host_user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended')),
    active_viewers INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP
);
-- Índices para búsquedas rápidas
CREATE INDEX idx_stories_user ON social_stories(user_id);
CREATE INDEX idx_stories_expiry ON social_stories(expires_at);
CREATE INDEX idx_study_rooms_status ON study_rooms(status);