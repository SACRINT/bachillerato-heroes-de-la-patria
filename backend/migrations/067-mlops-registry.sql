-- 067-mlops-registry.sql
-- Sistema de MLOps y Registro de Modelos (Semana 11)
-- 1. Registro de Modelos (Model Registry)
CREATE TABLE IF NOT EXISTS ai_model_registry (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL UNIQUE,
    -- ej: 'dropout_prediction_v1', 'vak_classifier'
    description TEXT,
    framework VARCHAR(50),
    -- 'tensorflow', 'pytorch', 'scikit-learn'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 2. Versiones de Modelos
CREATE TABLE IF NOT EXISTS ai_model_versions (
    id SERIAL PRIMARY KEY,
    model_id INTEGER REFERENCES ai_model_registry(id) ON DELETE CASCADE,
    version VARCHAR(20) NOT NULL,
    -- '1.0.0', '1.0.1-beta'
    -- Estado del Ciclo de Vida
    status VARCHAR(20) DEFAULT 'training',
    -- 'training', 'staging', 'production', 'archived'
    -- Artefactos
    artifact_uri VARCHAR(255),
    -- Ruta a S3/GCS o path local del modelo .h5/.pkl
    config_json JSONB DEFAULT '{}',
    -- Hiperparámetros
    -- Métricas clave snapshot
    accuracy FLOAT,
    f1_score FLOAT,
    latency_ms INTEGER,
    created_by INTEGER REFERENCES usuarios(id),
    -- Quién entrenó/registró
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(model_id, version)
);
-- 3. Logs de Entrenamiento y Experimentos
CREATE TABLE IF NOT EXISTS ml_training_logs (
    id SERIAL PRIMARY KEY,
    version_id INTEGER REFERENCES ai_model_versions(id) ON DELETE CASCADE,
    epoch INTEGER,
    loss FLOAT,
    accuracy FLOAT,
    val_loss FLOAT,
    val_accuracy FLOAT,
    duration_seconds INTEGER,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 4. Métricas de Producción (Drift Detection)
CREATE TABLE IF NOT EXISTS ai_production_metrics (
    id SERIAL PRIMARY KEY,
    version_id INTEGER REFERENCES ai_model_versions(id) ON DELETE CASCADE,
    window_start TIMESTAMP WITH TIME ZONE,
    window_end TIMESTAMP WITH TIME ZONE,
    request_count INTEGER DEFAULT 0,
    avg_latency_ms FLOAT,
    error_rate FLOAT,
    -- Drift detection
    feature_drift_score FLOAT,
    -- 0.0 a 1.0 (KL Divergence o similar)
    concept_drift_detected BOOLEAN DEFAULT FALSE,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_model_versions_status ON ai_model_versions(status);
CREATE INDEX IF NOT EXISTS idx_prod_metrics_version ON ai_production_metrics(version_id);
-- Seed Data: Registrar modelos base de Semanas 9 y 10
INSERT INTO ai_model_registry (model_name, description, framework)
VALUES (
        'vak_classifier',
        'Clasificador de estilo de aprendizaje (Visual, Auditivo, Kinestésico)',
        'scikit-learn'
    ),
    (
        'content_adapter',
        'Motor de recomendación de contenido adaptativo',
        'custom-heuristic'
    ) ON CONFLICT DO NOTHING;
-- Seed Version inicial para VAK
DO $$
DECLARE v_model_id INTEGER;
BEGIN
SELECT id INTO v_model_id
FROM ai_model_registry
WHERE model_name = 'vak_classifier';
INSERT INTO ai_model_versions (model_id, version, status, accuracy, config_json)
VALUES (
        v_model_id,
        '1.0.0',
        'production',
        0.85,
        '{"algorithm": "random_forest", "n_estimators": 100}'
    ) ON CONFLICT DO NOTHING;
END $$;