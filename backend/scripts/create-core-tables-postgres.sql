-- 🗄️ SCRIPT DE CREACIÓN DE BASE DE DATOS BGE (Versión PostgreSQL)
-- ============================================
-- Fecha: 20-10-2025
-- Proyecto: Bachillerato General Estatal "Héroes de la Patria"
-- Descripción: Script traducido de MySQL a PostgreSQL para crear las tablas principales.

-- ============================================
-- TIPOS ENUMERADOS PERSONALIZADOS
-- ============================================

CREATE TYPE role_type AS ENUM ('admin', 'docente', 'estudiante', 'padre');
CREATE TYPE status_type AS ENUM ('activo', 'inactivo', 'suspendido');
CREATE TYPE genero_type AS ENUM ('M', 'F', 'O');
CREATE TYPE status_academico_type AS ENUM ('regular', 'irregular', 'baja', 'egresado');
CREATE TYPE docente_status_type AS ENUM ('activo', 'inactivo', 'licencia');
CREATE TYPE achievement_category_type AS ENUM ('academico', 'participacion', 'social', 'tecnologia', 'especial');
CREATE TYPE rarity_type AS ENUM ('comun', 'raro', 'epico', 'legendario');
CREATE TYPE area_type AS ENUM ('matematicas', 'ciencias', 'humanidades', 'sociales', 'idiomas', 'tecnologia');
CREATE TYPE aviso_type AS ENUM ('noticia', 'aviso', 'evento', 'urgente');
CREATE TYPE audience_type AS ENUM ('todos', 'estudiantes', 'docentes', 'padres');
CREATE TYPE priority_type AS ENUM ('baja', 'media', 'alta', 'critica');
CREATE TYPE metric_type AS ENUM ('counter', 'gauge', 'histogram');

-- ============================================
-- FUNCIÓN Y TRIGGER PARA updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABLAS PRINCIPALES
-- ============================================

-- Tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role role_type NOT NULL DEFAULT 'estudiante',
    status status_type NOT NULL DEFAULT 'activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);

DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Tabla de perfiles de estudiantes
CREATE TABLE IF NOT EXISTS estudiantes (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(50) NOT NULL,
    apellido_materno VARCHAR(50),
    fecha_nacimiento DATE,
    genero genero_type NOT NULL,
    telefono VARCHAR(15),
    direccion TEXT,
    semestre INT NOT NULL DEFAULT 1,
    especialidad VARCHAR(100),
    promedio DECIMAL(4,2) DEFAULT 0.00,
    status_academico status_academico_type DEFAULT 'regular',
    fecha_ingreso DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_estudiantes_matricula ON estudiantes(matricula);
CREATE INDEX IF NOT EXISTS idx_estudiantes_semestre ON estudiantes(semestre);
CREATE INDEX IF NOT EXISTS idx_estudiantes_especialidad ON estudiantes(especialidad);
CREATE INDEX IF NOT EXISTS idx_estudiantes_status ON estudiantes(status_academico);

DROP TRIGGER IF EXISTS update_estudiantes_updated_at ON estudiantes;
CREATE TRIGGER update_estudiantes_updated_at
    BEFORE UPDATE ON estudiantes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Tabla de docentes
CREATE TABLE IF NOT EXISTS docentes (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL,
    numero_empleado VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(50) NOT NULL,
    apellido_materno VARCHAR(50),
    especialidad VARCHAR(100),
    telefono VARCHAR(15),
    email_institucional VARCHAR(100),
    status docente_status_type DEFAULT 'activo',
    fecha_ingreso DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_docentes_numero_empleado ON docentes(numero_empleado);
CREATE INDEX IF NOT EXISTS idx_docentes_especialidad ON docentes(especialidad);

DROP TRIGGER IF EXISTS update_docentes_updated_at ON docentes;
CREATE TRIGGER update_docentes_updated_at
    BEFORE UPDATE ON docentes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLAS ADICIONALES (Traducidas)
-- ============================================

-- Tabla de logros/achievements
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) DEFAULT '🏆',
    category achievement_category_type NOT NULL,
    points INT NOT NULL DEFAULT 0,
    xp_reward INT NOT NULL DEFAULT 0,
    coins_reward INT NOT NULL DEFAULT 0,
    rarity rarity_type DEFAULT 'comun',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_rarity ON achievements(rarity);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON achievements(is_active);

-- Tabla de logros de usuarios
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL,
    achievement_id INT NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    progress DECIMAL(5,2) DEFAULT 100.00,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE (usuario_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_usuario ON user_achievements(usuario_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);

-- Tabla de estadísticas de gamificación
CREATE TABLE IF NOT EXISTS user_gamification_stats (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL,
    level INT DEFAULT 1,
    xp INT DEFAULT 0,
    ia_coins INT DEFAULT 100,
    total_achievements INT DEFAULT 0,
    streak_days INT DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE (usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_user_gamification_stats_level ON user_gamification_stats(level);
CREATE INDEX IF NOT EXISTS idx_user_gamification_stats_xp ON user_gamification_stats(xp);

DROP TRIGGER IF EXISTS update_user_gamification_stats_updated_at ON user_gamification_stats;
CREATE TRIGGER update_user_gamification_stats_updated_at
    BEFORE UPDATE ON user_gamification_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Tabla de materias
CREATE TABLE IF NOT EXISTS materias (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    creditos INT NOT NULL DEFAULT 4,
    semestre INT NOT NULL,
    area area_type NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_materias_codigo ON materias(codigo);
CREATE INDEX IF NOT EXISTS idx_materias_semestre ON materias(semestre);
CREATE INDEX IF NOT EXISTS idx_materias_area ON materias(area);

-- Tabla de calificaciones
CREATE TABLE IF NOT EXISTS calificaciones (
    id SERIAL PRIMARY KEY,
    estudiante_id INT NOT NULL,
    materia_id INT NOT NULL,
    docente_id INT NOT NULL,
    parcial INT NOT NULL CHECK (parcial BETWEEN 1 AND 3),
    calificacion DECIMAL(4,2) NOT NULL CHECK (calificacion BETWEEN 0 AND 10),
    fecha_evaluacion DATE NOT NULL,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
    FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_calificaciones_estudiante ON calificaciones(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_materia ON calificaciones(materia_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_parcial ON calificaciones(parcial);

DROP TRIGGER IF EXISTS update_calificaciones_updated_at ON calificaciones;
CREATE TRIGGER update_calificaciones_updated_at
    BEFORE UPDATE ON calificaciones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Tabla de avisos/noticias
CREATE TABLE IF NOT EXISTS avisos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    type aviso_type NOT NULL DEFAULT 'aviso',
    target_audience audience_type NOT NULL DEFAULT 'todos',
    priority priority_type NOT NULL DEFAULT 'media',
    autor_id INT NOT NULL,
    image_url VARCHAR(500),
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (autor_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_avisos_type ON avisos(type);
CREATE INDEX IF NOT EXISTS idx_avisos_audience ON avisos(target_audience);
CREATE INDEX IF NOT EXISTS idx_avisos_published ON avisos(is_published);
CREATE INDEX IF NOT EXISTS idx_avisos_priority ON avisos(priority);

DROP TRIGGER IF EXISTS update_avisos_updated_at ON avisos;
CREATE TRIGGER update_avisos_updated_at
    BEFORE UPDATE ON avisos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Tabla de actividad de usuarios
CREATE TABLE IF NOT EXISTS user_activity_log (
    id SERIAL PRIMARY KEY,
    usuario_id INT,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_usuario ON user_activity_log(usuario_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_action ON user_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at);

-- Tabla de métricas del sistema
CREATE TABLE IF NOT EXISTS system_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metric_type metric_type NOT NULL DEFAULT 'gauge',
    tags JSON,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_metrics_metric_name ON system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at ON system_metrics(recorded_at);

-- ============================================
-- DATOS INICIALES (Versión PostgreSQL)
-- ============================================

-- Insertar achievements básicos
INSERT INTO achievements (code, title, description, icon, category, points, xp_reward, coins_reward, rarity) VALUES
('first_login', '🎯 Primer Paso', 'Completar tu primer inicio de sesión', '🚀', 'tecnologia', 10, 50, 10, 'comun'),
('ai_novice', '🤖 Novato IA', 'Usar tu primer prompt de IA', '🎓', 'tecnologia', 25, 100, 25, 'comun'),
('chatbot_master', '💬 Maestro del Chat', 'Tener 10 conversaciones con el chatbot IA', '🗣️', 'tecnologia', 100, 250, 50, 'raro'),
('first_grade', '📚 Primera Calificación', 'Obtener tu primera calificación registrada', '📊', 'academico', 50, 150, 30, 'comun'),
('perfect_score', '⭐ Puntuación Perfecta', 'Obtener una calificación de 10', '🌟', 'academico', 200, 500, 100, 'epico'),
('social_butterfly', '🦋 Mariposa Social', 'Interactuar con 5 docentes diferentes', '👥', 'social', 75, 200, 40, 'raro'),
('week_streak', '🔥 Racha Semanal', 'Usar la plataforma 7 días consecutivos', '📅', 'participacion', 150, 300, 75, 'raro'),
('achievement_hunter', '🏆 Cazador de Logros', 'Desbloquear 10 achievements', '🎖️', 'especial', 500, 1000, 200, 'legendario')
ON CONFLICT (code) DO NOTHING;

-- Insertar materias básicas
INSERT INTO materias (codigo, nombre, descripcion, creditos, semestre, area) VALUES
('MAT1', 'Matemáticas I', 'Álgebra y funciones básicas', 5, 1, 'matematicas'),
('ESP1', 'Español I', 'Comunicación y literatura', 4, 1, 'humanidades'),
('ING1', 'Inglés I', 'Inglés básico conversacional', 3, 1, 'idiomas'),
('FIS1', 'Física I', 'Mecánica clásica', 4, 1, 'ciencias'),
('QUI1', 'Química I', 'Química general e inorgánica', 4, 1, 'ciencias'),
('HIS1', 'Historia I', 'Historia de México', 3, 1, 'sociales'),
('TEC1', 'Tecnología I', 'Informática básica', 3, 1, 'tecnologia')
ON CONFLICT (codigo) DO NOTHING;

-- Insertar usuario administrador por defecto
INSERT INTO usuarios (username, email, password_hash, role) VALUES
('admin', 'admin@heroespatria.edu.mx', '$2b$12$c6XQgfRG4WAkwhADy7RcQeSIfAVidcWV/F/OTcswVQ.L/99CUfGIK', 'admin')
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
SELECT 'Base de datos BGE (PostgreSQL) creada exitosamente' as status;