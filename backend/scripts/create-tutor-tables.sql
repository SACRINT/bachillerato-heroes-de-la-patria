-- 🤖 AI TUTOR TABLES
-- Tablas para el sistema de tutoría inteligente

-- 1. Perfiles de Aprendizaje
CREATE TABLE IF NOT EXISTS tutor_learning_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES usuarios(id),
    tutor_xp INTEGER DEFAULT 0,
    subject_proficiency JSONB DEFAULT '{}',
    learning_style VARCHAR(50),
    preferred_difficulty VARCHAR(20) DEFAULT 'adaptive',
    preferred_session_length INTEGER DEFAULT 15,
    preferred_time_of_day VARCHAR(20),
    learning_goals TEXT,
    weekly_target_hours INTEGER DEFAULT 2,
    total_sessions INTEGER DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0, -- minutos
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_session_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Sesiones de Tutoría
CREATE TABLE IF NOT EXISTS tutor_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id),
    subject VARCHAR(50) NOT NULL,
    topic VARCHAR(100),
    subtopic VARCHAR(100),
    session_type VARCHAR(20) DEFAULT 'lesson', -- lesson, quiz, review, chat
    difficulty_level VARCHAR(20),
    target_duration INTEGER,
    actual_duration INTEGER,
    messages JSONB DEFAULT '[]',
    message_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- active, completed, abandoned
    quiz_score INTEGER,
    understanding_level INTEGER, -- 1-5
    was_helpful BOOLEAN,
    feedback_text TEXT,
    ai_provider VARCHAR(50),
    ai_model VARCHAR(50),
    tokens_used INTEGER DEFAULT 0,
    iacoins_spent INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    coins_earned INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP
);

-- 3. Dominio de Conceptos (Knowledge Graph simplificado)
CREATE TABLE IF NOT EXISTS tutor_concept_mastery (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id),
    subject VARCHAR(50) NOT NULL,
    concept VARCHAR(100) NOT NULL,
    mastery_level DECIMAL(3,2) DEFAULT 0.0, -- 0.0 a 1.0
    confidence DECIMAL(3,2) DEFAULT 0.0,
    times_practiced INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    last_practiced_at TIMESTAMP,
    next_review_at TIMESTAMP,
    review_interval INTEGER DEFAULT 1, -- días
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, subject, concept)
);

-- 4. Rutas de Aprendizaje
CREATE TABLE IF NOT EXISTS tutor_learning_paths (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    subject VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20),
    estimated_hours INTEGER,
    total_topics INTEGER,
    content_structure JSONB, -- Estructura de módulos y temas
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Progreso en Rutas
CREATE TABLE IF NOT EXISTS tutor_path_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id),
    path_id INTEGER REFERENCES tutor_learning_paths(id),
    status VARCHAR(20) DEFAULT 'not_started', -- not_started, in_progress, completed
    current_module INTEGER DEFAULT 0,
    current_topic INTEGER DEFAULT 0,
    completed_topics JSONB DEFAULT '[]',
    progress_percent INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0,
    sessions_completed INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT NOW(),
    last_activity_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    UNIQUE(user_id, path_id)
);

-- 6. Recomendaciones
CREATE TABLE IF NOT EXISTS tutor_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id),
    recommendation_type VARCHAR(20), -- topic, path, review
    title VARCHAR(100),
    description TEXT,
    reason TEXT,
    reference_type VARCHAR(50),
    reference_id INTEGER,
    priority INTEGER DEFAULT 0,
    confidence_score DECIMAL(3,2),
    is_viewed BOOLEAN DEFAULT FALSE,
    is_accepted BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    viewed_at TIMESTAMP,
    acted_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_tutor_sessions_user ON tutor_sessions(user_id);
CREATE INDEX idx_concept_mastery_user ON tutor_concept_mastery(user_id);
CREATE INDEX idx_path_progress_user ON tutor_path_progress(user_id);
