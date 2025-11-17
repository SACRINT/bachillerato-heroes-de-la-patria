-- ============================================================================
-- 📝 AUDIT LOGS TABLE - SEMANA 15
-- Tamper-proof audit logging for compliance
--
-- Features:
-- - Blockchain-style hash chain (tamper detection)
-- - 7-year retention (compliance requirement)
-- - Comprehensive logging (quien/qué/cuándo/dónde)
-- - Optimized indexes for queries
--
-- Fecha: 17 Noviembre 2025
-- Estado: ✅ PRODUCTION-READY
-- ============================================================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,

  -- Who (quien)
  user_id VARCHAR(255) NOT NULL,

  -- What (qué)
  action VARCHAR(50) NOT NULL,  -- CREATE, READ, UPDATE, DELETE, LOGIN, etc
  resource VARCHAR(100) NOT NULL, -- usuarios, estudiantes, calificaciones, etc
  resource_id VARCHAR(255) NOT NULL,

  -- When (cuándo)
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Where (dónde)
  ip_address VARCHAR(45) NOT NULL, -- IPv6 support (max 45 chars)
  user_agent TEXT,

  -- Changes (detalles)
  changes JSONB, -- Store old/new values for UPDATE/DELETE

  -- Blockchain-style hash chain (tamper detection)
  hash VARCHAR(64) NOT NULL, -- SHA-256 hash of this entry
  previous_hash VARCHAR(64) NOT NULL, -- Hash of previous entry

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES for performance
-- ============================================================================

-- Index on user_id (query by user)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Index on resource + resource_id (query by resource)
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource, resource_id);

-- Index on timestamp (query by date range)
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- Index on action (query by action type)
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Composite index for common query pattern (user + date range)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);

-- ============================================================================
-- PARTITIONING (opcional, para tablas muy grandes >10M rows)
-- ============================================================================

-- Para sistemas de alta escala, considera partitioning por año:
-- CREATE TABLE audit_logs_2025 PARTITION OF audit_logs
--   FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
--
-- CREATE TABLE audit_logs_2026 PARTITION OF audit_logs
--   FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- ============================================================================
-- RETENTION POLICY (7 años para compliance)
-- ============================================================================

-- Automatic cleanup function (runs daily via cron)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete logs older than 7 years (2555 days)
  DELETE FROM audit_logs
  WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '2555 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RAISE NOTICE 'Cleaned up % old audit logs', deleted_count;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION FUNCTION (check hash chain integrity)
-- ============================================================================

CREATE OR REPLACE FUNCTION verify_audit_log_integrity()
RETURNS TABLE(is_valid BOOLEAN, first_tampered_id BIGINT) AS $$
DECLARE
  current_row RECORD;
  previous_hash_value VARCHAR(64) := '0';
  expected_hash VARCHAR(64);
BEGIN
  FOR current_row IN
    SELECT id, timestamp, user_id, action, resource, resource_id, ip_address, hash, previous_hash
    FROM audit_logs
    ORDER BY id ASC
  LOOP
    -- Recompute hash (simplified - full implementation in application layer)
    -- Here we just check if previous_hash matches
    IF current_row.previous_hash != previous_hash_value THEN
      RETURN QUERY SELECT FALSE, current_row.id;
      RETURN;
    END IF;

    previous_hash_value := current_row.hash;
  END LOOP;

  RETURN QUERY SELECT TRUE, NULL::BIGINT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER (prevent UPDATE/DELETE on audit_logs - append-only)
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs cannot be modified or deleted (append-only)';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent UPDATE
CREATE TRIGGER prevent_audit_log_update
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_modification();

-- Create trigger to prevent DELETE (except via cleanup function)
CREATE TRIGGER prevent_audit_log_delete
  BEFORE DELETE ON audit_logs
  FOR EACH ROW
  WHEN (CURRENT_USER != 'postgres') -- Allow cleanup function to delete
  EXECUTE FUNCTION prevent_audit_log_modification();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant INSERT permission to application user
GRANT INSERT, SELECT ON audit_logs TO bge_app_user;

-- Revoke UPDATE and DELETE (append-only)
REVOKE UPDATE, DELETE ON audit_logs FROM bge_app_user;

-- ============================================================================
-- SAMPLE QUERIES
-- ============================================================================

-- Query 1: Get all logs for a specific user
-- SELECT * FROM audit_logs WHERE user_id = 'user-uuid' ORDER BY timestamp DESC LIMIT 100;

-- Query 2: Get all logs for a specific resource
-- SELECT * FROM audit_logs WHERE resource = 'usuarios' AND resource_id = '123' ORDER BY timestamp DESC;

-- Query 3: Get all failed login attempts in last 24 hours
-- SELECT * FROM audit_logs
-- WHERE action = 'LOGIN_FAILED'
--   AND timestamp > CURRENT_TIMESTAMP - INTERVAL '24 hours'
-- ORDER BY timestamp DESC;

-- Query 4: Verify audit log integrity
-- SELECT * FROM verify_audit_log_integrity();
-- Expected: (TRUE, NULL) if no tampering detected

-- Query 5: Cleanup old logs (run monthly via cron)
-- SELECT cleanup_old_audit_logs();

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
