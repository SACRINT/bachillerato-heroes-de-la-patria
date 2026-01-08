-- 📚 MIGRACIÓN 095: PRACTICE PROBLEMS ENGINE
-- Propósito: Motor de problemas infinitos y seguimiento de resolución (Fase 5 - Semana 35)
-- 1. Base de Problemas y Plantillas Generativas
CREATE TABLE IF NOT EXISTS problem_templates (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    topic VARCHAR(100) NOT NULL,
    difficulty_level INTEGER DEFAULT 1 CHECK (
        difficulty_level BETWEEN 1 AND 5
    ),
    statement_template TEXT NOT NULL,
    -- Uso de variables como {{var1}}, {{var2}}
    solution_logic_json JSONB NOT NULL,
    -- Lógica para calcular respuesta correcta JS/Math.js
    variable_ranges_json JSONB NOT NULL,
    -- Rangos para generar variables aleatorias
    hint_steps_json JSONB,
    -- Pistas progresivas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 2. Problemas Generados (Instancias concretas)
CREATE TABLE IF NOT EXISTS generated_problems (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES problem_templates(id),
    variables_json JSONB NOT NULL,
    -- Valores concretos usados
    statement_rendered TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    seed_value VARCHAR(50),
    -- Para regenerar el mismo problema
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 3. Intentos y Respuestas de Estudiantes
CREATE TABLE IF NOT EXISTS problem_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    problem_id INTEGER REFERENCES generated_problems(id),
    user_answer TEXT,
    is_correct BOOLEAN DEFAULT FALSE,
    time_spent_seconds INTEGER DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    attempt_number INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 4. Maestría por TEMA (Mastery Tracking)
CREATE TABLE IF NOT EXISTS topic_mastery (
    user_id INTEGER NOT NULL,
    topic VARCHAR(100) NOT NULL,
    mastery_score DECIMAL(5, 2) DEFAULT 0,
    -- 0 a 100
    problems_solved INTEGER DEFAULT 0,
    last_practiced_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, topic)
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_problem_templates_topic ON problem_templates(topic);
CREATE INDEX IF NOT EXISTS idx_problem_attempts_user ON problem_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_user ON topic_mastery(user_id);
-- Seed Data: Plantilla de Suma Básica
INSERT INTO problem_templates (
        title,
        topic,
        difficulty_level,
        statement_template,
        solution_logic_json,
        variable_ranges_json,
        hint_steps_json
    )
VALUES (
        'Suma de dos dígitos',
        'Matemáticas Básicas',
        1,
        'Calcula la suma de {{a}} + {{b}}',
        '{"formula": "a + b"}',
        '{"a": {"min": 10, "max": 99}, "b": {"min": 10, "max": 99}}',
        '[{"text": "Alinea los números verticalmente"}, {"text": "Suma primero las unidades y luego las decenas"}]'
    );