-- Migration: Predictive Analytics System
-- Description: Tables for storing student risk profiles and predictive model logs.
-- Tabla para almacenar el perfil de riesgo actual de cada estudiante
CREATE TABLE IF NOT EXISTS student_risk_profiles (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES usuarios(id),
    risk_level VARCHAR(20) NOT NULL CHECK (
        risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    ),
    risk_score DECIMAL(5, 2) DEFAULT 0.0,
    -- 0.00 to 100.00
    primary_factor VARCHAR(100),
    -- Main reason (e.g., "Low Attendance", "Failing Grades")
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by_model VARCHAR(100) DEFAULT 'RuleBased_v1',
    UNIQUE(student_id)
);
-- Tabla para historial de intervenciones sugeridas/realizadas
CREATE TABLE IF NOT EXISTS intervention_logs (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES usuarios(id),
    risk_profile_id INTEGER REFERENCES student_risk_profiles(id),
    intervention_type VARCHAR(50) NOT NULL,
    -- "Email", "Counseling", "Tutoring"
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (
        status IN (
            'PENDING',
            'IN_PROGRESS',
            'COMPLETED',
            'DISMISSED'
        )
    ),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);
-- Tabla para registrar predicciones históricas (para analizar tendencias)
CREATE TABLE IF NOT EXISTS ai_prediction_history (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES usuarios(id),
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50),
    prediction_type VARCHAR(50) NOT NULL,
    -- "DROPOUT_RISK", "FINAL_GRADE"
    predicted_value JSONB,
    -- { "probability": 0.85, "label": "HIGH" }
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_risk_student ON student_risk_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_risk_level ON student_risk_profiles(risk_level);
CREATE INDEX IF NOT EXISTS idx_intervention_student ON intervention_logs(student_id);