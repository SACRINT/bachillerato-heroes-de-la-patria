-- ============================================
-- BGE v5.0-5.2 Enterprise Tables Migration
-- VERSIÓN CORREGIDA - Solo tablas faltantes
-- Fecha: 07 Diciembre 2025
-- ============================================
-- NOTA: Algunas tablas ya existen (user_2fa, user_sessions, audit_logs)
-- Este script solo crea las que faltan
-- =============================================
-- 1. SECURITY TABLES - Verificar si faltan
-- =============================================
-- password_history (puede faltar)
CREATE TABLE IF NOT EXISTS password_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);
-- security_threats
CREATE TABLE IF NOT EXISTS security_threats (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    threats JSONB NOT NULL,
    detected_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_security_threats_ip ON security_threats(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_threats_date ON security_threats(detected_at);
-- =============================================
-- 2. COLLABORATION TABLES
-- =============================================
-- collaboration_rooms
CREATE TABLE IF NOT EXISTS collaboration_rooms (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    host_id INTEGER,
    access_code VARCHAR(10),
    scheduled_start TIMESTAMP,
    duration_ms BIGINT DEFAULT 3600000,
    max_participants INTEGER DEFAULT 50,
    settings JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'created',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_collaboration_rooms_room_id ON collaboration_rooms(room_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_rooms_host ON collaboration_rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_rooms_status ON collaboration_rooms(status);
-- room_participants
CREATE TABLE IF NOT EXISTS room_participants (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(50) NOT NULL,
    user_id INTEGER,
    joined_at TIMESTAMP DEFAULT NOW(),
    left_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_room_participants_room ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user ON room_participants(user_id);
-- chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(50) NOT NULL,
    participant_id VARCHAR(100),
    user_id INTEGER,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text',
    reply_to INTEGER,
    edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP,
    timestamp TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
-- collaborative_documents
CREATE TABLE IF NOT EXISTS collaborative_documents (
    id VARCHAR(100) PRIMARY KEY,
    content TEXT DEFAULT '',
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);
-- =============================================
-- 3. GDPR TABLES
-- =============================================
-- gdpr_requests
CREATE TABLE IF NOT EXISTS gdpr_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    request_type VARCHAR(30) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
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
-- gdpr_consents
CREATE TABLE IF NOT EXISTS gdpr_consents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
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
-- 4. BACKUP TABLES
-- =============================================
CREATE TABLE IF NOT EXISTS backup_history (
    id SERIAL PRIMARY KEY,
    level INTEGER NOT NULL,
    level_name VARCHAR(30) NOT NULL,
    status VARCHAR(20) DEFAULT 'started',
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
-- =============================================
-- 5. SMS TABLES
-- =============================================
CREATE TABLE IF NOT EXISTS sms_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    phone_number VARCHAR(20) NOT NULL,
    template VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    provider VARCHAR(30),
    status VARCHAR(20) DEFAULT 'sent',
    provider_message_id VARCHAR(100),
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sms_history_user ON sms_history(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_history_phone ON sms_history(phone_number);
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
-- =============================================
-- 6. EMAIL TABLES
-- =============================================
CREATE TABLE IF NOT EXISTS email_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    recipient_email VARCHAR(255) NOT NULL,
    template VARCHAR(50) NOT NULL,
    subject VARCHAR(500),
    status VARCHAR(20) DEFAULT 'sent',
    error_message TEXT,
    opened_at TIMESTAMP,
    sent_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_history_user ON email_history(user_id);
CREATE INDEX IF NOT EXISTS idx_email_history_recipient ON email_history(recipient_email);
-- =============================================
-- 7. INTERNATIONALIZATION
-- =============================================
CREATE TABLE IF NOT EXISTS custom_translations (
    id SERIAL PRIMARY KEY,
    locale VARCHAR(10) NOT NULL,
    key VARCHAR(200) NOT NULL,
    value TEXT NOT NULL,
    tenant_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_custom_translations_locale ON custom_translations(locale);
-- =============================================
-- 8. PERFORMANCE METRICS
-- =============================================
CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    page_url VARCHAR(500) NOT NULL,
    user_id INTEGER,
    session_id VARCHAR(100),
    ttfb INTEGER,
    fcp INTEGER,
    lcp INTEGER,
    fid INTEGER,
    cls DECIMAL(5, 3),
    total_resources INTEGER,
    total_size BIGINT,
    score INTEGER,
    device_type VARCHAR(20),
    connection_type VARCHAR(30),
    recorded_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_page ON performance_metrics(page_url);
-- =============================================
-- COMPLETION
-- =============================================
SELECT 'V5 Enterprise Tables Migration - COMPLETED' AS status;