-- ================================================================
-- FASE 3: MIGRACIÓN SQL DE GAMIFICACIÓN E IACOINS REALES (ROBUSTO)
-- Bachillerato General Estatal "Héroes de la Patria"
-- Fecha: Agosto 2026
-- ================================================================
-- SEGURIDAD & COMPATIBILIDAD:
--   - Idempotente: seguro para ejecutar múltiples veces sin duplicar ni borrar datos
--   - Tolerante a tablas preexistentes: usa ALTER TABLE ... ADD COLUMN IF NOT EXISTS
--   - Compatible con versiones legacy (Diciembre 2025) y nuevas
-- ================================================================

-- ----------------------------------------------------------------
-- 0. EXTENSIONES
-- ----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================
-- BLOQUE 1: WALLET E IACOINS BALANCE
-- ================================================================

-- 1.1 iacoins_balance (tabla maestra de saldo, XP y nivel por usuario)
CREATE TABLE IF NOT EXISTS iacoins_balance (
    id              SERIAL PRIMARY KEY,
    user_id         UUID UNIQUE,
    balance         INTEGER NOT NULL DEFAULT 0,
    total_earned    INTEGER NOT NULL DEFAULT 0,
    total_spent     INTEGER NOT NULL DEFAULT 0,
    experience_points INTEGER NOT NULL DEFAULT 0,
    level           INTEGER NOT NULL DEFAULT 1,
    streak_days     INTEGER NOT NULL DEFAULT 0,
    last_streak_date DATE,
    is_vip          BOOLEAN DEFAULT FALSE,
    vip_expires_at  TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE iacoins_balance ADD COLUMN IF NOT EXISTS balance INTEGER NOT NULL DEFAULT 0;
ALTER TABLE iacoins_balance ADD COLUMN IF NOT EXISTS total_earned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE iacoins_balance ADD COLUMN IF NOT EXISTS total_spent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE iacoins_balance ADD COLUMN IF NOT EXISTS experience_points INTEGER NOT NULL DEFAULT 0;
ALTER TABLE iacoins_balance ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;
ALTER TABLE iacoins_balance ADD COLUMN IF NOT EXISTS streak_days INTEGER NOT NULL DEFAULT 0;
ALTER TABLE iacoins_balance ADD COLUMN IF NOT EXISTS last_streak_date DATE;
ALTER TABLE iacoins_balance ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;
ALTER TABLE iacoins_balance ADD COLUMN IF NOT EXISTS vip_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE iacoins_balance ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE iacoins_balance ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_iacoins_balance_user ON iacoins_balance(user_id);
CREATE INDEX IF NOT EXISTS idx_iacoins_balance_level ON iacoins_balance(level DESC);
CREATE INDEX IF NOT EXISTS idx_iacoins_balance_xp ON iacoins_balance(experience_points DESC);

-- 1.2 iacoins_balances (variante legacy)
CREATE TABLE IF NOT EXISTS iacoins_balances (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER UNIQUE,
    balance         INTEGER NOT NULL DEFAULT 0,
    total_earned    INTEGER NOT NULL DEFAULT 0,
    total_spent     INTEGER NOT NULL DEFAULT 0,
    level           INTEGER NOT NULL DEFAULT 1,
    experience_points INTEGER NOT NULL DEFAULT 0,
    streak_days     INTEGER NOT NULL DEFAULT 0,
    last_streak_date DATE,
    is_vip          BOOLEAN DEFAULT FALSE,
    vip_expires_at  TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE iacoins_balances ADD COLUMN IF NOT EXISTS balance INTEGER NOT NULL DEFAULT 0;
ALTER TABLE iacoins_balances ADD COLUMN IF NOT EXISTS total_earned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE iacoins_balances ADD COLUMN IF NOT EXISTS total_spent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE iacoins_balances ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;
ALTER TABLE iacoins_balances ADD COLUMN IF NOT EXISTS experience_points INTEGER NOT NULL DEFAULT 0;
ALTER TABLE iacoins_balances ADD COLUMN IF NOT EXISTS streak_days INTEGER NOT NULL DEFAULT 0;
ALTER TABLE iacoins_balances ADD COLUMN IF NOT EXISTS last_streak_date DATE;
ALTER TABLE iacoins_balances ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;
ALTER TABLE iacoins_balances ADD COLUMN IF NOT EXISTS vip_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE iacoins_balances ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE iacoins_balances ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_iacoins_balances_user ON iacoins_balances(user_id);

-- 1.3 iacoins_transactions (historial de transacciones)
CREATE TABLE IF NOT EXISTS iacoins_transactions (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER,
    amount          INTEGER NOT NULL DEFAULT 0,
    type            VARCHAR(50) DEFAULT 'earn',
    transaction_type VARCHAR(50),
    description     VARCHAR(500),
    balance_before  INTEGER,
    balance_after   INTEGER,
    reference_type  VARCHAR(50),
    reference_id    VARCHAR(100),
    metadata        JSONB DEFAULT '{}',
    status          VARCHAR(20) DEFAULT 'completed',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE iacoins_transactions ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE iacoins_transactions ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(50);
ALTER TABLE iacoins_transactions ADD COLUMN IF NOT EXISTS amount INTEGER;
ALTER TABLE iacoins_transactions ADD COLUMN IF NOT EXISTS description VARCHAR(500);
ALTER TABLE iacoins_transactions ADD COLUMN IF NOT EXISTS balance_before INTEGER;
ALTER TABLE iacoins_transactions ADD COLUMN IF NOT EXISTS balance_after INTEGER;
ALTER TABLE iacoins_transactions ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50);
ALTER TABLE iacoins_transactions ADD COLUMN IF NOT EXISTS reference_id VARCHAR(100);
ALTER TABLE iacoins_transactions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE iacoins_transactions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed';
ALTER TABLE iacoins_transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_iac_trans_user ON iacoins_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_iac_trans_user_date ON iacoins_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_iac_trans_type ON iacoins_transactions(type);
CREATE INDEX IF NOT EXISTS idx_iac_trans_status ON iacoins_transactions(status);

-- 1.4 wallet
CREATE TABLE IF NOT EXISTS wallet (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER UNIQUE,
    balance         INTEGER NOT NULL DEFAULT 0,
    total_earned    INTEGER NOT NULL DEFAULT 0,
    total_spent     INTEGER NOT NULL DEFAULT 0,
    total_purchased INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE wallet ADD COLUMN IF NOT EXISTS balance INTEGER NOT NULL DEFAULT 0;
ALTER TABLE wallet ADD COLUMN IF NOT EXISTS total_earned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE wallet ADD COLUMN IF NOT EXISTS total_spent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE wallet ADD COLUMN IF NOT EXISTS total_purchased INTEGER NOT NULL DEFAULT 0;
ALTER TABLE wallet ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE wallet ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_wallet_user ON wallet(user_id);

-- 1.5 wallet_history
CREATE TABLE IF NOT EXISTS wallet_history (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    amount          INTEGER NOT NULL,
    balance_after   INTEGER,
    description     VARCHAR(500),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE wallet_history ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(50);
ALTER TABLE wallet_history ADD COLUMN IF NOT EXISTS amount INTEGER;
ALTER TABLE wallet_history ADD COLUMN IF NOT EXISTS balance_after INTEGER;
ALTER TABLE wallet_history ADD COLUMN IF NOT EXISTS description VARCHAR(500);
ALTER TABLE wallet_history ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE wallet_history ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_wallet_hist_user ON wallet_history(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_hist_user_date ON wallet_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_hist_type ON wallet_history(transaction_type);

-- 1.6 iacoins_wallets
CREATE TABLE IF NOT EXISTS iacoins_wallets (
    user_id         INTEGER PRIMARY KEY,
    balance         INTEGER NOT NULL DEFAULT 0,
    total_earned    INTEGER NOT NULL DEFAULT 0,
    total_spent     INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE iacoins_wallets ADD COLUMN IF NOT EXISTS balance INTEGER NOT NULL DEFAULT 0;
ALTER TABLE iacoins_wallets ADD COLUMN IF NOT EXISTS total_earned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE iacoins_wallets ADD COLUMN IF NOT EXISTS total_spent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE iacoins_wallets ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE iacoins_wallets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_iac_wallets_user ON iacoins_wallets(user_id);

-- 1.7 iacoins_ai_generations
CREATE TABLE IF NOT EXISTS iacoins_ai_generations (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL,
    ai_provider     VARCHAR(50) NOT NULL DEFAULT 'google',
    model           VARCHAR(100) DEFAULT 'gemini-2.0-flash',
    prompt          TEXT,
    prompt_preview  TEXT,
    response        TEXT,
    response_preview TEXT,
    tokens_used     INTEGER,
    coins_spent     INTEGER NOT NULL DEFAULT 0,
    generation_type VARCHAR(50) DEFAULT 'text',
    is_demo         BOOLEAN DEFAULT FALSE,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE iacoins_ai_generations ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(50) DEFAULT 'google';
ALTER TABLE iacoins_ai_generations ADD COLUMN IF NOT EXISTS model VARCHAR(100) DEFAULT 'gemini-2.0-flash';
ALTER TABLE iacoins_ai_generations ADD COLUMN IF NOT EXISTS prompt TEXT;
ALTER TABLE iacoins_ai_generations ADD COLUMN IF NOT EXISTS prompt_preview TEXT;
ALTER TABLE iacoins_ai_generations ADD COLUMN IF NOT EXISTS response TEXT;
ALTER TABLE iacoins_ai_generations ADD COLUMN IF NOT EXISTS response_preview TEXT;
ALTER TABLE iacoins_ai_generations ADD COLUMN IF NOT EXISTS tokens_used INTEGER;
ALTER TABLE iacoins_ai_generations ADD COLUMN IF NOT EXISTS coins_spent INTEGER DEFAULT 0;
ALTER TABLE iacoins_ai_generations ADD COLUMN IF NOT EXISTS generation_type VARCHAR(50) DEFAULT 'text';
ALTER TABLE iacoins_ai_generations ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;
ALTER TABLE iacoins_ai_generations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE iacoins_ai_generations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_iac_ai_gen_user ON iacoins_ai_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_iac_ai_gen_date ON iacoins_ai_generations(created_at DESC);

-- ================================================================
-- BLOQUE 2: NIVELES Y PROGRESIÓN
-- ================================================================

-- 2.1 level_definitions
CREATE TABLE IF NOT EXISTS level_definitions (
    level           INTEGER PRIMARY KEY,
    title           VARCHAR(100) NOT NULL,
    subtitle        VARCHAR(200),
    icon            VARCHAR(10) DEFAULT '⭐',
    color           VARCHAR(20) DEFAULT '#6c757d',
    description     TEXT,
    xp_required     INTEGER NOT NULL,
    coins_reward    INTEGER DEFAULT 0,
    perks           JSONB DEFAULT '[]',
    badge_id        INTEGER,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE level_definitions ADD COLUMN IF NOT EXISTS title VARCHAR(100);
ALTER TABLE level_definitions ADD COLUMN IF NOT EXISTS subtitle VARCHAR(200);
ALTER TABLE level_definitions ADD COLUMN IF NOT EXISTS icon VARCHAR(10) DEFAULT '⭐';
ALTER TABLE level_definitions ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '#6c757d';
ALTER TABLE level_definitions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE level_definitions ADD COLUMN IF NOT EXISTS xp_required INTEGER;
ALTER TABLE level_definitions ADD COLUMN IF NOT EXISTS coins_reward INTEGER DEFAULT 0;
ALTER TABLE level_definitions ADD COLUMN IF NOT EXISTS perks JSONB DEFAULT '[]';
ALTER TABLE level_definitions ADD COLUMN IF NOT EXISTS badge_id INTEGER;
ALTER TABLE level_definitions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2.2 level_history
CREATE TABLE IF NOT EXISTS level_history (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL,
    level           INTEGER NOT NULL,
    previous_level  INTEGER NOT NULL DEFAULT 1,
    xp_at_levelup   INTEGER NOT NULL DEFAULT 0,
    coins_earned    INTEGER DEFAULT 0,
    unlocks_gained  INTEGER DEFAULT 0,
    achieved_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE level_history ADD COLUMN IF NOT EXISTS previous_level INTEGER DEFAULT 1;
ALTER TABLE level_history ADD COLUMN IF NOT EXISTS xp_at_levelup INTEGER DEFAULT 0;
ALTER TABLE level_history ADD COLUMN IF NOT EXISTS coins_earned INTEGER DEFAULT 0;
ALTER TABLE level_history ADD COLUMN IF NOT EXISTS unlocks_gained INTEGER DEFAULT 0;
ALTER TABLE level_history ADD COLUMN IF NOT EXISTS achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_level_hist_user ON level_history(user_id);

-- 2.3 level_unlocks
CREATE TABLE IF NOT EXISTS level_unlocks (
    id              SERIAL PRIMARY KEY,
    level           INTEGER NOT NULL,
    feature_slug    VARCHAR(100) NOT NULL,
    feature_name    VARCHAR(200),
    description     TEXT,
    icon            VARCHAR(10) DEFAULT '🔓',
    is_active       BOOLEAN DEFAULT TRUE,
    UNIQUE(level, feature_slug)
);

ALTER TABLE level_unlocks ADD COLUMN IF NOT EXISTS feature_name VARCHAR(200);
ALTER TABLE level_unlocks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE level_unlocks ADD COLUMN IF NOT EXISTS icon VARCHAR(10) DEFAULT '🔓';
ALTER TABLE level_unlocks ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2.4 user_levels
CREATE TABLE IF NOT EXISTS user_levels (
    user_id         INTEGER PRIMARY KEY,
    current_level   INTEGER NOT NULL DEFAULT 1,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_levels ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1;
ALTER TABLE user_levels ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_user_levels_user ON user_levels(user_id);

-- ================================================================
-- BLOQUE 3: BADGES/LOGROS
-- ================================================================

-- 3.1 badges
CREATE TABLE IF NOT EXISTS badges (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(200),
    slug            VARCHAR(100),
    description     TEXT,
    icon            VARCHAR(200),
    icon_emoji      VARCHAR(10) DEFAULT '🏆',
    rarity          VARCHAR(50) DEFAULT 'common',
    category        VARCHAR(100) DEFAULT 'general',
    requirement_type VARCHAR(100),
    requirement_value INTEGER DEFAULT 0,
    coins_reward    INTEGER DEFAULT 0,
    reward_iacoins  INTEGER DEFAULT 0,
    xp_reward       INTEGER DEFAULT 0,
    reward_xp       INTEGER DEFAULT 0,
    sort_order      INTEGER DEFAULT 0,
    order_index     INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    is_secret       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE badges ADD COLUMN IF NOT EXISTS name VARCHAR(200);
ALTER TABLE badges ADD COLUMN IF NOT EXISTS slug VARCHAR(100);
ALTER TABLE badges ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS icon VARCHAR(200);
ALTER TABLE badges ADD COLUMN IF NOT EXISTS icon_emoji VARCHAR(10) DEFAULT '🏆';
ALTER TABLE badges ADD COLUMN IF NOT EXISTS rarity VARCHAR(50) DEFAULT 'common';
ALTER TABLE badges ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'general';
ALTER TABLE badges ADD COLUMN IF NOT EXISTS requirement_type VARCHAR(100);
ALTER TABLE badges ADD COLUMN IF NOT EXISTS requirement_value INTEGER DEFAULT 0;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS coins_reward INTEGER DEFAULT 0;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS reward_iacoins INTEGER DEFAULT 0;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 0;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS reward_xp INTEGER DEFAULT 0;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS is_secret BOOLEAN DEFAULT FALSE;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Sincronizar nombres si tabla existía con columnas en español
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='badges' AND column_name='nombre') THEN
        ALTER TABLE badges ALTER COLUMN nombre DROP NOT NULL;
        UPDATE badges SET name = COALESCE(name, nombre) WHERE name IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='badges' AND column_name='descripcion') THEN
        UPDATE badges SET description = COALESCE(description, descripcion) WHERE description IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='badges' AND column_name='icono') THEN
        UPDATE badges SET icon = COALESCE(icon, icono) WHERE icon IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='badges' AND column_name='activo') THEN
        UPDATE badges SET is_active = COALESCE(is_active, activo) WHERE is_active IS NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_rarity ON badges(rarity);
CREATE INDEX IF NOT EXISTS idx_badges_active ON badges(is_active);
CREATE INDEX IF NOT EXISTS idx_badges_req_type ON badges(requirement_type);

-- 3.2 user_badges
CREATE TABLE IF NOT EXISTS user_badges (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL,
    badge_id        INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earn_details    JSONB DEFAULT '{}',
    is_featured     BOOLEAN DEFAULT FALSE,
    is_viewed       BOOLEAN DEFAULT FALSE,
    metadata        JSONB DEFAULT '{}',
    earned_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unlocked_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS earn_details JSONB DEFAULT '{}';
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS is_viewed BOOLEAN DEFAULT FALSE;
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);

-- ================================================================
-- BLOQUE 4: RACHAS
-- ================================================================

-- 4.1 user_streaks
CREATE TABLE IF NOT EXISTS user_streaks (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL,
    streak_type     VARCHAR(50) NOT NULL DEFAULT 'daily_login',
    current_streak  INTEGER NOT NULL DEFAULT 0,
    longest_streak  INTEGER NOT NULL DEFAULT 0,
    total_completions INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    streak_started_at DATE,
    streak_freeze_count INTEGER DEFAULT 0,
    shield_active   BOOLEAN DEFAULT FALSE,
    shield_used_at  TIMESTAMP WITH TIME ZONE,
    history         JSONB DEFAULT '[]',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS streak_type VARCHAR(50) DEFAULT 'daily_login';
ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS total_completions INTEGER DEFAULT 0;
ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS last_activity_date DATE;
ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS streak_started_at DATE;
ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS streak_freeze_count INTEGER DEFAULT 0;
ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS shield_active BOOLEAN DEFAULT FALSE;
ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS shield_used_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]';
ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Sincronizar max_streak si existía
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_streaks' AND column_name='max_streak') THEN
        UPDATE user_streaks SET longest_streak = COALESCE(longest_streak, max_streak, current_streak, 0);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_streaks' AND column_name='last_login') THEN
        ALTER TABLE user_streaks ALTER COLUMN last_login DROP NOT NULL;
        UPDATE user_streaks SET last_activity_date = COALESCE(last_activity_date, last_login::date);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_streaks_user ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_type ON user_streaks(streak_type);

-- ================================================================
-- BLOQUE 5: RETOS (CHALLENGES)
-- ================================================================

-- 5.1 challenges
CREATE TABLE IF NOT EXISTS challenges (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(255),
    description     TEXT,
    icon            VARCHAR(10) DEFAULT '🎯',
    category        VARCHAR(100) DEFAULT 'general',
    difficulty      VARCHAR(50) DEFAULT 'easy',
    frequency       VARCHAR(50) DEFAULT 'daily',
    challenge_type  VARCHAR(50) DEFAULT 'daily',
    subject         VARCHAR(100),
    target_count    INTEGER NOT NULL DEFAULT 1,
    target_metric   VARCHAR(100),
    target_value    INTEGER DEFAULT 1,
    reward_coins    INTEGER NOT NULL DEFAULT 10,
    reward_iacoins  INTEGER NOT NULL DEFAULT 10,
    reward_xp       INTEGER NOT NULL DEFAULT 20,
    reward_badge_id INTEGER,
    requirement_type VARCHAR(100),
    is_active       BOOLEAN DEFAULT TRUE,
    is_repeatable   BOOLEAN DEFAULT FALSE,
    repeat_interval VARCHAR(20),
    max_completions INTEGER DEFAULT 1,
    metadata        JSONB DEFAULT '{}',
    featured        BOOLEAN DEFAULT FALSE,
    sort_order      INTEGER DEFAULT 0,
    start_date      TIMESTAMP WITH TIME ZONE,
    end_date        TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE challenges ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS icon VARCHAR(10) DEFAULT '🎯';
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'general';
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS difficulty VARCHAR(50) DEFAULT 'easy';
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS frequency VARCHAR(50) DEFAULT 'daily';
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS challenge_type VARCHAR(50) DEFAULT 'daily';
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS subject VARCHAR(100);
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS target_count INTEGER DEFAULT 1;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS target_metric VARCHAR(100);
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS target_value INTEGER DEFAULT 1;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS reward_coins INTEGER DEFAULT 10;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS reward_iacoins INTEGER DEFAULT 10;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS reward_xp INTEGER DEFAULT 20;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS reward_badge_id INTEGER;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS requirement_type VARCHAR(100);
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS is_repeatable BOOLEAN DEFAULT FALSE;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS repeat_interval VARCHAR(20);
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS max_completions INTEGER DEFAULT 1;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Sincronizar columnas en español si existían
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='challenges' AND column_name='tipo') THEN
        ALTER TABLE challenges ALTER COLUMN tipo DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='challenges' AND column_name='titulo') THEN
        ALTER TABLE challenges ALTER COLUMN titulo DROP NOT NULL;
        UPDATE challenges SET title = COALESCE(title, titulo) WHERE title IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='challenges' AND column_name='descripcion') THEN
        UPDATE challenges SET description = COALESCE(description, descripcion) WHERE description IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='challenges' AND column_name='objetivo') THEN
        ALTER TABLE challenges ALTER COLUMN objetivo DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='challenges' AND column_name='metrica') THEN
        ALTER TABLE challenges ALTER COLUMN metrica DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='challenges' AND column_name='recompensa_coins') THEN
        UPDATE challenges SET reward_coins = COALESCE(reward_coins, recompensa_coins, 10);
        UPDATE challenges SET reward_iacoins = COALESCE(reward_iacoins, recompensa_coins, 10);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='challenges' AND column_name='recompensa_xp') THEN
        UPDATE challenges SET reward_xp = COALESCE(reward_xp, recompensa_xp, 20);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='challenges' AND column_name='activo') THEN
        UPDATE challenges SET is_active = COALESCE(is_active, activo) WHERE is_active IS NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_challenges_category ON challenges(category);
