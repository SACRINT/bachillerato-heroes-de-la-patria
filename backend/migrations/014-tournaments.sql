-- ========================================
-- MIGRACIÓN: Sistema de Torneos y Competencias
-- BGE Héroes de la Patria
-- FASE 3 - Semana 21-22
-- ========================================

-- ========================================
-- TABLA: Torneos
-- ========================================
CREATE TABLE IF NOT EXISTS tournaments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(300) NOT NULL,
    slug VARCHAR(300) UNIQUE,
    description TEXT,

    -- Tipo de torneo
    tournament_type VARCHAR(50) NOT NULL,         -- quiz, challenge, project, hackathon, debate
    format VARCHAR(50) DEFAULT 'bracket',         -- bracket, round_robin, swiss, league

    -- Materia/Tema
    subject VARCHAR(100),
    topics JSONB DEFAULT '[]',                    -- Temas específicos

    -- Participación
    min_participants INTEGER DEFAULT 2,
    max_participants INTEGER DEFAULT 100,
    team_size INTEGER DEFAULT 1,                  -- 1 = individual, >1 = equipos
    is_team_tournament BOOLEAN DEFAULT false,

    -- Fechas
    registration_start TIMESTAMP WITH TIME ZONE NOT NULL,
    registration_end TIMESTAMP WITH TIME ZONE NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Requisitos
    min_level INTEGER DEFAULT 1,
    required_badges JSONB DEFAULT '[]',
    entry_fee_coins INTEGER DEFAULT 0,            -- IACoins para participar

    -- Premios
    prize_pool_coins INTEGER DEFAULT 0,
    prize_pool_xp INTEGER DEFAULT 0,
    prizes JSONB DEFAULT '[]',                    -- [{rank: 1, coins: 500, xp: 1000, badge_id: 5}]

    -- Estado
    status VARCHAR(20) DEFAULT 'draft',           -- draft, registration, active, completed, cancelled

    -- Reglas
    rules TEXT,
    scoring_system JSONB,                         -- Sistema de puntuación personalizado

    -- Configuración
    settings JSONB DEFAULT '{}',
    is_featured BOOLEAN DEFAULT false,
    is_ranked BOOLEAN DEFAULT true,

    -- Estadísticas
    participant_count INTEGER DEFAULT 0,
    match_count INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,

    -- Metadata
    created_by INTEGER REFERENCES usuarios(id),
    sponsored_by VARCHAR(200),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Participantes de Torneos
-- ========================================
CREATE TABLE IF NOT EXISTS tournament_participants (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    team_id INTEGER,                              -- NULL si es individual

    -- Estado
    status VARCHAR(20) DEFAULT 'registered',      -- registered, confirmed, active, eliminated, withdrawn, disqualified
    seed INTEGER,                                 -- Posición inicial en bracket

    -- Estadísticas del torneo
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    total_score DECIMAL(10,2) DEFAULT 0,

    -- Posición final
    final_rank INTEGER,
    prize_won_coins INTEGER DEFAULT 0,
    prize_won_xp INTEGER DEFAULT 0,
    badge_won_id INTEGER,

    -- Tracking
    matches_played INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    avg_response_time DECIMAL(10,2),              -- segundos

    -- Pago de entrada
    entry_paid BOOLEAN DEFAULT false,
    paid_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    eliminated_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(tournament_id, user_id)
);

-- ========================================
-- TABLA: Equipos de Torneo
-- ========================================
CREATE TABLE IF NOT EXISTS tournament_teams (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    captain_id INTEGER NOT NULL REFERENCES usuarios(id),

    -- Estado
    status VARCHAR(20) DEFAULT 'forming',         -- forming, ready, active, eliminated

    -- Estadísticas
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    final_rank INTEGER,

    -- Metadata
    avatar_url VARCHAR(500),
    motto VARCHAR(200),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(tournament_id, name)
);

