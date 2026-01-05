-- =====================================================
-- MIGRACIÓN: Smart Gamification (Semana 26)
-- Gamificación Inteligente
-- Fecha: Enero 2026
-- =====================================================
-- Tabla de logros dinámicos
CREATE TABLE IF NOT EXISTS dynamic_achievements (
    id SERIAL PRIMARY KEY,
    achievement_id VARCHAR(100) UNIQUE NOT NULL,
    student_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    -- consistency, mastery, social, explorer
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rarity VARCHAR(30) DEFAULT 'common',
    -- common, rare, epic, legendary
    iacoins_reward INTEGER DEFAULT 10,
    xp_reward INTEGER DEFAULT 100,
    trigger_event VARCHAR(100),
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dynach_student ON dynamic_achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_dynach_type ON dynamic_achievements(type);
CREATE INDEX IF NOT EXISTS idx_dynach_rarity ON dynamic_achievements(rarity);
CREATE INDEX IF NOT EXISTS idx_dynach_date ON dynamic_achievements(unlocked_at);
-- Tabla de misiones personalizadas
CREATE TABLE IF NOT EXISTS personalized_missions (
    id SERIAL PRIMARY KEY,
    mission_id VARCHAR(100) UNIQUE NOT NULL,
    student_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    -- daily, weekly, improvement, social, challenge
    title VARCHAR(255) NOT NULL,
    description TEXT,
    objective JSONB NOT NULL,
    reward JSONB NOT NULL,
    difficulty VARCHAR(30) DEFAULT 'medium',
    progress DECIMAL(5, 2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'active',
    -- active, completed, expired
    expires_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mission_student ON personalized_missions(student_id);
CREATE INDEX IF NOT EXISTS idx_mission_status ON personalized_missions(status);
CREATE INDEX IF NOT EXISTS idx_mission_expires ON personalized_missions(expires_at);
-- Tabla de narrativa del estudiante
CREATE TABLE IF NOT EXISTS student_narrative (
    id SERIAL PRIMARY KEY,
    student_id INTEGER UNIQUE NOT NULL,
    current_chapter INTEGER DEFAULT 1,
    chapter_progress DECIMAL(5, 4) DEFAULT 0,
    character_state JSONB DEFAULT '{}',
    story_events JSONB DEFAULT '[]',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_narrative_student ON student_narrative(student_id);
-- Tabla de detecciones anti-cheat
CREATE TABLE IF NOT EXISTS cheat_detections (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    activity_id VARCHAR(100),
    patterns JSONB NOT NULL,
    overall_risk DECIMAL(4, 2),
    is_suspicious BOOLEAN DEFAULT false,
    action_taken VARCHAR(50),
    -- none, monitor, flag_for_review, restrict
    reviewed BOOLEAN DEFAULT false,
    reviewed_by VARCHAR(100),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cheat_student ON cheat_detections(student_id);
CREATE INDEX IF NOT EXISTS idx_cheat_suspicious ON cheat_detections(is_suspicious);
CREATE INDEX IF NOT EXISTS idx_cheat_date ON cheat_detections(detected_at);
-- Tabla de avatares evolutivos
CREATE TABLE IF NOT EXISTS avatar_state (
    id SERIAL PRIMARY KEY,
    student_id INTEGER UNIQUE NOT NULL,
    avatar_level INTEGER DEFAULT 1,
    stage VARCHAR(50) DEFAULT 'Novato',
    appearance VARCHAR(100) DEFAULT 'basic',
    accessories TEXT [] DEFAULT '{}',
    emotion VARCHAR(50) DEFAULT 'curious',
    customizations JSONB DEFAULT '{}',
    unlocked_items TEXT [] DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_avatar_student ON avatar_state(student_id);
CREATE INDEX IF NOT EXISTS idx_avatar_stage ON avatar_state(stage);
-- Tabla de feedback en tiempo real (logs)
CREATE TABLE IF NOT EXISTS realtime_feedback_log (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    feedback_type VARCHAR(50),
    rewards_given JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_feedback_student ON realtime_feedback_log(student_id);
CREATE INDEX IF NOT EXISTS idx_feedback_date ON realtime_feedback_log(created_at);
-- Tabla de historial de dificultad
CREATE TABLE IF NOT EXISTS difficulty_history (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    previous_difficulty VARCHAR(30),
    new_difficulty VARCHAR(30),
    change_reason VARCHAR(100),
    performance_stats JSONB,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_difficulty_student ON difficulty_history(student_id);
CREATE INDEX IF NOT EXISTS idx_difficulty_date ON difficulty_history(changed_at);
-- Tabla de sugerencias de equipo
CREATE TABLE IF NOT EXISTS team_suggestions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    suggested_teammates JSONB NOT NULL,
    activities TEXT [],
    potential_bonuses JSONB,
    accepted BOOLEAN DEFAULT false,
    suggested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_team_student ON team_suggestions(student_id);
-- Insertar tipos de logros
CREATE TABLE IF NOT EXISTS achievement_types (
    id SERIAL PRIMARY KEY,
    type_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    triggers TEXT [],
    rarities TEXT [] DEFAULT '{"common", "rare", "epic", "legendary"}',
    is_active BOOLEAN DEFAULT true
);
INSERT INTO achievement_types (type_code, name, triggers)
VALUES (
        'consistency',
        'Constancia',
        '{"login_streak", "daily_tasks", "weekly_goals"}'
    ),
    (
        'mastery',
        'Maestría',
        '{"subject_excellence", "quiz_perfect", "skill_unlock"}'
    ),
    (
        'social',
        'Social',
        '{"help_peer", "team_collaboration", "mentor_newbie"}'
    ),
    (
        'explorer',
        'Explorador',
        '{"try_new_feature", "complete_optional", "discover_secret"}'
    ) ON CONFLICT (type_code) DO NOTHING;
-- Vista: Top logros del mes
CREATE OR REPLACE VIEW v_top_achievements_monthly AS
SELECT student_id,
    COUNT(*) as total_achievements,
    COUNT(*) FILTER (
        WHERE rarity = 'legendary'
    ) as legendary,
    COUNT(*) FILTER (
        WHERE rarity = 'epic'
    ) as epic,
    SUM(iacoins_reward) as total_iacoins,
    SUM(xp_reward) as total_xp
FROM dynamic_achievements
WHERE unlocked_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY student_id
ORDER BY total_achievements DESC
LIMIT 100;
-- Vista: Misiones activas por tipo
CREATE OR REPLACE VIEW v_active_missions_by_type AS
SELECT type,
    COUNT(*) as total_active,
    COUNT(DISTINCT student_id) as unique_students,
    AVG(progress) as avg_progress
FROM personalized_missions
WHERE status = 'active'
GROUP BY type
ORDER BY total_active DESC;
-- Vista: Evolución de avatares
CREATE OR REPLACE VIEW v_avatar_evolution_stats AS
SELECT stage,
    COUNT(*) as students,
    AVG(avatar_level) as avg_level,
    array_agg(DISTINCT appearance) as appearances
FROM avatar_state
GROUP BY stage
ORDER BY CASE
        stage
        WHEN 'Novato' THEN 1
        WHEN 'Aprendiz' THEN 2
        WHEN 'Estudiante' THEN 3
        WHEN 'Maestro' THEN 4
        WHEN 'Sabio' THEN 5
        WHEN 'Leyenda' THEN 6
    END;
-- Comentarios
COMMENT ON TABLE dynamic_achievements IS 'Logros dinámicos generados por IA';
COMMENT ON TABLE personalized_missions IS 'Misiones personalizadas por estudiante';
COMMENT ON TABLE student_narrative IS 'Estado de la narrativa evolutiva';
COMMENT ON TABLE cheat_detections IS 'Detecciones de comportamiento sospechoso';
COMMENT ON TABLE avatar_state IS 'Estado de avatares evolutivos';
COMMENT ON TABLE realtime_feedback_log IS 'Log de feedback en tiempo real';
COMMENT ON TABLE difficulty_history IS 'Historial de ajustes de dificultad';
COMMENT ON TABLE team_suggestions IS 'Sugerencias de formación de equipos';
COMMENT ON TABLE achievement_types IS 'Tipos de logros configurados';