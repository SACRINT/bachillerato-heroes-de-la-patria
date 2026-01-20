-- Migration: Sistema de Gamificación Avanzada
-- Semana 46-50: Retos, Logros, Rachas, Leaderboards, Competencias
-- 1. Agregar XP a usuarios (si no existe)
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS nivel INTEGER DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_usuarios_xp ON usuarios(xp DESC);
CREATE INDEX IF NOT EXISTS idx_usuarios_nivel ON usuarios(nivel);
-- 2. Tabla de Retos/Challenges
CREATE TABLE IF NOT EXISTS challenges (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    -- diario, semanal, mensual, especial
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    objetivo INTEGER NOT NULL,
    metrica VARCHAR(100) NOT NULL,
    -- tareas_completadas, logins, calificacion_alta, etc.
    recompensa_coins INTEGER DEFAULT 0,
    recompensa_xp INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_challenges_tipo ON challenges(tipo);
CREATE INDEX IF NOT EXISTS idx_challenges_activo ON challenges(activo);
CREATE INDEX IF NOT EXISTS idx_challenges_fecha_fin ON challenges(fecha_fin);
-- 3. Progreso de Retos por Usuario
CREATE TABLE IF NOT EXISTS user_challenge_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    progreso INTEGER DEFAULT 0,
    completado BOOLEAN DEFAULT false,
    fecha_completado TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, challenge_id)
);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user ON user_challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_challenge ON user_challenge_progress(challenge_id);
-- 4. Rachas de Usuario
CREATE TABLE IF NOT EXISTS user_streaks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    last_login TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_streaks_user ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_max ON user_streaks(max_streak DESC);
-- 5. Logros/Achievements
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    icono VARCHAR(255),
    categoria VARCHAR(50) NOT NULL,
    -- academico, social, tecnico, especial
    rareza VARCHAR(50) DEFAULT 'comun',
    -- comun, raro, epico, legendario
    criterio JSONB NOT NULL,
    -- { type: 'tareas_completadas', value: 50 }
    recompensa_coins INTEGER DEFAULT 0,
    recompensa_badge VARCHAR(255),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Insertar logros por defecto (solo si tabla está vacía y tiene las columnas correctas)
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'achievements'
        AND column_name = 'nombre'
)
AND NOT EXISTS (
    SELECT 1
    FROM achievements
    LIMIT 1
) THEN
INSERT INTO achievements (
        nombre,
        descripcion,
        icono,
        categoria,
        rareza,
        criterio,
        recompensa_coins
    )
VALUES (
        'Primera Tarea',
        'Completa tu primera tarea',
        '📝',
        'academico',
        'comun',
        '{"type": "tareas_completadas", "value": 1}',
        50
    ),
    (
        'Estudioso',
        'Completa 10 tareas',
        '📚',
        'academico',
        'raro',
        '{"type": "tareas_completadas", "value": 10}',
        200
    ),
    (
        'Maestro',
        'Completa 50 tareas',
        '🎓',
        'academico',
        'epico',
        '{"type": "tareas_completadas", "value": 50}',
        500
    ),
    (
        'Excelencia',
        'Mantén promedio de 9+',
        '⭐',
        'academico',
        'epico',
        '{"type": "promedio_general", "value": 9.0}',
        300
    ),
    (
        'Racha de Fuego',
        'Login 7 días consecutivos',
        '🔥',
        'social',
        'raro',
        '{"type": "login_streak", "value": 7}',
        150
    ),
    (
        'Imparable',
        'Login 30 días consecutivos',
        '💪',
        'social',
        'epico',
        '{"type": "login_streak", "value": 30}',
        600
    ),
    (
        'Millonario Virtual',
        'Acumula 1000 coins',
        '💰',
        'tecnico',
        'epico',
        '{"type": "coins_acumulados", "value": 1000}',
        100
    ),
    (
        'Leyenda',
        'Alcanza nivel 10',
        '👑',
        'especial',
        'legendario',
        '{"type": "xp_total", "value": 10000}',
        1000
    );
END IF;
END $$;
-- 6. Logros Desbloqueados por Usuario
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievements(id),
    fecha_desbloqueo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
-- Only create fecha_desbloqueo index if column exists
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_achievements'
        AND column_name = 'fecha_desbloqueo'
) THEN CREATE INDEX IF NOT EXISTS idx_user_achievements_fecha ON user_achievements(fecha_desbloqueo);
END IF;
END $$;
-- 7. Grupos (si no existe)
CREATE TABLE IF NOT EXISTS grupos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    grado INTEGER NOT NULL,
    seccion VARCHAR(10),
    tenant_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 8. Competencias entre Grupos