-- ========================================
-- TABLA: Rondas de Torneo
-- ========================================
CREATE TABLE IF NOT EXISTS tournament_rounds (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    name VARCHAR(100),                            -- "Ronda 1", "Cuartos", "Semifinal", "Final"

    -- Fechas
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,

    -- Estado
    status VARCHAR(20) DEFAULT 'pending',         -- pending, active, completed

    -- Configuración
    matches_count INTEGER DEFAULT 0,
    questions_per_match INTEGER DEFAULT 10,
    time_limit_seconds INTEGER DEFAULT 60,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Partidas/Matches
-- ========================================
CREATE TABLE IF NOT EXISTS tournament_matches (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round_id INTEGER REFERENCES tournament_rounds(id),

    -- Participantes (individual o equipo)
    participant1_id INTEGER REFERENCES tournament_participants(id),
    participant2_id INTEGER REFERENCES tournament_participants(id),
    team1_id INTEGER REFERENCES tournament_teams(id),
    team2_id INTEGER REFERENCES tournament_teams(id),

    -- Posición en bracket
    bracket_position INTEGER,
    match_number INTEGER,

    -- Resultado
    winner_participant_id INTEGER REFERENCES tournament_participants(id),
    winner_team_id INTEGER REFERENCES tournament_teams(id),
    score1 DECIMAL(10,2) DEFAULT 0,
    score2 DECIMAL(10,2) DEFAULT 0,
    is_draw BOOLEAN DEFAULT false,

    -- Estado
    status VARCHAR(20) DEFAULT 'scheduled',       -- scheduled, live, completed, cancelled, forfeit

    -- Fechas
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,

    -- Detalles
    questions JSONB DEFAULT '[]',                 -- Preguntas usadas
    responses JSONB DEFAULT '[]',                 -- Respuestas de participantes
    duration_seconds INTEGER,

    -- Siguiente match (para brackets)
    next_match_id INTEGER REFERENCES tournament_matches(id),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Preguntas de Torneo
-- ========================================
CREATE TABLE IF NOT EXISTS tournament_questions (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,

    -- Contenido
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'multiple_choice', -- multiple_choice, true_false, short_answer
    options JSONB,                                -- [{id: 'a', text: '...'}]
    correct_answer VARCHAR(100) NOT NULL,
    explanation TEXT,

    -- Clasificación
    subject VARCHAR(100),
    topic VARCHAR(100),
    difficulty VARCHAR(20) DEFAULT 'medium',      -- easy, medium, hard

    -- Puntuación
    points INTEGER DEFAULT 10,
    time_limit_seconds INTEGER DEFAULT 30,

    -- Estadísticas
    times_used INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    avg_response_time DECIMAL(10,2),

    created_by INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Leaderboard de Torneos
-- ========================================
CREATE TABLE IF NOT EXISTS tournament_leaderboards (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES tournament_teams(id),

    -- Posición
    rank INTEGER NOT NULL,
    previous_rank INTEGER,

    -- Estadísticas
    points INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    score DECIMAL(10,2) DEFAULT 0,

    -- Detalles
    matches_played INTEGER DEFAULT 0,
    avg_score DECIMAL(10,2),
    best_score DECIMAL(10,2),

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(tournament_id, user_id)
);

-- ========================================
-- TABLA: Historial de Torneos del Usuario
-- ========================================
CREATE TABLE IF NOT EXISTS tournament_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,

    -- Resultado
    final_rank INTEGER,
    total_points INTEGER,
    total_score DECIMAL(10,2),

    -- Premios
    coins_won INTEGER DEFAULT 0,
    xp_won INTEGER DEFAULT 0,
    badges_won JSONB DEFAULT '[]',

    -- Estadísticas
    matches_played INTEGER,
    wins INTEGER,
    losses INTEGER,
    accuracy DECIMAL(5,2),                        -- % de respuestas correctas

    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, tournament_id)
);

-- ========================================
-- TABLA: Logros de Torneos
-- ========================================
CREATE TABLE IF NOT EXISTS tournament_achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    icon VARCHAR(100),

    -- Criterios
    achievement_type VARCHAR(50) NOT NULL,        -- wins, participation, streak, speed, accuracy
    requirement_value INTEGER NOT NULL,
    tournament_type VARCHAR(50),                  -- NULL = todos los tipos

    -- Recompensas
    coins_reward INTEGER DEFAULT 0,
    xp_reward INTEGER DEFAULT 0,
    badge_id INTEGER,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Logros Obtenidos por Usuario
-- ========================================
CREATE TABLE IF NOT EXISTS tournament_user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES tournament_achievements(id),
    tournament_id INTEGER REFERENCES tournaments(id),

    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, achievement_id, tournament_id)
);

