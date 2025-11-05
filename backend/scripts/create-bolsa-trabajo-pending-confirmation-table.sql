-- ===================================
-- 💼 TABLA TEMPORAL PARA BOLSA DE TRABAJO PENDIENTES DE CONFIRMACIÓN
-- ===================================
-- Esta tabla almacena registros de bolsa de trabajo que han llenado el formulario
-- pero aún no han confirmado su email. Solo después de confirmar email
-- se mueven a pendientes_aprobacion para revisión del admin.

CREATE TABLE IF NOT EXISTS bolsa_trabajo_pending_confirmation (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    confirmation_token VARCHAR(255) NOT NULL UNIQUE,
    form_data JSONB NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    token_expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    confirmed_at TIMESTAMP,
    email_sent_count INTEGER DEFAULT 1,
    last_email_sent_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT bolsa_trabajo_pending_email_unique UNIQUE(email),
    CONSTRAINT bolsa_trabajo_pending_token_unique UNIQUE(confirmation_token)
);

-- Crear índices para optimización y búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_pending_email ON bolsa_trabajo_pending_confirmation(email);
CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_pending_token ON bolsa_trabajo_pending_confirmation(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_pending_confirmed ON bolsa_trabajo_pending_confirmation(confirmed_at);
CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_pending_created ON bolsa_trabajo_pending_confirmation(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_pending_expires ON bolsa_trabajo_pending_confirmation(token_expires_at);

-- ✅ Tabla creada correctamente
-- FLUJO DE BOLSA DE TRABAJO (3 ETAPAS):
-- 1. Usuario llena formulario → INSERT en bolsa_trabajo_pending_confirmation
-- 2. Email de confirmación enviado
-- 3. Usuario confirma email → UPDATE confirmed_at + MOVE a pendientes_aprobacion
-- 4. Admin revisa en tab aprobaciones
-- 5. Admin aprueba → INSERT en tabla bolsa_trabajo (final)
