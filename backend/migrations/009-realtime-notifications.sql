-- ========================================
-- MIGRACIÓN: Sistema de Notificaciones en Tiempo Real
-- BGE Héroes de la Patria
-- FASE 2 - Semana 11-12
-- ========================================

-- ========================================
-- TABLA: Notificaciones
-- ========================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Tipo y categoría
    type VARCHAR(50) NOT NULL,                -- system, achievement, challenge, message, alert
    category VARCHAR(50) NOT NULL,            -- info, success, warning, error, reward

    -- Contenido
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    icon VARCHAR(100),
    image_url VARCHAR(500),

    -- Datos adicionales
    action_url VARCHAR(500),                  -- URL para acción
    action_text VARCHAR(100),                 -- Texto del botón
    metadata JSONB,                           -- Datos extras

    -- Estado
    is_read BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,

    -- Prioridad
    priority INTEGER DEFAULT 0,               -- 0=normal, 1=alta, 2=urgente

    -- Expiración
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Preferencias de Notificación
-- ========================================
CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Canales
    enable_push BOOLEAN DEFAULT true,
    enable_email BOOLEAN DEFAULT true,
    enable_sms BOOLEAN DEFAULT false,
    enable_in_app BOOLEAN DEFAULT true,

    -- Tipos de notificación
    notify_achievements BOOLEAN DEFAULT true,
    notify_challenges BOOLEAN DEFAULT true,
    notify_messages BOOLEAN DEFAULT true,
    notify_system BOOLEAN DEFAULT true,
    notify_marketing BOOLEAN DEFAULT false,

    -- Horarios
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'America/Mexico_City',

    -- Frecuencia de resumen
    email_digest VARCHAR(20) DEFAULT 'daily',  -- none, instant, daily, weekly

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Plantillas de Notificación
-- ========================================
CREATE TABLE IF NOT EXISTS notification_templates (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,

    -- Contenido
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    title_template VARCHAR(200) NOT NULL,
    message_template TEXT NOT NULL,
    icon VARCHAR(100),

    -- Configuración
    default_action_url VARCHAR(500),
    default_action_text VARCHAR(100),
    priority INTEGER DEFAULT 0,

    -- Estado
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Sesiones de Socket
-- ========================================
CREATE TABLE IF NOT EXISTS socket_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    socket_id VARCHAR(100) NOT NULL UNIQUE,

    -- Info de conexión
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    device_type VARCHAR(50),                  -- desktop, mobile, tablet

    -- Estado
    is_active BOOLEAN DEFAULT true,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    disconnected_at TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- ÍNDICES DE PERFORMANCE
-- ========================================

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notif_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_expires ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Preferences
CREATE INDEX IF NOT EXISTS idx_prefs_user ON notification_preferences(user_id);

-- Socket sessions
CREATE INDEX IF NOT EXISTS idx_socket_user ON socket_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_socket_active ON socket_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_socket_id ON socket_sessions(socket_id);

-- ========================================
-- DATOS INICIALES: Plantillas
-- ========================================
INSERT INTO notification_templates (slug, name, type, category, title_template, message_template, icon, default_action_url) VALUES
    -- Logros
    ('level_up', 'Subida de Nivel', 'achievement', 'success',
     '¡Subiste a nivel {{level}}!',
     'Felicidades, ahora eres {{title}}. Has ganado {{coins}} IACoins.',
     'fa-arrow-up', '/iacoins-dashboard.html'),

    ('badge_earned', 'Badge Obtenido', 'achievement', 'success',
     '¡Nuevo badge: {{badge_name}}!',
     'Has desbloqueado el badge {{badge_name}}. {{description}}',
     'fa-medal', '/profile'),

    ('streak_milestone', 'Milestone de Racha', 'achievement', 'success',
     '¡{{days}} días de racha!',
     'Increíble constancia. Has ganado {{bonus}} IACoins de bonus.',
     'fa-fire', '/iacoins-dashboard.html'),

    -- Retos
    ('challenge_completed', 'Reto Completado', 'challenge', 'success',
     'Reto completado: {{challenge_title}}',
     'Has ganado {{coins}} IACoins y {{xp}} XP.',
     'fa-trophy', '/iacoins-dashboard.html'),

    ('new_daily_challenges', 'Nuevos Retos Diarios', 'challenge', 'info',
     '¡Nuevos retos disponibles!',
     'Hay {{count}} nuevos retos diarios esperándote.',
     'fa-tasks', '/iacoins-dashboard.html'),

    ('challenge_expiring', 'Reto por Expirar', 'challenge', 'warning',
     'Reto expira pronto',
     'El reto "{{challenge_title}}" expira en {{hours}} horas.',
     'fa-clock', '/iacoins-dashboard.html'),

    -- Sistema
    ('welcome', 'Bienvenida', 'system', 'info',
     '¡Bienvenido a BGE!',
     'Tu cuenta ha sido creada. Completa tu perfil para ganar tus primeros IACoins.',
     'fa-hand-wave', '/profile'),

    ('system_maintenance', 'Mantenimiento', 'system', 'warning',
     'Mantenimiento programado',
     'El sistema estará en mantenimiento el {{date}} de {{start}} a {{end}}.',
     'fa-tools', null),

    ('new_feature', 'Nueva Funcionalidad', 'system', 'info',
     'Nueva funcionalidad: {{feature_name}}',
     '{{description}}',
     'fa-sparkles', '{{action_url}}'),

    -- Mensajes
    ('new_message', 'Nuevo Mensaje', 'message', 'info',
     'Mensaje de {{sender_name}}',
     '{{preview}}',
     'fa-envelope', '/mensajeria.html'),

    ('teacher_feedback', 'Retroalimentación', 'message', 'info',
     'Retroalimentación de {{teacher_name}}',
     'Tienes nueva retroalimentación en {{subject}}.',
     'fa-comment', '/calificaciones.html'),

    -- Alertas
    ('low_iacoins', 'IACoins Bajos', 'alert', 'warning',
     'IACoins bajos',
     'Tu saldo es de {{balance}} IACoins. Completa retos para ganar más.',
     'fa-coins', '/iacoins-dashboard.html'),

    ('feature_unlocked', 'Feature Desbloqueado', 'achievement', 'success',
     '¡Nuevo desbloqueo!',
     'Has desbloqueado: {{feature_name}}.',
     'fa-unlock', '/profile');

-- ========================================
-- COMENTARIOS
-- ========================================
COMMENT ON TABLE notifications IS 'Notificaciones de usuarios';
COMMENT ON TABLE notification_preferences IS 'Preferencias de notificación por usuario';
COMMENT ON TABLE notification_templates IS 'Plantillas para generar notificaciones';
COMMENT ON TABLE socket_sessions IS 'Sesiones activas de WebSocket';

COMMENT ON COLUMN notifications.type IS 'system, achievement, challenge, message, alert';
COMMENT ON COLUMN notifications.category IS 'info, success, warning, error, reward';
COMMENT ON COLUMN notifications.priority IS '0=normal, 1=alta, 2=urgente';

-- ========================================
-- FIN DE MIGRACIÓN
-- ========================================
