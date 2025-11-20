-- ========================================
-- MIGRACIÓN: Sistema de Auditoría de Seguridad
-- BGE Héroes de la Patria
-- FASE 4 - Semana 27-28
-- ========================================

-- ========================================
-- TABLA: Logs de Auditoría de Seguridad
-- ========================================
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(50) UNIQUE NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Tipo y severidad
    event_type VARCHAR(50) NOT NULL,
    severity INTEGER NOT NULL DEFAULT 1,                    -- 0=DEBUG, 1=INFO, 2=WARNING, 3=ERROR, 4=CRITICAL

    -- Contexto del usuario
    user_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,

    -- Acción realizada
    resource VARCHAR(255),                                  -- Recurso accedido/modificado
    action VARCHAR(100),                                    -- Acción específica

    -- Detalles
    details JSONB DEFAULT '{}',
    success BOOLEAN DEFAULT true,

    -- Metadatos adicionales
    metadata JSONB DEFAULT '{}'                             -- sessionId, requestId, duration, etc.
);

-- ========================================
-- TABLA: Configuración de Seguridad por Tenant
-- ========================================
CREATE TABLE IF NOT EXISTS security_config (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,

    -- Autenticación
    max_login_attempts INTEGER DEFAULT 5,
    lockout_duration_minutes INTEGER DEFAULT 15,
    session_timeout_minutes INTEGER DEFAULT 60,
    require_2fa BOOLEAN DEFAULT false,

    -- Contraseñas
    password_min_length INTEGER DEFAULT 8,
    password_require_uppercase BOOLEAN DEFAULT true,
    password_require_lowercase BOOLEAN DEFAULT true,
    password_require_numbers BOOLEAN DEFAULT true,
    password_require_special BOOLEAN DEFAULT true,
    password_max_age_days INTEGER DEFAULT 90,
    password_history_count INTEGER DEFAULT 5,               -- No repetir últimas N contraseñas

    -- Rate Limiting
    api_rate_limit INTEGER DEFAULT 100,                     -- Requests por minuto
    auth_rate_limit INTEGER DEFAULT 5,                      -- Intentos auth por 5 min

    -- IPs
    ip_whitelist JSONB DEFAULT '[]',
    ip_blacklist JSONB DEFAULT '[]',

    -- Auditoría
    audit_retention_days INTEGER DEFAULT 90,
    audit_level VARCHAR(20) DEFAULT 'standard',             -- minimal, standard, verbose

    -- Notificaciones
    notify_on_login_failure BOOLEAN DEFAULT true,
    notify_on_suspicious_activity BOOLEAN DEFAULT true,
    notification_emails JSONB DEFAULT '[]',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(tenant_id)
);

-- ========================================
-- TABLA: Historial de Contraseñas
-- ========================================
CREATE TABLE IF NOT EXISTS password_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Sesiones Activas
-- ========================================
CREATE TABLE IF NOT EXISTS active_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Información del dispositivo
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(100),

    -- Estado
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Metadatos
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- TABLA: IPs Bloqueadas
-- ========================================
CREATE TABLE IF NOT EXISTS blocked_ips (
    id SERIAL PRIMARY KEY,
    ip_address INET NOT NULL,
    reason VARCHAR(255),
    blocked_by INTEGER REFERENCES usuarios(id),

    -- Duración
    is_permanent BOOLEAN DEFAULT false,
    blocked_until TIMESTAMP WITH TIME ZONE,

    -- Tracking
    attempts INTEGER DEFAULT 0,
    last_attempt TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(ip_address)
);

-- ========================================
-- TABLA: Tokens de Recuperación
-- ========================================
CREATE TABLE IF NOT EXISTS recovery_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    token_type VARCHAR(50) NOT NULL,                        -- password_reset, email_verification, 2fa_setup

    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    ip_requested INET,
    ip_used INET,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Alertas de Seguridad
