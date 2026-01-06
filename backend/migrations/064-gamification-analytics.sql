-- 064-gamification-analytics.sql
-- Sistema de Analíticas de Gamificación (Semana 8)
-- 1. Tabla de Snapshots de Engagement Diario
CREATE TABLE IF NOT EXISTS gamification_daily_stats (
    id SERIAL PRIMARY KEY,
    date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
    total_xp_gained BIGINT DEFAULT 0,
    total_coins_earned BIGINT DEFAULT 0,
    active_users_count INTEGER DEFAULT 0,
    achievements_unlocked_count INTEGER DEFAULT 0,
    tournaments_joined_count INTEGER DEFAULT 0,
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_recorded)
);
-- 2. View: Resumen por Nivel (para ver distribución de estudiantes)
CREATE OR REPLACE VIEW view_level_distribution AS
SELECT COALESCE(ulp.current_level, 1) as level,
    COUNT(u.id) as user_count
FROM usuarios u
    LEFT JOIN user_level_progress ulp ON u.id = ulp.user_id
WHERE u.role = 'estudiante' -- Removido check activo temporalmente por error sql
GROUP BY COALESCE(ulp.current_level, 1)
ORDER BY level ASC;
-- 3. View: Top Earners Semanal (para reportes docentes)
CREATE OR REPLACE VIEW view_weekly_top_earners AS
SELECT u.id,
    u.username,
    u.nombre,
    u.apellido_paterno,
    SUM(xt.amount) as xp_gained
FROM usuarios u
    JOIN xp_transactions xt ON u.id = xt.user_id
WHERE xt.created_at >= NOW() - INTERVAL '7 days'
GROUP BY u.id
ORDER BY xp_gained DESC
LIMIT 50;