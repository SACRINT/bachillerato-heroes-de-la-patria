-- Crear tabla: iacoins_balances
CREATE TABLE IF NOT EXISTS iacoins_balances (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES usuarios(uuid) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla: iacoins_transactions
CREATE TABLE IF NOT EXISTS iacoins_transactions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES usuarios(uuid) ON DELETE CASCADE,
    type VARCHAR(50) CHECK (type IN ('earn', 'spend', 'bonus')),
    amount INTEGER NOT NULL,
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla: iacoins_challenges
CREATE TABLE IF NOT EXISTS iacoins_challenges (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty VARCHAR(50) CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    reward_coins INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Crear tabla: iacoins_user_challenges
CREATE TABLE IF NOT EXISTS iacoins_user_challenges (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES usuarios(uuid) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL REFERENCES iacoins_challenges(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'available',
    completed_at TIMESTAMP,
    UNIQUE(user_id, challenge_id)
);

-- Crear tabla: iacoins_achievements
CREATE TABLE IF NOT EXISTS iacoins_achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    rarity VARCHAR(50) CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    reward_coins INTEGER
);

-- Crear tabla: iacoins_user_achievements
CREATE TABLE IF NOT EXISTS iacoins_user_achievements (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES usuarios(uuid) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES iacoins_achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- Crear tabla: iacoins_leaderboard
CREATE TABLE IF NOT EXISTS iacoins_leaderboard (
    id SERIAL PRIMARY KEY,
    rank INTEGER NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES usuarios(uuid) ON DELETE CASCADE,
    total_earned INTEGER NOT NULL,
    level INTEGER NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla: iacoins_ai_generations
CREATE TABLE IF NOT EXISTS iacoins_ai_generations (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES usuarios(uuid) ON DELETE CASCADE,
    ai_provider VARCHAR(50),
    prompt TEXT,
    response TEXT,
    coins_spent INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_iacoins_balances_user ON iacoins_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_iacoins_transactions_user ON iacoins_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_iacoins_challenges_active ON iacoins_challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_iacoins_user_challenges_user ON iacoins_user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_iacoins_user_achievements_user ON iacoins_user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_iacoins_leaderboard_rank ON iacoins_leaderboard(rank);
CREATE INDEX IF NOT EXISTS idx_iacoins_ai_generations_user ON iacoins_ai_generations(user_id);
