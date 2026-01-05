-- MIGRACION Year 2 Optimization (Semana 45)
-- Optimizacion Avanzada
CREATE TABLE IF NOT EXISTS ai_model_optimizations (
    id SERIAL PRIMARY KEY,
    optimization_id VARCHAR(100) UNIQUE NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    baseline_accuracy DECIMAL(5, 4),
    optimized_accuracy DECIMAL(5, 4),
    improvement VARCHAR(20),
    techniques TEXT [],
    status VARCHAR(30) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS database_optimizations (
    id SERIAL PRIMARY KEY,
    optimization_id VARCHAR(100) UNIQUE NOT NULL,
    area VARCHAR(100) NOT NULL,
    before_value VARCHAR(50),
    after_value VARCHAR(50),
    improvement VARCHAR(50),
    status VARCHAR(30) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS infrastructure_optimizations (
    id SERIAL PRIMARY KEY,
    optimization_id VARCHAR(100) UNIQUE NOT NULL,
    component VARCHAR(100) NOT NULL,
    improvement JSONB,
    cost_savings VARCHAR(20),
    status VARCHAR(30) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS api_optimizations (
    id SERIAL PRIMARY KEY,
    optimization_id VARCHAR(100) UNIQUE NOT NULL,
    endpoints_total INTEGER,
    endpoints_optimized INTEGER,
    latency_before VARCHAR(20),
    latency_after VARCHAR(20),
    throughput_increase VARCHAR(20),
    techniques TEXT [],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_amo_model ON ai_model_optimizations(model_name);
CREATE INDEX IF NOT EXISTS idx_dbo_area ON database_optimizations(area);
CREATE INDEX IF NOT EXISTS idx_io_component ON infrastructure_optimizations(component);
COMMENT ON TABLE ai_model_optimizations IS 'Optimizaciones de modelos AI';
COMMENT ON TABLE database_optimizations IS 'Optimizaciones de base de datos';
COMMENT ON TABLE infrastructure_optimizations IS 'Optimizaciones de infraestructura';
COMMENT ON TABLE api_optimizations IS 'Optimizaciones de API';