-- =====================================================
-- 📋 CREATE TABLE notificaciones_convocatorias
-- Para suscriptores a notificaciones de convocatorias
-- =====================================================

CREATE TABLE IF NOT EXISTS notificaciones_convocatorias (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255),
    tipo_interes VARCHAR(255) DEFAULT 'Todas las convocatorias',

    -- Email Verification
    token_verificacion VARCHAR(255),
    verificado BOOLEAN DEFAULT false,

    -- Estado
    status VARCHAR(20) DEFAULT 'pendiente', -- 'pendiente', 'activo', 'inactivo'

    -- Auditoría
    ip_address VARCHAR(45),
    user_agent TEXT,

    -- Timestamps
    fecha_suscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_verificacion TIMESTAMP,
    fecha_baja TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_notif_convocatorias_email ON notificaciones_convocatorias(email);
CREATE INDEX IF NOT EXISTS idx_notif_convocatorias_status ON notificaciones_convocatorias(status);
CREATE INDEX IF NOT EXISTS idx_notif_convocatorias_verificado ON notificaciones_convocatorias(verificado);

-- Verificación
SELECT COUNT(*) as "Registros en notificaciones_convocatorias" FROM notificaciones_convocatorias;
