-- MIGRACION Year 2 Completion (Semana 44)
-- Preparacion para Cierre de Año 2
-- Enero 2026
-- Tabla de preparacion de cierre
CREATE TABLE IF NOT EXISTS cycle_closing_preparation (
    id SERIAL PRIMARY KEY,
    closing_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    status VARCHAR(30) DEFAULT 'in_progress',
    checklist JSONB NOT NULL DEFAULT '{}',
    overall_progress INTEGER DEFAULT 0,
    target_date DATE,
    prepared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ccp_cycle ON cycle_closing_preparation(cycle_year);
-- Tabla de estado de documentacion
CREATE TABLE IF NOT EXISTS documentation_status (
    id SERIAL PRIMARY KEY,
    status_id VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    complete_percent INTEGER DEFAULT 0,
    pages INTEGER DEFAULT 0,
    pending_items TEXT [],
    reviewed_by VARCHAR(200),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ds_category ON documentation_status(category);
-- Tabla de rondas de testing
CREATE TABLE IF NOT EXISTS final_testing_rounds (
    id SERIAL PRIMARY KEY,
    testing_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(30) DEFAULT 'pending',
    test_suites JSONB NOT NULL DEFAULT '[]',
    overall_pass DECIMAL(5, 2),
    critical_issues INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);
-- Tabla de reportes de testing
CREATE TABLE IF NOT EXISTS testing_reports (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(100) UNIQUE NOT NULL,
    summary JSONB NOT NULL DEFAULT '{}',
    coverage JSONB,
    quality JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabla de handover de capacitacion
CREATE TABLE IF NOT EXISTS training_handover (
    id SERIAL PRIMARY KEY,
    handover_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(30) DEFAULT 'pending',
    materials JSONB NOT NULL DEFAULT '[]',
    sessions JSONB,
    feedback JSONB,
    prepared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabla de metricas de exito
CREATE TABLE IF NOT EXISTS success_metrics_compilation (
    id SERIAL PRIMARY KEY,
    compilation_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    metrics JSONB NOT NULL DEFAULT '{}',
    comparison JSONB,
    compiled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_smc_cycle ON success_metrics_compilation(cycle_year);
-- Tabla de roadmaps
CREATE TABLE IF NOT EXISTS year_roadmaps_draft (
    id SERIAL PRIMARY KEY,
    roadmap_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    status VARCHAR(30) DEFAULT 'draft',
    vision TEXT,
    themes JSONB,
    quarters JSONB,
    budget JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_yrd_cycle ON year_roadmaps_draft(cycle_year);
-- Tabla de presentaciones a stakeholders
CREATE TABLE IF NOT EXISTS stakeholder_presentations (
    id SERIAL PRIMARY KEY,
    presentation_id VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(300) NOT NULL,
    status VARCHAR(30) DEFAULT 'draft',
    audience TEXT [],
    sections JSONB,
    total_slides INTEGER,
    duration VARCHAR(20),
    scheduled_date DATE,
    prepared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabla de preparacion de auditorias
CREATE TABLE IF NOT EXISTS audit_preparation (
    id SERIAL PRIMARY KEY,
    audit_id VARCHAR(100) UNIQUE NOT NULL,
    audit_type VARCHAR(100) NOT NULL,
    status VARCHAR(30) DEFAULT 'preparing',
    areas JSONB NOT NULL DEFAULT '[]',
    documents_required INTEGER DEFAULT 0,
    documents_prepared INTEGER DEFAULT 0,
    preparation_progress INTEGER DEFAULT 0,
    scheduled_date DATE
);
-- Tabla de archivado
CREATE TABLE IF NOT EXISTS archive_preparation (
    id SERIAL PRIMARY KEY,
    archive_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending',
    components JSONB NOT NULL DEFAULT '[]',
    destinations TEXT [],
    retention VARCHAR(30),
    encryption VARCHAR(30),
    prepared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ap_cycle ON archive_preparation(cycle_year);
-- Tabla de celebraciones
CREATE TABLE IF NOT EXISTS celebration_events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(300) NOT NULL,
    event_date DATE,
    recognition JSONB,
    activities TEXT [],
    attendees INTEGER,
    planned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Vista de progreso de cierre
CREATE OR REPLACE VIEW v_closing_progress AS
SELECT cycle_year,
    status,
    overall_progress,
    target_date
FROM cycle_closing_preparation
ORDER BY prepared_at DESC;
-- Vista de documentacion pendiente
CREATE OR REPLACE VIEW v_pending_documentation AS
SELECT category,
    complete_percent,
    pending_items
FROM documentation_status
WHERE complete_percent < 100;
-- Comentarios
COMMENT ON TABLE cycle_closing_preparation IS 'Preparacion de cierre de ciclo';
COMMENT ON TABLE documentation_status IS 'Estado de documentacion';
COMMENT ON TABLE final_testing_rounds IS 'Rondas finales de testing';
COMMENT ON TABLE testing_reports IS 'Reportes de testing';
COMMENT ON TABLE training_handover IS 'Handover de capacitacion';
COMMENT ON TABLE success_metrics_compilation IS 'Compilacion de metricas de exito';
COMMENT ON TABLE year_roadmaps_draft IS 'Borradores de roadmaps anuales';
COMMENT ON TABLE stakeholder_presentations IS 'Presentaciones a stakeholders';
COMMENT ON TABLE audit_preparation IS 'Preparacion de auditorias';
COMMENT ON TABLE archive_preparation IS 'Preparacion de archivado';
COMMENT ON TABLE celebration_events IS 'Eventos de celebracion';