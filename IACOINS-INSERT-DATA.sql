-- Insertar balance para el primer usuario
INSERT INTO iacoins_balances (user_id, balance, total_earned, total_spent, level, experience_points)
SELECT uuid FROM usuarios LIMIT 1
ON CONFLICT (user_id) DO UPDATE SET
    balance = 150,
    total_earned = 250,
    total_spent = 100,
    level = 2,
    experience_points = 350;

-- Insertar retos disponibles
INSERT INTO iacoins_challenges (title, description, difficulty, reward_coins, is_active)
VALUES
    ('Quiz Matemáticas Avanzadas', 'Responde correctamente 10 preguntas de cálculo', 'hard', 100, TRUE),
    ('Participa en Foro', 'Haz 5 contribuciones útiles en el foro', 'easy', 25, TRUE),
    ('Proyecto Colaborativo', 'Completa un proyecto con 3 compañeros', 'medium', 75, TRUE),
    ('Presentación Oral', 'Da una presentación de 5 minutos', 'medium', 50, TRUE),
    ('Investigación Científica', 'Realiza un experimento documentado', 'hard', 120, TRUE);

-- Insertar logros disponibles
INSERT INTO iacoins_achievements (name, description, icon, rarity, reward_coins)
VALUES
    ('Primer Paso', 'Gana tu primer IACoins', 'fa-star', 'common', 10),
    ('Coleccionista', 'Desbloquea 10 logros', 'fa-trophy', 'rare', 100),
    ('Leyenda', 'Llega al nivel 50', 'fa-crown', 'legendary', 500),
    ('Emprendedor', 'Gasta 1000 IACoins', 'fa-rocket', 'epic', 250),
    ('Maestro', 'Completa 50 retos', 'fa-medal', 'rare', 150);

-- Insertar transacciones de ejemplo
INSERT INTO iacoins_transactions (user_id, type, amount, description, created_at)
SELECT u.uuid, 'earn', 50, 'Reto: Quiz Matemáticas', CURRENT_TIMESTAMP - INTERVAL '2 days'
FROM usuarios u LIMIT 1;

INSERT INTO iacoins_transactions (user_id, type, amount, description, created_at)
SELECT u.uuid, 'spend', 20, 'Generar ensayo con OpenAI', CURRENT_TIMESTAMP - INTERVAL '1 day'
FROM usuarios u LIMIT 1;

INSERT INTO iacoins_transactions (user_id, type, amount, description, created_at)
SELECT u.uuid, 'earn', 100, 'Bonus semanal', CURRENT_TIMESTAMP
FROM usuarios u LIMIT 1;

-- Desbloquear logro para el primer usuario
INSERT INTO iacoins_user_achievements (user_id, achievement_id, unlocked_at)
SELECT u.uuid, a.id, CURRENT_TIMESTAMP - INTERVAL '30 days'
FROM usuarios u, iacoins_achievements a
WHERE a.name = 'Primer Paso'
LIMIT 1
ON CONFLICT (user_id, achievement_id) DO NOTHING;

-- Registrar progreso en reto completado
INSERT INTO iacoins_user_challenges (user_id, challenge_id, status, completed_at)
SELECT u.uuid, c.id, 'completed', CURRENT_TIMESTAMP - INTERVAL '2 days'
FROM usuarios u, iacoins_challenges c
WHERE c.title = 'Quiz Matemáticas Avanzadas'
LIMIT 1
ON CONFLICT (user_id, challenge_id) DO NOTHING;

-- Registrar progreso en reto en progreso
INSERT INTO iacoins_user_challenges (user_id, challenge_id, status)
SELECT u.uuid, c.id, 'in_progress'
FROM usuarios u, iacoins_challenges c
WHERE c.title = 'Participa en Foro'
LIMIT 1
ON CONFLICT (user_id, challenge_id) DO NOTHING;

-- Actualizar leaderboard
INSERT INTO iacoins_leaderboard (rank, user_id, total_earned, level)
SELECT ROW_NUMBER() OVER (ORDER BY ib.total_earned DESC), ib.user_id, ib.total_earned, ib.level
FROM iacoins_balances ib
ON CONFLICT (rank) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    total_earned = EXCLUDED.total_earned,
    level = EXCLUDED.level,
    updated_at = CURRENT_TIMESTAMP;
