-- ============================================
-- 🗄️ EJECUTAR ESTE SCRIPT EN NEON SQL EDITOR
-- ============================================
--
-- INSTRUCCIONES:
-- 1. Ve a: https://console.neon.tech
-- 2. Abre el proyecto "heroes-patria-db"
-- 3. Busca "SQL Editor" en el menú lateral
-- 4. Copia TODO este archivo y pégalo
-- 5. Haz clic en "Run" o "Execute"
--
-- ============================================

-- Eliminar tablas si existen (orden inverso por foreign keys)
DROP TABLE IF EXISTS suscriptores_notificaciones CASCADE;
DROP TABLE IF EXISTS bolsa_trabajo CASCADE;
DROP TABLE IF EXISTS logs_sistema CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS egresados CASCADE;

-- ============================================
-- TABLA: egresados
-- ============================================

CREATE TABLE egresados (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    generacion VARCHAR(10) NOT NULL,
    telefono VARCHAR(20),
    ciudad VARCHAR(100),
    ocupacion_actual VARCHAR(255),
    universidad VARCHAR(255),
    carrera VARCHAR(255),
    estatus_estudios VARCHAR(50) DEFAULT 'otro' CHECK (estatus_estudios IN ('estudiando', 'titulado', 'trabajando', 'otro')),
    anio_egreso INTEGER,
    historia_exito TEXT,
    autoriza_publicar BOOLEAN DEFAULT FALSE,
    verificado BOOLEAN DEFAULT FALSE,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para egresados
CREATE INDEX idx_egresados_generacion ON egresados(generacion);
CREATE INDEX idx_egresados_estatus ON egresados(estatus_estudios);
CREATE INDEX idx_egresados_verificado ON egresados(verificado);
CREATE INDEX idx_egresados_fecha_registro ON egresados(fecha_registro);

-- Trigger para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION update_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER egresados_fecha_actualizacion
    BEFORE UPDATE ON egresados
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_actualizacion();

-- ============================================
-- TABLA: logs_sistema
-- ============================================

CREATE TABLE logs_sistema (
    id SERIAL PRIMARY KEY,
    nivel VARCHAR(20) DEFAULT 'info' CHECK (nivel IN ('info', 'warning', 'error', 'critical')),
    mensaje TEXT NOT NULL,
    contexto JSONB,
    usuario_id INTEGER,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para logs_sistema
CREATE INDEX idx_logs_nivel ON logs_sistema(nivel);
CREATE INDEX idx_logs_created_at ON logs_sistema(created_at);
CREATE INDEX idx_logs_usuario ON logs_sistema(usuario_id);

-- ============================================
-- TABLA: usuarios
-- ============================================

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'estudiante' CHECK (rol IN ('admin', 'docente', 'estudiante', 'padre')),
    activo BOOLEAN DEFAULT TRUE,
    verificado BOOLEAN DEFAULT FALSE,
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para usuarios
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

-- Trigger para updated_at
CREATE TRIGGER usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_actualizacion();

-- ============================================
-- TABLA: bolsa_trabajo
-- ============================================

CREATE TABLE bolsa_trabajo (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    generacion VARCHAR(10),
    cv_url VARCHAR(500),
    habilidades TEXT,
    experiencia TEXT,
    estado VARCHAR(20) DEFAULT 'nuevo' CHECK (estado IN ('nuevo', 'revisado', 'contactado', 'contratado', 'archivado')),
    notas TEXT,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para bolsa_trabajo
CREATE INDEX idx_bolsa_estado ON bolsa_trabajo(estado);
CREATE INDEX idx_bolsa_generacion ON bolsa_trabajo(generacion);
CREATE INDEX idx_bolsa_fecha_registro ON bolsa_trabajo(fecha_registro);

-- Trigger para fecha_actualizacion
CREATE TRIGGER bolsa_trabajo_fecha_actualizacion
    BEFORE UPDATE ON bolsa_trabajo
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_actualizacion();

-- ============================================
-- TABLA: suscriptores_notificaciones
-- ============================================

CREATE TABLE suscriptores_notificaciones (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255),
    tipo_suscripcion VARCHAR(20) DEFAULT 'todo' CHECK (tipo_suscripcion IN ('noticias', 'eventos', 'convocatorias', 'todo')),
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'cancelado')),
    token_cancelacion VARCHAR(64) UNIQUE,
    emails_enviados INTEGER DEFAULT 0,
    emails_abiertos INTEGER DEFAULT 0,
    fecha_suscripcion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_cancelacion TIMESTAMP WITH TIME ZONE,
    fecha_ultima_interaccion TIMESTAMP WITH TIME ZONE
);

