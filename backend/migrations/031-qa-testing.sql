-- =====================================================
-- MIGRACIÓN: AI QA Testing (Semana 22)
-- Testing y QA de IA
-- Fecha: Enero 2026
-- =====================================================
-- Tabla de Golden Datasets
CREATE TABLE IF NOT EXISTS golden_datasets (
    id SERIAL PRIMARY KEY,
    dataset_name VARCHAR(100) UNIQUE NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    description TEXT,
    sample_count INTEGER DEFAULT 0,
    features TEXT [],
    labels TEXT [],
    expected_metrics JSONB DEFAULT '{}',
    version VARCHAR(20) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_golden_model ON golden_datasets(model_id);
CREATE INDEX IF NOT EXISTS idx_golden_active ON golden_datasets(is_active);
-- Tabla de Test Runs
CREATE TABLE IF NOT EXISTS qa_test_runs (
    id SERIAL PRIMARY KEY,
    run_id VARCHAR(100) UNIQUE NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    test_type VARCHAR(50) NOT NULL,
    -- probabilistic, golden_dataset, behavioral, bias, robustness, stress, e2e
    status VARCHAR(30) DEFAULT 'running',
    -- running, passed, failed, error
    results JSONB,
    summary JSONB,
    duration_ms INTEGER,
    triggered_by VARCHAR(100),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_testrun_model ON qa_test_runs(model_id);
CREATE INDEX IF NOT EXISTS idx_testrun_type ON qa_test_runs(test_type);
CREATE INDEX IF NOT EXISTS idx_testrun_status ON qa_test_runs(status);
CREATE INDEX IF NOT EXISTS idx_testrun_date ON qa_test_runs(started_at);
-- Tabla de Behavioral Tests Templates
CREATE TABLE IF NOT EXISTS behavioral_test_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(100) UNIQUE NOT NULL,
    test_type VARCHAR(50) NOT NULL,
    -- invariance, directional, minimum_functionality
    description TEXT,
    test_cases JSONB NOT NULL,
    expected_behavior TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_behavioral_type ON behavioral_test_templates(test_type);
-- Tabla de Bias Evaluations
CREATE TABLE IF NOT EXISTS bias_evaluations (
    id SERIAL PRIMARY KEY,
    model_id VARCHAR(100) NOT NULL,
    protected_attribute VARCHAR(50) NOT NULL,
    metric VARCHAR(50) NOT NULL,
    -- demographic_parity, equalized_odds, calibration
    disparity DECIMAL(6, 4),
    threshold DECIMAL(6, 4),
    groups JSONB,
    status VARCHAR(30),
    -- passed, warning, failed
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bias_model ON bias_evaluations(model_id);
CREATE INDEX IF NOT EXISTS idx_bias_attr ON bias_evaluations(protected_attribute);
CREATE INDEX IF NOT EXISTS idx_bias_status ON bias_evaluations(status);
-- Tabla de Fairness Reports
CREATE TABLE IF NOT EXISTS fairness_reports (
    id SERIAL PRIMARY KEY,
    model_id VARCHAR(100) NOT NULL,
    metrics JSONB NOT NULL,
    protected_attributes TEXT [],
    overall_status VARCHAR(30),
    recommendations TEXT [],
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_fairness_model ON fairness_reports(model_id);
-- Tabla de Stress Test Results
CREATE TABLE IF NOT EXISTS stress_test_results (
    id SERIAL PRIMARY KEY,
    model_id VARCHAR(100) NOT NULL,
    concurrent_requests INTEGER,
    avg_latency_ms INTEGER,
    p95_latency_ms INTEGER,
    p99_latency_ms INTEGER,
    error_rate DECIMAL(5, 2),
    throughput INTEGER,
    status VARCHAR(30),
    -- passed, degraded, failed
    tested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_stress_model ON stress_test_results(model_id);
CREATE INDEX IF NOT EXISTS idx_stress_date ON stress_test_results(tested_at);
-- Tabla de Quality Gates
CREATE TABLE IF NOT EXISTS quality_gates (
    id SERIAL PRIMARY KEY,
    gate_name VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    threshold DECIMAL(10, 4),
    comparison VARCHAR(20) DEFAULT 'gte',
    -- gte, lte, eq
    is_blocking BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabla de Quality Gate Evaluations
CREATE TABLE IF NOT EXISTS quality_gate_evaluations (
    id SERIAL PRIMARY KEY,
    model_id VARCHAR(100) NOT NULL,
    gate_id INTEGER REFERENCES quality_gates(id),
    actual_value DECIMAL(10, 4),
    threshold DECIMAL(10, 4),
    status VARCHAR(30),
    -- passed, blocked
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_qgate_model ON quality_gate_evaluations(model_id);
CREATE INDEX IF NOT EXISTS idx_qgate_status ON quality_gate_evaluations(status);
-- Tabla de Test Reports
CREATE TABLE IF NOT EXISTS qa_test_reports (
    id SERIAL PRIMARY KEY,
    model_id VARCHAR(100) NOT NULL,
    report_data JSONB NOT NULL,
    executive_summary JSONB,
    can_deploy BOOLEAN DEFAULT false,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_report_model ON qa_test_reports(model_id);
CREATE INDEX IF NOT EXISTS idx_report_deploy ON qa_test_reports(can_deploy);
-- Insertar Quality Gates por defecto
INSERT INTO quality_gates (
        gate_name,
        metric_name,
        threshold,
        comparison,
        is_blocking,
        description
    )
VALUES (
        'accuracy_gate',
        'accuracy',
        0.85,
        'gte',
        true,
        'Precisión mínima requerida'
    ),
    (
        'latency_gate',
        'latency_p95_ms',
        1000,
        'lte',
        true,
        'Latencia p95 máxima permitida'
    ),
    (
        'bias_gate',
        'max_disparity',
        0.10,
        'lte',
        true,
        'Disparidad máxima permitida'
    ),
    (
        'f1_gate',
        'f1_score',
        0.80,
        'gte',
        false,
        'F1 score recomendado'
    ) ON CONFLICT DO NOTHING;
-- Insertar Golden Datasets iniciales
INSERT INTO golden_datasets (
        dataset_name,
        model_id,
        sample_count,
        features,
        expected_metrics
    )
VALUES (
        'dropout_golden_v1',
        'dropout_predictor_v1',
        500,
        '{"attendance_rate", "avg_grade", "absences"}',
        '{"accuracy": 0.87, "f1": 0.82}'
    ),
    (
        'sentiment_golden_v1',
        'sentiment_analyzer_v1',
        300,
        '{"text", "source", "date"}',
        '{"accuracy": 0.85, "precision": 0.83}'
    ),
    (
        'recommendation_golden_v1',
        'recommendation_engine_v1',
        1000,
        '{"user_id", "content_id", "interaction"}',
        '{"precision_at_5": 0.65, "ndcg": 0.78}'
    ) ON CONFLICT (dataset_name) DO NOTHING;
-- Vista: Resumen de tests por modelo
CREATE OR REPLACE VIEW v_test_summary_by_model AS
SELECT model_id,
    COUNT(*) as total_runs,
    COUNT(*) FILTER (
        WHERE status = 'passed'
    ) as passed,
    COUNT(*) FILTER (
        WHERE status = 'failed'
    ) as failed,
    AVG(duration_ms) as avg_duration_ms,
    MAX(started_at) as last_run
FROM qa_test_runs
WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY model_id
ORDER BY last_run DESC;
-- Vista: Quality Gate Status por modelo
CREATE OR REPLACE VIEW v_quality_gate_status AS
SELECT qge.model_id,
    qg.gate_name,
    qge.actual_value,
    qge.threshold,
    qge.status,
    qge.evaluated_at
FROM quality_gate_evaluations qge
    JOIN quality_gates qg ON qg.id = qge.gate_id
WHERE qge.evaluated_at = (
        SELECT MAX(evaluated_at)
        FROM quality_gate_evaluations
        WHERE model_id = qge.model_id
    );
-- Comentarios
COMMENT ON TABLE golden_datasets IS 'Datasets de referencia para pruebas de regresión';
COMMENT ON TABLE qa_test_runs IS 'Ejecuciones de pruebas de QA';
COMMENT ON TABLE behavioral_test_templates IS 'Templates de pruebas comportamentales';
COMMENT ON TABLE bias_evaluations IS 'Evaluaciones de sesgo por atributo';
COMMENT ON TABLE fairness_reports IS 'Reportes de fairness de modelos';
COMMENT ON TABLE stress_test_results IS 'Resultados de pruebas de estrés';
COMMENT ON TABLE quality_gates IS 'Definición de quality gates';
COMMENT ON TABLE quality_gate_evaluations IS 'Evaluaciones de quality gates';
COMMENT ON TABLE qa_test_reports IS 'Reportes completos de QA';