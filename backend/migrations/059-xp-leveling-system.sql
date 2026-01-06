-- 059-xp-leveling-system.sql
-- Sistema de XP y Niveles para Engagement Revolution
-- Configuración de Niveles (Tabla de Experiencia)
CREATE TABLE IF NOT EXISTS leveling_config (
    level INTEGER PRIMARY KEY,
    xp_required INTEGER NOT NULL,
    -- XP acumulado necesario para alcanzar este nivel
    xp_to_next_level INTEGER NOT NULL,
    -- XP necesario desde el nivel anterior
    title VARCHAR(50),
    -- Título del nivel (Novato, Experto, etc.)
    icon_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Transacciones de XP (Historial detallado para auditoría y visualización)
CREATE TABLE IF NOT EXISTS xp_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    -- 'quiz', 'streak_bonus', 'daily_challenge', 'admin_grant'
    source_id VARCHAR(100),
    -- ID de referencia (quiz_id, etc.)
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Índices para búsqueda rápida
    CONSTRAINT check_positive_amount CHECK (amount > 0)
);
-- Estado del usuario (Extensión de gamificación)
-- Nota: Podríamos agregar columnas a 'usuarios', pero una tabla dedicada es más limpia
CREATE TABLE IF NOT EXISTS user_level_progress (
    user_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    current_level INTEGER DEFAULT 1 REFERENCES leveling_config(level),
    current_xp INTEGER DEFAULT 0,
    -- XP total acumulado
    xp_since_last_level INTEGER DEFAULT 0,
    -- Para la barra de progreso
    last_level_up_date TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created ON xp_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_level_progress_xp ON user_level_progress(current_xp DESC);
-- Para Leaderboard global
-- SEMILLA DE NIVELES (Fórmula exponencial simple)
-- Nivel 1: 0 XP
-- Nivel 2: 100 XP
-- Nivel 50: ~High XP
DO $$ BEGIN -- Solo insertar si está vacío
IF NOT EXISTS (
    SELECT 1
    FROM leveling_config
    LIMIT 1
) THEN
INSERT INTO leveling_config (level, xp_required, xp_to_next_level, title)
VALUES (1, 0, 100, 'Novato'),
    (2, 100, 150, 'Aprendiz I'),
    (3, 250, 200, 'Aprendiz II'),
    (4, 450, 250, 'Aprendiz III'),
    (5, 700, 300, 'Estudiante I'),
    (6, 1000, 350, 'Estudiante II'),
    (7, 1350, 400, 'Estudiante III'),
    (8, 1750, 450, 'Dedicado I'),
    (9, 2200, 500, 'Dedicado II'),
    (10, 2700, 600, 'Dedicado III'),
    -- Salto de dificultad
    (11, 3300, 700, 'Competente I'),
    (12, 4000, 800, 'Competente II'),
    (13, 4800, 900, 'Competente III'),
    (14, 5700, 1000, 'Hábil I'),
    (15, 6700, 1100, 'Hábil II'),
    (16, 7800, 1200, 'Hábil III'),
    (17, 9000, 1350, 'Experto I'),
    (18, 10350, 1500, 'Experto II'),
    (19, 11850, 1650, 'Experto III'),
    (20, 13500, 2000, 'Maestro I'),
    (21, 15500, 2200, 'Maestro II'),
    (22, 17700, 2400, 'Maestro III'),
    (23, 20100, 2600, 'Virtuoso I'),
    (24, 22700, 2800, 'Virtuoso II'),
    (25, 25500, 3000, 'Virtuoso III'),
    (30, 45000, 5000, 'Sabio'),
    (40, 100000, 10000, 'Erudito'),
    (50, 250000, 25000, 'Leyenda');
-- Rellenar huecos simples si es necesario, o dejar lógica en backend para interpolar
END IF;
END $$;