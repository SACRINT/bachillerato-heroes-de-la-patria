-- ============================================
-- 📅 TABLAS PARA SISTEMA DE CITAS
-- Bachillerato General Estatal "Héroes de la Patria"
-- PostgreSQL (Neon/Vercel compatible)
-- ============================================

-- Eliminar tablas si existen
DROP TABLE IF EXISTS citas CASCADE;

-- ============================================
-- TABLA: citas
-- Sistema de gestión de citas
-- ============================================

CREATE TABLE citas (
    id SERIAL PRIMARY KEY,
    cita_id VARCHAR(50) UNIQUE NOT NULL, -- CITA-2025-0001

    -- Información del solicitante
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    tipo_persona VARCHAR(50) NOT NULL CHECK (tipo_persona IN (
        'estudiante', 'padre', 'madre', 'tutor',
        'docente', 'administrativo', 'externo'
    )),

    -- Detalles de la cita
    motivo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_solicitada DATE NOT NULL,
    hora_solicitada TIME NOT NULL,

    -- Estado y gestión
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN (
        'pendiente', 'aprobada', 'rechazada', 'cancelada', 'completada'
    )),

    -- Información de aprobación/rechazo
    fecha_aprobada TIMESTAMP WITH TIME ZONE,
    fecha_rechazada TIMESTAMP WITH TIME ZONE,
    motivo_rechazo TEXT,

    -- Confirmación
    confirmada BOOLEAN DEFAULT FALSE,
    token_confirmacion VARCHAR(64) UNIQUE,

    -- Metadata
    notas_admin TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para citas
CREATE INDEX idx_citas_email ON citas(email);
CREATE INDEX idx_citas_estado ON citas(estado);
CREATE INDEX idx_citas_fecha_solicitada ON citas(fecha_solicitada);
CREATE INDEX idx_citas_tipo_persona ON citas(tipo_persona);
CREATE INDEX idx_citas_created_at ON citas(created_at);
CREATE INDEX idx_citas_token ON citas(token_confirmacion);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_citas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER citas_updated_at
    BEFORE UPDATE ON citas
    FOR EACH ROW
    EXECUTE FUNCTION update_citas_updated_at();

-- ============================================
-- DATOS DE PRUEBA (OPCIONAL)
-- ============================================

-- Citas de prueba
INSERT INTO citas (
    cita_id, nombre_completo, email, telefono, tipo_persona,
    motivo, descripcion, fecha_solicitada, hora_solicitada,
    estado, confirmada, token_confirmacion
) VALUES
(
    'CITA-2025-0001',
    'Juan Pérez García',
    'juan.perez@example.com',
    '2221234567',
    'padre',
    'Asesoría Académica',
    'Consulta sobre el desempeño académico de mi hijo en matemáticas',
    CURRENT_DATE + INTERVAL '3 days',
    '10:00:00',
    'pendiente',
    FALSE,
    encode(gen_random_bytes(32), 'hex')
),
(
    'CITA-2025-0002',
    'María López Hernández',
    'maria.lopez@example.com',
    '2229876543',
    'madre',
    'Inscripción',
    'Información sobre el proceso de inscripción para el próximo ciclo',
    CURRENT_DATE + INTERVAL '5 days',
    '11:00:00',
    'aprobada',
    TRUE,
    encode(gen_random_bytes(32), 'hex')
),
(
    'CITA-2025-0003',
    'Carlos Rodríguez',
    'carlos.rodriguez@example.com',
    '2225551234',
    'estudiante',
    'Orientación Vocacional',
    'Necesito orientación sobre opciones de carrera universitaria',
    CURRENT_DATE + INTERVAL '1 day',
    '14:00:00',
    'aprobada',
    TRUE,
    encode(gen_random_bytes(32), 'hex')
)
ON CONFLICT (cita_id) DO NOTHING;

-- ============================================
-- CONSULTAS DE VERIFICACIÓN
-- ============================================

-- Ver citas
SELECT
    cita_id,
    nombre_completo,
    email,
    tipo_persona,
    motivo,
    fecha_solicitada,
    hora_solicitada,
    estado,
    confirmada,
    created_at
FROM citas
ORDER BY created_at DESC;

-- Ver estadísticas de citas
SELECT
    estado,
    COUNT(*) AS total
FROM citas
GROUP BY estado
ORDER BY total DESC;

-- Ver citas por tipo de persona
SELECT
    tipo_persona,
    COUNT(*) AS total
FROM citas
GROUP BY tipo_persona
ORDER BY total DESC;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

-- 🎉 Tabla de citas creada exitosamente
-- ✅ 1 tabla: citas
-- ✅ Índices optimizados para consultas rápidas
-- ✅ Trigger para updated_at automático
-- ✅ Datos de prueba insertados