CREATE INDEX IF NOT EXISTS idx_challenges_freq ON challenges(frequency);
CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON challenges(difficulty);

-- 5.2 challenge_progress
CREATE TABLE IF NOT EXISTS challenge_progress (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL,
    challenge_id    INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    status          VARCHAR(50) NOT NULL DEFAULT 'available',
    progress        INTEGER DEFAULT 0,
    current_progress INTEGER DEFAULT 0,
    target_progress INTEGER DEFAULT 1,
    completion_count INTEGER DEFAULT 0,
    coins_earned    INTEGER DEFAULT 0,
    xp_earned       INTEGER DEFAULT 0,
    started_at      TIMESTAMP WITH TIME ZONE,
    first_completed_at TIMESTAMP WITH TIME ZONE,
    last_completed_at TIMESTAMP WITH TIME ZONE,
    reset_date      DATE,
    UNIQUE(user_id, challenge_id)
);

ALTER TABLE challenge_progress ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'available';
ALTER TABLE challenge_progress ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
ALTER TABLE challenge_progress ADD COLUMN IF NOT EXISTS current_progress INTEGER DEFAULT 0;
ALTER TABLE challenge_progress ADD COLUMN IF NOT EXISTS target_progress INTEGER DEFAULT 1;
ALTER TABLE challenge_progress ADD COLUMN IF NOT EXISTS completion_count INTEGER DEFAULT 0;
ALTER TABLE challenge_progress ADD COLUMN IF NOT EXISTS coins_earned INTEGER DEFAULT 0;
ALTER TABLE challenge_progress ADD COLUMN IF NOT EXISTS xp_earned INTEGER DEFAULT 0;
ALTER TABLE challenge_progress ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE challenge_progress ADD COLUMN IF NOT EXISTS first_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE challenge_progress ADD COLUMN IF NOT EXISTS last_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE challenge_progress ADD COLUMN IF NOT EXISTS reset_date DATE;

