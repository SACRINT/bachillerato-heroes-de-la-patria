-- ============================================
-- 📧 TABLAS PARA SISTEMA DE NEWSLETTERS
-- Bachillerato General Estatal "Héroes de la Patria"
-- PostgreSQL (Neon/Vercel compatible)
-- ============================================

-- Eliminar tablas si existen
DROP TABLE IF EXISTS newsletter_envios CASCADE;
DROP TABLE IF EXISTS newsletters CASCADE;
DROP TABLE IF EXISTS suscriptores CASCADE;

-- ============================================
-- TABLA: suscriptores
-- Gestión de suscriptores a newsletters
-- ============================================

CREATE TABLE suscriptores (
    id SERIAL PRIMARY KEY,
    subscription_id VARCHAR(50) UNIQUE NOT NULL, -- SUB-2025-0001
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255) DEFAULT 'Suscriptor',

    -- Categorías (array en PostgreSQL)
    categories TEXT[] DEFAULT ARRAY['all']::TEXT[],

    -- Origen de la suscripción
    source VARCHAR(50) DEFAULT 'newsletter',

    -- Estado
    active BOOLEAN DEFAULT TRUE,

    -- Token para cancelación
    unsubscribe_token VARCHAR(64) UNIQUE NOT NULL,

    -- Estadísticas
    emails_sent INTEGER DEFAULT 0,
    last_email_sent TIMESTAMP WITH TIME ZONE,

    -- Fechas
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,

    -- Metadata adicional
    metadata JSONB DEFAULT '{}'::JSONB
);

-- Índices para suscriptores
CREATE INDEX idx_suscriptores_email ON suscriptores(email);
CREATE INDEX idx_suscriptores_active ON suscriptores(active);
CREATE INDEX idx_suscriptores_token ON suscriptores(unsubscribe_token);
CREATE INDEX idx_suscriptores_subscribed_at ON suscriptores(subscribed_at);
CREATE INDEX idx_suscriptores_categories ON suscriptores USING GIN (categories);

-- ============================================
-- TABLA: newsletters
-- Registro de newsletters enviadas
-- ============================================

CREATE TABLE newsletters (
    id SERIAL PRIMARY KEY,
    newsletter_id VARCHAR(50) UNIQUE NOT NULL, -- NEWS-2025-0001

    -- Contenido
    subject VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,

    -- Filtro
    target_category VARCHAR(50) DEFAULT 'all',

    -- Estadísticas de envío
    sent_to INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,

    -- Fecha de envío
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Metadata adicional
    metadata JSONB DEFAULT '{}'::JSONB
);

-- Índices para newsletters
CREATE INDEX idx_newsletters_newsletter_id ON newsletters(newsletter_id);
CREATE INDEX idx_newsletters_sent_at ON newsletters(sent_at);
CREATE INDEX idx_newsletters_target_category ON newsletters(target_category);

-- ============================================
-- TABLA: newsletter_envios
-- Detalle de envíos individuales por newsletter
-- ============================================

CREATE TABLE newsletter_envios (
    id SERIAL PRIMARY KEY,
    newsletter_id INTEGER NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
    subscriber_id INTEGER REFERENCES suscriptores(id) ON DELETE SET NULL,

    -- Información del envío
    email VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'bounced')),
    error_message TEXT,

    -- Fecha de envío
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Tracking
    opened BOOLEAN DEFAULT FALSE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked BOOLEAN DEFAULT FALSE,
    clicked_at TIMESTAMP WITH TIME ZONE
);

-- Índices para newsletter_envios
CREATE INDEX idx_envios_newsletter ON newsletter_envios(newsletter_id);
CREATE INDEX idx_envios_subscriber ON newsletter_envios(subscriber_id);
CREATE INDEX idx_envios_email ON newsletter_envios(email);
CREATE INDEX idx_envios_status ON newsletter_envios(status);
CREATE INDEX idx_envios_sent_at ON newsletter_envios(sent_at);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar contador de emails_sent en suscriptores
CREATE OR REPLACE FUNCTION update_subscriber_emails_sent()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'sent' THEN
        UPDATE suscriptores
        SET
            emails_sent = emails_sent + 1,
            last_email_sent = NEW.sent_at
        WHERE id = NEW.subscriber_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar estadísticas de suscriptor
