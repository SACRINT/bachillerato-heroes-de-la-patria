-- =================================================================
-- 🗄️ BGE HÉROES DE LA PATRIA - ESQUEMA DE BASE DE DATOS REAL
-- Esquema completo para funcionamiento operativo del sistema
-- Fecha: 2025-09-25
-- Estado: BASE FUNCIONAL (FASE A)
-- =================================================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS heroes_patria_db
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE heroes_patria_db;

-- =================================================================
-- TABLA DE USUARIOS (SISTEMA BÁSICO)
-- =================================================================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'docente', 'estudiante', 'padre') NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP NULL,
    foto_perfil VARCHAR(255) DEFAULT NULL,
    telefono VARCHAR(20) DEFAULT NULL
);

-- =================================================================
-- TABLA DE ESTUDIANTES (CRUD BÁSICO)
-- =================================================================
CREATE TABLE estudiantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    curp VARCHAR(18) UNIQUE NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    genero ENUM('M', 'F') NOT NULL,
    direccion TEXT,
    grupo VARCHAR(10),
    semestre INT DEFAULT 1,
    turno ENUM('matutino', 'vespertino') DEFAULT 'matutino',
    estado_alumno ENUM('activo', 'baja_temporal', 'egresado') DEFAULT 'activo',
    promedio_general DECIMAL(4,2) DEFAULT 0.00,
    fecha_ingreso DATE DEFAULT (CURRENT_DATE),
    observaciones TEXT,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_matricula (matricula),
    INDEX idx_curp (curp),
    INDEX idx_grupo (grupo)
);

-- =================================================================
-- TABLA DE DOCENTES
-- =================================================================
CREATE TABLE docentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    numero_empleado VARCHAR(20) UNIQUE NOT NULL,
    cedula_profesional VARCHAR(20),
    especialidad VARCHAR(100),
    grado_estudios VARCHAR(100),
    fecha_ingreso DATE NOT NULL,
    estado_docente ENUM('activo', 'comisionado', 'licencia', 'jubilado') DEFAULT 'activo',

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_numero_empleado (numero_empleado)
);

-- =================================================================
-- TABLA DE MATERIAS
-- =================================================================
CREATE TABLE materias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    clave VARCHAR(20) UNIQUE NOT NULL,
    creditos INT DEFAULT 4,
    semestre INT NOT NULL,
    area ENUM('basica', 'propedeutica', 'profesional') NOT NULL,
    horas_teoria INT DEFAULT 3,
    horas_practica INT DEFAULT 1,
    descripcion TEXT,
    activa BOOLEAN DEFAULT TRUE,

    INDEX idx_clave (clave),
    INDEX idx_semestre (semestre)
);

-- =================================================================
-- TABLA DE GRUPOS
-- =================================================================
CREATE TABLE grupos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(10) NOT NULL,
    semestre INT NOT NULL,
    turno ENUM('matutino', 'vespertino') NOT NULL,
    generacion VARCHAR(10) NOT NULL,
    docente_tutor_id INT,
    aula VARCHAR(20),
    cupo_maximo INT DEFAULT 40,
    activo BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (docente_tutor_id) REFERENCES docentes(id),
    UNIQUE KEY unique_grupo (nombre, generacion),
    INDEX idx_semestre_turno (semestre, turno)
);

-- =================================================================
-- TABLA DE INSCRIPCIONES (RELACIÓN ESTUDIANTE-GRUPO)
-- =================================================================
CREATE TABLE inscripciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id INT NOT NULL,
    grupo_id INT NOT NULL,
    ciclo_escolar VARCHAR(10) NOT NULL, -- Ej: "2024-2025"
    fecha_inscripcion DATE DEFAULT (CURRENT_DATE),
    estado ENUM('inscrito', 'baja', 'reincorporado') DEFAULT 'inscrito',

    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id),
    UNIQUE KEY unique_inscripcion (estudiante_id, ciclo_escolar),
    INDEX idx_ciclo_escolar (ciclo_escolar)
);

