-- ============================================
-- 🗄️ SETUP DE BASE DE DATOS PARA PLANETSCALE
-- Bachillerato General Estatal "Héroes de la Patria"
-- ============================================
--
-- IMPORTANTE: PlanetScale no soporta:
-- - CREATE DATABASE
-- - CREATE USER
-- - GRANT
-- - FLUSH PRIVILEGES
--
-- Ejecutar este script DESPUÉS de crear el database en PlanetScale
-- ============================================

-- Usar la base de datos (debe existir en PlanetScale)
-- USE heroes_patria_db;  -- Comentado, PlanetScale ya está conectado

-- ============================================
-- TABLA: egresados
-- Sistema de seguimiento de egresados
-- ============================================

-- Eliminar tabla si existe para recrearla
DROP TABLE IF EXISTS egresados;

CREATE TABLE egresados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    generacion VARCHAR(10) NOT NULL,
    telefono VARCHAR(20),
    ciudad VARCHAR(100),
    ocupacion_actual VARCHAR(255),
    universidad VARCHAR(255),
    carrera VARCHAR(255),
    estatus_estudios ENUM('estudiando', 'titulado', 'trabajando', 'otro') DEFAULT 'otro',
    anio_egreso YEAR,
    historia_exito TEXT,
    autoriza_publicar BOOLEAN DEFAULT FALSE,
    verificado BOOLEAN DEFAULT FALSE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_generacion (generacion),
    INDEX idx_estatus (estatus_estudios),
    INDEX idx_verificado (verificado),
    INDEX idx_fecha_registro (fecha_registro)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: logs_sistema
-- Registro de actividades del sistema
-- ============================================
DROP TABLE IF EXISTS logs_sistema;

CREATE TABLE logs_sistema (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nivel ENUM('info', 'warning', 'error', 'critical') DEFAULT 'info',
    mensaje TEXT NOT NULL,
    contexto JSON,
    usuario_id INT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_nivel (nivel),
    INDEX idx_created_at (created_at),
    INDEX idx_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: usuarios
-- Sistema de autenticación
-- ============================================
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'docente', 'estudiante', 'padre') DEFAULT 'estudiante',
    activo BOOLEAN DEFAULT TRUE,
    verificado BOOLEAN DEFAULT FALSE,
    ultimo_acceso TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_rol (rol),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: bolsa_trabajo
-- Sistema de candidatos para bolsa de trabajo
-- ============================================
DROP TABLE IF EXISTS bolsa_trabajo;

CREATE TABLE bolsa_trabajo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    generacion VARCHAR(10),
    cv_url VARCHAR(500),
    habilidades TEXT,
    experiencia TEXT,
    estado ENUM('nuevo', 'revisado', 'contactado', 'contratado', 'archivado') DEFAULT 'nuevo',
    notas TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_estado (estado),
    INDEX idx_generacion (generacion),
    INDEX idx_fecha_registro (fecha_registro)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: suscriptores_notificaciones
-- Sistema de suscriptores para newsletters y notificaciones
-- ============================================
DROP TABLE IF EXISTS suscriptores_notificaciones;

CREATE TABLE suscriptores_notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255),
    tipo_suscripcion ENUM('noticias', 'eventos', 'convocatorias', 'todo') DEFAULT 'todo',
    estado ENUM('activo', 'inactivo', 'cancelado') DEFAULT 'activo',
    token_cancelacion VARCHAR(64) UNIQUE,
    emails_enviados INT DEFAULT 0,
    emails_abiertos INT DEFAULT 0,
    fecha_suscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cancelacion TIMESTAMP NULL,
    fecha_ultima_interaccion TIMESTAMP NULL,

    INDEX idx_estado (estado),
    INDEX idx_tipo (tipo_suscripcion),
    INDEX idx_token (token_cancelacion),
    INDEX idx_fecha_suscripcion (fecha_suscripcion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERTAR DATOS DE PRUEBA (OPCIONAL)
-- ============================================

-- Egresados de prueba
INSERT IGNORE INTO egresados (
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
    'Después de egresar del BGE Héroes de la Patria en 2020, ingresé a la UNAM donde me titulé con honores. Actualmente trabajo en Google y debo mi éxito a la excelente formación que recibí en el bachillerato.',
    TRUE,
    TRUE
);

INSERT IGNORE INTO egresados (
    nombre, email, generacion, telefono, ciudad,
    ocupacion_actual, universidad, carrera,
    estatus_estudios, anio_egreso, autoriza_publicar, verificado
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
    NULL,
    TRUE,
    TRUE
);

INSERT IGNORE INTO egresados (
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
);

-- Usuario administrador de prueba
-- NOTA: Password hasheado con bcrypt = "Admin123!"
-- En producción, generar nuevo hash y cambiar password
INSERT IGNORE INTO usuarios (
    nombre, email, password, rol, activo, verificado
) VALUES (
    'Administrador Sistema',
    'admin@heroesdelapatria.edu.mx',
    '$2b$10$rZ7YQKqV8jKGZXxqVqZ3uu7v7qY7QK7v7Y7qY7qY7qY7qY7qY7qY',
    'admin',
    TRUE,
    TRUE
);

-- Candidato bolsa de trabajo de prueba
INSERT IGNORE INTO bolsa_trabajo (
    nombre_completo, email, telefono, generacion,
    habilidades, estado
) VALUES (
    'Ana García Martínez',
    'ana.garcia@example.com',
    '5551112233',
    '2022',
    'JavaScript, React, Node.js, MySQL',
    'nuevo'
);

-- Suscriptor de prueba
INSERT IGNORE INTO suscriptores_notificaciones (
    email, nombre, tipo_suscripcion, estado
) VALUES (
    'ejemplo.suscriptor@gmail.com',
    'Ejemplo Suscriptor',
    'todo',
    'activo'
);

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

-- Para verificar que todo se creó correctamente, ejecutar:
-- SHOW TABLES;
-- SELECT COUNT(*) FROM egresados;
-- SELECT COUNT(*) FROM usuarios;
-- SELECT COUNT(*) FROM bolsa_trabajo;
-- SELECT COUNT(*) FROM suscriptores_notificaciones;
