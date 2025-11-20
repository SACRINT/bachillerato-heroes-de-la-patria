-- ========================================
-- MIGRACIÓN: Sistema de Tutor IA Personalizado
-- BGE Héroes de la Patria
-- FASE 3 - Semana 17-18
-- ========================================

-- ========================================
-- TABLA: Perfil de Aprendizaje del Usuario
-- ========================================
CREATE TABLE IF NOT EXISTS tutor_learning_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE UNIQUE,

    -- Estilo de aprendizaje (VARK model)
    learning_style VARCHAR(20) DEFAULT 'multimodal', -- visual, auditory, reading, kinesthetic, multimodal

    -- Preferencias
    preferred_difficulty VARCHAR(20) DEFAULT 'adaptive', -- easy, medium, hard, adaptive
    preferred_session_length INTEGER DEFAULT 30,         -- minutos
    preferred_time_of_day VARCHAR(20),                   -- morning, afternoon, evening, night

    -- Fortalezas y debilidades por materia (JSON)
    subject_proficiency JSONB DEFAULT '{}',              -- {math: 0.7, history: 0.5, ...}

    -- Objetivos
    learning_goals JSONB,                                -- [{subject, goal, deadline}]
    weekly_target_hours INTEGER DEFAULT 5,

    -- Historial de rendimiento
    avg_session_duration INTEGER DEFAULT 0,
    avg_quiz_score DECIMAL(5,2) DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0,                  -- minutos

    -- Racha y consistencia
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_session_at TIMESTAMP WITH TIME ZONE,

    -- Gamificación
    tutor_xp INTEGER DEFAULT 0,
    tutor_level INTEGER DEFAULT 1,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Sesiones de Tutoría
-- ========================================
CREATE TABLE IF NOT EXISTS tutor_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Tema
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(200) NOT NULL,
    subtopic VARCHAR(200),

    -- Tipo de sesión
    session_type VARCHAR(50) NOT NULL,                   -- lesson, quiz, practice, review, explanation

    -- Configuración
    difficulty_level VARCHAR(20) DEFAULT 'medium',
    target_duration INTEGER DEFAULT 15,                  -- minutos
    actual_duration INTEGER DEFAULT 0,

    -- Estado
    status VARCHAR(20) DEFAULT 'active',                 -- active, completed, abandoned, paused

    -- Conversación
    messages JSONB DEFAULT '[]',                         -- [{role, content, timestamp}]
    message_count INTEGER DEFAULT 0,

    -- Evaluación
    questions_asked INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    quiz_score DECIMAL(5,2),

    -- Feedback
    understanding_level INTEGER,                         -- 1-5 autoevaluación
    was_helpful BOOLEAN,
    feedback_text TEXT,

    -- IA Metadata
    ai_provider VARCHAR(50),                             -- openai, anthropic, gemini
    ai_model VARCHAR(100),
    tokens_used INTEGER DEFAULT 0,
    iacoins_spent INTEGER DEFAULT 0,

    -- Gamificación
    xp_earned INTEGER DEFAULT 0,
    coins_earned INTEGER DEFAULT 0,

    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Rutas de Aprendizaje
-- ========================================
CREATE TABLE IF NOT EXISTS tutor_learning_paths (
    id SERIAL PRIMARY KEY,

    -- Información básica
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE,
    description TEXT,

    -- Configuración
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50),
    difficulty VARCHAR(20) DEFAULT 'medium',
    estimated_hours INTEGER,

    -- Contenido
    modules JSONB NOT NULL,                              -- [{id, title, topics: [{name, duration, type}]}]
    total_modules INTEGER DEFAULT 0,
    total_topics INTEGER DEFAULT 0,

    -- Prerrequisitos
    prerequisites JSONB,                                 -- [learning_path_ids]
    skills_required JSONB,

    -- Objetivos
    learning_objectives JSONB,                           -- ["Objetivo 1", "Objetivo 2"]
    competencies_covered JSONB,

    -- Gamificación
    xp_reward INTEGER DEFAULT 100,
    coins_reward INTEGER DEFAULT 50,
    badge_id INTEGER,                                    -- Badge al completar

    -- Estado
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Progreso en Rutas de Aprendizaje
-- ========================================
CREATE TABLE IF NOT EXISTS tutor_path_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    path_id INTEGER NOT NULL REFERENCES tutor_learning_paths(id) ON DELETE CASCADE,

    -- Progreso
    current_module INTEGER DEFAULT 0,
    current_topic INTEGER DEFAULT 0,
    completed_topics JSONB DEFAULT '[]',                 -- [topic_ids]

    -- Estadísticas
    progress_percent INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0,                        -- minutos
    sessions_completed INTEGER DEFAULT 0,

    -- Evaluación
    avg_quiz_score DECIMAL(5,2) DEFAULT 0,
    quizzes_passed INTEGER DEFAULT 0,
    quizzes_failed INTEGER DEFAULT 0,

    -- Estado
    status VARCHAR(20) DEFAULT 'in_progress',            -- in_progress, completed, paused

    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(user_id, path_id)
);

