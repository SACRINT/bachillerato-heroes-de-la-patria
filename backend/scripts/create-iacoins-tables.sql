-- =====================================================
-- SCRIPT: Crear Tablas del Sistema IACoins
-- Fecha: 19 Nov 2025
--
-- Propósito: Sistema de gamificación donde usuarios
-- ganan IACoins completando retos y los gastan en
-- generar contenido con IA (ChatGPT, Anthropic, Gemini)
-- =====================================================

-- =====================================================
-- TABLA 1: Saldo de IACoins por usuario
-- =====================================================
CREATE TABLE IF NOT EXISTS iacoins_balances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0 CHECK (balance >= 0),
    total_earned INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT unique_user_balance UNIQUE (user_id)
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_iacoins_user ON iacoins_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_iacoins_level ON iacoins_balances(level);

-- =====================================================
-- TABLA 2: Transacciones de IACoins
-- =====================================================
CREATE TABLE IF NOT EXISTS iacoins_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('earn', 'spend', 'bonus', 'refund', 'admin_adjustment')),
    amount INTEGER NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description VARCHAR(500) NOT NULL,
    reference_type VARCHAR(100), -- 'challenge', 'ai_generation', 'achievement', 'daily_bonus'
    reference_id INTEGER,
    ai_provider VARCHAR(50), -- 'openai', 'anthropic', 'gemini'
    ai_model VARCHAR(100), -- 'gpt-4', 'claude-3', 'gemini-pro'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para transacciones
CREATE INDEX IF NOT EXISTS idx_transactions_user ON iacoins_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON iacoins_transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON iacoins_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_provider ON iacoins_transactions(ai_provider);

-- =====================================================
-- TABLA 3: Retos/Challenges para ganar IACoins
-- =====================================================
CREATE TABLE IF NOT EXISTS iacoins_challenges (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'academic', 'social', 'creative', 'daily', 'weekly'
    difficulty VARCHAR(50) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    reward_coins INTEGER NOT NULL CHECK (reward_coins > 0),
    reward_xp INTEGER DEFAULT 0,
    requirements JSONB, -- Condiciones para completar el reto
    is_active BOOLEAN DEFAULT TRUE,
    is_repeatable BOOLEAN DEFAULT FALSE,
    repeat_interval VARCHAR(50), -- 'daily', 'weekly', 'monthly'
    max_completions INTEGER, -- NULL = ilimitado
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para retos
CREATE INDEX IF NOT EXISTS idx_challenges_active ON iacoins_challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_challenges_category ON iacoins_challenges(category);

-- =====================================================
-- TABLA 4: Progreso de usuarios en retos
-- =====================================================
CREATE TABLE IF NOT EXISTS iacoins_challenge_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL REFERENCES iacoins_challenges(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'claimed', 'expired')),
    progress_data JSONB, -- Datos específicos del progreso
    completion_count INTEGER DEFAULT 0,
    last_completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT unique_user_challenge UNIQUE (user_id, challenge_id)
);

-- Índices para progreso
CREATE INDEX IF NOT EXISTS idx_progress_user ON iacoins_challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_status ON iacoins_challenge_progress(status);

-- =====================================================
-- TABLA 5: Generaciones de IA (historial de uso)
-- =====================================================
CREATE TABLE IF NOT EXISTS iacoins_ai_generations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    generation_type VARCHAR(100) NOT NULL, -- 'concept_map', 'lesson_plan', 'activity', 'summary', 'legal_document'
    ai_provider VARCHAR(50) NOT NULL, -- 'openai', 'anthropic', 'gemini'
    ai_model VARCHAR(100) NOT NULL,
    prompt_template VARCHAR(200), -- ID del template usado
    user_input TEXT, -- Input del usuario
    generated_content TEXT, -- Contenido generado
    coins_spent INTEGER NOT NULL,
    tokens_used INTEGER,
    processing_time_ms INTEGER,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- Calificación del usuario
    feedback TEXT,
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para generaciones
CREATE INDEX IF NOT EXISTS idx_generations_user ON iacoins_ai_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_type ON iacoins_ai_generations(generation_type);
CREATE INDEX IF NOT EXISTS idx_generations_provider ON iacoins_ai_generations(ai_provider);
CREATE INDEX IF NOT EXISTS idx_generations_date ON iacoins_ai_generations(created_at);

