-- =====================================================
-- MIGRACIÓN: Scalability & Performance (Semana 23)
-- Escalabilidad y Performance
-- Fecha: Enero 2026
-- =====================================================
-- Tabla de eventos de auto-scaling
CREATE TABLE IF NOT EXISTS scaling_events (
    id SERIAL PRIMARY KEY,
    action VARCHAR(30) NOT NULL,
    -- scale_up, scale_down, none
    from_replicas INTEGER,
    to_replicas INTEGER,
    reason TEXT,
    trigger_metrics JSONB,
    triggered_by VARCHAR(50) DEFAULT 'auto',
    -- auto, manual
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_scaling_action ON scaling_events(action);
CREATE INDEX IF NOT EXISTS idx_scaling_date ON scaling_events(created_at);
-- Tabla de configuración de auto-scaling
CREATE TABLE IF NOT EXISTS autoscaling_config (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) UNIQUE NOT NULL,
    min_replicas INTEGER DEFAULT 2,
    max_replicas INTEGER DEFAULT 10,
    target_cpu DECIMAL(5, 2) DEFAULT 70,
    target_memory DECIMAL(5, 2) DEFAULT 80,
    scale_up_threshold DECIMAL(5, 2) DEFAULT 80,
    scale_down_threshold DECIMAL(5, 2) DEFAULT 40,
    cooldown_seconds INTEGER DEFAULT 300,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabla de optimizaciones de modelos
CREATE TABLE IF NOT EXISTS model_optimizations (
    id SERIAL PRIMARY KEY,
    model_id VARCHAR(100) NOT NULL,
    optimization_type VARCHAR(50) NOT NULL,
    -- onnx, quantization, pruning, tensorrt
    original_format VARCHAR(50),
    new_format VARCHAR(50),
    original_size_mb DECIMAL(10, 2),
    new_size_mb DECIMAL(10, 2),
    speedup_factor DECIMAL(5, 2),
    accuracy_impact DECIMAL(5, 4),
    status VARCHAR(30) DEFAULT 'pending',
    -- pending, processing, completed, failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_optim_model ON model_optimizations(model_id);
CREATE INDEX IF NOT EXISTS idx_optim_type ON model_optimizations(optimization_type);
-- Tabla de estadísticas de caché
CREATE TABLE IF NOT EXISTS cache_statistics (
    id SERIAL PRIMARY KEY,
    stats_date DATE UNIQUE NOT NULL,
    total_entries INTEGER,
    hits INTEGER DEFAULT 0,
    misses INTEGER DEFAULT 0,
    hit_rate DECIMAL(5, 4),
    memory_usage_mb DECIMAL(10, 2),
    evictions INTEGER DEFAULT 0,
    by_type JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cache_date ON cache_statistics(stats_date);
-- Tabla de resultados de load tests
CREATE TABLE IF NOT EXISTS load_test_results (
    id SERIAL PRIMARY KEY,
    test_id VARCHAR(100) UNIQUE NOT NULL,
    config JSONB NOT NULL,
    results JSONB NOT NULL,
    max_sustainable_users INTEGER,
    breaking_point INTEGER,
    peak_throughput INTEGER,
    recommendations TEXT [],
    run_by VARCHAR(100),
    run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_loadtest_date ON load_test_results(run_at);
-- Tabla de análisis de queries lentas
CREATE TABLE IF NOT EXISTS slow_query_analysis (
    id SERIAL PRIMARY KEY,
    query_hash VARCHAR(64) UNIQUE NOT NULL,
    query_pattern TEXT,
    avg_time_ms DECIMAL(10, 2),
    max_time_ms DECIMAL(10, 2),
    call_count INTEGER DEFAULT 0,
    recommendation TEXT,
    is_resolved BOOLEAN DEFAULT false,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_slowquery_time ON slow_query_analysis(avg_time_ms DESC);
-- Tabla de configuración de connection pool
CREATE TABLE IF NOT EXISTS connection_pool_config (
    id SERIAL PRIMARY KEY,
    pool_name VARCHAR(100) UNIQUE NOT NULL,
    min_connections INTEGER DEFAULT 5,
    max_connections INTEGER DEFAULT 50,
    idle_timeout_ms INTEGER DEFAULT 30000,
    connection_timeout_ms INTEGER DEFAULT 5000,
    acquire_timeout_ms INTEGER DEFAULT 10000,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabla de métricas de colas asíncronas
CREATE TABLE IF NOT EXISTS async_queue_metrics (
    id SERIAL PRIMARY KEY,
    metrics_date DATE NOT NULL,
    queue_name VARCHAR(100) NOT NULL,
    total_enqueued INTEGER DEFAULT 0,
    total_completed INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    avg_processing_ms DECIMAL(10, 2),
    max_queue_length INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(metrics_date, queue_name)
);
CREATE INDEX IF NOT EXISTS idx_queue_date ON async_queue_metrics(metrics_date);
CREATE INDEX IF NOT EXISTS idx_queue_name ON async_queue_metrics(queue_name);
-- Tabla de estado de alta disponibilidad
CREATE TABLE IF NOT EXISTS ha_status_snapshots (
    id SERIAL PRIMARY KEY,
    snapshot_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    primary_region VARCHAR(50),
    primary_status VARCHAR(30),
    primary_replicas INTEGER,
    secondary_region VARCHAR(50),
    secondary_status VARCHAR(30),
    secondary_replicas INTEGER,
    last_failover TIMESTAMP,
    failover_count_30d INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ha_snapshot ON ha_status_snapshots(snapshot_time);
-- Insertar configuración inicial
INSERT INTO autoscaling_config (
        service_name,
        min_replicas,
        max_replicas,
        target_cpu,
        target_memory
    )
VALUES ('inference_service', 2, 10, 70, 80),
    ('api_gateway', 2, 8, 60, 70),
    ('background_workers', 1, 5, 80, 85) ON CONFLICT (service_name) DO NOTHING;
INSERT INTO connection_pool_config (pool_name, min_connections, max_connections)
VALUES ('primary_db', 10, 100),
    ('replica_db', 5, 50),
    ('vector_db', 5, 30) ON CONFLICT (pool_name) DO NOTHING;
-- Vista: Tendencia de scaling
CREATE OR REPLACE VIEW v_scaling_trend AS
SELECT DATE_TRUNC('day', created_at)::DATE as day,
    COUNT(*) FILTER (
        WHERE action = 'scale_up'
    ) as scale_ups,
    COUNT(*) FILTER (
        WHERE action = 'scale_down'
    ) as scale_downs,
    MAX(to_replicas) as max_replicas_reached
FROM scaling_events
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC;
-- Vista: Performance de caché semanal
CREATE OR REPLACE VIEW v_cache_performance_weekly AS
SELECT DATE_TRUNC('week', stats_date)::DATE as week,
    AVG(hit_rate) as avg_hit_rate,
    AVG(memory_usage_mb) as avg_memory_mb,
    SUM(hits) as total_hits,
    SUM(misses) as total_misses
FROM cache_statistics
WHERE stats_date >= CURRENT_DATE - INTERVAL '12 weeks'
GROUP BY DATE_TRUNC('week', stats_date)
ORDER BY week DESC;
-- Comentarios
COMMENT ON TABLE scaling_events IS 'Historial de eventos de auto-scaling';
COMMENT ON TABLE autoscaling_config IS 'Configuración de auto-scaling por servicio';
COMMENT ON TABLE model_optimizations IS 'Registro de optimizaciones de modelos';
COMMENT ON TABLE cache_statistics IS 'Estadísticas diarias de caché';
COMMENT ON TABLE load_test_results IS 'Resultados de pruebas de carga';
COMMENT ON TABLE slow_query_analysis IS 'Análisis de queries lentas';
COMMENT ON TABLE connection_pool_config IS 'Configuración de connection pools';
COMMENT ON TABLE async_queue_metrics IS 'Métricas de colas asíncronas';
COMMENT ON TABLE ha_status_snapshots IS 'Snapshots de estado de alta disponibilidad';