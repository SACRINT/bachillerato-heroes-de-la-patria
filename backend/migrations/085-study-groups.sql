-- Tabla para grupos de estudio
CREATE TABLE IF NOT EXISTS study_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    -- Puede normalizarse a subject_id si existe tabla materias
    topic VARCHAR(100),
    created_by INTEGER REFERENCES usuarios(id),
    max_members INTEGER DEFAULT 10,
    is_private BOOLEAN DEFAULT FALSE,
    join_code VARCHAR(10) UNIQUE,
    -- Para invitaciones
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Miembros del grupo
CREATE TABLE IF NOT EXISTS study_group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    -- admin, member
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);
-- Sesiones de estudio en vivo (videollamada o chat rooms activos)
CREATE TABLE IF NOT EXISTS study_group_sessions (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES study_groups(id) ON DELETE CASCADE,
    title VARCHAR(150),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    meeting_link TEXT,
    -- Zoom, Google Meet, o link interno Jitsi
    status VARCHAR(20) DEFAULT 'scheduled',
    -- scheduled, active, completed, cancelled
    created_by INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Metas compartidas del grupo
CREATE TABLE IF NOT EXISTS study_group_goals (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES study_groups(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_date TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT FALSE,
    progress INTEGER DEFAULT 0,
    -- 0-100
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Chat mensajes (simple implementation for Phase 4)
CREATE TABLE IF NOT EXISTS study_group_messages (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES usuarios(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_study_groups_subject ON study_groups(subject);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON study_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON study_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group ON study_group_messages(group_id);