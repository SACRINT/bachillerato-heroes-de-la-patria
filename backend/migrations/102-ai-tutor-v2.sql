-- 📚 MIGRACIÓN 102: AI TUTOR V2 (CONTEXTUAL)
-- Propósito: Memoria conversacional y contexto educativo para el Tutor IA (Fase 6 - Semana 42)
-- 1. Sesiones de Tutoría Contextual
CREATE TABLE IF NOT EXISTS tutor_chat_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    current_topic VARCHAR(100),
    -- Contexto actual (e.g. "Algebra Lineal")
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
-- 2. Historial de Mensajes con Metadatos
CREATE TABLE IF NOT EXISTS tutor_chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES tutor_chat_sessions(id) ON DELETE CASCADE,
    sender VARCHAR(10) NOT NULL,
    -- 'user', 'ai'
    message_text TEXT NOT NULL,
    context_data_json JSONB,
    -- { "related_content_id": 5, "detected_intent": "help" }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 3. Feedback de Calidad de Respuesta (RLHF simplificado)
CREATE TABLE IF NOT EXISTS tutor_response_feedback (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES tutor_chat_messages(id),
    rating INTEGER CHECK (
        rating BETWEEN 1 AND 5
    ),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_tutor_sessions_user ON tutor_chat_sessions(user_id);