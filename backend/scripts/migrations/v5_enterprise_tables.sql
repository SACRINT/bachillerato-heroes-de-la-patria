-- ============================================
-- BGE v5.0-5.2 Enterprise Tables Migration
-- Migración completa para servicios enterprise
-- ============================================

-- =============================================
-- 1. SECURITY TABLES (AdvancedSecurityService)
-- =============================================

-- Tabla para 2FA
CREATE TABLE IF NOT EXISTS user_2fa (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    totp_secret TEXT,
    backup_codes JSONB,
    enabled BOOLEAN DEFAULT false,
    verified_at TIMESTAMP,
    failed_attempts INTEGER DEFAULT 0,
    last_failed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_2fa_user_id ON user_2fa(user_id);

-- Tabla para sesiones de usuario
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    device_info JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Tabla para historial de contraseñas
CREATE TABLE IF NOT EXISTS password_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);

-- Tabla para amenazas de seguridad detectadas
CREATE TABLE IF NOT EXISTS security_threats (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    threats JSONB NOT NULL,
    detected_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_threats_ip ON security_threats(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_threats_date ON security_threats(detected_at);

-- =============================================
-- 2. COLLABORATION TABLES (RealTimeCollaborationService)
-- =============================================

-- Tabla para salas de colaboración
CREATE TABLE IF NOT EXISTS collaboration_rooms (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('video', 'chat', 'document', 'whiteboard')),
    name VARCHAR(200) NOT NULL,
    host_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    access_code VARCHAR(10),
    scheduled_start TIMESTAMP,
    duration_ms BIGINT DEFAULT 3600000,
    max_participants INTEGER DEFAULT 50,
    settings JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created', 'active', 'closed')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_collaboration_rooms_room_id ON collaboration_rooms(room_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_rooms_host ON collaboration_rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_rooms_status ON collaboration_rooms(status);

-- Tabla para participantes de salas
CREATE TABLE IF NOT EXISTS room_participants (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(50) NOT NULL,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    joined_at TIMESTAMP DEFAULT NOW(),
    left_at TIMESTAMP,
    CONSTRAINT fk_room_participants_room FOREIGN KEY (room_id) REFERENCES collaboration_rooms(room_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_room_participants_room ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user ON room_participants(user_id);

-- Tabla para mensajes de chat
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY,
    room_id VARCHAR(50) NOT NULL,
    participant_id UUID,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'file', 'system')),
    reply_to UUID,
    edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP,
    timestamp TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_chat_messages_room FOREIGN KEY (room_id) REFERENCES collaboration_rooms(room_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);

-- Tabla para documentos colaborativos
CREATE TABLE IF NOT EXISTS collaborative_documents (
    id VARCHAR(100) PRIMARY KEY,
    content TEXT DEFAULT '',
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- =============================================
-- 3. AUDIT TABLES (AuditLogService)
-- =============================================

-- Tabla para logs de auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    action VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    user_id INTEGER,
    ip_address VARCHAR(45),
    user_agent TEXT,
    resource_type VARCHAR(100),
    resource_id VARCHAR(100),
    details JSONB,
    checksum VARCHAR(64),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);

-- =============================================
-- 4. GDPR TABLES (GDPRDataExportService)
-- =============================================

-- Tabla para solicitudes GDPR
CREATE TABLE IF NOT EXISTS gdpr_requests (
    id UUID PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    request_type VARCHAR(30) NOT NULL CHECK (request_type IN ('access', 'portability', 'erasure', 'rectification', 'restriction')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    requested_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    completed_at TIMESTAMP,
    rejection_reason TEXT,
    export_url TEXT,
    export_expires_at TIMESTAMP,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user ON gdpr_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON gdpr_requests(status);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_type ON gdpr_requests(request_type);

-- Tabla para consentimientos GDPR
CREATE TABLE IF NOT EXISTS gdpr_consents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL,
    consent_given BOOLEAN NOT NULL,
    version VARCHAR(20),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gdpr_consents_user ON gdpr_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_consents_type ON gdpr_consents(consent_type);

-- =============================================
-- 5. BACKUP TABLES (BackupAutomationService)
-- =============================================

-- Tabla para historial de backups
CREATE TABLE IF NOT EXISTS backup_history (
    id UUID PRIMARY KEY,
    level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
    level_name VARCHAR(30) NOT NULL,
    status VARCHAR(20) DEFAULT 'started' CHECK (status IN ('started', 'completed', 'failed', 'verified')),
    file_path TEXT,
    file_size BIGINT,
    checksum VARCHAR(64),
    encrypted BOOLEAN DEFAULT false,
    compressed BOOLEAN DEFAULT false,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    error_message TEXT,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_backup_history_level ON backup_history(level);
CREATE INDEX IF NOT EXISTS idx_backup_history_status ON backup_history(status);
CREATE INDEX IF NOT EXISTS idx_backup_history_date ON backup_history(started_at);

-- =============================================
-- 6. SMS NOTIFICATION TABLES
-- =============================================

-- Tabla para historial de SMS
CREATE TABLE IF NOT EXISTS sms_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    phone_number VARCHAR(20) NOT NULL,
    template VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    provider VARCHAR(30),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
    provider_message_id VARCHAR(100),
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_history_user ON sms_history(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_history_phone ON sms_history(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_history_date ON sms_history(sent_at);

-- Tabla para códigos de verificación SMS
CREATE TABLE IF NOT EXISTS sms_verification_codes (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_verification_phone ON sms_verification_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_verification_expires ON sms_verification_codes(expires_at);

-- =============================================
-- 7. EMAIL TEMPLATE TABLES
-- =============================================

-- Tabla para historial de emails
CREATE TABLE IF NOT EXISTS email_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    recipient_email VARCHAR(255) NOT NULL,
    template VARCHAR(50) NOT NULL,
    subject VARCHAR(500),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'bounced', 'opened')),
    error_message TEXT,
    opened_at TIMESTAMP,
    sent_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_history_user ON email_history(user_id);
CREATE INDEX IF NOT EXISTS idx_email_history_recipient ON email_history(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_history_date ON email_history(sent_at);

-- =============================================
-- 8. INTERNATIONALIZATION TABLES
-- =============================================

-- Tabla para traducciones personalizadas
CREATE TABLE IF NOT EXISTS custom_translations (
    id SERIAL PRIMARY KEY,
    locale VARCHAR(10) NOT NULL,
    key VARCHAR(200) NOT NULL,
    value TEXT NOT NULL,
    tenant_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    UNIQUE(locale, key, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_custom_translations_locale ON custom_translations(locale);
CREATE INDEX IF NOT EXISTS idx_custom_translations_key ON custom_translations(key);

-- =============================================
-- 9. PERFORMANCE METRICS TABLES
-- =============================================

-- Tabla para métricas de rendimiento
CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    page_url VARCHAR(500) NOT NULL,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    session_id UUID,
    ttfb INTEGER,
    fcp INTEGER,
    lcp INTEGER,
    fid INTEGER,
    cls DECIMAL(5,3),
    total_resources INTEGER,
    total_size BIGINT,
    score INTEGER,
    device_type VARCHAR(20),
    connection_type VARCHAR(30),
    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_page ON performance_metrics(page_url);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_date ON performance_metrics(recorded_at);

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '======================================';
    RAISE NOTICE 'BGE v5.0-5.2 Migration Completed!';
    RAISE NOTICE '======================================';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - Security: user_2fa, user_sessions, password_history, security_threats';
    RAISE NOTICE '  - Collaboration: collaboration_rooms, room_participants, chat_messages, collaborative_documents';
    RAISE NOTICE '  - Audit: audit_logs';
    RAISE NOTICE '  - GDPR: gdpr_requests, gdpr_consents';
    RAISE NOTICE '  - Backup: backup_history';
    RAISE NOTICE '  - SMS: sms_history, sms_verification_codes';
    RAISE NOTICE '  - Email: email_history';
    RAISE NOTICE '  - i18n: custom_translations';
    RAISE NOTICE '  - Performance: performance_metrics';
    RAISE NOTICE '======================================';
END $$;
