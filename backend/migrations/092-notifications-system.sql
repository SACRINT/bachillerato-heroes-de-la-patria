-- Tabla Centralizada de Notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    -- 'friend_request', 'team_invite', 'mentorship_request', 'forum_reply', 'system'
    title VARCHAR(150),
    message TEXT,
    reference_id INTEGER,
    -- ID de la entidad relacionada (thread_id, team_id, etc.)
    reference_url VARCHAR(255),
    -- Link directo a la acción
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id)
WHERE is_read = FALSE;