-- ========================================
-- TABLA: Invitaciones a Equipos
-- ========================================
CREATE TABLE IF NOT EXISTS tournament_team_invites (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES tournament_teams(id) ON DELETE CASCADE,
    invited_user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    invited_by INTEGER NOT NULL REFERENCES usuarios(id),

    status VARCHAR(20) DEFAULT 'pending',         -- pending, accepted, declined, expired

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(team_id, invited_user_id)
);

-- ========================================
-- ÍNDICES DE PERFORMANCE
-- ========================================

-- Tournaments
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_type ON tournaments(tournament_type);
CREATE INDEX IF NOT EXISTS idx_tournaments_dates ON tournaments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_featured ON tournaments(is_featured, status);
CREATE INDEX IF NOT EXISTS idx_tournaments_subject ON tournaments(subject);

-- Participants
CREATE INDEX IF NOT EXISTS idx_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON tournament_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON tournament_participants(status);
CREATE INDEX IF NOT EXISTS idx_participants_rank ON tournament_participants(tournament_id, final_rank);

-- Teams
CREATE INDEX IF NOT EXISTS idx_teams_tournament ON tournament_teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_teams_captain ON tournament_teams(captain_id);

-- Rounds
CREATE INDEX IF NOT EXISTS idx_rounds_tournament ON tournament_rounds(tournament_id);
CREATE INDEX IF NOT EXISTS idx_rounds_status ON tournament_rounds(status);

