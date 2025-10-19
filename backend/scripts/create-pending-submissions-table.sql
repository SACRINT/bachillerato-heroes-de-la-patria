-- =====================================================
-- TABLA DE SOLICITUDES PENDIENTES DE APROBACIÓN
-- Sistema de moderación para formularios que requieren aprobación manual
-- Fecha: 17 Octubre 2025
-- =====================================================

CREATE TABLE IF NOT EXISTS pending_submissions (
    id SERIAL PRIMARY KEY,

    -- Tipo de formulario
    form_type VARCHAR(50) NOT NULL CHECK (form_type IN (
        'bolsa_trabajo',
        'egresados',
        'inscripciones_actividades',
        'otros'
    )),

    -- Datos del formulario (almacenado como JSON flexible)
    submission_data JSONB NOT NULL,

    -- Estado de la solicitud
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

    -- Token de verificación de email (si aplica)
    verification_token VARCHAR(255),
    email_verified BOOLEAN DEFAULT false,
    verification_email VARCHAR(255),

    -- Datos administrativos
    reviewed_by VARCHAR(255),       -- Admin que revisó
    review_notes TEXT,               -- Notas del administrador
    rejection_reason TEXT,           -- Razón de rechazo

    -- Fechas
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,           -- Cuándo se verificó el email
    reviewed_at TIMESTAMP,           -- Cuándo se aprobó/rechazó

    -- Metadatos
    ip_address VARCHAR(50),
    user_agent TEXT
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_pending_status ON pending_submissions(status);
CREATE INDEX IF NOT EXISTS idx_pending_form_type ON pending_submissions(form_type);
CREATE INDEX IF NOT EXISTS idx_pending_token ON pending_submissions(verification_token);
CREATE INDEX IF NOT EXISTS idx_pending_email_verified ON pending_submissions(email_verified);
CREATE INDEX IF NOT EXISTS idx_pending_created ON pending_submissions(created_at);

-- Índice para búsqueda rápida por email en el JSON
CREATE INDEX IF NOT EXISTS idx_pending_email_json ON pending_submissions ((submission_data->>'email'));

-- Comentarios
COMMENT ON TABLE pending_submissions IS 'Almacena envíos de formularios que requieren aprobación administrativa antes de ser guardados en sus tablas finales';
COMMENT ON COLUMN pending_submissions.form_type IS 'Tipo de formulario: bolsa_trabajo, egresados, inscripciones_actividades, etc.';
COMMENT ON COLUMN pending_submissions.submission_data IS 'Datos completos del formulario en formato JSON';
COMMENT ON COLUMN pending_submissions.status IS 'pending: En espera de aprobación, approved: Aprobada, rejected: Rechazada';
COMMENT ON COLUMN pending_submissions.email_verified IS 'Indica si el usuario verificó su email antes de la revisión administrativa';
