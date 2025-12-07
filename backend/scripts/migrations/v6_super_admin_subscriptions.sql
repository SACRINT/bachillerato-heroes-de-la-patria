-- =====================================================
-- FASE 5: Super-Admin Dashboard - Tablas de Suscripciones
-- Migración: 07 Diciembre 2025
-- =====================================================
-- Tabla de planes de suscripción
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'MXN',
    max_students INT DEFAULT 100,
    max_teachers INT DEFAULT 10,
    max_admins INT DEFAULT 3,
    max_storage_gb INT DEFAULT 5,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabla de suscripciones de tenants
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id INT NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'trial',
    -- Status: trial, active, past_due, cancelled, expired
    start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    trial_ends_at TIMESTAMP,
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancelled_at TIMESTAMP,
    stripe_subscription_id VARCHAR(100),
    stripe_customer_id VARCHAR(100),
    payment_method VARCHAR(50),
    -- stripe, oxxo, transfer, free
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id) -- Un tenant solo puede tener una suscripción activa
);
-- Tabla de historial de pagos
CREATE TABLE IF NOT EXISTS subscription_payments (
    id SERIAL PRIMARY KEY,
    subscription_id INT NOT NULL REFERENCES tenant_subscriptions(id),
    tenant_id INT NOT NULL REFERENCES tenants(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MXN',
    status VARCHAR(20) NOT NULL,
    -- pending, completed, failed, refunded
    payment_method VARCHAR(50),
    stripe_payment_id VARCHAR(100),
    invoice_number VARCHAR(50),
    invoice_url TEXT,
    paid_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabla de métricas de uso por tenant (para dashboard)
CREATE TABLE IF NOT EXISTS tenant_usage_metrics (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    active_users INT DEFAULT 0,
    total_students INT DEFAULT 0,
    total_teachers INT DEFAULT 0,
    total_logins INT DEFAULT 0,
    api_calls INT DEFAULT 0,
    storage_used_mb INT DEFAULT 0,
    iacoins_spent INT DEFAULT 0,
    iacoins_earned INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, metric_date)
);
-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_end_date ON tenant_subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_tenant ON subscription_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_metrics_date ON tenant_usage_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_metrics_tenant ON tenant_usage_metrics(tenant_id);
-- =====================================================
-- DATOS INICIALES - Planes de Suscripción
-- =====================================================
INSERT INTO subscription_plans (
        name,
        description,
        price_monthly,
        price_yearly,
        max_students,
        max_teachers,
        max_admins,
        max_storage_gb,
        features,
        sort_order
    )
VALUES (
        'free',
        'Plan Gratuito - Ideal para probar',
        0,
        0,
        50,
        5,
        1,
        1,
        '{"ai_queries_per_month": 100, "email_support": true, "basic_reports": true}',
        1
    ),
    (
        'starter',
        'Plan Starter - Escuelas pequeñas',
        499,
        4990,
        150,
        15,
        2,
        5,
        '{"ai_queries_per_month": 500, "email_support": true, "priority_support": false, "advanced_reports": true, "custom_branding": false}',
        2
    ),
    (
        'professional',
        'Plan Profesional - Escuelas medianas',
        999,
        9990,
        500,
        50,
        5,
        20,
        '{"ai_queries_per_month": 2000, "email_support": true, "priority_support": true, "advanced_reports": true, "custom_branding": true, "api_access": true}',
        3
    ),
    (
        'enterprise',
        'Plan Enterprise - Escuelas grandes',
        2499,
        24990,
        -1,
        -1,
        -1,
        100,
        '{"ai_queries_per_month": -1, "email_support": true, "priority_support": true, "dedicated_support": true, "advanced_reports": true, "custom_branding": true, "api_access": true, "sla_99_9": true, "custom_integrations": true}',
        4
    ) ON CONFLICT (name) DO NOTHING;
-- =====================================================
-- FUNCIÓN PARA ACTUALIZAR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_subscription_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Triggers
DROP TRIGGER IF EXISTS trigger_subscription_plans_updated ON subscription_plans;
CREATE TRIGGER trigger_subscription_plans_updated BEFORE
UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_subscription_timestamp();
DROP TRIGGER IF EXISTS trigger_tenant_subscriptions_updated ON tenant_subscriptions;
CREATE TRIGGER trigger_tenant_subscriptions_updated BEFORE
UPDATE ON tenant_subscriptions FOR EACH ROW EXECUTE FUNCTION update_subscription_timestamp();
-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE subscription_plans IS 'Planes de suscripción disponibles para escuelas';
COMMENT ON TABLE tenant_subscriptions IS 'Suscripciones activas de cada tenant/escuela';
COMMENT ON TABLE subscription_payments IS 'Historial de pagos de suscripciones';
COMMENT ON TABLE tenant_usage_metrics IS 'Métricas de uso diarias por tenant para dashboard';