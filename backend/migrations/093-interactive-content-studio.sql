-- 📚 MIGRACIÓN 093: INTERACTIVE CONTENT STUDIO
-- Propósito: Estructura de tablas para el creador de contenido interactivo (Fase 5 - Semana 33)
-- 1. Tablas de Plantillas (Templates)
CREATE TABLE IF NOT EXISTS studio_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    structure_json JSONB NOT NULL,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 2. Librería de Elementos Interactivos
CREATE TABLE IF NOT EXISTS studio_elements (
    id SERIAL PRIMARY KEY,
    element_type VARCHAR(50) NOT NULL,
    -- 'video', 'quiz', 'text', 'image', 'hotspot', etc.
    name VARCHAR(255) NOT NULL,
    default_config JSONB NOT NULL,
    icon VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 3. Contenido Creado en el Studio
CREATE TABLE IF NOT EXISTS studio_content (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    -- Docente o Admin creador
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    content_json JSONB NOT NULL,
    -- Estructura completa del contenido interactivo
    current_version INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'draft',
    -- 'draft', 'published', 'archived'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 4. Control de Versiones (Version Control)
CREATE TABLE IF NOT EXISTS studio_content_versions (
    id SERIAL PRIMARY KEY,
    content_id INTEGER REFERENCES studio_content(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content_json JSONB NOT NULL,
    created_by INTEGER NOT NULL,
    changelog TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 5. Registro de Historial de Edición (para Colaboración)
CREATE TABLE IF NOT EXISTS studio_edit_history (
    id SERIAL PRIMARY KEY,
    content_id INTEGER REFERENCES studio_content(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL,
    -- 'created', 'updated', 'published', 'restored_version'
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_studio_content_user ON studio_content(user_id);
CREATE INDEX IF NOT EXISTS idx_studio_content_status ON studio_content(status);
CREATE INDEX IF NOT EXISTS idx_studio_templates_category ON studio_templates(category);
CREATE INDEX IF NOT EXISTS idx_studio_versions_content ON studio_content_versions(content_id);
-- Seed Data Inicial (Templates Básicos)
INSERT INTO studio_templates (name, description, category, structure_json)
VALUES (
        'Lección Interactiva Estándar',
        'Template base con video, texto y quiz final.',
        'General',
        '{"elements": []}'
    ),
    (
        'Presentación 360',
        'Exploración de imágenes envolventes con hotspots.',
        'Exploratory',
        '{"elements": []}'
    ),
    (
        'Video Quiz',
        'Video con pausas interactivas para evaluación.',
        'Video',
        '{"elements": []}'
    );
-- Elementos Base
INSERT INTO studio_elements (element_type, name, default_config, icon)
VALUES (
        'text',
        'Texto Enriquecido',
        '{"text": "Nuevo texto", "style": {}}',
        'fas fa-font'
    ),
    (
        'image',
        'Imagen',
        '{"url": "", "alt": ""}',
        'fas fa-image'
    ),
    (
        'video',
        'Reproductor Video',
        '{"url": "", "autoplay": false}',
        'fas fa-play-circle'
    ),
    (
        'quiz',
        'Cuestionario de Opción Múltiple',
        '{"questions": []}',
        'fas fa-question-circle'
    ),
    (
        'button',
        'Botón de Acción',
        '{"label": "Click aquí", "action": ""}',
        'fas fa-mouse-pointer'
    );