-- ========================================
-- MIGRACIÓN: Sistema de Analíticas Predictivas
-- BGE Héroes de la Patria
-- FASE 3 - Semana 19-20
-- ========================================

-- ========================================
-- TABLA: Modelos de Predicción
-- ========================================
CREATE TABLE IF NOT EXISTS prediction_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    model_type VARCHAR(50) NOT NULL,              -- dropout_risk, performance, engagement, graduation
    description TEXT,

    -- Configuración del modelo
    algorithm VARCHAR(100) NOT NULL,              -- logistic_regression, decision_tree, random_forest, neural_network
    features JSONB NOT NULL,                      -- [{name: "attendance_rate", weight: 0.3}, ...]
    thresholds JSONB NOT NULL,                    -- {low: 0.3, medium: 0.6, high: 0.8}

    -- Métricas de rendimiento
    accuracy DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall_score DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    last_trained_at TIMESTAMP WITH TIME ZONE,
    training_data_size INTEGER,

    -- Estado
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,

    -- Metadata
    created_by INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Perfiles de Riesgo de Estudiantes
-- ========================================
CREATE TABLE IF NOT EXISTS student_risk_profiles (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Scores de riesgo por categoría (0-1)
    dropout_risk DECIMAL(5,4) DEFAULT 0,          -- Riesgo de abandono
    academic_risk DECIMAL(5,4) DEFAULT 0,         -- Riesgo académico
    engagement_risk DECIMAL(5,4) DEFAULT 0,       -- Riesgo de desengagement
    social_risk DECIMAL(5,4) DEFAULT 0,           -- Riesgo social
    overall_risk DECIMAL(5,4) DEFAULT 0,          -- Riesgo general

    -- Categoría de riesgo
    risk_level VARCHAR(20) DEFAULT 'low',         -- low, medium, high, critical

    -- Factores contribuyentes
    risk_factors JSONB DEFAULT '[]',              -- [{factor: "low_attendance", weight: 0.4, value: 0.65}]
    protective_factors JSONB DEFAULT '[]',        -- [{factor: "high_engagement", weight: 0.3}]

    -- Predicciones específicas
    predicted_grade DECIMAL(4,2),                 -- Calificación predicha
    predicted_graduation_prob DECIMAL(5,4),       -- Probabilidad de graduación
    predicted_next_semester_status VARCHAR(50),   -- on_track, at_risk, needs_support

    -- Tendencia
    trend VARCHAR(20) DEFAULT 'stable',           -- improving, stable, declining
    trend_data JSONB DEFAULT '[]',                -- Histórico de scores

    -- Recomendaciones automáticas
    recommendations JSONB DEFAULT '[]',           -- [{type: "tutoring", priority: "high"}]

    -- Metadata
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    model_version INTEGER DEFAULT 1,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(student_id)
);

