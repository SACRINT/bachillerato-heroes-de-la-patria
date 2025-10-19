-- =====================================================
-- TABLA DE INSCRIPCIONES A ACTIVIDADES
-- Gestión de solicitudes de inscripción a actividades
-- Fecha: 17 Octubre 2025
-- =====================================================

CREATE TABLE IF NOT EXISTS inscripciones_actividades (
    id SERIAL PRIMARY KEY,

    -- Datos de la actividad
    activity_id VARCHAR(100) NOT NULL,
    activity_name VARCHAR(255) NOT NULL,

    -- Datos del estudiante
    student_id VARCHAR(50) NOT NULL,  -- Matrícula o "Externo"
    student_name VARCHAR(255) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    student_group VARCHAR(100),
    emergency_contact VARCHAR(50),
    additional_info TEXT,

    -- Estado de la solicitud
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),

    -- Datos administrativos
    processed_by VARCHAR(255),  -- Admin que procesó
    admin_notes TEXT,           -- Notas del administrador
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_procesado TIMESTAMP,

    -- Metadatos
    ip_address VARCHAR(50),
    user_agent TEXT,

    -- Índices
    CONSTRAINT unique_student_activity UNIQUE (student_email, activity_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_inscripciones_status ON inscripciones_actividades(status);
CREATE INDEX IF NOT EXISTS idx_inscripciones_activity ON inscripciones_actividades(activity_id);
CREATE INDEX IF NOT EXISTS idx_inscripciones_email ON inscripciones_actividades(student_email);
CREATE INDEX IF NOT EXISTS idx_inscripciones_fecha ON inscripciones_actividades(fecha_solicitud);

-- Comentarios
COMMENT ON TABLE inscripciones_actividades IS 'Gestión de solicitudes de inscripción a actividades extracurriculares';
COMMENT ON COLUMN inscripciones_actividades.status IS 'pending: En espera de revisión, approved: Aprobada, rejected: Rechazada, cancelled: Cancelada por el usuario';
COMMENT ON COLUMN inscripciones_actividades.student_id IS 'Matrícula del estudiante o "Externo" para usuarios no registrados';
