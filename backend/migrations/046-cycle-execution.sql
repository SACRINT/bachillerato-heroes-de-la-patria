-- =====================================================
-- MIGRACIÓN: Cycle Execution (Semana 37)
-- Ejecución de Cierre de Ciclo Escolar
-- Fecha: Enero 2026
-- Fase 6: Cierre, Análisis y Planificación Futura
-- =====================================================
-- Tabla de soporte de exámenes
CREATE TABLE IF NOT EXISTS exam_support_activations (
    id SERIAL PRIMARY KEY,
    support_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    activated_at TIMESTAMP NOT NULL,
    deactivated_at TIMESTAMP,
    status VARCHAR(30) DEFAULT 'active',
    mode VARCHAR(50) DEFAULT 'high_availability',
    features JSONB,
    support_team JSONB,
    exam_period JSONB,
    notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_esa_cycle ON exam_support_activations(cycle_year);
CREATE INDEX IF NOT EXISTS idx_esa_status ON exam_support_activations(status);
-- Tabla de generación de reportes masivos
CREATE TABLE IF NOT EXISTS mass_report_jobs (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    reports JSONB NOT NULL,
    total_documents INTEGER,
    processing_time VARCHAR(50),
    storage_used VARCHAR(50),
    status VARCHAR(30) DEFAULT 'in_progress'
);
CREATE INDEX IF NOT EXISTS idx_mrj_cycle ON mass_report_jobs(cycle_year);
CREATE INDEX IF NOT EXISTS idx_mrj_status ON mass_report_jobs(status);
-- Tabla de procesamiento de documentos oficiales
CREATE TABLE IF NOT EXISTS official_document_processing (
    id SERIAL PRIMARY KEY,
    process_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    processed_at TIMESTAMP NOT NULL,
    actas_generated INTEGER DEFAULT 0,
    certificates_generated INTEGER DEFAULT 0,
    constancias_generated INTEGER DEFAULT 0,
    folio_start VARCHAR(50),
    folio_end VARCHAR(50),
    digital_signatures JSONB,
    archive_location VARCHAR(500),
    status VARCHAR(30) DEFAULT 'completed'
);
CREATE INDEX IF NOT EXISTS idx_odp_cycle ON official_document_processing(cycle_year);
-- Tabla de análisis predictivo final
CREATE TABLE IF NOT EXISTS final_predictive_analysis (
    id SERIAL PRIMARY KEY,
    analysis_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    executed_at TIMESTAMP NOT NULL,
    at_risk_count INTEGER,
    at_risk_students JSONB,
    expected_graduates INTEGER,
    expected_holdbacks INTEGER,
    model_performance JSONB,
    recommendations TEXT []
);
CREATE INDEX IF NOT EXISTS idx_fpa_cycle ON final_predictive_analysis(cycle_year);
-- Tabla de ejecución de pipelines de cierre
CREATE TABLE IF NOT EXISTS closure_pipeline_executions (
    id SERIAL PRIMARY KEY,
    pipeline_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    executed_at TIMESTAMP NOT NULL,
    pipelines JSONB NOT NULL,
    data_validation JSONB,
    status VARCHAR(30) DEFAULT 'completed'
);
CREATE INDEX IF NOT EXISTS idx_cpe_cycle ON closure_pipeline_executions(cycle_year);
-- Tabla de promoción automática
CREATE TABLE IF NOT EXISTS automatic_promotions (
    id SERIAL PRIMARY KEY,
    promotion_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    executed_at TIMESTAMP NOT NULL,
    total_students INTEGER,
    promoted INTEGER,
    graduated INTEGER,
    retained INTEGER,
    transferred INTEGER,
    withdrawn INTEGER,
    by_grade JSONB,
    validation_rules TEXT [],
    exceptions INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ap_cycle ON automatic_promotions(cycle_year);
-- Tabla de insights anuales
CREATE TABLE IF NOT EXISTS annual_student_insights (
    id SERIAL PRIMARY KEY,
    insights_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    generated_at TIMESTAMP NOT NULL,
    total_students INTEGER,
    insights_generated INTEGER,
    aggregate_stats JSONB,
    status VARCHAR(30) DEFAULT 'completed'
);
CREATE INDEX IF NOT EXISTS idx_asi_cycle ON annual_student_insights(cycle_year);
-- Tabla de insights individuales por estudiante
CREATE TABLE IF NOT EXISTS student_annual_insights (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    academic_progress JSONB,
    strengths TEXT [],
    areas_to_improve TEXT [],
    ai_recommendations TEXT [],
    predicted_success DECIMAL(4, 3),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, cycle_year)
);
CREATE INDEX IF NOT EXISTS idx_sai_student ON student_annual_insights(student_id);
CREATE INDEX IF NOT EXISTS idx_sai_cycle ON student_annual_insights(cycle_year);
-- Tabla de backups a cold storage
CREATE TABLE IF NOT EXISTS cold_storage_backups (
    id SERIAL PRIMARY KEY,
    backup_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    executed_at TIMESTAMP NOT NULL,
    data_summary JSONB NOT NULL,
    total_size VARCHAR(50),
    storage_type VARCHAR(100),
    storage_location VARCHAR(500),
    encryption VARCHAR(50),
    retention_years INTEGER,
    verification JSONB,
    status VARCHAR(30) DEFAULT 'completed'
);
CREATE INDEX IF NOT EXISTS idx_csb_cycle ON cold_storage_backups(cycle_year);
-- Tabla de limpieza de datos
CREATE TABLE IF NOT EXISTS data_cleanup_logs (
    id SERIAL PRIMARY KEY,
    cleanup_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    executed_at TIMESTAMP NOT NULL,
    cleaned_data JSONB NOT NULL,
    total_reclaimed VARCHAR(50),
    database_optimized BOOLEAN DEFAULT false,
    indexes_rebuilt INTEGER DEFAULT 0,
    vacuum_executed BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_dcl_cycle ON data_cleanup_logs(cycle_year);
-- Tabla de publicación de resultados
CREATE TABLE IF NOT EXISTS results_publications (
    id SERIAL PRIMARY KEY,
    publication_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    published_at TIMESTAMP NOT NULL,
    channels JSONB NOT NULL,
    content JSONB,
    total_recipients INTEGER,
    status VARCHAR(30) DEFAULT 'published'
);
CREATE INDEX IF NOT EXISTS idx_rp_cycle ON results_publications(cycle_year);
-- Tabla de reportes de cierre
CREATE TABLE IF NOT EXISTS cycle_closure_reports (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    generated_at TIMESTAMP NOT NULL,
    summary JSONB NOT NULL,
    phases JSONB,
    signoff JSONB,
    status VARCHAR(30) DEFAULT 'final'
);
CREATE INDEX IF NOT EXISTS idx_ccr_cycle ON cycle_closure_reports(cycle_year);
-- Vista: Resumen de cierre por ciclo
CREATE OR REPLACE VIEW v_cycle_closure_summary AS
SELECT ap.cycle_year,
    ap.total_students,
    ap.promoted,
    ap.graduated,
    ap.retained,
    mrj.total_documents,
    csb.total_size as backup_size,
    ccr.status as closure_status
FROM automatic_promotions ap
    LEFT JOIN mass_report_jobs mrj ON ap.cycle_year = mrj.cycle_year
    LEFT JOIN cold_storage_backups csb ON ap.cycle_year = csb.cycle_year
    LEFT JOIN cycle_closure_reports ccr ON ap.cycle_year = ccr.cycle_year;
-- Vista: Estudiantes en riesgo final
CREATE OR REPLACE VIEW v_final_at_risk_students AS
SELECT cycle_year,
    at_risk_count,
    expected_graduates,
    expected_holdbacks,
    executed_at
FROM final_predictive_analysis
ORDER BY executed_at DESC
LIMIT 1;
-- Comentarios
COMMENT ON TABLE exam_support_activations IS 'Activaciones de soporte de exámenes';
COMMENT ON TABLE mass_report_jobs IS 'Jobs de generación masiva de reportes';
COMMENT ON TABLE official_document_processing IS 'Procesamiento de documentos oficiales';
COMMENT ON TABLE final_predictive_analysis IS 'Análisis predictivo final';
COMMENT ON TABLE closure_pipeline_executions IS 'Ejecución de pipelines de cierre';
COMMENT ON TABLE automatic_promotions IS 'Promociones automáticas';
COMMENT ON TABLE annual_student_insights IS 'Insights anuales agregados';
COMMENT ON TABLE student_annual_insights IS 'Insights anuales por estudiante';
COMMENT ON TABLE cold_storage_backups IS 'Backups a cold storage';
COMMENT ON TABLE data_cleanup_logs IS 'Logs de limpieza de datos';
COMMENT ON TABLE results_publications IS 'Publicaciones de resultados';
COMMENT ON TABLE cycle_closure_reports IS 'Reportes de cierre de ciclo';