-- ============================================
-- BGE v8.0 - Educational Games Migration
-- Tablas para juegos educativos
-- Fecha: 07 Diciembre 2025
-- ============================================
-- Tabla para sesiones de juegos
CREATE TABLE IF NOT EXISTS game_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    game_type VARCHAR(50) NOT NULL,
    score INTEGER DEFAULT 0,
    coins_earned INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_type ON game_sessions(game_type);
CREATE INDEX IF NOT EXISTS idx_game_sessions_completed ON game_sessions(completed_at);
-- Tabla para wallet (si no existe)
CREATE TABLE IF NOT EXISTS wallet (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    balance INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    total_purchased INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wallet_user ON wallet(user_id);
-- Tabla para historial de wallet (si no existe)
CREATE TABLE IF NOT EXISTS wallet_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wallet_history_user ON wallet_history(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_history_type ON wallet_history(transaction_type);
-- Tabla para banco de preguntas personalizadas
CREATE TABLE IF NOT EXISTS trivia_questions (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_index INTEGER NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium',
    points INTEGER DEFAULT 10,
    created_by INTEGER,
    is_active BOOLEAN DEFAULT true,
    times_shown INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trivia_questions_category ON trivia_questions(category);
CREATE INDEX IF NOT EXISTS idx_trivia_questions_difficulty ON trivia_questions(difficulty);
-- Tabla para mapas conceptuales personalizados
CREATE TABLE IF NOT EXISTS concept_maps (
    id SERIAL PRIMARY KEY,
    topic VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) DEFAULT 'medium',
    points INTEGER DEFAULT 50,
    nodes JSONB NOT NULL,
    connections JSONB NOT NULL,
    extra_labels JSONB DEFAULT '[]',
    created_by INTEGER,
    is_active BOOLEAN DEFAULT true,
    times_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_concept_maps_topic ON concept_maps(topic);
-- Tabla para logros de juegos
CREATE TABLE IF NOT EXISTS game_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    achievement_type VARCHAR(50) NOT NULL,
    game_type VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    earned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, achievement_type)
);
CREATE INDEX IF NOT EXISTS idx_game_achievements_user ON game_achievements(user_id);
-- Tabla para rankings
CREATE TABLE IF NOT EXISTS game_leaderboard (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    game_type VARCHAR(50) NOT NULL,
    period VARCHAR(20) NOT NULL,
    total_score INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    rank INTEGER,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, game_type, period, period_start)
);
CREATE INDEX IF NOT EXISTS idx_game_leaderboard_period ON game_leaderboard(period, period_start);
CREATE INDEX IF NOT EXISTS idx_game_leaderboard_score ON game_leaderboard(total_score DESC);
-- ============================================
-- COMPLETION
-- ============================================
SELECT 'V8 Educational Games Migration - COMPLETED' AS status;