-- ========================================
-- TABLA: Recomendaciones del Tutor
-- ========================================
CREATE TABLE IF NOT EXISTS tutor_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Tipo de recomendación
    recommendation_type VARCHAR(50) NOT NULL,            -- topic, resource, path, challenge, review

    -- Contenido
    title VARCHAR(200) NOT NULL,
    description TEXT,
    reason TEXT,                                         -- Por qué se recomienda

    -- Referencia
    reference_type VARCHAR(50),                          -- learning_path, library_resource, challenge
    reference_id INTEGER,

    -- Prioridad
    priority INTEGER DEFAULT 50,                         -- 1-100
    confidence_score DECIMAL(3,2),                       -- 0-1 confianza del algoritmo

    -- Estado
    is_viewed BOOLEAN DEFAULT false,
    is_accepted BOOLEAN,
    is_dismissed BOOLEAN DEFAULT false,

    -- Timestamps
    viewed_at TIMESTAMP WITH TIME ZONE,
    acted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Conceptos y Dominio
-- ========================================
CREATE TABLE IF NOT EXISTS tutor_concept_mastery (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Concepto
    subject VARCHAR(100) NOT NULL,
    concept VARCHAR(200) NOT NULL,
    parent_concept VARCHAR(200),

    -- Nivel de dominio
    mastery_level DECIMAL(3,2) DEFAULT 0,                -- 0-1
    confidence DECIMAL(3,2) DEFAULT 0,

    -- Historial
    times_practiced INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    last_practiced_at TIMESTAMP WITH TIME ZONE,

    -- Spaced repetition
    next_review_at TIMESTAMP WITH TIME ZONE,
    review_interval INTEGER DEFAULT 1,                   -- días

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, subject, concept)
);

