-- 📚 MIGRACIÓN 094: VIDEO LEARNING PLATFORM
-- Propósito: Estructura para la plataforma de video interactivo (Fase 5 - Semana 34)
-- 1. Metadatos de Video (Extensión de contenido o stand-alone)
CREATE TABLE IF NOT EXISTS video_metadata (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url VARCHAR(500) NOT NULL,
    provider VARCHAR(50) DEFAULT 'youtube',
    -- 'youtube', 'vimeo', 'html5'
    duration_seconds INTEGER DEFAULT 0,
    thumbnail_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 2. Elementos Interactivos en Video (Quizzes, Notas, Popups)
CREATE TABLE IF NOT EXISTS video_interactions (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES video_metadata(id) ON DELETE CASCADE,
    timestamp_seconds INTEGER NOT NULL,
    -- Momento donde aparece la interacción
    interaction_type VARCHAR(50) NOT NULL,
    -- 'quiz', 'info', 'decision'
    content_payload JSONB NOT NULL,
    -- Pregunta, opciones, texto informativo
    pause_video BOOLEAN DEFAULT TRUE,
    -- Si debe pausar el video al aparecer
    is_required BOOLEAN DEFAULT FALSE,
    -- Si es obligatorio responder para continuar
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 3. Progreso y Bookmarks del Usuario
CREATE TABLE IF NOT EXISTS video_user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    video_id INTEGER REFERENCES video_metadata(id) ON DELETE CASCADE,
    last_position_seconds INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    max_position_seconds INTEGER DEFAULT 0,
    -- Lo más lejos que ha llegado (para evitar saltos si es requerido)
    watch_count INTEGER DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, video_id)
);
CREATE TABLE IF NOT EXISTS video_bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    video_id INTEGER REFERENCES video_metadata(id) ON DELETE CASCADE,
    timestamp_seconds INTEGER NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 4. Subtítulos y Transcripciones
CREATE TABLE IF NOT EXISTS video_captions (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES video_metadata(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL,
    -- 'es', 'en'
    url VARCHAR(500) NOT NULL,
    -- Archivo .vtt
    is_auto_generated BOOLEAN DEFAULT FALSE,
    label VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_video_interactions_time ON video_interactions(video_id, timestamp_seconds);
CREATE INDEX IF NOT EXISTS idx_video_progress_user ON video_user_progress(user_id);
-- Seed Data
INSERT INTO video_metadata (
        title,
        description,
        video_url,
        provider,
        duration_seconds
    )
VALUES (
        'Introducción a la Historia de México',
        'Breve recorrido por las etapas históricas.',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'youtube',
        212
    ),
    (
        'Fundamentos de Álgebra',
        'Conceptos básicos para empezar.',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'html5',
        596
    );
INSERT INTO video_interactions (
        video_id,
        timestamp_seconds,
        interaction_type,
        content_payload,
        pause_video
    )
VALUES (
        1,
        10,
        'info',
        '{"text": "¿Sabías que esta es una de las etapas más importantes?"}',
        FALSE
    ),
    (
        1,
        30,
        'quiz',
        '{"question": "¿En qué año inició la independencia?", "options": ["1810", "1910", "1821"], "correct": 0}',
        TRUE
    );