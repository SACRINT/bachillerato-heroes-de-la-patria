-- =====================================================
-- SCRIPT: Crear tabla de suscripciones a notificaciones
-- Fecha: 17 de Octubre 2025
-- Propósito: Almacenar suscripciones a notificaciones de convocatorias
-- =====================================================

CREATE TABLE IF NOT EXISTS notificaciones_convocatorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    tipo_interes VARCHAR(100),
    status VARCHAR(50) DEFAULT 'activo',
    fecha_suscripcion TIMESTAMPTZ DEFAULT NOW(),
    fecha_baja TIMESTAMPTZ,
    ip_address VARCHAR(50),
    user_agent TEXT,
    verificado BOOLEAN DEFAULT FALSE,

    CONSTRAINT notif_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX IF NOT EXISTS idx_notif_email ON notificaciones_convocatorias(email);
CREATE INDEX IF NOT EXISTS idx_notif_status ON notificaciones_convocatorias(status);
CREATE INDEX IF NOT EXISTS idx_notif_tipo ON notificaciones_convocatorias(tipo_interes);
CREATE INDEX IF NOT EXISTS idx_notif_fecha ON notificaciones_convocatorias(fecha_suscripcion DESC);

COMMENT ON TABLE notificaciones_convocatorias IS 'Suscripciones a notificaciones de convocatorias';
COMMENT ON COLUMN notificaciones_convocatorias.status IS 'Estado: activo, inactivo, cancelado';

INSERT INTO notificaciones_convocatorias (nombre, email, tipo_interes, verificado) VALUES
('Luis Ramírez', 'luis@test.com', 'Becas', true),
('Carmen Flores', 'carmen@test.com', 'Todas las convocatorias', true),
('Jorge Méndez', 'jorge@test.com', 'Concursos', false);

SELECT * FROM notificaciones_convocatorias;
