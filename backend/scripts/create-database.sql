-- 🗄️ SCRIPT DE CREACIÓN DE BASE DE DATOS BGE
-- ============================================
-- Fecha: 22-09-2025
-- Proyecto: Bachillerato General Estatal "Héroes de la Patria"
-- Fase: 1 - Consolidación y Funcionalidad Básica

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS heroes_patria_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE heroes_patria_db;

-- ============================================
-- TABLAS PRINCIPALES
-- ============================================

-- Tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'docente', 'estudiante', 'padre') NOT NULL DEFAULT 'estudiante',
    status ENUM('activo', 'inactivo', 'suspendido') NOT NULL DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,

    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
);

-- Tabla de perfiles de estudiantes
CREATE TABLE IF NOT EXISTS estudiantes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(50) NOT NULL,
    apellido_materno VARCHAR(50),
    fecha_nacimiento DATE,
    genero ENUM('M', 'F', 'O') NOT NULL,
    telefono VARCHAR(15),
    direccion TEXT,
    semestre INT NOT NULL DEFAULT 1,
    especialidad VARCHAR(100),
    promedio DECIMAL(4,2) DEFAULT 0.00,
    status_academico ENUM('regular', 'irregular', 'baja', 'egresado') DEFAULT 'regular',
    fecha_ingreso DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_matricula (matricula),
    INDEX idx_semestre (semestre),
    INDEX idx_especialidad (especialidad),
    INDEX idx_status (status_academico)
);

-- Tabla de docentes
CREATE TABLE IF NOT EXISTS docentes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    numero_empleado VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(50) NOT NULL,
    apellido_materno VARCHAR(50),
    especialidad VARCHAR(100),
    telefono VARCHAR(15),
    email_institucional VARCHAR(100),
    status ENUM('activo', 'inactivo', 'licencia') DEFAULT 'activo',
    fecha_ingreso DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_numero_empleado (numero_empleado),
    INDEX idx_especialidad (especialidad)
);

-- ============================================
-- SISTEMA DE GAMIFICACIÓN
-- ============================================

-- Tabla de logros/achievements
CREATE TABLE IF NOT EXISTS achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) DEFAULT '🏆',
    category ENUM('academico', 'participacion', 'social', 'tecnologia', 'especial') NOT NULL,
    points INT NOT NULL DEFAULT 0,
    xp_reward INT NOT NULL DEFAULT 0,
    coins_reward INT NOT NULL DEFAULT 0,
    rarity ENUM('comun', 'raro', 'epico', 'legendario') DEFAULT 'comun',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_category (category),
    INDEX idx_rarity (rarity),
    INDEX idx_active (is_active)
);

-- Tabla de logros de usuarios
CREATE TABLE IF NOT EXISTS user_achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    achievement_id INT NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress DECIMAL(5,2) DEFAULT 100.00,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_achievement (usuario_id, achievement_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_achievement (achievement_id)
);

-- Tabla de estadísticas de gamificación
CREATE TABLE IF NOT EXISTS user_gamification_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    level INT DEFAULT 1,
    xp INT DEFAULT 0,
    ia_coins INT DEFAULT 100,
    total_achievements INT DEFAULT 0,
    streak_days INT DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_stats (usuario_id),
    INDEX idx_level (level),
    INDEX idx_xp (xp)
);

-- ============================================
-- SISTEMA ACADÉMICO
-- ============================================

-- Tabla de materias
CREATE TABLE IF NOT EXISTS materias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    creditos INT NOT NULL DEFAULT 4,
    semestre INT NOT NULL,
    area ENUM('matematicas', 'ciencias', 'humanidades', 'sociales', 'idiomas', 'tecnologia') NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_codigo (codigo),
    INDEX idx_semestre (semestre),
    INDEX idx_area (area)
);

-- Tabla de calificaciones
CREATE TABLE IF NOT EXISTS calificaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    estudiante_id INT NOT NULL,
    materia_id INT NOT NULL,
    docente_id INT NOT NULL,
    parcial INT NOT NULL CHECK (parcial BETWEEN 1 AND 3),
    calificacion DECIMAL(4,2) NOT NULL CHECK (calificacion BETWEEN 0 AND 10),
    fecha_evaluacion DATE NOT NULL,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
    FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE,
    INDEX idx_estudiante (estudiante_id),
    INDEX idx_materia (materia_id),
    INDEX idx_parcial (parcial)
);

-- ============================================
-- SISTEMA DE COMUNICACIÓN
-- ============================================

-- Tabla de avisos/noticias
CREATE TABLE IF NOT EXISTS avisos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    type ENUM('noticia', 'aviso', 'evento', 'urgente') NOT NULL DEFAULT 'aviso',
    target_audience ENUM('todos', 'estudiantes', 'docentes', 'padres') NOT NULL DEFAULT 'todos',
    priority ENUM('baja', 'media', 'alta', 'critica') NOT NULL DEFAULT 'media',
    autor_id INT NOT NULL,
    image_url VARCHAR(500),
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (autor_id) REFERENCES usuarios(id),
    INDEX idx_type (type),
    INDEX idx_audience (target_audience),
    INDEX idx_published (is_published),
    INDEX idx_priority (priority)
);

-- ============================================
-- SISTEMA DE ANALYTICS
-- ============================================

