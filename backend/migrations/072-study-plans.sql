-- Migration: Personalized Study Plans
-- Description: Tables for tracking student study goals and generated plans.
-- Tabla de Metas de Estudio (Objetivos a largo/mediano plazo)
CREATE TABLE IF NOT EXISTS study_goals (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES usuarios(id),
    title VARCHAR(200) NOT NULL,
    -- "Mejorar promedio en Matemáticas", "Preparar examen parcial"
    target_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'ABANDONED')),
    priority VARCHAR(10) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    progress INTEGER DEFAULT 0,
    -- 0-100%
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabla de Planes de Estudio (Contenedor de actividades, usualmente semanal)
CREATE TABLE IF NOT EXISTS study_plans (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES usuarios(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'ARCHIVED')),
    ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Items del Plan (Actividades específicas agendadas)
CREATE TABLE IF NOT EXISTS plan_items (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    day_of_week INTEGER,
    -- 0 (Domingo) - 6 (Sábado) ó NULL si es fecha específica
    scheduled_date DATE,
    -- Opcional si se usa day_of_week relativo
    time_slot VARCHAR(20),
    -- "MORNING", "AFTERNOON", "EVENING" o "10:00"
    activity_type VARCHAR(50) NOT NULL,
    -- "REVIEW", "EXERCISE", "VIDEO", "READING"
    subject VARCHAR(100),
    -- "Matemáticas", "Historia"
    description TEXT,
    resource_link VARCHAR(255),
    -- Link a contenido interno o externo
    is_completed BOOLEAN DEFAULT FALSE,
    difficulty_level VARCHAR(20) DEFAULT 'MEDIUM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_goals_student ON study_goals(student_id);
CREATE INDEX IF NOT EXISTS idx_plans_student ON study_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_plan_items_plan ON plan_items(plan_id);