-- ============================================
-- MIGRACIÓN: SISTEMA DE GAMIFICACIÓN EXTENDIDO
-- Fecha: 18 Diciembre 2025
-- Descripción: Tablas adicionales para leaderboards, streaks, badges
-- Plan Estratégico: Semana 3-4 Gamification Foundation
-- ============================================

-- ============================================
-- TABLA 1: user_streaks
-- Sistema de rachas de actividad
-- ============================================
CREATE TABLE IF NOT EXISTS user_streaks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    streak_type VARCHAR(30) NOT NULL DEFAULT 'daily_login'
        CHECK (streak_type IN ('daily_login', 'daily_task', 'weekly_challenge', 'study_session')),
    current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
    longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
    last_activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    streak_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_days_active INTEGER NOT NULL DEFAULT 0 CHECK (total_days_active >= 0),
    bonus_earned INTEGER NOT NULL DEFAULT 0 CHECK (bonus_earned >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, streak_type)
);

-- Índices para user_streaks
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_type ON user_streaks(streak_type);
CREATE INDEX IF NOT EXISTS idx_user_streaks_current ON user_streaks(current_streak DESC);

-- ============================================
-- TABLA 2: achievements (badges)
-- Definición de logros/insignias disponibles
-- ============================================
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(10) NOT NULL DEFAULT '🏆',
    rarity VARCHAR(20) NOT NULL DEFAULT 'common'
        CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    category VARCHAR(30) NOT NULL DEFAULT 'general'
        CHECK (category IN ('general', 'academic', 'social', 'streak', 'special', 'seasonal')),
    points INTEGER NOT NULL DEFAULT 100 CHECK (points >= 0),
    iacoins_reward INTEGER NOT NULL DEFAULT 0 CHECK (iacoins_reward >= 0),
    criteria JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para achievements
CREATE INDEX IF NOT EXISTS idx_achievements_code ON achievements(code);
CREATE INDEX IF NOT EXISTS idx_achievements_rarity ON achievements(rarity);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON achievements(is_active);

-- ============================================
-- TABLA 3: user_achievements
-- Logros obtenidos por usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress JSONB DEFAULT '{}',
    is_claimed BOOLEAN NOT NULL DEFAULT false,
    claimed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, achievement_id)
);

-- Índices para user_achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned ON user_achievements(earned_at DESC);

