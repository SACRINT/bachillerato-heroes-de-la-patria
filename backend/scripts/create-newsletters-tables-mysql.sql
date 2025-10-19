-- ============================================
-- 📧 TABLAS PARA SISTEMA DE NEWSLETTERS
-- Bachillerato General Estatal "Héroes de la Patria"
-- MySQL 8.0+
-- ============================================

USE heroes_patria_db;

-- Eliminar tablas si existen (orden inverso por foreign keys)
DROP TABLE IF EXISTS newsletter_envios;
DROP TABLE IF EXISTS newsletters;
DROP TABLE IF EXISTS suscriptores;

-- ============================================
-- TABLA: suscriptores
-- Gestión de suscriptores a newsletters
-- ============================================

CREATE TABLE suscriptores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subscription_id VARCHAR(50) UNIQUE NOT NULL COMMENT 'SUB-2025-0001',
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255) DEFAULT 'Suscriptor',

    -- Categorías (JSON en MySQL)
    categories JSON DEFAULT ('["all"]'),

    -- Origen de la suscripción
    source VARCHAR(50) DEFAULT 'newsletter',

    -- Estado
    active BOOLEAN DEFAULT TRUE,

    -- Token para cancelación
    unsubscribe_token VARCHAR(64) UNIQUE NOT NULL,

    -- Estadísticas
    emails_sent INT DEFAULT 0,
    last_email_sent TIMESTAMP NULL,

    -- Fechas
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP NULL,

    -- Metadata adicional
    metadata JSON DEFAULT ('{}'),

    INDEX idx_suscriptores_email (email),
    INDEX idx_suscriptores_active (active),
    INDEX idx_suscriptores_token (unsubscribe_token),
    INDEX idx_suscriptores_subscribed_at (subscribed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: newsletters
-- Registro de newsletters enviadas
-- ============================================

CREATE TABLE newsletters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    newsletter_id VARCHAR(50) UNIQUE NOT NULL COMMENT 'NEWS-2025-0001',

    -- Contenido
    subject VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,

    -- Filtro
    target_category VARCHAR(50) DEFAULT 'all',

    -- Estadísticas de envío
    sent_to INT NOT NULL DEFAULT 0,
    success_count INT DEFAULT 0,
    failure_count INT DEFAULT 0,

    -- Fecha de envío
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Metadata adicional
    metadata JSON DEFAULT ('{}'),

    INDEX idx_newsletters_newsletter_id (newsletter_id),
    INDEX idx_newsletters_sent_at (sent_at),
    INDEX idx_newsletters_target_category (target_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: newsletter_envios
-- Detalle de envíos individuales por newsletter
-- ============================================

CREATE TABLE newsletter_envios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    newsletter_id INT NOT NULL,
    subscriber_id INT NULL,

    -- Información del envío
    email VARCHAR(255) NOT NULL,
    status ENUM('sent', 'failed', 'bounced') NOT NULL,
    error_message TEXT NULL,

    -- Fecha de envío
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Tracking
    opened BOOLEAN DEFAULT FALSE,
    opened_at TIMESTAMP NULL,
    clicked BOOLEAN DEFAULT FALSE,
    clicked_at TIMESTAMP NULL,

    FOREIGN KEY (newsletter_id) REFERENCES newsletters(id) ON DELETE CASCADE,
    FOREIGN KEY (subscriber_id) REFERENCES suscriptores(id) ON DELETE SET NULL,

    INDEX idx_envios_newsletter (newsletter_id),
    INDEX idx_envios_subscriber (subscriber_id),
    INDEX idx_envios_email (email),
    INDEX idx_envios_status (status),
    INDEX idx_envios_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TRIGGER: Actualizar contador de emails_sent
-- ============================================

DELIMITER //

CREATE TRIGGER update_subscriber_emails_sent
AFTER INSERT ON newsletter_envios
FOR EACH ROW
BEGIN
    IF NEW.status = 'sent' AND NEW.subscriber_id IS NOT NULL THEN
        UPDATE suscriptores
        SET
            emails_sent = emails_sent + 1,
            last_email_sent = NEW.sent_at
        WHERE id = NEW.subscriber_id;
    END IF;
END//

DELIMITER ;

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
    JSON_ARRAY('all', 'noticias', 'eventos'),
    'newsletter',
    TRUE,
    SHA2(CONCAT('ejemplo1@gmail.com', RAND(), NOW()), 256)
),
(
    'SUB-2025-0002',
    'ejemplo2@gmail.com',
    'María García',
    JSON_ARRAY('becas', 'convocatorias'),
    'newsletter',
    TRUE,
    SHA2(CONCAT('ejemplo2@gmail.com', RAND(), NOW()), 256)
),
(
    'SUB-2025-0003',
    'ejemplo3@gmail.com',
    'Carlos López',
    JSON_ARRAY('all'),
    'newsletter',
    FALSE,
    SHA2(CONCAT('ejemplo3@gmail.com', RAND(), NOW()), 256)
)
ON DUPLICATE KEY UPDATE email = email;

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
ON DUPLICATE KEY UPDATE subject = subject;

-- Envíos individuales de la newsletter de prueba (solo si existen los IDs)
INSERT INTO newsletter_envios (newsletter_id, subscriber_id, email, status)
SELECT
    (SELECT id FROM newsletters WHERE newsletter_id = 'NEWS-2025-0001' LIMIT 1),
    s.id,
    s.email,
    'sent'
FROM suscriptores s
WHERE s.active = TRUE
LIMIT 2
ON DUPLICATE KEY UPDATE email = email;

-- ============================================
-- CONSULTAS DE VERIFICACIÓN
-- ============================================

-- Ver suscriptores
SELECT
    subscription_id,
    email,
    nombre,
    categories,
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
    ROUND((success_count / NULLIF(sent_to, 0)) * 100, 2) AS tasa_exito_pct,
    sent_at
FROM newsletters
ORDER BY sent_at DESC;

-- Ver estadísticas generales
SELECT
    (SELECT COUNT(*) FROM suscriptores WHERE active = TRUE) AS suscriptores_activos,
    (SELECT COUNT(*) FROM suscriptores WHERE active = FALSE) AS suscriptores_inactivos,
    (SELECT COUNT(*) FROM newsletters) AS newsletters_enviadas,
    (SELECT IFNULL(SUM(success_count), 0) FROM newsletters) AS emails_enviados_total,
    (SELECT ROUND(AVG(success_count / NULLIF(sent_to, 0)) * 100, 2) FROM newsletters) AS tasa_exito_promedio_pct;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

-- 🎉 Tablas de newsletters creadas exitosamente
-- ✅ 3 tablas: suscriptores, newsletters, newsletter_envios
-- ✅ Índices optimizados para consultas rápidas
-- ✅ Trigger para actualización automática de estadísticas
-- ✅ Datos de prueba insertados
