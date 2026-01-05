-- MIGRACION Year 2 Expansion (Semana 43)
-- Expansion de Capacidades
-- Enero 2026
-- Tabla de configuracion regional
CREATE TABLE IF NOT EXISTS regional_deployments (
    id SERIAL PRIMARY KEY,
    config_id VARCHAR(100) UNIQUE NOT NULL,
    region VARCHAR(50) NOT NULL,
    status VARCHAR(30) DEFAULT 'planned',
    is_primary BOOLEAN DEFAULT false,
    data_center VARCHAR(200),
    latency_ms INTEGER,
    load_balancing JSONB,
    data_replication JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rd_region ON regional_deployments(region);
CREATE INDEX IF NOT EXISTS idx_rd_status ON regional_deployments(status);
-- Tabla de capacidades AI
CREATE TABLE IF NOT EXISTS ai_capabilities (
    id SERIAL PRIMARY KEY,
    activation_id VARCHAR(100) UNIQUE NOT NULL,
    capability_id VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    model VARCHAR(100),
    accuracy DECIMAL(5, 4),
    use_cases TEXT [],
    status VARCHAR(30) DEFAULT 'inactive',
    configuration JSONB,
    activated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_aic_capability ON ai_capabilities(capability_id);
CREATE INDEX IF NOT EXISTS idx_aic_status ON ai_capabilities(status);
-- Tabla de configuracion de analytics
CREATE TABLE IF NOT EXISTS analytics_configurations (
    id SERIAL PRIMARY KEY,
    config_id VARCHAR(100) UNIQUE NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    status VARCHAR(30) DEFAULT 'active',
    metrics TEXT [],
    data_sources TEXT [],
    export_formats TEXT [],
    refresh_interval VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ac_module ON analytics_configurations(module_name);
-- Tabla de insights de analytics
CREATE TABLE IF NOT EXISTS analytics_insights (
    id SERIAL PRIMARY KEY,
    insight_id VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),
    insight TEXT NOT NULL,
    confidence DECIMAL(4, 3),
    actionable BOOLEAN DEFAULT true,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_category ON analytics_insights(category);
-- Tabla de configuracion de reportes
CREATE TABLE IF NOT EXISTS reporting_configurations (
    id SERIAL PRIMARY KEY,
    config_id VARCHAR(100) UNIQUE NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    frequency VARCHAR(30),
    recipients INTEGER,
    customization JSONB,
    delivery_methods TEXT [],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rc_type ON reporting_configurations(report_type);
-- Tabla de reportes generados
CREATE TABLE IF NOT EXISTS generated_reports (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    report_type VARCHAR(100),
    period VARCHAR(50),
    sections JSONB,
    format VARCHAR(20),
    download_url VARCHAR(500),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gr_type ON generated_reports(report_type);
-- Tabla de integraciones
CREATE TABLE IF NOT EXISTS platform_integrations (
    id SERIAL PRIMARY KEY,
    integration_id VARCHAR(100) UNIQUE NOT NULL,
    platform VARCHAR(100) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending',
    sync_frequency VARCHAR(30),
    capabilities TEXT [],
    authentication VARCHAR(50),
    health VARCHAR(30) DEFAULT 'unknown',
    last_sync TIMESTAMP,
    configured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pi_platform ON platform_integrations(platform);
CREATE INDEX IF NOT EXISTS idx_pi_status ON platform_integrations(status);
-- Tabla de configuracion de auto-scaling
CREATE TABLE IF NOT EXISTS autoscaling_configs (
    id SERIAL PRIMARY KEY,
    config_id VARCHAR(100) UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT true,
    policies JSONB NOT NULL,
    min_instances INTEGER DEFAULT 2,
    max_instances INTEGER DEFAULT 20,
    target_cpu_utilization INTEGER DEFAULT 60,
    current_instances INTEGER DEFAULT 2,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabla de eventos de scaling
CREATE TABLE IF NOT EXISTS scaling_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(20) NOT NULL,
    from_instances INTEGER,
    to_instances INTEGER,
    reason VARCHAR(100),
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_se_type ON scaling_events(event_type);
-- Tabla de modulos activos
CREATE TABLE IF NOT EXISTS active_modules (
    id SERIAL PRIMARY KEY,
    module_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    version VARCHAR(20),
    status VARCHAR(30) DEFAULT 'active',
    dependencies TEXT [],
    configuration JSONB,
    endpoints TEXT [],
    documentation_url VARCHAR(500),
    activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_am_status ON active_modules(status);
-- Tabla de partner integrations
CREATE TABLE IF NOT EXISTS partner_integrations (
    id SERIAL PRIMARY KEY,
    partner_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    partner_type VARCHAR(50),
    status VARCHAR(30) DEFAULT 'configured',
    api_endpoint VARCHAR(500),
    authentication VARCHAR(50),
    data_sharing_inbound TEXT [],
    data_sharing_outbound TEXT [],
    sla VARCHAR(20),
    configured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_parti_type ON partner_integrations(partner_type);
-- Vista de regiones activas
CREATE OR REPLACE VIEW v_active_regions AS
SELECT region,
    data_center,
    latency_ms,
    is_primary
FROM regional_deployments
WHERE status = 'active'
ORDER BY is_primary DESC,
    latency_ms ASC;
-- Vista de capacidades AI activas
CREATE OR REPLACE VIEW v_active_ai_capabilities AS
SELECT capability_id,
    name,
    accuracy,
    activated_at
FROM ai_capabilities
WHERE status = 'active';
-- Vista de integraciones saludables
CREATE OR REPLACE VIEW v_healthy_integrations AS
SELECT platform,
    status,
    last_sync
FROM platform_integrations
WHERE health = 'healthy';
-- Comentarios
COMMENT ON TABLE regional_deployments IS 'Configuracion de despliegues regionales';
COMMENT ON TABLE ai_capabilities IS 'Capacidades de IA activadas';
COMMENT ON TABLE analytics_configurations IS 'Configuracion de analytics extendidos';
COMMENT ON TABLE analytics_insights IS 'Insights generados por analytics';
COMMENT ON TABLE reporting_configurations IS 'Configuracion de reportes';
COMMENT ON TABLE generated_reports IS 'Reportes generados';
COMMENT ON TABLE platform_integrations IS 'Integraciones con plataformas externas';
COMMENT ON TABLE autoscaling_configs IS 'Configuracion de auto-scaling';
COMMENT ON TABLE scaling_events IS 'Eventos de escalamiento';
COMMENT ON TABLE active_modules IS 'Modulos activos del sistema';
COMMENT ON TABLE partner_integrations IS 'Integraciones con partners';