-- =========================================================================
-- MIGRACIÓN 112: SISTEMA DE WEBHOOKS Y SINCRONIZACIÓN ESCOLAR AUTOMÁTICA
-- Bachillerato General Estatal "Héroes de la Patria"
-- =========================================================================

-- 1. Tabla de suscripciones a webhooks
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL,  -- Array de eventos suscritos: e.g. ARRAY['student.review.completed', 'tutor.session.completed'] o ARRAY['*']
    secret VARCHAR(255),     -- Secreto compartido para firma criptográfica HMAC-SHA256
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización de consultas
CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_tenant ON webhook_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_active ON webhook_subscriptions(active);
CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_events ON webhook_subscriptions USING GIN(events);

-- 2. Tabla de bitácora y cola de entregas de webhooks
CREATE TABLE IF NOT EXISTS webhook_delivery_log (
    id SERIAL PRIMARY KEY,
    webhook_id INTEGER REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
    event VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'delivered', 'failed'
    response_code INTEGER,
    response_body TEXT,                    -- Sanitizado y limitado a 1024 caracteres
    attempts INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- Índices para despacho rápido y reintentos
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_status ON webhook_delivery_log(status);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_retry ON webhook_delivery_log(next_retry_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_webhook ON webhook_delivery_log(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_created ON webhook_delivery_log(created_at DESC);

-- NOTA DE SEGURIDAD (OWASP / Auditoría):
-- El sembrado inicial de webhooks y secretos HMAC se gestiona de forma segura
-- a través del script backend/seeds/seed-webhooks.js utilizando variables de entorno
-- o generación criptográfica dinámica, evitando versionar secretos en texto plano.
