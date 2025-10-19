-- =====================================================
-- SCRIPT: Crear tabla de CVs para bolsa de trabajo
-- Fecha: 17 de Octubre 2025
-- Propósito: Almacenar perfiles profesionales de egresados
-- =====================================================

-- Crear tabla principal
CREATE TABLE IF NOT EXISTS bolsa_trabajo_cv (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(50) NOT NULL,
    anio_egreso VARCHAR(10) NOT NULL,
    area_interes VARCHAR(500) NOT NULL,
    resumen_profesional TEXT NOT NULL,
    habilidades TEXT,
    status VARCHAR(50) DEFAULT 'activo',
    cv_url VARCHAR(500),
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    ip_address VARCHAR(50),
    user_agent TEXT,
    verificado BOOLEAN DEFAULT FALSE,
    consentimiento BOOLEAN DEFAULT TRUE,

    -- Validación de email
    CONSTRAINT bolsa_cv_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Crear índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_bolsa_cv_email ON bolsa_trabajo_cv(email);
CREATE INDEX IF NOT EXISTS idx_bolsa_cv_anio ON bolsa_trabajo_cv(anio_egreso);
CREATE INDEX IF NOT EXISTS idx_bolsa_cv_status ON bolsa_trabajo_cv(status);
CREATE INDEX IF NOT EXISTS idx_bolsa_cv_area ON bolsa_trabajo_cv(area_interes);
CREATE INDEX IF NOT EXISTS idx_bolsa_cv_fecha ON bolsa_trabajo_cv(fecha_creacion DESC);

-- Comentarios
COMMENT ON TABLE bolsa_trabajo_cv IS 'Almacena perfiles profesionales de egresados para la bolsa de trabajo';
COMMENT ON COLUMN bolsa_trabajo_cv.status IS 'Estado: activo, inactivo, contratado, archivado';
COMMENT ON COLUMN bolsa_trabajo_cv.verificado IS 'Indica si el email fue verificado';

-- Insertar datos de prueba
INSERT INTO bolsa_trabajo_cv (nombre, email, telefono, anio_egreso, area_interes, resumen_profesional, habilidades, verificado) VALUES
('Roberto Sánchez', 'roberto@test.com', '2221234567', '2023', 'Comunicación Gráfica', 'Egresado con experiencia en diseño digital y marketing', 'Photoshop, Illustrator, Marketing Digital', true),
('Diana López', 'diana@test.com', '2229876543', '2022', 'Instalaciones Eléctricas', 'Técnico electricista con certificación CFE', 'Instalaciones residenciales, Mantenimiento preventivo', true),
('Miguel Hernández', 'miguel@test.com', '2225551234', '2024', 'Alimentos y Bebidas', 'Cocinero profesional con conocimiento en cocina mexicana', 'Cocina internacional, Repostería, Higiene alimentaria', false);

-- Verificar
SELECT * FROM bolsa_trabajo_cv;
