-- =====================================================
-- SCRIPT: Crear tabla de quejas y sugerencias
-- Fecha: 17 de Octubre 2025
-- Propósito: Almacenar quejas, sugerencias y felicitaciones
-- =====================================================

-- Crear tabla principal
CREATE TABLE IF NOT EXISTS quejas (
    id SERIAL PRIMARY KEY,
    form_type VARCHAR(50) DEFAULT 'quejas',
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pendiente',
    respuesta TEXT,
    respondido_por VARCHAR(255),
    fecha_respuesta TIMESTAMPTZ,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    ip_address VARCHAR(50),
    user_agent TEXT,

    -- Índices para búsqueda rápida
    CONSTRAINT quejas_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_quejas_status ON quejas(status);
CREATE INDEX IF NOT EXISTS idx_quejas_fecha ON quejas(fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_quejas_email ON quejas(email);
CREATE INDEX IF NOT EXISTS idx_quejas_subject ON quejas(subject);

-- Comentarios
COMMENT ON TABLE quejas IS 'Almacena quejas, sugerencias y felicitaciones de usuarios';
COMMENT ON COLUMN quejas.status IS 'Estado: pendiente, en_revision, respondida, cerrada';
COMMENT ON COLUMN quejas.subject IS 'Tipo: queja, sugerencia, felicitacion, otro';

-- Insertar datos de prueba
INSERT INTO quejas (nombre, email, subject, message) VALUES
('Juan Pérez', 'juan@test.com', 'queja', 'El proceso de inscripción es muy lento'),
('María García', 'maria@test.com', 'sugerencia', 'Sería bueno tener una app móvil'),
('Pedro López', 'pedro@test.com', 'felicitacion', 'Excelente atención del personal');

-- Verificar
SELECT * FROM quejas;
