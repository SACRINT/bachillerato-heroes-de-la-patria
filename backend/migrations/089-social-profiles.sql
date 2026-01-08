-- Tabla de Extensiones de Perfil (Profile Extensions)
-- Extiende la tabla 'usuarios' sin modificarla directamente
CREATE TABLE IF NOT EXISTS social_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    bio TEXT,
    location VARCHAR(100),
    website_url VARCHAR(200),
    social_links JSONB DEFAULT '{}',
    -- { "twitter": "url", "linkedin": "url" }
    interests TEXT [],
    -- Array de tags
    skills TEXT [],
    -- Array de habilidades
    banner_url TEXT,
    theme_color VARCHAR(20),
    is_public BOOLEAN DEFAULT TRUE,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);
-- Portafolio de Proyectos
CREATE TABLE IF NOT EXISTS user_portfolios (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    image_url TEXT,
    project_url TEXT,
    tags TEXT [],
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Amistades / Conexiones
-- status: 'pending', 'accepted', 'blocked'
CREATE TABLE IF NOT EXISTS friendships (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER REFERENCES usuarios(id),
    recipient_id INTEGER REFERENCES usuarios(id),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(requester_id, recipient_id)
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_social_profiles_skills ON social_profiles USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(requester_id, recipient_id);