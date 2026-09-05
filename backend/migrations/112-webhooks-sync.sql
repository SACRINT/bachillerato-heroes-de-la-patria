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

-- =========================================================================
-- SEED DATA: Suscripciones iniciales de ejemplo para sistemas escolares
-- =========================================================================

INSERT INTO webhook_subscriptions (tenant_id, url, events, secret, active)
VALUES 
(
    1,
    'https://sigpad.sep.gob.mx/api/v1/integrations/bge-sync',
    ARRAY['student.review.completed', 'student.deck.completed', 'student.streak.achieved', 'tutor.session.completed', 'alert.low.retention']::text[],
    'whsec_9b2d8e41a7c54f19b6e82c1a4e9f3b5d7e2a8c1f4e9b6a3c5d8e1f2a4b7c9e0f',
    true
),
(
    1,
    'https://sisat-atp.puebla.gob.mx/webhooks/academic-alerts',
    ARRAY['alert.low.retention', 'student.streak.achieved', 'teacher.deck.created']::text[],
    'whsec_7c1a8f3b2d9e4a5c6e8b1f4a9c2d7e0b5f8a1c4e9d3b6a2f7c0e5b8d1a4f9c2e',
    true
)
ON CONFLICT DO NOTHING;

-- Registro histórico inicial de entrega para validación en bitácora
INSERT INTO webhook_delivery_log (webhook_id, event, payload, status, response_code, response_body, attempts, delivered_at)
SELECT 
    id,
    'student.streak.achieved',
    '{"event": "student.streak.achieved", "tenant_id": 1, "timestamp": "2026-09-04T12:00:00Z", "data": {"student_id": "101", "streak_days": 7, "date": "2026-09-04"}}'::jsonb,
    'delivered',
    200,
    '{"success": true, "message": "Streak event received and acknowledged by SIGPAD-EMS"}',
    1,
    NOW()
FROM webhook_subscriptions
WHERE url LIKE '%sigpad%'
LIMIT 1
ON CONFLICT DO NOTHING;
