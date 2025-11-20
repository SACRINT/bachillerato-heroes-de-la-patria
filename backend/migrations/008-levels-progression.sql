-- ========================================
-- MIGRACIÓN: Sistema de Niveles y Progresión
-- BGE Héroes de la Patria
-- FASE 1 - Semana 7-8
-- ========================================

-- ========================================
-- TABLA: Definición de Niveles
-- ========================================
CREATE TABLE IF NOT EXISTS level_definitions (
    id SERIAL PRIMARY KEY,
    level INTEGER NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    subtitle VARCHAR(200),

    -- Requisitos
    xp_required INTEGER NOT NULL,

    -- Recompensas al alcanzar
    reward_coins INTEGER DEFAULT 0,
    reward_badge_id INTEGER,

    -- Desbloqueos
    unlocks JSONB,                            -- Features que se desbloquean

    -- Visual
    icon VARCHAR(100) DEFAULT 'fa-star',
    color VARCHAR(20) DEFAULT '#f5a623',
    badge_image VARCHAR(500),

    -- Metadata
    description TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Insignias/Badges
-- ========================================
CREATE TABLE IF NOT EXISTS badges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,

    -- Categoría
    category VARCHAR(50) NOT NULL,            -- achievement, level, special, event

    -- Requisitos
    requirement_type VARCHAR(50),             -- level_reach, challenge_complete, xp_total, etc
    requirement_value INTEGER,
    requirement_data JSONB,

    -- Visual
    icon VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#f5a623',
    image_url VARCHAR(500),

    -- Rareza
    rarity VARCHAR(20) DEFAULT 'common',      -- common, rare, epic, legendary

    -- Recompensas
    reward_coins INTEGER DEFAULT 0,
    reward_xp INTEGER DEFAULT 0,

    -- Estado
    is_active BOOLEAN DEFAULT true,
    is_hidden BOOLEAN DEFAULT false,          -- Badges secretos

    -- Orden
    sort_order INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Badges de Usuario
-- ========================================
CREATE TABLE IF NOT EXISTS user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,

    -- Cuándo se obtuvo
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Detalles
    earn_details JSONB,                       -- Datos específicos de cómo se ganó

    -- Visualización
    is_featured BOOLEAN DEFAULT false,        -- Destacado en perfil
    display_order INTEGER DEFAULT 0,

    -- Constraints
    UNIQUE(user_id, badge_id)
);

-- ========================================
-- TABLA: Perfil Público de Usuario
-- ========================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Información pública
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),

    -- Privacidad
    is_public BOOLEAN DEFAULT true,
    show_level BOOLEAN DEFAULT true,
    show_badges BOOLEAN DEFAULT true,
    show_stats BOOLEAN DEFAULT true,
    show_achievements BOOLEAN DEFAULT true,

    -- Personalización
    theme VARCHAR(50) DEFAULT 'default',
    featured_badge_id INTEGER,

    -- Social
    social_links JSONB,

    -- Estadísticas cacheadas (actualizadas periódicamente)
    total_xp INTEGER DEFAULT 0,
    total_coins_earned INTEGER DEFAULT 0,
    challenges_completed INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Historial de Niveles
