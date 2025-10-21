-- ============================================
-- SISTEMA DE MENSAJERÍA INTERNA - BGE
-- ============================================
-- Versión: 1.0.0
-- Fecha: 19 de Octubre, 2025
-- Descripción: Schema completo para sistema de mensajería interna
--              entre administradores, docentes, padres y estudiantes
-- Características:
--   - Conversaciones 1:1 y grupales
--   - Estado de lectura por participante
--   - Archivos adjuntos
--   - Búsqueda full-text
--   - Notificaciones en tiempo real
--   - Mute y archive
-- ============================================

-- ============================================
-- TABLA: conversations
-- Descripción: Conversaciones (1:1 o grupales)
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),                     -- Título (para grupos, null para 1:1)
    conversation_type VARCHAR(20) NOT NULL DEFAULT 'direct', -- 'direct' o 'group'
    creator_id INTEGER NOT NULL,            -- Usuario que creó la conversación
    creator_role VARCHAR(20) NOT NULL,      -- 'admin', 'teacher', 'parent', 'student'

    -- Metadata
    last_message_id INTEGER,                -- Último mensaje enviado
    last_message_at TIMESTAMP,              -- Fecha del último mensaje
    total_messages INTEGER DEFAULT 0,       -- Contador de mensajes

    -- Estado
    is_active BOOLEAN DEFAULT TRUE,         -- Si la conversación está activa
    is_archived BOOLEAN DEFAULT FALSE,      -- Si está archivada

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_conversation_type CHECK (conversation_type IN ('direct', 'group')),
    CONSTRAINT valid_creator_role CHECK (creator_role IN ('admin', 'teacher', 'parent', 'student'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_conversations_creator ON conversations(creator_id, creator_role);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_conversations_active ON conversations(is_active, is_archived);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- ============================================
-- TABLA: conversation_participants
-- Descripción: Participantes de conversaciones (N:N)
-- ============================================
CREATE TABLE IF NOT EXISTS conversation_participants (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

    -- Participante
    user_id INTEGER NOT NULL,               -- ID del usuario
    user_role VARCHAR(20) NOT NULL,         -- 'admin', 'teacher', 'parent', 'student'
    user_name VARCHAR(200),                 -- Nombre para caché
    user_email VARCHAR(200),                -- Email para caché

    -- Estado del participante
    is_admin BOOLEAN DEFAULT FALSE,         -- Si es admin de la conversación grupal
    is_muted BOOLEAN DEFAULT FALSE,         -- Si silenció las notificaciones
    is_archived BOOLEAN DEFAULT FALSE,      -- Si archivó la conversación

    -- Tracking de lectura
    last_read_message_id INTEGER,           -- Último mensaje leído
    last_read_at TIMESTAMP,                 -- Fecha de última lectura
    unread_count INTEGER DEFAULT 0,         -- Mensajes no leídos

    -- Timestamps
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,                      -- Si salió del grupo

    -- Constraints
    CONSTRAINT unique_conversation_participant UNIQUE (conversation_id, user_id, user_role),
    CONSTRAINT valid_participant_role CHECK (user_role IN ('admin', 'teacher', 'parent', 'student'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON conversation_participants(user_id, user_role);
CREATE INDEX IF NOT EXISTS idx_participants_unread ON conversation_participants(unread_count) WHERE unread_count > 0;
CREATE INDEX IF NOT EXISTS idx_participants_active ON conversation_participants(conversation_id, left_at) WHERE left_at IS NULL;

-- ============================================
-- TABLA: messages
-- Descripción: Mensajes individuales
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

    -- Remitente
    sender_id INTEGER NOT NULL,             -- ID del remitente
    sender_role VARCHAR(20) NOT NULL,       -- 'admin', 'teacher', 'parent', 'student'
    sender_name VARCHAR(200),               -- Nombre para caché

    -- Contenido
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'file', 'image', 'system'
    content TEXT,                           -- Contenido del mensaje

    -- Respuesta a mensaje (threading)
    reply_to_message_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,

    -- Estado
    is_edited BOOLEAN DEFAULT FALSE,        -- Si fue editado
    edited_at TIMESTAMP,                    -- Fecha de edición
    is_deleted BOOLEAN DEFAULT FALSE,       -- Si fue eliminado
    deleted_at TIMESTAMP,                   -- Fecha de eliminación

    -- Metadata
    total_attachments INTEGER DEFAULT 0,    -- Número de archivos adjuntos

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_sender_role CHECK (sender_role IN ('admin', 'teacher', 'parent', 'student')),
    CONSTRAINT valid_message_type CHECK (message_type IN ('text', 'file', 'image', 'system'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, sender_role);
CREATE INDEX IF NOT EXISTS idx_messages_reply ON messages(reply_to_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_not_deleted ON messages(conversation_id, is_deleted) WHERE is_deleted = FALSE;

-- Full-text search en contenido
CREATE INDEX IF NOT EXISTS idx_messages_content_search ON messages USING gin(to_tsvector('spanish', content));

-- ============================================
-- TABLA: message_attachments
-- Descripción: Archivos adjuntos a mensajes
-- ============================================
CREATE TABLE IF NOT EXISTS message_attachments (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,

    -- Archivo
    file_name VARCHAR(500) NOT NULL,        -- Nombre original del archivo
    file_path VARCHAR(1000) NOT NULL,       -- Ruta en servidor
    file_url VARCHAR(1000),                 -- URL pública (si aplica)
    file_type VARCHAR(100),                 -- MIME type
    file_size BIGINT,                       -- Tamaño en bytes

    -- Metadata para imágenes
    is_image BOOLEAN DEFAULT FALSE,
    image_width INTEGER,
    image_height INTEGER,
    thumbnail_path VARCHAR(1000),

    -- Timestamps
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_attachments_message ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_attachments_type ON message_attachments(file_type);

-- ============================================
-- TABLA: message_read_status
-- Descripción: Estado de lectura por participante
-- ============================================
CREATE TABLE IF NOT EXISTS message_read_status (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

    -- Usuario
    user_id INTEGER NOT NULL,
    user_role VARCHAR(20) NOT NULL,

    -- Estado
    is_delivered BOOLEAN DEFAULT FALSE,     -- Si fue entregado
    delivered_at TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,          -- Si fue leído
    read_at TIMESTAMP,

    -- Constraints
    CONSTRAINT unique_message_read_status UNIQUE (message_id, user_id, user_role),
    CONSTRAINT valid_status_role CHECK (user_role IN ('admin', 'teacher', 'parent', 'student'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_read_status_message ON message_read_status(message_id);
CREATE INDEX IF NOT EXISTS idx_read_status_user ON message_read_status(user_id, user_role, is_read);
CREATE INDEX IF NOT EXISTS idx_read_status_conversation ON message_read_status(conversation_id, user_id, user_role);

-- ============================================
-- TABLA: conversation_settings
-- Descripción: Configuraciones por usuario
-- ============================================
CREATE TABLE IF NOT EXISTS conversation_settings (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

    -- Usuario
    user_id INTEGER NOT NULL,
    user_role VARCHAR(20) NOT NULL,

    -- Configuraciones
    notifications_enabled BOOLEAN DEFAULT TRUE,
    sound_enabled BOOLEAN DEFAULT TRUE,

    -- Personalización
    custom_name VARCHAR(200),               -- Nombre personalizado para la conversación
    pinned BOOLEAN DEFAULT FALSE,           -- Si está fijada
    pinned_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT unique_conversation_user_settings UNIQUE (conversation_id, user_id, user_role),
    CONSTRAINT valid_settings_role CHECK (user_role IN ('admin', 'teacher', 'parent', 'student'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_settings_conversation ON conversation_settings(conversation_id);
CREATE INDEX IF NOT EXISTS idx_settings_user ON conversation_settings(user_id, user_role);
CREATE INDEX IF NOT EXISTS idx_settings_pinned ON conversation_settings(user_id, user_role, pinned) WHERE pinned = TRUE;

-- ============================================
-- TABLA: typing_indicators
-- Descripción: Indicadores de "escribiendo..." (temporal, se limpia periódicamente)
-- ============================================
CREATE TABLE IF NOT EXISTS typing_indicators (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

    -- Usuario
    user_id INTEGER NOT NULL,
    user_role VARCHAR(20) NOT NULL,
    user_name VARCHAR(200),

    -- Estado
    is_typing BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT unique_typing_indicator UNIQUE (conversation_id, user_id, user_role)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_typing_conversation ON typing_indicators(conversation_id, is_typing);
CREATE INDEX IF NOT EXISTS idx_typing_activity ON typing_indicators(last_activity_at);

-- ============================================
-- VISTAS OPTIMIZADAS
-- ============================================

-- Vista: Conversaciones con último mensaje y contador no leídos
CREATE OR REPLACE VIEW v_user_conversations AS
SELECT
    c.id AS conversation_id,
    c.title,
    c.conversation_type,
    c.last_message_at,
    c.total_messages,
    c.is_active,

    -- Participante actual
    cp.user_id,
    cp.user_role,
    cp.is_muted,
    cp.is_archived,
    cp.unread_count,
    cp.last_read_at,

    -- Último mensaje
    m.id AS last_message_id,
    m.sender_name AS last_message_sender,
    m.content AS last_message_content,
    m.message_type AS last_message_type,

    -- Configuraciones
    cs.pinned,
    cs.custom_name,

    -- Contar participantes activos
    (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id AND left_at IS NULL) AS active_participants_count
FROM conversations c
JOIN conversation_participants cp ON c.id = cp.conversation_id
LEFT JOIN messages m ON c.last_message_id = m.id
LEFT JOIN conversation_settings cs ON c.id = cs.conversation_id AND cp.user_id = cs.user_id AND cp.user_role = cs.user_role
WHERE cp.left_at IS NULL;

-- Vista: Estadísticas de mensajería por usuario
CREATE OR REPLACE VIEW v_messaging_stats AS
SELECT
    user_id,
    user_role,
    COUNT(DISTINCT conversation_id) AS total_conversations,
    SUM(unread_count) AS total_unread_messages,
    MAX(last_read_at) AS last_activity
FROM conversation_participants
WHERE left_at IS NULL
GROUP BY user_id, user_role;

-- ============================================
-- FUNCIONES POSTGRESQL
-- ============================================

-- Función: Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función: Actualizar contador de mensajes en conversación
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE conversations
        SET
            total_messages = total_messages + 1,
            last_message_id = NEW.id,
            last_message_at = NEW.created_at
        WHERE id = NEW.conversation_id;

        -- Incrementar unread_count para todos los participantes excepto el remitente
        UPDATE conversation_participants
        SET unread_count = unread_count + 1
        WHERE conversation_id = NEW.conversation_id
          AND NOT (user_id = NEW.sender_id AND user_role = NEW.sender_role)
          AND left_at IS NULL;

    ELSIF TG_OP = 'DELETE' THEN
        UPDATE conversations
        SET total_messages = GREATEST(0, total_messages - 1)
        WHERE id = OLD.conversation_id;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función: Actualizar unread_count cuando se marca como leído
CREATE OR REPLACE FUNCTION update_unread_count_on_read()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = TRUE AND (OLD.is_read IS NULL OR OLD.is_read = FALSE) THEN
        UPDATE conversation_participants
        SET
            unread_count = GREATEST(0, unread_count - 1),
            last_read_message_id = NEW.message_id,
            last_read_at = NEW.read_at
        WHERE conversation_id = NEW.conversation_id
          AND user_id = NEW.user_id
          AND user_role = NEW.user_role;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función: Limpiar typing indicators antiguos (> 30 segundos)
CREATE OR REPLACE FUNCTION cleanup_typing_indicators()
RETURNS void AS $$
BEGIN
    DELETE FROM typing_indicators
    WHERE last_activity_at < NOW() - INTERVAL '30 seconds';
END;
$$ language 'plpgsql';

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Actualizar updated_at en conversations
DROP TRIGGER IF EXISTS trigger_conversations_updated_at ON conversations;
CREATE TRIGGER trigger_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_updated_at();

-- Trigger: Actualizar contador de mensajes
DROP TRIGGER IF EXISTS trigger_update_message_count ON messages;
CREATE TRIGGER trigger_update_message_count
    AFTER INSERT OR DELETE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_message_count();

-- Trigger: Actualizar unread_count
DROP TRIGGER IF EXISTS trigger_update_unread_count ON message_read_status;
CREATE TRIGGER trigger_update_unread_count
    AFTER INSERT OR UPDATE ON message_read_status
    FOR EACH ROW
    EXECUTE FUNCTION update_unread_count_on_read();

-- Trigger: Actualizar updated_at en conversation_settings
DROP TRIGGER IF EXISTS trigger_settings_updated_at ON conversation_settings;
CREATE TRIGGER trigger_settings_updated_at
    BEFORE UPDATE ON conversation_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_updated_at();

-- ============================================
-- DATOS DE EJEMPLO (DESARROLLO)
-- ============================================

-- Conversación directa de ejemplo (Admin → Docente)
INSERT INTO conversations (id, title, conversation_type, creator_id, creator_role, is_active)
VALUES (1, NULL, 'direct', 1, 'admin', TRUE)
ON CONFLICT DO NOTHING;

-- Participantes de la conversación
INSERT INTO conversation_participants (conversation_id, user_id, user_role, user_name, user_email)
VALUES
    (1, 1, 'admin', 'Administrador Principal', 'admin@bge.edu.mx'),
    (1, 101, 'teacher', 'Prof. Juan Pérez', 'juan.perez@bge.edu.mx')
ON CONFLICT DO NOTHING;

-- Mensajes de ejemplo
INSERT INTO messages (conversation_id, sender_id, sender_role, sender_name, message_type, content)
VALUES
    (1, 1, 'admin', 'Administrador Principal', 'text', 'Buenos días Profesor, ¿cómo va el proyecto de fin de semestre?'),
    (1, 101, 'teacher', 'Prof. Juan Pérez', 'text', 'Buenos días, va muy bien. Los estudiantes están muy comprometidos.')
ON CONFLICT DO NOTHING;

-- Conversación grupal de ejemplo (Grupo de Docentes)
INSERT INTO conversations (id, title, conversation_type, creator_id, creator_role, is_active)
VALUES (2, 'Grupo de Docentes - Matemáticas', 'group', 1, 'admin', TRUE)
ON CONFLICT DO NOTHING;

-- Participantes del grupo
INSERT INTO conversation_participants (conversation_id, user_id, user_role, user_name, user_email, is_admin)
VALUES
    (2, 1, 'admin', 'Administrador Principal', 'admin@bge.edu.mx', TRUE),
    (2, 101, 'teacher', 'Prof. Juan Pérez', 'juan.perez@bge.edu.mx', FALSE),
    (2, 102, 'teacher', 'Prof. María García', 'maria.garcia@bge.edu.mx', FALSE)
ON CONFLICT DO NOTHING;

-- ============================================
-- COMENTARIOS Y NOTAS
-- ============================================

-- CARACTERÍSTICAS IMPLEMENTADAS:
-- ✅ Conversaciones 1:1 y grupales
-- ✅ Estado de lectura por participante
-- ✅ Archivos adjuntos con soporte para imágenes
-- ✅ Búsqueda full-text en contenido de mensajes
-- ✅ Indicadores de "escribiendo..."
-- ✅ Mute, archive y pin de conversaciones
-- ✅ Threading (responder a mensajes específicos)
-- ✅ Edición y eliminación de mensajes
-- ✅ Contador de mensajes no leídos
-- ✅ Optimización con vistas y triggers
-- ✅ 15+ índices para performance

-- INTEGRACIONES NECESARIAS:
-- 1. Sistema de notificaciones WebSocket (Ciclo 13)
-- 2. Sistema de roles y permisos (Ciclo 10)
-- 3. Upload de archivos existente

-- PRÓXIMOS PASOS:
-- 1. Ejecutar este script en PostgreSQL
-- 2. Crear API REST en backend/routes/messaging.js
-- 3. Crear interfaz frontend mensajeria.html
-- 4. Integrar con notificationService.js para real-time

-- ESTIMACIÓN DE PERFORMANCE:
-- - Búsqueda de mensajes: < 50ms (índice GIN)
-- - Listado de conversaciones: < 30ms (vistas optimizadas)
-- - Envío de mensaje: < 100ms (con trigger + notificación)
-- - Marcado como leído: < 20ms (índice compuesto)

COMMENT ON TABLE conversations IS 'Conversaciones 1:1 y grupales del sistema de mensajería';
COMMENT ON TABLE conversation_participants IS 'Participantes de conversaciones con estado de lectura';
COMMENT ON TABLE messages IS 'Mensajes individuales con soporte para threading';
COMMENT ON TABLE message_attachments IS 'Archivos adjuntos a mensajes';
COMMENT ON TABLE message_read_status IS 'Estado de lectura por participante y mensaje';
COMMENT ON TABLE conversation_settings IS 'Configuraciones personalizadas por usuario';
COMMENT ON TABLE typing_indicators IS 'Indicadores temporales de escritura en tiempo real';
