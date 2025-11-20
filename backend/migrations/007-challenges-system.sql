-- ========================================
-- MIGRACIÓN: Sistema de Retos Dinámicos
-- BGE Héroes de la Patria
-- FASE 1 - Semana 5-6
-- ========================================

-- ========================================
-- TABLA: Definición de Retos
-- ========================================
CREATE TABLE IF NOT EXISTS challenges (
    id SERIAL PRIMARY KEY,

    -- Información básica
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    slug VARCHAR(100) UNIQUE,

    -- Categorización
    category VARCHAR(50) NOT NULL,           -- academic, social, creative, physical, daily
    subject VARCHAR(100),                     -- Materia específica (Matemáticas, Historia, etc)
    difficulty VARCHAR(20) NOT NULL DEFAULT 'medium',  -- easy, medium, hard, expert

    -- Tipo de reto
    challenge_type VARCHAR(50) NOT NULL,      -- quiz, assignment, participation, streak, collaborative
    frequency VARCHAR(20),                    -- daily, weekly, monthly, one-time, event

    -- Recompensas
    reward_coins INTEGER NOT NULL DEFAULT 10,
    reward_xp INTEGER NOT NULL DEFAULT 50,
    bonus_multiplier DECIMAL(3,2) DEFAULT 1.0,  -- Multiplicador para streaks

    -- Requisitos
    min_level INTEGER DEFAULT 1,
    required_items JSONB,                     -- Items necesarios para completar
    prerequisites INTEGER[],                  -- IDs de retos previos requeridos

    -- Configuración de completación
    completion_criteria JSONB NOT NULL,       -- Criterios específicos {type, target, etc}
    max_completions INTEGER,                  -- NULL = ilimitado
    is_repeatable BOOLEAN DEFAULT false,
    cooldown_hours INTEGER,                   -- Horas antes de poder repetir

    -- Límites temporales
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,

    -- Retos colaborativos
    is_collaborative BOOLEAN DEFAULT false,
    min_participants INTEGER DEFAULT 1,
    max_participants INTEGER,

    -- Metadatos
    icon VARCHAR(100) DEFAULT 'fa-trophy',
    color VARCHAR(20) DEFAULT '#f5a623',
    featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,

    -- Estado
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Progreso de Usuario en Retos
-- ========================================
CREATE TABLE IF NOT EXISTS challenge_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,

    -- Estado
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress',  -- in_progress, completed, claimed, expired

    -- Progreso
    current_progress INTEGER DEFAULT 0,
    target_progress INTEGER NOT NULL,
    progress_data JSONB,                      -- Datos específicos del progreso

    -- Completaciones
    completion_count INTEGER DEFAULT 0,
    first_completed_at TIMESTAMP WITH TIME ZONE,
    last_completed_at TIMESTAMP WITH TIME ZONE,
    claimed_at TIMESTAMP WITH TIME ZONE,

    -- Recompensas otorgadas
    coins_earned INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,

    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, challenge_id)
);

-- ========================================
-- TABLA: Streaks (Rachas) de Usuario
-- ========================================
CREATE TABLE IF NOT EXISTS user_streaks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Tipo de streak
    streak_type VARCHAR(50) NOT NULL,         -- daily_login, daily_challenge, weekly_goal

    -- Contadores
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,

    -- Última actividad
    last_activity_date DATE NOT NULL,
    streak_started_at TIMESTAMP WITH TIME ZONE,

    -- Bonificaciones
    bonus_coins_earned INTEGER DEFAULT 0,
    bonus_xp_earned INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, streak_type)
);

-- ========================================
-- TABLA: Retos Colaborativos - Participantes
-- ========================================
CREATE TABLE IF NOT EXISTS collaborative_challenge_participants (
    id SERIAL PRIMARY KEY,
    challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Rol
    role VARCHAR(20) DEFAULT 'participant',   -- leader, participant

    -- Contribución
    contribution_score INTEGER DEFAULT 0,
    contribution_data JSONB,

    -- Estado
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    UNIQUE(challenge_id, user_id)
);

-- ========================================
-- ÍNDICES DE PERFORMANCE
-- ========================================

-- Challenges
CREATE INDEX IF NOT EXISTS idx_challenges_category ON challenges(category);
CREATE INDEX IF NOT EXISTS idx_challenges_subject ON challenges(subject);
CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON challenges(difficulty);
CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges(challenge_type);
CREATE INDEX IF NOT EXISTS idx_challenges_frequency ON challenges(frequency);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_challenges_featured ON challenges(featured, is_active);

-- Challenge Progress
CREATE INDEX IF NOT EXISTS idx_progress_user ON challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_challenge ON challenge_progress(challenge_id);
CREATE INDEX IF NOT EXISTS idx_progress_status ON challenge_progress(status);
CREATE INDEX IF NOT EXISTS idx_progress_user_status ON challenge_progress(user_id, status);

-- Streaks
CREATE INDEX IF NOT EXISTS idx_streaks_user ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_type ON user_streaks(streak_type);
CREATE INDEX IF NOT EXISTS idx_streaks_activity ON user_streaks(last_activity_date DESC);

