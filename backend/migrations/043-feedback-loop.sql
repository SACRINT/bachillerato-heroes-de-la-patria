-- =====================================================
-- MIGRACIÓN: Feedback Loop (Semana 34)
-- Feedback Loop Docente/Administrativo
-- Fecha: Enero 2026
-- Fase 5: Consolidación, Ética y Futuro
-- =====================================================
-- Tabla de mesas redondas
CREATE TABLE IF NOT EXISTS round_tables (
    id SERIAL PRIMARY KEY,
    round_table_id VARCHAR(100) UNIQUE NOT NULL,
    topic VARCHAR(200) NOT NULL,
    scheduled_date TIMESTAMP,
    duration_minutes INTEGER DEFAULT 90,
    facilitator VARCHAR(200),
    participants TEXT [],
    agenda JSONB,
    discussion_guide TEXT [],
    status VARCHAR(30) DEFAULT 'scheduled',
    -- scheduled, in_progress, completed, cancelled
    attendees_count INTEGER,
    key_takeaways TEXT [],
    action_items JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rt_date ON round_tables(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_rt_status ON round_tables(status);
-- Tabla de historias de éxito/fracaso
CREATE TABLE IF NOT EXISTS feedback_stories (
    id SERIAL PRIMARY KEY,
    story_id VARCHAR(100) UNIQUE NOT NULL,
    story_type VARCHAR(20) NOT NULL,
    -- success, failure
    title VARCHAR(200) NOT NULL,
    submitter_role VARCHAR(50),
    -- docente, administrativo, etc.
    category VARCHAR(50),
    -- dropout_prediction, ai_tutor, automation, etc.
    impact VARCHAR(20),
    -- high, medium, low
    narrative TEXT,
    metrics JSONB,
    lesson_learned TEXT,
    resolution TEXT,
    status VARCHAR(30) DEFAULT 'pending_review',
    -- pending_review, approved, featured
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_story_type ON feedback_stories(story_type);
CREATE INDEX IF NOT EXISTS idx_story_category ON feedback_stories(category);
CREATE INDEX IF NOT EXISTS idx_story_status ON feedback_stories(status);
-- Tabla de sugerencias
CREATE TABLE IF NOT EXISTS user_suggestions (
    id SERIAL PRIMARY KEY,
    suggestion_id VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    -- features, usability, performance, training, other
    title VARCHAR(200) NOT NULL,
    description TEXT,
    submitter_role VARCHAR(50),
    submitter_id INTEGER,
    votes INTEGER DEFAULT 0,
    feasibility VARCHAR(20),
    -- high, medium, low
    priority VARCHAR(20),
    -- critical, high, medium, low
    status VARCHAR(30) DEFAULT 'received',
    -- received, under_review, planned, implemented, declined
    implemented_at TIMESTAMP,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sug_category ON user_suggestions(category);
CREATE INDEX IF NOT EXISTS idx_sug_votes ON user_suggestions(votes);
CREATE INDEX IF NOT EXISTS idx_sug_status ON user_suggestions(status);
-- Tabla de necesidades de capacitación
CREATE TABLE IF NOT EXISTS training_needs (
    id SERIAL PRIMARY KEY,
    assessment_id VARCHAR(100) UNIQUE NOT NULL,
    topic VARCHAR(200) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    demand_percentage DECIMAL(5, 2),
    current_coverage DECIMAL(5, 2),
    gap DECIMAL(5, 2),
    suggested_format TEXT,
    target_audience TEXT [],
    scheduled_date DATE,
    status VARCHAR(30) DEFAULT 'identified',
    -- identified, planned, in_progress, completed
    assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_train_priority ON training_needs(priority);
CREATE INDEX IF NOT EXISTS idx_train_status ON training_needs(status);
-- Tabla de validación de reportes
CREATE TABLE IF NOT EXISTS report_validations (
    id SERIAL PRIMARY KEY,
    validation_id VARCHAR(100) UNIQUE NOT NULL,
    report_name VARCHAR(200) NOT NULL,
    utility_score DECIMAL(3, 2),
    usage_frequency VARCHAR(30),
    -- daily, weekly, monthly, rarely
    suggestions TEXT [],
    respondents_count INTEGER,
    validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rv_score ON report_validations(utility_score);
CREATE INDEX IF NOT EXISTS idx_rv_frequency ON report_validations(usage_frequency);
-- Tabla de sesiones de co-diseño
CREATE TABLE IF NOT EXISTS codesign_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    topic VARCHAR(200) NOT NULL,
    session_date TIMESTAMP,
    methodology VARCHAR(100),
    participants JSONB,
    phases JSONB,
    problem_defined TEXT,
    selected_solution TEXT,
    next_steps TEXT [],
    status VARCHAR(30) DEFAULT 'planned',
    -- planned, in_progress, completed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_codesign_date ON codesign_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_codesign_status ON codesign_sessions(status);
-- Tabla de análisis de curva de aprendizaje
CREATE TABLE IF NOT EXISTS learning_curve_analysis (
    id SERIAL PRIMARY KEY,
    analysis_id VARCHAR(100) UNIQUE NOT NULL,
    tool_name VARCHAR(200) NOT NULL,
    avg_time_to_competency VARCHAR(100),
    adoption_rate DECIMAL(4, 3),
    difficulty_rating DECIMAL(3, 2),
    dropoff_points TEXT [],
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lca_adoption ON learning_curve_analysis(adoption_rate);
-- Tabla de fricciones de workflow
CREATE TABLE IF NOT EXISTS workflow_frictions (
    id SERIAL PRIMARY KEY,
    friction_id VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    -- critical, high, medium, low
    frequency VARCHAR(30),
    -- daily, weekly, monthly
    affected_users INTEGER,
    proposed_solution TEXT,
    estimated_impact TEXT,
    status VARCHAR(30) DEFAULT 'identified',
    -- identified, in_progress, resolved
    resolved_at TIMESTAMP,
    identified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_wf_severity ON workflow_frictions(severity);
CREATE INDEX IF NOT EXISTS idx_wf_status ON workflow_frictions(status);
-- Tabla de QoL features
CREATE TABLE IF NOT EXISTS qol_features (
    id SERIAL PRIMARY KEY,
    feature_id VARCHAR(100) UNIQUE NOT NULL,
    feature_name VARCHAR(200) NOT NULL,
    reach INTEGER,
    impact INTEGER,
    confidence DECIMAL(4, 3),
    effort INTEGER,
    rice_score DECIMAL(10, 2),
    priority INTEGER,
    planned_cycle VARCHAR(50),
    status VARCHAR(30) DEFAULT 'proposed',
    -- proposed, approved, in_development, released
    released_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_qol_priority ON qol_features(priority);
CREATE INDEX IF NOT EXISTS idx_qol_status ON qol_features(status);
-- Tabla de reportes de feedback consolidados
CREATE TABLE IF NOT EXISTS feedback_reports (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(100) UNIQUE NOT NULL,
    report_date TIMESTAMP NOT NULL,
    executive_summary TEXT,
    overall_satisfaction DECIMAL(3, 2),
    adoption_rate DECIMAL(4, 3),
    nps INTEGER,
    suggestions_count INTEGER,
    key_metrics JSONB,
    top_priorities TEXT [],
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_fr_date ON feedback_reports(report_date);
-- Vista: Top sugerencias por votos
CREATE OR REPLACE VIEW v_top_suggestions AS
SELECT suggestion_id,
    title,
    category,
    votes,
    feasibility,
    status
FROM user_suggestions
WHERE status NOT IN ('declined', 'implemented')
ORDER BY votes DESC
LIMIT 10;
-- Vista: Resumen de fricciones activas
CREATE OR REPLACE VIEW v_active_frictions AS
SELECT severity,
    COUNT(*) as count,
    SUM(affected_users) as total_affected
FROM workflow_frictions
WHERE status = 'identified'
GROUP BY severity
ORDER BY CASE
        severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
    END;
-- Comentarios
COMMENT ON TABLE round_tables IS 'Mesas redondas de feedback';
COMMENT ON TABLE feedback_stories IS 'Historias de éxito y fracaso';
COMMENT ON TABLE user_suggestions IS 'Sugerencias de usuarios';
COMMENT ON TABLE training_needs IS 'Necesidades de capacitación identificadas';
COMMENT ON TABLE report_validations IS 'Validaciones de utilidad de reportes';
COMMENT ON TABLE codesign_sessions IS 'Sesiones de co-diseño';
COMMENT ON TABLE learning_curve_analysis IS 'Análisis de curva de aprendizaje';
COMMENT ON TABLE workflow_frictions IS 'Fricciones de workflow identificadas';
COMMENT ON TABLE qol_features IS 'Features de Quality of Life';
COMMENT ON TABLE feedback_reports IS 'Reportes consolidados de feedback';