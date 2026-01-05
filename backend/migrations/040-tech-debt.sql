-- =====================================================
-- MIGRACIÓN: Tech Debt (Semana 31)
-- Mantenimiento y Deuda Técnica
-- Fecha: Enero 2026
-- Fase 5: Consolidación, Ética y Futuro
-- =====================================================
-- Tabla de análisis de calidad de código
CREATE TABLE IF NOT EXISTS code_quality_scans (
    id SERIAL PRIMARY KEY,
    scan_id VARCHAR(100) UNIQUE NOT NULL,
    scan_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    overall_score INTEGER,
    complexity_score INTEGER,
    duplication_score INTEGER,
    maintainability_score INTEGER,
    reliability_score INTEGER,
    security_score INTEGER,
    categories JSONB NOT NULL,
    recommendations TEXT [],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_quality_date ON code_quality_scans(scan_date);
CREATE INDEX IF NOT EXISTS idx_quality_score ON code_quality_scans(overall_score);
-- Tabla de dependencias
CREATE TABLE IF NOT EXISTS dependency_scans (
    id SERIAL PRIMARY KEY,
    scan_id VARCHAR(100) UNIQUE NOT NULL,
    scan_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_dependencies INTEGER,
    direct_dependencies INTEGER,
    outdated_count INTEGER,
    deprecated_count INTEGER,
    vulnerable_count INTEGER,
    outdated_packages JSONB,
    deprecated_packages JSONB,
    vulnerabilities JSONB,
    recommendations TEXT [],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dep_date ON dependency_scans(scan_date);
CREATE INDEX IF NOT EXISTS idx_dep_vuln ON dependency_scans(vulnerable_count);
-- Tabla de cobertura de tests
CREATE TABLE IF NOT EXISTS test_coverage_scans (
    id SERIAL PRIMARY KEY,
    scan_id VARCHAR(100) UNIQUE NOT NULL,
    scan_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    statements_coverage DECIMAL(5, 2),
    branches_coverage DECIMAL(5, 2),
    functions_coverage DECIMAL(5, 2),
    lines_coverage DECIMAL(5, 2),
    by_module JSONB,
    untested_files JSONB,
    test_metrics JSONB,
    recommendations TEXT [],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_coverage_date ON test_coverage_scans(scan_date);
CREATE INDEX IF NOT EXISTS idx_coverage_lines ON test_coverage_scans(lines_coverage);
-- Tabla de TODOs y FIXMEs
CREATE TABLE IF NOT EXISTS todo_items (
    id SERIAL PRIMARY KEY,
    item_id VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL,
    -- TODO, FIXME, HACK, XXX
    file_path VARCHAR(500) NOT NULL,
    line_number INTEGER,
    text TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    -- critical, high, medium, low
    category VARCHAR(50),
    -- security, performance, refactoring, feature, documentation
    age_days INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'open',
    -- open, in_progress, resolved, ignored
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_todo_type ON todo_items(type);
CREATE INDEX IF NOT EXISTS idx_todo_priority ON todo_items(priority);
CREATE INDEX IF NOT EXISTS idx_todo_status ON todo_items(status);
CREATE INDEX IF NOT EXISTS idx_todo_category ON todo_items(category);
-- Tabla de análisis de Docker
CREATE TABLE IF NOT EXISTS docker_scans (
    id SERIAL PRIMARY KEY,
    scan_id VARCHAR(100) UNIQUE NOT NULL,
    scan_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    image_name VARCHAR(200) NOT NULL,
    image_tag VARCHAR(100),
    image_size VARCHAR(50),
    layers_count INTEGER,
    base_image VARCHAR(200),
    vulnerabilities JSONB,
    optimizations TEXT [],
    potential_size_reduction VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_docker_date ON docker_scans(scan_date);
CREATE INDEX IF NOT EXISTS idx_docker_image ON docker_scans(image_name);
-- Tabla de análisis de logs
CREATE TABLE IF NOT EXISTS log_analysis (
    id SERIAL PRIMARY KEY,
    analysis_id VARCHAR(100) UNIQUE NOT NULL,
    period VARCHAR(20) NOT NULL,
    analysis_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_logs INTEGER,
    error_count INTEGER,
    warning_count INTEGER,
    info_count INTEGER,
    error_trend JSONB,
    top_errors JSONB,
    top_warnings JSONB,
    recommendations TEXT [],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_log_date ON log_analysis(analysis_date);
CREATE INDEX IF NOT EXISTS idx_log_errors ON log_analysis(error_count);
-- Tabla de health checks del sistema
CREATE TABLE IF NOT EXISTS system_health_checks (
    id SERIAL PRIMARY KEY,
    check_id VARCHAR(100) UNIQUE NOT NULL,
    check_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    overall_status VARCHAR(30),
    -- healthy, degraded, unhealthy
    overall_score INTEGER,
    components JSONB NOT NULL,
    alerts JSONB,
    recommendations TEXT [],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_health_date ON system_health_checks(check_date);
CREATE INDEX IF NOT EXISTS idx_health_status ON system_health_checks(overall_status);
-- Tabla de reportes de deuda técnica
CREATE TABLE IF NOT EXISTS tech_debt_reports (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(100) UNIQUE NOT NULL,
    report_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    overall_debt_score INTEGER,
    overall_status VARCHAR(30),
    -- healthy, needs_attention, critical
    sections JSONB NOT NULL,
    prioritized_actions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_debt_date ON tech_debt_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_debt_status ON tech_debt_reports(overall_status);
-- Vista: Tendencia de calidad de código
CREATE OR REPLACE VIEW v_code_quality_trend AS
SELECT DATE_TRUNC('week', scan_date)::DATE as week,
    AVG(overall_score) as avg_score,
    AVG(complexity_score) as avg_complexity,
    AVG(security_score) as avg_security
FROM code_quality_scans
WHERE scan_date >= CURRENT_DATE - INTERVAL '12 weeks'
GROUP BY DATE_TRUNC('week', scan_date)
ORDER BY week DESC;
-- Vista: TODOs abiertos por prioridad
CREATE OR REPLACE VIEW v_open_todos_by_priority AS
SELECT priority,
    type,
    COUNT(*) as count,
    AVG(age_days)::INTEGER as avg_age_days
FROM todo_items
WHERE status = 'open'
GROUP BY priority,
    type
ORDER BY CASE
        priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
    END;
-- Vista: Último health check
CREATE OR REPLACE VIEW v_latest_health_check AS
SELECT check_date,
    overall_status,
    overall_score,
    components
FROM system_health_checks
ORDER BY check_date DESC
LIMIT 1;
-- Comentarios
COMMENT ON TABLE code_quality_scans IS 'Escaneos de calidad de código';
COMMENT ON TABLE dependency_scans IS 'Escaneos de dependencias';
COMMENT ON TABLE test_coverage_scans IS 'Escaneos de cobertura de tests';
COMMENT ON TABLE todo_items IS 'TODOs, FIXMEs y HACKs del código';
COMMENT ON TABLE docker_scans IS 'Análisis de imágenes Docker';
COMMENT ON TABLE log_analysis IS 'Análisis de logs';
COMMENT ON TABLE system_health_checks IS 'Health checks del sistema';
COMMENT ON TABLE tech_debt_reports IS 'Reportes consolidados de deuda técnica';