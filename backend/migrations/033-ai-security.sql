-- =====================================================
-- MIGRACIÓN: AI Security (Semana 24)
-- Seguridad de IA
-- Fecha: Enero 2026
-- =====================================================
-- Tabla de incidentes de seguridad
CREATE TABLE IF NOT EXISTS security_incidents (
    id SERIAL PRIMARY KEY,
    incident_id VARCHAR(100) UNIQUE,
    incident_type VARCHAR(50) NOT NULL,
    -- prompt_injection, pii_detection, abuse, rate_limit, auth_failure
    severity VARCHAR(20) NOT NULL,
    -- critical, high, medium, low
    user_id INTEGER,
    ip_address VARCHAR(45),
    endpoint VARCHAR(255),
    details JSONB,
    status VARCHAR(30) DEFAULT 'open',
    -- open, investigating, resolved, false_positive
    resolved_by VARCHAR(100),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_incident_type ON security_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_incident_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incident_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_incident_date ON security_incidents(created_at);
CREATE INDEX IF NOT EXISTS idx_incident_user ON security_incidents(user_id);
-- Tabla de patrones de prompt injection
CREATE TABLE IF NOT EXISTS prompt_injection_patterns (
    id SERIAL PRIMARY KEY,
    pattern_name VARCHAR(100) UNIQUE NOT NULL,
    regex_pattern TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pattern_active ON prompt_injection_patterns(is_active);
-- Tabla de detecciones de PII
CREATE TABLE IF NOT EXISTS pii_detections (
    id SERIAL PRIMARY KEY,
    source_type VARCHAR(50) NOT NULL,
    -- input, output, log
    pii_type VARCHAR(50) NOT NULL,
    -- email, phone, curp, rfc, address
    context VARCHAR(255),
    action_taken VARCHAR(30) DEFAULT 'redacted',
    -- redacted, blocked, logged
    user_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pii_type ON pii_detections(pii_type);
CREATE INDEX IF NOT EXISTS idx_pii_date ON pii_detections(created_at);
-- Tabla de resultados de Red Team
CREATE TABLE IF NOT EXISTS red_team_results (
    id SERIAL PRIMARY KEY,
    test_run_id VARCHAR(100) UNIQUE NOT NULL,
    target_endpoint VARCHAR(255),
    test_type VARCHAR(50),
    total_tests INTEGER,
    passed INTEGER,
    failed INTEGER,
    results JSONB,
    overall_status VARCHAR(30),
    run_by VARCHAR(100),
    run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_redteam_date ON red_team_results(run_at);
CREATE INDEX IF NOT EXISTS idx_redteam_status ON red_team_results(overall_status);
-- Tabla de auditoría de dependencias
CREATE TABLE IF NOT EXISTS dependency_audits (
    id SERIAL PRIMARY KEY,
    audit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_dependencies INTEGER,
    secure INTEGER,
    warnings INTEGER,
    critical INTEGER,
    dependencies JSONB,
    recommendations TEXT []
);
CREATE INDEX IF NOT EXISTS idx_audit_date ON dependency_audits(audit_date);
-- Tabla de reglas de control de acceso
CREATE TABLE IF NOT EXISTS access_control_rules (
    id SERIAL PRIMARY KEY,
    feature_name VARCHAR(100) UNIQUE NOT NULL,
    allowed_roles TEXT [] NOT NULL,
    require_mfa BOOLEAN DEFAULT false,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_acr_feature ON access_control_rules(feature_name);
-- Tabla de logs de rate limiting
CREATE TABLE IF NOT EXISTS rate_limit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    requests_count INTEGER,
    limit_value INTEGER,
    exceeded BOOLEAN DEFAULT false,
    penalty_applied BOOLEAN DEFAULT false,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rl_user ON rate_limit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_rl_exceeded ON rate_limit_logs(exceeded);
CREATE INDEX IF NOT EXISTS idx_rl_date ON rate_limit_logs(logged_at);
-- Tabla de detección de abuso
CREATE TABLE IF NOT EXISTS abuse_detections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    pattern_type VARCHAR(50) NOT NULL,
    -- rapid_requests, off_hours, repeated_failures, data_exfiltration
    risk_score INTEGER,
    details JSONB,
    action_taken VARCHAR(50),
    -- none, warning, throttle, block
    reviewed BOOLEAN DEFAULT false,
    reviewed_by VARCHAR(100),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_abuse_user ON abuse_detections(user_id);
CREATE INDEX IF NOT EXISTS idx_abuse_pattern ON abuse_detections(pattern_type);
CREATE INDEX IF NOT EXISTS idx_abuse_date ON abuse_detections(detected_at);
-- Tabla de configuración de alertas
CREATE TABLE IF NOT EXISTS security_alert_config (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) UNIQUE NOT NULL,
    severity VARCHAR(20) NOT NULL,
    notify_channels TEXT [] DEFAULT '{"log"}',
    is_active BOOLEAN DEFAULT true,
    throttle_minutes INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabla de resultados de pentest
CREATE TABLE IF NOT EXISTS pentest_results (
    id SERIAL PRIMARY KEY,
    scan_id VARCHAR(100) UNIQUE NOT NULL,
    target_endpoint VARCHAR(255),
    tests JSONB NOT NULL,
    total_tests INTEGER,
    passed INTEGER,
    failed INTEGER,
    overall_status VARCHAR(30),
    scanned_by VARCHAR(100),
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pentest_date ON pentest_results(scanned_at);
CREATE INDEX IF NOT EXISTS idx_pentest_status ON pentest_results(overall_status);
-- Insertar patrones de prompt injection
INSERT INTO prompt_injection_patterns (
        pattern_name,
        regex_pattern,
        severity,
        description
    )
VALUES (
        'instruction_override',
        'ignore (previous|all|above) instructions',
        'critical',
        'Intento de sobrescribir instrucciones'
    ),
    (
        'role_override',
        'you are now',
        'high',
        'Intento de cambiar rol del modelo'
    ),
    (
        'system_access',
        'system prompt',
        'high',
        'Intento de acceder a prompt del sistema'
    ),
    (
        'jailbreak',
        'jailbreak',
        'critical',
        'Intento de jailbreak explícito'
    ),
    (
        'DAN_attack',
        'DAN|do anything now',
        'critical',
        'Ataque tipo DAN conocido'
    ),
    (
        'token_injection',
        '\\[INST\\]|<\\|system\\|>',
        'critical',
        'Inyección de tokens especiales'
    ) ON CONFLICT (pattern_name) DO NOTHING;
-- Insertar reglas de control de acceso
INSERT INTO access_control_rules (
        feature_name,
        allowed_roles,
        require_mfa,
        description
    )
VALUES (
        'dropout_prediction',
        '{"admin", "teacher", "counselor"}',
        false,
        'Predicción de deserción escolar'
    ),
    (
        'sentiment_analysis',
        '{"admin", "counselor"}',
        false,
        'Análisis de sentimiento institucional'
    ),
    (
        'student_pii',
        '{"admin"}',
        true,
        'Acceso a datos personales de estudiantes'
    ),
    (
        'model_management',
        '{"admin", "ml_engineer"}',
        true,
        'Gestión de modelos ML'
    ),
    (
        'security_audit',
        '{"admin", "security_officer"}',
        true,
        'Auditorías de seguridad'
    ) ON CONFLICT (feature_name) DO NOTHING;
-- Insertar configuración de alertas
INSERT INTO security_alert_config (alert_type, severity, notify_channels)
VALUES (
        'prompt_injection',
        'critical',
        '{"slack", "email"}'
    ),
    ('pii_detection', 'high', '{"email"}'),
    ('rate_limit_exceeded', 'medium', '{"slack"}'),
    ('abuse_pattern', 'high', '{"slack", "email"}'),
    ('authentication_failure', 'medium', '{"log"}') ON CONFLICT (alert_type) DO NOTHING;
-- Vista: Incidentes recientes por severidad
CREATE OR REPLACE VIEW v_recent_incidents_by_severity AS
SELECT severity,
    COUNT(*) as count,
    MAX(created_at) as last_incident
FROM security_incidents
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY severity
ORDER BY CASE
        severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
    END;
-- Vista: Usuarios con más incidentes
CREATE OR REPLACE VIEW v_users_most_incidents AS
SELECT user_id,
    COUNT(*) as incident_count,
    COUNT(*) FILTER (
        WHERE severity IN ('critical', 'high')
    ) as severe_incidents,
    MAX(created_at) as last_incident
FROM security_incidents
WHERE user_id IS NOT NULL
    AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id
HAVING COUNT(*) > 3
ORDER BY incident_count DESC;
-- Comentarios
COMMENT ON TABLE security_incidents IS 'Registro de incidentes de seguridad de IA';
COMMENT ON TABLE prompt_injection_patterns IS 'Patrones de detección de prompt injection';
COMMENT ON TABLE pii_detections IS 'Registro de detecciones de PII';
COMMENT ON TABLE red_team_results IS 'Resultados de pruebas de Red Team';
COMMENT ON TABLE dependency_audits IS 'Auditorías de dependencias ML';
COMMENT ON TABLE access_control_rules IS 'Reglas de control de acceso granular';
COMMENT ON TABLE rate_limit_logs IS 'Logs de rate limiting';
COMMENT ON TABLE abuse_detections IS 'Detecciones de uso abusivo';
COMMENT ON TABLE security_alert_config IS 'Configuración de alertas de seguridad';
COMMENT ON TABLE pentest_results IS 'Resultados de pentesting';