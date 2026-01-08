-- 📚 MIGRACIÓN 097: ASSESSMENT ENGINE IMPROVEMENTS
-- Propósito: Generación de exámenes aleatorios y rúbricas dinámicas (Fase 5 - Semana 37)
-- 1. Banco de Preguntas (Estáticas y Referencias a Generativas)
CREATE TABLE IF NOT EXISTS question_bank (
    id SERIAL PRIMARY KEY,
    topic VARCHAR(100) NOT NULL,
    difficulty_level INTEGER DEFAULT 1,
    question_type VARCHAR(50) NOT NULL,
    -- 'multiple_choice', 'open_text', 'generative_ref'
    content_json JSONB NOT NULL,
    -- { question: "...", options: [...] } o { template_id: 1 }
    correct_answer_json JSONB,
    -- { index: 0 } o { keywords: [...] }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 2. Blueprints de Examen (Plantillas de estructura)
-- Define cómo se construye un examen (ej. 3 Preguntas de Álgebra Fácil + 2 de Geometría Media)
CREATE TABLE IF NOT EXISTS exam_blueprints (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    structure_config_json JSONB NOT NULL,
    -- [ { "topic": "Algebra", "count": 5, "difficulty": 1 }, ... ]
    time_limit_minutes INTEGER DEFAULT 60,
    passing_score DECIMAL(5, 2) DEFAULT 60.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 3. Rúbricas de Evaluación (Para preguntas abiertas)
CREATE TABLE IF NOT EXISTS grading_rubrics (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    criteria_json JSONB NOT NULL,
    -- [ { "name": "Claridad", "weight": 0.4, "levels": [{ "score": 10, "desc": "Excelente" }, ... ] } ]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 4. Exámenes Generados (Instancia única para un estudiante)
CREATE TABLE IF NOT EXISTS generated_assessments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    blueprint_id INTEGER REFERENCES exam_blueprints(id),
    questions_seed_json JSONB NOT NULL,
    -- Lista de IDs de preguntas seleccionadas y semillas para generativas
    -- [ { "bank_id": 10, "type": "static" }, { "template_id": 5, "seed": "abc", "type": "generative" } ]
    status VARCHAR(50) DEFAULT 'assigned',
    -- 'assigned', 'in_progress', 'submitted', 'graded'
    started_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    final_score DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 5. Respuestas de Examen
CREATE TABLE IF NOT EXISTS assessment_answers (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES generated_assessments(id) ON DELETE CASCADE,
    question_index INTEGER NOT NULL,
    -- Orden en el examen
    answer_payload JSONB,
    -- Respuesta del estudiante
    score_obtained DECIMAL(5, 2),
    feedback TEXT,
    graded_by INTEGER,
    -- ID de docente o NULL si es auto
    graded_at TIMESTAMP WITH TIME ZONE
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_question_bank_topic ON question_bank(topic, difficulty_level);
CREATE INDEX IF NOT EXISTS idx_assessment_user ON generated_assessments(user_id);
-- Seed Data: Banco de Preguntas
INSERT INTO question_bank (
        topic,
        difficulty_level,
        question_type,
        content_json,
        correct_answer_json
    )
VALUES (
        'Historia Universal',
        1,
        'multiple_choice',
        '{"question": "¿En qué año comenzó la Segunda Guerra Mundial?", "options": ["1914", "1939", "1945", "1929"]}',
        '{"index": 1}'
    ),
    (
        'Física',
        2,
        'open_text',
        '{"question": "Explica la tercera ley de Newton con tus propias palabras."}',
        '{"keywords": ["acción", "reacción", "fuerza", "opuesta"]}'
    );
-- Seed Data: Blueprint
INSERT INTO exam_blueprints (title, description, structure_config_json)
VALUES (
        'Examen Parcial Historia y Física',
        'Evaluación combinada de medio término.',
        '[{"topic": "Historia Universal", "count": 1, "difficulty": 1}, {"topic": "Física", "count": 1, "difficulty": 2}]'
    );