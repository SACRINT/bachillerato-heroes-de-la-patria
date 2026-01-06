-- 065-personality-profiling.sql
-- Sistema de Perfilado de Personalidad y Estilo de Aprendizaje (Semana 9)
-- 1. Tabla de Perfiles de Personalidad y Aprendizaje
CREATE TABLE IF NOT EXISTS student_personality_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    -- Modelo VAK (Visual, Auditivo, Kinestésico) - Puntuación 0-100
    visual_score INTEGER DEFAULT 0,
    auditory_score INTEGER DEFAULT 0,
    kinesthetic_score INTEGER DEFAULT 0,
    dominant_style VARCHAR(20),
    -- 'visual', 'auditory', 'kinesthetic', 'multimodal'
    -- Metadatos de Comportamiento (Calculados por IA o stats)
    peak_performance_hour INTEGER,
    -- Hora del día (0-23) donde mejor rinde
    attention_span_minutes INTEGER DEFAULT 15,
    -- Estimación de tiempo de atención
    -- Motivación y Preferencias
    motivation_type VARCHAR(50),
    -- 'intrinsic', 'extrinsic', 'social', 'achievement'
    frustration_threshold INTEGER DEFAULT 50,
    -- 0 (Bajo) a 100 (Alto) - Qué tan rápido se frustra
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 2. Tabla de Respuestas de Assessments (Para recalibrar)
CREATE TABLE IF NOT EXISTS personality_assessment_responses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    question_id VARCHAR(50) NOT NULL,
    answer_value INTEGER,
    -- Valor numérico o index de respuesta
    category VARCHAR(50),
    -- 'vak', 'motivation', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 3. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_personality_profile_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_update_personality_profile ON student_personality_profiles;
CREATE TRIGGER trg_update_personality_profile BEFORE
UPDATE ON student_personality_profiles FOR EACH ROW EXECUTE PROCEDURE update_personality_profile_timestamp();
-- 4. Seed Data (Opcional - Perfil Dummy para pruebas)
-- No insertamos nada por defecto, se generará con el Quiz.