-- Tabla de actividad de usuarios
CREATE TABLE IF NOT EXISTS user_activity_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_usuario (usuario_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

-- Tabla de métricas del sistema
CREATE TABLE IF NOT EXISTS system_metrics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metric_type ENUM('counter', 'gauge', 'histogram') NOT NULL DEFAULT 'gauge',
    tags JSON,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_metric_name (metric_name),
    INDEX idx_recorded_at (recorded_at)
);

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Insertar achievements básicos
INSERT IGNORE INTO achievements (code, title, description, icon, category, points, xp_reward, coins_reward, rarity) VALUES
('first_login', '🎯 Primer Paso', 'Completar tu primer inicio de sesión', '🚀', 'tecnologia', 10, 50, 10, 'comun'),
('ai_novice', '🤖 Novato IA', 'Usar tu primer prompt de IA', '🎓', 'tecnologia', 25, 100, 25, 'comun'),
('chatbot_master', '💬 Maestro del Chat', 'Tener 10 conversaciones con el chatbot IA', '🗣️', 'tecnologia', 100, 250, 50, 'raro'),
('first_grade', '📚 Primera Calificación', 'Obtener tu primera calificación registrada', '📊', 'academico', 50, 150, 30, 'comun'),
('perfect_score', '⭐ Puntuación Perfecta', 'Obtener una calificación de 10', '🌟', 'academico', 200, 500, 100, 'epico'),
('social_butterfly', '🦋 Mariposa Social', 'Interactuar con 5 docentes diferentes', '👥', 'social', 75, 200, 40, 'raro'),
('week_streak', '🔥 Racha Semanal', 'Usar la plataforma 7 días consecutivos', '📅', 'participacion', 150, 300, 75, 'raro'),
('achievement_hunter', '🏆 Cazador de Logros', 'Desbloquear 10 achievements', '🎖️', 'especial', 500, 1000, 200, 'legendario');

-- Insertar materias básicas
INSERT IGNORE INTO materias (codigo, nombre, descripcion, creditos, semestre, area) VALUES
('MAT1', 'Matemáticas I', 'Álgebra y funciones básicas', 5, 1, 'matematicas'),
('ESP1', 'Español I', 'Comunicación y literatura', 4, 1, 'humanidades'),
('ING1', 'Inglés I', 'Inglés básico conversacional', 3, 1, 'idiomas'),
('FIS1', 'Física I', 'Mecánica clásica', 4, 1, 'ciencias'),
('QUI1', 'Química I', 'Química general e inorgánica', 4, 1, 'ciencias'),
('HIS1', 'Historia I', 'Historia de México', 3, 1, 'sociales'),
('TEC1', 'Tecnología I', 'Informática básica', 3, 1, 'tecnologia');

-- Insertar usuario administrador por defecto
INSERT IGNORE INTO usuarios (uuid, username, email, password_hash, role) VALUES
(UUID(), 'admin', 'admin@heroespatria.edu.mx', '$2b$12$c6XQgfRG4WAkwhADy7RcQeSIfAVidcWV/F/OTcswVQ.L/99CUfGIK', 'admin');

-- ============================================
-- ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================

-- Índices compuestos para consultas frecuentes
CREATE INDEX idx_calificaciones_estudiante_materia ON calificaciones(estudiante_id, materia_id);
CREATE INDEX idx_avisos_published_audience ON avisos(is_published, target_audience);
CREATE INDEX idx_activity_usuario_fecha ON user_activity_log(usuario_id, created_at);

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de estadísticas de estudiantes
CREATE OR REPLACE VIEW vista_estudiantes_stats AS
SELECT
    e.id,
    e.matricula,
    e.nombre,
    e.apellido_paterno,
    e.apellido_materno,
    e.semestre,
    e.especialidad,
    e.promedio,
    COALESCE(g.level, 1) as level,
    COALESCE(g.xp, 0) as xp,
    COALESCE(g.ia_coins, 100) as ia_coins,
    COALESCE(g.total_achievements, 0) as total_achievements,
    e.created_at
FROM estudiantes e
LEFT JOIN user_gamification_stats g ON e.usuario_id = g.usuario_id
WHERE e.status_academico = 'regular';

-- Vista de métricas del dashboard
CREATE OR REPLACE VIEW vista_dashboard_metrics AS
SELECT
    (SELECT COUNT(*) FROM usuarios WHERE status = 'activo') as usuarios_activos,
    (SELECT COUNT(*) FROM estudiantes WHERE status_academico = 'regular') as estudiantes_activos,
    (SELECT COUNT(*) FROM docentes WHERE status = 'activo') as docentes_activos,
    (SELECT COUNT(*) FROM avisos WHERE is_published = true AND (expires_at IS NULL OR expires_at > NOW())) as avisos_activos,
    (SELECT AVG(promedio) FROM estudiantes WHERE status_academico = 'regular') as promedio_general,
    (SELECT COUNT(*) FROM user_activity_log WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as actividad_24h;

-- Crear usuario de base de datos (ejecutar como root)
-- CREATE USER IF NOT EXISTS 'bge_user'@'localhost' IDENTIFIED BY 'HeroesPatria2025DB!';
-- GRANT ALL PRIVILEGES ON heroes_patria_db.* TO 'bge_user'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
SELECT 'Base de datos BGE creada exitosamente' as status;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'heroes_patria_db';
SELECT table_name FROM information_schema.tables WHERE table_schema = 'heroes_patria_db' ORDER BY table_name;