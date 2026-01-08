-- 🔔 MIGRACIÓN 107: NOTIFICATION CENTER
-- Propósito: Sistema centralizado de notificaciones (Fase 7 - Semana 51)
CREATE TABLE IF NOT EXISTS notification_center (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    -- 'system', 'grade', 'message', 'alert'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    action_link VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'normal',
    -- 'high', 'normal', 'low'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notification_center(user_id, is_read);