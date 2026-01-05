-- =====================================================
-- MIGRACIÓN: Year 2 Iteration (Semana 42)
-- Iteración sobre Modelos Existentes
-- Fecha: Enero 2026
-- Fase 6: Año 2
-- =====================================================
-- Tabla de versiones de modelos
CREATE TABLE IF NOT EXISTS model_versions (
    id SERIAL PRIMARY KEY,
    version_id VARCHAR(100) UNIQUE NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    version VARCHAR(20) NOT NULL,
    status VARCHAR(30) DEFAULT 'created',
    algorithm VARCHAR(100),
    hyperparameters JSONB,
    features TEXT [],
    changelog TEXT,
    parent_version VARCHAR(20),
    accuracy DECIMAL(5, 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deployed_at TIMESTAMP,
    UNIQUE(model_name, version)
);
CREATE INDEX IF NOT EXISTS idx_mv_model ON model_versions(model_name);
CREATE INDEX IF NOT EXISTS idx_mv_status ON model_versions(status);
-- Tabla de experimentos A/B
CREATE TABLE IF NOT EXISTS ab_experiments (
    id SERIAL PRIMARY KEY,
    experiment_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    status VARCHAR(30) DEFAULT 'created',
    control_version VARCHAR(20),
    treatment_version VARCHAR(20),
    control_traffic INTEGER DEFAULT 50,
    treatment_traffic INTEGER DEFAULT 50,
    metric VARCHAR(100),
    min_sample_size INTEGER,
    confidence DECIMAL(4, 3),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    results JSONB
);
CREATE INDEX IF NOT EXISTS idx_abe_status ON ab_experiments(status);
-- Tabla de variantes de experimento
CREATE TABLE IF NOT EXISTS experiment_variants (
    id SERIAL PRIMARY KEY,
    experiment_id VARCHAR(100) NOT NULL,
    variant_id VARCHAR(50) NOT NULL,
    model_version VARCHAR(20),
    traffic_percent INTEGER,
    samples INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    accuracy DECIMAL(5, 4),
    latency_p50 INTEGER,
    error_rate DECIMAL(5, 4),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ev_experiment ON experiment_variants(experiment_id);
-- Tabla de búsquedas de hiperparámetros
CREATE TABLE IF NOT EXISTS hyperparameter_searches (
    id SERIAL PRIMARY KEY,
    search_id VARCHAR(100) UNIQUE NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    method VARCHAR(50),
    iterations INTEGER,
    search_space JSONB,
    best_params JSONB,
    best_score DECIMAL(5, 4),
    search_time VARCHAR(50),
    convergence_iteration INTEGER,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_hps_model ON hyperparameter_searches(model_name);
-- Tabla de análisis de importancia de features
CREATE TABLE IF NOT EXISTS feature_importance_analysis (
    id SERIAL PRIMARY KEY,
    analysis_id VARCHAR(100) UNIQUE NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    method VARCHAR(50),
    top_features JSONB,
    feature_interactions JSONB,
    recommended_removals TEXT [],
    recommended_additions TEXT [],
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_fia_model ON feature_importance_analysis(model_name);
-- Tabla de configuración de aprendizaje continuo
CREATE TABLE IF NOT EXISTS continuous_learning_configs (
    id SERIAL PRIMARY KEY,
    config_id VARCHAR(100) UNIQUE NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    trigger_type VARCHAR(50),
    threshold DECIMAL(5, 4),
    min_data_points INTEGER,
    retrain_frequency VARCHAR(30),
    auto_promote BOOLEAN DEFAULT false,
    validation_strategy VARCHAR(50),
    data_pipeline JSONB,
    notifications JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_clc_model ON continuous_learning_configs(model_name);
-- Tabla de historial de reentrenamiento
CREATE TABLE IF NOT EXISTS retrain_history (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    retrain_date TIMESTAMP NOT NULL,
    reason VARCHAR(50),
    previous_accuracy DECIMAL(5, 4),
    new_accuracy DECIMAL(5, 4),
    data_points_used INTEGER,
    duration VARCHAR(50),
    success BOOLEAN DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_rh_model ON retrain_history(model_name);
-- Tabla de ensembles
CREATE TABLE IF NOT EXISTS model_ensembles (
    id SERIAL PRIMARY KEY,
    ensemble_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    strategy VARCHAR(50),
    models JSONB NOT NULL,
    ensemble_accuracy DECIMAL(5, 4),
    best_single_model_accuracy DECIMAL(5, 4),
    diversity_score VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabla de configuración de detección de drift
CREATE TABLE IF NOT EXISTS drift_detection_configs (
    id SERIAL PRIMARY KEY,
    config_id VARCHAR(100) UNIQUE NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    methods JSONB,
    check_interval VARCHAR(30),
    alert_threshold VARCHAR(20),
    auto_retrain BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ddc_model ON drift_detection_configs(model_name);
-- Tabla de reportes de drift
CREATE TABLE IF NOT EXISTS drift_reports (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    report_date TIMESTAMP NOT NULL,
    overall_drift_score DECIMAL(5, 4),
    status VARCHAR(30),
    feature_drift JSONB,
    concept_drift JSONB,
    recommendation TEXT
);
CREATE INDEX IF NOT EXISTS idx_dr_model ON drift_reports(model_name);
-- Tabla de benchmarks
CREATE TABLE IF NOT EXISTS model_benchmarks (
    id SERIAL PRIMARY KEY,
    benchmark_id VARCHAR(100) UNIQUE NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    test_set_size INTEGER,
    accuracy DECIMAL(5, 4),
    precision_score DECIMAL(5, 4),
    recall DECIMAL(5, 4),
    f1_score DECIMAL(5, 4),
    auc DECIMAL(5, 4),
    log_loss DECIMAL(6, 4),
    latency_p50 INTEGER,
    latency_p90 INTEGER,
    latency_p99 INTEGER,
    throughput INTEGER,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mb_model ON model_benchmarks(model_name);
-- Vista: Modelos en producción
CREATE OR REPLACE VIEW v_production_models AS
SELECT model_name,
    version,
    accuracy,
    deployed_at
FROM model_versions
WHERE status = 'production'
ORDER BY deployed_at DESC;
-- Vista: Experimentos activos
CREATE OR REPLACE VIEW v_active_experiments AS
SELECT experiment_id,
    name,
    control_version,
    treatment_version,
    started_at
FROM ab_experiments
WHERE status = 'running';
-- Vista: Últimos benchmarks
CREATE OR REPLACE VIEW v_latest_benchmarks AS
SELECT DISTINCT ON (model_name) model_name,
    accuracy,
    f1_score,
    latency_p50,
    executed_at
FROM model_benchmarks
ORDER BY model_name,
    executed_at DESC;
-- Comentarios
COMMENT ON TABLE model_versions IS 'Versiones de modelos ML';
COMMENT ON TABLE ab_experiments IS 'Experimentos A/B';
COMMENT ON TABLE experiment_variants IS 'Variantes de experimentos';
COMMENT ON TABLE hyperparameter_searches IS 'Búsquedas de hiperparámetros';
COMMENT ON TABLE feature_importance_analysis IS 'Análisis de importancia de features';
COMMENT ON TABLE continuous_learning_configs IS 'Configuración de aprendizaje continuo';
COMMENT ON TABLE retrain_history IS 'Historial de reentrenamiento';
COMMENT ON TABLE model_ensembles IS 'Ensembles de modelos';
COMMENT ON TABLE drift_detection_configs IS 'Configuración de detección de drift';
COMMENT ON TABLE drift_reports IS 'Reportes de drift';
COMMENT ON TABLE model_benchmarks IS 'Benchmarks de modelos';