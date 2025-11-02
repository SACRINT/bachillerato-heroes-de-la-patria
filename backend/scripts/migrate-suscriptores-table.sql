/**
 * 📋 SCRIPT DE MIGRACIÓN: Agregar columnas faltantes a suscriptores_notificaciones
 * Bachillerato General Estatal "Héroes de la Patria"
 * Fecha: 28 de Octubre 2025
 *
 * COLUMNAS A AGREGAR:
 * - Preferencias de notificaciones específicas
 * - Sistema de verificación de email
 * - Métricas de engagement
 * - Información de registro
 */

-- ============================================
-- 1. PREFERENCIAS DE NOTIFICACIONES
-- ============================================

ALTER TABLE suscriptores_notificaciones
ADD COLUMN IF NOT EXISTS notif_convocatorias BOOLEAN DEFAULT true;

ALTER TABLE suscriptores_notificaciones
ADD COLUMN IF NOT EXISTS notif_becas BOOLEAN DEFAULT true;

ALTER TABLE suscriptores_notificaciones
ADD COLUMN IF NOT EXISTS notif_eventos BOOLEAN DEFAULT true;

ALTER TABLE suscriptores_notificaciones
ADD COLUMN IF NOT EXISTS notif_noticias BOOLEAN DEFAULT true;

ALTER TABLE suscriptores_notificaciones
ADD COLUMN IF NOT EXISTS notif_todas BOOLEAN DEFAULT true;

-- ============================================
-- 2. SISTEMA DE VERIFICACIÓN
-- ============================================

ALTER TABLE suscriptores_notificaciones
ADD COLUMN IF NOT EXISTS verificado BOOLEAN DEFAULT false;

ALTER TABLE suscriptores_notificaciones
ADD COLUMN IF NOT EXISTS fecha_verificacion TIMESTAMP;

ALTER TABLE suscriptores_notificaciones
ADD COLUMN IF NOT EXISTS token_verificacion VARCHAR(255) UNIQUE;

-- ============================================
-- 3. MÉTRICAS DE ENGAGEMENT
-- ============================================

-- Renombrar columnas existentes para mantener datos
-- emails_enviados ya existe, crear alias
ALTER TABLE suscriptores_notificaciones
ADD COLUMN IF NOT EXISTS total_enviados INTEGER DEFAULT 0;

ALTER TABLE suscriptores_notificaciones
ADD COLUMN IF NOT EXISTS total_abiertos INTEGER DEFAULT 0;

-- Copiar datos de emails_enviados -> total_enviados si existe
UPDATE suscriptores_notificaciones
SET total_enviados = COALESCE(emails_enviados, 0)
WHERE total_enviados = 0 AND emails_enviados IS NOT NULL;

-- Copiar datos de emails_abiertos -> total_abiertos si existe
UPDATE suscriptores_notificaciones
SET total_abiertos = COALESCE(emails_abiertos, 0)
WHERE total_abiertos = 0 AND emails_abiertos IS NOT NULL;

ALTER TABLE suscriptores_notificaciones
ADD COLUMN IF NOT EXISTS ultimo_envio TIMESTAMP;

-- ============================================
-- 4. INFORMACIÓN DE REGISTRO
-- ============================================

ALTER TABLE suscriptores_notificaciones
ADD COLUMN IF NOT EXISTS fuente VARCHAR(100) DEFAULT 'Formulario Web';

-- Renombrar fecha_suscripcion a fecha_registro para consistencia
ALTER TABLE suscriptores_notificaciones
ADD COLUMN IF NOT EXISTS fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Copiar datos de fecha_suscripcion -> fecha_registro
UPDATE suscriptores_notificaciones
SET fecha_registro = fecha_suscripcion
WHERE fecha_registro IS NULL AND fecha_suscripcion IS NOT NULL;

ALTER TABLE suscriptores_notificaciones
ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE suscriptores_notificaciones
ADD COLUMN IF NOT EXISTS ip_registro VARCHAR(50);

ALTER TABLE suscriptores_notificaciones
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- ============================================
-- 5. ÍNDICES PARA OPTIMIZAR CONSULTAS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_suscriptores_email ON suscriptores_notificaciones(email);
CREATE INDEX IF NOT EXISTS idx_suscriptores_estado ON suscriptores_notificaciones(estado);
CREATE INDEX IF NOT EXISTS idx_suscriptores_verificado ON suscriptores_notificaciones(verificado);
CREATE INDEX IF NOT EXISTS idx_suscriptores_fecha_registro ON suscriptores_notificaciones(fecha_registro);
CREATE INDEX IF NOT EXISTS idx_suscriptores_token ON suscriptores_notificaciones(token_verificacion);

-- ============================================
-- 6. TRIGGER PARA ACTUALIZACIÓN AUTOMÁTICA
-- ============================================

CREATE OR REPLACE FUNCTION update_suscriptores_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_suscriptores_timestamp ON suscriptores_notificaciones;

CREATE TRIGGER trigger_update_suscriptores_timestamp
BEFORE UPDATE ON suscriptores_notificaciones
FOR EACH ROW
EXECUTE FUNCTION update_suscriptores_timestamp();

-- ============================================
-- 7. COMENTARIOS EN COLUMNAS
-- ============================================

COMMENT ON COLUMN suscriptores_notificaciones.notif_convocatorias IS 'Recibir notificaciones de convocatorias';
COMMENT ON COLUMN suscriptores_notificaciones.notif_becas IS 'Recibir notificaciones de becas';
COMMENT ON COLUMN suscriptores_notificaciones.notif_eventos IS 'Recibir notificaciones de eventos';
COMMENT ON COLUMN suscriptores_notificaciones.notif_noticias IS 'Recibir notificaciones de noticias';
COMMENT ON COLUMN suscriptores_notificaciones.notif_todas IS 'Recibir todas las notificaciones';
COMMENT ON COLUMN suscriptores_notificaciones.verificado IS 'Email verificado (true/false)';
COMMENT ON COLUMN suscriptores_notificaciones.token_verificacion IS 'Token único para verificar email';
COMMENT ON COLUMN suscriptores_notificaciones.total_enviados IS 'Total de emails enviados a este suscriptor';
COMMENT ON COLUMN suscriptores_notificaciones.total_abiertos IS 'Total de emails abiertos por este suscriptor';

-- ============================================
-- 8. VERIFICACIÓN FINAL
-- ============================================

-- Mostrar estructura actualizada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'suscriptores_notificaciones'
ORDER BY ordinal_position;

-- Contar suscriptores
SELECT COUNT(*) as total_suscriptores FROM suscriptores_notificaciones;

COMMIT;
