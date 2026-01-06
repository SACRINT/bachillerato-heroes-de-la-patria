-- 063-tournaments-system.sql
-- Sistema de Torneos y Eventos Temporales (Semana 7)
-- 1. Tabla de Definición de Torneos
CREATE TABLE IF NOT EXISTS tournaments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    -- Configuración
    status VARCHAR(20) DEFAULT 'upcoming',
    -- upcoming, active, completed, cancelled
    scoring_type VARCHAR(50) DEFAULT 'xp_gained',
    -- xp_gained, manual_score, mini_game_1
    min_level_required INTEGER DEFAULT 1,
    -- Recompensas (JSON para flexibilidad: { "1": {"coins": 1000, "xp": 500, "badge_id": 10}, "2": ... })
    rewards_structure JSONB DEFAULT '{}',
    image_banner_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 2. Tabla de Participantes y Puntajes
CREATE TABLE IF NOT EXISTS tournament_participants (
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    current_score INTEGER DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    rank_at_closure INTEGER NULL,
    -- Se llena al finalizar el torneo
    reward_claimed BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (tournament_id, user_id)
);
-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_tournaments_dates ON tournaments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_participants_score ON tournament_participants(tournament_id, current_score DESC);
-- 4. Seed Data: Torneo de Ejemplo
INSERT INTO tournaments (
        title,
        description,
        start_date,
        end_date,
        status,
        scoring_type,
        rewards_structure
    )
VALUES (
        'Torneo de Inicio de Semestre',
        '¡Compite por ser el estudiante más activo! Gana XP completando tareas y asistiendo a clases. Los top 3 ganan monedas y un badge exclusivo.',
        NOW(),
        NOW() + INTERVAL '7 days',
        'active',
        'xp_gained',
        '{"1": {"coins": 500, "xp": 200}, "2": {"coins": 250, "xp": 100}, "3": {"coins": 100, "xp": 50}}'
    );