-- Índices para suscriptores_notificaciones
CREATE INDEX idx_suscriptores_estado ON suscriptores_notificaciones(estado);
CREATE INDEX idx_suscriptores_tipo ON suscriptores_notificaciones(tipo_suscripcion);
CREATE INDEX idx_suscriptores_token ON suscriptores_notificaciones(token_cancelacion);
CREATE INDEX idx_suscriptores_fecha_suscripcion ON suscriptores_notificaciones(fecha_suscripcion);

-- ============================================
-- DATOS DE PRUEBA
-- ============================================

-- Egresados de prueba
INSERT INTO egresados (
    nombre, email, generacion, telefono, ciudad,
    ocupacion_actual, universidad, carrera,
    estatus_estudios, anio_egreso, historia_exito, autoriza_publicar, verificado
) VALUES (
    'Juan Pérez García',
    'juan.perez@example.com',
    '2020',
    '5551234567',
    'Ciudad de México',
    'Ingeniero de Software en Google',
    'UNAM',
    'Ingeniería en Computación',
    'titulado',
    2024,
    'Después de egresar del BGE Héroes de la Patria en 2020, ingresé a la UNAM donde me titulé con honores.',
    TRUE,
    TRUE
) ON CONFLICT (email) DO NOTHING;

INSERT INTO egresados (
    nombre, email, generacion, telefono, ciudad,
    ocupacion_actual, universidad, carrera,
    estatus_estudios, autoriza_publicar, verificado
) VALUES (
    'María López Hernández',
    'maria.lopez@example.com',
    '2019',
    '5557654321',
    'Guadalajara',
    'Médico Cirujano',
    'Universidad de Guadalajara',
    'Medicina',
    'estudiando',
    TRUE,
    TRUE
) ON CONFLICT (email) DO NOTHING;

INSERT INTO egresados (
    nombre, email, generacion, telefono,
    ocupacion_actual, estatus_estudios, autoriza_publicar, verificado
) VALUES (
    'Carlos Rodríguez Sánchez',
    'carlos.rodriguez@example.com',
    '2021',
    '5559876543',
    'Emprendedor - Startup Tecnológica',
    'trabajando',
    TRUE,
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Usuario administrador de prueba
INSERT INTO usuarios (
    nombre, email, password, rol, activo, verificado
) VALUES (
    'Administrador Sistema',
    'admin@heroesdelapatria.edu.mx',
    '$2b$10$rZ7YQKqV8jKGZXxqVqZ3uu7v7qY7QK7v7Y7qY7qY7qY7qY7qY7qY',
    'admin',
    TRUE,
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Candidato bolsa de trabajo
INSERT INTO bolsa_trabajo (
    nombre_completo, email, telefono, generacion,
    habilidades, estado
) VALUES (
    'Ana García Martínez',
    'ana.garcia@example.com',
    '5551112233',
    '2022',
    'JavaScript, React, Node.js, MySQL, PostgreSQL',
    'nuevo'
) ON CONFLICT (email) DO NOTHING;

-- Suscriptor de prueba
INSERT INTO suscriptores_notificaciones (
    email, nombre, tipo_suscripcion, estado
) VALUES (
    'ejemplo.suscriptor@gmail.com',
    'Ejemplo Suscriptor',
    'todo',
    'activo'
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT
    'egresados' AS tabla,
    COUNT(*) AS registros
FROM egresados
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL
SELECT 'bolsa_trabajo', COUNT(*) FROM bolsa_trabajo
UNION ALL
SELECT 'suscriptores_notificaciones', COUNT(*) FROM suscriptores_notificaciones
UNION ALL
SELECT 'logs_sistema', COUNT(*) FROM logs_sistema;

-- ============================================
-- ✅ COMPLETADO
-- ============================================