-- =================================================================
-- TABLA DE CALIFICACIONES
-- =================================================================
CREATE TABLE calificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id INT NOT NULL,
    materia_id INT NOT NULL,
    parcial INT NOT NULL CHECK (parcial BETWEEN 1 AND 3),
    calificacion DECIMAL(4,2) NOT NULL CHECK (calificacion BETWEEN 0 AND 10),
    ciclo_escolar VARCHAR(10) NOT NULL,
    fecha_captura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    docente_id INT,
    observaciones TEXT,

    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
    FOREIGN KEY (materia_id) REFERENCES materias(id),
    FOREIGN KEY (docente_id) REFERENCES docentes(id),
    UNIQUE KEY unique_calificacion (estudiante_id, materia_id, parcial, ciclo_escolar),
    INDEX idx_parcial (parcial),
    INDEX idx_ciclo_escolar (ciclo_escolar)
);

-- =================================================================
-- TABLA DE PADRES DE FAMILIA
-- =================================================================
CREATE TABLE padres_familia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    tipo_familiar ENUM('padre', 'madre', 'tutor') NOT NULL,
    ocupacion VARCHAR(100),
    empresa VARCHAR(150),
    telefono_trabajo VARCHAR(20),
    telefono_emergencia VARCHAR(20),

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- =================================================================
-- TABLA DE RELACIÓN ESTUDIANTE-PADRE
-- =================================================================
CREATE TABLE estudiante_padre (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id INT NOT NULL,
    padre_id INT NOT NULL,
    relacion ENUM('hijo', 'hija', 'tutelado') NOT NULL,
    es_contacto_principal BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
    FOREIGN KEY (padre_id) REFERENCES padres_familia(id) ON DELETE CASCADE,
    UNIQUE KEY unique_relacion (estudiante_id, padre_id)
);

-- =================================================================
-- TABLA DE SESIONES (BÁSICO DE AUTENTICACIÓN)
-- =================================================================
CREATE TABLE sesiones (
    id VARCHAR(128) PRIMARY KEY,
    usuario_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL,
    activa BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_activa (usuario_id, activa),
    INDEX idx_expiracion (fecha_expiracion)
);

-- =================================================================
-- TABLA DE EVENTOS/CALENDARIO
-- =================================================================
CREATE TABLE eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    tipo ENUM('academico', 'administrativo', 'social', 'deportivo') NOT NULL,
    dirigido_a SET('estudiantes', 'docentes', 'padres', 'general') NOT NULL,
    lugar VARCHAR(150),
    organizador_id INT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (organizador_id) REFERENCES usuarios(id),
    INDEX idx_fecha_inicio (fecha_inicio),
    INDEX idx_tipo (tipo)
);

-- =================================================================
-- DATOS INICIALES CRÍTICOS
-- =================================================================

-- Usuario administrador inicial
INSERT INTO usuarios (nombre, apellido, email, password_hash, rol) VALUES
('Administrador', 'Sistema', 'admin@bgeheheroespatria.edu.mx', '$2b$12$LQv3c1yqBWVHxkd0LQ4YCOdtRh', 'admin');

-- Materias básicas de bachillerato
INSERT INTO materias (nombre, clave, semestre, area, creditos) VALUES
('Matemáticas I', 'MAT-I', 1, 'basica', 4),
('Español I', 'ESP-I', 1, 'basica', 4),
('Historia de México I', 'HMX-I', 1, 'basica', 3),
('Química I', 'QUI-I', 1, 'basica', 4),
('Inglés I', 'ING-I', 1, 'basica', 3),
('Educación Física I', 'EDF-I', 1, 'basica', 2),
('Matemáticas II', 'MAT-II', 2, 'basica', 4),
('Español II', 'ESP-II', 2, 'basica', 4),
('Historia de México II', 'HMX-II', 2, 'basica', 3),
('Química II', 'QUI-II', 2, 'basica', 4),
('Inglés II', 'ING-II', 2, 'basica', 3),
('Educación Física II', 'EDF-II', 2, 'basica', 2);

