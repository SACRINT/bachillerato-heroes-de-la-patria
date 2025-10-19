-- =====================================================
-- SCRIPT: Crear tabla de solicitudes de recuperación de contraseña
-- Fecha: 17 de Octubre 2025
-- Propósito: Almacenar solicitudes de recuperación de contraseña de padres
-- =====================================================

CREATE TABLE IF NOT EXISTS password_recovery_requests (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    student_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    fecha_solicitud TIMESTAMPTZ DEFAULT NOW(),
    fecha_procesado TIMESTAMPTZ,
    procesado_por VARCHAR(255),
    notas_admin TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    token VARCHAR(255),
    token_expires_at TIMESTAMPTZ,

    CONSTRAINT recovery_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX IF NOT EXISTS idx_recovery_email ON password_recovery_requests(email);
CREATE INDEX IF NOT EXISTS idx_recovery_status ON password_recovery_requests(status);
CREATE INDEX IF NOT EXISTS idx_recovery_fecha ON password_recovery_requests(fecha_solicitud DESC);
CREATE INDEX IF NOT EXISTS idx_recovery_token ON password_recovery_requests(token);

COMMENT ON TABLE password_recovery_requests IS 'Solicitudes de recuperación de contraseña del portal de padres';
COMMENT ON COLUMN password_recovery_requests.status IS 'Estado: pending, processed, expired, cancelled';

-- Datos de prueba
INSERT INTO password_recovery_requests (email, student_id) VALUES
('padre1@test.com', 'BGE-2024-001'),
('padre2@test.com', 'BGE-2024-002');

SELECT * FROM password_recovery_requests;
