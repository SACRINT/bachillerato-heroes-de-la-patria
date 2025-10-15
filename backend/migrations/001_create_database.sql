-- ========================================
-- CREACIÓN DE BASE DE DATOS
-- Bachillerato General Estatal "Héroes de la Patria"
-- ========================================

CREATE DATABASE IF NOT EXISTS heroes_patria_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE heroes_patria_db;

-- ========================================
-- TABLA: usuarios
-- Sistema de autenticación unificado
-- ========================================
CREATE TABLE usuarios (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100),
    tipo_usuario ENUM('estudiante', 'docente', 'administrativo', 'padre_familia', 'directivo') NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_tipo_usuario (tipo_usuario),
    INDEX idx_activo (activo)
);

-- ========================================
-- TABLA: estudiantes
-- Información académica de estudiantes
-- ========================================
CREATE TABLE estudiantes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    usuario_id BIGINT NOT NULL,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    nia VARCHAR(50) UNIQUE NOT NULL COMMENT 'Número de Identificación del Alumno',
    curp VARCHAR(18) UNIQUE NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    genero ENUM('M', 'F', 'Otro') NOT NULL,
    direccion TEXT,
    telefono VARCHAR(15),
    telefono_emergencia VARCHAR(15),
    especialidad ENUM('comunicacion_grafica', 'alimentos_artesanales', 'instalaciones_residenciales', 'general') DEFAULT 'general',
    semestre TINYINT NOT NULL DEFAULT 1,
    generacion VARCHAR(10) NOT NULL COMMENT 'Ejemplo: 2024-2027',
    tutor_id BIGINT NULL COMMENT 'ID del padre/tutor',
    fecha_ingreso DATE NOT NULL,
    estatus ENUM('activo', 'baja_temporal', 'baja_definitiva', 'egresado') DEFAULT 'activo',
    promedio_general DECIMAL(4,2) DEFAULT 0.00,
    creditos_obtenidos INT DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (tutor_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_matricula (matricula),
    INDEX idx_nia (nia),
    INDEX idx_curp (curp),
    INDEX idx_especialidad (especialidad),
    INDEX idx_semestre (semestre),
    INDEX idx_estatus (estatus)
);

-- ========================================
-- TABLA: docentes
-- Información del personal docente
-- ========================================
CREATE TABLE docentes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    usuario_id BIGINT NOT NULL,
    numero_empleado VARCHAR(20) UNIQUE NOT NULL,
    cedula_profesional VARCHAR(20),
    especialidad VARCHAR(100),
    anos_experiencia INT DEFAULT 0,
    formacion_academica TEXT,
    grado_estudios ENUM('licenciatura', 'maestria', 'doctorado', 'especialidad') DEFAULT 'licenciatura',
    fecha_ingreso_sep DATE,
    fecha_ingreso_plantel DATE NOT NULL,
    tipo_contrato ENUM('base', 'interino', 'por_horas') DEFAULT 'base',
    horas_asignadas INT DEFAULT 40,
    estatus ENUM('activo', 'licencia', 'jubilado', 'baja') DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_numero_empleado (numero_empleado),
    INDEX idx_cedula (cedula_profesional),
    INDEX idx_estatus (estatus)
);

-- ========================================
-- TABLA: materias
-- Catálogo de materias del plan de estudios
-- ========================================
CREATE TABLE materias (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    clave VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    semestre TINYINT NOT NULL,
    creditos INT NOT NULL DEFAULT 1,
    horas_semana INT NOT NULL DEFAULT 1,
    especialidad ENUM('general', 'comunicacion_grafica', 'alimentos_artesanales', 'instalaciones_residenciales') DEFAULT 'general',
    tipo_curriculm ENUM('fundamental', 'laboral', 'ampliado') DEFAULT 'fundamental',
    prerequisitos JSON NULL COMMENT 'Array de IDs de materias prerequisito',
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_clave (clave),
    INDEX idx_semestre (semestre),
    INDEX idx_especialidad (especialidad),
    INDEX idx_activa (activa)
);

-- ========================================
-- TABLA: grupos
-- Grupos académicos por materia
-- ========================================
CREATE TABLE grupos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    materia_id BIGINT NOT NULL,
    docente_id BIGINT NOT NULL,
    nombre VARCHAR(50) NOT NULL COMMENT 'Ejemplo: 1A, 2B, etc.',
    ciclo_escolar VARCHAR(20) NOT NULL COMMENT 'Ejemplo: 2024-2025',
    cupo_maximo INT DEFAULT 50,
    estudiantes_inscritos INT DEFAULT 0,
    horario JSON NOT NULL COMMENT 'Horario semanal estructurado',
    aula VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
    FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE RESTRICT,
    INDEX idx_nombre (nombre),
    INDEX idx_ciclo (ciclo_escolar),
    INDEX idx_activo (activo)
);

