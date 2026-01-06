-- 066-adaptive-content.sql
-- Sistema de Contenido Adaptativo (Semana 10)
-- 1. Temas de Estudio (Broad Topics)
CREATE TABLE IF NOT EXISTS adaptive_topics (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    subject VARCHAR(50),
    -- Matemáticas, Historia, etc.
    base_difficulty INTEGER DEFAULT 5,
    -- 1-10
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 2. Nodos de Contenido (Lecciones específicas o conceptos)
CREATE TABLE IF NOT EXISTS adaptive_nodes (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER REFERENCES adaptive_topics(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    order_index INTEGER DEFAULT 0,
    prerequisite_node_id INTEGER REFERENCES adaptive_nodes(id),
    -- Grafo de dependencias simple
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 3. Adaptaciones de Contenido (Variaciones del mismo contenido)
CREATE TABLE IF NOT EXISTS content_adaptations (
    id SERIAL PRIMARY KEY,
    node_id INTEGER REFERENCES adaptive_nodes(id) ON DELETE CASCADE,
    -- Tipo de contenido
    content_type VARCHAR(20) NOT NULL,
    -- 'text', 'video', 'interactive', 'quiz'
    -- Target de estilo de aprendizaje
    target_style VARCHAR(20) DEFAULT 'neutral',
    -- 'visual', 'auditory', 'kinesthetic', 'neutral'
    -- Nivel de dificultad (1-10)
    difficulty_level INTEGER DEFAULT 5,
    -- El contenido real
    content_body TEXT,
    -- Markdown, HTML, o URL de video/iframe
    content_metadata JSONB DEFAULT '{}',
    -- Duración, tags, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 4. Tracking de Maestría y Adaptación del Usuario
CREATE TABLE IF NOT EXISTS user_topic_mastery (
    user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    topic_id INTEGER REFERENCES adaptive_topics(id) ON DELETE CASCADE,
    current_mastery_level FLOAT DEFAULT 0.0,
    -- 0.0 a 100.0
    current_difficulty_preference INTEGER DEFAULT 5,
    -- Nivel de dificultad adecuado (1-10)
    last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, topic_id)
);
-- 5. Log de Interacciones para calibrar dificultad
CREATE TABLE IF NOT EXISTS adaptive_interaction_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    adaptation_id INTEGER REFERENCES content_adaptations(id) ON DELETE
    SET NULL,
        interaction_type VARCHAR(50),
        -- 'view', 'complete', 'quiz_success', 'quiz_failure', 'abandon'
        time_spent_seconds INTEGER,
        -- Feedback explícito o implícito
        difficulty_feedback INTEGER,
        -- 1 (Muy fácil) - 5 (Muy difícil) - Opcional
        success_rate FLOAT,
        -- Si aplica (ej. score en quiz)
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_adaptations_node_style ON content_adaptations(node_id, target_style, difficulty_level);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_user ON adaptive_interaction_logs(user_id);
-- Seed Data: Un tema de ejemplo "Historia de México"
INSERT INTO adaptive_topics (title, description, subject)
VALUES (
        'Revolución Mexicana',
        'Causas y desarrollo del conflicto armado de 1910',
        'Historia'
    ) ON CONFLICT DO NOTHING;
-- Seed Nodes (se asume ID 1 para el tema insertado, mejor usar DO block en prod real, aquí simplificado)
-- En un entorno real, usaríamos una función para insertar y obtener ID