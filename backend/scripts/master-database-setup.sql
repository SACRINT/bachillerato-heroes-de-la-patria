/*
-- ============================================
-- SCRIPT MAESTRO DE INSTALACIÓN DE BASE DE DATOS (PostgreSQL) - v3 FINAL
-- Fecha: 20-10-2025
-- Unifica: Core, CMS (Noticias, Eventos, Comunicados), Quejas, Suscriptores, Polls, Teachers Portal, etc.
-- ============================================
*/

-- ============================================
-- BLOQUE DE LIMPIEZA (DROP IF EXISTS)
-- ============================================
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
DROP TABLE IF EXISTS comunicados CASCADE;
DROP TABLE IF EXISTS eventos CASCADE;
DROP TABLE IF EXISTS noticias CASCADE;
DROP TABLE IF EXISTS quejas CASCADE;
DROP TABLE IF EXISTS suscriptores_notificaciones CASCADE;
DROP TABLE IF EXISTS pending_submissions CASCADE;
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


-- ============================================
-- FUNCIÓN ÚNICA PARA TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TIPOS ENUMERADOS (TODOS LOS MÓDULOS)
-- ============================================
CREATE TYPE role_type AS ENUM ('admin', 'docente', 'estudiante', 'padre');
CREATE TYPE status_type AS ENUM ('activo', 'inactivo', 'suspendido');
CREATE TYPE genero_type AS ENUM ('M', 'F', 'O');
CREATE TYPE status_academico_type AS ENUM ('regular', 'irregular', 'baja', 'egresado');
CREATE TYPE docente_status_type AS ENUM ('activo', 'inactivo', 'licencia');

-- ============================================
-- 1. TABLAS PRINCIPALES (CORE)
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role role_type NOT NULL DEFAULT 'estudiante',
    status status_type NOT NULL DEFAULT 'activo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS estudiantes (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    grado INT, 
    grupo VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS docentes (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre_completo VARCHAR(255) NOT NULL,
    especialidad VARCHAR(100)
);

-- ============================================
-- 2. TABLAS DE CONTENIDO (CMS)
-- ============================================
CREATE TABLE IF NOT EXISTS noticias (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'borrador',
    fecha_publicacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eventos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ,
    ubicacion VARCHAR(300),
    modalidad VARCHAR(50) DEFAULT 'presencial',
    estado VARCHAR(20) DEFAULT 'borrador'
);

CREATE TABLE IF NOT EXISTS comunicados (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'borrador',
    fecha_publicacion TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TABLAS DE INTERACCIÓN
-- ============================================
CREATE TABLE IF NOT EXISTS quejas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pendiente',
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suscriptores_notificaciones (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(255),
    estado VARCHAR(20) DEFAULT 'activo',
    verificado BOOLEAN DEFAULT FALSE,
    token_verificacion VARCHAR(255),
    fecha_registro TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pending_submissions (
    id SERIAL PRIMARY KEY,
    form_type VARCHAR(50) NOT NULL,
    submission_data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. TABLAS DE MÓDULOS ADICIONALES
-- ============================================
CREATE TABLE IF NOT EXISTS polls (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft'
);

CREATE TABLE IF NOT EXISTS teacher_classes (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,
    materia VARCHAR(100) NOT NULL
);

-- ============================================
-- DATOS INICIALES
-- ============================================
INSERT INTO usuarios (username, email, password_hash, role) VALUES
('admin', 'admin@heroespatria.edu.mx', '$2b$12$c6XQgfRG4WAkwhADy7RcQeSIfAVidcWV/F/OTcswVQ.L/99CUfGIK', 'admin')
ON CONFLICT (username) DO NOTHING;