-- ============================================================================
-- 🪝 WEBHOOKS TABLES - SEMANA 8
-- Tablas para sistema de webhooks con deliveries y retry logic
--
-- Fecha: 17 Noviembre 2025
-- Estado: ✅ LISTO PARA EJECUTAR EN NEON
-- ============================================================================

-- Tabla principal de webhooks
CREATE TABLE IF NOT EXISTS webhooks (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    url VARCHAR(1000) NOT NULL,
    events JSONB NOT NULL DEFAULT '[]'::jsonb,
    description TEXT,
    secret VARCHAR(255) NOT NULL, -- HMAC secret
    secret_preview VARCHAR(50), -- Preview del secret (ej: "abc123...xyz789")
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para webhooks
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant_id ON webhooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_status ON webhooks(status);
CREATE INDEX IF NOT EXISTS idx_webhooks_events ON webhooks USING GIN (events);

-- Tabla de deliveries (historial de envíos)
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id SERIAL PRIMARY KEY,
    webhook_id INTEGER NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'error')),
    response_code INTEGER,
    response_body TEXT,
    retry_count INTEGER DEFAULT 0,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para webhook_deliveries
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event_type ON webhook_deliveries(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON webhook_deliveries(created_at DESC);

-- ============================================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE webhooks IS 'Webhooks registrados por tenants para recibir eventos en tiempo real';
COMMENT ON COLUMN webhooks.events IS 'Array JSON de eventos que escucha este webhook (ej: ["user.created", "grade.updated"])';
COMMENT ON COLUMN webhooks.secret IS 'Secret para firma HMAC (nunca exponer en API)';
COMMENT ON COLUMN webhooks.secret_preview IS 'Preview del secret para mostrar en UI (primeros y últimos 8 chars)';

COMMENT ON TABLE webhook_deliveries IS 'Historial de entregas de webhooks con status y retry attempts';
COMMENT ON COLUMN webhook_deliveries.payload IS 'Payload completo enviado al webhook';
COMMENT ON COLUMN webhook_deliveries.retry_count IS 'Número de reintentos realizados (0 = primer intento)';

-- ============================================================================
-- DATOS DE PRUEBA (OPCIONAL - Comentado para producción)
-- ============================================================================

-- INSERT INTO webhooks (tenant_id, url, events, description, secret, secret_preview, status)
-- VALUES
--   ('tenant-1', 'https://example.com/webhook', '["user.created", "grade.updated"]', 'Webhook de prueba', 'test_secret_12345678901234567890', 'test_sec...234567890', 'active'),
--   ('tenant-1', 'https://example.com/webhook2', '["news.published"]', 'Webhook para noticias', 'news_secret_98765432109876543210', 'news_sec...876543210', 'active');

-- ============================================================================
-- QUERIES DE VERIFICACIÓN
-- ============================================================================

-- Verificar que las tablas se crearon correctamente
-- SELECT table_name FROM information_schema.tables WHERE table_name IN ('webhooks', 'webhook_deliveries');

-- Verificar índices
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('webhooks', 'webhook_deliveries');

-- Contar webhooks por tenant
-- SELECT tenant_id, COUNT(*) FROM webhooks GROUP BY tenant_id;

-- Obtener deliveries recientes
-- SELECT webhook_id, event_type, status, retry_count, created_at
-- FROM webhook_deliveries
-- ORDER BY created_at DESC
-- LIMIT 10;

-- ============================================================================
-- INSTRUCCIONES DE EJECUCIÓN
-- ============================================================================
-- 1. Copiar todo el contenido de este archivo
-- 2. Ir a Neon Console (https://console.neon.tech)
-- 3. Seleccionar tu base de datos BGE
-- 4. Ir a "SQL Editor"
-- 5. Pegar y ejecutar el script
-- 6. Verificar que las tablas se crearon: SELECT * FROM webhooks LIMIT 1;
-- ============================================================================
