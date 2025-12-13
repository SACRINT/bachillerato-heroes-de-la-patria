-- =====================================================
-- Datos de Ejemplo para IACoins
-- =====================================================

-- NOTA: Reemplaza 'user-uuid-here' con UUIDs reales de usuarios en tu tabla usuarios

-- 1. Insertar balance para usuario de prueba
INSERT INTO iacoins_balances (user_id, balance, total_earned, total_spent, level, experience_points)
SELECT uuid FROM usuarios LIMIT 1
ON CONFLICT (user_id) DO UPDATE SET
    balance = 150,
    total_earned = 250,
    total_spent = 100,
    level = 2,
    experience_points = 350;

-- 2. Insertar retos disponibles
INSERT INTO iacoins_challenges (title, description, difficulty, reward_coins, category, is_active)
VALUES
    ('Quiz Matemáticas Avanzadas', 'Responde correctamente 10 preguntas de cálculo diferencial', 'hard', 100, 'académico', TRUE),
    ('Participa en Foro', 'Haz 5 contribuciones útiles en el foro de la comunidad', 'easy', 25, 'comunidad', TRUE),
    ('Proyecto Colaborativo', 'Completa un proyecto grupal con al menos 3 compañeros', 'medium', 75, 'proyecto', TRUE),
    ('Presentación Oral', 'Da una presentación de 5 minutos ante la clase', 'medium', 50, 'público', TRUE),
    ('Investigación Científica', 'Realiza un experimento científico documentado', 'hard', 120, 'ciencia', TRUE)
ON CONFLICT DO NOTHING;

-- 3. Insertar logros disponibles
INSERT INTO iacoins_achievements (name, description, icon, rarity, reward_coins)
VALUES
    ('Primer Paso', 'Gana tu primer IACoins', 'fa-star', 'common', 10),
    ('Coleccionista', 'Desbloquea 10 logros diferentes', 'fa-trophy', 'rare', 100),
    ('Leyenda', 'Llega al nivel 50', 'fa-crown', 'legendary', 500),
    ('Emprendedor', 'Gasta 1000 IACoins en generaciones IA', 'fa-rocket', 'epic', 250),
    ('Maestro', 'Completa 50 retos', 'fa-medal', 'rare', 150)
ON CONFLICT DO NOTHING;

-- 4. Insertar transacciones de ejemplo para el primer usuario
INSERT INTO iacoins_transactions (user_id, type, amount, description, balance_before, balance_after, reference_type, reference_id, created_at)
SELECT
    u.uuid,
    'earn',
    50,
    'Reto completado: Quiz Matemáticas Avanzadas',
    100,
    150,
    'challenge',
    1,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
FROM usuarios u LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO iacoins_transactions (user_id, type, amount, description, balance_before, balance_after, reference_type, reference_id, created_at)
SELECT
    u.uuid,
    'spend',
    20,
    'Generar ensayo con OpenAI - Tema: Relatividad',
    150,
    130,
    'ai_generation',
    1,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
FROM usuarios u LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO iacoins_transactions (user_id, type, amount, description, balance_before, balance_after, reference_type, reference_id, created_at)
SELECT
    u.uuid,
    'earn',
    100,
    'Bonus semanal por participación activa',
    130,
    230,
    'bonus',
    NULL,
    CURRENT_TIMESTAMP
FROM usuarios u LIMIT 1
ON CONFLICT DO NOTHING;

-- 5. Desbloquear logros para el primer usuario
INSERT INTO iacoins_user_achievements (user_id, achievement_id, unlocked_at)
SELECT
    u.uuid,
    a.id,
    CURRENT_TIMESTAMP - INTERVAL '30 days'
FROM usuarios u, iacoins_achievements a
WHERE a.name = 'Primer Paso'
LIMIT 1
ON CONFLICT (user_id, achievement_id) DO NOTHING;

-- 6. Registrar progreso en retos
INSERT INTO iacoins_user_challenges (user_id, challenge_id, status, progress_percentage, completed_at, claimed_at)
SELECT
    u.uuid,
    c.id,
    'claimed',
    100,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
FROM usuarios u, iacoins_challenges c
WHERE c.title = 'Quiz Matemáticas Avanzadas'
LIMIT 1
ON CONFLICT (user_id, challenge_id) DO NOTHING;

INSERT INTO iacoins_user_challenges (user_id, challenge_id, status, progress_percentage)
SELECT
    u.uuid,
    c.id,
    'in_progress',
    60
FROM usuarios u, iacoins_challenges c
WHERE c.title = 'Participa en Foro'
LIMIT 1
ON CONFLICT (user_id, challenge_id) DO NOTHING;

-- 7. Actualizar leaderboard (ejecutar después de insertar datos de usuarios)
INSERT INTO iacoins_leaderboard (rank, user_id, total_earned, level, updated_at)
SELECT
    ROW_NUMBER() OVER (ORDER BY ib.total_earned DESC),
    ib.user_id,
    ib.total_earned,
    ib.level,
    CURRENT_TIMESTAMP
FROM iacoins_balances ib
ON CONFLICT (rank) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    total_earned = EXCLUDED.total_earned,
    level = EXCLUDED.level,
    updated_at = CURRENT_TIMESTAMP;

