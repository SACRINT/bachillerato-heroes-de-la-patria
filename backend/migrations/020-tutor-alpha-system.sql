-- =====================================================
-- MIGRACIÓN: Sistema de Tutoría IA Alpha (Semana 10)
-- Fecha: Diciembre 2025
-- =====================================================
-- Tabla principal de sesiones de tutoría
CREATE TABLE IF NOT EXISTS tutor_sessions (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(100) NOT NULL,
    subject VARCHAR(50) DEFAULT 'general',
    topic VARCHAR(100),
    messages_count INTEGER DEFAULT 1,
    quiz_score DECIMAL(5, 2),
    session_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Índice único para evitar duplicados por día
    UNIQUE(student_id, created_at::date)
);
-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_tutor_sessions_student ON tutor_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_tutor_sessions_subject ON tutor_sessions(subject);
CREATE INDEX IF NOT EXISTS idx_tutor_sessions_date ON tutor_sessions(created_at);
-- Tabla de quizzes generados
CREATE TABLE IF NOT EXISTS tutor_quizzes (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(100),
    subject VARCHAR(50) NOT NULL,
    topic VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium',
    questions_count INTEGER DEFAULT 5,
    quiz_data JSONB NOT NULL,
    score DECIMAL(5, 2),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tutor_quizzes_student ON tutor_quizzes(student_id);
-- Tabla de alertas de riesgo detectadas
CREATE TABLE IF NOT EXISTS tutor_risk_alerts (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(100) NOT NULL,
    risk_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message_excerpt TEXT,
    was_addressed BOOLEAN DEFAULT FALSE,
    addressed_by VARCHAR(100),
    addressed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_unaddressed ON tutor_risk_alerts(was_addressed)
WHERE was_addressed = FALSE;
-- Tabla de límites de uso diario
CREATE TABLE IF NOT EXISTS tutor_usage_limits (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    interaction_count INTEGER DEFAULT 0,
    quiz_count INTEGER DEFAULT 0,
    last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, usage_date)
);
CREATE INDEX IF NOT EXISTS idx_usage_limits_date ON tutor_usage_limits(usage_date);
-- Tabla de progreso de aprendizaje
CREATE TABLE IF NOT EXISTS tutor_learning_progress (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(100) NOT NULL,
    subject VARCHAR(50) NOT NULL,
    topic VARCHAR(100),
    mastery_level DECIMAL(5, 2) DEFAULT 0,
    total_interactions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, subject, topic)
);
CREATE INDEX IF NOT EXISTS idx_learning_progress_student ON tutor_learning_progress(student_id);
-- Vista para dashboard de docentes
CREATE OR REPLACE VIEW v_tutor_student_summary AS
SELECT s.student_id,
    s.subject,
    COUNT(*) as total_sessions,
    SUM(s.messages_count) as total_messages,
    AVG(s.quiz_score) as avg_quiz_score,
    MAX(s.created_at) as last_session,
    COALESCE(r.risk_count, 0) as risk_alerts
FROM tutor_sessions s
    LEFT JOIN (
        SELECT student_id,
            COUNT(*) as risk_count
        FROM tutor_risk_alerts
        WHERE was_addressed = FALSE
        GROUP BY student_id
    ) r ON s.student_id = r.student_id
GROUP BY s.student_id,
    s.subject,
    r.risk_count;
-- Comentarios
COMMENT ON TABLE tutor_sessions IS 'Sesiones de tutoría IA con estudiantes';
COMMENT ON TABLE tutor_quizzes IS 'Quizzes generados por el tutor IA';
COMMENT ON TABLE tutor_risk_alerts IS 'Alertas de riesgo emocional detectadas';
COMMENT ON TABLE tutor_usage_limits IS 'Control de límites de uso diario';
COMMENT ON TABLE tutor_learning_progress IS 'Progreso de aprendizaje por tema';