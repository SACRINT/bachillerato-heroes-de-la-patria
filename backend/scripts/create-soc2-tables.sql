/**
 * 🔐 SOC2 COMPLIANCE TABLES - SEMANA 27-28
 * Tablas necesarias para cumplir con SOC2 Type II
 *
 * Ejecutar en Neon Console o con:
 * psql $DATABASE_URL -f backend/scripts/create-soc2-tables.sql
 *
 * Fecha: 20 Noviembre 2025
 */

-- ============================================================
-- 1. SOC2_AUDIT_LOGS TABLE (7-year retention for SOC2)
-- ============================================================

CREATE TABLE IF NOT EXISTS soc2_audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    action VARCHAR(100) NOT NULL, -- LOGIN, UPDATE_USER_ROLE, EXPORT_DATA, etc
    user_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    performed_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    resource_type VARCHAR(100), -- 'user', 'grade', 'document', etc
    resource_id VARCHAR(100),
    ip_address VARCHAR(45), -- IPv4 o IPv6
    user_agent TEXT,
    details JSONB DEFAULT '{}',
    severity VARCHAR(20) DEFAULT 'info', -- 'critical', 'high', 'medium', 'low', 'info'
    status VARCHAR(20) DEFAULT 'success', -- 'success', 'failure', 'pending'
    category VARCHAR(50) -- 'authentication', 'data_access', 'user_management', etc
);

CREATE INDEX IF NOT EXISTS idx_soc2_audit_logs_timestamp ON soc2_audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_soc2_audit_logs_user_id ON soc2_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_soc2_audit_logs_action ON soc2_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_soc2_audit_logs_severity ON soc2_audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_soc2_audit_logs_category ON soc2_audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_soc2_audit_logs_ip_address ON soc2_audit_logs(ip_address);

COMMENT ON TABLE soc2_audit_logs IS 'SOC2 Comprehensive audit trail with 7-year retention';
COMMENT ON COLUMN soc2_audit_logs.timestamp IS 'When action occurred (immutable)';
COMMENT ON COLUMN soc2_audit_logs.performed_by IS 'User who performed action (may differ from user_id for admin actions)';

-- ============================================================
-- 2. SOC2_INCIDENTS TABLE (Security incident tracking)
-- ============================================================