CREATE INDEX IF NOT EXISTS idx_chall_prog_user ON challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_chall_prog_status ON challenge_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_chall_prog_reset ON challenge_progress(reset_date);

-- 5.3 collaborative_challenge_participants
CREATE TABLE IF NOT EXISTS collaborative_challenge_participants (
    id              SERIAL PRIMARY KEY,
    challenge_id    INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL,
    role            VARCHAR(50) DEFAULT 'participant',
    joined_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(challenge_id, user_id)
);

ALTER TABLE collaborative_challenge_participants ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'participant';
ALTER TABLE collaborative_challenge_participants ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_collab_chall_challenge ON collaborative_challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_collab_chall_user ON collaborative_challenge_participants(user_id);

-- ================================================================
-- BLOQUE 6: LIGAS
-- ================================================================

-- 6.1 user_leagues
CREATE TABLE IF NOT EXISTS user_leagues (
    user_id         INTEGER PRIMARY KEY,
    league          VARCHAR(50) NOT NULL DEFAULT 'bronze',
    points          INTEGER NOT NULL DEFAULT 0,
    rank            INTEGER,
    season          VARCHAR(20) DEFAULT '2026-1',
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_leagues ADD COLUMN IF NOT EXISTS league VARCHAR(50) DEFAULT 'bronze';
ALTER TABLE user_leagues ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE user_leagues ADD COLUMN IF NOT EXISTS rank INTEGER;
ALTER TABLE user_leagues ADD COLUMN IF NOT EXISTS season VARCHAR(20) DEFAULT '2026-1';
ALTER TABLE user_leagues ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_user_leagues_league ON user_leagues(league);

-- ================================================================
-- BLOQUE 7: TRIVIA / DUELO DE SABIDURÍA
-- ================================================================

-- 7.1 trivia_sessions
CREATE TABLE IF NOT EXISTS trivia_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         INTEGER,
    opponent_id     INTEGER,
    category        VARCHAR(100) NOT NULL DEFAULT 'general',
    difficulty      VARCHAR(50) DEFAULT 'mixed',
    total_questions INTEGER NOT NULL DEFAULT 5,
    correct_answers INTEGER DEFAULT 0,
    wrong_answers   INTEGER DEFAULT 0,
    score           INTEGER DEFAULT 0,
    score_user      INTEGER DEFAULT 0,
    score_opponent  INTEGER DEFAULT 0,
    winner_id       INTEGER,
    coins_earned    INTEGER DEFAULT 0,
    xp_earned       INTEGER DEFAULT 0,
    reward_iacoins  INTEGER DEFAULT 0,
    reward_xp       INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    questions_data  JSONB DEFAULT '[]',
    answers_data    JSONB DEFAULT '[]',
    status          VARCHAR(50) DEFAULT 'in_progress',
    started_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at     TIMESTAMP WITH TIME ZONE,
    ended_at        TIMESTAMP WITH TIME ZONE
);