CREATE TABLE IF NOT EXISTS group_competitions (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    metrica VARCHAR(100) NOT NULL,
    -- promedio_general, tareas_completadas, asistencia, etc.
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    premio_ganador INTEGER DEFAULT 0,
    grupo_ganador_id INTEGER REFERENCES grupos(id),
    status VARCHAR(50) DEFAULT 'activa',
    -- activa, finalizada, cancelada
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_competitions_status ON group_competitions(status);
CREATE INDEX IF NOT EXISTS idx_competitions_fecha_fin ON group_competitions(fecha_fin);
-- 9. Participantes de Competencias
CREATE TABLE IF NOT EXISTS competition_participants (
    id SERIAL PRIMARY KEY,
    competition_id INTEGER NOT NULL REFERENCES group_competitions(id) ON DELETE CASCADE,
    grupo_id INTEGER NOT NULL REFERENCES grupos(id),
    puntos_acumulados INTEGER DEFAULT 0,
    UNIQUE(competition_id, grupo_id)
);
CREATE INDEX IF NOT EXISTS idx_participants_competition ON competition_participants(competition_id);
CREATE INDEX IF NOT EXISTS idx_participants_grupo ON competition_participants(grupo_id);
-- 10. Insignias/Badges
CREATE TABLE IF NOT EXISTS badges (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    icono VARCHAR(255),
    tipo VARCHAR(50),
    -- oro, plata, bronce, especial
    requisito TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Insertar badges por defecto
INSERT INTO badges (nombre, descripcion, icono, tipo, requisito)
VALUES (
        'Estudiante del Mes',
        'Mejor promedio del mes',
        '🏆',
        'oro',
        'Top 1 mensual'
    ),
    (
        'Participación Activa',
        'Más comentarios en clase',
        '💬',
        'plata',
        'Top 3 mensual'
    ),
    (
        'Asistencia Perfecta',
        'Sin faltas en el mes',
        '✅',
        'bronce',
        '100% asistencia'
    ),
    (
        'Ayudante Estrella',
        'Ayuda a 5 compañeros',
        '⭐',
        'especial',
        '5 ayudas verificadas'
    ) ON CONFLICT DO NOTHING;
-- 11. Badges de Usuario
CREATE TABLE IF NOT EXISTS user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    badge_id INTEGER NOT NULL REFERENCES badges(id),
    fecha_otorgado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_id)
);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
-- 12. Notificaciones (si no existe)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT,
    leido BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
-- Only create leido index if column exists
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'notifications'
        AND column_name = 'leido'
) THEN CREATE INDEX IF NOT EXISTS idx_notifications_leido ON notifications(leido)
WHERE leido = false;
END IF;
END $$;
-- 13. Vistas útiles (omitidas - pueden tener incompatibilidades con esquema existente)
-- Las vistas se pueden crear manualmente después si es necesario
CREATE OR REPLACE VIEW vista_challenges_disponibles AS
SELECT c.*,
    COUNT(ucp.id) as usuarios_participando,
    COUNT(
        CASE
            WHEN ucp.completado THEN 1
        END
    ) as usuarios_completados
FROM challenges c
    LEFT JOIN user_challenge_progress ucp ON c.id = ucp.challenge_id
WHERE c.activo = true
GROUP BY c.id;
-- 14. Funciones
CREATE OR REPLACE FUNCTION calcular_nivel(p_xp INTEGER) RETURNS INTEGER AS $$ BEGIN -- Fórmula: nivel = floor(sqrt(xp / 100))
    RETURN FLOOR(SQRT(p_xp / 100.0));
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION actualizar_nivel_usuario() RETURNS TRIGGER AS $$ BEGIN NEW.nivel = calcular_nivel(NEW.xp);
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trigger_actualizar_nivel ON usuarios;
CREATE TRIGGER trigger_actualizar_nivel BEFORE
UPDATE OF xp ON usuarios FOR EACH ROW EXECUTE FUNCTION actualizar_nivel_usuario();
-- 15. Comentarios
COMMENT ON TABLE challenges IS 'Retos diarios/semanales/mensuales para estudiantes';
COMMENT ON TABLE user_challenge_progress IS 'Progreso individual de retos';
COMMENT ON TABLE user_streaks IS 'Rachas de login consecutivo';
COMMENT ON TABLE achievements IS 'Catálogo de logros desbloqueables';
COMMENT ON TABLE user_achievements IS 'Logros desbloqueados por usuario';
COMMENT ON TABLE group_competitions IS 'Competencias entre grupos/salones';
COMMENT ON TABLE badges IS 'Insignias especiales otorgables';
-- Fin de migración