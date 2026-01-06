-- Tabla de Temas Académicos (Si no existe)
CREATE TABLE IF NOT EXISTS academic_topics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);
-- Tabla para lecciones de microlearning (contenido corto < 5 min)
CREATE TABLE IF NOT EXISTS micro_lessons (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    topic_id INTEGER REFERENCES academic_topics(id),
    content_type VARCHAR(50) CHECK (
        content_type IN ('video', 'text', 'quiz', 'flashcard')
    ),
    content_url TEXT,
    -- URL del video o recurso externo
    content_body TEXT,
    -- Contenido texto/html o JSON del quiz
    duration_seconds INTEGER DEFAULT 300,
    -- Default 5 min
    complexity_level VARCHAR(20) DEFAULT 'beginner',
    created_at TIMESTAMP DEFAULT NOW()
);
-- Tabla para el progreso del usuario en microlearning
CREATE TABLE IF NOT EXISTS micro_lesson_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    lesson_id INTEGER REFERENCES micro_lessons(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('started', 'completed', 'skipped')),
    progress_percent INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    last_accessed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);
-- Índices
CREATE INDEX idx_micro_lessons_topic ON micro_lessons(topic_id);
CREATE INDEX idx_micro_progress_user ON micro_lesson_progress(user_id);