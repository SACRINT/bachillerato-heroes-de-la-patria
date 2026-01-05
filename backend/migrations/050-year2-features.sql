-- =====================================================
-- MIGRACIÓN: Year 2 Features (Semana 41)
-- Desarrollo de Features Año 2
-- Fecha: Enero 2026
-- Fase 6: Cierre, Análisis y Planificación Futura
-- =====================================================
-- Tabla de features del Año 2
CREATE TABLE IF NOT EXISTS year2_features (
    id SERIAL PRIMARY KEY,
    feature_id VARCHAR(100) UNIQUE NOT NULL,
    feature_name VARCHAR(200) NOT NULL,
    version VARCHAR(20),
    status VARCHAR(30) DEFAULT 'planned',
    target_release VARCHAR(20),
    overall_progress INTEGER DEFAULT 0,
    tech_stack JSONB,
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_y2f_status ON year2_features(status);
CREATE INDEX IF NOT EXISTS idx_y2f_release ON year2_features(target_release);
-- Tabla de componentes de features
CREATE TABLE IF NOT EXISTS feature_components (
    id SERIAL PRIMARY KEY,
    feature_id VARCHAR(100) NOT NULL,
    component_name VARCHAR(200) NOT NULL,
    status VARCHAR(30) DEFAULT 'planned',
    completion INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_fc_feature ON feature_components(feature_id);
-- Tabla de Mobile App builds
CREATE TABLE IF NOT EXISTS mobile_app_builds (
    id SERIAL PRIMARY KEY,
    build_number VARCHAR(50) NOT NULL,
    platform VARCHAR(20),
    -- iOS, Android
    status VARCHAR(30),
    test_coverage DECIMAL(5, 2),
    crash_free_rate DECIMAL(5, 2),
    active_testers INTEGER,
    feedback_items INTEGER,
    blockers INTEGER DEFAULT 0,
    built_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mab_platform ON mobile_app_builds(platform);
-- Tabla de gamificación
CREATE TABLE IF NOT EXISTS gamification_config (
    id SERIAL PRIMARY KEY,
    config_id VARCHAR(100) UNIQUE NOT NULL,
    xp_per_assignment INTEGER DEFAULT 50,
    xp_per_exam INTEGER DEFAULT 200,
    xp_per_attendance INTEGER DEFAULT 10,
    xp_per_participation INTEGER DEFAULT 25,
    level_up_threshold INTEGER DEFAULT 1000,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabla de achievements
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    achievement_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    xp_reward INTEGER DEFAULT 100,
    icon_url VARCHAR(500),
    rarity VARCHAR(20) DEFAULT 'common',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ach_category ON achievements(category);
-- Tabla de student achievements
CREATE TABLE IF NOT EXISTS student_achievements (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    achievement_id VARCHAR(100) NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, achievement_id)
);
CREATE INDEX IF NOT EXISTS idx_sa_student ON student_achievements(student_id);
-- Tabla de leaderboards
CREATE TABLE IF NOT EXISTS leaderboard_entries (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    leaderboard_type VARCHAR(50),
    -- weekly, monthly, all-time, class
    period VARCHAR(20),
    xp_total INTEGER DEFAULT 0,
    rank INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_le_type ON leaderboard_entries(leaderboard_type);
CREATE INDEX IF NOT EXISTS idx_le_student ON leaderboard_entries(student_id);
-- Tabla de payment providers
CREATE TABLE IF NOT EXISTS payment_providers (
    id SERIAL PRIMARY KEY,
    provider_name VARCHAR(100) NOT NULL,
    status VARCHAR(30) DEFAULT 'planned',
    regions TEXT [],
    integration_date DATE,
    config JSONB
);
-- Tabla de transacciones de pago
CREATE TABLE IF NOT EXISTS payment_transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    student_id INTEGER,
    parent_id INTEGER,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'MXN',
    provider VARCHAR(50),
    status VARCHAR(30) DEFAULT 'pending',
    payment_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pt_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pt_student ON payment_transactions(student_id);
-- Tabla de voice tutoring sessions
CREATE TABLE IF NOT EXISTS voice_tutoring_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    student_id INTEGER NOT NULL,
    voice_profile VARCHAR(50),
    subject VARCHAR(100),
    duration_seconds INTEGER,
    messages_count INTEGER,
    satisfaction_score DECIMAL(3, 2),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vts_student ON voice_tutoring_sessions(student_id);
-- Tabla de adaptive test sessions
CREATE TABLE IF NOT EXISTS adaptive_test_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    student_id INTEGER NOT NULL,
    subject VARCHAR(100),
    questions_asked INTEGER,
    correct_answers INTEGER,
    estimated_ability DECIMAL(4, 2),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ats_student ON adaptive_test_sessions(student_id);
-- Tabla de campus
CREATE TABLE IF NOT EXISTS campuses (
    id SERIAL PRIMARY KEY,
    campus_id VARCHAR(100) UNIQUE NOT NULL,
    campus_name VARCHAR(200) NOT NULL,
    location VARCHAR(500),
    timezone VARCHAR(50),
    branding JSONB,
    status VARCHAR(30) DEFAULT 'active',
    total_students INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_camp_status ON campuses(status);
-- Tabla de feature flags
CREATE TABLE IF NOT EXISTS year2_feature_flags (
    id SERIAL PRIMARY KEY,
    flag_name VARCHAR(100) UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT false,
    description TEXT,
    rollout_percentage INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Vista: Progreso de features
CREATE OR REPLACE VIEW v_year2_feature_progress AS
SELECT feature_name,
    status,
    overall_progress,
    target_release
FROM year2_features
ORDER BY target_release;
-- Vista: Top gamification
CREATE OR REPLACE VIEW v_gamification_leaderboard AS
SELECT student_id,
    SUM(xp_total) as total_xp,
    COUNT(DISTINCT leaderboard_type) as boards_count
FROM leaderboard_entries
GROUP BY student_id
ORDER BY total_xp DESC
LIMIT 100;
-- Insertar feature flags iniciales
INSERT INTO year2_feature_flags (flag_name, enabled, description)
VALUES (
        'mobile_app_mvp',
        false,
        'Mobile App MVP feature'
    ),
    (
        'advanced_gamification',
        true,
        'Advanced gamification features'
    ),
    (
        'payment_integration',
        true,
        'Payment processing'
    ),
    (
        'voice_tutoring',
        false,
        'Voice-based AI tutoring'
    ),
    (
        'adaptive_testing',
        true,
        'Adaptive testing engine'
    ),
    ('multi_campus', false, 'Multi-campus support') ON CONFLICT (flag_name) DO NOTHING;
-- Comentarios
COMMENT ON TABLE year2_features IS 'Features del Año 2';
COMMENT ON TABLE feature_components IS 'Componentes de features';
COMMENT ON TABLE mobile_app_builds IS 'Builds de la app móvil';
COMMENT ON TABLE gamification_config IS 'Configuración de gamificación';
COMMENT ON TABLE achievements IS 'Logros disponibles';
COMMENT ON TABLE student_achievements IS 'Logros desbloqueados por estudiantes';
COMMENT ON TABLE leaderboard_entries IS 'Entradas de leaderboard';
COMMENT ON TABLE payment_providers IS 'Proveedores de pago';
COMMENT ON TABLE payment_transactions IS 'Transacciones de pago';
COMMENT ON TABLE voice_tutoring_sessions IS 'Sesiones de tutoría por voz';
COMMENT ON TABLE adaptive_test_sessions IS 'Sesiones de tests adaptativos';
COMMENT ON TABLE campuses IS 'Campus registrados';
COMMENT ON TABLE year2_feature_flags IS 'Feature flags del Año 2';