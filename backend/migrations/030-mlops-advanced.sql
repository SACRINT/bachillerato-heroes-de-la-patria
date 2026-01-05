-- =====================================================
-- MIGRACIÓN: MLOps Avanzado (Semana 21)
-- Infraestructura de MLOps Madura
-- Fecha: Enero 2026
-- =====================================================
-- Tabla de Feature Store
CREATE TABLE IF NOT EXISTS feature_store (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    -- student, teacher, course, group
    entity_id INTEGER NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    feature_value DECIMAL(15, 6),
    feature_type VARCHAR(30) DEFAULT 'float',
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    source VARCHAR(100),
    UNIQUE(entity_type, entity_id, feature_name)
);
CREATE INDEX IF NOT EXISTS idx_feature_entity ON feature_store(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_feature_name ON feature_store(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_expires ON feature_store(expires_at);
-- Tabla de Feature Definitions
CREATE TABLE IF NOT EXISTS feature_definitions (
    id SERIAL PRIMARY KEY,
    feature_name VARCHAR(100) UNIQUE NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    data_type VARCHAR(30) DEFAULT 'float',
    description TEXT,
    computation_sql TEXT,
    ttl_seconds INTEGER DEFAULT 3600,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_featdef_entity ON feature_definitions(entity_type);
-- Tabla de Model Registry
CREATE TABLE IF NOT EXISTS model_registry (
    id SERIAL PRIMARY KEY,
    model_id VARCHAR(100) UNIQUE NOT NULL,
    model_name VARCHAR(255) NOT NULL,
    version VARCHAR(20) NOT NULL,
    stage VARCHAR(30) DEFAULT 'development',
    -- development, staging, production, archived
    description TEXT,
    framework VARCHAR(50),
    -- sklearn, tensorflow, pytorch, custom
    artifact_path VARCHAR(500),
    metrics JSONB DEFAULT '{}',
    parameters JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    promoted_at TIMESTAMP,
    promoted_by TEXT []
);
CREATE INDEX IF NOT EXISTS idx_model_stage ON model_registry(stage);
CREATE INDEX IF NOT EXISTS idx_model_name ON model_registry(model_name);
-- Tabla de Canary Deployments
CREATE TABLE IF NOT EXISTS canary_deployments (
    id SERIAL PRIMARY KEY,
    deployment_id VARCHAR(100) UNIQUE NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    current_version VARCHAR(20),
    canary_version VARCHAR(20),
    traffic_current INTEGER DEFAULT 90,
    traffic_canary INTEGER DEFAULT 10,
    status VARCHAR(30) DEFAULT 'active',
    -- active, promoted, rolled_back, completed
    rollback_threshold DECIMAL(4, 3) DEFAULT 0.05,
    evaluation_period_minutes INTEGER DEFAULT 30,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    outcome VARCHAR(30) -- success, rollback, timeout
);
CREATE INDEX IF NOT EXISTS idx_canary_model ON canary_deployments(model_id);
CREATE INDEX IF NOT EXISTS idx_canary_status ON canary_deployments(status);
-- Tabla de Drift Checks
CREATE TABLE IF NOT EXISTS drift_checks (
    id SERIAL PRIMARY KEY,
    model_id VARCHAR(100) NOT NULL,
    psi DECIMAL(10, 6),
    kl_divergence DECIMAL(10, 6),
    chi2_pvalue DECIMAL(10, 6),
    drift_detected BOOLEAN DEFAULT false,
    action_taken VARCHAR(50),
    -- none, alert, retrain
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_drift_model ON drift_checks(model_id);
CREATE INDEX IF NOT EXISTS idx_drift_detected ON drift_checks(drift_detected);
CREATE INDEX IF NOT EXISTS idx_drift_date ON drift_checks(checked_at);
-- Tabla de Retraining Jobs
CREATE TABLE IF NOT EXISTS retraining_jobs (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(100) UNIQUE NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    reason VARCHAR(100),
    -- drift, scheduled, manual, performance_degradation
    status VARCHAR(30) DEFAULT 'queued',
    -- queued, running, completed, failed
    pipeline_steps JSONB DEFAULT '[]',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    new_model_version VARCHAR(20),
    metrics_before JSONB,
    metrics_after JSONB,
    triggered_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_retrain_model ON retraining_jobs(model_id);
CREATE INDEX IF NOT EXISTS idx_retrain_status ON retraining_jobs(status);
-- Tabla de Governance Requests
CREATE TABLE IF NOT EXISTS governance_requests (
    id SERIAL PRIMARY KEY,
    request_id VARCHAR(100) UNIQUE NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    request_type VARCHAR(50) DEFAULT 'deployment',
    -- deployment, access, modification
    requested_by VARCHAR(100) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending',
    -- pending, approved, rejected, expired
    required_approvers TEXT [],
    min_approvals INTEGER DEFAULT 2,
    current_approvals JSONB DEFAULT '[]',
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gov_model ON governance_requests(model_id);
CREATE INDEX IF NOT EXISTS idx_gov_status ON governance_requests(status);
-- Tabla de Regression Tests
CREATE TABLE IF NOT EXISTS regression_test_runs (
    id SERIAL PRIMARY KEY,
    model_id VARCHAR(100) NOT NULL,
    run_id VARCHAR(100) UNIQUE NOT NULL,
    tests JSONB NOT NULL,
    summary JSONB,
    overall_status VARCHAR(30),
    -- passed, failed
    can_deploy BOOLEAN DEFAULT false,
    run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_regtest_model ON regression_test_runs(model_id);
CREATE INDEX IF NOT EXISTS idx_regtest_status ON regression_test_runs(overall_status);
-- Tabla de Security Scans
CREATE TABLE IF NOT EXISTS security_scans (
    id SERIAL PRIMARY KEY,
    image_tag VARCHAR(255) NOT NULL,
    vulnerabilities JSONB DEFAULT '{}',
    dependencies JSONB DEFAULT '{}',
    recommendations TEXT [],
    passes_policy BOOLEAN DEFAULT true,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_scan_image ON security_scans(image_tag);
CREATE INDEX IF NOT EXISTS idx_scan_policy ON security_scans(passes_policy);
-- Insertar modelos iniciales en registry
INSERT INTO model_registry (model_id, model_name, version, stage, metrics)
VALUES (
        'dropout_predictor_v1',
        'Predictor de Deserción',
        '1.0.0',
        'production',
        '{"accuracy": 0.87, "f1": 0.82, "auc": 0.91}'
    ),
    (
        'sentiment_analyzer_v1',
        'Analizador de Sentimiento',
        '1.0.0',
        'production',
        '{"accuracy": 0.85, "precision": 0.83, "recall": 0.86}'
    ),
    (
        'recommendation_engine_v1',
        'Motor de Recomendaciones',
        '1.0.0',
        'production',
        '{"ndcg": 0.78, "map": 0.72}'
    ),
    (
        'tutor_nlp_v1',
        'NLP Tutor IA',
        '1.0.0',
        'production',
        '{"bleu": 0.45, "coherence": 0.82}'
    ) ON CONFLICT (model_id) DO NOTHING;
-- Vista: Modelos en producción
CREATE OR REPLACE VIEW v_production_models AS
SELECT model_id,
    model_name,
    version,
    metrics,
    created_at,
    promoted_at
FROM model_registry
WHERE stage = 'production'
ORDER BY promoted_at DESC;
-- Vista: Drift histórico
CREATE OR REPLACE VIEW v_drift_history AS
SELECT model_id,
    DATE_TRUNC('day', checked_at)::DATE as check_date,
    AVG(psi) as avg_psi,
    AVG(kl_divergence) as avg_kl,
    SUM(
        CASE
            WHEN drift_detected THEN 1
            ELSE 0
        END
    ) as drift_count
FROM drift_checks
WHERE checked_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY model_id,
    DATE_TRUNC('day', checked_at)
ORDER BY check_date DESC;
-- Comentarios
COMMENT ON TABLE feature_store IS 'Feature Store centralizado para entidades';
COMMENT ON TABLE feature_definitions IS 'Definiciones de features disponibles';
COMMENT ON TABLE model_registry IS 'Registro central de modelos ML';
COMMENT ON TABLE canary_deployments IS 'Deployments canary activos';
COMMENT ON TABLE drift_checks IS 'Historial de verificaciones de drift';
COMMENT ON TABLE retraining_jobs IS 'Jobs de reentrenamiento de modelos';
COMMENT ON TABLE governance_requests IS 'Solicitudes de aprobación de governance';
COMMENT ON TABLE regression_test_runs IS 'Ejecuciones de pruebas de regresión';
COMMENT ON TABLE security_scans IS 'Escaneos de seguridad de imágenes';