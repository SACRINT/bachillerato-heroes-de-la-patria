-- Migration: Emotional Learning Analytics
-- Description: Tables for tracking student emotional states during learning sessions.
-- Tabla para definir los estados emocionales base y sus categorías
CREATE TABLE IF NOT EXISTS emotional_states (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    -- e.g., "Frustrated", "Flow", "Bored", "Confident"
    category VARCHAR(20) NOT NULL CHECK (category IN ('NEGATIVE', 'NEUTRAL', 'POSITIVE')),
    valence DECIMAL(3, 2),
    -- -1.0 to 1.0 (Psychometric value)
    arousal DECIMAL(3, 2),
    -- 0.0 to 1.0 (Intensity)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Seed initial emotional states
INSERT INTO emotional_states (name, category, valence, arousal)
VALUES ('Frustrated', 'NEGATIVE', -0.6, 0.8) ON CONFLICT DO NOTHING;
INSERT INTO emotional_states (name, category, valence, arousal)
VALUES ('Bored', 'NEGATIVE', -0.4, 0.2) ON CONFLICT DO NOTHING;
INSERT INTO emotional_states (name, category, valence, arousal)
VALUES ('Anxious', 'NEGATIVE', -0.7, 0.9) ON CONFLICT DO NOTHING;
INSERT INTO emotional_states (name, category, valence, arousal)
VALUES ('Neutral', 'NEUTRAL', 0.0, 0.1) ON CONFLICT DO NOTHING;
INSERT INTO emotional_states (name, category, valence, arousal)
VALUES ('Interested', 'POSITIVE', 0.5, 0.6) ON CONFLICT DO NOTHING;
INSERT INTO emotional_states (name, category, valence, arousal)
VALUES ('Confident', 'POSITIVE', 0.8, 0.7) ON CONFLICT DO NOTHING;
INSERT INTO emotional_states (name, category, valence, arousal)
VALUES ('Flow', 'POSITIVE', 0.9, 0.8) ON CONFLICT DO NOTHING;
-- Tabla para registrar emociones detectadas o reportadas por sesión
CREATE TABLE IF NOT EXISTS session_emotions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES usuarios(id),
    session_id VARCHAR(50),
    -- Optional linkage to specific learning session/class
    activity_type VARCHAR(50),
    -- "Quiz", "Video", "Reading", "Interactive"
    emotion_id INTEGER REFERENCES emotional_states(id),
    confidence_score DECIMAL(3, 2) DEFAULT 1.0,
    -- If detected by AI, how confident? 1.0 if self-reported.
    source VARCHAR(20) DEFAULT 'SELF_REPORT' CHECK (
        source IN ('SELF_REPORT', 'AI_INFERENCE', 'TEACHER_REPORT')
    ),
    context_data JSONB,
    -- { "slide_id": 12, "time_spent": 300 }
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabla para snapshots de estado emocional "actual" acumulado (para dashboard en tiempo real)
CREATE TABLE IF NOT EXISTS current_emotional_context (
    student_id INTEGER PRIMARY KEY REFERENCES usuarios(id),
    current_mood VARCHAR(50),
    -- "Stressed", "Stable", "Motivated"
    last_check_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    momentum_score DECIMAL(5, 2) DEFAULT 0.0 -- Positive streak counter
);
CREATE INDEX IF NOT EXISTS idx_emotions_student ON session_emotions(student_id);
CREATE INDEX IF NOT EXISTS idx_emotions_time ON session_emotions(created_at);