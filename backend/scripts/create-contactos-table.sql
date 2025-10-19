-- =====================================================
-- SCRIPT: Crear tabla de contactos
-- Fecha: 17 de Octubre 2025
-- Propósito: Almacenar mensajes del formulario de contacto
-- =====================================================

-- Crear tabla principal
CREATE TABLE IF NOT EXISTS contactos (
    id SERIAL PRIMARY KEY,
    form_type VARCHAR(100) DEFAULT 'Contacto General',
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    tipo_consulta VARCHAR(100),
    asunto VARCHAR(500) NOT NULL,
    mensaje TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pendiente',
    respuesta TEXT,
    respondido_por VARCHAR(255),
    fecha_respuesta TIMESTAMPTZ,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    ip_address VARCHAR(50),
    user_agent TEXT,
    email_sent BOOLEAN DEFAULT FALSE,
    verificado BOOLEAN DEFAULT FALSE,

    -- Validación de email
    CONSTRAINT contactos_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Crear índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_contactos_status ON contactos(status);
CREATE INDEX IF NOT EXISTS idx_contactos_fecha ON contactos(fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_contactos_email ON contactos(email);
CREATE INDEX IF NOT EXISTS idx_contactos_tipo ON contactos(tipo_consulta);
CREATE INDEX IF NOT EXISTS idx_contactos_verificado ON contactos(verificado);

-- Comentarios
COMMENT ON TABLE contactos IS 'Almacena mensajes del formulario de contacto general';
COMMENT ON COLUMN contactos.status IS 'Estado: pendiente, en_revision, respondida, cerrada';
COMMENT ON COLUMN contactos.tipo_consulta IS 'Tipo de consulta del usuario';
COMMENT ON COLUMN contactos.verificado IS 'Indica si el email fue verificado';

-- Insertar datos de prueba
INSERT INTO contactos (nombre, email, telefono, tipo_consulta, asunto, mensaje, verificado) VALUES
('Ana Martínez', 'ana@test.com', '2221234567', 'Información General', 'Consulta sobre horarios', 'Quisiera saber los horarios de atención', true),
('Carlos Gómez', 'carlos@test.com', NULL, 'Admisiones e Inscripciones', 'Proceso de inscripción', '¿Cuál es el proceso para inscribir a mi hijo?', true),
('Laura Torres', 'laura@test.com', '2229876543', 'Becas y Apoyos', 'Información de becas', 'Me gustaría conocer las becas disponibles', false);

-- Verificar
SELECT * FROM contactos;