-- =====================================================
-- TABLA 6: Templates de prompts pre-configurados
-- =====================================================
CREATE TABLE IF NOT EXISTS iacoins_prompt_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- 'education', 'planning', 'creative', 'administrative'
    generation_type VARCHAR(100) NOT NULL,
    system_prompt TEXT NOT NULL,
    user_prompt_template TEXT NOT NULL, -- Con placeholders {{variable}}
    required_inputs JSONB, -- Lista de inputs requeridos
    optional_inputs JSONB,
    default_ai_provider VARCHAR(50) DEFAULT 'openai',
    default_ai_model VARCHAR(100) DEFAULT 'gpt-4',
    coin_cost INTEGER NOT NULL CHECK (coin_cost > 0),
    estimated_tokens INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    avg_rating DECIMAL(3, 2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para templates
CREATE INDEX IF NOT EXISTS idx_templates_category ON iacoins_prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_active ON iacoins_prompt_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_type ON iacoins_prompt_templates(generation_type);

-- =====================================================
-- TABLA 7: Logros/Achievements
-- =====================================================
CREATE TABLE IF NOT EXISTS iacoins_achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(100), -- Nombre del icono (FontAwesome)
    badge_image VARCHAR(500),
    category VARCHAR(100), -- 'coins', 'generations', 'challenges', 'social'
    requirement_type VARCHAR(100) NOT NULL, -- 'coins_earned', 'generations_count', 'challenges_completed'
    requirement_value INTEGER NOT NULL,
    reward_coins INTEGER DEFAULT 0,
    reward_xp INTEGER DEFAULT 0,
    is_secret BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABLA 8: Logros desbloqueados por usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS iacoins_user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES iacoins_achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP DEFAULT NOW(),
    coins_rewarded INTEGER DEFAULT 0,

    CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
);

-- Índice para logros de usuario
CREATE INDEX IF NOT EXISTS idx_user_achievements ON iacoins_user_achievements(user_id);

