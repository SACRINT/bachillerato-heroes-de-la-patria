-- ============================================
-- TABLA: egresados
-- Descripción: Almacena datos de actualización de egresados
-- Fecha creación: 3 de Octubre 2025
-- ============================================

CREATE TABLE IF NOT EXISTS egresados (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Información Personal
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    generacion VARCHAR(20) NOT NULL,
    telefono VARCHAR(20),
    ciudad VARCHAR(100),
    ocupacion_actual VARCHAR(150),

    -- Formación Académica
    universidad VARCHAR(150),
    carrera VARCHAR(150),
    estatus_estudios ENUM('estudiante', 'titulado', 'trunco', 'no-estudios'),
    año_egreso YEAR,

    -- Historia de Éxito
    historia_exito TEXT,
    autoriza_publicar BOOLEAN DEFAULT FALSE,

    -- Metadatos
    autoriza_datos BOOLEAN DEFAULT TRUE,
    verificado BOOLEAN DEFAULT TRUE,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ip_registro VARCHAR(45),

    -- Índices para búsqueda rápida
    INDEX idx_email (email),
    INDEX idx_generacion (generacion),
    INDEX idx_fecha_registro (fecha_registro),
    INDEX idx_verificado (verificado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentario de la tabla
ALTER TABLE egresados COMMENT = 'Registro de egresados del bachillerato que actualizan sus datos';
