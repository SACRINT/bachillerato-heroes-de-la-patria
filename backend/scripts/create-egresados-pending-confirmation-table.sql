-- ===================================
-- 🎓 TABLA TEMPORAL PARA EGRESADOS PENDIENTES DE CONFIRMACIÓN
-- ===================================
-- Esta tabla almacena registros de egresados que han llenado el formulario
-- pero aún no han confirmado su email. Solo después de confirmar email
-- se mueven a pendientes_aprobacion para revisión del admin.

CREATE TABLE IF NOT EXISTS egresados_pending_confirmation (
    id SERIAL PRIMARY KEY,
    email_usuario VARCHAR(255) NOT NULL UNIQUE,
    datos_json JSONB NOT NULL,
    confirmation_token VARCHAR(255) NOT NULL UNIQUE,
    token_expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours'),
    email_confirmado BOOLEAN DEFAULT false,
    fecha_solicitud TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW(),

    -- Índices para búsqueda rápida
    CONSTRAINT egresados_pending_email_unique UNIQUE(email_usuario)
);

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_egresados_pending_email ON egresados_pending_confirmation(email_usuario);
CREATE INDEX IF NOT EXISTS idx_egresados_pending_token ON egresados_pending_confirmation(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_egresados_pending_confirmed ON egresados_pending_confirmation(email_confirmado);
CREATE INDEX IF NOT EXISTS idx_egresados_pending_created ON egresados_pending_confirmation(fecha_solicitud DESC);

-- ✅ Tabla creada correctamente
-- Esta tabla es la PRIMERA etapa del flujo egresados:
-- 1. Usuario llena formulario → INSERT en egresados_pending_confirmation
-- 2. Email de confirmación enviado
-- 3. Usuario confirma email → UPDATE email_confirmado=true
-- 4. Admin revisa → MOVE a pendientes_aprobacion
-- 5. Admin aprueba → INSERT en tabla egresados (final)
