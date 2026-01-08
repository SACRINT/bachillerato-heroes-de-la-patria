-- 📚 MIGRACIÓN 099: MULTI-FORMAT CONTENT SUPPORT
-- Propósito: Soporte para documentos interactivos, audio y presentaciones (Fase 5 - Semana 39)
-- 1. Documentos y Artículos (PDFs, Markdown)
CREATE TABLE IF NOT EXISTS content_documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(500) NOT NULL,
    format_type VARCHAR(50) DEFAULT 'pdf',
    -- 'pdf', 'markdown', 'epub'
    page_count INTEGER,
    estimated_read_time_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 2. Audio Learning (Podcasts, Audiobooks)
CREATE TABLE IF NOT EXISTS content_audio (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(500) NOT NULL,
    duration_seconds INTEGER,
    transcript_text TEXT,
    -- Para búsqueda y accesibilidad
    cover_image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 3. Presentaciones Enriquecidas (Slides)
CREATE TABLE IF NOT EXISTS content_presentations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slides_json JSONB NOT NULL,
    -- Array de { "img": "url", "notes": "..." }
    total_slides INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 4. Progreso de Contenido Multi-Formato
-- Unifica el seguimiento para tipos que no son video (video tiene su propia tabla robusta)
CREATE TABLE IF NOT EXISTS multi_format_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    -- 'document', 'audio', 'presentation'
    content_id INTEGER NOT NULL,
    progress_data JSONB DEFAULT '{}',
    -- { "last_page": 5 } o { "timestamp": 300 }
    percent_complete INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, content_type, content_id)
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_multiformat_user ON multi_format_progress(user_id);
-- Seed Data: Documento PDF
INSERT INTO content_documents (
        title,
        description,
        file_url,
        format_type,
        page_count
    )
VALUES (
        'Guía de Estudio: Revolución Mexicana',
        'Resumen completo de los eventos clave de 1910 a 1920.',
        '/uploads/docs/revolucion_guia.pdf',
        'pdf',
        15
    );
-- Seed Data: Audio
INSERT INTO content_audio (title, description, file_url, duration_seconds)
VALUES (
        'Podcast: Héroes de la Independencia',
        'Episodio 1: Miguel Hidalgo y el Grito de Dolores.',
        '/uploads/audio/heroes_ep1.mp3',
        1200
    );
-- Seed Data: Presentación
INSERT INTO content_presentations (title, slides_json, total_slides)
VALUES (
        'Biología Celular: Mitosis',
        '[
        {"title": "Introducción", "img": "/uploads/slides/bio_1.jpg"},
        {"title": "Profase", "img": "/uploads/slides/bio_2.jpg"},
        {"title": "Metafase", "img": "/uploads/slides/bio_3.jpg"}
    ]',
        3
    );