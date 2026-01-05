-- =====================================================
-- MIGRACIÓN: Post-Mortem (Semana 38)
-- Análisis Post-Mortem del Año
-- Fecha: Enero 2026
-- Fase 6: Cierre, Análisis y Planificación Futura
-- =====================================================
-- Tabla de revisión de incidentes anuales
CREATE TABLE IF NOT EXISTS annual_incident_reviews (
    id SERIAL PRIMARY KEY,
    review_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    reviewed_at TIMESTAMP NOT NULL,
    total_incidents INTEGER,
    critical INTEGER DEFAULT 0,
    high INTEGER DEFAULT 0,
    medium INTEGER DEFAULT 0,
    low INTEGER DEFAULT 0,
    categorization JSONB,
    top_recurring JSONB,
    resolution_metrics JSONB
);
CREATE INDEX IF NOT EXISTS idx_air_cycle ON annual_incident_reviews(cycle_year);
-- Tabla de análisis de downtime
CREATE TABLE IF NOT EXISTS downtime_analysis (
    id SERIAL PRIMARY KEY,
    analysis_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    total_uptime DECIMAL(6, 4),
    total_downtime_minutes INTEGER,
    by_month JSONB,
    major_outages JSONB,
    comparison JSONB,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_da_cycle ON downtime_analysis(cycle_year);
-- Tabla de evaluación de modelos
CREATE TABLE IF NOT EXISTS model_accuracy_evaluations (
    id SERIAL PRIMARY KEY,
    evaluation_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    predicted_accuracy DECIMAL(4, 3),
    actual_accuracy DECIMAL(4, 3),
    delta VARCHAR(20),
    notes TEXT,
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mae_cycle ON model_accuracy_evaluations(cycle_year);
CREATE INDEX IF NOT EXISTS idx_mae_model ON model_accuracy_evaluations(model_name);
-- Tabla de ahorro por automatización
CREATE TABLE IF NOT EXISTS automation_savings (
    id SERIAL PRIMARY KEY,
    calculation_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    category VARCHAR(100) NOT NULL,
    manual_hours INTEGER,
    automated_hours INTEGER,
    hours_saved INTEGER,
    cost_saved DECIMAL(12, 2),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_as_cycle ON automation_savings(cycle_year);
-- Tabla de errores de arquitectura
CREATE TABLE IF NOT EXISTS architecture_errors (
    id SERIAL PRIMARY KEY,
    error_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    error_description TEXT NOT NULL,
    impact VARCHAR(20),
    discovered_at DATE,
    resolution TEXT,
    status VARCHAR(30),
    lessons_learned TEXT
);
CREATE INDEX IF NOT EXISTS idx_ae_cycle ON architecture_errors(cycle_year);
CREATE INDEX IF NOT EXISTS idx_ae_status ON architecture_errors(status);
-- Tabla de análisis de seguridad anual
CREATE TABLE IF NOT EXISTS annual_security_analysis (
    id SERIAL PRIMARY KEY,
    analysis_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    vulnerabilities JSONB,
    audit_results JSONB,
    incidents JSONB,
    compliance JSONB,
    improvements TEXT [],
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_asa_cycle ON annual_security_analysis(cycle_year);
-- Tabla de evaluación de proveedores
CREATE TABLE IF NOT EXISTS vendor_evaluations (
    id SERIAL PRIMARY KEY,
    evaluation_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    vendor_name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    performance_score DECIMAL(3, 2),
    reliability_score DECIMAL(3, 2),
    cost_score DECIMAL(3, 2),
    support_score DECIMAL(3, 2),
    overall_score DECIMAL(3, 2),
    recommendation VARCHAR(50),
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ve_cycle ON vendor_evaluations(cycle_year);
CREATE INDEX IF NOT EXISTS idx_ve_vendor ON vendor_evaluations(vendor_name);
-- Tabla de cumplimiento de SLAs
CREATE TABLE IF NOT EXISTS sla_compliance_reviews (
    id SERIAL PRIMARY KEY,
    review_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    sla_name VARCHAR(100) NOT NULL,
    target VARCHAR(50),
    achieved VARCHAR(100),
    compliant BOOLEAN,
    months_met INTEGER,
    months_breached INTEGER,
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_scr_cycle ON sla_compliance_reviews(cycle_year);
-- Tabla de lecciones aprendidas
CREATE TABLE IF NOT EXISTS lessons_learned (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    category VARCHAR(50),
    -- technical, process, team
    lesson TEXT NOT NULL,
    priority VARCHAR(20),
    documented_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ll_cycle ON lessons_learned(cycle_year);
CREATE INDEX IF NOT EXISTS idx_ll_category ON lessons_learned(category);
-- Tabla de reportes técnicos anuales
CREATE TABLE IF NOT EXISTS annual_technical_reports (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    generated_at TIMESTAMP NOT NULL,
    executive_summary JSONB NOT NULL,
    recommendations TEXT [],
    signoff JSONB,
    status VARCHAR(30) DEFAULT 'draft'
);
CREATE INDEX IF NOT EXISTS idx_atr_cycle ON annual_technical_reports(cycle_year);
-- Vista: Resumen de post-mortem por ciclo
CREATE OR REPLACE VIEW v_post_mortem_summary AS
SELECT air.cycle_year,
    air.total_incidents,
    air.critical as critical_incidents,
    da.total_uptime,
    da.total_downtime_minutes
FROM annual_incident_reviews air
    LEFT JOIN downtime_analysis da ON air.cycle_year = da.cycle_year;
-- Vista: Ahorro total por ciclo
CREATE OR REPLACE VIEW v_annual_savings AS
SELECT cycle_year,
    SUM(hours_saved) as total_hours_saved,
    SUM(cost_saved) as total_cost_saved
FROM automation_savings
GROUP BY cycle_year;
-- Comentarios
COMMENT ON TABLE annual_incident_reviews IS 'Revisión anual de incidentes';
COMMENT ON TABLE downtime_analysis IS 'Análisis de downtime';
COMMENT ON TABLE model_accuracy_evaluations IS 'Evaluación de precisión de modelos';
COMMENT ON TABLE automation_savings IS 'Ahorro por automatización';
COMMENT ON TABLE architecture_errors IS 'Errores de arquitectura identificados';
COMMENT ON TABLE annual_security_analysis IS 'Análisis anual de seguridad';
COMMENT ON TABLE vendor_evaluations IS 'Evaluaciones de proveedores';
COMMENT ON TABLE sla_compliance_reviews IS 'Revisiones de cumplimiento de SLAs';
COMMENT ON TABLE lessons_learned IS 'Lecciones aprendidas';
COMMENT ON TABLE annual_technical_reports IS 'Reportes técnicos anuales';