-- ========================================
CREATE TABLE IF NOT EXISTS level_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Nivel alcanzado
    level INTEGER NOT NULL,
    previous_level INTEGER NOT NULL,

    -- XP al momento
    xp_at_levelup INTEGER NOT NULL,

    -- Recompensas otorgadas
    coins_earned INTEGER DEFAULT 0,
    badge_earned_id INTEGER,
    unlocks_gained JSONB,

    -- Timestamp
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Features Desbloqueables
-- ========================================
CREATE TABLE IF NOT EXISTS unlockable_features (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,

    -- Requisitos
    required_level INTEGER DEFAULT 1,
    required_badge_id INTEGER,

    -- Tipo
    feature_type VARCHAR(50) NOT NULL,        -- ai_model, template, theme, avatar, etc

    -- Configuración
    config JSONB,

    -- Estado
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ÍNDICES DE PERFORMANCE
-- ========================================

-- Level definitions
CREATE INDEX IF NOT EXISTS idx_levels_level ON level_definitions(level);
CREATE INDEX IF NOT EXISTS idx_levels_xp ON level_definitions(xp_required);

-- Badges
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_rarity ON badges(rarity);
CREATE INDEX IF NOT EXISTS idx_badges_active ON badges(is_active);
CREATE INDEX IF NOT EXISTS idx_badges_slug ON badges(slug);

-- User badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned ON user_badges(earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_featured ON user_badges(user_id, is_featured);

-- User profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_public ON user_profiles(is_public);

-- Level history
CREATE INDEX IF NOT EXISTS idx_level_history_user ON level_history(user_id);
CREATE INDEX IF NOT EXISTS idx_level_history_achieved ON level_history(achieved_at DESC);

-- Unlockable features
CREATE INDEX IF NOT EXISTS idx_features_level ON unlockable_features(required_level);
CREATE INDEX IF NOT EXISTS idx_features_type ON unlockable_features(feature_type);

-- ========================================
-- DATOS INICIALES: Definiciones de Niveles
-- ========================================
INSERT INTO level_definitions (level, title, subtitle, xp_required, reward_coins, icon, color, description) VALUES
    (1, 'Novato', 'Primer paso', 0, 0, 'fa-seedling', '#95a5a6', 'Bienvenido al sistema de gamificación'),
    (2, 'Aprendiz', 'Iniciando el camino', 100, 10, 'fa-book-open', '#3498db', 'Has comenzado tu aprendizaje'),
    (3, 'Estudiante', 'En formación', 250, 15, 'fa-graduation-cap', '#2ecc71', 'Ya tienes el ritmo'),
    (4, 'Aplicado', 'Constante', 500, 20, 'fa-pen', '#9b59b6', 'Tu dedicación se nota'),
    (5, 'Dedicado', 'Comprometido', 850, 50, 'fa-star', '#f1c40f', 'Primer hito importante'),
    (6, 'Competente', 'Hábil', 1300, 25, 'fa-check-double', '#1abc9c', 'Dominas lo básico'),
    (7, 'Hábil', 'Con destreza', 1900, 30, 'fa-magic', '#e74c3c', 'Tus habilidades brillan'),
    (8, 'Experto', 'Conocedor', 2600, 35, 'fa-user-graduate', '#34495e', 'Conocimiento profundo'),
    (9, 'Maestro', 'Dominante', 3500, 40, 'fa-award', '#8e44ad', 'Has dominado el sistema'),
    (10, 'Virtuoso', 'Excepcional', 4600, 100, 'fa-crown', '#f39c12', 'Logro excepcional'),
    (11, 'Sabio', 'Iluminado', 5900, 50, 'fa-brain', '#3498db', 'Sabiduría adquirida'),
    (12, 'Erudito', 'Docto', 7400, 55, 'fa-scroll', '#2ecc71', 'Conocimiento extenso'),
    (13, 'Genio', 'Brillante', 9100, 60, 'fa-lightbulb', '#f1c40f', 'Mente brillante'),
    (14, 'Prodigio', 'Talentoso', 11000, 65, 'fa-bolt', '#e74c3c', 'Talento excepcional'),
    (15, 'Leyenda', 'Mítico', 13100, 150, 'fa-dragon', '#9b59b6', 'Status legendario'),
    (16, 'Mítico', 'Ancestral', 15400, 75, 'fa-hat-wizard', '#1abc9c', 'Poder mítico'),
    (17, 'Épico', 'Heroico', 17900, 80, 'fa-shield-alt', '#e67e22', 'Hazañas épicas'),
    (18, 'Heroico', 'Valiente', 20600, 85, 'fa-fist-raised', '#c0392b', 'Coraje sin igual'),
    (19, 'Divino', 'Celestial', 23500, 90, 'fa-sun', '#f1c40f', 'Poder divino'),
    (20, 'Trascendente', 'Supremo', 26600, 200, 'fa-infinity', '#9b59b6', 'Has trascendido'),
    (21, 'Iluminado', 'Radiante', 29900, 100, 'fa-dove', '#3498db', 'Iluminación total'),
    (22, 'Inmortal', 'Eterno', 33400, 105, 'fa-ankh', '#2ecc71', 'Gloria eterna'),
    (23, 'Ascendido', 'Elevado', 37100, 110, 'fa-angle-double-up', '#f1c40f', 'Ascensión lograda'),
    (24, 'Celestial', 'Astral', 41000, 115, 'fa-moon', '#6c5ce7', 'Poder celestial'),
    (25, 'Cósmico', 'Universal', 45100, 250, 'fa-globe', '#e74c3c', 'Conocimiento cósmico'),
    (26, 'Primordial', 'Original', 49400, 125, 'fa-atom', '#1abc9c', 'Fuerza primordial'),
    (27, 'Ancestral', 'Antiguo', 53900, 130, 'fa-monument', '#8e44ad', 'Sabiduría ancestral'),
    (28, 'Omnisciente', 'Todo saber', 58600, 135, 'fa-eye', '#3498db', 'Todo conocimiento'),
    (29, 'Omnipotente', 'Todo poder', 63500, 140, 'fa-hand-sparkles', '#f39c12', 'Todo poder'),
    (30, 'Absoluto', 'Total', 68600, 300, 'fa-circle', '#2c3e50', 'Dominio absoluto'),
    (31, 'Infinito', 'Sin límites', 73900, 150, 'fa-infinity', '#e74c3c', 'Sin límites'),
    (32, 'Eterno', 'Perpetuo', 79400, 155, 'fa-hourglass', '#9b59b6', 'Eternidad alcanzada'),
    (33, 'Supremo', 'Máximo', 85100, 160, 'fa-chess-king', '#f1c40f', 'Supremacía total'),
    (34, 'Definitivo', 'Final', 91000, 165, 'fa-check-circle', '#2ecc71', 'El definitivo'),
    (35, 'Perfecto', 'Impecable', 97100, 350, 'fa-gem', '#3498db', 'Perfección alcanzada'),
    (36, 'Glorioso', 'Majestuoso', 103400, 175, 'fa-crown', '#f39c12', 'Gloria máxima'),
    (37, 'Magnífico', 'Espléndido', 109900, 180, 'fa-sun', '#e74c3c', 'Magnificencia'),
    (38, 'Sublime', 'Excelso', 116600, 185, 'fa-feather', '#1abc9c', 'Sublimidad'),
    (39, 'Augusto', 'Venerable', 123500, 190, 'fa-landmark', '#8e44ad', 'Veneración'),
    (40, 'Imperial', 'Soberano', 130600, 400, 'fa-chess-queen', '#c0392b', 'Poder imperial'),
    (41, 'Galáctico', 'Estelar', 137900, 200, 'fa-meteor', '#3498db', 'Alcance galáctico'),
    (42, 'Dimensional', 'Multi-verso', 145400, 205, 'fa-cube', '#9b59b6', 'Trasciende dimensiones'),
    (43, 'Atemporal', 'Sin tiempo', 153100, 210, 'fa-clock', '#2ecc71', 'Más allá del tiempo'),
    (44, 'Inefable', 'Indescriptible', 161000, 215, 'fa-question', '#f1c40f', 'Indescriptible'),
    (45, 'Extraordinario', 'Único', 169100, 450, 'fa-fingerprint', '#e74c3c', 'Único en su clase'),
    (46, 'Fenomenal', 'Asombroso', 177400, 225, 'fa-fire', '#1abc9c', 'Fenómeno total'),
    (47, 'Prodigioso', 'Maravilloso', 185900, 230, 'fa-magic', '#8e44ad', 'Prodigio máximo'),
    (48, 'Excepcional', 'Sin par', 194600, 235, 'fa-medal', '#f39c12', 'Sin igual'),
    (49, 'Incomparable', 'Único', 203500, 240, 'fa-trophy', '#3498db', 'Incomparable'),
    (50, 'Legendario BGE', 'El Máximo', 212600, 500, 'fa-dragon', '#ffd700', '¡Has alcanzado el nivel máximo!');

-- ========================================
-- DATOS INICIALES: Badges
-- ========================================
INSERT INTO badges (name, slug, description, category, requirement_type, requirement_value, icon, color, rarity, reward_coins, reward_xp) VALUES
    -- Badges de nivel
    ('Primer Paso', 'first-step', 'Alcanza el nivel 2', 'level', 'level_reach', 2, 'fa-shoe-prints', '#3498db', 'common', 10, 50),
    ('Estudiante Aplicado', 'applied-student', 'Alcanza el nivel 5', 'level', 'level_reach', 5, 'fa-book', '#2ecc71', 'common', 25, 100),
    ('Experto', 'expert', 'Alcanza el nivel 10', 'level', 'level_reach', 10, 'fa-user-graduate', '#f1c40f', 'rare', 50, 200),
    ('Leyenda', 'legend', 'Alcanza el nivel 20', 'level', 'level_reach', 20, 'fa-crown', '#9b59b6', 'epic', 100, 500),
    ('Maestro Supremo', 'supreme-master', 'Alcanza el nivel 50', 'level', 'level_reach', 50, 'fa-dragon', '#ffd700', 'legendary', 500, 2000),

    -- Badges de logros
    ('Primer Reto', 'first-challenge', 'Completa tu primer reto', 'achievement', 'challenge_complete', 1, 'fa-flag', '#3498db', 'common', 10, 50),
    ('Retador', 'challenger', 'Completa 10 retos', 'achievement', 'challenge_complete', 10, 'fa-tasks', '#2ecc71', 'common', 25, 100),
    ('Maestro de Retos', 'challenge-master', 'Completa 50 retos', 'achievement', 'challenge_complete', 50, 'fa-trophy', '#f1c40f', 'rare', 75, 300),
    ('Leyenda de Retos', 'challenge-legend', 'Completa 100 retos', 'achievement', 'challenge_complete', 100, 'fa-medal', '#9b59b6', 'epic', 150, 500),

    -- Badges de streak
    ('Constante', 'constant', 'Mantén una racha de 7 días', 'achievement', 'streak', 7, 'fa-fire', '#e74c3c', 'common', 25, 100),
    ('Dedicado', 'dedicated', 'Mantén una racha de 30 días', 'achievement', 'streak', 30, 'fa-fire-alt', '#f39c12', 'rare', 100, 400),
    ('Inquebrantable', 'unbreakable', 'Mantén una racha de 100 días', 'achievement', 'streak', 100, 'fa-burn', '#c0392b', 'legendary', 500, 2000),

    -- Badges de IA
    ('Primer Prompt', 'first-prompt', 'Usa la IA por primera vez', 'achievement', 'ai_generation', 1, 'fa-robot', '#3498db', 'common', 10, 50),
    ('Usuario IA', 'ai-user', 'Genera 25 contenidos con IA', 'achievement', 'ai_generation', 25, 'fa-brain', '#2ecc71', 'common', 50, 150),
    ('Experto IA', 'ai-expert', 'Genera 100 contenidos con IA', 'achievement', 'ai_generation', 100, 'fa-microchip', '#9b59b6', 'epic', 200, 750),

    -- Badges especiales
    ('Madrugador', 'early-bird', 'Activo antes de las 7 AM', 'special', 'time_login', 7, 'fa-sun', '#f1c40f', 'rare', 30, 100),
    ('Noctámbulo', 'night-owl', 'Activo después de las 10 PM', 'special', 'time_login', 22, 'fa-moon', '#6c5ce7', 'rare', 30, 100),
    ('Fin de Semana', 'weekend-warrior', 'Activo en fin de semana', 'special', 'weekend_login', 1, 'fa-calendar-week', '#2ecc71', 'common', 15, 50),

    -- Badges de colección
    ('Coleccionista', 'collector', 'Obtén 10 badges', 'achievement', 'badge_count', 10, 'fa-layer-group', '#3498db', 'rare', 100, 300),
    ('Maestro Coleccionista', 'master-collector', 'Obtén 25 badges', 'achievement', 'badge_count', 25, 'fa-gem', '#ffd700', 'legendary', 500, 1500);

-- ========================================
-- DATOS INICIALES: Features Desbloqueables
-- ========================================
INSERT INTO unlockable_features (name, slug, description, required_level, feature_type, config) VALUES
    ('GPT-4 Turbo', 'gpt4-turbo', 'Acceso al modelo GPT-4 Turbo', 5, 'ai_model', '{"model": "gpt-4-turbo", "provider": "openai"}'),
    ('Claude 3 Opus', 'claude-opus', 'Acceso al modelo Claude 3 Opus', 10, 'ai_model', '{"model": "claude-3-opus", "provider": "anthropic"}'),
    ('Temas Premium', 'premium-themes', 'Desbloquea temas de color premium', 8, 'theme', '{"themes": ["dark-gold", "ocean", "forest"]}'),
    ('Avatares Especiales', 'special-avatars', 'Avatares animados especiales', 15, 'avatar', '{"count": 10}'),
    ('Plantillas Avanzadas', 'advanced-templates', 'Plantillas de prompts avanzadas', 12, 'template', '{"category": "advanced"}'),
    ('Generación Masiva', 'bulk-generation', 'Genera hasta 5 contenidos a la vez', 20, 'feature', '{"max_batch": 5}'),
    ('Perfil Personalizado', 'custom-profile', 'Personalización avanzada de perfil', 7, 'profile', '{"options": ["banner", "badges_layout"]}'),
    ('Sin Límites Diarios', 'no-daily-limit', 'Elimina el límite diario de generaciones', 30, 'feature', '{"daily_limit": null}'),
    ('Acceso Beta', 'beta-access', 'Acceso a features experimentales', 25, 'feature', '{"beta": true}'),
    ('Título Personalizado', 'custom-title', 'Crea tu propio título de nivel', 40, 'profile', '{"custom_title": true}');

-- ========================================
-- COMENTARIOS
-- ========================================
COMMENT ON TABLE level_definitions IS 'Definiciones de los 50 niveles del sistema';
COMMENT ON TABLE badges IS 'Insignias obtenibles por logros';
COMMENT ON TABLE user_badges IS 'Badges ganados por cada usuario';
COMMENT ON TABLE user_profiles IS 'Perfil público de usuarios';
COMMENT ON TABLE level_history IS 'Historial de subidas de nivel';
COMMENT ON TABLE unlockable_features IS 'Features que se desbloquean por nivel';

COMMENT ON COLUMN badges.rarity IS 'common, rare, epic, legendary';
COMMENT ON COLUMN user_badges.is_featured IS 'Si el badge está destacado en el perfil';

-- ========================================
-- FIN DE MIGRACIÓN
-- ========================================