-- =====================================================
-- TABLA 9: Configuración de precios por proveedor IA
-- =====================================================
CREATE TABLE IF NOT EXISTS iacoins_pricing (
    id SERIAL PRIMARY KEY,
    ai_provider VARCHAR(50) NOT NULL,
    ai_model VARCHAR(100) NOT NULL,
    generation_type VARCHAR(100) NOT NULL,
    coin_cost INTEGER NOT NULL CHECK (coin_cost > 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT unique_pricing UNIQUE (ai_provider, ai_model, generation_type)
);

-- =====================================================
-- INSERTAR DATOS INICIALES
-- =====================================================

-- Precios por defecto para generaciones de IA
INSERT INTO iacoins_pricing (ai_provider, ai_model, generation_type, coin_cost) VALUES
    ('openai', 'gpt-4', 'concept_map', 10),
    ('openai', 'gpt-4', 'lesson_plan', 15),
    ('openai', 'gpt-4', 'activity', 8),
    ('openai', 'gpt-4', 'summary', 5),
    ('openai', 'gpt-3.5-turbo', 'concept_map', 5),
    ('openai', 'gpt-3.5-turbo', 'lesson_plan', 8),
    ('openai', 'gpt-3.5-turbo', 'activity', 4),
    ('openai', 'gpt-3.5-turbo', 'summary', 3),
    ('anthropic', 'claude-3-opus', 'concept_map', 12),
    ('anthropic', 'claude-3-opus', 'lesson_plan', 18),
    ('anthropic', 'claude-3-opus', 'activity', 10),
    ('anthropic', 'claude-3-sonnet', 'concept_map', 8),
    ('anthropic', 'claude-3-sonnet', 'lesson_plan', 12),
    ('anthropic', 'claude-3-sonnet', 'activity', 6),
    ('gemini', 'gemini-pro', 'concept_map', 6),
    ('gemini', 'gemini-pro', 'lesson_plan', 10),
    ('gemini', 'gemini-pro', 'activity', 5),
    ('gemini', 'gemini-pro', 'summary', 3)
ON CONFLICT DO NOTHING;

-- Retos iniciales
INSERT INTO iacoins_challenges (title, description, category, difficulty, reward_coins, reward_xp, is_repeatable, repeat_interval) VALUES
    ('Bienvenida', 'Completa tu perfil de usuario', 'onboarding', 'easy', 50, 100, FALSE, NULL),
    ('Primera Generación', 'Genera tu primer contenido con IA', 'onboarding', 'easy', 30, 50, FALSE, NULL),
    ('Inicio de Sesión Diario', 'Inicia sesión cada día', 'daily', 'easy', 5, 10, TRUE, 'daily'),
    ('Explorador Semanal', 'Usa 3 tipos diferentes de generación', 'weekly', 'medium', 50, 100, TRUE, 'weekly'),
    ('Maestro del Mapa', 'Genera 10 mapas conceptuales', 'academic', 'medium', 100, 200, FALSE, NULL),
    ('Planificador Experto', 'Genera 5 planes de clase', 'academic', 'medium', 75, 150, FALSE, NULL),
    ('Feedback Valioso', 'Califica 10 generaciones', 'social', 'easy', 30, 60, FALSE, NULL)
ON CONFLICT DO NOTHING;

-- Logros iniciales
INSERT INTO iacoins_achievements (name, description, icon, category, requirement_type, requirement_value, reward_coins, reward_xp) VALUES
    ('Primer Paso', 'Realiza tu primera generación con IA', 'fa-star', 'generations', 'generations_count', 1, 10, 20),
    ('Generador Novato', 'Realiza 10 generaciones', 'fa-medal', 'generations', 'generations_count', 10, 50, 100),
    ('Generador Experto', 'Realiza 50 generaciones', 'fa-trophy', 'generations', 'generations_count', 50, 200, 500),
    ('Acumulador', 'Acumula 100 IACoins', 'fa-coins', 'coins', 'coins_earned', 100, 25, 50),
    ('Inversor', 'Acumula 500 IACoins', 'fa-piggy-bank', 'coins', 'coins_earned', 500, 100, 200),
    ('Millonario', 'Acumula 1000 IACoins', 'fa-gem', 'coins', 'coins_earned', 1000, 250, 500),
    ('Retador', 'Completa 5 retos', 'fa-flag-checkered', 'challenges', 'challenges_completed', 5, 50, 100),
    ('Campeón', 'Completa 20 retos', 'fa-crown', 'challenges', 'challenges_completed', 20, 200, 400)
ON CONFLICT DO NOTHING;

-- Templates de prompts pre-configurados
INSERT INTO iacoins_prompt_templates (name, slug, description, category, generation_type, system_prompt, user_prompt_template, required_inputs, coin_cost) VALUES
    (
        'Mapa Conceptual Educativo',
        'concept-map-education',
        'Genera un mapa conceptual estructurado sobre cualquier tema educativo',
        'education',
        'concept_map',
        'Eres un experto en pedagogía y visualización del conocimiento. Genera mapas conceptuales claros, jerárquicos y bien estructurados que faciliten el aprendizaje.',
        'Genera un mapa conceptual sobre el tema: {{topic}}. Nivel educativo: {{level}}. Incluye: concepto central, conceptos principales (3-5), conceptos secundarios (2-3 por principal), y las relaciones entre ellos usando palabras de enlace.',
        '{"topic": "string", "level": "string"}'::jsonb,
        10
    ),
    (
        'Plan de Clase Completo',
        'lesson-plan-complete',
        'Genera un plan de clase detallado con objetivos, actividades y evaluación',
        'education',
        'lesson_plan',
        'Eres un docente experto en diseño instruccional. Crea planes de clase completos, alineados con competencias y metodologías activas de aprendizaje.',
        'Genera un plan de clase sobre: {{topic}}. Materia: {{subject}}. Duración: {{duration}} minutos. Nivel: {{level}}. Incluye: objetivo de aprendizaje, competencias a desarrollar, materiales necesarios, secuencia didáctica (inicio, desarrollo, cierre), actividades del alumno y del docente, evaluación formativa.',
        '{"topic": "string", "subject": "string", "duration": "number", "level": "string"}'::jsonb,
        15
    ),
    (
        'Actividad Interactiva',
        'interactive-activity',
        'Genera una actividad didáctica creativa y participativa',
        'education',
        'activity',
        'Eres un experto en gamificación educativa y aprendizaje activo. Diseña actividades que motiven la participación y refuercen el aprendizaje significativo.',
        'Diseña una actividad interactiva sobre: {{topic}}. Tipo de actividad preferido: {{activity_type}}. Número de participantes: {{participants}}. Incluye: nombre creativo, objetivo, materiales, instrucciones paso a paso, variantes, y cómo evaluar el aprendizaje.',
        '{"topic": "string", "activity_type": "string", "participants": "string"}'::jsonb,
        8
    ),
    (
        'Resumen Ejecutivo',
        'executive-summary',
        'Genera un resumen claro y conciso de cualquier texto o tema',
        'education',
        'summary',
        'Eres un experto en síntesis y comunicación clara. Extrae las ideas principales y preséntalas de forma estructurada y fácil de entender.',
        'Genera un resumen del siguiente contenido: {{content}}. Formato deseado: {{format}}. Extensión: {{length}}.',
        '{"content": "string", "format": "string", "length": "string"}'::jsonb,
        5
    )
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE iacoins_balances IS 'Saldo actual de IACoins por usuario con estadísticas de nivel';
COMMENT ON TABLE iacoins_transactions IS 'Historial completo de transacciones de IACoins';
COMMENT ON TABLE iacoins_challenges IS 'Retos disponibles para ganar IACoins';
COMMENT ON TABLE iacoins_challenge_progress IS 'Progreso de usuarios en retos';
COMMENT ON TABLE iacoins_ai_generations IS 'Historial de generaciones de IA realizadas';
COMMENT ON TABLE iacoins_prompt_templates IS 'Templates pre-configurados para generaciones';
COMMENT ON TABLE iacoins_achievements IS 'Logros disponibles en el sistema';
COMMENT ON TABLE iacoins_user_achievements IS 'Logros desbloqueados por usuarios';
COMMENT ON TABLE iacoins_pricing IS 'Precios en IACoins por proveedor/modelo/tipo';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name LIKE 'iacoins_%'
ORDER BY table_name;
