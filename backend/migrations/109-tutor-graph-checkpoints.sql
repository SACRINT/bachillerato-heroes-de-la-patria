-- Migration 109: LangGraph StateGraph Checkpoints for AI School Tutor
-- Fase 6 - Objetivo 3: Tutor Escolar Inteligente Socrático

CREATE TABLE IF NOT EXISTS tutor_graph_checkpoints (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL UNIQUE,
    user_id VARCHAR(100),
    subject VARCHAR(100) NOT NULL,
    state JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tutor_checkpoints_session ON tutor_graph_checkpoints(session_id);
CREATE INDEX IF NOT EXISTS idx_tutor_checkpoints_subject ON tutor_graph_checkpoints(subject);
