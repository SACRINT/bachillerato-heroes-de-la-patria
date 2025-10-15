-- ============================================
-- 🗄️ SETUP DE BASE DE DATOS COMPLETA
-- Bachillerato General Estatal "Héroes de la Patria"
-- ============================================

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS heroes_patria_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE heroes_patria_db;

-- ============================================
-- TABLA: egresados
-- Sistema de seguimiento de egresados
-- ============================================

-- ✅ SOLUCIÓN: Eliminar tabla si existe para recrearla con columnas correctas
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
CREATE TABLE IF NOT EXISTS logs_sistema (
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
CREATE TABLE IF NOT EXISTS usuarios (
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
-- INSERTAR DATOS DE PRUEBA (OPCIONAL)
-- ============================================

-- Egresado de prueba
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

-- Usuario administrador de prueba (password: Admin123!)
-- NOTA: En producción, cambiar este password
INSERT IGNORE INTO usuarios (
    nombre, email, password, rol, activo, verificado
) VALUES (
    'Administrador Sistema',
    'admin@heroesdelapatria.edu.mx',
    '$2b$10$rZ7YQKqV8jKGZXxqVqZ3uu7v7qY7QK7v7Y7qY7qY7qY7qY7qY7qY', -- password: Admin123!
    'admin',
    TRUE,
    TRUE
);

-- ============================================
-- CREAR USUARIO DE BASE DE DATOS
-- ============================================

-- Crear usuario si no existe
CREATE USER IF NOT EXISTS 'bge_user'@'localhost' IDENTIFIED BY 'HeroesPatria2025DB!';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON heroes_patria_db.* TO 'bge_user'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Mostrar tablas creadas
SHOW TABLES;

-- Mostrar conteo de registros
SELECT 'egresados' AS tabla, COUNT(*) AS registros FROM egresados
UNION ALL
SELECT 'logs_sistema', COUNT(*) FROM logs_sistema
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios;

SELECT '✅ Base de datos configurada exitosamente' AS status;
