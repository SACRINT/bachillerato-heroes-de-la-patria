-- ========================================
-- MIGRACIÓN: SEMANA 12 - A/B TESTING & EXPERIMENTS
-- Fecha: 05 Enero 2026
-- Descripción: Infraestructura para experimentos y Shadow Mode
-- ========================================
-- Tabla de Experimentos
CREATE TABLE IF NOT EXISTS ai_experiments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    target_model_name VARCHAR(100) NOT NULL,
    -- El nombre del modelo base (ej. 'dropout_prediction')
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    -- draft, active, paused, concluded
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    primary_metric VARCHAR(50) NOT NULL,
    -- accuracy, latentcy, conversion_rate
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Variantes del Experimento (A/B/n)
CREATE TABLE IF NOT EXISTS ai_experiment_variants (
    id SERIAL PRIMARY KEY,
    experiment_id INTEGER REFERENCES ai_experiments(id),
    name VARCHAR(50) NOT NULL,
    -- 'Control', 'Variant A'
    model_version VARCHAR(50) NOT NULL,
    -- Vincula con ai_model_versions.version
    traffic_percentage INTEGER DEFAULT 50,
    -- Porcentaje de tráfico asignado (0-100)
    is_shadow_mode BOOLEAN DEFAULT FALSE,
    -- Si es TRUE, corre en segundo plano pero no sirve al usuario
    config JSONB DEFAULT '{}',
    -- Config específica para esta variante
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Asignación de Usuarios (Bucket Persistence)
-- Para asegurar que un usuario siempre vea la misma variante mientras dure el experimento
CREATE TABLE IF NOT EXISTS ai_experiment_allocations (
    id SERIAL PRIMARY KEY,
    experiment_id INTEGER REFERENCES ai_experiments(id),
    user_id INTEGER NOT NULL,
    -- Referencia a usuarios.id
    variant_id INTEGER REFERENCES ai_experiment_variants(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(experiment_id, user_id)
);
-- Resultados y Métricas de Experimentos
CREATE TABLE IF NOT EXISTS ai_experiment_metrics (
    id SERIAL PRIMARY KEY,
    experiment_id INTEGER REFERENCES ai_experiments(id),
    variant_id INTEGER REFERENCES ai_experiment_variants(id),
    metric_name VARCHAR(50) NOT NULL,
    metric_value DECIMAL(10, 4) NOT NULL,
    sample_size INTEGER DEFAULT 0,
    confidence_interval_low DECIMAL(10, 4),
    confidence_interval_high DECIMAL(10, 4),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Índices para búsquedas rápidas en tiempo de inferencia
CREATE INDEX IF NOT EXISTS idx_experiments_status ON ai_experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiments_target ON ai_experiments(target_model_name);
CREATE INDEX IF NOT EXISTS idx_allocations_user ON ai_experiment_allocations(user_id, experiment_id);
-- SEED DATA: Experimento de Ejemplo para Dropout Prediction
WITH new_exp AS (
    INSERT INTO ai_experiments (
            name,
            description,
            target_model_name,
            status,
            start_date,
            primary_metric
        )
    VALUES (
            'Dropout Model v2 Rollout',
            'Comparación entre modelo lineal v1 (control) y deep learning v2 (variant)',
            'dropout_prediction',
            'active',
            CURRENT_TIMESTAMP,
            'accuracy'
        ) ON CONFLICT (name) DO NOTHING
    RETURNING id
)
INSERT INTO ai_experiment_variants (
        experiment_id,
        name,
        model_version,
        traffic_percentage,
        is_shadow_mode
    )
SELECT id,
    'Control (v1.0)',
    '1.0.0',
    50,
    FALSE
FROM new_exp
UNION ALL
SELECT id,
    'Challenger (v2.0)',
    '2.0.0-beta',
    50,
    FALSE
FROM new_exp;