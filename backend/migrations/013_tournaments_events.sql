-- Migration: Sistema de Torneos y Eventos
-- Semana 51-55: Torneos, Duelos, Eventos, Social Sharing, Notificaciones
-- 1. Tabla de Torneos
CREATE TABLE IF NOT EXISTS tournaments (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) NOT NULL,
    -- trivia, examen, competencia, evento_especial
    categoria VARCHAR(100),
    -- matematicas, historia, ciencias, general
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    max_participantes INTEGER DEFAULT 999,
    premio_coins INTEGER DEFAULT 0,
    premio_items JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'pendiente',
    -- pendiente, activo, finalizado, cancelado
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
-- Only create fecha_inicio index if column exists
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tournaments'
        AND column_name = 'fecha_inicio'
) THEN CREATE INDEX IF NOT EXISTS idx_tournaments_fecha_inicio ON tournaments(fecha_inicio);
END IF;
END $$;
-- Only create tipo index if column exists
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tournaments'
        AND column_name = 'tipo'
) THEN CREATE INDEX IF NOT EXISTS idx_tournaments_tipo ON tournaments(tipo);
END IF;
END $$;
-- 2. Participantes de Torneos
CREATE TABLE IF NOT EXISTS tournament_participants (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    puntos INTEGER DEFAULT 0,
    posicion INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tournament_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user ON tournament_participants(user_id);
-- Only create posicion index if column exists
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tournament_participants'
        AND column_name = 'posicion'
) THEN CREATE INDEX IF NOT EXISTS idx_tournament_participants_posicion ON tournament_participants(posicion);
END IF;
END $$;
-- 3. Tabla de Duelos 1v1
CREATE TABLE IF NOT EXISTS duels (
    id SERIAL PRIMARY KEY,
    challenger_id INTEGER NOT NULL REFERENCES usuarios(id),
    opponent_id INTEGER NOT NULL REFERENCES usuarios(id),
    categoria VARCHAR(100) NOT NULL,
    apuesta_coins INTEGER DEFAULT 0,
    ganador_id INTEGER REFERENCES usuarios(id),
    status VARCHAR(50) DEFAULT 'pendiente',
    -- pendiente, en_curso, finalizado, empate, rechazado
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_duels_challenger ON duels(challenger_id);
CREATE INDEX IF NOT EXISTS idx_duels_opponent ON duels(opponent_id);
CREATE INDEX IF NOT EXISTS idx_duels_status ON duels(status);
-- 4. Preguntas de Duelos
CREATE TABLE IF NOT EXISTS duel_questions (
    id SERIAL PRIMARY KEY,
    duel_id INTEGER NOT NULL REFERENCES duels(id) ON DELETE CASCADE,
    pregunta TEXT NOT NULL,
    respuesta_correcta VARCHAR(10) NOT NULL,
    opciones JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_duel_questions_duel ON duel_questions(duel_id);
-- 5. Respuestas de Duelos
CREATE TABLE IF NOT EXISTS duel_answers (
    id SERIAL PRIMARY KEY,
    duel_id INTEGER NOT NULL REFERENCES duels(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES usuarios(id),
    question_id INTEGER NOT NULL REFERENCES duel_questions(id),
    respuesta VARCHAR(10) NOT NULL,
    correcta BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_duel_answers_duel ON duel_answers(duel_id);
CREATE INDEX IF NOT EXISTS idx_duel_answers_user ON duel_answers(user_id);
-- 6. Tabla de Eventos Temáticos
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) NOT NULL,
    -- examen, fin_semestre, inicio_ciclo, festivo, especial
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    beneficios JSONB DEFAULT '{}',
    -- { xp_multiplier: 2, coins_bonus: 100, ... }
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_events_activo ON events(activo);
-- Only create fecha_inicio index if column exists
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'events'
        AND column_name = 'fecha_inicio'
) THEN CREATE INDEX IF NOT EXISTS idx_events_fecha_inicio ON events(fecha_inicio);
END IF;
END $$;
-- Only create tipo index if column exists
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'events'
        AND column_name = 'tipo'
) THEN CREATE INDEX IF NOT EXISTS idx_events_tipo ON events(tipo);
END IF;
END $$;
-- 7. Buffs de Eventos por Usuario
CREATE TABLE IF NOT EXISTS user_event_buffs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES events(id),
    buff_type VARCHAR(50) NOT NULL,
    -- xp_multiplier, coins_multiplier, etc.
    buff_value DECIMAL(10, 2) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_user_buffs_user ON user_event_buffs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_buffs_expires ON user_event_buffs(expires_at);
-- 8. Compartidas en Redes Sociales
CREATE TABLE IF NOT EXISTS social_shares (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL,
    -- achievement, tournament, duel, event
    content_id INTEGER NOT NULL,
    platform VARCHAR(50) NOT NULL,
    -- facebook, twitter, instagram
    share_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_social_shares_user ON social_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_platform ON social_shares(platform);
-- 9. Estadísticas de Torneos (vistas omitidas - pueden tener incompatibilidades)
-- Las vistas se pueden crear manualmente después si es necesario
-- 11. Función para limpiar buffs expirados
CREATE OR REPLACE FUNCTION limpiar_buffs_expirados() RETURNS INTEGER AS $$
DECLARE count INTEGER;
BEGIN
DELETE FROM user_event_buffs
WHERE expires_at < CURRENT_TIMESTAMP;
GET DIAGNOSTICS count = ROW_COUNT;
RETURN count;
END;
$$ LANGUAGE plpgsql;
-- 12. Función para iniciar torneo automáticamente
CREATE OR REPLACE FUNCTION iniciar_torneos_programados() RETURNS INTEGER AS $$
DECLARE count INTEGER;
BEGIN
UPDATE tournaments
SET status = 'activo'
WHERE status = 'pendiente'
    AND fecha_inicio <= CURRENT_TIMESTAMP;
GET DIAGNOSTICS count = ROW_COUNT;
RETURN count;
END;
$$ LANGUAGE plpgsql;
-- 13. Función para finalizar torneos automáticamente
CREATE OR REPLACE FUNCTION finalizar_torneos_expirados() RETURNS INTEGER AS $$
DECLARE count INTEGER;
BEGIN
UPDATE tournaments
SET status = 'finalizado'
WHERE status = 'activo'
    AND fecha_fin < CURRENT_TIMESTAMP;
GET DIAGNOSTICS count = ROW_COUNT;
RETURN count;
END;
$$ LANGUAGE plpgsql;
-- 14. Insertar eventos de ejemplo (solo si tienen las columnas correctas)
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'events'
        AND column_name = 'fecha_inicio'
)
AND NOT EXISTS (
    SELECT 1
    FROM events
    LIMIT 1
) THEN
INSERT INTO events (
        nombre,
        descripcion,
        tipo,
        fecha_inicio,
        fecha_fin,
        beneficios
    )
VALUES (
        'Semana de Exámenes',
        'Durante la semana de exámenes, gana el doble de XP por cada evaluación',
        'examen',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '7 days',
        '{"xp_multiplier": 2, "coins_bonus": 50}'
    ),
    (
        'Fin de Semestre',
        'Celebra el fin del semestre con bonos especiales',
        'fin_semestre',
        CURRENT_DATE + INTERVAL '30 days',
        CURRENT_DATE + INTERVAL '37 days',
        '{"xp_multiplier": 1.5, "coins_bonus": 200, "item_gratis": "avatar_especial"}'
    );
END IF;
END $$;
-- 15. Comentarios
COMMENT ON TABLE tournaments IS 'Torneos de trivia y competencias académicas';
COMMENT ON TABLE tournament_participants IS 'Participantes inscritos en torneos';
COMMENT ON TABLE duels IS 'Duelos 1v1 entre estudiantes';
COMMENT ON TABLE duel_questions IS 'Preguntas del banco para duelos';
COMMENT ON TABLE duel_answers IS 'Respuestas de usuarios en duelos';
COMMENT ON TABLE events IS 'Eventos temáticos con beneficios especiales';
COMMENT ON TABLE user_event_buffs IS 'Buffs temporales otorgados por eventos';
COMMENT ON TABLE social_shares IS 'Compartidas en redes sociales';
-- Fin de migración