ALTER TABLE trivia_sessions ADD COLUMN IF NOT EXISTS opponent_id INTEGER;
ALTER TABLE trivia_sessions ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'general';
ALTER TABLE trivia_sessions ADD COLUMN IF NOT EXISTS difficulty VARCHAR(50) DEFAULT 'mixed';
ALTER TABLE trivia_sessions ADD COLUMN IF NOT EXISTS total_questions INTEGER DEFAULT 5;
ALTER TABLE trivia_sessions ADD COLUMN IF NOT EXISTS correct_answers INTEGER DEFAULT 0;
ALTER TABLE trivia_sessions ADD COLUMN IF NOT EXISTS wrong_answers INTEGER DEFAULT 0;
ALTER TABLE trivia_sessions ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE trivia_sessions ADD COLUMN IF NOT EXISTS score_user INTEGER DEFAULT 0;
ALTER TABLE trivia_sessions ADD COLUMN IF NOT EXISTS score_opponent INTEGER DEFAULT 0;
ALTER TABLE trivia_sessions ADD COLUMN IF NOT EXISTS winner_id INTEGER;
ALTER TABLE trivia_sessions ADD COLUMN IF NOT EXISTS coins_earned INTEGER DEFAULT 0;
ALTER TABLE trivia_sessions ADD COLUMN IF NOT EXISTS xp_earned INTEGER DEFAULT 0;
ALTER TABLE trivia_sessions ADD COLUMN IF NOT EXISTS reward_iacoins INTEGER DEFAULT 0;
ALTER TABLE trivia_sessions ADD COLUMN IF NOT EXISTS reward_xp INTEGER DEFAULT 0;
ALTER TABLE trivia_sessions ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0;
ALTER TABLE trivia_sessions ADD COLUMN IF NOT EXISTS questions_data JSONB DEFAULT '[]';
ALTER TABLE trivia_sessions ADD COLUMN IF NOT EXISTS answers_data JSONB DEFAULT '[]';
ALTER TABLE trivia_sessions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'in_progress';
ALTER TABLE trivia_sessions ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE trivia_sessions ADD COLUMN IF NOT EXISTS finished_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE trivia_sessions ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_trivia_sess_user ON trivia_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_trivia_sess_status ON trivia_sessions(status);
CREATE INDEX IF NOT EXISTS idx_trivia_sess_date ON trivia_sessions(started_at DESC);

-- ================================================================
-- BLOQUE 8: TORNEOS
-- ================================================================

-- 8.1 tournaments
CREATE TABLE IF NOT EXISTS tournaments (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255),
    title           VARCHAR(255),
    slug            VARCHAR(255),
    description     TEXT,
    tournament_type VARCHAR(100) DEFAULT 'trivia',
    format          VARCHAR(100) DEFAULT 'bracket',
    category        VARCHAR(100),
    subject         VARCHAR(100),
    topics          JSONB DEFAULT '[]',
    min_participants INTEGER DEFAULT 2,
    max_participants INTEGER DEFAULT 32,
    team_size       INTEGER DEFAULT 1,
    is_team_tournament BOOLEAN DEFAULT FALSE,
    status          VARCHAR(50) DEFAULT 'draft',
    registration_start TIMESTAMP WITH TIME ZONE,
    registration_end   TIMESTAMP WITH TIME ZONE,
    start_date      TIMESTAMP WITH TIME ZONE,
    end_date        TIMESTAMP WITH TIME ZONE,
    min_level       INTEGER DEFAULT 1,
    min_level_required INTEGER DEFAULT 1,
    entry_fee_coins INTEGER DEFAULT 0,
    entry_fee_iacoins INTEGER DEFAULT 0,
    prize_pool_coins INTEGER DEFAULT 0,
    prize_pool_iacoins INTEGER DEFAULT 0,
    prize_pool_xp   INTEGER DEFAULT 0,
    prizes          JSONB DEFAULT '[]',
    rules           TEXT,
    scoring_system  JSONB DEFAULT '{}',
    scoring_type    VARCHAR(50) DEFAULT 'xp_gained',
    settings        JSONB DEFAULT '{}',
    metadata        JSONB DEFAULT '{}',
    created_by      UUID,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS tournament_type VARCHAR(100) DEFAULT 'trivia';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS format VARCHAR(100) DEFAULT 'bracket';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS subject VARCHAR(100);
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS topics JSONB DEFAULT '[]';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS min_participants INTEGER DEFAULT 2;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT 32;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 1;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS is_team_tournament BOOLEAN DEFAULT FALSE;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS registration_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS registration_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS min_level INTEGER DEFAULT 1;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS min_level_required INTEGER DEFAULT 1;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS entry_fee_coins INTEGER DEFAULT 0;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS entry_fee_iacoins INTEGER DEFAULT 0;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS prize_pool_coins INTEGER DEFAULT 0;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS prize_pool_iacoins INTEGER DEFAULT 0;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS prize_pool_xp INTEGER DEFAULT 0;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS prizes JSONB DEFAULT '[]';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS rules TEXT;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS scoring_system JSONB DEFAULT '{}';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS scoring_type VARCHAR(50) DEFAULT 'xp_gained';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournaments' AND column_name='title') THEN
        ALTER TABLE tournaments ALTER COLUMN title DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournaments' AND column_name='name') THEN
        ALTER TABLE tournaments ALTER COLUMN name DROP NOT NULL;
    END IF;
END $$;

UPDATE tournaments SET name = COALESCE(name, title) WHERE name IS NULL;
UPDATE tournaments SET title = COALESCE(title, name) WHERE title IS NULL;

CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_subject ON tournaments(subject);
CREATE INDEX IF NOT EXISTS idx_tournaments_dates ON tournaments(start_date, end_date);

-- 8.2 tournament_participants
CREATE TABLE IF NOT EXISTS tournament_participants (
    id              SERIAL PRIMARY KEY,
    tournament_id   INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL,
    status          VARCHAR(50) DEFAULT 'registered',
    seed            INTEGER,
    matches_played  INTEGER DEFAULT 0,
    wins            INTEGER DEFAULT 0,
    losses          INTEGER DEFAULT 0,
    points          INTEGER DEFAULT 0,
    rank            INTEGER,
    final_rank      INTEGER,
    score           INTEGER DEFAULT 0,
    current_score   INTEGER DEFAULT 0,
    entry_paid      BOOLEAN DEFAULT FALSE,
    paid_at         TIMESTAMP WITH TIME ZONE,
    prize_won_coins INTEGER DEFAULT 0,
    prize_iacoins   INTEGER DEFAULT 0,
    prize_won_xp    INTEGER DEFAULT 0,
    badge_won_id    INTEGER REFERENCES badges(id),
    confirmed_at    TIMESTAMP WITH TIME ZONE,
    registered_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rank_at_closure INTEGER,
    reward_claimed  BOOLEAN DEFAULT FALSE
);

ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'registered';
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS seed INTEGER;
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS matches_played INTEGER DEFAULT 0;
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0;
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0;
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS rank INTEGER;
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS final_rank INTEGER;
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS current_score INTEGER DEFAULT 0;
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS entry_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS prize_won_coins INTEGER DEFAULT 0;
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS prize_iacoins INTEGER DEFAULT 0;
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS prize_won_xp INTEGER DEFAULT 0;
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS badge_won_id INTEGER;
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS rank_at_closure INTEGER;
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS reward_claimed BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_tourn_part_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tourn_part_user ON tournament_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_tourn_part_status ON tournament_participants(status);

