-- MIGRACION Year 2 Integration (Semana 47)
-- Integraciones Externas
CREATE TABLE IF NOT EXISTS erp_integrations (
    id SERIAL PRIMARY KEY,
    integration_id VARCHAR(100) UNIQUE NOT NULL,
    provider VARCHAR(100) NOT NULL,
    modules TEXT [],
    sync_frequency VARCHAR(30),
    data_flow VARCHAR(30),
    status VARCHAR(30) DEFAULT 'inactive',
    configured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sis_integrations (
    id SERIAL PRIMARY KEY,
    integration_id VARCHAR(100) UNIQUE NOT NULL,
    provider VARCHAR(100) NOT NULL,
    modules TEXT [],
    sync_frequency VARCHAR(30),
    records_synced INTEGER DEFAULT 0,
    status VARCHAR(30) DEFAULT 'inactive',
    configured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS payment_gateway_integrations (
    id SERIAL PRIMARY KEY,
    integration_id VARCHAR(100) UNIQUE NOT NULL,
    provider VARCHAR(100) NOT NULL,
    features TEXT [],
    monthly_transactions INTEGER DEFAULT 0,
    status VARCHAR(30) DEFAULT 'inactive',
    configured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS notification_integrations (
    id SERIAL PRIMARY KEY,
    integration_id VARCHAR(100) UNIQUE NOT NULL,
    channel VARCHAR(50) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    monthly_volume INTEGER DEFAULT 0,
    status VARCHAR(30) DEFAULT 'inactive',
    configured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS analytics_integrations (
    id SERIAL PRIMARY KEY,
    integration_id VARCHAR(100) UNIQUE NOT NULL,
    platform VARCHAR(100) NOT NULL,
    status VARCHAR(30) DEFAULT 'inactive',
    configured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_erpi_provider ON erp_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_sisi_provider ON sis_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_pgi_provider ON payment_gateway_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_ni_channel ON notification_integrations(channel);
CREATE INDEX IF NOT EXISTS idx_ai_platform ON analytics_integrations(platform);
COMMENT ON TABLE erp_integrations IS 'Integraciones con sistemas ERP';
COMMENT ON TABLE sis_integrations IS 'Integraciones con sistemas SIS';
COMMENT ON TABLE payment_gateway_integrations IS 'Integraciones con pasarelas de pago';
COMMENT ON TABLE notification_integrations IS 'Integraciones de notificaciones';
COMMENT ON TABLE analytics_integrations IS 'Integraciones con plataformas de analytics';