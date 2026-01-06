-- 058-streaks-system.sql
-- Sistema de Rachas (Streaks) para Engagement Revolution
-- Tabla principal de rachas por usuario
CREATE TABLE IF NOT EXISTS streaks (
    user_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    last_check_in_date DATE,
    streak_freeze_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Log de check-ins para validación y auditoría (y para saber si ya hizo check-in hoy)
CREATE TABLE IF NOT EXISTS streak_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, check_in_date)
);
-- Configuración de Hitos (Milestones)
CREATE TABLE IF NOT EXISTS streak_milestone_definitions (
    id SERIAL PRIMARY KEY,
    days_required INTEGER UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    badge_icon VARCHAR(255),
    reward_xp INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Hitos alcanzados por los usuarios
CREATE TABLE IF NOT EXISTS user_streak_milestones (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    milestone_id INTEGER REFERENCES streak_milestone_definitions(id) ON DELETE CASCADE,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, milestone_id)
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_streaks_current_streak ON streaks(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_streak_logs_user_date ON streak_logs(user_id, check_in_date);
-- Datos semilla: Hitos iniciales
INSERT INTO streak_milestone_definitions (days_required, name, description, reward_xp)
VALUES (
        3,
        'Calentando motores',
        '3 días seguidos. ¡Buen comienzo!',
        50
    ),
    (
        7,
        'Semana imparable',
        'Una semana completa de aprendizaje.',
        150
    ),
    (
        14,
        'Doble racha',
        'Dos semanas de constancia.',
        300
    ),
    (
        30,
        'Hábito de hierro',
        '30 días seguidos. Eres increíble.',
        1000
    ),
    (
        60,
        'Bimestre de oro',
        '60 días de dedicación.',
        2500
    ),
    (
        100,
        'Centenario',
        '100 días. Leyenda viviente.',
        5000
    ),
    (
        365,
        'Año solar',
        'Un año completo. Maestría absoluta.',
        20000
    ) ON CONFLICT (days_required) DO NOTHING;