-- ========================================
-- TABLA: inscripciones
-- Relación estudiante-grupo
-- ========================================
CREATE TABLE inscripciones (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    estudiante_id BIGINT NOT NULL,
    grupo_id BIGINT NOT NULL,
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estatus ENUM('inscrito', 'baja', 'transferido') DEFAULT 'inscrito',
    
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_inscripcion (estudiante_id, grupo_id),
    INDEX idx_estatus (estatus)
);

-- ========================================
-- TABLA: calificaciones
-- Registro de calificaciones
-- ========================================
CREATE TABLE calificaciones (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    estudiante_id BIGINT NOT NULL,
    materia_id BIGINT NOT NULL,
    grupo_id BIGINT NOT NULL,
    periodo ENUM('parcial_1', 'parcial_2', 'parcial_3', 'ordinario', 'extraordinario') NOT NULL,
    calificacion DECIMAL(4,2) NOT NULL,
    fecha_captura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    docente_id BIGINT NOT NULL,
    observaciones TEXT,
    
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
    FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_calificacion (estudiante_id, materia_id, grupo_id, periodo),
    INDEX idx_periodo (periodo),
    INDEX idx_fecha_captura (fecha_captura)
);

-- ========================================
-- TABLA: asistencias
-- Control de asistencias
-- ========================================
CREATE TABLE asistencias (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    estudiante_id BIGINT NOT NULL,
    grupo_id BIGINT NOT NULL,
    fecha DATE NOT NULL,
    hora_entrada TIME NULL,
    hora_salida TIME NULL,
    estatus ENUM('presente', 'falta', 'retardo', 'justificada') NOT NULL,
    observaciones TEXT,
    registrado_por BIGINT NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_asistencia (estudiante_id, grupo_id, fecha),
    INDEX idx_fecha (fecha),
    INDEX idx_estatus (estatus)
);

-- ========================================
-- TABLA: eventos
-- Calendario de eventos institucionales
-- ========================================
CREATE TABLE eventos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    ubicacion VARCHAR(200),
    tipo ENUM('academico', 'cultural', 'deportivo', 'administrativo', 'social') DEFAULT 'academico',
    dirigido_a JSON COMMENT 'Array de tipos de usuario: ["estudiante", "docente", etc.]',
    responsable_id BIGINT,
    publico BOOLEAN DEFAULT TRUE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (responsable_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_fecha_inicio (fecha_inicio),
    INDEX idx_tipo (tipo),
    INDEX idx_publico (publico),
    INDEX idx_activo (activo)
);

-- ========================================
-- TABLA: noticias
-- Sistema de noticias y comunicados
-- ========================================
CREATE TABLE noticias (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(300) NOT NULL,
    resumen TEXT,
    contenido LONGTEXT NOT NULL,
    imagen_url VARCHAR(500),
    autor_id BIGINT NOT NULL,
    categoria ENUM('academico', 'administrativo', 'cultural', 'deportivo', 'general') DEFAULT 'general',
    prioridad ENUM('baja', 'normal', 'alta', 'urgente') DEFAULT 'normal',
    fecha_publicacion DATETIME NOT NULL,
    fecha_expiracion DATETIME NULL,
    publico BOOLEAN DEFAULT TRUE,
    destacada BOOLEAN DEFAULT FALSE,
    activa BOOLEAN DEFAULT TRUE,
    visualizaciones INT DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_fecha_publicacion (fecha_publicacion),
    INDEX idx_categoria (categoria),
    INDEX idx_prioridad (prioridad),
    INDEX idx_destacada (destacada),
    INDEX idx_activa (activa),
    FULLTEXT idx_busqueda (titulo, resumen, contenido)
);

-- ========================================
-- TABLAS ESPECÍFICAS PARA CHATBOT
-- ========================================

-- Conversaciones del chatbot
CREATE TABLE chat_conversations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_type ENUM('estudiante', 'padre', 'docente', 'administrativo', 'visitante') DEFAULT 'visitante',
    user_id BIGINT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    total_messages INT DEFAULT 0,
    satisfaction_rating TINYINT NULL COMMENT 'Rating 1-5',
    status ENUM('active', 'closed', 'escalated') DEFAULT 'active',
    
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_session_id (session_id),
    INDEX idx_user_type (user_type),
    INDEX idx_started_at (started_at),
    INDEX idx_status (status)
);

-- Mensajes del chat
CREATE TABLE chat_messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL,
    sender_type ENUM('user', 'bot', 'human_agent') NOT NULL,
    message TEXT NOT NULL,
    intent_detected VARCHAR(100) NULL,
    confidence_score DECIMAL(3,2) NULL,
    response_time_ms INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_sender_type (sender_type),
    INDEX idx_created_at (created_at),
    INDEX idx_intent_detected (intent_detected)
);