CREATE TRIGGER update_subscriber_stats
    AFTER INSERT ON newsletter_envios
    FOR EACH ROW
    EXECUTE FUNCTION update_subscriber_emails_sent();

-- ============================================
-- DATOS DE PRUEBA (OPCIONAL)
-- ============================================

-- Suscriptores de prueba
INSERT INTO suscriptores (
    subscription_id, email, nombre, categories, source, active, unsubscribe_token
) VALUES
(
    'SUB-2025-0001',
    'ejemplo1@gmail.com',
    'Juan Pérez',
    ARRAY['all', 'noticias', 'eventos'],
    'newsletter',
    TRUE,
    encode(gen_random_bytes(32), 'hex')
),
(
    'SUB-2025-0002',
    'ejemplo2@gmail.com',
    'María García',
    ARRAY['becas', 'convocatorias'],
    'newsletter',
    TRUE,
    encode(gen_random_bytes(32), 'hex')
),
(
    'SUB-2025-0003',
    'ejemplo3@gmail.com',
    'Carlos López',
    ARRAY['all'],
    'newsletter',
    FALSE,
    encode(gen_random_bytes(32), 'hex')
)
ON CONFLICT (email) DO NOTHING;

-- Newsletter de prueba
INSERT INTO newsletters (
    newsletter_id, subject, content, target_category, sent_to, success_count, failure_count
) VALUES (
    'NEWS-2025-0001',
    'Bienvenida al BGE Héroes de la Patria',
    '<h2>Bienvenida</h2><p>Gracias por suscribirte a nuestras noticias.</p>',
    'all',
    2,
    2,
    0
)
ON CONFLICT (newsletter_id) DO NOTHING;

-- Envíos individuales de la newsletter de prueba
INSERT INTO newsletter_envios (newsletter_id, subscriber_id, email, status)
SELECT
    (SELECT id FROM newsletters WHERE newsletter_id = 'NEWS-2025-0001'),
    s.id,
    s.email,
    'sent'
FROM suscriptores s
WHERE s.active = TRUE
LIMIT 2
ON CONFLICT DO NOTHING;

-- ============================================
-- CONSULTAS DE VERIFICACIÓN
-- ============================================

-- Ver suscriptores
SELECT
    subscription_id,
    email,
    nombre,
    array_to_string(categories, ', ') AS categorias,
    active,
    emails_sent,
    subscribed_at
FROM suscriptores
ORDER BY subscribed_at DESC;

-- Ver newsletters enviadas
SELECT
    newsletter_id,
    subject,
    target_category,
    sent_to,
    success_count,
    failure_count,
    ROUND((success_count::NUMERIC / NULLIF(sent_to, 0)) * 100, 2) AS tasa_exito,
    sent_at
FROM newsletters
ORDER BY sent_at DESC;

-- Ver estadísticas generales
SELECT
    (SELECT COUNT(*) FROM suscriptores WHERE active = TRUE) AS suscriptores_activos,
    (SELECT COUNT(*) FROM suscriptores WHERE active = FALSE) AS suscriptores_inactivos,
    (SELECT COUNT(*) FROM newsletters) AS newsletters_enviadas,
    (SELECT SUM(success_count) FROM newsletters) AS emails_enviados_total,
    (SELECT AVG(success_count::NUMERIC / NULLIF(sent_to, 0)) * 100 FROM newsletters) AS tasa_exito_promedio;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

-- 🎉 Tablas de newsletters creadas exitosamente
-- ✅ 3 tablas: suscriptores, newsletters, newsletter_envios
-- ✅ Índices optimizados para consultas rápidas
-- ✅ Triggers para actualización automática de estadísticas
-- ✅ Datos de prueba insertados
