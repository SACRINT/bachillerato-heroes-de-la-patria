-- =====================================================
-- IACoins Database Tables
-- Sistema de Gamificación para BGE
-- =====================================================

-- Tabla: iacoins_balances (Saldo de IACoins por usuario)
CREATE TABLE IF NOT EXISTS iacoins_balances (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES usuarios(uuid) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0,
    total_earned INTEGER NOT NULL DEFAULT 0,
    total_spent INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    experience_points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: iacoins_transactions (Historial de transacciones)
CREATE TABLE IF NOT EXISTS iacoins_transactions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES usuarios(uuid) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('earn', 'spend', 'bonus', 'refund', 'admin_adjustment')),
    amount INTEGER NOT NULL,
    description VARCHAR(500),
    balance_before INTEGER,
    balance_after INTEGER,
    reference_type VARCHAR(50),
    reference_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_type (type)
);

-- Tabla: iacoins_challenges (Retos disponibles)
CREATE TABLE IF NOT EXISTS iacoins_challenges (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty VARCHAR(50) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    reward_coins INTEGER NOT NULL,
    category VARCHAR(100),
    instructions TEXT,
    validation_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_difficulty (difficulty),
    INDEX idx_active (is_active)
);

-- Tabla: iacoins_user_challenges (Progreso del usuario en retos)
CREATE TABLE IF NOT EXISTS iacoins_user_challenges (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES usuarios(uuid) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL REFERENCES iacoins_challenges(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_progress', 'completed', 'claimed', 'expired')),
    progress_percentage INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    claimed_at TIMESTAMP,
    UNIQUE(user_id, challenge_id),
    INDEX idx_user_status (user_id, status),
    INDEX idx_completed (completed_at)
);

-- Tabla: iacoins_achievements (Logros)
CREATE TABLE IF NOT EXISTS iacoins_achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    rarity VARCHAR(50) NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    reward_coins INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rarity (rarity)
);

-- Tabla: iacoins_user_achievements (Logros desbloqueados del usuario)
CREATE TABLE IF NOT EXISTS iacoins_user_achievements (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES usuarios(uuid) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES iacoins_achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id),
    INDEX idx_user_unlocked (user_id, unlocked_at)
);

-- Tabla: iacoins_leaderboard (Cache de leaderboard)
CREATE TABLE IF NOT EXISTS iacoins_leaderboard (
    id SERIAL PRIMARY KEY,
    rank INTEGER NOT NULL,
    user_id UUID NOT NULL REFERENCES usuarios(uuid) ON DELETE CASCADE,
    total_earned INTEGER NOT NULL,
    level INTEGER NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rank),
    INDEX idx_updated (updated_at)
);

-- Tabla: iacoins_ai_generations (Generaciones IA pagadas con IACoins)
CREATE TABLE IF NOT EXISTS iacoins_ai_generations (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES usuarios(uuid) ON DELETE CASCADE,
    ai_provider VARCHAR(50) NOT NULL CHECK (ai_provider IN ('openai', 'anthropic', 'google')),
    prompt TEXT NOT NULL,
    response TEXT,
    tokens_used INTEGER,
    coins_spent INTEGER NOT NULL,
    model VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_provider (user_id, ai_provider),
    INDEX idx_created (created_at)
);

-- Indices adicionales para performance
CREATE INDEX IF NOT EXISTS idx_iacoins_balances_user_id ON iacoins_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_iacoins_transactions_user_id ON iacoins_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_iacoins_user_challenges_user_id ON iacoins_user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_iacoins_user_achievements_user_id ON iacoins_user_achievements(user_id);