-- Collaborative
CREATE INDEX IF NOT EXISTS idx_collab_challenge ON collaborative_challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_collab_user ON collaborative_challenge_participants(user_id);

-- ========================================
-- DATOS INICIALES: Retos de Ejemplo
-- ========================================
INSERT INTO challenges (
    title, description, slug, category, subject, difficulty,
    challenge_type, frequency, reward_coins, reward_xp,
    completion_criteria, is_active
) VALUES
    -- Retos Diarios
    ('Quiz del Día', 'Completa el quiz diario de cualquier materia', 'daily-quiz',
     'academic', NULL, 'easy', 'quiz', 'daily', 10, 50,
     '{"type": "quiz_complete", "target": 1}', true),

    ('Inicio de Sesión Diario', 'Inicia sesión para mantener tu racha', 'daily-login',
     'daily', NULL, 'easy', 'streak', 'daily', 5, 25,
     '{"type": "login", "target": 1}', true),

    ('Lectura del Día', 'Lee al menos un artículo de la biblioteca digital', 'daily-reading',
     'academic', NULL, 'easy', 'assignment', 'daily', 8, 40,
     '{"type": "library_read", "target": 1}', true),

    -- Retos Semanales
    ('Maestro del Quiz', 'Completa 5 quizzes esta semana', 'weekly-quiz-master',
     'academic', NULL, 'medium', 'quiz', 'weekly', 50, 200,
     '{"type": "quiz_complete", "target": 5}', true),

    ('Participación en Foro', 'Responde a 3 preguntas en el foro', 'weekly-forum',
     'social', NULL, 'medium', 'participation', 'weekly', 30, 150,
     '{"type": "forum_reply", "target": 3}', true),

    ('Generador de Ideas', 'Usa la IA para generar 3 contenidos', 'weekly-ai-user',
     'creative', NULL, 'medium', 'assignment', 'weekly', 40, 180,
     '{"type": "ai_generation", "target": 3}', true),

    -- Retos por Materia
    ('Experto en Matemáticas', 'Completa 10 ejercicios de matemáticas', 'math-expert',
     'academic', 'Matemáticas', 'hard', 'assignment', 'one-time', 100, 500,
     '{"type": "subject_exercises", "subject": "math", "target": 10}', true),

    ('Historiador', 'Lee 5 artículos de historia', 'history-buff',
     'academic', 'Historia', 'medium', 'assignment', 'one-time', 60, 300,
     '{"type": "subject_reading", "subject": "history", "target": 5}', true),

    ('Científico Curioso', 'Completa 3 experimentos virtuales', 'science-curious',
     'academic', 'Ciencias', 'hard', 'assignment', 'one-time', 80, 400,
     '{"type": "virtual_lab", "target": 3}', true),

    -- Retos de Streak
    ('Racha de 7 Días', 'Mantén tu racha de login por 7 días consecutivos', 'streak-7-days',
     'daily', NULL, 'medium', 'streak', 'one-time', 75, 350,
     '{"type": "streak", "streak_type": "daily_login", "target": 7}', true),

    ('Racha de 30 Días', 'Mantén tu racha de login por 30 días consecutivos', 'streak-30-days',
     'daily', NULL, 'expert', 'streak', 'one-time', 300, 1500,
     '{"type": "streak", "streak_type": "daily_login", "target": 30}', true),

    -- Retos Colaborativos
    ('Proyecto en Equipo', 'Completa un proyecto con 3 compañeros', 'team-project',
     'social', NULL, 'hard', 'collaborative', 'monthly', 150, 750,
     '{"type": "collaborative_complete", "min_score": 80}', true),

    -- Retos Mensuales
    ('Estudiante del Mes', 'Acumula 500 XP este mes', 'student-of-month',
     'academic', NULL, 'hard', 'assignment', 'monthly', 200, 1000,
     '{"type": "xp_earned", "target": 500}', true),

    ('Coleccionista de Logros', 'Desbloquea 5 logros nuevos', 'achievement-collector',
     'daily', NULL, 'medium', 'assignment', 'monthly', 100, 500,
     '{"type": "achievements_unlocked", "target": 5}', true);

-- Actualizar el reto colaborativo
UPDATE challenges
SET is_collaborative = true, min_participants = 3, max_participants = 5
WHERE slug = 'team-project';

-- ========================================
-- COMENTARIOS
-- ========================================
COMMENT ON TABLE challenges IS 'Definición de retos educativos con recompensas';
COMMENT ON TABLE challenge_progress IS 'Progreso de usuarios en retos individuales';
COMMENT ON TABLE user_streaks IS 'Rachas de actividad de usuarios';
COMMENT ON TABLE collaborative_challenge_participants IS 'Participantes en retos colaborativos';

COMMENT ON COLUMN challenges.completion_criteria IS 'JSON con criterios: {type, target, subject, etc}';
COMMENT ON COLUMN challenges.bonus_multiplier IS 'Multiplicador de recompensa para streaks';
COMMENT ON COLUMN user_streaks.current_streak IS 'Días consecutivos actuales';

-- ========================================
-- FIN DE MIGRACIÓN
-- ========================================
