-- =====================================================
-- SCRIPT: Crear tabla de solicitudes de documentos
-- Fecha: 17 de Octubre 2025
-- Propósito: Almacenar solicitudes de documentos oficiales
-- =====================================================

CREATE TABLE IF NOT EXISTS solicitudes_documentos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    tipo_usuario VARCHAR(50) NOT NULL,
    documento_solicitado VARCHAR(500) NOT NULL,
    motivo TEXT,
    nivel_urgencia VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(50) DEFAULT 'pendiente',
    fecha_solicitud TIMESTAMPTZ DEFAULT NOW(),
    fecha_procesado TIMESTAMPTZ,
    procesado_por VARCHAR(255),
    notas_admin TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,

    CONSTRAINT solicitudes_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT solicitudes_tipo_usuario_check CHECK (tipo_usuario IN ('student', 'parent', 'teacher', 'other', 'Estudiante', 'Padre de familia', 'Docente', 'Otro')),
    CONSTRAINT solicitudes_urgencia_check CHECK (nivel_urgencia IN ('low', 'normal', 'high', 'urgent', 'Baja', 'Normal', 'Alta', 'Urgente'))
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_email ON solicitudes_documentos(email);
CREATE INDEX IF NOT EXISTS idx_solicitudes_status ON solicitudes_documentos(status);
CREATE INDEX IF NOT EXISTS idx_solicitudes_urgencia ON solicitudes_documentos(nivel_urgencia);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha ON solicitudes_documentos(fecha_solicitud DESC);
CREATE INDEX IF NOT EXISTS idx_solicitudes_tipo ON solicitudes_documentos(tipo_usuario);

COMMENT ON TABLE solicitudes_documentos IS 'Solicitudes de documentos oficiales (constancias, certificados, etc.)';
COMMENT ON COLUMN solicitudes_documentos.status IS 'Estado: pendiente, en_proceso, completado, rechazado';
COMMENT ON COLUMN solicitudes_documentos.nivel_urgencia IS 'Urgencia: low, normal, high, urgent';

-- Datos de prueba
INSERT INTO solicitudes_documentos (nombre, email, tipo_usuario, documento_solicitado, motivo, nivel_urgencia) VALUES
('María González', 'maria@test.com', 'student', 'Constancia de estudios', 'Para trámite de beca universitaria', 'high'),
('Pedro Ramírez', 'pedro@test.com', 'parent', 'Certificado de calificaciones', 'Solicitud de universidad', 'normal'),
('Ana Torres', 'ana@test.com', 'teacher', 'Constancia laboral', 'Trámite personal', 'low');

SELECT * FROM solicitudes_documentos;