-- ========================================
CREATE TABLE IF NOT EXISTS security_alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    severity INTEGER NOT NULL,                              -- 1-5

    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Contexto
    user_id INTEGER REFERENCES usuarios(id),
    ip_address INET,
    related_event_id VARCHAR(50),

    -- Estado
    status VARCHAR(20) DEFAULT 'new',                       -- new, acknowledged, resolved, false_positive
    acknowledged_by INTEGER REFERENCES usuarios(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_by INTEGER REFERENCES usuarios(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ÍNDICES DE PERFORMANCE
-- ========================================

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON security_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_ip ON security_audit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON security_audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_success ON security_audit_logs(success);
CREATE INDEX IF NOT EXISTS idx_audit_composite ON security_audit_logs(timestamp DESC, event_type, severity);

-- Password history
CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_date ON password_history(created_at DESC);

-- Active sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON active_sessions(is_active, last_activity);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON active_sessions(expires_at);

-- Blocked IPs
CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip ON blocked_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_until ON blocked_ips(blocked_until);

-- Recovery tokens
CREATE INDEX IF NOT EXISTS idx_recovery_tokens_user ON recovery_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_tokens_expires ON recovery_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_recovery_tokens_type ON recovery_tokens(token_type);

-- Security alerts
CREATE INDEX IF NOT EXISTS idx_alerts_status ON security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON security_alerts(severity DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON security_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON security_alerts(alert_type);

-- ========================================
-- TRIGGERS
-- ========================================

-- Actualizar timestamp de config
CREATE OR REPLACE FUNCTION update_security_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_security_config_timestamp
BEFORE UPDATE ON security_config
FOR EACH ROW EXECUTE FUNCTION update_security_config_timestamp();

-- Limpiar sesiones expiradas automáticamente (función para llamar con pg_cron)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM active_sessions
    WHERE expires_at < NOW() OR (last_activity < NOW() - INTERVAL '24 hours' AND is_active = false);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- DATOS INICIALES
-- ========================================

-- Configuración por defecto (tenant_id = 1)
INSERT INTO security_config (
    tenant_id,
    max_login_attempts,
    lockout_duration_minutes,
    session_timeout_minutes,
    password_min_length,
    api_rate_limit,
    audit_retention_days,
    audit_level
) VALUES (
    1,
    5,
    15,
    60,
    8,
    100,
    90,
    'standard'
) ON CONFLICT (tenant_id) DO NOTHING;

-- ========================================
-- PARTICIONAMIENTO (Opcional para alto volumen)
-- ========================================

-- Nota: Para producción con alto volumen, considerar particionamiento por fecha
-- CREATE TABLE security_audit_logs_partitioned (
--     LIKE security_audit_logs INCLUDING ALL
-- ) PARTITION BY RANGE (timestamp);
--
-- CREATE TABLE security_audit_logs_2024_q4 PARTITION OF security_audit_logs_partitioned
--     FOR VALUES FROM ('2024-10-01') TO ('2025-01-01');

-- ========================================
-- COMENTARIOS
-- ========================================
COMMENT ON TABLE security_audit_logs IS 'Logs de auditoría de eventos de seguridad';
COMMENT ON TABLE security_config IS 'Configuración de seguridad por tenant';
COMMENT ON TABLE password_history IS 'Historial de contraseñas para evitar reutilización';
COMMENT ON TABLE active_sessions IS 'Sesiones activas de usuarios';
COMMENT ON TABLE blocked_ips IS 'IPs bloqueadas temporal o permanentemente';
COMMENT ON TABLE recovery_tokens IS 'Tokens de recuperación de contraseña y verificación';
COMMENT ON TABLE security_alerts IS 'Alertas de seguridad para monitoreo';

COMMENT ON COLUMN security_audit_logs.severity IS '0=DEBUG, 1=INFO, 2=WARNING, 3=ERROR, 4=CRITICAL';
COMMENT ON COLUMN security_config.audit_level IS 'minimal, standard, verbose';
COMMENT ON COLUMN security_alerts.status IS 'new, acknowledged, resolved, false_positive';

-- ========================================
-- FIN DE MIGRACIÓN
-- ========================================
