-- =====================================================
-- MIGRACIÓN: Public API & External Integrations (Semana 25)
-- Integraciones Externas y API Pública
-- Fecha: Enero 2026
-- =====================================================
-- Tabla de API Keys
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    hashed_key VARCHAR(64) UNIQUE NOT NULL,
    plan VARCHAR(30) DEFAULT 'free',
    status VARCHAR(20) DEFAULT 'active',
    -- active, revoked, expired
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,
    last_used_at TIMESTAMP,
    usage_count INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_apikey_org ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_apikey_status ON api_keys(status);
CREATE INDEX IF NOT EXISTS idx_apikey_prefix ON api_keys(key_prefix);
-- Tabla de OAuth2 Clients
CREATE TABLE IF NOT EXISTS oauth2_clients (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(100) UNIQUE NOT NULL,
    client_secret_hash VARCHAR(64) NOT NULL,
    organization_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    redirect_uris TEXT [] NOT NULL,
    scopes TEXT [] DEFAULT '{"read"}',
    grant_types TEXT [] DEFAULT '{"authorization_code"}',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_oauth_client ON oauth2_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_org ON oauth2_clients(organization_id);
-- Tabla de OAuth2 Tokens
CREATE TABLE IF NOT EXISTS oauth2_tokens (
    id SERIAL PRIMARY KEY,
    access_token_hash VARCHAR(64) UNIQUE NOT NULL,
    refresh_token_hash VARCHAR(64),
    client_id VARCHAR(100) NOT NULL,
    user_id INTEGER,
    scopes TEXT [],
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_token_client ON oauth2_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_token_expires ON oauth2_tokens(expires_at);
-- Tabla de Webhooks
CREATE TABLE IF NOT EXISTS webhooks (
    id SERIAL PRIMARY KEY,
    webhook_id VARCHAR(50) UNIQUE NOT NULL,
    organization_id INTEGER NOT NULL,
    url VARCHAR(500) NOT NULL,
    events TEXT [] NOT NULL,
    secret VARCHAR(64) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    -- active, paused, deleted
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_webhook_org ON webhooks(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_status ON webhooks(status);
-- Tabla de Webhook Deliveries
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id SERIAL PRIMARY KEY,
    webhook_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    response_code INTEGER,
    response_body TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    -- pending, delivered, failed
    attempts INTEGER DEFAULT 0,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_delivery_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_delivery_date ON webhook_deliveries(created_at);
-- Tabla de API Usage
CREATE TABLE IF NOT EXISTS api_usage (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    api_key_prefix VARCHAR(20),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_usage_org ON api_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_endpoint ON api_usage(endpoint);
CREATE INDEX IF NOT EXISTS idx_usage_date ON api_usage(created_at);
-- Tabla de Integraciones LMS
CREATE TABLE IF NOT EXISTS lms_integrations (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    platform VARCHAR(50) NOT NULL,
    -- moodle, canvas, blackboard
    lti_version VARCHAR(10) DEFAULT '1.3',
    client_id VARCHAR(100),
    deployment_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'configured',
    -- configured, connected, disconnected
    last_sync_at TIMESTAMP,
    courses_linked INTEGER DEFAULT 0,
    config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lms_org ON lms_integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_lms_platform ON lms_integrations(platform);
-- Tabla de Integraciones de Terceros
CREATE TABLE IF NOT EXISTS third_party_integrations (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    platform VARCHAR(50) NOT NULL,
    -- google_workspace, microsoft_teams, slack
    status VARCHAR(20) DEFAULT 'connected',
    permissions TEXT [],
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_3p_org ON third_party_integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_3p_platform ON third_party_integrations(platform);
-- Tabla de Sandboxes
CREATE TABLE IF NOT EXISTS api_sandboxes (
    id SERIAL PRIMARY KEY,
    sandbox_id VARCHAR(50) UNIQUE NOT NULL,
    organization_id INTEGER NOT NULL,
    api_key_prefix VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    -- active, expired, deleted
    requests_today INTEGER DEFAULT 0,
    requests_limit INTEGER DEFAULT 1000,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sandbox_org ON api_sandboxes(organization_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_status ON api_sandboxes(status);
-- Tabla de Planes de API
CREATE TABLE IF NOT EXISTS api_plans (
    id SERIAL PRIMARY KEY,
    plan_name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    requests_per_month INTEGER,
    requests_per_minute INTEGER,
    features TEXT [],
    support_level VARCHAR(30),
    price_monthly DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Insertar planes de API
INSERT INTO api_plans (
        plan_name,
        display_name,
        requests_per_month,
        requests_per_minute,
        features,
        support_level,
        price_monthly
    )
VALUES (
        'free',
        'Free',
        1000,
        10,
        '{"sentiment_analysis", "basic_predictions"}',
        'community',
        0
    ),
    (
        'starter',
        'Starter',
        10000,
        30,
        '{"sentiment_analysis", "predictions", "recommendations"}',
        'email',
        29
    ),
    (
        'professional',
        'Professional',
        100000,
        100,
        '{"all_features", "webhooks", "priority_processing"}',
        'priority',
        99
    ),
    (
        'enterprise',
        'Enterprise',
        -1,
        500,
        '{"all_features", "webhooks", "custom_models", "dedicated_support"}',
        'dedicated',
        NULL
    ) ON CONFLICT (plan_name) DO NOTHING;
-- Vista: Uso de API por organización (mensual)
CREATE OR REPLACE VIEW v_api_usage_monthly AS
SELECT organization_id,
    DATE_TRUNC('month', created_at)::DATE as month,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (
        WHERE status_code BETWEEN 200 AND 299
    ) as successful_requests,
    COUNT(*) FILTER (
        WHERE status_code >= 400
    ) as failed_requests,
    AVG(response_time_ms) as avg_response_time,
    COUNT(DISTINCT endpoint) as unique_endpoints
FROM api_usage
WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY organization_id,
    DATE_TRUNC('month', created_at)
ORDER BY month DESC;
-- Vista: Webhooks por estado
CREATE OR REPLACE VIEW v_webhook_stats AS
SELECT w.organization_id,
    w.webhook_id,
    w.url,
    w.status,
    COUNT(wd.id) as total_deliveries,
    COUNT(*) FILTER (
        WHERE wd.status = 'delivered'
    ) as successful,
    COUNT(*) FILTER (
        WHERE wd.status = 'failed'
    ) as failed,
    MAX(wd.delivered_at) as last_delivery
FROM webhooks w
    LEFT JOIN webhook_deliveries wd ON w.webhook_id = wd.webhook_id
GROUP BY w.organization_id,
    w.webhook_id,
    w.url,
    w.status;
-- Comentarios
COMMENT ON TABLE api_keys IS 'API Keys para acceso programático';
COMMENT ON TABLE oauth2_clients IS 'Clientes OAuth2 registrados';
COMMENT ON TABLE oauth2_tokens IS 'Tokens OAuth2 activos';
COMMENT ON TABLE webhooks IS 'Webhooks configurados por organización';
COMMENT ON TABLE webhook_deliveries IS 'Historial de entregas de webhooks';
COMMENT ON TABLE api_usage IS 'Registro de uso de API';
COMMENT ON TABLE lms_integrations IS 'Integraciones con plataformas LMS';
COMMENT ON TABLE third_party_integrations IS 'Integraciones con servicios externos';
COMMENT ON TABLE api_sandboxes IS 'Entornos sandbox para pruebas';
COMMENT ON TABLE api_plans IS 'Planes de uso de API';