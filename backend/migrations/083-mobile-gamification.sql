-- Tabla para Daily Spin (Ruleta diaria)
CREATE TABLE IF NOT EXISTS daily_spins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    spin_date DATE DEFAULT CURRENT_DATE,
    reward_type VARCHAR(50),
    -- 'xp', 'badge', 'powerup', 'streak_freeze'
    reward_value INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, spin_date) -- Solo 1 spin por día
);
-- Tabla para Mini-Games Scores
CREATE TABLE IF NOT EXISTS minigame_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    game_id VARCHAR(50) NOT NULL,
    -- 'math_rush', 'history_trivia', etc.
    score INTEGER NOT NULL,
    combo_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_spins_user ON daily_spins(user_id);