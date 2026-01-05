-- =====================================================
-- MIGRACIÓN: Code Freeze (Semana 36)
-- Congelamiento de Cambios y Estabilidad (FINAL)
-- Fecha: Enero 2026
-- Fase 5: Consolidación, Ética y Futuro
-- =====================================================
-- Tabla de code freeze
CREATE TABLE IF NOT EXISTS code_freezes (
    id SERIAL PRIMARY KEY,
    freeze_id VARCHAR(100) UNIQUE NOT NULL,
    activated_at TIMESTAMP NOT NULL,
    activated_by VARCHAR(100),
    allowed_changes TEXT [],
    blocked_changes TEXT [],
    estimated_duration VARCHAR(50),
    actual_end_date TIMESTAMP,
    status VARCHAR(30) DEFAULT 'active',
    -- active, lifted, extended
    notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_freeze_status ON code_freezes(status);
CREATE INDEX IF NOT EXISTS idx_freeze_date ON code_freezes(activated_at);
-- Tabla de excepciones de freeze
CREATE TABLE IF NOT EXISTS freeze_exceptions (
    id SERIAL PRIMARY KEY,
    exception_id VARCHAR(100) UNIQUE NOT NULL,
    freeze_id VARCHAR(100) REFERENCES code_freezes(freeze_id),
    requested_by VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    urgency VARCHAR(20) NOT NULL,
    -- critical, high, medium, low
    estimated_risk VARCHAR(20),
    required_approvals TEXT [],
    current_approvals JSONB,
    status VARCHAR(30) DEFAULT 'pending',
    -- pending, approved, denied, implemented
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    decided_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_exc_status ON freeze_exceptions(status);
CREATE INDEX IF NOT EXISTS idx_exc_urgency ON freeze_exceptions(urgency);
-- Tabla de bug tracking
CREATE TABLE IF NOT EXISTS bug_tracking (
    id SERIAL PRIMARY KEY,
    bug_id VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    priority VARCHAR(20) NOT NULL,
    -- critical, high, medium, low
    assignee VARCHAR(100),
    status VARCHAR(30) DEFAULT 'open',
    -- open, fixing, resolved, verified, closed
    resolution TEXT,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolution_time_minutes INTEGER
);
CREATE INDEX IF NOT EXISTS idx_bug_priority ON bug_tracking(priority);
CREATE INDEX IF NOT EXISTS idx_bug_status ON bug_tracking(status);
-- Tabla de bug fixes
CREATE TABLE IF NOT EXISTS bug_fixes (
    id SERIAL PRIMARY KEY,
    fix_id VARCHAR(100) UNIQUE NOT NULL,
    bug_id VARCHAR(100) REFERENCES bug_tracking(bug_id),
    description TEXT,
    files_changed TEXT [],
    tested_by VARCHAR(100),
    deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rollback_plan TEXT,
    status VARCHAR(30) DEFAULT 'deployed'
);
CREATE INDEX IF NOT EXISTS idx_fix_date ON bug_fixes(deployed_at);
-- Tabla de monitoreo intensivo
CREATE TABLE IF NOT EXISTS intensive_monitoring_logs (
    id SERIAL PRIMARY KEY,
    log_id VARCHAR(100) UNIQUE NOT NULL,
    log_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metrics JSONB NOT NULL,
    alerts JSONB,
    anomalies_detected TEXT [],
    on_call_team TEXT [],
    status VARCHAR(20) DEFAULT 'normal' -- normal, warning, critical
);
CREATE INDEX IF NOT EXISTS idx_monitor_date ON intensive_monitoring_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_monitor_status ON intensive_monitoring_logs(status);
-- Tabla de optimización de queries
CREATE TABLE IF NOT EXISTS query_optimizations (
    id SERIAL PRIMARY KEY,
    optimization_id VARCHAR(100) UNIQUE NOT NULL,
    query_pattern TEXT NOT NULL,
    avg_time_before INTEGER,
    avg_time_after INTEGER,
    improvement_percent DECIMAL(5, 2),
    suggestion TEXT,
    impact VARCHAR(20),
    -- high, medium, low
    status VARCHAR(30) DEFAULT 'identified',
    -- identified, in_progress, implemented, verified
    implemented_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_qo_status ON query_optimizations(status);
CREATE INDEX IF NOT EXISTS idx_qo_impact ON query_optimizations(impact);
-- Tabla de validación de consistencia
CREATE TABLE IF NOT EXISTS consistency_checks (
    id SERIAL PRIMARY KEY,
    check_id VARCHAR(100) UNIQUE NOT NULL,
    check_name VARCHAR(200) NOT NULL,
    check_type VARCHAR(50),
    -- referential, calculation, status, totals
    status VARCHAR(20) NOT NULL,
    -- passed, failed, warning
    details TEXT,
    issues_found INTEGER DEFAULT 0,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cc_status ON consistency_checks(status);
CREATE INDEX IF NOT EXISTS idx_cc_type ON consistency_checks(check_type);
-- Tabla de preparación de pico de carga
CREATE TABLE IF NOT EXISTS peak_load_preparations (
    id SERIAL PRIMARY KEY,
    prep_id VARCHAR(100) UNIQUE NOT NULL,
    expected_peak_date DATE,
    event_name VARCHAR(200),
    preparations JSONB NOT NULL,
    load_test_results JSONB,
    risk_mitigation TEXT [],
    status VARCHAR(30) DEFAULT 'planning',
    -- planning, ready, active, completed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_plp_date ON peak_load_preparations(expected_peak_date);
-- Tabla de umbrales de alertas
CREATE TABLE IF NOT EXISTS alert_thresholds (
    id SERIAL PRIMARY KEY,
    threshold_id VARCHAR(100) UNIQUE NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    current_threshold VARCHAR(50),
    recommended_threshold VARCHAR(50),
    adjusted BOOLEAN DEFAULT false,
    last_reviewed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_at_metric ON alert_thresholds(metric_name);
-- Tabla de auditorías de seguridad
CREATE TABLE IF NOT EXISTS final_security_audits (
    id SERIAL PRIMARY KEY,
    audit_id VARCHAR(100) UNIQUE NOT NULL,
    audit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    auditor VARCHAR(200),
    scope TEXT [],
    findings JSONB NOT NULL,
    compliance JSONB,
    overall_risk VARCHAR(20),
    -- critical, high, medium, low, minimal
    approved_for_production BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_fsa_date ON final_security_audits(audit_date);
CREATE INDEX IF NOT EXISTS idx_fsa_risk ON final_security_audits(overall_risk);
-- Tabla de feature flags
CREATE TABLE IF NOT EXISTS feature_flags (
    id SERIAL PRIMARY KEY,
    flag_name VARCHAR(100) UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT true,
    rollout_percentage INTEGER DEFAULT 100,
    fallback_behavior VARCHAR(200),
    last_toggled TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    toggled_by VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS idx_ff_enabled ON feature_flags(enabled);
-- Tabla de planes de contingencia
CREATE TABLE IF NOT EXISTS contingency_plans (
    id SERIAL PRIMARY KEY,
    plan_id VARCHAR(100) UNIQUE NOT NULL,
    critical_days DATE [],
    scenarios JSONB NOT NULL,
    contacts JSONB,
    runbooks TEXT [],
    last_tested DATE,
    status VARCHAR(30) DEFAULT 'draft',
    -- draft, reviewed, approved, active
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cp_status ON contingency_plans(status);
-- Tabla de reportes de estabilidad
CREATE TABLE IF NOT EXISTS stability_reports (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    summary JSONB NOT NULL,
    key_metrics JSONB,
    signoff JSONB,
    overall_health VARCHAR(30) -- excellent, good, fair, poor, critical
);
CREATE INDEX IF NOT EXISTS idx_sr_cycle ON stability_reports(cycle_year);
CREATE INDEX IF NOT EXISTS idx_sr_health ON stability_reports(overall_health);
-- Insertar feature flags por defecto
INSERT INTO feature_flags (
        flag_name,
        enabled,
        rollout_percentage,
        fallback_behavior
    )
VALUES ('ai_tutor', true, 100, 'static_content'),
    ('dropout_prediction', true, 100, 'disable'),
    ('sentiment_analysis', true, 100, 'disable'),
    ('real_time_analytics', true, 100, 'cached_data'),
    ('pdf_export', true, 100, 'email_later'),
    ('new_dashboard', true, 100, 'legacy_dashboard') ON CONFLICT (flag_name) DO NOTHING;
-- Vista: Bugs críticos abiertos
CREATE OR REPLACE VIEW v_critical_bugs AS
SELECT bug_id,
    title,
    priority,
    assignee,
    status,
    reported_at
FROM bug_tracking
WHERE priority IN ('critical', 'high')
    AND status NOT IN ('resolved', 'closed')
ORDER BY CASE
        priority
        WHEN 'critical' THEN 1
        ELSE 2
    END,
    reported_at;
-- Vista: Estado de Feature Flags
CREATE OR REPLACE VIEW v_feature_flags_status AS
SELECT flag_name,
    enabled,
    rollout_percentage,
    fallback_behavior,
    last_toggled
FROM feature_flags
ORDER BY flag_name;
-- Comentarios
COMMENT ON TABLE code_freezes IS 'Registro de code freezes';
COMMENT ON TABLE freeze_exceptions IS 'Excepciones solicitadas durante freeze';
COMMENT ON TABLE bug_tracking IS 'Tracking de bugs';
COMMENT ON TABLE bug_fixes IS 'Registro de fixes aplicados';
COMMENT ON TABLE intensive_monitoring_logs IS 'Logs de monitoreo intensivo';
COMMENT ON TABLE query_optimizations IS 'Optimizaciones de queries';
COMMENT ON TABLE consistency_checks IS 'Validaciones de consistencia';
COMMENT ON TABLE peak_load_preparations IS 'Preparación para picos de carga';
COMMENT ON TABLE alert_thresholds IS 'Umbrales de alertas';
COMMENT ON TABLE final_security_audits IS 'Auditorías finales de seguridad';
COMMENT ON TABLE feature_flags IS 'Feature flags del sistema';
COMMENT ON TABLE contingency_plans IS 'Planes de contingencia';
COMMENT ON TABLE stability_reports IS 'Reportes de estabilidad';