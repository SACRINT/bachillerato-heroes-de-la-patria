-- 060-achievements-system.sql
-- Sistema de Logros (Semana 3)
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
-- 1. Tabla de Definición de Logros
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    -- Identificador único para uso en código (ej: 'FIRST_LOGIN', 'QUIZ_MASTER_I')
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    -- 'learning', 'social', 'exploration', 'streak'
    rarity VARCHAR(20) DEFAULT 'common',
    -- 'common', 'uncommon', 'rare', 'epic', 'legendary'
    icon_icon VARCHAR(50) DEFAULT 'fa-trophy',
    -- Clase de FontAwesome o URL
    xp_reward INTEGER DEFAULT 0,
    iacoins_reward INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    -- Logros secretos
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 2. Tabla de Progreso/Desbloqueo de Usuarios
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    -- Para logros incrementales (ej: 5/10)
    earned_at TIMESTAMP WITH TIME ZONE,
    -- NULL si está en progreso, FECHA si ya se ganó
    is_claimed BOOLEAN DEFAULT FALSE,
    -- Si el usuario ya reclamó la recompensa/vio la notificación
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned ON user_achievements(earned_at)
WHERE earned_at IS NOT NULL;
-- 3. Datos Semilla (Logros Iniciales)
INSERT INTO achievements (
        code,
        name,
        description,
        category,
        rarity,
        icon_icon,
        xp_reward,
        iacoins_reward,
        sort_order
    )
VALUES -- General / Onboarding
    (
        'FIRST_STEPS',
        'Primeros Pasos',
        'Inicia sesión por primera vez en la plataforma.',
        'general',
        'common',
        'fa-shoe-prints',
        50,
        10,
        10
    ),
    (
        'PROFILE_COMPLETED',
        'Identidad Revelada',
        'Completa tu perfil de usuario al 100%.',
        'general',
        'common',
        'fa-id-card',
        100,
        20,
        20
    ),
    -- Social
    (
        'COMMUNITY_VOICE',
        'Voz de la Comunidad',
        'Publica tu primer comentario en el foro.',
        'social',
        'common',
        'fa-comments',
        50,
        5,
        30
    ),
    -- Académico / Quizzes
    (
        'QUIZ_ROOKIE',
        'Novato del Saber',
        'Completa tu primer cuestionario con nota aprobatoria.',
        'learning',
        'common',
        'fa-book-open',
        100,
        15,
        40
    ),
    (
        'PERFECT_SCORE',
        'Perfeccionista',
        'Obtén 100% en un cuestionario.',
        'learning',
        'rare',
        'fa-star',
        200,
        50,
        50
    ),
    -- Engagement
    (
        'NIGHT_OWL',
        'Noctámbulo',
        'Inicia sesión después de las 10 PM.',
        'exploration',
        'uncommon',
        'fa-moon',
        50,
        10,
        60
    ),
    (
        'EARLY_BIRD',
        'Madrugador',
        'Inicia sesión antes de las 7 AM.',
        'exploration',
        'uncommon',
        'fa-sun',
        50,
        10,
        70
    ),
    -- Streaks (Integración)
    (
        'STREAK_7',
        'Imparable (7)',
        'Mantén una racha de 7 días.',
        'streak',
        'uncommon',
        'fa-fire',
        150,
        30,
        80
    ),
    (
        'STREAK_30',
        'Hábito Legendario (30)',
        'Mantén una racha de 30 días.',
        'streak',
        'epic',
        'fa-fire-alt',
        1000,
        200,
        90
    ) ON CONFLICT (code) DO NOTHING;