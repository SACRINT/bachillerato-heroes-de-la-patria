-- Tabla de Equipos
CREATE TABLE IF NOT EXISTS competition_teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    motto VARCHAR(255),
    captain_id INTEGER REFERENCES usuarios(id),
    score INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Miembros del Equipo
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES competition_teams(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    -- captain, member
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id),
    -- Asegurar que un usuario solo esté en un equipo activo a la vez (opcional, por ahora permitimos multimembership en lógica check)
    UNIQUE(user_id) -- Regla estricta: Un usuario, un equipo
);
-- Competencias / Torneos
CREATE TABLE IF NOT EXISTS competitions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'upcoming',
    -- upcoming, active, finished
    type VARCHAR(50) DEFAULT 'weekly_challenge',
    -- weekly_challenge, tournament, hackathon
    prize_pool VARCHAR(100),
    -- ej. "1000 IACoins"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Inscripciones a Competencias
CREATE TABLE IF NOT EXISTS competition_enrollments (
    id SERIAL PRIMARY KEY,
    competition_id INTEGER REFERENCES competitions(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES competition_teams(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    -- Score específico en este torneo
    rank INTEGER,
    -- Rank final
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(competition_id, team_id)
);
-- Partidos / Enfrentamientos (Matchmaking)
CREATE TABLE IF NOT EXISTS competition_matches (
    id SERIAL PRIMARY KEY,
    competition_id INTEGER REFERENCES competitions(id) ON DELETE CASCADE,
    team_a_id INTEGER REFERENCES competition_teams(id),
    team_b_id INTEGER REFERENCES competition_teams(id),
    score_a INTEGER DEFAULT 0,
    score_b INTEGER DEFAULT 0,
    winner_team_id INTEGER REFERENCES competition_teams(id),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'scheduled',
    -- scheduled, in_progress, finished
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_teams_score ON competition_teams(score DESC);
CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status);