-- ========================================
-- TABLA: Preguntas Generadas
-- ========================================
CREATE TABLE IF NOT EXISTS tutor_questions (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES tutor_sessions(id) ON DELETE SET NULL,

    -- Tema
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(200) NOT NULL,
    concept VARCHAR(200),

    -- Pregunta
    question_type VARCHAR(50) NOT NULL,                  -- multiple_choice, true_false, short_answer, essay
    question_text TEXT NOT NULL,
    options JSONB,                                       -- Para opción múltiple
    correct_answer TEXT NOT NULL,
    explanation TEXT,

    -- Dificultad
    difficulty VARCHAR(20) DEFAULT 'medium',
    bloom_level VARCHAR(20),                             -- remember, understand, apply, analyze, evaluate, create

    -- Metadatos
    ai_generated BOOLEAN DEFAULT true,
    source TEXT,
    tags JSONB,

    -- Estadísticas de uso
    times_used INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    avg_time_to_answer INTEGER,                          -- segundos

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Respuestas del Usuario
-- ========================================
CREATE TABLE IF NOT EXISTS tutor_answers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES tutor_sessions(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES tutor_questions(id) ON DELETE CASCADE,

    -- Respuesta
    user_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_taken INTEGER,                                  -- segundos

    -- Feedback
    ai_feedback TEXT,
    hints_used INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ÍNDICES DE PERFORMANCE
-- ========================================

-- Learning profiles
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_user ON tutor_learning_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_style ON tutor_learning_profiles(learning_style);

-- Sessions
CREATE INDEX IF NOT EXISTS idx_tutor_sessions_user ON tutor_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_sessions_subject ON tutor_sessions(subject);
CREATE INDEX IF NOT EXISTS idx_tutor_sessions_status ON tutor_sessions(status);
CREATE INDEX IF NOT EXISTS idx_tutor_sessions_started ON tutor_sessions(started_at DESC);

-- Learning paths
CREATE INDEX IF NOT EXISTS idx_tutor_paths_subject ON tutor_learning_paths(subject);
CREATE INDEX IF NOT EXISTS idx_tutor_paths_featured ON tutor_learning_paths(is_featured, is_active);

-- Path progress
CREATE INDEX IF NOT EXISTS idx_tutor_progress_user ON tutor_path_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_progress_path ON tutor_path_progress(path_id);
CREATE INDEX IF NOT EXISTS idx_tutor_progress_status ON tutor_path_progress(status);

-- Recommendations
CREATE INDEX IF NOT EXISTS idx_tutor_recommendations_user ON tutor_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_recommendations_type ON tutor_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_tutor_recommendations_active ON tutor_recommendations(user_id, is_dismissed, expires_at);

-- Concept mastery
CREATE INDEX IF NOT EXISTS idx_tutor_mastery_user ON tutor_concept_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_mastery_subject ON tutor_concept_mastery(subject);
CREATE INDEX IF NOT EXISTS idx_tutor_mastery_review ON tutor_concept_mastery(next_review_at);

-- Questions
CREATE INDEX IF NOT EXISTS idx_tutor_questions_subject ON tutor_questions(subject, topic);
CREATE INDEX IF NOT EXISTS idx_tutor_questions_type ON tutor_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_tutor_questions_difficulty ON tutor_questions(difficulty);

-- Answers
CREATE INDEX IF NOT EXISTS idx_tutor_answers_user ON tutor_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_answers_session ON tutor_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_tutor_answers_question ON tutor_answers(question_id);

-- ========================================
-- DATOS INICIALES: Rutas de Aprendizaje
-- ========================================
INSERT INTO tutor_learning_paths (
    title, slug, description, subject, grade_level, difficulty,
    estimated_hours, modules, total_modules, total_topics,
    learning_objectives, xp_reward, coins_reward, is_featured
) VALUES
    (
        'Fundamentos de Álgebra',
        'fundamentos-algebra',
        'Domina los conceptos básicos del álgebra desde cero hasta ecuaciones cuadráticas.',
        'Matemáticas',
        '1er Semestre',
        'medium',
        20,
        '[
            {"id": 1, "title": "Introducción", "topics": [
                {"name": "Qué es el álgebra", "duration": 15, "type": "lesson"},
                {"name": "Variables y constantes", "duration": 20, "type": "lesson"},
                {"name": "Quiz inicial", "duration": 10, "type": "quiz"}
            ]},
            {"id": 2, "title": "Operaciones básicas", "topics": [
                {"name": "Suma y resta de términos", "duration": 25, "type": "lesson"},
                {"name": "Multiplicación", "duration": 25, "type": "lesson"},
                {"name": "División", "duration": 25, "type": "lesson"},
                {"name": "Práctica guiada", "duration": 20, "type": "practice"}
            ]},
            {"id": 3, "title": "Ecuaciones lineales", "topics": [
                {"name": "Ecuaciones de primer grado", "duration": 30, "type": "lesson"},
                {"name": "Resolución paso a paso", "duration": 30, "type": "lesson"},
                {"name": "Problemas aplicados", "duration": 25, "type": "practice"},
                {"name": "Evaluación", "duration": 15, "type": "quiz"}
            ]}
        ]',
        3, 10,
        '["Comprender el concepto de variable", "Realizar operaciones algebraicas básicas", "Resolver ecuaciones de primer grado"]',
        150, 75, true
    ),
    (
        'Historia de México: Independencia',
        'historia-independencia',
        'Conoce los eventos, personajes y causas del movimiento de Independencia de México.',
        'Historia',
        '2do Semestre',
        'medium',
        15,
        '[
            {"id": 1, "title": "Antecedentes", "topics": [
                {"name": "Nueva España en el siglo XVIII", "duration": 20, "type": "lesson"},
                {"name": "Ideas ilustradas", "duration": 20, "type": "lesson"},
                {"name": "Crisis de la monarquía", "duration": 20, "type": "lesson"}
            ]},
            {"id": 2, "title": "Inicio del movimiento", "topics": [
                {"name": "Conspiración de Querétaro", "duration": 15, "type": "lesson"},
                {"name": "El Grito de Dolores", "duration": 20, "type": "lesson"},
                {"name": "Miguel Hidalgo", "duration": 25, "type": "lesson"}
            ]},
            {"id": 3, "title": "Desarrollo y consumación", "topics": [
                {"name": "José María Morelos", "duration": 25, "type": "lesson"},
                {"name": "Sentimientos de la Nación", "duration": 20, "type": "lesson"},
                {"name": "Consumación", "duration": 20, "type": "lesson"},
                {"name": "Evaluación final", "duration": 15, "type": "quiz"}
            ]}
        ]',
        3, 10,
        '["Identificar causas de la Independencia", "Conocer personajes principales", "Comprender el proceso histórico"]',
        120, 60, true
    ),
    (
        'Programación Básica',
        'programacion-basica',
        'Aprende los fundamentos de la programación con ejemplos prácticos.',
        'Informática',
        '3er Semestre',
        'hard',
        25,
        '[
            {"id": 1, "title": "Introducción", "topics": [
                {"name": "Qué es programar", "duration": 15, "type": "lesson"},
                {"name": "Algoritmos", "duration": 20, "type": "lesson"},
                {"name": "Pseudocódigo", "duration": 25, "type": "lesson"}
            ]},
            {"id": 2, "title": "Variables y tipos de datos", "topics": [
                {"name": "Variables", "duration": 20, "type": "lesson"},
                {"name": "Tipos de datos", "duration": 20, "type": "lesson"},
                {"name": "Operadores", "duration": 25, "type": "lesson"},
                {"name": "Ejercicios", "duration": 30, "type": "practice"}
            ]},
            {"id": 3, "title": "Estructuras de control", "topics": [
                {"name": "Condicionales", "duration": 30, "type": "lesson"},
                {"name": "Ciclos", "duration": 30, "type": "lesson"},
                {"name": "Proyecto final", "duration": 45, "type": "practice"}
            ]}
        ]',
        3, 10,
        '["Entender lógica de programación", "Usar variables y operadores", "Implementar estructuras de control"]',
        200, 100, true
    );

