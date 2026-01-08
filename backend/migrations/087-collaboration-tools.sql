-- Tabla de Sesiones Colaborativas
CREATE TABLE IF NOT EXISTS collaboration_sessions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150),
    session_type VARCHAR(50) DEFAULT 'whiteboard',
    -- whiteboard, document, code
    created_by INTEGER REFERENCES usuarios(id),
    group_id INTEGER REFERENCES study_groups(id),
    -- Opcional, si pertenece a un grupo
    current_state JSONB DEFAULT '{}',
    -- Snapshot del estado actual (ej. trazos, texto)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Participantes activos en la sesión
CREATE TABLE IF NOT EXISTS collaboration_participants (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES usuarios(id),
    role VARCHAR(20) DEFAULT 'editor',
    -- editor, viewer
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, user_id)
);
-- Historial de Cambios (Para deshacer/rehacer y auditoría simple)
CREATE TABLE IF NOT EXISTS collaboration_history (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES usuarios(id),
    action_type VARCHAR(50),
    -- add_element, remove_element, clear
    action_data JSONB,
    -- Detalles del cambio
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_collab_group ON collaboration_sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_collab_participants_session ON collaboration_participants(session_id);