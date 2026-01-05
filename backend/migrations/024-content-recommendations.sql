-- =====================================================
-- MIGRACIÓN: Sistema de Recomendación de Contenidos (Semana 15)
-- Fecha: Enero 2026
-- =====================================================
-- Tabla de recursos educativos
CREATE TABLE IF NOT EXISTS educational_resources (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(50) NOT NULL,
    topic VARCHAR(100),
    difficulty VARCHAR(20) DEFAULT 'intermedio',
    -- basico, intermedio, avanzado
    type VARCHAR(50) NOT NULL,
    -- video, lectura, ejercicio, interactivo, laboratorio, taller
    duration_minutes INTEGER DEFAULT 0,
    url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    tags TEXT [] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    view_count INTEGER DEFAULT 0,
    avg_rating DECIMAL(3, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_resources_subject ON educational_resources(subject);
CREATE INDEX IF NOT EXISTS idx_resources_difficulty ON educational_resources(difficulty);
CREATE INDEX IF NOT EXISTS idx_resources_type ON educational_resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_active ON educational_resources(is_active);
-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS user_learning_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    subject_preferences JSONB DEFAULT '{}',
    content_type_preferences JSONB DEFAULT '{}',
    difficulty_level VARCHAR(20) DEFAULT 'intermedio',
    topics_of_interest TEXT [] DEFAULT '{}',
    weak_areas JSONB DEFAULT '[]',
    learning_style VARCHAR(50),
    -- visual, auditivo, kinestesico
    preferred_session_duration INTEGER DEFAULT 30,
    -- minutos
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON user_learning_profiles(user_id);
-- Tabla de interacciones con contenido
CREATE TABLE IF NOT EXISTS content_interactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    resource_id INTEGER REFERENCES educational_resources(id),
    interaction_type VARCHAR(30) NOT NULL,
    -- view, complete, bookmark, feedback, rating
    duration_seconds INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5, 2) DEFAULT 0,
    rating INTEGER CHECK (
        rating >= 1
        AND rating <= 5
    ),
    feedback VARCHAR(50),
    -- helpful, not_helpful, too_easy, too_hard, not_relevant
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, resource_id, interaction_type)
);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON content_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_resource ON content_interactions(resource_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON content_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_date ON content_interactions(created_at);
-- Tabla de recomendaciones generadas
CREATE TABLE IF NOT EXISTS recommendation_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    recommendation_type VARCHAR(50) NOT NULL,
    -- personalized, collaborative, content-based, exploration
    resources_recommended INTEGER [] DEFAULT '{}',
    algorithm_version VARCHAR(20) DEFAULT '1.0.0',
    context JSONB DEFAULT '{}',
    was_clicked BOOLEAN DEFAULT false,
    clicked_resource_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_reclogs_user ON recommendation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_reclogs_type ON recommendation_logs(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_reclogs_date ON recommendation_logs(created_at);
-- Tabla de similitud entre usuarios (para filtrado colaborativo)
CREATE TABLE IF NOT EXISTS user_similarity (
    id SERIAL PRIMARY KEY,
    user_id_1 INTEGER NOT NULL,
    user_id_2 INTEGER NOT NULL,
    similarity_score DECIMAL(4, 3) NOT NULL,
    calculation_method VARCHAR(50) DEFAULT 'cosine',
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id_1, user_id_2)
);
CREATE INDEX IF NOT EXISTS idx_similarity_user1 ON user_similarity(user_id_1);
CREATE INDEX IF NOT EXISTS idx_similarity_score ON user_similarity(similarity_score);
-- Tabla de planes de estudio personalizados
CREATE TABLE IF NOT EXISTS personalized_study_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    subject VARCHAR(50) NOT NULL,
    current_level VARCHAR(20),
    target_level VARCHAR(20),
    steps JSONB DEFAULT '[]',
    progress_percentage DECIMAL(5, 2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'active',
    -- active, completed, paused
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    UNIQUE(user_id, subject)
);
CREATE INDEX IF NOT EXISTS idx_studyplans_user ON personalized_study_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_studyplans_status ON personalized_study_plans(status);
-- Insertar recursos educativos de ejemplo
INSERT INTO educational_resources (
        title,
        subject,
        topic,
        difficulty,
        type,
        duration_minutes,
        tags
    )
VALUES (
        'Álgebra Básica',
        'matematicas',
        'algebra',
        'basico',
        'video',
        15,
        ARRAY ['ecuaciones', 'variables']
    ),
    (
        'Ecuaciones Cuadráticas',
        'matematicas',
        'algebra',
        'intermedio',
        'ejercicio',
        30,
        ARRAY ['cuadraticas', 'factorizacion']
    ),
    (
        'Geometría Analítica',
        'matematicas',
        'geometria',
        'avanzado',
        'lectura',
        45,
        ARRAY ['coordenadas', 'rectas']
    ),
    (
        'Revolución Mexicana',
        'historia',
        'mexico_moderno',
        'basico',
        'video',
        25,
        ARRAY ['revolucion', 'madero']
    ),
    (
        'Leyes de Newton',
        'fisica',
        'mecanica',
        'basico',
        'video',
        18,
        ARRAY ['fuerza', 'movimiento']
    ),
    (
        'Tabla Periódica',
        'quimica',
        'general',
        'basico',
        'interactivo',
        15,
        ARRAY ['elementos', 'atomos']
    ) ON CONFLICT DO NOTHING;
-- Vista: Recursos populares
CREATE OR REPLACE VIEW v_popular_resources AS
SELECT r.id,
    r.title,
    r.subject,
    r.difficulty,
    r.type,
    r.view_count,
    r.avg_rating,
    COALESCE(i.interaction_count, 0) as total_interactions
FROM educational_resources r
    LEFT JOIN (
        SELECT resource_id,
            COUNT(*) as interaction_count
        FROM content_interactions
        GROUP BY resource_id
    ) i ON i.resource_id = r.id
WHERE r.is_active = true
ORDER BY r.view_count DESC,
    r.avg_rating DESC
LIMIT 20;
-- Vista: Efectividad de recomendaciones
CREATE OR REPLACE VIEW v_recommendation_effectiveness AS
SELECT recommendation_type,
    COUNT(*) as total_recommendations,
    SUM(
        CASE
            WHEN was_clicked THEN 1
            ELSE 0
        END
    ) as clicks,
    ROUND(
        100.0 * SUM(
            CASE
                WHEN was_clicked THEN 1
                ELSE 0
            END
        ) / NULLIF(COUNT(*), 0),
        2
    ) as click_rate
FROM recommendation_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY recommendation_type
ORDER BY click_rate DESC;
-- Comentarios
COMMENT ON TABLE educational_resources IS 'Catálogo de recursos educativos digitales';
COMMENT ON TABLE user_learning_profiles IS 'Perfiles de aprendizaje de estudiantes';
COMMENT ON TABLE content_interactions IS 'Historial de interacciones con contenido';
COMMENT ON TABLE recommendation_logs IS 'Log de recomendaciones generadas';
COMMENT ON TABLE user_similarity IS 'Matriz de similitud entre usuarios';
COMMENT ON TABLE personalized_study_plans IS 'Planes de estudio personalizados';