-- ========================================
-- TABLA: Alertas de Predicción
-- ========================================
CREATE TABLE IF NOT EXISTS prediction_alerts (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Tipo de alerta
    alert_type VARCHAR(50) NOT NULL,              -- dropout_warning, grade_drop, engagement_low, absence_pattern
    severity VARCHAR(20) NOT NULL,                -- info, warning, critical

    -- Detalles
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,

    -- Datos de la predicción
    risk_score DECIMAL(5,4) NOT NULL,
    confidence DECIMAL(5,4) NOT NULL,             -- Confianza del modelo
    factors JSONB,                                -- Factores que dispararon la alerta

    -- Estado
    status VARCHAR(20) DEFAULT 'active',          -- active, acknowledged, resolved, dismissed

    -- Acciones
    acknowledged_by INTEGER REFERENCES usuarios(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_by INTEGER REFERENCES usuarios(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,

    -- Intervención sugerida
    suggested_intervention VARCHAR(100),
    intervention_applied BOOLEAN DEFAULT false,

    -- Notificaciones
    notified_users JSONB DEFAULT '[]',            -- [{user_id, role, notified_at}]

    -- Metadata
    expires_at TIMESTAMP WITH TIME ZONE,
    model_id INTEGER REFERENCES prediction_models(id),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Snapshots de Analíticas
-- ========================================
CREATE TABLE IF NOT EXISTS analytics_snapshots (
    id SERIAL PRIMARY KEY,

    -- Tipo de snapshot
    snapshot_type VARCHAR(50) NOT NULL,           -- daily, weekly, monthly, semester
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Métricas agregadas
    total_students INTEGER,
    active_students INTEGER,
    at_risk_students INTEGER,

    -- Distribución de riesgo
    risk_distribution JSONB,                      -- {low: 100, medium: 50, high: 20, critical: 5}

    -- Métricas académicas
    avg_attendance DECIMAL(5,2),
    avg_grade DECIMAL(5,2),
    avg_engagement_score DECIMAL(5,2),

    -- Métricas de gamificación
    avg_xp_earned INTEGER,
    avg_coins_earned INTEGER,
    active_in_forums INTEGER,
    completed_challenges INTEGER,

    -- Predicciones
    predicted_dropouts INTEGER,
    predicted_failures INTEGER,

    -- Comparación con período anterior
    comparison_data JSONB,                        -- {attendance_change: 0.05, grade_change: -0.1}

    -- Insights generados
    insights JSONB DEFAULT '[]',                  -- [{type, message, importance}]

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Factores de Predicción
-- ========================================
CREATE TABLE IF NOT EXISTS prediction_factors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,                -- academic, behavioral, social, engagement

    -- Configuración
    data_source VARCHAR(100) NOT NULL,            -- attendance, grades, forum_activity, etc.
    calculation_method TEXT,                      -- SQL o descripción del cálculo

    -- Pesos por defecto
    default_weight DECIMAL(5,4) DEFAULT 0.1,
    is_protective BOOLEAN DEFAULT false,          -- true = factor protector, false = factor de riesgo

    -- Normalización
    min_value DECIMAL(10,4) DEFAULT 0,
    max_value DECIMAL(10,4) DEFAULT 1,

    -- Estado
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Registros de Intervención
-- ========================================
CREATE TABLE IF NOT EXISTS intervention_records (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    alert_id INTEGER REFERENCES prediction_alerts(id),

    -- Tipo de intervención
    intervention_type VARCHAR(100) NOT NULL,      -- tutoring, counseling, parent_contact, academic_support

    -- Detalles
    description TEXT NOT NULL,
    objectives JSONB,                             -- [{objective, status}]

    -- Responsable
    assigned_to INTEGER REFERENCES usuarios(id),
    assigned_by INTEGER REFERENCES usuarios(id),

    -- Estado
    status VARCHAR(20) DEFAULT 'planned',         -- planned, in_progress, completed, cancelled
    priority VARCHAR(20) DEFAULT 'medium',        -- low, medium, high, urgent

    -- Fechas
    planned_date DATE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Resultados
    outcome VARCHAR(50),                          -- successful, partial, unsuccessful, ongoing
    outcome_notes TEXT,

    -- Métricas de impacto
    pre_intervention_risk DECIMAL(5,4),
    post_intervention_risk DECIMAL(5,4),
    effectiveness_score DECIMAL(5,4),

    -- Seguimiento
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    follow_up_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Historial de Predicciones
-- ========================================
CREATE TABLE IF NOT EXISTS prediction_history (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    model_id INTEGER REFERENCES prediction_models(id),

    -- Predicción
    prediction_type VARCHAR(50) NOT NULL,
    predicted_value DECIMAL(10,4) NOT NULL,
    confidence DECIMAL(5,4) NOT NULL,

    -- Resultado real (para validación del modelo)
    actual_value DECIMAL(10,4),
    was_accurate BOOLEAN,

    -- Contexto
    input_features JSONB,                         -- Features usados en la predicción

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Configuración de Notificaciones Predictivas
-- ========================================
CREATE TABLE IF NOT EXISTS predictive_notification_config (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Configuración por tipo de alerta
    notify_dropout_risk BOOLEAN DEFAULT true,
    notify_grade_drop BOOLEAN DEFAULT true,
    notify_engagement_low BOOLEAN DEFAULT true,
    notify_absence_pattern BOOLEAN DEFAULT true,

    -- Umbrales personalizados
    min_severity_email VARCHAR(20) DEFAULT 'warning',
    min_severity_push VARCHAR(20) DEFAULT 'critical',

    -- Frecuencia
    digest_frequency VARCHAR(20) DEFAULT 'daily', -- immediate, daily, weekly

    -- Estado
    is_enabled BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id)
);

-- ========================================
-- ÍNDICES DE PERFORMANCE
-- ========================================

-- Modelos
CREATE INDEX IF NOT EXISTS idx_prediction_models_type ON prediction_models(model_type);
CREATE INDEX IF NOT EXISTS idx_prediction_models_active ON prediction_models(is_active);

-- Risk Profiles
CREATE INDEX IF NOT EXISTS idx_risk_profiles_student ON student_risk_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_risk_profiles_level ON student_risk_profiles(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_profiles_overall ON student_risk_profiles(overall_risk DESC);
CREATE INDEX IF NOT EXISTS idx_risk_profiles_calculated ON student_risk_profiles(last_calculated_at);

-- Alerts
CREATE INDEX IF NOT EXISTS idx_alerts_student ON prediction_alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON prediction_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON prediction_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON prediction_alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON prediction_alerts(created_at DESC);

-- Snapshots
CREATE INDEX IF NOT EXISTS idx_snapshots_type ON analytics_snapshots(snapshot_type);
CREATE INDEX IF NOT EXISTS idx_snapshots_period ON analytics_snapshots(period_start, period_end);

-- Interventions
CREATE INDEX IF NOT EXISTS idx_interventions_student ON intervention_records(student_id);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON intervention_records(status);
CREATE INDEX IF NOT EXISTS idx_interventions_assigned ON intervention_records(assigned_to);
CREATE INDEX IF NOT EXISTS idx_interventions_priority ON intervention_records(priority);

-- History
CREATE INDEX IF NOT EXISTS idx_history_student ON prediction_history(student_id);
CREATE INDEX IF NOT EXISTS idx_history_type ON prediction_history(prediction_type);
CREATE INDEX IF NOT EXISTS idx_history_created ON prediction_history(created_at DESC);

-- ========================================
-- DATOS INICIALES: Factores de Predicción
-- ========================================
INSERT INTO prediction_factors (name, display_name, category, data_source, default_weight, is_protective) VALUES
    -- Factores académicos
    ('attendance_rate', 'Tasa de Asistencia', 'academic', 'attendance', 0.25, true),
    ('current_gpa', 'Promedio Actual', 'academic', 'grades', 0.20, true),
    ('grade_trend', 'Tendencia de Calificaciones', 'academic', 'grades', 0.15, true),
    ('failed_subjects', 'Materias Reprobadas', 'academic', 'grades', 0.20, false),
    ('homework_completion', 'Tareas Completadas', 'academic', 'assignments', 0.10, true),

    -- Factores de comportamiento
    ('absence_pattern', 'Patrón de Ausencias', 'behavioral', 'attendance', 0.15, false),
    ('tardiness_rate', 'Tasa de Retardos', 'behavioral', 'attendance', 0.10, false),
    ('disciplinary_incidents', 'Incidentes Disciplinarios', 'behavioral', 'incidents', 0.15, false),

    -- Factores de engagement
    ('platform_logins', 'Accesos a Plataforma', 'engagement', 'user_sessions', 0.10, true),
    ('forum_participation', 'Participación en Foros', 'engagement', 'forum_posts', 0.10, true),
    ('challenges_completed', 'Retos Completados', 'engagement', 'iacoins_transactions', 0.10, true),
    ('tutor_sessions', 'Sesiones con Tutor IA', 'engagement', 'tutor_sessions', 0.10, true),
    ('library_usage', 'Uso de Biblioteca', 'engagement', 'library_user_progress', 0.05, true),

    -- Factores sociales
    ('peer_interactions', 'Interacciones con Pares', 'social', 'forum_posts', 0.10, true),
    ('group_projects', 'Proyectos Grupales', 'social', 'assignments', 0.10, true),
    ('mentor_contact', 'Contacto con Mentor', 'social', 'messages', 0.10, true)
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- DATOS INICIALES: Modelos de Predicción
-- ========================================
INSERT INTO prediction_models (name, model_type, description, algorithm, features, thresholds, is_active) VALUES
    (
        'Modelo de Riesgo de Abandono v1',
        'dropout_risk',
        'Predice la probabilidad de abandono escolar basado en asistencia, calificaciones y engagement',
        'logistic_regression',
        '[
            {"name": "attendance_rate", "weight": 0.25},
            {"name": "current_gpa", "weight": 0.20},
            {"name": "failed_subjects", "weight": 0.20},
            {"name": "platform_logins", "weight": 0.15},
            {"name": "absence_pattern", "weight": 0.10},
            {"name": "forum_participation", "weight": 0.10}
        ]'::JSONB,
        '{"low": 0.3, "medium": 0.5, "high": 0.7, "critical": 0.85}'::JSONB,
        true
    ),
    (
        'Modelo de Rendimiento Académico v1',
        'performance',
        'Predice el rendimiento académico del próximo período',
        'random_forest',
        '[
            {"name": "current_gpa", "weight": 0.30},
            {"name": "grade_trend", "weight": 0.20},
            {"name": "homework_completion", "weight": 0.15},
            {"name": "tutor_sessions", "weight": 0.15},
            {"name": "attendance_rate", "weight": 0.10},
            {"name": "challenges_completed", "weight": 0.10}
        ]'::JSONB,
        '{"failing": 6.0, "passing": 7.0, "good": 8.0, "excellent": 9.0}'::JSONB,
        true
    ),
    (
        'Modelo de Engagement v1',
        'engagement',
        'Mide el nivel de compromiso del estudiante con la plataforma',
        'decision_tree',
        '[
            {"name": "platform_logins", "weight": 0.20},
            {"name": "forum_participation", "weight": 0.20},
            {"name": "challenges_completed", "weight": 0.20},
            {"name": "tutor_sessions", "weight": 0.15},
            {"name": "library_usage", "weight": 0.15},
            {"name": "peer_interactions", "weight": 0.10}
        ]'::JSONB,
        '{"disengaged": 0.3, "passive": 0.5, "active": 0.7, "highly_engaged": 0.85}'::JSONB,
        true
    )
ON CONFLICT DO NOTHING;

-- ========================================
-- COMENTARIOS
-- ========================================
COMMENT ON TABLE prediction_models IS 'Definiciones de modelos de predicción con configuración y métricas';
COMMENT ON TABLE student_risk_profiles IS 'Perfiles de riesgo actualizados por estudiante';
COMMENT ON TABLE prediction_alerts IS 'Alertas generadas por los modelos predictivos';
COMMENT ON TABLE analytics_snapshots IS 'Snapshots periódicos de métricas agregadas';
COMMENT ON TABLE prediction_factors IS 'Factores utilizados en los modelos de predicción';
COMMENT ON TABLE intervention_records IS 'Registro de intervenciones realizadas';
COMMENT ON TABLE prediction_history IS 'Historial de predicciones para validación de modelos';

COMMENT ON COLUMN student_risk_profiles.risk_level IS 'low, medium, high, critical';
COMMENT ON COLUMN prediction_alerts.severity IS 'info, warning, critical';
COMMENT ON COLUMN intervention_records.outcome IS 'successful, partial, unsuccessful, ongoing';

-- ========================================
-- FIN DE MIGRACIÓN
-- ========================================
