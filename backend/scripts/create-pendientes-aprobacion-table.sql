-- ============================================================================
-- 🗄️ CREAR TABLA: pendientes_aprobacion
-- Propósito: Almacenar solicitudes de Egresados y Bolsa de Trabajo pendientes
--           de aprobación por administrador
-- ============================================================================

-- Crear tabla de solicitudes pendientes
CREATE TABLE IF NOT EXISTS pendientes_aprobacion (
    -- Identificadores
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,

    -- Tipo de solicitud (egresado o bolsa_trabajo)
    tipo_solicitud VARCHAR(50) NOT NULL,
        -- Valores válidos: 'egresado', 'bolsa_trabajo'

    -- Email del usuario que envía la solicitud (importante para comunicación)
    email_usuario VARCHAR(255) NOT NULL,

    -- Datos de la solicitud en JSON (flexible para diferentes tipos)
    datos_json JSONB NOT NULL,

    -- Estado de la solicitud
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
        -- Valores: 'pendiente', 'aprobada', 'rechazada'

    -- Información de timestamps
    fecha_solicitud TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_procesado TIMESTAMP,

    -- Información del administrador que aprueba/rechaza
    admin_id BIGINT,
    admin_notas TEXT,

    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT estado_check CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
    CONSTRAINT tipo_solicitud_check CHECK (tipo_solicitud IN ('egresado', 'bolsa_trabajo'))
);

-- Crear índices para mejor performance
CREATE INDEX idx_pendientes_aprobacion_tipo_solicitud
    ON pendientes_aprobacion(tipo_solicitud);

CREATE INDEX idx_pendientes_aprobacion_estado
    ON pendientes_aprobacion(estado);

CREATE INDEX idx_pendientes_aprobacion_email_usuario
    ON pendientes_aprobacion(email_usuario);

CREATE INDEX idx_pendientes_aprobacion_fecha_solicitud
    ON pendientes_aprobacion(fecha_solicitud DESC);

CREATE INDEX idx_pendientes_aprobacion_admin_id
    ON pendientes_aprobacion(admin_id);

-- Crear índice compuesto para búsquedas comunes
CREATE INDEX idx_pendientes_aprobacion_estado_tipo
    ON pendientes_aprobacion(estado, tipo_solicitud);

-- ============================================================================
-- 📋 TABLA CREADA CON ÉXITO
-- Campos importantes:
-- - uuid: Identificador único para referencias externas
-- - tipo_solicitud: Distingue entre egresados y bolsa_trabajo
-- - email_usuario: Para comunicación y confirmación de datos
-- - datos_json: Almacena toda la información del formulario en formato JSON
-- - estado: Permite rastrear solicitudes pendientes, aprobadas o rechazadas
-- - admin_id: Quién aprobó/rechazó la solicitud (auditoría)
-- - admin_notas: Comentarios del administrador en caso de rechazo
-- ============================================================================
