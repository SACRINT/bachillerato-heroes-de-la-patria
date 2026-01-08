-- 📚 MIGRACIÓN 098: CONTENT RECOMMENDATION ENGINE
-- Propósito: Motor de recomendaciones híbrido (Contenido + Colaborativo) (Fase 5 - Semana 38)
-- 1. Registro Unificado de Interacciones (Weighted Log)
-- Centraliza señales de varios orígenes (videos, labs, problemas)
CREATE TABLE IF NOT EXISTS user_interaction_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    -- 'video', 'lab', 'problem', 'document'
    content_id INTEGER NOT NULL,
    -- ID polimórfico
    interaction_type VARCHAR(50) NOT NULL,
    -- 'view', 'complete', 'like', 'high_score', 'dropout'
    weight_score DECIMAL(5, 2) DEFAULT 1.0,
    -- Valor de la señal (ej. like=5, view=1)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 2. Preferencias Explícitas de Usuario
CREATE TABLE IF NOT EXISTS user_learning_preferences (
    user_id INTEGER PRIMARY KEY,
    favorite_topics JSONB DEFAULT '[]',
    -- ["Math", "Physics"]
    preferred_difficulty INTEGER DEFAULT 3,
    learning_style VARCHAR(50) DEFAULT 'visual',
    -- 'visual', 'textual', 'interactive'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 3. Cache de Recomendaciones (Pre-calculadas)
CREATE TABLE IF NOT EXISTS content_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    recommended_content_type VARCHAR(50) NOT NULL,
    recommended_content_id INTEGER NOT NULL,
    score DECIMAL(10, 4) NOT NULL,
    reason VARCHAR(255),
    -- "Porque viste X", "Popular en tu grupo"
    algorithm_source VARCHAR(50) NOT NULL,
    -- 'collaborative', 'content_based', 'trending'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);
-- 4. Matriz de Similitud de Contenido (Simplificada)
-- Relaciona contenidos que suelen consumirse juntos
CREATE TABLE IF NOT EXISTS content_correlations (
    content_a_type VARCHAR(50),
    content_a_id INTEGER,
    content_b_type VARCHAR(50),
    content_b_id INTEGER,
    correlation_strength DECIMAL(5, 4),
    -- 0 a 1
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (
        content_a_type,
        content_a_id,
        content_b_type,
        content_b_id
    )
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_interactions_user ON user_interaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user ON content_recommendations(user_id, score DESC);
-- Seed Data: Preferencias Dummy
INSERT INTO user_learning_preferences (user_id, favorite_topics, learning_style)
VALUES (1, '["Historia", "Matemáticas"]', 'interactive') ON CONFLICT (user_id) DO NOTHING;