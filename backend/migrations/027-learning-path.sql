-- =====================================================
-- MIGRACIÓN: Learning Path - Personalización del Aprendizaje (Semana 18)
-- Fecha: Enero 2026
-- =====================================================
-- Tabla de progreso de aprendizaje
CREATE TABLE IF NOT EXISTS learning_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    completed_nodes TEXT [] DEFAULT '{}',
    in_progress_nodes TEXT [] DEFAULT '{}',
    current_level INTEGER DEFAULT 1,
    review_dates JSONB DEFAULT '{}',
    completion_dates JSONB DEFAULT '{}',
    intervals JSONB DEFAULT '{}',
    -- Para Spaced Repetition
    streak_days INTEGER DEFAULT 0,
    last_activity_date DATE,
    total_study_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_progress_user ON learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_level ON learning_progress(current_level);
-- Tabla de rutas de aprendizaje generadas
CREATE TABLE IF NOT EXISTS learning_paths (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    path_name VARCHAR(255),
    target_node_id VARCHAR(100) NOT NULL,
    steps JSONB NOT NULL,
    -- Array de pasos ordenados
    total_steps INTEGER,
    completed_steps INTEGER DEFAULT 0,
    estimated_minutes INTEGER,
    difficulty VARCHAR(30),
    status VARCHAR(30) DEFAULT 'active',
    -- active, completed, paused, abandoned
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_paths_user ON learning_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_paths_status ON learning_paths(status);
CREATE INDEX IF NOT EXISTS idx_paths_target ON learning_paths(target_node_id);
-- Tabla de nodos del grafo de conocimiento (persistente)
CREATE TABLE IF NOT EXISTS knowledge_graph_nodes (
    id VARCHAR(100) PRIMARY KEY,
    subject VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL,
    prerequisites TEXT [] DEFAULT '{}',
    estimated_minutes INTEGER DEFAULT 45,
    resources JSONB DEFAULT '[]',
    -- Links a recursos relacionados
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_nodes_subject ON knowledge_graph_nodes(subject);
CREATE INDEX IF NOT EXISTS idx_nodes_level ON knowledge_graph_nodes(level);
-- Tabla de micro-credenciales
CREATE TABLE IF NOT EXISTS micro_credentials (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    required_nodes TEXT [] NOT NULL,
    points INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabla de micro-credenciales ganadas
CREATE TABLE IF NOT EXISTS earned_credentials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    credential_id VARCHAR(100) REFERENCES micro_credentials(id),
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, credential_id)
);
CREATE INDEX IF NOT EXISTS idx_earned_user ON earned_credentials(user_id);
-- Tabla de evaluaciones diagnósticas
CREATE TABLE IF NOT EXISTS diagnostic_assessments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    subject VARCHAR(50) NOT NULL,
    questions JSONB NOT NULL,
    answers JSONB,
    score DECIMAL(5, 2),
    recommended_level INTEGER,
    mastered_nodes TEXT [] DEFAULT '{}',
    status VARCHAR(30) DEFAULT 'pending',
    -- pending, completed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_assessments_user ON diagnostic_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_subject ON diagnostic_assessments(subject);
-- Tabla de adaptaciones de dificultad
CREATE TABLE IF NOT EXISTS difficulty_adaptations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    node_id VARCHAR(100) NOT NULL,
    performance_score DECIMAL(5, 2),
    previous_difficulty VARCHAR(30),
    new_difficulty VARCHAR(30),
    adaptation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_adaptations_user ON difficulty_adaptations(user_id);
CREATE INDEX IF NOT EXISTS idx_adaptations_node ON difficulty_adaptations(node_id);
-- Tabla de repasos (Spaced Repetition)
CREATE TABLE IF NOT EXISTS spaced_repetition_reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    node_id VARCHAR(100) NOT NULL,
    last_review_date DATE,
    next_review_date DATE,
    interval_index INTEGER DEFAULT 0,
    -- Índice en array de intervalos
    ease_factor DECIMAL(4, 2) DEFAULT 2.5,
    total_reviews INTEGER DEFAULT 0,
    correct_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, node_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON spaced_repetition_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_next ON spaced_repetition_reviews(next_review_date);
-- Insertar nodos del grafo de conocimiento
INSERT INTO knowledge_graph_nodes (id, subject, name, level, prerequisites)
VALUES (
        'math_1',
        'matematicas',
        'Números y Operaciones',
        1,
        '{}'
    ),
    (
        'math_2',
        'matematicas',
        'Álgebra Básica',
        2,
        '{"math_1"}'
    ),
    (
        'math_3',
        'matematicas',
        'Ecuaciones Lineales',
        3,
        '{"math_2"}'
    ),
    (
        'math_4',
        'matematicas',
        'Ecuaciones Cuadráticas',
        4,
        '{"math_3"}'
    ),
    (
        'phys_1',
        'fisica',
        'Introducción a la Física',
        1,
        '{}'
    ),
    (
        'phys_2',
        'fisica',
        'Cinemática',
        2,
        '{"phys_1", "math_3"}'
    ),
    (
        'phys_3',
        'fisica',
        'Dinámica (Leyes de Newton)',
        3,
        '{"phys_2"}'
    ),
    (
        'chem_1',
        'quimica',
        'Estructura Atómica',
        1,
        '{}'
    ),
    (
        'chem_2',
        'quimica',
        'Tabla Periódica',
        2,
        '{"chem_1"}'
    ),
    (
        'chem_3',
        'quimica',
        'Enlaces Químicos',
        3,
        '{"chem_2"}'
    ),
    (
        'hist_1',
        'historia',
        'México Prehispánico',
        1,
        '{}'
    ),
    (
        'hist_2',
        'historia',
        'La Conquista',
        2,
        '{"hist_1"}'
    ),
    (
        'hist_3',
        'historia',
        'México Colonial',
        3,
        '{"hist_2"}'
    ) ON CONFLICT (id) DO NOTHING;
-- Insertar micro-credenciales
INSERT INTO micro_credentials (id, name, icon, required_nodes)
VALUES (
        'mc_math_basics',
        'Fundamentos Matemáticos',
        '🔢',
        '{"math_1", "math_2"}'
    ),
    (
        'mc_physics_motion',
        'Experto en Movimiento',
        '🚀',
        '{"phys_1", "phys_2", "phys_3"}'
    ),
    (
        'mc_chemistry_bonds',
        'Químico de Enlaces',
        '⚗️',
        '{"chem_1", "chem_2", "chem_3"}'
    ),
    (
        'mc_history_mexico',
        'Historiador Mexicano',
        '🇲🇽',
        '{"hist_1", "hist_2", "hist_3"}'
    ) ON CONFLICT (id) DO NOTHING;
-- Vista: Progreso por materia
CREATE OR REPLACE VIEW v_progress_by_subject AS
SELECT lp.user_id,
    kgn.subject,
    COUNT(DISTINCT kgn.id) as total_nodes,
    COUNT(
        DISTINCT CASE
            WHEN kgn.id = ANY(lp.completed_nodes) THEN kgn.id
        END
    ) as completed_nodes,
    ROUND(
        100.0 * COUNT(
            DISTINCT CASE
                WHEN kgn.id = ANY(lp.completed_nodes) THEN kgn.id
            END
        ) / NULLIF(COUNT(DISTINCT kgn.id), 0),
        2
    ) as completion_percentage
FROM learning_progress lp
    CROSS JOIN knowledge_graph_nodes kgn
GROUP BY lp.user_id,
    kgn.subject;
-- Vista: Leaderboard de micro-credenciales
CREATE OR REPLACE VIEW v_credentials_leaderboard AS
SELECT ec.user_id,
    COUNT(*) as total_credentials,
    SUM(mc.points) as total_points,
    MAX(ec.earned_at) as last_earned
FROM earned_credentials ec
    JOIN micro_credentials mc ON mc.id = ec.credential_id
GROUP BY ec.user_id
ORDER BY total_points DESC
LIMIT 50;
-- Comentarios
COMMENT ON TABLE learning_progress IS 'Progreso de aprendizaje de cada estudiante';
COMMENT ON TABLE learning_paths IS 'Rutas de aprendizaje personalizadas generadas';
COMMENT ON TABLE knowledge_graph_nodes IS 'Nodos del grafo de conocimiento curricular';
COMMENT ON TABLE micro_credentials IS 'Definición de micro-credenciales/logros';
COMMENT ON TABLE earned_credentials IS 'Micro-credenciales ganadas por usuarios';
COMMENT ON TABLE diagnostic_assessments IS 'Evaluaciones diagnósticas de estudiantes';
COMMENT ON TABLE difficulty_adaptations IS 'Historial de adaptaciones de dificultad';
COMMENT ON TABLE spaced_repetition_reviews IS 'Datos de repaso espaciado por tema';