-- =====================================================
-- MIGRACIÓN: Predicción de Deserción Escolar (Semana 13)
-- Sistema Early Warning
-- Fecha: Enero 2026
-- =====================================================
-- Tabla de predicciones de riesgo
CREATE TABLE IF NOT EXISTS dropout_predictions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    risk_score DECIMAL(5, 4) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    confidence DECIMAL(3, 2) DEFAULT 0.80,
    features JSONB DEFAULT '{}',
    model_version VARCHAR(20) DEFAULT '1.0.0',
    is_shadow BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, created_at)
);
CREATE INDEX IF NOT EXISTS idx_dropout_student ON dropout_predictions(student_id);
CREATE INDEX IF NOT EXISTS idx_dropout_level ON dropout_predictions(risk_level);
CREATE INDEX IF NOT EXISTS idx_dropout_date ON dropout_predictions(created_at);
-- Tabla de alertas generadas
CREATE TABLE IF NOT EXISTS dropout_alerts (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    prediction_id INTEGER REFERENCES dropout_predictions(id),
    alert_type VARCHAR(50) NOT NULL,
    -- 'URGENTE', 'ATENCIÓN', 'INFORMATIVO'
    risk_level VARCHAR(20) NOT NULL,
    status VARCHAR(30) DEFAULT 'active',
    -- 'active', 'acknowledged', 'resolved'
    assigned_to INTEGER,
    -- ID del docente/orientador
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_alerts_student ON dropout_alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON dropout_alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_assigned ON dropout_alerts(assigned_to);
-- Tabla de intervenciones
CREATE TABLE IF NOT EXISTS dropout_interventions (
    id SERIAL PRIMARY KEY,
    alert_id INTEGER REFERENCES dropout_alerts(id),
    student_id INTEGER NOT NULL,
    intervention_type VARCHAR(100) NOT NULL,
    actions JSONB DEFAULT '[]',
    urgency VARCHAR(20) DEFAULT 'media',
    status VARCHAR(30) DEFAULT 'pending',
    -- 'pending', 'in_progress', 'completed', 'cancelled'
    assigned_to INTEGER,
    outcome TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_interventions_student ON dropout_interventions(student_id);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON dropout_interventions(status);
-- Tabla de configuración del modelo
CREATE TABLE IF NOT EXISTS dropout_model_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100)
);
-- Insertar configuración inicial
INSERT INTO dropout_model_config (config_key, config_value, description)
VALUES (
        'thresholds',
        '{"low": 0.30, "medium": 0.55, "high": 0.75, "critical": 0.90}',
        'Umbrales de clasificación de riesgo'
    ),
    (
        'weights',
        '{"attendance_rate": -0.35, "grade_trend": -0.25, "failed_subjects": 0.20, "behavioral_incidents": 0.15, "socioeconomic_risk": 0.10, "parent_engagement": -0.08, "extracurricular": -0.07}',
        'Pesos del modelo predictivo'
    ),
    (
        'shadow_mode',
        'true',
        'Modo sombra (sin alertas visibles)'
    ) ON CONFLICT (config_key) DO NOTHING;
-- Tabla de monitoreo de predicciones vs realidad
CREATE TABLE IF NOT EXISTS dropout_monitoring (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    prediction_date DATE NOT NULL,
    predicted_risk_level VARCHAR(20) NOT NULL,
    predicted_score DECIMAL(5, 4) NOT NULL,
    actual_outcome VARCHAR(50),
    -- 'stayed', 'dropped_out', 'transferred', null=pending
    outcome_date DATE,
    accuracy_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_monitoring_student ON dropout_monitoring(student_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_outcome ON dropout_monitoring(actual_outcome);
-- Tabla de historial de características
CREATE TABLE IF NOT EXISTS student_risk_features (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    period VARCHAR(20) NOT NULL,
    -- '2026-01', '2026-02', etc.
    attendance_rate DECIMAL(5, 4),
    grade_trend DECIMAL(5, 4),
    failed_subjects INTEGER DEFAULT 0,
    behavioral_incidents INTEGER DEFAULT 0,
    socioeconomic_risk DECIMAL(3, 2),
    parent_engagement DECIMAL(3, 2),
    extracurricular INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, period)
);
CREATE INDEX IF NOT EXISTS idx_features_student ON student_risk_features(student_id);
CREATE INDEX IF NOT EXISTS idx_features_period ON student_risk_features(period);
-- Vista: Resumen de estudiantes en riesgo
-- NOTA: Usa columnas reales de la tabla estudiantes (semestre, especialidad)
CREATE OR REPLACE VIEW v_students_at_risk AS
SELECT dp.student_id,
    COALESCE(u.nombre, 'N/A') as student_name,
    e.semestre,
    e.especialidad,
    dp.risk_score,
    dp.risk_level,
    dp.created_at as last_prediction,
    COALESCE(da.alert_count, 0) as active_alerts,
    COALESCE(di.pending_interventions, 0) as pending_interventions
FROM dropout_predictions dp
    LEFT JOIN estudiantes e ON e.id = dp.student_id
    LEFT JOIN usuarios u ON u.id = e.usuario_id
    LEFT JOIN (
        SELECT student_id,
            COUNT(*) as alert_count
        FROM dropout_alerts
        WHERE status = 'active'
        GROUP BY student_id
    ) da ON da.student_id = dp.student_id
    LEFT JOIN (
        SELECT student_id,
            COUNT(*) as pending_interventions
        FROM dropout_interventions
        WHERE status IN ('pending', 'in_progress')
        GROUP BY student_id
    ) di ON di.student_id = dp.student_id
WHERE dp.created_at = (
        SELECT MAX(created_at)
        FROM dropout_predictions
        WHERE student_id = dp.student_id
    )
    AND dp.risk_level IN ('high', 'critical')
ORDER BY dp.risk_score DESC;
-- Comentarios
COMMENT ON TABLE dropout_predictions IS 'Predicciones de riesgo de deserción escolar';
COMMENT ON TABLE dropout_alerts IS 'Alertas generadas por el sistema Early Warning';
COMMENT ON TABLE dropout_interventions IS 'Intervenciones sugeridas y su seguimiento';
COMMENT ON TABLE dropout_model_config IS 'Configuración del modelo predictivo';
COMMENT ON TABLE dropout_monitoring IS 'Monitoreo de predicciones vs resultados reales';
COMMENT ON TABLE student_risk_features IS 'Historial de características de riesgo por estudiante';