-- Base de conocimiento dinámica
CREATE TABLE informacion_dinamica (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    clave VARCHAR(100) UNIQUE NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    contenido JSON NOT NULL,
    fecha_inicio DATE NULL,
    fecha_fin DATE NULL,
    prioridad INT DEFAULT 5,
    es_confidencial BOOLEAN DEFAULT FALSE,
    requiere_autenticacion BOOLEAN DEFAULT FALSE,
    tipos_usuario_permitidos JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_categoria (categoria),
    INDEX idx_clave (clave),
    INDEX idx_is_active (is_active),
    INDEX idx_prioridad (prioridad),
    FULLTEXT idx_busqueda (titulo, contenido)
);

-- Analytics del chatbot
CREATE TABLE chat_analytics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    date_recorded DATE NOT NULL,
    total_conversations INT DEFAULT 0,
    total_messages INT DEFAULT 0,
    avg_response_time_ms DECIMAL(8,2) DEFAULT 0,
    successful_resolutions INT DEFAULT 0,
    escalated_conversations INT DEFAULT 0,
    top_intents JSON NULL,
    user_satisfaction_avg DECIMAL(3,2) NULL,
    unique_users INT DEFAULT 0,
    
    UNIQUE KEY unique_date (date_recorded),
    INDEX idx_date_recorded (date_recorded)
);

-- ========================================
-- CONFIGURACIÓN INICIAL
-- ========================================

-- Configuración del sistema
CREATE TABLE configuracion_sistema (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    tipo ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    categoria VARCHAR(50) DEFAULT 'general',
    modificable BOOLEAN DEFAULT TRUE,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_clave (clave),
    INDEX idx_categoria (categoria)
);

-- Logs del sistema
CREATE TABLE logs_sistema (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nivel ENUM('info', 'warning', 'error', 'debug') NOT NULL,
    mensaje TEXT NOT NULL,
    contexto JSON NULL,
    usuario_id BIGINT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_nivel (nivel),
    INDEX idx_created_at (created_at),
    INDEX idx_usuario_id (usuario_id)
);

-- ========================================
-- TRIGGERS PARA MANTENIMIENTO
-- ========================================

-- Trigger para actualizar contador de estudiantes en grupos
DELIMITER $$
CREATE TRIGGER update_estudiantes_count_insert 
AFTER INSERT ON inscripciones
FOR EACH ROW
BEGIN
    UPDATE grupos 
    SET estudiantes_inscritos = (
        SELECT COUNT(*) 
        FROM inscripciones 
        WHERE grupo_id = NEW.grupo_id AND estatus = 'inscrito'
    ) 
    WHERE id = NEW.grupo_id;
END$$

CREATE TRIGGER update_estudiantes_count_update 
AFTER UPDATE ON inscripciones
FOR EACH ROW
BEGIN
    UPDATE grupos 
    SET estudiantes_inscritos = (
        SELECT COUNT(*) 
        FROM inscripciones 
        WHERE grupo_id = NEW.grupo_id AND estatus = 'inscrito'
    ) 
    WHERE id = NEW.grupo_id;
END$$

CREATE TRIGGER update_estudiantes_count_delete 
AFTER DELETE ON inscripciones
FOR EACH ROW
BEGIN
    UPDATE grupos 
    SET estudiantes_inscritos = (
        SELECT COUNT(*) 
        FROM inscripciones 
        WHERE grupo_id = OLD.grupo_id AND estatus = 'inscrito'
    ) 
    WHERE id = OLD.grupo_id;
END$$
DELIMITER ;

-- ========================================
-- ÍNDICES ADICIONALES PARA RENDIMIENTO
-- ========================================

-- Índices compuestos para consultas frecuentes
CREATE INDEX idx_estudiante_semestre_estatus ON estudiantes(semestre, estatus);
CREATE INDEX idx_calificaciones_periodo_estudiante ON calificaciones(periodo, estudiante_id);
CREATE INDEX idx_asistencias_fecha_estudiante ON asistencias(fecha, estudiante_id);
CREATE INDEX idx_eventos_fecha_tipo ON eventos(fecha_inicio, tipo, activo);
CREATE INDEX idx_noticias_categoria_fecha ON noticias(categoria, fecha_publicacion, activa);

-- ========================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ========================================

ALTER TABLE usuarios COMMENT = 'Tabla principal de usuarios del sistema con autenticación unificada';
ALTER TABLE estudiantes COMMENT = 'Información académica y personal de estudiantes';
ALTER TABLE docentes COMMENT = 'Datos del personal docente y administrativo';
ALTER TABLE materias COMMENT = 'Catálogo de materias del plan de estudios';
ALTER TABLE grupos COMMENT = 'Grupos académicos organizados por materia y ciclo';
ALTER TABLE calificaciones COMMENT = 'Registro de calificaciones por periodo';
ALTER TABLE asistencias COMMENT = 'Control diario de asistencias';
ALTER TABLE chat_conversations COMMENT = 'Sesiones de conversación del chatbot';
ALTER TABLE informacion_dinamica COMMENT = 'Base de conocimiento dinámica para el chatbot';

SHOW TABLES;