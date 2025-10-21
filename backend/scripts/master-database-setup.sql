/*
-- ===========================================...
-- SCRIPT MAESTRO DE INSTALACIÓN DE BASE DE DATOS (PostgreSQL)
-- Fecha: 20-10-2025
-- Unifica: Core, Polls, Teachers Portal, Messaging, Digital Library
-- ===========================================...
*/

-- ===========================================...
-- BLOQUE DE LIMPIEZA (DROP IF EXISTS)
-- ===========================================...
DROP TABLE IF EXISTS library_document_ratings CASCADE;
DROP TABLE IF EXISTS library_document_comments CASCADE;
DROP TABLE IF EXISTS library_download_history CASCADE;
DROP TABLE IF EXISTS library_favorites CASCADE;
DROP TABLE IF EXISTS library_document_permissions CASCADE;
DROP TABLE IF EXISTS library_document_tags CASCADE;
DROP TABLE IF EXISTS library_tags CASCADE;
DROP TABLE IF EXISTS library_document_versions CASCADE;
DROP TABLE IF EXISTS library_documents CASCADE;
DROP TABLE IF EXISTS library_categories CASCADE;
DROP TABLE IF EXISTS typing_indicators CASCADE;
DROP TABLE IF EXISTS conversation_settings CASCADE;
DROP TABLE IF EXISTS message_read_status CASCADE;
DROP TABLE IF EXISTS message_attachments CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS teacher_assignment_submissions CASCADE;
DROP TABLE IF EXISTS teacher_assignments CASCADE;
DROP TABLE IF EXISTS teacher_resources CASCADE;
DROP TABLE IF EXISTS teacher_class_students CASCADE;
DROP TABLE IF EXISTS teacher_classes CASCADE;
DROP TABLE IF EXISTS poll_vote_reports CASCADE;
DROP TABLE IF EXISTS poll_category_relations CASCADE;
DROP TABLE IF EXISTS poll_results CASCADE;
DROP TABLE IF EXISTS poll_votes CASCADE;
DROP TABLE IF EXISTS poll_options CASCADE;
DROP TABLE IF EXISTS polls CASCADE;
DROP TABLE IF EXISTS calificaciones CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS user_gamification_stats CASCADE;
DROP TABLE IF EXISTS materias CASCADE;
DROP TABLE IF EXISTS avisos CASCADE;
DROP TABLE IF EXISTS user_activity_log CASCADE;
DROP TABLE IF EXISTS system_metrics CASCADE;
DROP TABLE IF EXISTS docentes CASCADE;
DROP TABLE IF EXISTS estudiantes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

DROP TYPE IF EXISTS role_type;
DROP TYPE IF EXISTS status_type;
DROP TYPE IF EXISTS genero_type;
DROP TYPE IF EXISTS status_academico_type;
DROP TYPE IF EXISTS docente_status_type;
DROP TYPE IF EXISTS achievement_category_type;
DROP TYPE IF EXISTS rarity_type;
DROP TYPE IF EXISTS area_type;
DROP TYPE IF EXISTS aviso_type;
DROP TYPE IF EXISTS audience_type;
DROP TYPE IF EXISTS priority_type;
DROP TYPE IF EXISTS metric_type;


-- ===========================================...
-- FUNCIÓN ÚNICA PARA TIMESTAMPS
-- ===========================================...
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================...
-- TIPOS ENUMERADOS (TODOS LOS MÓDULOS)
-- ===========================================...
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

-- ===========================================...
-- 1. TABLAS PRINCIPALES (CORE)
-- ===========================================...
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
    last_login TIMESTAMP WITH TIME ZONE
);
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS estudiantes (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER update_estudiantes_updated_at BEFORE UPDATE ON estudiantes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS docentes (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER update_docentes_updated_at BEFORE UPDATE ON docentes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================...
-- 2. TABLAS DEL SISTEMA DE ENCUESTAS (POLLS)
-- ===========================================...
CREATE TABLE IF NOT EXISTS polls (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'single_choice',
    anonymous_voting BOOLEAN DEFAULT TRUE,
    starts_at TIMESTAMP,
    ends_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'draft',
    published BOOLEAN DEFAULT FALSE,
    created_by INTEGER
);
DROP TRIGGER IF EXISTS trigger_update_poll_timestamp ON polls;
CREATE TRIGGER trigger_update_poll_timestamp BEFORE UPDATE ON polls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS poll_options (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    text VARCHAR(500) NOT NULL,
    display_order INTEGER DEFAULT 0,
    votes_count INTEGER DEFAULT 0
);

-- ===========================================...
-- 3. TABLAS DEL PORTAL DE DOCENTES (TEACHERS)
-- ===========================================...
CREATE TABLE IF NOT EXISTS teacher_classes (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,
    materia VARCHAR(100) NOT NULL,
    grado INTEGER CHECK (grado BETWEEN 1 AND 3),
    grupo VARCHAR(10) NOT NULL,
    ciclo_escolar VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER update_teacher_classes_updated_at BEFORE UPDATE ON teacher_classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS teacher_class_students (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES teacher_classes(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (class_id, student_id)
);

-- ===========================================...
-- 4. TABLAS DEL SISTEMA DE MENSAJERÍA
-- ===========================================...
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    conversation_type VARCHAR(20) NOT NULL DEFAULT 'direct',
    creator_id INTEGER NOT NULL,
    creator_role VARCHAR(20) NOT NULL,
    last_message_id INTEGER,
    last_message_at TIMESTAMP,
    total_messages INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trigger_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS conversation_participants (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    user_role VARCHAR(20) NOT NULL,
    unread_count INTEGER DEFAULT 0,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL,
    sender_role VARCHAR(20) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================...
-- 5. TABLAS DE LA BIBLIOTECA DIGITAL
-- ===========================================...
CREATE TABLE IF NOT EXISTS library_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    parent_id INTEGER REFERENCES library_categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS library_documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(300) NOT NULL UNIQUE,
    description TEXT,
    category_id INTEGER NOT NULL REFERENCES library_categories(id) ON DELETE RESTRICT,
    author_id INTEGER NOT NULL,
    author_role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trigger_documents_updated_at BEFORE UPDATE ON library_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================...
-- DATOS INICIALES
-- ===========================================...
INSERT INTO usuarios (username, email, password_hash, role) VALUES
('admin', 'admin@heroespatria.edu.mx', '$2b$12$c6XQgfRG4WAkwhADy7RcQeSIfAVidcWV/F/OTcswVQ.L/99CUfGIK', 'admin')
ON CONFLICT (username) DO NOTHING;