-- Matches
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_round ON tournament_matches(round_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON tournament_matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_scheduled ON tournament_matches(scheduled_at);

-- Questions
CREATE INDEX IF NOT EXISTS idx_questions_tournament ON tournament_questions(tournament_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON tournament_questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON tournament_questions(difficulty);

-- Leaderboards
CREATE INDEX IF NOT EXISTS idx_leaderboards_tournament ON tournament_leaderboards(tournament_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_rank ON tournament_leaderboards(tournament_id, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboards_user ON tournament_leaderboards(user_id);

-- History
CREATE INDEX IF NOT EXISTS idx_history_user ON tournament_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_tournament ON tournament_history(tournament_id);

-- Achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON tournament_user_achievements(user_id);

-- ========================================
-- DATOS INICIALES: Logros de Torneos
-- ========================================
INSERT INTO tournament_achievements (name, description, icon, achievement_type, requirement_value, coins_reward, xp_reward) VALUES
    ('Primera Victoria', 'Gana tu primer match en un torneo', 'fa-trophy', 'wins', 1, 50, 100),
    ('Campeón Novato', 'Gana tu primer torneo', 'fa-crown', 'wins', 1, 200, 500),
    ('Racha de Victorias', 'Gana 5 matches consecutivos', 'fa-fire', 'streak', 5, 150, 300),
    ('Participante Dedicado', 'Participa en 10 torneos', 'fa-medal', 'participation', 10, 100, 250),
    ('Velocista', 'Responde 10 preguntas en menos de 5 segundos', 'fa-bolt', 'speed', 10, 75, 150),
    ('Precisión Perfecta', 'Obtén 100% de precisión en un match', 'fa-bullseye', 'accuracy', 100, 100, 200),
    ('Leyenda del Torneo', 'Gana 10 torneos', 'fa-star', 'wins', 10, 500, 1000),
    ('Capitán de Equipo', 'Lidera un equipo a la victoria', 'fa-users', 'wins', 1, 150, 300),
    ('Maratonista', 'Participa en 50 matches', 'fa-running', 'participation', 50, 200, 400),
    ('Cerebrito', 'Responde correctamente 100 preguntas', 'fa-brain', 'accuracy', 100, 100, 250)
ON CONFLICT DO NOTHING;

-- ========================================
-- DATOS INICIALES: Torneos de Ejemplo
-- ========================================
INSERT INTO tournaments (name, slug, description, tournament_type, format, subject, min_participants, max_participants, registration_start, registration_end, start_date, end_date, prize_pool_coins, prize_pool_xp, prizes, status, created_by) VALUES
    (
        'Copa Matemáticas Noviembre 2025',
        'copa-matematicas-nov-2025',
        'Torneo mensual de matemáticas para todos los niveles. Demuestra tus habilidades en álgebra, geometría y más.',
        'quiz',
        'bracket',
        'Matemáticas',
        8,
        64,
        NOW(),
        NOW() + INTERVAL '5 days',
        NOW() + INTERVAL '7 days',
        NOW() + INTERVAL '14 days',
        1000,
        5000,
        '[{"rank": 1, "coins": 500, "xp": 2000}, {"rank": 2, "coins": 300, "xp": 1500}, {"rank": 3, "coins": 200, "xp": 1000}]'::JSONB,
        'registration',
        1
    ),
    (
        'Hackathon de Programación BGE',
        'hackathon-programacion-bge',
        'Crea soluciones innovadoras en equipos de 3-4 personas. 48 horas de desarrollo intensivo.',
        'hackathon',
        'league',
        'Tecnología',
        12,
        48,
        NOW(),
        NOW() + INTERVAL '10 days',
        NOW() + INTERVAL '14 days',
        NOW() + INTERVAL '16 days',
        2000,
        10000,
        '[{"rank": 1, "coins": 1000, "xp": 5000}, {"rank": 2, "coins": 600, "xp": 3000}, {"rank": 3, "coins": 400, "xp": 2000}]'::JSONB,
        'draft',
        1
    ),
    (
        'Debate de Historia: Revolución Mexicana',
        'debate-revolucion-mexicana',
        'Debate académico sobre causas y consecuencias de la Revolución Mexicana.',
        'debate',
        'bracket',
        'Historia',
        8,
        32,
        NOW(),
        NOW() + INTERVAL '7 days',
        NOW() + INTERVAL '10 days',
        NOW() + INTERVAL '12 days',
        800,
        4000,
        '[{"rank": 1, "coins": 400, "xp": 1500}, {"rank": 2, "coins": 250, "xp": 1000}, {"rank": 3, "coins": 150, "xp": 500}]'::JSONB,
        'draft',
        1
    )
ON CONFLICT DO NOTHING;

-- ========================================
-- COMENTARIOS
-- ========================================
COMMENT ON TABLE tournaments IS 'Torneos y competencias académicas';
COMMENT ON TABLE tournament_participants IS 'Participantes individuales en torneos';
COMMENT ON TABLE tournament_teams IS 'Equipos para torneos grupales';
COMMENT ON TABLE tournament_rounds IS 'Rondas/etapas de torneos';
COMMENT ON TABLE tournament_matches IS 'Partidas individuales entre participantes';
COMMENT ON TABLE tournament_questions IS 'Banco de preguntas para torneos';
COMMENT ON TABLE tournament_leaderboards IS 'Tabla de posiciones en tiempo real';
COMMENT ON TABLE tournament_history IS 'Historial de participación del usuario';
COMMENT ON TABLE tournament_achievements IS 'Logros desbloqueables en torneos';

COMMENT ON COLUMN tournaments.tournament_type IS 'quiz, challenge, project, hackathon, debate';
COMMENT ON COLUMN tournaments.format IS 'bracket, round_robin, swiss, league';
COMMENT ON COLUMN tournaments.status IS 'draft, registration, active, completed, cancelled';
COMMENT ON COLUMN tournament_participants.status IS 'registered, confirmed, active, eliminated, withdrawn, disqualified';
COMMENT ON COLUMN tournament_matches.status IS 'scheduled, live, completed, cancelled, forfeit';

-- ========================================
-- FIN DE MIGRACIÓN
-- ========================================
