-- MIGRACION Year 2 Security (Semana 46)
-- Seguridad Avanzada
CREATE TABLE IF NOT EXISTS security_audits (
    id SERIAL PRIMARY KEY,
    audit_id VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    score INTEGER,
    issues_found INTEGER DEFAULT 0,
    critical_issues INTEGER DEFAULT 0,
    status VARCHAR(30) DEFAULT 'pending',
    recommendations TEXT [],
    audit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS penetration_tests (
    id SERIAL PRIMARY KEY,
    test_id VARCHAR(100) UNIQUE NOT NULL,
    scope TEXT [],
    findings JSONB,
    status VARCHAR(30) DEFAULT 'pending',
    test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS threat_protection_configs (
    id SERIAL PRIMARY KEY,
    config_id VARCHAR(100) UNIQUE NOT NULL,
    feature VARCHAR(100) NOT NULL,
    provider VARCHAR(100),
    status VARCHAR(30) DEFAULT 'inactive',
    details JSONB,
    configured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS compliance_status (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(100) UNIQUE NOT NULL,
    standard VARCHAR(50) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending',
    score INTEGER,
    last_audit DATE,
    next_audit DATE
);
CREATE INDEX IF NOT EXISTS idx_sa_category ON security_audits(category);
CREATE INDEX IF NOT EXISTS idx_tpc_feature ON threat_protection_configs(feature);
CREATE INDEX IF NOT EXISTS idx_cs_standard ON compliance_status(standard);
COMMENT ON TABLE security_audits IS 'Auditorias de seguridad';
COMMENT ON TABLE penetration_tests IS 'Pruebas de penetracion';
COMMENT ON TABLE threat_protection_configs IS 'Configuraciones de proteccion contra amenazas';
COMMENT ON TABLE compliance_status IS 'Estado de cumplimiento normativo';