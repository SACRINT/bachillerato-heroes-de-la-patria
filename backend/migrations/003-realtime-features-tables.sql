-- ============================================================================
-- REAL-TIME FEATURES TABLES
-- Semana 15 - Socket.IO + Notifications + Collaborative Editing
-- ============================================================================

-- ============================================================================
-- TABLA: notifications (notificaciones en tiempo real)
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    metadata JSONB DEFAULT '{}',
    priority VARCHAR(20) DEFAULT 'normal',
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON notifications(user_id, tenant_id) WHERE read = FALSE;

-- Comentarios
COMMENT ON TABLE notifications IS 'Notificaciones en tiempo real para usuarios';
COMMENT ON COLUMN notifications.type IS 'Tipo: info, success, warning, error, grade_added, assignment_due, etc';
COMMENT ON COLUMN notifications.priority IS 'Prioridad: low, normal, high, urgent';

-- ============================================================================
-- TABLA: messages (mensajes de chat/salas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    room_id VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para messages
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_tenant_id ON messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_room_created
    ON messages(room_id, created_at DESC);

-- Comentarios
COMMENT ON TABLE messages IS 'Mensajes de chat en tiempo real';
COMMENT ON COLUMN messages.room_id IS 'ID de la sala/conversación (ej: class:3A, group:123)';

-- ============================================================================
-- TABLA: collaborative_documents (documentos colaborativos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS collaborative_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    creator_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT DEFAULT '',
    type VARCHAR(50) DEFAULT 'text',
    metadata JSONB DEFAULT '{}',
    version INTEGER DEFAULT 1,
    locked BOOLEAN DEFAULT FALSE,
    locked_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para collaborative_documents
CREATE INDEX IF NOT EXISTS idx_collab_docs_tenant_id ON collaborative_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_collab_docs_creator_id ON collaborative_documents(creator_id);
CREATE INDEX IF NOT EXISTS idx_collab_docs_updated_at ON collaborative_documents(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_collab_docs_type ON collaborative_documents(type);

-- Comentarios
COMMENT ON TABLE collaborative_documents IS 'Documentos para edición colaborativa en tiempo real';
COMMENT ON COLUMN collaborative_documents.type IS 'Tipo: text, markdown, code, spreadsheet';
COMMENT ON COLUMN collaborative_documents.version IS 'Versión para control de concurrencia';
COMMENT ON COLUMN collaborative_documents.locked IS 'TRUE si está bloqueado para edición exclusiva';

-- ============================================================================
-- TABLA: document_operations (historial de operaciones en documentos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_operations (
    id BIGSERIAL PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES collaborative_documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    operation_type VARCHAR(50) NOT NULL,
    position INTEGER,
    content TEXT,
    version_before INTEGER,
    version_after INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para document_operations
CREATE INDEX IF NOT EXISTS idx_doc_ops_document_id ON document_operations(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_ops_user_id ON document_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_doc_ops_created_at ON document_operations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doc_ops_version ON document_operations(version_after);

-- Comentarios
COMMENT ON TABLE document_operations IS 'Historial de operaciones de edición en documentos colaborativos';
COMMENT ON COLUMN document_operations.operation_type IS 'Tipo: insert, delete, retain';

-- ============================================================================
-- TABLA: document_activity (actividad de usuarios en documentos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_activity (
    document_id UUID NOT NULL REFERENCES collaborative_documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    last_activity TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (document_id, user_id)
);

-- Índice para document_activity
CREATE INDEX IF NOT EXISTS idx_doc_activity_last_activity ON document_activity(last_activity DESC);

-- Comentarios
COMMENT ON TABLE document_activity IS 'Tracking de usuarios activos en documentos (últimos 5 minutos)';

-- ============================================================================
-- TABLA: rooms (salas de chat/grupos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'group',
    description TEXT,
    metadata JSONB DEFAULT '{}',
    creator_id UUID NOT NULL,
    private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para rooms
CREATE INDEX IF NOT EXISTS idx_rooms_tenant_id ON rooms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(type);
CREATE INDEX IF NOT EXISTS idx_rooms_creator_id ON rooms(creator_id);

-- Comentarios
COMMENT ON TABLE rooms IS 'Salas de chat/grupos';
COMMENT ON COLUMN rooms.type IS 'Tipo: group, class, private, public';

-- ============================================================================
-- TABLA: room_members (miembros de salas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS room_members (
    room_id VARCHAR(255) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT NOW(),
    last_read_at TIMESTAMP,
    PRIMARY KEY (room_id, user_id)
);

-- Índices para room_members
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_room_members_tenant_id ON room_members(tenant_id);

-- Comentarios
COMMENT ON TABLE room_members IS 'Miembros de salas de chat';
COMMENT ON COLUMN room_members.role IS 'Rol: admin, moderator, member';

-- ============================================================================
-- AGREGAR tenant_id A TABLAS EXISTENTES (si no existe)
-- ============================================================================

-- Agregar tenant_id a notifications (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'notifications'
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE notifications ADD COLUMN tenant_id UUID;
        CREATE INDEX idx_notifications_tenant_id ON notifications(tenant_id);
    END IF;
END $$;

-- ============================================================================
-- FUNCIONES HELPER
-- ============================================================================

-- Función para limpiar notificaciones antiguas (>30 días)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND read = TRUE;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener count de mensajes no leídos en sala
CREATE OR REPLACE FUNCTION get_unread_messages_count(
    p_room_id VARCHAR,
    p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
    last_read TIMESTAMP;
BEGIN
    -- Obtener última lectura del usuario
    SELECT last_read_at INTO last_read
    FROM room_members
    WHERE room_id = p_room_id AND user_id = p_user_id;

    -- Si no hay registro, retornar total de mensajes
    IF last_read IS NULL THEN
        SELECT COUNT(*) INTO unread_count
        FROM messages
        WHERE room_id = p_room_id AND deleted = FALSE;
    ELSE
        -- Contar mensajes después de última lectura
        SELECT COUNT(*) INTO unread_count
        FROM messages
        WHERE room_id = p_room_id
        AND created_at > last_read
        AND deleted = FALSE;
    END IF;

    RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar tablas creadas
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM (
    VALUES
        ('notifications'),
        ('messages'),
        ('collaborative_documents'),
        ('document_operations'),
        ('document_activity'),
        ('rooms'),
        ('room_members')
) AS t(table_name);

-- Verificar índices creados
SELECT
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
    'notifications',
    'messages',
    'collaborative_documents',
    'document_operations',
    'document_activity',
    'rooms',
    'room_members'
)
ORDER BY tablename, indexname;
