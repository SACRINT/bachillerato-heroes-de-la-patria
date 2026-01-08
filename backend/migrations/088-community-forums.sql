-- Tabla de Foros/Categorías
CREATE TABLE IF NOT EXISTS forums (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    -- Nombre de icono FontAwesome
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Hilos de discusión
CREATE TABLE IF NOT EXISTS forum_threads (
    id SERIAL PRIMARY KEY,
    forum_id INTEGER REFERENCES forums(id),
    author_id INTEGER REFERENCES usuarios(id),
    title VARCHAR(200) NOT NULL,
    content TEXT,
    view_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    is_solved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Respuestas
CREATE TABLE IF NOT EXISTS forum_replies (
    id SERIAL PRIMARY KEY,
    thread_id INTEGER REFERENCES forum_threads(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES usuarios(id),
    content TEXT NOT NULL,
    is_solution BOOLEAN DEFAULT FALSE,
    parent_reply_id INTEGER REFERENCES forum_replies(id),
    -- Para anidar respuestas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Votos (Upvotes/Downvotes)
CREATE TABLE IF NOT EXISTS forum_votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id),
    reference_type VARCHAR(20) NOT NULL,
    -- 'thread', 'reply'
    reference_id INTEGER NOT NULL,
    vote_value INTEGER NOT NULL,
    -- 1 o -1
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, reference_type, reference_id)
);
-- Seed data for basic forums
INSERT INTO forums (title, description, icon, display_order)
SELECT 'Dudas Generales',
    'Preguntas sobre la plataforma o la escuela',
    'fa-question-circle',
    1
WHERE NOT EXISTS (
        SELECT 1
        FROM forums
        WHERE title = 'Dudas Generales'
    );
INSERT INTO forums (title, description, icon, display_order)
SELECT 'Matemáticas',
    'Cálculo, Álgebra y más',
    'fa-calculator',
    2
WHERE NOT EXISTS (
        SELECT 1
        FROM forums
        WHERE title = 'Matemáticas'
    );