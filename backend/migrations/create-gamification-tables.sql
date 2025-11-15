-- ============================================
-- MIGRACIÓN: SISTEMA DE GAMIFICACIÓN IACOINS
-- Fecha: 15 Noviembre 2025
-- Descripción: Crea tablas para wallet, challenges y store
-- Autor: Claude Code
-- ============================================

-- ============================================
-- TABLA 1: wallet
-- Almacena el saldo de IACoins de cada usuario
-- ============================================
CREATE TABLE IF NOT EXISTS wallet (
    user_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    total_earned INTEGER NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
    total_spent INTEGER NOT NULL DEFAULT 0 CHECK (total_spent >= 0),
    total_purchased INTEGER NOT NULL DEFAULT 0 CHECK (total_purchased >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para wallet
CREATE INDEX IF NOT EXISTS idx_wallet_user_id ON wallet(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_balance ON wallet(balance);

-- ============================================
-- TABLA 2: wallet_history
-- Historial de transacciones del wallet
-- ============================================
CREATE TABLE IF NOT EXISTS wallet_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'purchase')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para wallet_history
CREATE INDEX IF NOT EXISTS idx_wallet_history_user_id ON wallet_history(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_history_type ON wallet_history(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_history_created ON wallet_history(created_at DESC);

-- ============================================
-- TABLA 3: challenges
-- Retos y desafíos educativos
-- ============================================
CREATE TABLE IF NOT EXISTS challenges (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    challenge_type VARCHAR(20) NOT NULL DEFAULT 'special' CHECK (challenge_type IN ('daily', 'weekly', 'monthly', 'special')),
    difficulty VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    reward_iacoins INTEGER NOT NULL DEFAULT 10 CHECK (reward_iacoins >= 0),
    reward_xp INTEGER NOT NULL DEFAULT 100 CHECK (reward_xp >= 0),
    max_completions INTEGER NOT NULL DEFAULT 1 CHECK (max_completions > 0),
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    icon VARCHAR(10) DEFAULT '🎯',
    completion_criteria JSONB DEFAULT '{}',
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para challenges
CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges(challenge_type);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON challenges(starts_at, ends_at);

-- ============================================
-- TABLA 4: user_challenges
-- Progreso de usuarios en los retos
-- ============================================
CREATE TABLE IF NOT EXISTS user_challenges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    progress JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    times_completed INTEGER NOT NULL DEFAULT 0 CHECK (times_completed >= 0),
    UNIQUE(user_id, challenge_id)
);

-- Índices para user_challenges
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge_id ON user_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_completed ON user_challenges(is_completed);

-- ============================================
-- TABLA 5: store_items
-- Items disponibles en la tienda virtual
-- ============================================
CREATE TABLE IF NOT EXISTS store_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'customization' CHECK (category IN ('customization', 'rewards', 'power_ups', 'cosmetics', 'special')),
    price_iacoins INTEGER NOT NULL CHECK (price_iacoins > 0),
    icon VARCHAR(10) DEFAULT '🎁',
    is_available BOOLEAN NOT NULL DEFAULT true,
    stock INTEGER CHECK (stock IS NULL OR stock >= 0),
    max_per_user INTEGER CHECK (max_per_user IS NULL OR max_per_user > 0),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para store_items
CREATE INDEX IF NOT EXISTS idx_store_items_category ON store_items(category);
CREATE INDEX IF NOT EXISTS idx_store_items_available ON store_items(is_available);
CREATE INDEX IF NOT EXISTS idx_store_items_price ON store_items(price_iacoins);

-- ============================================
-- TABLA 6: user_items
-- Items comprados por los usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS user_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES store_items(id) ON DELETE CASCADE,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para user_items
CREATE INDEX IF NOT EXISTS idx_user_items_user_id ON user_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_items_item_id ON user_items(item_id);
CREATE INDEX IF NOT EXISTS idx_user_items_purchased ON user_items(purchased_at DESC);

-- ============================================
-- DATOS DE PRUEBA (OPCIONAL - COMENTAR EN PRODUCCIÓN)
-- ============================================

-- Insertar retos de ejemplo
INSERT INTO challenges (title, description, challenge_type, difficulty, reward_iacoins, reward_xp, max_completions, icon, completion_criteria, instructions)
VALUES
    ('Primera Sesión', 'Inicia sesión por primera vez en el sistema', 'special', 'easy', 50, 100, 1, '🎯', '{"action": "login", "count": 1}', 'Solo inicia sesión en la plataforma para completar este reto'),
    ('Estudiante Activo', 'Accede al sistema 5 días consecutivos', 'daily', 'medium', 100, 250, 1, '🔥', '{"action": "daily_login", "days": 5}', 'Inicia sesión durante 5 días consecutivos'),
    ('Experto en Tareas', 'Completa 10 tareas académicas', 'weekly', 'medium', 200, 500, 1, '📝', '{"action": "complete_task", "count": 10}', 'Completa 10 tareas asignadas por tus profesores'),
    ('Calificación Perfecta', 'Obtén 100 en un examen', 'special', 'hard', 500, 1000, 999, '⭐', '{"action": "perfect_score", "subject": "any"}', 'Saca 100 de calificación en cualquier examen'),
    ('Colaborador', 'Participa en 5 foros de discusión', 'monthly', 'medium', 300, 750, 1, '💬', '{"action": "forum_post", "count": 5}', 'Participa activamente en los foros de clase')
ON CONFLICT DO NOTHING;

-- Insertar items de tienda de ejemplo
INSERT INTO store_items (name, description, category, price_iacoins, icon, stock, max_per_user, metadata)
VALUES
    ('Avatar Premium', 'Personaliza tu perfil con avatares exclusivos', 'customization', 50, '🎭', NULL, 1, '{"benefit": "unlock_avatars"}'),
    ('Tema Oscuro Plus', 'Desbloquea el modo oscuro premium con temas personalizados', 'customization', 30, '🌙', NULL, 1, '{"benefit": "dark_mode_themes"}'),
    ('Certificado Digital', 'Certificado verificable de logros académicos', 'rewards', 100, '🏆', NULL, 999, '{"benefit": "achievement_certificate"}'),
    ('Extensión de Tiempo', 'Extensión de 24 horas para entregar una tarea', 'power_ups', 150, '⏰', 50, 3, '{"benefit": "task_extension", "hours": 24}'),
    ('Boost XP x2', 'Duplica tus puntos XP durante 1 semana', 'power_ups', 200, '⚡', NULL, 1, '{"benefit": "xp_boost", "multiplier": 2, "duration_days": 7}'),
    ('Marco de Perfil Dorado', 'Marco dorado para tu foto de perfil', 'cosmetics', 75, '✨', NULL, 1, '{"benefit": "profile_frame", "color": "gold"}'),
    ('Insignia Especial', 'Insignia única visible en tu perfil', 'cosmetics', 120, '🎖️', 20, 1, '{"benefit": "special_badge"}'),
    ('Pase Mensual Premium', 'Acceso a todas las funciones premium por 30 días', 'special', 500, '💎', NULL, 999, '{"benefit": "premium_access", "duration_days": 30}')
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Verificar que las tablas se crearon correctamente
DO $$
BEGIN
    RAISE NOTICE 'Verificando tablas creadas...';

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet') THEN
        RAISE NOTICE '✅ Tabla wallet creada';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_history') THEN
        RAISE NOTICE '✅ Tabla wallet_history creada';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'challenges') THEN
        RAISE NOTICE '✅ Tabla challenges creada';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_challenges') THEN
        RAISE NOTICE '✅ Tabla user_challenges creada';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_items') THEN
        RAISE NOTICE '✅ Tabla store_items creada';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_items') THEN
        RAISE NOTICE '✅ Tabla user_items creada';
    END IF;
END $$;

-- ============================================
-- NOTAS DE MIGRACIÓN
-- ============================================
-- 1. Este script es idempotente (puede ejecutarse múltiples veces sin errores)
-- 2. Las tablas usan SERIAL para IDs auto-incrementales
-- 3. Todas las foreign keys tienen ON DELETE CASCADE
-- 4. Los CHECK constraints aseguran integridad de datos
-- 5. Los índices optimizan las queries más comunes
-- 6. Los datos de prueba son opcionales (comentar en producción)
-- 7. La tabla usuarios debe existir previamente
-- ============================================