-- ============================================
-- TABLA 4: leaderboards
-- Definición de tableros de clasificación
-- ============================================
CREATE TABLE IF NOT EXISTS leaderboards (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    period VARCHAR(20) NOT NULL DEFAULT 'weekly'
        CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time', 'seasonal')),
    metric VARCHAR(30) NOT NULL DEFAULT 'iacoins'
        CHECK (metric IN ('iacoins', 'xp', 'tasks', 'streak', 'achievements', 'custom')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    reset_at TIMESTAMP WITH TIME ZONE,
    rewards JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA 5: leaderboard_entries
-- Entradas de usuarios en leaderboards
-- ============================================
CREATE TABLE IF NOT EXISTS leaderboard_entries (
    id SERIAL PRIMARY KEY,
    leaderboard_id INTEGER NOT NULL REFERENCES leaderboards(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0),
    rank INTEGER,
    period_start DATE NOT NULL DEFAULT CURRENT_DATE,
    period_end DATE,
    metadata JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(leaderboard_id, user_id, period_start)
);

-- Índices para leaderboard_entries
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_leaderboard_id ON leaderboard_entries(leaderboard_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_user_id ON leaderboard_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_score ON leaderboard_entries(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_rank ON leaderboard_entries(rank ASC);

-- ============================================
-- TABLA 6: daily_rewards
-- Sistema de recompensas diarias
-- ============================================
CREATE TABLE IF NOT EXISTS daily_rewards (
    id SERIAL PRIMARY KEY,
    day_number INTEGER NOT NULL UNIQUE CHECK (day_number >= 1 AND day_number <= 30),
    reward_type VARCHAR(20) NOT NULL DEFAULT 'iacoins'
        CHECK (reward_type IN ('iacoins', 'xp', 'item', 'badge', 'special')),
    reward_amount INTEGER NOT NULL DEFAULT 10 CHECK (reward_amount > 0),
    reward_item_id INTEGER REFERENCES store_items(id),
    bonus_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0 CHECK (bonus_multiplier >= 1.0),
    icon VARCHAR(10) NOT NULL DEFAULT '🎁',
    is_special BOOLEAN NOT NULL DEFAULT false,
    description TEXT
);

-- ============================================
-- TABLA 7: user_daily_rewards
-- Recompensas diarias reclamadas por usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS user_daily_rewards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    daily_reward_id INTEGER NOT NULL REFERENCES daily_rewards(id) ON DELETE CASCADE,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    claim_date DATE NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE(user_id, claim_date)
);

-- Índices para user_daily_rewards
CREATE INDEX IF NOT EXISTS idx_user_daily_rewards_user_id ON user_daily_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_rewards_date ON user_daily_rewards(claim_date DESC);

-- ============================================
-- DATOS INICIALES: Achievements
-- ============================================
INSERT INTO achievements (code, name, description, icon, rarity, category, points, iacoins_reward, criteria) VALUES
-- Logros de inicio
('first_login', 'Primer Paso', 'Inicia sesión por primera vez', '🚀', 'common', 'general', 50, 10, '{"action": "login", "count": 1}'),
('profile_complete', 'Perfil Completo', 'Completa tu perfil al 100%', '📝', 'common', 'general', 100, 20, '{"action": "profile_completion", "percentage": 100}'),

-- Logros académicos
('homework_5', 'Estudiante Dedicado', 'Completa 5 tareas', '📚', 'common', 'academic', 100, 25, '{"action": "task_complete", "count": 5}'),
('homework_25', 'Maestro de Tareas', 'Completa 25 tareas', '📖', 'uncommon', 'academic', 250, 50, '{"action": "task_complete", "count": 25}'),
('homework_100', 'Erudito', 'Completa 100 tareas', '🎓', 'rare', 'academic', 500, 100, '{"action": "task_complete", "count": 100}'),
('perfect_score', 'Perfección', 'Obtén 100 en un examen', '⭐', 'rare', 'academic', 300, 75, '{"action": "exam_score", "score": 100}'),
('honor_roll', 'Cuadro de Honor', 'Promedio superior a 90', '🏅', 'epic', 'academic', 1000, 200, '{"action": "average", "min": 90}'),

-- Logros sociales
('first_forum', 'Voz Nueva', 'Publica en el foro por primera vez', '💬', 'common', 'social', 50, 10, '{"action": "forum_post", "count": 1}'),
('helpful_5', 'Compañero Útil', 'Ayuda a 5 compañeros', '🤝', 'uncommon', 'social', 150, 30, '{"action": "help_peer", "count": 5}'),
('popular_post', 'Post Popular', 'Recibe 10 likes en un post', '❤️', 'uncommon', 'social', 200, 40, '{"action": "post_likes", "count": 10}'),

-- Logros de racha
('streak_7', 'Semana Perfecta', '7 días consecutivos activo', '🔥', 'uncommon', 'streak', 200, 50, '{"action": "streak", "days": 7}'),
('streak_30', 'Mes de Fuego', '30 días consecutivos activo', '🌟', 'rare', 'streak', 500, 150, '{"action": "streak", "days": 30}'),
('streak_100', 'Imparable', '100 días consecutivos activo', '💎', 'legendary', 'streak', 2000, 500, '{"action": "streak", "days": 100}'),

-- Logros especiales
('early_bird', 'Madrugador', 'Accede antes de las 7:00 AM', '🌅', 'common', 'special', 75, 15, '{"action": "login_time", "before": "07:00"}'),
('night_owl', 'Búho Nocturno', 'Accede después de las 10:00 PM', '🦉', 'common', 'special', 75, 15, '{"action": "login_time", "after": "22:00"}'),
('weekend_warrior', 'Guerrero de Fin de Semana', 'Estudia en fin de semana', '⚔️', 'uncommon', 'special', 100, 25, '{"action": "weekend_study", "count": 1}')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- DATOS INICIALES: Leaderboards
-- ============================================
INSERT INTO leaderboards (code, name, description, period, metric, rewards) VALUES
('weekly_iacoins', 'Top IACoins Semanal', 'Los estudiantes con más IACoins esta semana', 'weekly', 'iacoins',
 '[{"rank": 1, "reward": 500, "badge": "🥇"}, {"rank": 2, "reward": 300, "badge": "🥈"}, {"rank": 3, "reward": 150, "badge": "🥉"}]'),
('monthly_xp', 'Top XP Mensual', 'Los estudiantes con más XP este mes', 'monthly', 'xp',
 '[{"rank": 1, "reward": 1000, "badge": "🏆"}, {"rank": 2, "reward": 500, "badge": "🥈"}, {"rank": 3, "reward": 250, "badge": "🥉"}]'),
('all_time_achievements', 'Hall de la Fama', 'Los estudiantes con más logros de todos los tiempos', 'all_time', 'achievements',
 '[{"rank": 1, "reward": 2000, "badge": "👑"}]'),
('daily_streak', 'Racha del Día', 'Las mejores rachas activas', 'daily', 'streak',
 '[{"rank": 1, "reward": 100, "badge": "🔥"}]')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- DATOS INICIALES: Daily Rewards (30 días)
-- ============================================
INSERT INTO daily_rewards (day_number, reward_type, reward_amount, icon, is_special, description) VALUES
(1, 'iacoins', 10, '🎁', false, 'Día 1: Bienvenido'),
(2, 'iacoins', 15, '🎁', false, 'Día 2'),
(3, 'iacoins', 20, '🎁', false, 'Día 3'),
(4, 'iacoins', 25, '🎁', false, 'Día 4'),
(5, 'iacoins', 30, '🎁', false, 'Día 5'),
(6, 'iacoins', 35, '🎁', false, 'Día 6'),
(7, 'iacoins', 100, '⭐', true, 'Día 7: Bonus de semana'),
(8, 'iacoins', 15, '🎁', false, 'Día 8'),
(9, 'iacoins', 20, '🎁', false, 'Día 9'),
(10, 'iacoins', 50, '✨', true, 'Día 10: Bonus'),
(11, 'iacoins', 20, '🎁', false, 'Día 11'),
(12, 'iacoins', 25, '🎁', false, 'Día 12'),
(13, 'iacoins', 30, '🎁', false, 'Día 13'),
(14, 'iacoins', 150, '⭐', true, 'Día 14: Bonus de 2 semanas'),
(15, 'iacoins', 25, '🎁', false, 'Día 15: Mitad del mes'),
(16, 'iacoins', 30, '🎁', false, 'Día 16'),
(17, 'iacoins', 35, '🎁', false, 'Día 17'),
(18, 'iacoins', 40, '🎁', false, 'Día 18'),
(19, 'iacoins', 45, '🎁', false, 'Día 19'),
(20, 'iacoins', 75, '✨', true, 'Día 20: Bonus'),
(21, 'iacoins', 200, '⭐', true, 'Día 21: Bonus de 3 semanas'),
(22, 'iacoins', 40, '🎁', false, 'Día 22'),
(23, 'iacoins', 45, '🎁', false, 'Día 23'),
(24, 'iacoins', 50, '🎁', false, 'Día 24'),
(25, 'iacoins', 100, '✨', true, 'Día 25: Bonus especial'),
(26, 'iacoins', 50, '🎁', false, 'Día 26'),
(27, 'iacoins', 55, '🎁', false, 'Día 27'),
(28, 'iacoins', 250, '⭐', true, 'Día 28: Bonus de 4 semanas'),
(29, 'iacoins', 75, '🎁', false, 'Día 29'),
(30, 'iacoins', 500, '💎', true, 'Día 30: MEGA BONUS')
ON CONFLICT (day_number) DO NOTHING;

-- ============================================
-- VERIFICACIÓN
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Verificando tablas de gamificación extendida...';

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_streaks') THEN
        RAISE NOTICE '✅ Tabla user_streaks creada';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'achievements') THEN
        RAISE NOTICE '✅ Tabla achievements creada';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_achievements') THEN
        RAISE NOTICE '✅ Tabla user_achievements creada';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leaderboards') THEN
        RAISE NOTICE '✅ Tabla leaderboards creada';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leaderboard_entries') THEN
        RAISE NOTICE '✅ Tabla leaderboard_entries creada';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_rewards') THEN
        RAISE NOTICE '✅ Tabla daily_rewards creada';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_daily_rewards') THEN
        RAISE NOTICE '✅ Tabla user_daily_rewards creada';
    END IF;
END $$;

-- ============================================
-- RESUMEN
-- ============================================
-- 7 tablas nuevas creadas:
-- 1. user_streaks - Sistema de rachas
-- 2. achievements - Definición de logros
-- 3. user_achievements - Logros de usuarios
-- 4. leaderboards - Tableros de clasificación
-- 5. leaderboard_entries - Entradas en leaderboards
-- 6. daily_rewards - Recompensas diarias (definición)
-- 7. user_daily_rewards - Recompensas reclamadas
--
-- Datos iniciales incluidos:
-- - 16 achievements con diferentes raridades
-- - 4 leaderboards (semanal, mensual, histórico, diario)
-- - 30 días de recompensas diarias con bonuses
-- ============================================