-- ========================================
-- COMENTARIOS
-- ========================================
COMMENT ON TABLE tutor_learning_profiles IS 'Perfil de aprendizaje personalizado del usuario';
COMMENT ON TABLE tutor_sessions IS 'Sesiones de tutoría con historial de conversación';
COMMENT ON TABLE tutor_learning_paths IS 'Rutas de aprendizaje estructuradas';
COMMENT ON TABLE tutor_path_progress IS 'Progreso del usuario en rutas de aprendizaje';
COMMENT ON TABLE tutor_recommendations IS 'Recomendaciones personalizadas del tutor';
COMMENT ON TABLE tutor_concept_mastery IS 'Nivel de dominio de conceptos por usuario';
COMMENT ON TABLE tutor_questions IS 'Banco de preguntas generadas por IA';
COMMENT ON TABLE tutor_answers IS 'Respuestas del usuario a preguntas';

COMMENT ON COLUMN tutor_learning_profiles.learning_style IS 'VARK model: visual, auditory, reading, kinesthetic';
COMMENT ON COLUMN tutor_learning_profiles.subject_proficiency IS 'JSON con nivel 0-1 por materia';
COMMENT ON COLUMN tutor_concept_mastery.mastery_level IS 'Nivel de dominio 0-1';
COMMENT ON COLUMN tutor_questions.bloom_level IS 'Taxonomía de Bloom: remember, understand, apply, analyze, evaluate, create';

-- ========================================
-- FIN DE MIGRACIÓN
-- ========================================
