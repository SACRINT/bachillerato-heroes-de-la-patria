-- =====================================================
-- MIGRACIÓN: FinOps (Semana 30)
-- Optimización de Costos
-- Fecha: Enero 2026
-- Fase 5: Consolidación, Ética y Futuro
-- =====================================================
-- Tabla de snapshots de costos
CREATE TABLE IF NOT EXISTS cost_snapshots (
    id SERIAL PRIMARY KEY,
    snapshot_id VARCHAR(100) UNIQUE NOT NULL,
    period VARCHAR(20) NOT NULL,
    -- daily, weekly, monthly
    snapshot_date DATE NOT NULL,
    total_cost DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    breakdown JSONB NOT NULL,
    by_department JSONB,
    trends JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cost_period ON cost_snapshots(period);
CREATE INDEX IF NOT EXISTS idx_cost_date ON cost_snapshots(snapshot_date);
-- Tabla de presupuestos por departamento
CREATE TABLE IF NOT EXISTS department_budgets (
    id SERIAL PRIMARY KEY,
    department VARCHAR(100) NOT NULL,
    fiscal_year VARCHAR(10) NOT NULL,
    quarter VARCHAR(5) NOT NULL,
    monthly_budget DECIMAL(12, 2) NOT NULL,
    ytd_budget DECIMAL(12, 2),
    ytd_spent DECIMAL(12, 2) DEFAULT 0,
    utilization_rate DECIMAL(5, 4),
    status VARCHAR(30) DEFAULT 'on_track',
    -- on_track, under_budget, at_limit, over_budget
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(department, fiscal_year, quarter)
);
CREATE INDEX IF NOT EXISTS idx_budget_dept ON department_budgets(department);
CREATE INDEX IF NOT EXISTS idx_budget_year ON department_budgets(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_budget_status ON department_budgets(status);
-- Tabla de alertas de presupuesto
CREATE TABLE IF NOT EXISTS budget_alerts (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    -- warning, critical, info
    threshold DECIMAL(5, 4) NOT NULL,
    current_value DECIMAL(5, 4),
    message TEXT,
    status VARCHAR(30) DEFAULT 'active',
    -- active, acknowledged, resolved
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    acknowledged_by VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS idx_alert_dept ON budget_alerts(department);
CREATE INDEX IF NOT EXISTS idx_alert_type ON budget_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alert_status ON budget_alerts(status);
-- Tabla de recursos no utilizados
CREATE TABLE IF NOT EXISTS unused_resources (
    id SERIAL PRIMARY KEY,
    resource_id VARCHAR(100) UNIQUE NOT NULL,
    resource_name VARCHAR(200) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    -- compute, storage, database, memory
    provider VARCHAR(100),
    monthly_cost DECIMAL(10, 2),
    last_used TIMESTAMP,
    utilization DECIMAL(5, 4),
    recommendation TEXT,
    potential_savings DECIMAL(10, 2),
    status VARCHAR(30) DEFAULT 'identified',
    -- identified, reviewed, action_taken, resolved
    identified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_unused_type ON unused_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_unused_status ON unused_resources(status);
CREATE INDEX IF NOT EXISTS idx_unused_savings ON unused_resources(potential_savings);
-- Tabla de métricas de caching
CREATE TABLE IF NOT EXISTS cache_metrics (
    id SERIAL PRIMARY KEY,
    metric_date DATE NOT NULL,
    endpoint VARCHAR(200),
    cache_hit_rate DECIMAL(5, 4),
    cache_miss_rate DECIMAL(5, 4),
    requests_count INTEGER,
    avg_latency_saved_ms INTEGER,
    monthly_savings DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cache_date ON cache_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_cache_endpoint ON cache_metrics(endpoint);
-- Tabla de costos de modelos AI
CREATE TABLE IF NOT EXISTS ai_model_costs (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    period VARCHAR(20) NOT NULL,
    period_date DATE NOT NULL,
    total_requests INTEGER,
    total_cost DECIMAL(10, 2),
    avg_latency_ms INTEGER,
    accuracy DECIMAL(5, 4),
    cost_per_request DECIMAL(10, 6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_model_cost_name ON ai_model_costs(model_name);
CREATE INDEX IF NOT EXISTS idx_model_cost_date ON ai_model_costs(period_date);
-- Tabla de ROI por funcionalidad
CREATE TABLE IF NOT EXISTS feature_roi (
    id SERIAL PRIMARY KEY,
    feature_name VARCHAR(100) NOT NULL,
    period VARCHAR(20) NOT NULL,
    monthly_cost DECIMAL(10, 2),
    monthly_value DECIMAL(12, 2),
    roi_percentage DECIMAL(10, 2),
    status VARCHAR(30),
    -- high_value, medium_value, low_value
    metrics JSONB,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_roi_feature ON feature_roi(feature_name);
CREATE INDEX IF NOT EXISTS idx_roi_status ON feature_roi(status);
-- Tabla de reportes de costos
CREATE TABLE IF NOT EXISTS cost_reports (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(100) UNIQUE NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    -- weekly, monthly, quarterly
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_spend DECIMAL(12, 2),
    budget_utilization DECIMAL(5, 4),
    potential_savings DECIMAL(10, 2),
    alerts JSONB,
    recommendations TEXT [],
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_report_type ON cost_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_report_date ON cost_reports(generated_at);
-- Tabla de ahorros validados
CREATE TABLE IF NOT EXISTS validated_savings (
    id SERIAL PRIMARY KEY,
    period VARCHAR(20) NOT NULL,
    period_date DATE NOT NULL,
    target_savings DECIMAL(10, 2),
    actual_savings DECIMAL(10, 2),
    achievement_rate DECIMAL(5, 2),
    savings_by_category JSONB,
    status VARCHAR(30),
    -- on_track, behind, exceeded
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_savings_period ON validated_savings(period);
CREATE INDEX IF NOT EXISTS idx_savings_status ON validated_savings(status);
-- Tabla de proyecciones de costos
CREATE TABLE IF NOT EXISTS cost_forecasts (
    id SERIAL PRIMARY KEY,
    forecast_date DATE NOT NULL,
    current_monthly_cost DECIMAL(10, 2),
    growth_rate DECIMAL(5, 4),
    forecast_data JSONB NOT NULL,
    assumptions TEXT [],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_forecast_date ON cost_forecasts(forecast_date);
-- Insertar presupuestos iniciales
INSERT INTO department_budgets (
        department,
        fiscal_year,
        quarter,
        monthly_budget,
        ytd_budget,
        ytd_spent,
        utilization_rate,
        status
    )
VALUES (
        'academico',
        '2026',
        'Q1',
        400.00,
        1200.00,
        380.00,
        0.32,
        'on_track'
    ),
    (
        'administrativo',
        '2026',
        'Q1',
        200.00,
        600.00,
        167.50,
        0.28,
        'under_budget'
    ),
    (
        'tecnologia',
        '2026',
        'Q1',
        200.00,
        600.00,
        200.00,
        0.33,
        'on_track'
    ),
    (
        'desarrollo',
        '2026',
        'Q1',
        150.00,
        450.00,
        100.00,
        0.22,
        'under_budget'
    ) ON CONFLICT (department, fiscal_year, quarter) DO NOTHING;
-- Vista: Resumen de costos actuales
CREATE OR REPLACE VIEW v_current_cost_summary AS
SELECT SUM(monthly_budget) as total_monthly_budget,
    SUM(ytd_spent) as total_ytd_spent,
    AVG(utilization_rate) as avg_utilization,
    COUNT(*) FILTER (
        WHERE status = 'over_budget'
    ) as departments_over_budget
FROM department_budgets
WHERE fiscal_year = EXTRACT(
        YEAR
        FROM CURRENT_DATE
    )::TEXT;
-- Vista: Top ahorros potenciales
CREATE OR REPLACE VIEW v_top_savings_opportunities AS
SELECT resource_name,
    resource_type,
    monthly_cost,
    potential_savings,
    recommendation
FROM unused_resources
WHERE status = 'identified'
ORDER BY potential_savings DESC
LIMIT 10;
-- Comentarios
COMMENT ON TABLE cost_snapshots IS 'Snapshots de costos por período';
COMMENT ON TABLE department_budgets IS 'Presupuestos por departamento';
COMMENT ON TABLE budget_alerts IS 'Alertas de presupuesto';
COMMENT ON TABLE unused_resources IS 'Recursos no utilizados identificados';
COMMENT ON TABLE cache_metrics IS 'Métricas de caching';
COMMENT ON TABLE ai_model_costs IS 'Costos de modelos de IA';
COMMENT ON TABLE feature_roi IS 'ROI por funcionalidad';
COMMENT ON TABLE cost_reports IS 'Reportes de costos generados';
COMMENT ON TABLE validated_savings IS 'Ahorros validados';
COMMENT ON TABLE cost_forecasts IS 'Proyecciones de costos';