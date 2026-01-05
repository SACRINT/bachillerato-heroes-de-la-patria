-- =====================================================
-- MIGRACIÓN: Semester Evaluation (Semana 28)
-- Evaluación Semestral y Re-calibración
-- Fecha: Enero 2026
-- =====================================================
-- Tabla de evaluaciones semestrales
CREATE TABLE IF NOT EXISTS semester_evaluations (
    id SERIAL PRIMARY KEY,
    evaluation_id VARCHAR(100) UNIQUE NOT NULL,
    semester VARCHAR(20) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    overall_status VARCHAR(30),
    overall_achievement DECIMAL(5, 2),
    kpi_summary JSONB,
    roi_summary JSONB,
    satisfaction_summary JSONB,
    team_summary JSONB,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_semeval_semester ON semester_evaluations(semester);
CREATE INDEX IF NOT EXISTS idx_semeval_date ON semester_evaluations(created_at);
-- Tabla de KPIs históricos
CREATE TABLE IF NOT EXISTS kpi_snapshots (
    id SERIAL PRIMARY KEY,
    snapshot_date DATE NOT NULL,
    category VARCHAR(50) NOT NULL,
    kpi_name VARCHAR(100) NOT NULL,
    target_value DECIMAL(12, 4),
    actual_value DECIMAL(12, 4),
    achievement_pct DECIMAL(6, 2),
    status VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_kpi_date ON kpi_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_kpi_category ON kpi_snapshots(category);
CREATE INDEX IF NOT EXISTS idx_kpi_name ON kpi_snapshots(kpi_name);
-- Tabla de análisis financiero
CREATE TABLE IF NOT EXISTS financial_analysis (
    id SERIAL PRIMARY KEY,
    analysis_id VARCHAR(100) UNIQUE NOT NULL,
    period VARCHAR(20) NOT NULL,
    total_costs DECIMAL(12, 2),
    total_benefits DECIMAL(12, 2),
    roi_percentage DECIMAL(8, 2),
    net_benefit DECIMAL(12, 2),
    payback_months DECIMAL(6, 2),
    cost_breakdown JSONB,
    benefit_breakdown JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_financial_period ON financial_analysis(period);
-- Tabla de encuestas de satisfacción
CREATE TABLE IF NOT EXISTS satisfaction_surveys (
    id SERIAL PRIMARY KEY,
    survey_id VARCHAR(100) UNIQUE NOT NULL,
    period VARCHAR(20) NOT NULL,
    user_group VARCHAR(50) NOT NULL,
    total_responses INTEGER,
    avg_satisfaction DECIMAL(3, 2),
    nps_score INTEGER,
    top_features TEXT [],
    pain_points TEXT [],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_survey_period ON satisfaction_surveys(period);
CREATE INDEX IF NOT EXISTS idx_survey_group ON satisfaction_surveys(user_group);
-- Tabla de evaluaciones de equipo
CREATE TABLE IF NOT EXISTS team_evaluations (
    id SERIAL PRIMARY KEY,
    evaluation_id VARCHAR(100) UNIQUE NOT NULL,
    period VARCHAR(20) NOT NULL,
    team_size INTEGER,
    deliverables_planned INTEGER,
    deliverables_completed INTEGER,
    completion_rate DECIMAL(5, 2),
    test_coverage DECIMAL(5, 2),
    bug_rate DECIMAL(6, 2),
    achievements TEXT [],
    recommendations TEXT [],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_teameval_period ON team_evaluations(period);
-- Tabla de uso de features
CREATE TABLE IF NOT EXISTS feature_usage_analysis (
    id SERIAL PRIMARY KEY,
    analysis_date DATE NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    usage_rate DECIMAL(4, 3),
    total_sessions INTEGER,
    unique_users INTEGER,
    usage_category VARCHAR(30),
    deprecation_candidate BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_feature_date ON feature_usage_analysis(analysis_date);
CREATE INDEX IF NOT EXISTS idx_feature_name ON feature_usage_analysis(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_category ON feature_usage_analysis(usage_category);
-- Tabla de planes semestrales
CREATE TABLE IF NOT EXISTS semester_plans (
    id SERIAL PRIMARY KEY,
    plan_id VARCHAR(100) UNIQUE NOT NULL,
    semester VARCHAR(20) NOT NULL,
    period_start DATE,
    period_end DATE,
    priorities JSONB,
    milestones JSONB,
    resource_requirements JSONB,
    risks JSONB,
    status VARCHAR(30) DEFAULT 'draft',
    approved_by VARCHAR(100),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_plan_semester ON semester_plans(semester);
CREATE INDEX IF NOT EXISTS idx_plan_status ON semester_plans(status);
-- Tabla de lecciones aprendidas
CREATE TABLE IF NOT EXISTS lessons_learned (
    id SERIAL PRIMARY KEY,
    period VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    lesson TEXT NOT NULL,
    impact VARCHAR(30),
    action_taken TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lessons_period ON lessons_learned(period);
CREATE INDEX IF NOT EXISTS idx_lessons_category ON lessons_learned(category);
CREATE INDEX IF NOT EXISTS idx_lessons_impact ON lessons_learned(impact);
-- Tabla de mantenimiento de BD
CREATE TABLE IF NOT EXISTS db_maintenance_logs (
    id SERIAL PRIMARY KEY,
    maintenance_date TIMESTAMP NOT NULL,
    task_name VARCHAR(100) NOT NULL,
    status VARCHAR(30),
    duration_seconds INTEGER,
    rows_affected INTEGER,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_maint_date ON db_maintenance_logs(maintenance_date);
CREATE INDEX IF NOT EXISTS idx_maint_task ON db_maintenance_logs(task_name);
-- Vista: Resumen ejecutivo del semestre
CREATE OR REPLACE VIEW v_semester_executive_summary AS
SELECT se.semester,
    se.overall_status,
    se.overall_achievement,
    fa.roi_percentage,
    ss_avg.avg_satisfaction,
    te.completion_rate as team_completion
FROM semester_evaluations se
    LEFT JOIN financial_analysis fa ON fa.period = se.semester
    LEFT JOIN (
        SELECT period,
            AVG(avg_satisfaction) as avg_satisfaction
        FROM satisfaction_surveys
        GROUP BY period
    ) ss_avg ON ss_avg.period = se.semester
    LEFT JOIN team_evaluations te ON te.period = se.semester
ORDER BY se.created_at DESC;
-- Vista: Tendencia de KPIs
CREATE OR REPLACE VIEW v_kpi_trends AS
SELECT kpi_name,
    DATE_TRUNC('month', snapshot_date)::DATE as month,
    AVG(actual_value) as avg_value,
    AVG(achievement_pct) as avg_achievement
FROM kpi_snapshots
WHERE snapshot_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY kpi_name,
    DATE_TRUNC('month', snapshot_date)
ORDER BY kpi_name,
    month;
-- Comentarios
COMMENT ON TABLE semester_evaluations IS 'Evaluaciones semestrales completas';
COMMENT ON TABLE kpi_snapshots IS 'Snapshots históricos de KPIs';
COMMENT ON TABLE financial_analysis IS 'Análisis financiero y ROI';
COMMENT ON TABLE satisfaction_surveys IS 'Resultados de encuestas de satisfacción';
COMMENT ON TABLE team_evaluations IS 'Evaluaciones de desempeño del equipo';
COMMENT ON TABLE feature_usage_analysis IS 'Análisis de uso de features';
COMMENT ON TABLE semester_plans IS 'Planes semestrales';
COMMENT ON TABLE lessons_learned IS 'Lecciones aprendidas';
COMMENT ON TABLE db_maintenance_logs IS 'Logs de mantenimiento de BD';