-- =====================================================
-- MIGRACIÓN: Ethics and XAI (Semana 29)
-- Auditoría Ética y Explicabilidad
-- Fecha: Enero 2026
-- Fase 5: Consolidación, Ética y Futuro
-- =====================================================
-- Tabla de explicaciones XAI
CREATE TABLE IF NOT EXISTS xai_explanations (
    id SERIAL PRIMARY KEY,
    explanation_id VARCHAR(100) UNIQUE NOT NULL,
    prediction_id VARCHAR(100) NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    method VARCHAR(50) NOT NULL,
    -- LIME, SHAP, Counterfactual, FeatureImportance
    feature_contributions JSONB NOT NULL,
    natural_language_explanation TEXT,
    confidence DECIMAL(4, 3),
    visualization_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_xai_prediction ON xai_explanations(prediction_id);
CREATE INDEX IF NOT EXISTS idx_xai_model ON xai_explanations(model_id);
CREATE INDEX IF NOT EXISTS idx_xai_method ON xai_explanations(method);
CREATE INDEX IF NOT EXISTS idx_xai_date ON xai_explanations(created_at);
-- Tabla de auditorías de decisiones
CREATE TABLE IF NOT EXISTS decision_audits (
    id SERIAL PRIMARY KEY,
    audit_id VARCHAR(100) UNIQUE NOT NULL,
    decision_id VARCHAR(100) NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    audit_checks JSONB NOT NULL,
    overall_status VARCHAR(30),
    -- approved, flagged, rejected
    human_review_required BOOLEAN DEFAULT false,
    recommendations TEXT [],
    audit_trail JSONB,
    audited_by VARCHAR(100),
    audited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_decision ON decision_audits(decision_id);
CREATE INDEX IF NOT EXISTS idx_audit_model ON decision_audits(model_id);
CREATE INDEX IF NOT EXISTS idx_audit_status ON decision_audits(overall_status);
CREATE INDEX IF NOT EXISTS idx_audit_date ON decision_audits(audited_at);
-- Tabla de comité de ética
CREATE TABLE IF NOT EXISTS ethics_committee_members (
    id SERIAL PRIMARY KEY,
    member_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    role VARCHAR(100) NOT NULL,
    -- Presidente, Secretario, Vocal, Asesor
    member_type VARCHAR(50) NOT NULL,
    -- docente, admin, padre, alumno, externo
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_committee_role ON ethics_committee_members(role);
CREATE INDEX IF NOT EXISTS idx_committee_type ON ethics_committee_members(member_type);
CREATE INDEX IF NOT EXISTS idx_committee_active ON ethics_committee_members(is_active);
-- Tabla de casos de ética
CREATE TABLE IF NOT EXISTS ethics_cases (
    id SERIAL PRIMARY KEY,
    case_id VARCHAR(100) UNIQUE NOT NULL,
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    -- general, bias, decision_appeal, privacy
    description TEXT NOT NULL,
    affected_party VARCHAR(200),
    status VARCHAR(30) DEFAULT 'pending_review',
    -- pending_review, in_progress, resolved, dismissed
    assigned_to VARCHAR(100),
    resolution TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ethics_case_status ON ethics_cases(status);
CREATE INDEX IF NOT EXISTS idx_ethics_case_category ON ethics_cases(category);
CREATE INDEX IF NOT EXISTS idx_ethics_case_date ON ethics_cases(submitted_at);
-- Tabla de análisis de sesgos en datasets
CREATE TABLE IF NOT EXISTS dataset_bias_analysis (
    id SERIAL PRIMARY KEY,
    analysis_id VARCHAR(100) UNIQUE NOT NULL,
    dataset_id VARCHAR(100) NOT NULL,
    total_records INTEGER,
    demographics JSONB NOT NULL,
    overall_bias_score DECIMAL(4, 3),
    critical_issues INTEGER DEFAULT 0,
    warnings INTEGER DEFAULT 0,
    recommendations TEXT [],
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dataset_bias ON dataset_bias_analysis(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_score ON dataset_bias_analysis(overall_bias_score);
-- Tabla de apelaciones
CREATE TABLE IF NOT EXISTS algorithmic_appeals (
    id SERIAL PRIMARY KEY,
    appeal_id VARCHAR(100) UNIQUE NOT NULL,
    student_id INTEGER NOT NULL,
    decision_id VARCHAR(100) NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'submitted',
    -- submitted, initial_review, human_evaluation, resolved
    stages JSONB NOT NULL,
    resolution VARCHAR(30),
    -- upheld, overturned, modified
    resolution_notes TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_appeal_student ON algorithmic_appeals(student_id);
CREATE INDEX IF NOT EXISTS idx_appeal_status ON algorithmic_appeals(status);
CREATE INDEX IF NOT EXISTS idx_appeal_resolution ON algorithmic_appeals(resolution);
CREATE INDEX IF NOT EXISTS idx_appeal_date ON algorithmic_appeals(submitted_at);
-- Tabla de Model Cards
CREATE TABLE IF NOT EXISTS model_cards (
    id SERIAL PRIMARY KEY,
    model_id VARCHAR(100) UNIQUE NOT NULL,
    version VARCHAR(20) NOT NULL,
    model_details JSONB NOT NULL,
    intended_use JSONB NOT NULL,
    performance JSONB NOT NULL,
    limitations TEXT [],
    ethical_considerations JSONB,
    maintenance JSONB,
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_modelcard_version ON model_cards(version);
CREATE INDEX IF NOT EXISTS idx_modelcard_published ON model_cards(published);
-- Tabla de evaluaciones de impacto psicosocial
CREATE TABLE IF NOT EXISTS psychosocial_evaluations (
    id SERIAL PRIMARY KEY,
    evaluation_id VARCHAR(100) UNIQUE NOT NULL,
    component VARCHAR(100) NOT NULL,
    -- tutor_ai, prediction_alerts, gamification
    positive_effects JSONB,
    concerns JSONB,
    overall_assessment VARCHAR(50),
    -- beneficial, beneficial_with_caution, neutral, concerning
    score DECIMAL(3, 2),
    recommendations TEXT [],
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_psych_component ON psychosocial_evaluations(component);
CREATE INDEX IF NOT EXISTS idx_psych_assessment ON psychosocial_evaluations(overall_assessment);
-- Tabla de métricas de equidad
CREATE TABLE IF NOT EXISTS fairness_metrics (
    id SERIAL PRIMARY KEY,
    model_id VARCHAR(100) NOT NULL,
    metric_name VARCHAR(50) NOT NULL,
    -- demographic_parity, equalized_odds, predictive_parity, calibration
    value DECIMAL(5, 4),
    threshold DECIMAL(5, 4),
    status VARCHAR(20),
    -- pass, fail
    by_demographic JSONB,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_fairness_model ON fairness_metrics(model_id);
CREATE INDEX IF NOT EXISTS idx_fairness_metric ON fairness_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_fairness_status ON fairness_metrics(status);
-- Tabla de principios éticos
CREATE TABLE IF NOT EXISTS ethical_principles (
    id SERIAL PRIMARY KEY,
    principle_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    implementation TEXT [],
    is_active BOOLEAN DEFAULT true,
    adopted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO ethical_principles (principle_id, name, description, implementation)
VALUES (
        'beneficence',
        'Beneficencia',
        'La IA debe beneficiar a estudiantes y la comunidad educativa',
        '{"Evaluación de impacto positivo", "Métricas de bienestar"}'
    ),
    (
        'non_maleficence',
        'No Maleficencia',
        'Evitar daños psicológicos, sociales o académicos',
        '{"Monitoreo de efectos negativos", "Mecanismos de apelación"}'
    ),
    (
        'autonomy',
        'Autonomía',
        'Respetar la capacidad de decisión de estudiantes y padres',
        '{"Consentimiento informado", "Opción de opt-out"}'
    ),
    (
        'justice',
        'Justicia',
        'Distribuir beneficios y riesgos equitativamente',
        '{"Auditorías de sesgo", "Acceso equitativo"}'
    ),
    (
        'transparency',
        'Transparencia',
        'Explicar cómo funcionan y deciden los sistemas de IA',
        '{"Model Cards", "Explicaciones XAI", "Documentación pública"}'
    ),
    (
        'accountability',
        'Responsabilidad',
        'Definir responsables de las decisiones de IA',
        '{"Comité de ética", "Auditorías", "Proceso de apelación"}'
    ) ON CONFLICT (principle_id) DO NOTHING;
-- Tabla de reportes de transparencia
CREATE TABLE IF NOT EXISTS transparency_reports (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(100) UNIQUE NOT NULL,
    period VARCHAR(20) NOT NULL,
    executive_summary TEXT,
    ai_systems_deployed INTEGER,
    decisions_processed INTEGER,
    appeals_filed INTEGER,
    appeals_upheld INTEGER,
    bias_audits INTEGER,
    bias_issues_found INTEGER,
    bias_issues_resolved INTEGER,
    fairness_metrics JSONB,
    ethics_committee_meetings INTEGER,
    policy_changes INTEGER,
    user_satisfaction DECIMAL(3, 2),
    recommendations TEXT [],
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_transparency_period ON transparency_reports(period);
-- Vista: Resumen de apelaciones
CREATE OR REPLACE VIEW v_appeals_summary AS
SELECT status,
    COUNT(*) as total,
    COUNT(*) FILTER (
        WHERE resolution = 'upheld'
    ) as upheld,
    COUNT(*) FILTER (
        WHERE resolution = 'overturned'
    ) as overturned,
    AVG(
        EXTRACT(
            EPOCH
            FROM (resolved_at - submitted_at)
        ) / 86400
    )::INTEGER as avg_days_to_resolve
FROM algorithmic_appeals
GROUP BY status;
-- Vista: Estado de fairness por modelo
CREATE OR REPLACE VIEW v_model_fairness_status AS
SELECT model_id,
    COUNT(*) FILTER (
        WHERE status = 'pass'
    ) as metrics_passed,
    COUNT(*) FILTER (
        WHERE status = 'fail'
    ) as metrics_failed,
    AVG(value) as avg_fairness_value,
    MAX(calculated_at) as last_evaluated
FROM fairness_metrics
GROUP BY model_id;
-- Comentarios
COMMENT ON TABLE xai_explanations IS 'Explicaciones XAI de predicciones';
COMMENT ON TABLE decision_audits IS 'Auditorías de decisiones de IA';
COMMENT ON TABLE ethics_committee_members IS 'Miembros del comité de ética';
COMMENT ON TABLE ethics_cases IS 'Casos enviados al comité de ética';
COMMENT ON TABLE dataset_bias_analysis IS 'Análisis de sesgos en datasets';
COMMENT ON TABLE algorithmic_appeals IS 'Apelaciones de decisiones algorítmicas';
COMMENT ON TABLE model_cards IS 'Fichas de modelo (Model Cards)';
COMMENT ON TABLE psychosocial_evaluations IS 'Evaluaciones de impacto psicosocial';
COMMENT ON TABLE fairness_metrics IS 'Métricas de equidad por modelo';
COMMENT ON TABLE ethical_principles IS 'Principios éticos de la institución';
COMMENT ON TABLE transparency_reports IS 'Reportes de transparencia algorítmica';