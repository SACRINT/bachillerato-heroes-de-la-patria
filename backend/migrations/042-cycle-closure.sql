-- =====================================================
-- MIGRACIÓN: Cycle Closure (Semana 33)
-- Preparación para Cierre de Ciclo
-- Fecha: Enero 2026
-- Fase 5: Consolidación, Ética y Futuro
-- =====================================================
-- Tabla de métricas finales de ciclo
CREATE TABLE IF NOT EXISTS cycle_final_metrics (
    id SERIAL PRIMARY KEY,
    cycle_year VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    -- academic, ai_adoption, operational
    metric_name VARCHAR(100) NOT NULL,
    target_value DECIMAL(12, 4),
    actual_value DECIMAL(12, 4),
    status VARCHAR(30),
    -- on_track, exceeded, below_target
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cycle_year, category, metric_name)
);
CREATE INDEX IF NOT EXISTS idx_metrics_cycle ON cycle_final_metrics(cycle_year);
CREATE INDEX IF NOT EXISTS idx_metrics_category ON cycle_final_metrics(category);
-- Tabla de validación de integridad de certificados
CREATE TABLE IF NOT EXISTS certificate_integrity_checks (
    id SERIAL PRIMARY KEY,
    check_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    total_students INTEGER,
    complete_records INTEGER,
    incomplete_records INTEGER,
    issues JSONB,
    data_quality_score DECIMAL(5, 2),
    ready_for_certificates BOOLEAN DEFAULT false,
    actions_required TEXT [],
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cert_check_cycle ON certificate_integrity_checks(cycle_year);
-- Tabla de amnesia selectiva
CREATE TABLE IF NOT EXISTS selective_amnesia_logs (
    id SERIAL PRIMARY KEY,
    execution_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    dry_run BOOLEAN DEFAULT true,
    records_deleted INTEGER DEFAULT 0,
    records_anonymized INTEGER DEFAULT 0,
    records_archived INTEGER DEFAULT 0,
    storage_reclaimed VARCHAR(50),
    data_categories JSONB,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_amnesia_cycle ON selective_amnesia_logs(cycle_year);
-- Tabla de migración de egresados
CREATE TABLE IF NOT EXISTS graduate_migrations (
    id SERIAL PRIMARY KEY,
    migration_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    total_graduates INTEGER,
    status VARCHAR(30) DEFAULT 'planned',
    -- planned, in_progress, completed
    phases JSONB,
    data_migrated TEXT [],
    alumni_features TEXT [],
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_grad_mig_cycle ON graduate_migrations(cycle_year);
CREATE INDEX IF NOT EXISTS idx_grad_mig_status ON graduate_migrations(status);
-- Tabla de archivado de modelos
CREATE TABLE IF NOT EXISTS model_archives (
    id SERIAL PRIMARY KEY,
    archive_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    model_version VARCHAR(50),
    performance_metrics JSONB,
    model_size VARCHAR(50),
    archive_location VARCHAR(500),
    training_period VARCHAR(100),
    deployment_period VARCHAR(100),
    total_predictions INTEGER,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_archive_cycle ON model_archives(cycle_year);
CREATE INDEX IF NOT EXISTS idx_archive_model ON model_archives(model_id);
-- Tabla de reportes de impacto anual
CREATE TABLE IF NOT EXISTS annual_impact_reports (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    executive_summary TEXT,
    highlights JSONB,
    financial_impact JSONB,
    ai_utilization JSONB,
    testimonials JSONB,
    areas_improvement TEXT [],
    goals_next_year TEXT [],
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_impact_cycle ON annual_impact_reports(cycle_year);
-- Tabla de auditoría de accesos
CREATE TABLE IF NOT EXISTS access_audits (
    id SERIAL PRIMARY KEY,
    audit_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    total_active_users INTEGER,
    users_deactivated INTEGER,
    users_downgraded INTEGER,
    staff_changes JSONB,
    graduating_students JSONB,
    pending_actions JSONB,
    compliance_status VARCHAR(30),
    audited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_access_audit_cycle ON access_audits(cycle_year);
-- Tabla de backups de fin de año
CREATE TABLE IF NOT EXISTS end_of_year_backups (
    id SERIAL PRIMARY KEY,
    backup_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    backup_type VARCHAR(50) NOT NULL,
    -- database, files, models, configurations
    backup_size VARCHAR(50),
    backup_location VARCHAR(500),
    verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP,
    recovery_test_status VARCHAR(30),
    last_recovery_test TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_backup_cycle ON end_of_year_backups(cycle_year);
CREATE INDEX IF NOT EXISTS idx_backup_type ON end_of_year_backups(backup_type);
-- Tabla de anuarios IA
CREATE TABLE IF NOT EXISTS ai_yearbooks (
    id SERIAL PRIMARY KEY,
    yearbook_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    title VARCHAR(200),
    theme VARCHAR(200),
    sections JSONB,
    ai_contributions TEXT [],
    format VARCHAR(100),
    estimated_pages INTEGER,
    completion_status DECIMAL(4, 3),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_yearbook_cycle ON ai_yearbooks(cycle_year);
-- Tabla de planes de desconexión
CREATE TABLE IF NOT EXISTS vacation_shutdown_plans (
    id SERIAL PRIMARY KEY,
    plan_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    vacation_start DATE,
    vacation_end DATE,
    services_disabled JSONB,
    services_kept JSONB,
    reduced_mode_services JSONB,
    estimated_savings DECIMAL(10, 2),
    reactivation_plan JSONB,
    status VARCHAR(30) DEFAULT 'planned',
    -- planned, active, completed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vacation_cycle ON vacation_shutdown_plans(cycle_year);
-- Tabla de checklist de cierre
CREATE TABLE IF NOT EXISTS closure_checklists (
    id SERIAL PRIMARY KEY,
    cycle_year VARCHAR(20) NOT NULL,
    item_id INTEGER NOT NULL,
    task VARCHAR(200) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending',
    -- pending, in_progress, completed, skipped
    required BOOLEAN DEFAULT true,
    completed_at TIMESTAMP,
    completed_by VARCHAR(100),
    notes TEXT,
    UNIQUE(cycle_year, item_id)
);
CREATE INDEX IF NOT EXISTS idx_checklist_cycle ON closure_checklists(cycle_year);
CREATE INDEX IF NOT EXISTS idx_checklist_status ON closure_checklists(status);
-- Tabla de simulacros de cierre
CREATE TABLE IF NOT EXISTS closure_simulations (
    id SERIAL PRIMARY KEY,
    simulation_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    results JSONB NOT NULL,
    issues_found JSONB,
    overall_status VARCHAR(30),
    confidence DECIMAL(4, 3),
    simulated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sim_cycle ON closure_simulations(cycle_year);
-- Vista: Progreso de cierre de ciclo
CREATE OR REPLACE VIEW v_closure_progress AS
SELECT cycle_year,
    COUNT(*) as total_items,
    COUNT(*) FILTER (
        WHERE status = 'completed'
    ) as completed,
    COUNT(*) FILTER (
        WHERE status = 'pending'
    ) as pending,
    COUNT(*) FILTER (
        WHERE required = true
    ) as required_items,
    COUNT(*) FILTER (
        WHERE required = true
            AND status = 'completed'
    ) as required_completed,
    ROUND(
        COUNT(*) FILTER (
            WHERE status = 'completed'
        )::DECIMAL / COUNT(*)::DECIMAL * 100,
        2
    ) as progress_percentage
FROM closure_checklists
GROUP BY cycle_year;
-- Vista: Resumen de métricas por ciclo
CREATE OR REPLACE VIEW v_cycle_metrics_summary AS
SELECT cycle_year,
    category,
    COUNT(*) as total_metrics,
    COUNT(*) FILTER (
        WHERE status = 'exceeded'
    ) as exceeded,
    COUNT(*) FILTER (
        WHERE status = 'on_track'
    ) as on_track,
    COUNT(*) FILTER (
        WHERE status = 'below_target'
    ) as below_target
FROM cycle_final_metrics
GROUP BY cycle_year,
    category;
-- Comentarios
COMMENT ON TABLE cycle_final_metrics IS 'Métricas finales de ciclo escolar';
COMMENT ON TABLE certificate_integrity_checks IS 'Verificaciones de integridad para certificados';
COMMENT ON TABLE selective_amnesia_logs IS 'Logs de ejecución de amnesia selectiva';
COMMENT ON TABLE graduate_migrations IS 'Migraciones de datos de egresados';
COMMENT ON TABLE model_archives IS 'Archivos de modelos por ciclo';
COMMENT ON TABLE annual_impact_reports IS 'Reportes de impacto anual';
COMMENT ON TABLE access_audits IS 'Auditorías de acceso de fin de ciclo';
COMMENT ON TABLE end_of_year_backups IS 'Backups de fin de año';
COMMENT ON TABLE ai_yearbooks IS 'Anuarios generados con IA';
COMMENT ON TABLE vacation_shutdown_plans IS 'Planes de desconexión en vacaciones';
COMMENT ON TABLE closure_checklists IS 'Checklist de cierre de ciclo';
COMMENT ON TABLE closure_simulations IS 'Simulacros de cierre';