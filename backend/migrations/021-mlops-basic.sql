-- =====================================================
-- MIGRACIÓN: MLOps Básico (Semana 11)
-- Fecha: Diciembre 2025
-- =====================================================
-- Tabla de experimentos de ML
CREATE TABLE IF NOT EXISTS ai_experiments (
    id SERIAL PRIMARY KEY,
    experiment_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    run_id VARCHAR(100),
    parameters JSONB DEFAULT '{}',
    metrics JSONB DEFAULT '{}',
    artifacts JSONB DEFAULT '[]',
    tags TEXT [] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'running',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_experiments_name ON ai_experiments(name);
CREATE INDEX IF NOT EXISTS idx_experiments_status ON ai_experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiments_date ON ai_experiments(created_at);
-- Tabla de alertas de MLOps
CREATE TABLE IF NOT EXISTS mlops_alerts (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    source VARCHAR(100) DEFAULT 'mlops',
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by VARCHAR(100),
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON mlops_alerts(acknowledged)
WHERE acknowledged = FALSE;
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON mlops_alerts(severity);
-- Tabla de versiones de prompts
CREATE TABLE IF NOT EXISTS prompt_versions (
    id SERIAL PRIMARY KEY,
    prompt_id VARCHAR(100) NOT NULL,
    version VARCHAR(20) NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    content TEXT,
    reason TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(prompt_id, version)
);
CREATE INDEX IF NOT EXISTS idx_prompt_versions ON prompt_versions(prompt_id);
-- Tabla de backups de base vectorial
CREATE TABLE IF NOT EXISTS vector_db_backups (
    id SERIAL PRIMARY KEY,
    backup_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'in_progress',
    size_bytes BIGINT,
    location TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    error TEXT
);
-- Tabla de métricas de drift
CREATE TABLE IF NOT EXISTS model_drift_logs (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    drift_score DECIMAL(5, 4),
    has_drift BOOLEAN DEFAULT FALSE,
    severity VARCHAR(20),
    baseline_metrics JSONB,
    current_metrics JSONB,
    drifts JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_drift_model ON model_drift_logs(model_name);
CREATE INDEX IF NOT EXISTS idx_drift_detected ON model_drift_logs(has_drift)
WHERE has_drift = TRUE;
-- Tabla de programación de tareas
CREATE TABLE IF NOT EXISTS mlops_schedules (
    id SERIAL PRIMARY KEY,
    task_name VARCHAR(100) UNIQUE NOT NULL,
    cron_expression VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    last_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Insertar tareas programadas por defecto
INSERT INTO mlops_schedules (task_name, cron_expression, enabled, next_run)
VALUES (
        'weekly_reindex',
        '0 3 * * 0',
        true,
        NOW() + INTERVAL '7 days'
    ),
    (
        'daily_backup',
        '0 2 * * *',
        true,
        NOW() + INTERVAL '1 day'
    ),
    (
        'drift_detection',
        '0 */6 * * *',
        true,
        NOW() + INTERVAL '6 hours'
    ) ON CONFLICT (task_name) DO NOTHING;
-- Comentarios
COMMENT ON TABLE ai_experiments IS 'Tracking de experimentos de ML (MLflow-style)';
COMMENT ON TABLE mlops_alerts IS 'Alertas del sistema MLOps';
COMMENT ON TABLE prompt_versions IS 'Historial de versiones de prompts';
COMMENT ON TABLE vector_db_backups IS 'Registro de backups de base vectorial';
COMMENT ON TABLE model_drift_logs IS 'Logs de detección de drift en modelos';
COMMENT ON TABLE mlops_schedules IS 'Programación de tareas automatizadas';