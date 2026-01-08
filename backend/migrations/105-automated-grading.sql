-- 📚 MIGRACIÓN 105: AUTOMATED ESSAY SCORING
-- Propósito: Calificación automática de respuestas abiertas (Fase 6 - Semana 45)
-- 1. Configuraciones de Rúbrica NLP
CREATE TABLE IF NOT EXISTS nlp_grading_rules (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL,
    -- Referencia a question_bank
    keywords_required JSONB,
    -- ["revolución", "1910", "madero"]
    min_word_count INTEGER DEFAULT 50,
    semantic_similarity_threshold DECIMAL(5, 2) DEFAULT 0.7,
    -- vs Model Answer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 2. Intentos de Respuesta Abierta
CREATE TABLE IF NOT EXISTS essay_submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    answer_text TEXT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending_grading'
);
-- 3. Feedback Automático Generado
CREATE TABLE IF NOT EXISTS automated_grades (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES essay_submissions(id) ON DELETE CASCADE,
    score DECIMAL(5, 2),
    -- 0 a 100
    keyword_match_score DECIMAL(5, 2),
    readability_score DECIMAL(5, 2),
    feedback_text TEXT,
    -- "Buen uso de vocabulario, pero faltó mencionar a Zapata."
    is_final BOOLEAN DEFAULT FALSE,
    -- Si el profesor lo aprobó
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_essay_user ON essay_submissions(user_id);