-- 8.3 tournament_rounds
CREATE TABLE IF NOT EXISTS tournament_rounds (
    id              SERIAL PRIMARY KEY,
    tournament_id   INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number    INTEGER NOT NULL,
    name            VARCHAR(100),
    status          VARCHAR(50) DEFAULT 'pending',
    started_at      TIMESTAMP WITH TIME ZONE,
    ended_at        TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_tourn_rounds_tournament ON tournament_rounds(tournament_id);

-- 8.4 tournament_matches
CREATE TABLE IF NOT EXISTS tournament_matches (
    id              SERIAL PRIMARY KEY,
    tournament_id   INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round_id        INTEGER REFERENCES tournament_rounds(id),
    participant1_id INTEGER,
    participant2_id INTEGER,
    winner_participant_id INTEGER,
    score1          INTEGER DEFAULT 0,
    score2          INTEGER DEFAULT 0,
    match_number    INTEGER,
    status          VARCHAR(50) DEFAULT 'scheduled',
    started_at      TIMESTAMP WITH TIME ZONE,
    ended_at        TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tourn_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tourn_matches_status ON tournament_matches(status);

-- 8.5 tournament_leaderboards
CREATE TABLE IF NOT EXISTS tournament_leaderboards (
    id              SERIAL PRIMARY KEY,
    tournament_id   INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL,
    rank            INTEGER NOT NULL,
    points          INTEGER DEFAULT 0,
    wins            INTEGER DEFAULT 0,
    losses          INTEGER DEFAULT 0,
    score           NUMERIC(10,2) DEFAULT 0,
    matches_played  INTEGER DEFAULT 0,
    avg_score       NUMERIC(10,2) DEFAULT 0,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tourn_lb_tournament ON tournament_leaderboards(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tourn_lb_rank ON tournament_leaderboards(rank);

-- 8.6 tournament_history
CREATE TABLE IF NOT EXISTS tournament_history (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL,
    tournament_id   INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    final_rank      INTEGER,
    total_points    INTEGER DEFAULT 0,
    total_score     NUMERIC(10,2) DEFAULT 0,
    coins_won       INTEGER DEFAULT 0,
    xp_won          INTEGER DEFAULT 0,
    matches_played  INTEGER DEFAULT 0,
    wins            INTEGER DEFAULT 0,
    losses          INTEGER DEFAULT 0,
    recorded_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tourn_hist_user ON tournament_history(user_id);
CREATE INDEX IF NOT EXISTS idx_tourn_hist_tournament ON tournament_history(tournament_id);

-- 8.7 tournament_achievements
CREATE TABLE IF NOT EXISTS tournament_achievements (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    icon            VARCHAR(10) DEFAULT '🏆',
    category        VARCHAR(100) DEFAULT 'tournament',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8.8 user_tournament_achievements
CREATE TABLE IF NOT EXISTS user_tournament_achievements (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL,
    achievement_id  INTEGER NOT NULL REFERENCES tournament_achievements(id) ON DELETE CASCADE,
    tournament_id   INTEGER REFERENCES tournaments(id),
    earned_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_tourn_ach_user ON user_tournament_achievements(user_id);

-- ================================================================
-- BLOQUE 9: BOLSA DE TRABAJO
-- ================================================================

-- 9.1 bolsa_trabajo
CREATE TABLE IF NOT EXISTS bolsa_trabajo (
    id              SERIAL PRIMARY KEY,
    uuid            UUID DEFAULT uuid_generate_v4(),
    nombre          VARCHAR(255),
    nombre_completo VARCHAR(255),
    email           VARCHAR(255) NOT NULL,
    telefono        VARCHAR(50),
    generacion      VARCHAR(20),
    anio_egreso     INTEGER,
    area_interes    VARCHAR(255),
    experiencia     TEXT,
    resumen_profesional TEXT,
    habilidades     TEXT,
    status          VARCHAR(50) DEFAULT 'activo',
    estado          VARCHAR(50) DEFAULT 'nuevo',
    verificado      BOOLEAN DEFAULT FALSE,
    cv_url          VARCHAR(500),
    notas           TEXT,
    fecha_registro  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_creacion  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE bolsa_trabajo ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT uuid_generate_v4();
ALTER TABLE bolsa_trabajo ADD COLUMN IF NOT EXISTS nombre VARCHAR(255);
ALTER TABLE bolsa_trabajo ADD COLUMN IF NOT EXISTS nombre_completo VARCHAR(255);
ALTER TABLE bolsa_trabajo ADD COLUMN IF NOT EXISTS telefono VARCHAR(50);
ALTER TABLE bolsa_trabajo ADD COLUMN IF NOT EXISTS generacion VARCHAR(20);
ALTER TABLE bolsa_trabajo ADD COLUMN IF NOT EXISTS anio_egreso INTEGER;
ALTER TABLE bolsa_trabajo ADD COLUMN IF NOT EXISTS area_interes VARCHAR(255);
ALTER TABLE bolsa_trabajo ADD COLUMN IF NOT EXISTS experiencia TEXT;
ALTER TABLE bolsa_trabajo ADD COLUMN IF NOT EXISTS resumen_profesional TEXT;
ALTER TABLE bolsa_trabajo ADD COLUMN IF NOT EXISTS habilidades TEXT;
ALTER TABLE bolsa_trabajo ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'activo';
ALTER TABLE bolsa_trabajo ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'nuevo';
ALTER TABLE bolsa_trabajo ADD COLUMN IF NOT EXISTS verificado BOOLEAN DEFAULT FALSE;
ALTER TABLE bolsa_trabajo ADD COLUMN IF NOT EXISTS cv_url VARCHAR(500);
ALTER TABLE bolsa_trabajo ADD COLUMN IF NOT EXISTS notas TEXT;
ALTER TABLE bolsa_trabajo ADD COLUMN IF NOT EXISTS fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE bolsa_trabajo ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE bolsa_trabajo ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE bolsa_trabajo ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bolsa_trabajo' AND column_name='nombre_completo') THEN
        ALTER TABLE bolsa_trabajo ALTER COLUMN nombre_completo DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bolsa_trabajo' AND column_name='nombre') THEN
        ALTER TABLE bolsa_trabajo ALTER COLUMN nombre DROP NOT NULL;
    END IF;
END $$;

UPDATE bolsa_trabajo SET nombre = COALESCE(nombre, nombre_completo) WHERE nombre IS NULL;
UPDATE bolsa_trabajo SET nombre_completo = COALESCE(nombre_completo, nombre) WHERE nombre_completo IS NULL;

CREATE INDEX IF NOT EXISTS idx_bolsa_email ON bolsa_trabajo(email);
CREATE INDEX IF NOT EXISTS idx_bolsa_status ON bolsa_trabajo(status);
CREATE INDEX IF NOT EXISTS idx_bolsa_estado ON bolsa_trabajo(estado);
CREATE INDEX IF NOT EXISTS idx_bolsa_anio ON bolsa_trabajo(anio_egreso);

-- 9.2 bolsa_trabajo_pending_confirmation
CREATE TABLE IF NOT EXISTS bolsa_trabajo_pending_confirmation (
    id              SERIAL PRIMARY KEY,
    uuid            UUID DEFAULT uuid_generate_v4(),
    email_usuario   VARCHAR(255) NOT NULL,
    datos_json      JSONB NOT NULL DEFAULT '{}',
    confirmation_token VARCHAR(255),
    token_confirmacion VARCHAR(255),
    token_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    confirmed_at    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE bolsa_trabajo_pending_confirmation ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT uuid_generate_v4();
ALTER TABLE bolsa_trabajo_pending_confirmation ADD COLUMN IF NOT EXISTS email_usuario VARCHAR(255);
ALTER TABLE bolsa_trabajo_pending_confirmation ADD COLUMN IF NOT EXISTS datos_json JSONB DEFAULT '{}';
ALTER TABLE bolsa_trabajo_pending_confirmation ADD COLUMN IF NOT EXISTS confirmation_token VARCHAR(255);
ALTER TABLE bolsa_trabajo_pending_confirmation ADD COLUMN IF NOT EXISTS token_confirmacion VARCHAR(255);
ALTER TABLE bolsa_trabajo_pending_confirmation ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours');
ALTER TABLE bolsa_trabajo_pending_confirmation ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bolsa_trabajo_pending_confirmation ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE bolsa_trabajo_pending_confirmation ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

UPDATE bolsa_trabajo_pending_confirmation SET confirmation_token = COALESCE(confirmation_token, token_confirmacion) WHERE confirmation_token IS NULL;

CREATE INDEX IF NOT EXISTS idx_bolsa_pending_email ON bolsa_trabajo_pending_confirmation(email_usuario);

-- ================================================================
-- BLOQUE 10: GAME SESSIONS
-- ================================================================

CREATE TABLE IF NOT EXISTS game_sessions (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL,
    game_type       VARCHAR(100) NOT NULL DEFAULT 'trivia',
    category        VARCHAR(100),
    score           INTEGER DEFAULT 0,
    coins_earned    INTEGER DEFAULT 0,
    xp_earned       INTEGER DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    status          VARCHAR(50) DEFAULT 'completed',
    metadata        JSONB DEFAULT '{}',
    started_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS game_type VARCHAR(100) DEFAULT 'trivia';
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS coins_earned INTEGER DEFAULT 0;
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS xp_earned INTEGER DEFAULT 0;
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0;
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'completed';
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_game_sess_user ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sess_type ON game_sessions(game_type);
CREATE INDEX IF NOT EXISTS idx_game_sess_date ON game_sessions(created_at DESC);

-- ================================================================
-- BLOQUE 11: SEEDS — DATOS INICIALES IDEMPOTENTES
-- ================================================================

-- 11.1 100 Definiciones de Nivel
INSERT INTO level_definitions (level, title, subtitle, icon, color, xp_required, coins_reward) VALUES
(1,  'Aprendiz',       'Inicio del camino',        '🌱', '#6c757d',     0,    0),
(2,  'Explorador',     'Primeros pasos',            '🔍', '#6c757d',   100,   25),
(3,  'Estudiante',     'Aprendiendo con dedicación','📚', '#17a2b8',   250,   30),
(4,  'Investigador',   'Buscando respuestas',       '🔬', '#17a2b8',   450,   35),
(5,  'Pensador',       'Mente analítica',           '🧠', '#17a2b8',   700,   40),
(6,  'Descubridor',    'Hallando nuevos caminos',   '🗺️', '#28a745',  1000,   50),
(7,  'Conocedor',      'Amplio saber',              '📖', '#28a745',  1350,   55),
(8,  'Sabio Joven',    'Sabiduría en desarrollo',   '🌟', '#28a745',  1750,   60),
(9,  'Analista',       'Domina el análisis',        '📊', '#28a745',  2200,   65),
(10, 'Mente Brillante','Inteligencia destacada',    '💡', '#ffc107',  2700,   75),
(11, 'Experto Jr',     'Conocimiento avanzado',     '⭐', '#ffc107',  3250,   80),
(12, 'Estratega',      'Piensa antes de actuar',    '♟️', '#ffc107',  3850,   85),
(13, 'Innovador',      'Ideas frescas',             '💫', '#ffc107',  4500,   90),
(14, 'Visionario',     'Ve más allá',               '👁️', '#ffc107',  5200,   95),
(15, 'Maestro Jr',     'Domina su área',            '🎓', '#fd7e14', 5950,  100),
(16, 'Instructor',     'Comparte el saber',         '🏫', '#fd7e14',  6750,  105),
(17, 'Mentor',         'Guía a otros',              '🤝', '#fd7e14',  7600,  110),
(18, 'Arquitecto',     'Construye conocimiento',    '🏛️', '#fd7e14',  8500,  115),
(19, 'Líder Académico','Referente en su grupo',     '🏅', '#fd7e14',  9450,  120),
(20, 'Maestro',        'Nivel de maestría pleno',   '🎯', '#dc3545', 10450,  150),
(21, 'Gran Maestro Jr','Sabiduría reconocida',      '🔱', '#dc3545', 11500,  155),
(22, 'Académico',      'Vida dedicada al saber',    '📜', '#dc3545', 12600,  160),
(23, 'Filósofo',       'Reflexión profunda',        '🦉', '#dc3545', 13750,  165),
(24, 'Científico',     'El método como camino',     '⚗️', '#dc3545', 14950,  170),
(25, 'Gran Sabio',     'Un cuarto del camino',      '🌠', '#6f42c1', 16200,  200),
(26, 'Iluminado',      'La luz del conocimiento',   '✨', '#6f42c1', 17500,  205),
(27, 'Erudito',        'Saber enciclopédico',       '📕', '#6f42c1', 18850,  210),
(28, 'Pedagogo',       'Arte de enseñar',           '🎨', '#6f42c1', 20250,  215),
(29, 'Docto',          'Profundo conocedor',        '🏆', '#6f42c1', 21700,  220),
(30, 'Gran Maestro',   'Un tercio del camino',      '👑', '#6f42c1', 23200,  250),
(31, 'Supremo Jr',     'Excelencia en ascenso',     '🦅', '#e83e8c', 24750,  255),
(32, 'Orador',         'Domina la palabra',         '🎤', '#e83e8c', 26350,  260),
(33, 'Dialéctico',     'Maestro del debate',        '⚡', '#e83e8c', 28000,  265),
(34, 'Enciclopedista', 'Conoce de todo',            '📚', '#e83e8c', 29700,  270),
(35, 'Luminar',        'Luz del conocimiento',      '💎', '#e83e8c', 31450,  275),
(36, 'Pensador Global','Horizonte amplio',          '🌍', '#20c997', 33250,  280),
(37, 'Innovador Sr',   'Transforma el aprendizaje', '🚀', '#20c997', 35100,  285),
(38, 'Experto',        'Dominio pleno',             '🔑', '#20c997', 37000,  290),
(39, 'Magistral',      'De calidad magistral',      '⚜️', '#20c997', 38950,  295),
(40, 'Supremo',        'Dos quintos del camino',    '🌟', '#20c997', 40950,  350),
(41, 'Corifeo',        'Líder del coro del saber',  '🎭', '#0dcaf0', 43000,  355),
(42, 'Virtuoso',       'Virtuosismo intelectual',   '🎻', '#0dcaf0', 45100,  360),
(43, 'Prolífico',      'Producción abundante',      '📝', '#0dcaf0', 47250,  365),
(44, 'Prolífico Sr',   'Saber sin límites',         '📖', '#0dcaf0', 49450,  370),
(45, 'Semidios del Saber','Casi divino',            '⚡', '#0dcaf0', 51700,  375),
(46, 'Leyenda Jr',     'Historia en ciernes',       '🏺', '#fd7e14', 54000,  380),
(47, 'Paradigma',      'Modelo a seguir',           '🎯', '#fd7e14', 56350,  385),
(48, 'Luminaria',      'Brilla con luz propia',     '💫', '#fd7e14', 58750,  390),
(49, 'Prócer',         'Prócer del conocimiento',   '🦁', '#fd7e14', 61200,  395),
(50, 'Semidiós',       'Mitad del camino total',    '🌈', '#fd7e14', 63700,  500),
(51, 'Mítico Jr',      'Lo mítico se acerca',       '🦄', '#6f42c1', 66250,  505),
(52, 'Épico',          'Hazañas épicas',            '⚔️', '#6f42c1', 68850,  510),
(53, 'Épico Sr',       'El épico supremo',          '🛡️', '#6f42c1', 71500,  515),
(54, 'Legendario Jr',  'Leyenda emergente',         '🔮', '#6f42c1', 74200,  520),
(55, 'Legendario',     'Ya es leyenda',             '📿', '#6f42c1', 76950,  525),
(56, 'Celestial Jr',   'Toca el cielo',             '🌙', '#dc3545', 79750,  530),
(57, 'Astral',         'Entre las estrellas',       '🌠', '#dc3545', 82600,  535),
(58, 'Cósmico Jr',     'Alcanza el cosmos',         '🪐', '#dc3545', 85500,  540),
(59, 'Dimensional',    'Más allá del espacio',      '🌀', '#dc3545', 88450,  545),
(60, 'Transcendente',  'Tres quintos del camino',   '✴️', '#dc3545', 91450,  600),
(61, 'Divino Jr',      'Divinidad ascendente',      '🕊️', '#ffc107', 94500,  605),
(62, 'Celestial',      'Ser celestial',             '⭐', '#ffc107', 97600,  610),
(63, 'Omnisciente Jr', 'Casi todo lo sabe',         '👁️', '#ffc107',100750,  615),
(64, 'Omnipotente Jr', 'Poder del saber',           '⚡', '#ffc107',103950,  620),
(65, 'Supremo Celestial','La cima celeste',         '🌅', '#ffc107',107200,  625),
(66, 'Eterno Jr',      'La eternidad comienza',     '♾️', '#28a745',110500,  630),
(67, 'Inmortal Jr',    'Inmortalidad intelectual',  '🧬', '#28a745',113850,  635),
(68, 'Absoluto Jr',    'El conocimiento absoluto',  '🔯', '#28a745',117250,  640),
(69, 'Universal Jr',   'Saber universal',           '🌐', '#28a745',120700,  645),
(70, 'Omnisapiente',   'Siete décimos del camino',  '🧿', '#28a745',124200,  700),
(71, 'Eterno',         'Sin fin el saber',          '∞',  '#17a2b8',127750,  705),
(72, 'Inmortal',       'Permanece para siempre',    '💠', '#17a2b8',131350,  710),
(73, 'Absoluto',       'Lo absoluto del saber',     '🔵', '#17a2b8',135000,  715),
(74, 'Universal',      'El saber es universal',     '🌏', '#17a2b8',138700,  720),
(75, 'Maestro del Cosmos','El cosmos es su aula',   '🪐', '#17a2b8',142450,  750),
(76, 'Sabio Eterno',   'Eternamente sabio',         '🦋', '#e83e8c',146250,  755),
(77, 'Luz Primordial', 'La primera luz del saber',  '☀️', '#e83e8c',150100,  760),
(78, 'Oráculo',        'Conoce el futuro del saber','🔮', '#e83e8c',154000,  765),
(79, 'Profeta',        'Profeta del aprendizaje',   '📯', '#e83e8c',157950,  770),
(80, 'Arconte',        'Cuatro quintos del camino', '🏛️', '#e83e8c',161950,  800),
(81, 'Archimago',      'El más poderoso mago del saber','🪄','#6f42c1',166000, 805),
(82, 'Gran Archimago', 'Más allá del archimago',    '🌟', '#6f42c1',170100,  810),
(83, 'Demiurgo Jr',    'Creador de conocimiento',   '🛠️', '#6f42c1',174250,  815),
(84, 'Demiurgo',       'Forja el saber',            '⚒️', '#6f42c1',178450,  820),
(85, 'Demiurgo Supremo','El forjador supremo',      '🔥', '#6f42c1',182700,  825),
(86, 'Avatar del Saber','La encarnación del saber', '🧘', '#fd7e14',187000,  830),
(87, 'Señor del Conocimiento','Señor absoluto',     '👑', '#fd7e14',191350,  835),
(88, 'Archón Supremo', 'Gobernador del saber',      '🏆', '#fd7e14',195750,  840),
(89, 'Primordial',     'El principio de todo',      '🌀', '#fd7e14',200200,  845),
(90, 'Precursor Divino','Precede a la divinidad',   '🌠', '#fd7e14',204700,  900),
(91, 'Divino',         'Tocado por lo divino',      '✨', '#dc3545',209250,  905),
(92, 'Supremo Divino', 'Lo divino en su máxima expresión','💥','#dc3545',213850, 910),
(93, 'Trascendental',  'Más allá del tiempo',       '⚡', '#dc3545',218500,  915),
(94, 'Omnipotente',    'Poder total del saber',     '🌈', '#dc3545',223200,  920),
(95, 'Omnisciente',    'Lo sabe todo',              '👁️', '#dc3545',227950,  925),
(96, 'Eterno Absoluto','La eternidad del saber',    '♾️', '#20c997',232750,  930),
(97, 'Alfa y Omega',   'El principio y el fin',     '🔯', '#20c997',237600,  935),
(98, 'El Iluminado',   'Iluminación total',         '💎', '#20c997',242500,  940),
(99, 'El Supremo',     'Casi en la cima',           '🌟', '#20c997',247450,  945),
(100,'Leyenda Viviente','La máxima expresión',      '🏅', '#20c997',252450, 1000)
ON CONFLICT (level) DO UPDATE SET
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    xp_required = EXCLUDED.xp_required,
    coins_reward = EXCLUDED.coins_reward;

-- 11.2 Retos iniciales (10 retos de ejemplo)
INSERT INTO challenges (title, description, icon, category, difficulty, frequency, target_count, reward_coins, reward_iacoins, reward_xp, requirement_type, is_active, featured) VALUES
('¡Primera Victoria!',      'Completa tu primer Duelo de Sabiduría',        '⚔️', 'duel',     'easy',   'unique',  1,  30, 30, 50,  'duel_complete',    TRUE, TRUE),
('Racha de 3 días',          'Inicia sesión 3 días consecutivos',            '🔥', 'streak',   'easy',   'unique',  3,  25, 25, 40,  'login_streak',     TRUE, FALSE),
('Duelo Diario',             'Completa 1 Duelo de Sabiduría hoy',           '🎯', 'duel',     'easy',   'daily',   1,  15, 15, 25,  'duel_complete',    TRUE, TRUE),
('Campeón Semanal',          'Gana 5 duelos esta semana',                   '🏆', 'duel',     'medium', 'weekly',  5,  60, 60, 100, 'duel_win',         TRUE, FALSE),
('Primera Generación IA',    'Usa la IA por primera vez',                   '🤖', 'ia',       'easy',   'unique',  1,  20, 20, 30,  'ai_use',           TRUE, FALSE),
('Estudiante Aplicado',      'Completa 3 retos en un día',                  '📚', 'general',  'medium', 'daily',   3,  40, 40, 60,  'challenges_daily', TRUE, FALSE),
('Racha Semanal',            'Mantén una racha de 7 días',                  '🌟', 'streak',   'medium', 'unique',  7,  75, 75, 120, 'login_streak',     TRUE, FALSE),
('Maestro del Trivia',       'Responde 20 preguntas correctamente',         '🧠', 'trivia',   'hard',   'weekly',  20, 80, 80, 150, 'trivia_correct',   TRUE, FALSE),
('Explorador de IA',         'Realiza 5 generaciones con IA',               '💡', 'ia',       'medium', 'weekly',  5,  50, 50, 80,  'ai_use',           TRUE, FALSE),
('Invicto',                  'Gana 3 duelos consecutivos sin perder',       '🛡️', 'duel',     'hard',   'unique',  3, 100, 100, 200, 'duel_streak',      TRUE, FALSE);

-- 11.3 Badges/Logros iniciales (50 logros)
INSERT INTO badges (name, description, icon_emoji, rarity, category, requirement_type, requirement_value, coins_reward, reward_iacoins, xp_reward, reward_xp, sort_order) VALUES
-- Logros de inicio
('Bienvenido',           'Primer inicio de sesión',                  '👋', 'common',    'inicio',    'login_count',    1,    5,    5,  10,  10, 1),
('Perfil Completo',      'Completa tu perfil al 100%',               '✅', 'common',    'inicio',    'profile_complete', 1,  10,   10,  20,  20, 2),
('Primera Moneda',       'Gana tus primeros IACoins',                '🪙', 'common',    'economia',  'coins_earned',   1,   10,   10,  15,  15, 3),

-- Logros de duelo
('Duelo Iniciado',       'Completa tu primer duelo',                 '⚔️', 'common',    'duel',      'duel_complete',  1,   20,   20,  30,  30, 10),
('Victorioso',           'Gana tu primer duelo',                     '🏆', 'common',    'duel',      'duel_win',       1,   25,   25,  40,  40, 11),
('Maestro del Duelo',    'Gana 10 duelos',                           '🥇', 'uncommon',  'duel',      'duel_win',       10,  50,   50,  80,  80, 12),
('Campeón Invicto',      'Gana 50 duelos',                           '🏅', 'rare',      'duel',      'duel_win',       50, 150,  150, 250, 250, 13),
('Leyenda del Duelo',    'Gana 200 duelos',                          '👑', 'epic',      'duel',      'duel_win',       200,500,  500, 800, 800, 14),
('Dios del Duelo',       'Gana 1000 duelos',                         '⚡', 'legendary', 'duel',      'duel_win',      1000,2000, 2000,3000,3000,15),

-- Logros de racha
('3 Días Seguidos',      'Racha de 3 días de inicio de sesión',      '🔥', 'common',    'streak',    'login_streak',   3,   15,   15,  25,  25, 20),
('Una Semana Activo',    'Racha de 7 días',                          '📅', 'uncommon',  'streak',    'login_streak',   7,   40,   40,  60,  60, 21),
('Un Mes Activo',        'Racha de 30 días',                         '🌟', 'rare',      'streak',    'login_streak',   30, 150,  150, 250, 250, 22),
('Dedicación Total',     'Racha de 100 días',                        '💎', 'epic',      'streak',    'login_streak',  100, 500,  500, 800, 800, 23),
('Inquebrantable',       'Racha de 365 días',                        '♾️', 'legendary', 'streak',    'login_streak',  365,2000, 2000,3000,3000, 24),

-- Logros de IACoins
('Ahorrista',            'Acumula 100 IACoins',                      '💰', 'common',    'economia',  'coins_balance',  100,  20,   20,  30,  30, 30),
('Millonario',           'Acumula 1000 IACoins',                     '🤑', 'uncommon',  'economia',  'coins_balance', 1000,  80,   80, 120, 120, 31),
('Empresario',           'Gana un total de 5000 IACoins',            '📈', 'rare',      'economia',  'coins_earned',  5000, 200,  200, 350, 350, 32),
('Magnate',              'Gana un total de 25000 IACoins',           '🏦', 'epic',      'economia',  'coins_earned', 25000, 600,  600,1000,1000, 33),
('Tycoon',               'Gana un total de 100000 IACoins',          '💹', 'legendary', 'economia',  'coins_earned',100000,2000, 2000,3500,3500, 34),

-- Logros de IA
('Curiosidad IA',        'Usa la IA por primera vez',                '🤖', 'common',    'ia',        'ai_use',         1,   15,   15,  25,  25, 40),
('Explorador de IA',     'Realiza 10 generaciones con IA',           '💡', 'uncommon',  'ia',        'ai_use',         10,  50,   50,  80,  80, 41),
('Maestro de IA',        'Realiza 100 generaciones con IA',          '🧬', 'rare',      'ia',        'ai_use',         100,200,  200, 350, 350, 42),
('Gurú de IA',           'Realiza 1000 generaciones con IA',         '🌐', 'epic',      'ia',        'ai_use',        1000,600,  600,1000,1000, 43),

-- Logros de niveles
('Nivel 5',              'Alcanza el nivel 5',                       '🌱', 'common',    'nivel',     'level_reach',    5,   25,   25,  40,  40, 50),
('Nivel 10',             'Alcanza el nivel 10',                      '🌿', 'common',    'nivel',     'level_reach',    10,  40,   40,  60,  60, 51),
('Nivel 25',             'Alcanza el nivel 25 — Gran Sabio',         '🌳', 'uncommon',  'nivel',     'level_reach',    25, 100,  100, 175, 175, 52),
('Nivel 50',             'Alcanza el nivel 50 — Semidiós',           '🏔️', 'rare',      'nivel',     'level_reach',    50, 300,  300, 500, 500, 53),
('Nivel 75',             'Alcanza el nivel 75 — Maestro del Cosmos', '🌋', 'epic',      'nivel',     'level_reach',    75, 750,  750,1250,1250, 54),
('Nivel 100',            'Alcanza el nivel 100 — Leyenda Viviente',  '🗻', 'legendary', 'nivel',     'level_reach',   100,2500, 2500,4000,4000, 55),

-- Logros de retos
('Primer Reto',          'Completa tu primer reto',                  '🎯', 'common',    'reto',      'challenges_complete', 1, 20,   20,  30,  30, 60),
('Retador Activo',       'Completa 10 retos',                        '💪', 'common',    'reto',      'challenges_complete', 10, 50,   50,  80,  80, 61),
('Cazarrecompensas',     'Completa 50 retos',                        '🎖️', 'uncommon',  'reto',      'challenges_complete', 50,150,  150, 250, 250, 62),
('Maestro de Retos',     'Completa 200 retos',                       '🏹', 'rare',      'reto',      'challenges_complete',200,400,  400, 700, 700, 63),
('Leyenda de Retos',     'Completa 1000 retos',                      '⚜️', 'epic',      'reto',      'challenges_complete',1000,1500,1500,2500,2500,64),

-- Logros de trivia
('Primer Acierto',       'Responde 1 pregunta correctamente',        '✔️', 'common',    'trivia',    'trivia_correct',  1,  10,   10,  15,  15, 70),
('10 Respuestas',        'Responde 10 preguntas correctamente',      '📝', 'common',    'trivia',    'trivia_correct',  10, 30,   30,  50,  50, 71),
('100 Respuestas',       'Responde 100 preguntas correctamente',     '📚', 'uncommon',  'trivia',    'trivia_correct', 100,100,  100, 175, 175, 72),
('1000 Respuestas',      'Responde 1000 preguntas correctamente',    '🧠', 'rare',      'trivia',    'trivia_correct',1000,400,  400, 700, 700, 73),

-- Logros de torneos
('Primer Torneo',        'Participa en tu primer torneo',            '🎪', 'common',    'torneo',    'tournament_join', 1,  25,   25,  40,  40, 80),
('Finalista',            'Llega a la final de un torneo',            '🥈', 'uncommon',  'torneo',    'tournament_final',1,  75,   75, 125, 125, 81),
('Campeón',              'Gana un torneo',                           '🥇', 'rare',      'torneo',    'tournament_win',  1, 200,  200, 350, 350, 82),
('Multicampeón',         'Gana 5 torneos',                           '🏆', 'epic',      'torneo',    'tournament_win',  5, 600,  600,1000,1000, 83),

-- Logros sociales
('Colaborador',          'Participa en un reto colaborativo',        '🤝', 'common',    'social',    'collab_join',     1,  20,   20,  30,  30, 90),
('Mentor',               'Ayuda a 5 compañeros en retos',            '👨‍🏫','uncommon',  'social',    'mentor_help',     5,  60,   60, 100, 100, 91),

-- Logros especiales
('Perfeccionista',       'Completa un duelo con 100% de aciertos',  '💯', 'rare',      'especial',  'perfect_duel',    1, 100,  100, 175, 175, 95),
('Velocista',            'Completa un duelo en menos de 60 segundos','⚡', 'uncommon',  'especial',  'speed_duel',      1,  60,   60, 100, 100, 96),
('Nocturno',             'Inicia sesión después de las 11pm',        '🌙', 'common',    'especial',  'night_login',     1,  15,   15,  25,  25, 97),
('Madrugador',           'Inicia sesión antes de las 6am',           '🌅', 'common',    'especial',  'morning_login',   1,  15,   15,  25,  25, 98),
('Año Nuevo',            'Inicia sesión el 1 de enero',              '🎆', 'rare',      'especial',  'new_year_login',  1, 100,  100, 175, 175, 99),
('Cumpleañero',          'Inicia sesión en tu cumpleaños',           '🎂', 'uncommon',  'especial',  'birthday_login',  1,  50,   50,  80,  80,100);

-- 11.4 Torneo de prueba (activo para demo)
INSERT INTO tournaments (name, title, slug, description, tournament_type, format, subject, status, min_participants, max_participants, entry_fee_coins, entry_fee_iacoins, prize_pool_coins, prize_pool_iacoins, prize_pool_xp, start_date, end_date)
VALUES ('Torneo de Bienvenida 2026', 'Torneo de Bienvenida 2026', 'bienvenida-2026',
        'Primer torneo oficial de la plataforma. ¡Demuestra tu sabiduría!',
        'trivia', 'round_robin', 'general', 'registration',
        2, 32, 0, 0, 500, 500, 1000,
        NOW(), NOW() + INTERVAL '30 days');

-- ================================================================
-- BLOQUE 12: VISTAS ÚTILES
-- ================================================================

-- Vista: leaderboard global por IACoins ganados
CREATE OR REPLACE VIEW v_leaderboard_global AS
SELECT
    COALESCE(ib.user_id::text, ibs.user_id::text) AS user_id,
    COALESCE(ib.level, ibs.level, 1) AS level,
    COALESCE(ib.total_earned, ibs.total_earned, 0) AS total_earned,
    COALESCE(ib.experience_points, ibs.experience_points, 0) AS experience_points,
    COALESCE(ib.balance, ibs.balance, 0) AS balance,
    ROW_NUMBER() OVER (ORDER BY COALESCE(ib.total_earned, ibs.total_earned, 0) DESC, COALESCE(ib.experience_points, ibs.experience_points, 0) DESC) AS rank
FROM iacoins_balance ib
FULL OUTER JOIN iacoins_balances ibs ON ib.id = ibs.id
ORDER BY total_earned DESC;

-- Vista: estado de retos del día para un usuario
CREATE OR REPLACE VIEW v_daily_challenges_summary AS
SELECT
    c.id,
    c.title,
    c.icon,
    c.difficulty,
    c.frequency,
    c.reward_coins,
    c.reward_xp,
    c.target_count,
    cp.user_id,
    COALESCE(cp.current_progress, 0) AS current_progress,
    COALESCE(cp.status, 'available') AS status
FROM challenges c
LEFT JOIN challenge_progress cp ON c.id = cp.challenge_id
WHERE c.is_active = TRUE
  AND (c.frequency = 'daily' OR c.frequency = 'unique')
  AND (c.end_date IS NULL OR c.end_date >= NOW());

-- ================================================================
-- FIN DEL SCRIPT
-- ================================================================
