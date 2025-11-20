/**
 * 🔒 GDPR COMPLIANCE TABLES - SEMANA 27-28
 * Tablas necesarias para cumplir con GDPR
 *
 * Ejecutar en Neon Console o con:
 * psql $DATABASE_URL -f backend/scripts/create-gdpr-tables.sql
 *
 * Fecha: 20 Noviembre 2025
 */

-- ============================================================
-- 1. CONSENTS TABLE (Artículo 7 GDPR - Consent Management)
-- ============================================================

CREATE TABLE IF NOT EXISTS consents (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL, -- 'email_marketing', 'data_processing', 'cookies', etc
    granted BOOLEAN NOT NULL DEFAULT false,
    ip_address VARCHAR(45), -- IPv4 o IPv6
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(usuario_id, consent_type)
);

CREATE INDEX IF NOT EXISTS idx_consents_usuario_id ON consents(usuario_id);
CREATE INDEX IF NOT EXISTS idx_consents_type ON consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_consents_granted ON consents(granted);

COMMENT ON TABLE consents IS 'GDPR Consent tracking per user';
COMMENT ON COLUMN consents.consent_type IS 'Type of consent granted/revoked';
COMMENT ON COLUMN consents.granted IS 'True if consent granted, false if revoked';

-- ============================================================
-- 2. DATA_EXPORTS TABLE (Artículo 15 GDPR - Right to Access)
-- ============================================================

CREATE TABLE IF NOT EXISTS data_exports (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    format VARCHAR(20) NOT NULL, -- 'json', 'csv', 'xml'
    size BIGINT, -- bytes
    exported_at TIMESTAMP DEFAULT NOW(),
    downloaded_at TIMESTAMP,
    expires_at TIMESTAMP, -- Optional: Auto-delete after X days
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_data_exports_usuario_id ON data_exports(usuario_id);
CREATE INDEX IF NOT EXISTS idx_data_exports_exported_at ON data_exports(exported_at);

COMMENT ON TABLE data_exports IS 'GDPR Data export requests and records';
COMMENT ON COLUMN data_exports.format IS 'Export format: json, csv, xml';

-- ============================================================
-- 3. DELETED_USERS TABLE (Artículo 17 GDPR - Right to Erasure)
-- ============================================================

CREATE TABLE IF NOT EXISTS deleted_users (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL, -- Original user ID (no FK - user deleted)
    deletion_date TIMESTAMP DEFAULT NOW(),
    reason TEXT,
    backup_data JSONB, -- Full backup of user data antes de eliminar
    deleted_by INTEGER REFERENCES usuarios(id), -- Admin who deleted (if applicable)
    permanent_deletion_date TIMESTAMP, -- Cuando se elimina backup (90 días después)
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_deleted_users_user_id ON deleted_users(user_id);
CREATE INDEX IF NOT EXISTS idx_deleted_users_deletion_date ON deleted_users(deletion_date);

COMMENT ON TABLE deleted_users IS 'GDPR Deleted users backup (retained 90 days)';
COMMENT ON COLUMN deleted_users.backup_data IS 'Full user data backup (for recovery if needed)';

-- ============================================================
-- 4. DATA_BREACHES TABLE (Artículo 33-34 GDPR - Breach Notification)
-- ============================================================

CREATE TABLE IF NOT EXISTS data_breaches (
    id VARCHAR(50) PRIMARY KEY,
    breach_type VARCHAR(100) NOT NULL, -- 'unauthorized_access', 'data_leak', 'ransomware', etc
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    affected_users_count INTEGER DEFAULT 0,
    description TEXT NOT NULL,
    detected_at TIMESTAMP NOT NULL,
    reported_at TIMESTAMP DEFAULT NOW(),
    notified_users_at TIMESTAMP, -- When users were notified
    resolved_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'reported', -- 'reported', 'investigating', 'contained', 'resolved'
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_data_breaches_detected_at ON data_breaches(detected_at);
CREATE INDEX IF NOT EXISTS idx_data_breaches_severity ON data_breaches(severity);
CREATE INDEX IF NOT EXISTS idx_data_breaches_status ON data_breaches(status);

COMMENT ON TABLE data_breaches IS 'GDPR Data breach tracking and notification';
COMMENT ON COLUMN data_breaches.detected_at IS 'When breach was first detected';
COMMENT ON COLUMN data_breaches.reported_at IS 'When breach was reported (72-hour deadline)';

-- ============================================================
-- 5. AUDIT_LOGS TABLE (If not exists - GDPR compliance audit trail)
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'EXPORT', 'DELETE', 'VIEW', 'UPDATE', 'LOGIN', etc
    requested_by INTEGER REFERENCES usuarios(id), -- Who requested the action
    reason TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_usuario_id ON audit_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

COMMENT ON TABLE audit_logs IS 'GDPR Audit trail for data access and modifications';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed on user data';

-- ============================================================
-- 6. PRIVACY_POLICIES TABLE (GDPR compliance documentation)
-- ============================================================

CREATE TABLE IF NOT EXISTS privacy_policies (
    id SERIAL PRIMARY KEY,
    version VARCHAR(20) NOT NULL UNIQUE, -- '1.0', '2.0', etc
    effective_date DATE NOT NULL,
    content TEXT NOT NULL, -- Full privacy policy text
    changes_summary TEXT, -- Summary of changes from previous version
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_privacy_policies_version ON privacy_policies(version);
CREATE INDEX IF NOT EXISTS idx_privacy_policies_effective_date ON privacy_policies(effective_date);
CREATE INDEX IF NOT EXISTS idx_privacy_policies_active ON privacy_policies(is_active);

COMMENT ON TABLE privacy_policies IS 'GDPR Privacy policy versions and history';

-- ============================================================
-- 7. USER_PRIVACY_POLICY_ACCEPTANCE TABLE (User acceptance tracking)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_privacy_policy_acceptance (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    policy_version VARCHAR(20) NOT NULL,
    accepted_at TIMESTAMP DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT,
    UNIQUE(usuario_id, policy_version)
);

CREATE INDEX IF NOT EXISTS idx_user_privacy_acceptance_usuario_id ON user_privacy_policy_acceptance(usuario_id);
CREATE INDEX IF NOT EXISTS idx_user_privacy_acceptance_policy_version ON user_privacy_policy_acceptance(policy_version);

COMMENT ON TABLE user_privacy_policy_acceptance IS 'GDPR User acceptance of privacy policies';

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Verify all tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('consents', 'data_exports', 'deleted_users', 'data_breaches', 'audit_logs', 'privacy_policies', 'user_privacy_policy_acceptance')
ORDER BY table_name;

-- Show table structures
\d consents
\d data_exports
\d deleted_users
\d data_breaches
\d audit_logs
\d privacy_policies
\d user_privacy_policy_acceptance

-- ============================================================
-- SAMPLE DATA (for testing)
-- ============================================================

-- Insert sample privacy policy
INSERT INTO privacy_policies (version, effective_date, content, is_active)
VALUES (
    '1.0',
    '2025-11-20',
    'This is a sample GDPR-compliant privacy policy...',
    true
)
ON CONFLICT (version) DO NOTHING;

-- Show counts
SELECT
    (SELECT COUNT(*) FROM consents) as consents_count,
    (SELECT COUNT(*) FROM data_exports) as exports_count,
    (SELECT COUNT(*) FROM deleted_users) as deleted_users_count,
    (SELECT COUNT(*) FROM data_breaches) as breaches_count,
    (SELECT COUNT(*) FROM audit_logs) as audit_logs_count,
    (SELECT COUNT(*) FROM privacy_policies) as policies_count;
