-- 📚 MIGRACIÓN 101: PREDICTIVE ANALYTICS (RETENTION)
-- Propósito: Tablas para scores de riesgo de deserción y factores asociados (Fase 6 - Semana 41)
-- 1. Scores de Riesgo de Retención
CREATE TABLE IF NOT EXISTS retention_risk_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    -- 'low', 'medium', 'high', 'critical'
    risk_score DECIMAL(5, 2) NOT NULL,
    -- 0 a 100 (100 = máximo riesgo de abandono)
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    model_version VARCHAR(50) DEFAULT 'v1.0-heuristic'
);
-- 2. Factores de Riesgo Detallados
-- Explica POR QUÉ el usuario está en riesgo (para acción tutorial)
CREATE TABLE IF NOT EXISTS risk_factors (
    id SERIAL PRIMARY KEY,
    risk_score_id INTEGER REFERENCES retention_risk_scores(id) ON DELETE CASCADE,
    factor_category VARCHAR(50) NOT NULL,
    -- 'attendance', 'grades', 'engagement', 'financial'
    description TEXT,
    impact_score DECIMAL(5, 2),
    -- Cuánto contribuye este factor al riesgo total
    detected_value JSONB -- Valor real (ej. {"days_absent": 5})
);
-- 3. Histórico de Predicciones (Para validar el modelo)
CREATE TABLE IF NOT EXISTS retention_predictions_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    prediction_date DATE NOT NULL,
    predicted_risk_score DECIMAL(5, 2),
    actual_outcome VARCHAR(50),
    -- NULL al inicio, luego 'dropped_out', 'retained', 'graduated'
    accuracy_check_date DATE
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_retention_risk_user ON retention_risk_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_retention_risk_level ON retention_risk_scores(risk_level);
-- Seed Data: Riesgo Simulado
INSERT INTO retention_risk_scores (user_id, risk_level, risk_score)
VALUES (1, 'low', 15.0),
    (2, 'high', 85.5) ON CONFLICT DO NOTHING;
INSERT INTO risk_factors (
        risk_score_id,
        factor_category,
        description,
        impact_score
    )
VALUES (
        (
            SELECT id
            FROM retention_risk_scores
            WHERE user_id = 2
            LIMIT 1
        ), 'attendance', 'Ausencia en últimos 10 días', 40.0
    ), (
        (
            SELECT id
            FROM retention_risk_scores
            WHERE user_id = 2
            LIMIT 1
        ), 'grades', 'Promedio reprobatorio en Matemáticas', 30.0
    );