CREATE TABLE IF NOT EXISTS soc2_incidents (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(100) NOT NULL, -- 'BRUTE_FORCE_ATTACK', 'PRIVILEGE_ESCALATION', etc
    severity VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low'
    description TEXT NOT NULL,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    performed_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    originating_event_id VARCHAR(50) REFERENCES soc2_audit_logs(id),
    action_taken VARCHAR(200), -- 'BLOCK_IP', 'ALERT_SECURITY_TEAM', etc
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'false_positive'
    detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
    investigated_at TIMESTAMP,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_soc2_incidents_detected_at ON soc2_incidents(detected_at);
CREATE INDEX IF NOT EXISTS idx_soc2_incidents_severity ON soc2_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_soc2_incidents_status ON soc2_incidents(status);
CREATE INDEX IF NOT EXISTS idx_soc2_incidents_type ON soc2_incidents(type);

COMMENT ON TABLE soc2_incidents IS 'SOC2 Security incident tracking and response';
COMMENT ON COLUMN soc2_incidents.originating_event_id IS 'Reference to audit log event that triggered incident';

-- ============================================================
-- 3. RBAC_PERMISSIONS TABLE (Role-Based Access Control)
-- ============================================================

CREATE TABLE IF NOT EXISTS rbac_permissions (
    id SERIAL PRIMARY KEY,
    role VARCHAR(50) NOT NULL, -- 'admin', 'student', 'teacher', etc
    action VARCHAR(100) NOT NULL, -- 'READ', 'WRITE', 'DELETE', 'EXPORT', etc
    resource_type VARCHAR(100) NOT NULL, -- 'user', 'grade', 'document', etc
    conditions JSONB DEFAULT '{}', -- Additional conditions (e.g., "own_data_only": true)
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(role, action, resource_type)
);

CREATE INDEX IF NOT EXISTS idx_rbac_permissions_role ON rbac_permissions(role);
CREATE INDEX IF NOT EXISTS idx_rbac_permissions_action ON rbac_permissions(action);
CREATE INDEX IF NOT EXISTS idx_rbac_permissions_resource_type ON rbac_permissions(resource_type);

COMMENT ON TABLE rbac_permissions IS 'SOC2 Role-Based Access Control permissions';

-- ============================================================
-- 4. CHANGE_MANAGEMENT_LOG TABLE (SOC2: Configuration changes)
-- ============================================================

CREATE TABLE IF NOT EXISTS change_management_log (
    id SERIAL PRIMARY KEY,
    change_type VARCHAR(100) NOT NULL, -- 'CONFIG_CHANGE', 'PERMISSION_CHANGE', 'SCHEMA_CHANGE', etc
    description TEXT NOT NULL,
    performed_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    approved_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    before_state JSONB,
    after_state JSONB,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'implemented', 'rolled_back'
    requested_at TIMESTAMP DEFAULT NOW(),
    implemented_at TIMESTAMP,
    rollback_plan TEXT,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_change_mgmt_requested_at ON change_management_log(requested_at);
CREATE INDEX IF NOT EXISTS idx_change_mgmt_status ON change_management_log(status);
CREATE INDEX IF NOT EXISTS idx_change_mgmt_type ON change_management_log(change_type);

COMMENT ON TABLE change_management_log IS 'SOC2 Change management tracking';

-- ============================================================
-- 5. ENCRYPTION_KEYS TABLE (SOC2: Key management)
-- ============================================================

CREATE TABLE IF NOT EXISTS encryption_keys (
    id SERIAL PRIMARY KEY,
    key_id VARCHAR(100) NOT NULL UNIQUE,
    algorithm VARCHAR(50) NOT NULL, -- 'aes-256-gcm', 'rsa-2048', etc
    key_hash VARCHAR(128) NOT NULL, -- Hash of key (never store actual key in DB)
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'rotated', 'revoked'
    created_at TIMESTAMP DEFAULT NOW(),
    rotated_at TIMESTAMP,
    expires_at TIMESTAMP,
    rotation_schedule_days INTEGER DEFAULT 90,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_encryption_keys_key_id ON encryption_keys(key_id);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_status ON encryption_keys(status);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_expires_at ON encryption_keys(expires_at);

COMMENT ON TABLE encryption_keys IS 'SOC2 Encryption key metadata (NOT actual keys)';
COMMENT ON COLUMN encryption_keys.key_hash IS 'SHA256 hash of key for verification (NOT the actual key)';

-- ============================================================
-- 6. VENDOR_RISK_ASSESSMENTS TABLE (SOC2: Vendor management)
-- ============================================================

CREATE TABLE IF NOT EXISTS vendor_risk_assessments (
    id SERIAL PRIMARY KEY,
    vendor_name VARCHAR(200) NOT NULL,
    vendor_type VARCHAR(100), -- 'cloud_provider', 'payment_processor', 'analytics', etc
    assessment_date DATE NOT NULL,
    risk_level VARCHAR(50), -- 'low', 'medium', 'high', 'critical'
    soc2_compliant BOOLEAN DEFAULT false,
    data_shared TEXT[], -- Array of data types shared with vendor
    last_review_date DATE,
    next_review_date DATE,
    notes TEXT,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_vendor_risk_vendor_name ON vendor_risk_assessments(vendor_name);
CREATE INDEX IF NOT EXISTS idx_vendor_risk_next_review ON vendor_risk_assessments(next_review_date);
CREATE INDEX IF NOT EXISTS idx_vendor_risk_level ON vendor_risk_assessments(risk_level);

COMMENT ON TABLE vendor_risk_assessments IS 'SOC2 Vendor risk management and assessments';

-- ============================================================
-- SEED DATA (SOC2 Default RBAC Permissions)
-- ============================================================

-- Admin permissions (full access)
INSERT INTO rbac_permissions (role, action, resource_type, conditions)
VALUES
    ('admin', 'READ', 'user', '{}'),
    ('admin', 'WRITE', 'user', '{}'),
    ('admin', 'DELETE', 'user', '{}'),
    ('admin', 'EXPORT', 'user', '{}'),
    ('admin', 'READ', 'grade', '{}'),
    ('admin', 'WRITE', 'grade', '{}'),
    ('admin', 'DELETE', 'grade', '{}'),
    ('admin', 'READ', 'audit_log', '{}')
ON CONFLICT (role, action, resource_type) DO NOTHING;

-- Student permissions (limited access)
INSERT INTO rbac_permissions (role, action, resource_type, conditions)
VALUES
    ('estudiante', 'READ', 'user', '{"own_data_only": true}'),
    ('estudiante', 'WRITE', 'user', '{"own_data_only": true, "fields": ["email", "phone"]}'),
    ('estudiante', 'READ', 'grade', '{"own_data_only": true}')
ON CONFLICT (role, action, resource_type) DO NOTHING;

-- Teacher permissions (moderate access)
INSERT INTO rbac_permissions (role, action, resource_type, conditions)
VALUES
    ('docente', 'READ', 'user', '{"own_students_only": true}'),
    ('docente', 'READ', 'grade', '{"own_students_only": true}'),
    ('docente', 'WRITE', 'grade', '{"own_students_only": true}')
ON CONFLICT (role, action, resource_type) DO NOTHING;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Verify all tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('soc2_audit_logs', 'soc2_incidents', 'rbac_permissions', 'change_management_log', 'encryption_keys', 'vendor_risk_assessments')
ORDER BY table_name;

-- Show table structures
\d soc2_audit_logs
\d soc2_incidents
\d rbac_permissions

-- Show initial RBAC permissions
SELECT role, action, resource_type, conditions
FROM rbac_permissions
ORDER BY role, resource_type, action;

-- ============================================================
-- RETENTION POLICY (SOC2: 7-year retention)
-- ============================================================

COMMENT ON TABLE soc2_audit_logs IS 'RETENTION: 7 years (2,555 days) - SOC2 requirement';
COMMENT ON TABLE soc2_incidents IS 'RETENTION: 7 years (2,555 days) - SOC2 requirement';

-- Optional: Create function to clean up old audit logs (execute manually after 7 years)
CREATE OR REPLACE FUNCTION cleanup_old_soc2_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM soc2_audit_logs
    WHERE timestamp < NOW() - INTERVAL '7 years';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_soc2_audit_logs IS 'Clean up audit logs older than 7 years (SOC2 retention)';
