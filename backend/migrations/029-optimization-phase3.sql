-- =====================================================
-- MIGRACIÓN: Optimization & Phase 3 Evaluation (Semana 20)
-- Fecha: Enero 2026
-- =====================================================
-- Tabla de snapshots de performance
CREATE TABLE IF NOT EXISTS performance_snapshots (
    id SERIAL PRIMARY KEY,
    snapshot_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    module_id VARCHAR(50) NOT NULL,
    module_name VARCHAR(100),
    avg_latency_ms INTEGER,
    p95_latency_ms INTEGER,
    success_rate DECIMAL(5, 2),
    request_count INTEGER,
    error_count INTEGER,
    status VARCHAR(30) DEFAULT 'operational'
);
CREATE INDEX IF NOT EXISTS idx_perf_date ON performance_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_perf_module ON performance_snapshots(module_id);
-- Tabla de optimizaciones de hiperparámetros
CREATE TABLE IF NOT EXISTS hyperparameter_optimizations (
    id SERIAL PRIMARY KEY,
    model_id VARCHAR(100) NOT NULL,
    current_params JSONB,
    optimized_params JSONB,
    expected_improvement JSONB,
    applied BOOLEAN DEFAULT false,
    applied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_hyper_model ON hyperparameter_optimizations(model_id);
-- Tabla de análisis de costos
CREATE TABLE IF NOT EXISTS cost_analyses (
    id SERIAL PRIMARY KEY,
    analysis_date DATE UNIQUE NOT NULL,
    compute_cost DECIMAL(10, 2),
    storage_cost DECIMAL(10, 2),
    ai_api_cost DECIMAL(10, 2),
    database_cost DECIMAL(10, 2),
    networking_cost DECIMAL(10, 2),
    total_cost DECIMAL(10, 2),
    optimizations_suggested JSONB DEFAULT '[]',
    projected_savings DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cost_date ON cost_analyses(analysis_date);
-- Tabla de auditorías de código
CREATE TABLE IF NOT EXISTS code_audits (
    id SERIAL PRIMARY KEY,
    audit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modules_audited INTEGER,
    total_files INTEGER,
    total_lines INTEGER,
    avg_complexity DECIMAL(5, 2),
    test_coverage DECIMAL(5, 2),
    findings JSONB DEFAULT '[]',
    security_issues JSONB DEFAULT '[]',
    recommendations TEXT []
);
CREATE INDEX IF NOT EXISTS idx_audit_date ON code_audits(audit_date);
-- Tabla de tests de escalabilidad
CREATE TABLE IF NOT EXISTS scalability_tests (
    id SERIAL PRIMARY KEY,
    test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    concurrent_users INTEGER,
    requests_per_second INTEGER,
    avg_response_time_ms INTEGER,
    error_rate DECIMAL(5, 2),
    status VARCHAR(30),
    -- pass, warning, fail
    bottlenecks JSONB DEFAULT '[]',
    recommendations TEXT []
);
CREATE INDEX IF NOT EXISTS idx_scale_date ON scalability_tests(test_date);
-- Tabla de evaluaciones de deuda técnica
CREATE TABLE IF NOT EXISTS technical_debt_evaluations (
    id SERIAL PRIMARY KEY,
    evaluation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    overall_score VARCHAR(5),
    debt_categories JSONB NOT NULL,
    total_estimated_hours INTEGER,
    prioritized_actions TEXT [],
    risk_assessment TEXT
);
CREATE INDEX IF NOT EXISTS idx_debt_date ON technical_debt_evaluations(evaluation_date);
-- Tabla de cierres de fase
CREATE TABLE IF NOT EXISTS phase_closures (
    id SERIAL PRIMARY KEY,
    phase_number INTEGER NOT NULL,
    phase_title VARCHAR(255),
    period_weeks VARCHAR(20),
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modules_delivered INTEGER,
    endpoints_created INTEGER,
    tables_created INTEGER,
    key_achievements TEXT [],
    metrics JSONB,
    next_phase_info JSONB
);
CREATE INDEX IF NOT EXISTS idx_phase_number ON phase_closures(phase_number);
-- Insertar cierre de Fase 3
INSERT INTO phase_closures (
        phase_number,
        phase_title,
        period_weeks,
        modules_delivered,
        endpoints_created,
        tables_created,
        key_achievements,
        metrics,
        next_phase_info
    )
VALUES (
        3,
        'Funcionalidades Avanzadas y Personalización',
        '9-20',
        11,
        120,
        45,
        ARRAY [
        'Sistema de analítica descriptiva inteligente',
        'Tutor IA con enfoque pedagógico',
        'Predicción de deserción escolar',
        'Análisis de sentimiento institucional',
        'Sistema de recomendación de contenidos',
        'Automatización administrativa (RPA)',
        'Chatbot multimodal',
        'Rutas de aprendizaje personalizadas',
        'Suite de herramientas para docentes'
    ],
        '{"hoursOfDevelopment": 480, "testCoverage": "72%", "documentationComplete": "85%", "userSatisfaction": "4.2/5"}',
        '{"phase": 4, "title": "MLOps Avanzado y Escalamiento", "startWeek": 21, "focus": "Infraestructura ML madura, Feature Stores, Canary Deployments"}'
    ) ON CONFLICT DO NOTHING;
-- Vista: Tendencia de performance
CREATE OR REPLACE VIEW v_performance_trend AS
SELECT DATE_TRUNC('day', snapshot_date)::DATE as day,
    AVG(avg_latency_ms) as avg_latency,
    AVG(success_rate) as avg_success_rate,
    SUM(request_count) as total_requests,
    SUM(error_count) as total_errors
FROM performance_snapshots
WHERE snapshot_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', snapshot_date)
ORDER BY day DESC;
-- Vista: Historial de costos
CREATE OR REPLACE VIEW v_cost_history AS
SELECT analysis_date,
    total_cost,
    projected_savings,
    LAG(total_cost) OVER (
        ORDER BY analysis_date
    ) as previous_cost,
    total_cost - LAG(total_cost) OVER (
        ORDER BY analysis_date
    ) as cost_change
FROM cost_analyses
ORDER BY analysis_date DESC
LIMIT 12;
-- Comentarios
COMMENT ON TABLE performance_snapshots IS 'Snapshots de performance de módulos IA';
COMMENT ON TABLE hyperparameter_optimizations IS 'Historial de optimizaciones de hiperparámetros';
COMMENT ON TABLE cost_analyses IS 'Análisis mensuales de costos';
COMMENT ON TABLE code_audits IS 'Auditorías de código';
COMMENT ON TABLE scalability_tests IS 'Tests de escalabilidad';
COMMENT ON TABLE technical_debt_evaluations IS 'Evaluaciones de deuda técnica';
COMMENT ON TABLE phase_closures IS 'Cierres de fases del proyecto';