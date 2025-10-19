/**
 * 🎓 SCRIPT DE CREACIÓN DE TABLA EGRESADOS
 * Base de datos: PostgreSQL (Neon)
 * Sistema de gestión de perfiles profesionales
 */

-- Eliminar tabla si existe (solo en desarrollo)
DROP TABLE IF EXISTS egresados CASCADE;

-- Crear tabla de egresados
CREATE TABLE egresados (
    -- ID y control
    id SERIAL PRIMARY KEY,
    egresado_id VARCHAR(50) UNIQUE NOT NULL,

    -- Datos personales
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    fecha_nacimiento DATE,

    -- Educación
    anio_egreso INTEGER NOT NULL,
    carrera_tecnica VARCHAR(255) NOT NULL,
    generacion VARCHAR(50),

    -- Experiencia y habilidades
    experiencia_laboral TEXT,
    habilidades JSONB DEFAULT '[]'::JSONB,
    idiomas JSONB DEFAULT '[]'::JSONB,

    -- Información profesional
    cv_url TEXT,
    disponibilidad VARCHAR(50) DEFAULT 'inmediata',
    pretension_salarial VARCHAR(100),

    -- Ubicación
    ciudad VARCHAR(100),
    estado VARCHAR(100),

    -- Redes y portafolio
    linkedin_url TEXT,
    portafolio_url TEXT,
    referencias JSONB DEFAULT '[]'::JSONB,

    -- Control de estado
    estado_perfil VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_perfil IN (
        'pendiente',
        'aprobado',
        'rechazado',
        'inactivo'
    )),

    -- Confirmación de email
    confirmado BOOLEAN DEFAULT FALSE,
    token_confirmacion VARCHAR(64) UNIQUE,
    fecha_confirmacion TIMESTAMP WITH TIME ZONE,

    -- Fechas de revisión
    fecha_aprobacion TIMESTAMP WITH TIME ZONE,
    fecha_rechazo TIMESTAMP WITH TIME ZONE,
    motivo_rechazo TEXT,

    -- Notas administrativas
    notas_admin TEXT,

    -- Metadatos
    metadata JSONB DEFAULT '{}'::JSONB,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_egresados_email ON egresados(email);
CREATE INDEX idx_egresados_estado ON egresados(estado_perfil);
CREATE INDEX idx_egresados_confirmado ON egresados(confirmado);
CREATE INDEX idx_egresados_anio_egreso ON egresados(anio_egreso);
CREATE INDEX idx_egresados_carrera ON egresados(carrera_tecnica);
CREATE INDEX idx_egresados_token ON egresados(token_confirmacion);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_egresados_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_egresados_updated_at
    BEFORE UPDATE ON egresados
    FOR EACH ROW
    EXECUTE FUNCTION update_egresados_updated_at();

-- Insertar datos de prueba
INSERT INTO egresados (
    egresado_id,
    nombre_completo,
    email,
    telefono,
    anio_egreso,
    carrera_tecnica,
    generacion,
    experiencia_laboral,
    habilidades,
    idiomas,
    disponibilidad,
    ciudad,
    estado,
    linkedin_url,
    estado_perfil,
    confirmado,
    token_confirmacion
) VALUES
(
    'EGR-2025-0001',
    'Juan Carlos Pérez García',
    'juan.perez@example.com',
    '2221234567',
    2023,
    'Técnico en Programación',
    '2020-2023',
    'Desarrollador Junior en Tech Solutions - 1 año de experiencia en desarrollo web con React y Node.js',
    '["JavaScript", "React", "Node.js", "PostgreSQL", "Git"]'::JSONB,
    '["Español (Nativo)", "Inglés (Intermedio)"]'::JSONB,
    'inmediata',
    'Puebla',
    'Puebla',
    'https://linkedin.com/in/juanperez',
    'pendiente',
    false,
    'test_token_001'
),
(
    'EGR-2025-0002',
    'María Fernanda López Ramírez',
    'maria.lopez@example.com',
    '2229876543',
    2022,
    'Técnico en Contabilidad',
    '2019-2022',
    'Auxiliar Contable en Contadores Asociados - 2 años de experiencia en contabilidad general y nómina',
    '["Contabilidad", "Excel Avanzado", "CONTPAQi", "Facturación Electrónica", "SAT"]'::JSONB,
    '["Español (Nativo)", "Inglés (Básico)"]'::JSONB,
    'inmediata',
    'Puebla',
    'Puebla',
    'https://linkedin.com/in/marialopez',
    'aprobado',
    true,
    'test_token_002'
),
(
    'EGR-2025-0003',
    'Carlos Eduardo Hernández Sánchez',
    'carlos.hernandez@example.com',
    '2223456789',
    2024,
    'Técnico en Mecatrónica',
    '2021-2024',
    'Recién egresado con proyecto final en automatización industrial',
    '["Arduino", "PLC", "AutoCAD", "Electrónica", "Mantenimiento Industrial"]'::JSONB,
    '["Español (Nativo)", "Inglés (Avanzado)"]'::JSONB,
    'inmediata',
    'Puebla',
    'Puebla',
    'https://linkedin.com/in/carloshernandez',
    'pendiente',
    true,
    'test_token_003'
);

-- Verificar inserción
SELECT
    egresado_id,
    nombre_completo,
    carrera_tecnica,
    anio_egreso,
    estado_perfil,
    confirmado
FROM egresados
ORDER BY created_at DESC;

-- Mostrar estadísticas
SELECT
    COUNT(*) as total,
    COUNT(CASE WHEN confirmado = true THEN 1 END) as confirmados,
    COUNT(CASE WHEN estado_perfil = 'pendiente' THEN 1 END) as pendientes,
    COUNT(CASE WHEN estado_perfil = 'aprobado' THEN 1 END) as aprobados
FROM egresados;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Tabla egresados creada exitosamente';
    RAISE NOTICE '📊 3 perfiles de prueba insertados';
    RAISE NOTICE '🔧 Sistema de gestión de egresados listo para usar';
END $$;