-- Grupo ejemplo
INSERT INTO grupos (nombre, semestre, turno, generacion, aula, cupo_maximo) VALUES
('1A', 1, 'matutino', '2024-2027', 'A-101', 35),
('1B', 1, 'matutino', '2024-2027', 'A-102', 35),
('2A', 2, 'matutino', '2023-2026', 'B-201', 30);

-- =================================================================
-- ÍNDICES ADICIONALES PARA RENDIMIENTO
-- =================================================================

-- Índices compuestos para consultas frecuentes
CREATE INDEX idx_estudiante_estado_semestre ON estudiantes(estado_alumno, semestre);
CREATE INDEX idx_calificaciones_busqueda ON calificaciones(estudiante_id, ciclo_escolar, parcial);
CREATE INDEX idx_usuarios_rol_activo ON usuarios(rol, activo);

-- =================================================================
-- TRIGGERS PARA AUDITORÍA BÁSICA
-- =================================================================

-- Trigger para actualizar último acceso
DELIMITER //
CREATE TRIGGER tr_usuario_ultimo_acceso
    AFTER INSERT ON sesiones
    FOR EACH ROW
BEGIN
    UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = NEW.usuario_id;
END //
DELIMITER ;

-- =================================================================
-- VISTAS ÚTILES PARA EL SISTEMA
-- =================================================================

-- Vista de estudiantes con información completa
CREATE VIEW v_estudiantes_completo AS
SELECT
    e.id,
    e.matricula,
    u.nombre,
    u.apellido,
    e.curp,
    e.grupo,
    e.semestre,
    e.turno,
    e.estado_alumno,
    e.promedio_general,
    u.email,
    u.telefono
FROM estudiantes e
JOIN usuarios u ON e.usuario_id = u.id
WHERE u.activo = TRUE;

-- Vista de calificaciones con nombres
CREATE VIEW v_calificaciones_detalle AS
SELECT
    c.id,
    e.matricula,
    u.nombre AS estudiante_nombre,
    u.apellido AS estudiante_apellido,
    m.nombre AS materia_nombre,
    m.clave AS materia_clave,
    c.parcial,
    c.calificacion,
    c.ciclo_escolar,
    c.fecha_captura
FROM calificaciones c
JOIN estudiantes e ON c.estudiante_id = e.id
JOIN usuarios u ON e.usuario_id = u.id
JOIN materias m ON c.materia_id = m.id;

-- =================================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =================================================================

ALTER TABLE usuarios COMMENT = 'Tabla principal de usuarios del sistema BGE Héroes de la Patria';
ALTER TABLE estudiantes COMMENT = 'Información específica de estudiantes con datos académicos';
ALTER TABLE calificaciones COMMENT = 'Registro de calificaciones por parcial y materia';
ALTER TABLE materias COMMENT = 'Catálogo de materias del plan de estudios';
ALTER TABLE grupos COMMENT = 'Grupos académicos organizados por semestre y turno';

-- =================================================================
-- VERIFICACIÓN DE INTEGRIDAD
-- =================================================================

-- Verificar que las tablas se crearon correctamente
SELECT
    TABLE_NAME,
    TABLE_ROWS,
    TABLE_COMMENT
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'heroes_patria_db';

SHOW TABLES;

-- =================================================================
-- CONFIGURACIONES FINALES
-- =================================================================

-- Configurar zona horaria
SET time_zone = '-06:00'; -- Hora de México

-- Mostrar estado final
SELECT 'Base de datos BGE Héroes de la Patria creada exitosamente' AS resultado;
SELECT COUNT(*) as total_tablas FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'heroes_patria_db';