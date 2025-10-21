-- ========================================
-- SISTEMA DE ENCUESTAS Y VOTACIONES
-- BGE Héroes de la Patria
-- Fecha: 19 de Octubre, 2025
-- ========================================

-- Tabla principal de encuestas
CREATE TABLE IF NOT EXISTS polls (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Configuración
    type VARCHAR(50) NOT NULL DEFAULT 'single_choice', -- single_choice, multiple_choice, rating, open_ended
    allow_multiple_votes BOOLEAN DEFAULT FALSE,
    show_results_before_voting BOOLEAN DEFAULT FALSE,
    anonymous_voting BOOLEAN DEFAULT TRUE,
    require_login BOOLEAN DEFAULT FALSE,

    -- Restricciones de votación
    max_votes_per_user INTEGER DEFAULT 1,
    target_audience VARCHAR(50), -- 'public', 'students', 'teachers', 'parents', 'alumni', 'staff'

    -- Fechas
    starts_at TIMESTAMP,
    ends_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Estado y publicación
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, closed, archived
    published BOOLEAN DEFAULT FALSE,
    featured BOOLEAN DEFAULT FALSE,

    -- Metadatos
    created_by INTEGER, -- user_id del creador
    total_votes INTEGER DEFAULT 0,
    total_participants INTEGER DEFAULT 0,

    -- Configuración visual
    image_url VARCHAR(500),
    color VARCHAR(20) DEFAULT '#3498db',

    -- Indexes
    CONSTRAINT polls_status_check CHECK (status IN ('draft', 'active', 'closed', 'archived')),
    CONSTRAINT polls_type_check CHECK (type IN ('single_choice', 'multiple_choice', 'rating', 'open_ended'))
);

-- Tabla de opciones de respuesta
CREATE TABLE IF NOT EXISTS poll_options (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,

    -- Contenido de la opción
    text VARCHAR(500) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),

    -- Orden de presentación
    display_order INTEGER DEFAULT 0,

    -- Metadatos
    votes_count INTEGER DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0.00,

    created_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_poll_option UNIQUE(poll_id, text)
);

-- Tabla de votos
CREATE TABLE IF NOT EXISTS poll_votes (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id INTEGER REFERENCES poll_options(id) ON DELETE CASCADE,

    -- Información del votante
    user_id INTEGER, -- NULL si es anónimo
    voter_ip VARCHAR(45), -- IPv4 o IPv6
    voter_fingerprint VARCHAR(255), -- Browser fingerprint para votación anónima
    session_id VARCHAR(255),

    -- Detalles del voto
    rating_value INTEGER, -- Para tipo 'rating' (1-5 o 1-10)
    open_text TEXT, -- Para tipo 'open_ended'

    -- Metadatos
    voted_at TIMESTAMP DEFAULT NOW(),
    user_agent TEXT,
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'

    -- Constraints para evitar votos duplicados
    CONSTRAINT unique_user_poll_vote UNIQUE(poll_id, user_id),
    CONSTRAINT unique_ip_poll_vote UNIQUE(poll_id, voter_ip, voter_fingerprint)
);

-- Tabla de resultados agregados (para optimización)
CREATE TABLE IF NOT EXISTS poll_results (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,

    -- Resultados generales
    total_votes INTEGER DEFAULT 0,
    total_participants INTEGER DEFAULT 0,

    -- Distribución demográfica
    votes_by_students INTEGER DEFAULT 0,
    votes_by_teachers INTEGER DEFAULT 0,
    votes_by_parents INTEGER DEFAULT 0,
    votes_by_alumni INTEGER DEFAULT 0,
    votes_by_anonymous INTEGER DEFAULT 0,

    -- Metadatos temporales
    votes_today INTEGER DEFAULT 0,
    votes_this_week INTEGER DEFAULT 0,
    votes_this_month INTEGER DEFAULT 0,

    -- Tendencias
    trending_option_id INTEGER REFERENCES poll_options(id),
    average_rating DECIMAL(3,2), -- Para encuestas tipo rating

    -- Timestamps
    last_calculated_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT unique_poll_results UNIQUE(poll_id)
);

-- Tabla de categorías de encuestas
CREATE TABLE IF NOT EXISTS poll_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50), -- emoji o clase de icono
    color VARCHAR(20) DEFAULT '#3498db',
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de relación muchos a muchos: encuestas <-> categorías
CREATE TABLE IF NOT EXISTS poll_category_relations (
    poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES poll_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (poll_id, category_id)
);

-- Tabla de reportes de votos sospechosos
CREATE TABLE IF NOT EXISTS poll_vote_reports (
    id SERIAL PRIMARY KEY,
    vote_id INTEGER REFERENCES poll_votes(id) ON DELETE CASCADE,
    poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,

    -- Razón del reporte
    reason VARCHAR(255) NOT NULL,
    suspicious_pattern VARCHAR(100), -- 'duplicate_ip', 'rapid_voting', 'bot_detected', etc.

    -- Detalles
    details JSON,

    -- Estado
    status VARCHAR(50) DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
    reviewed_by INTEGER, -- user_id del revisor
    reviewed_at TIMESTAMP,

    -- Timestamps
    reported_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT vote_reports_status_check CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed'))
);

-- ========================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ========================================

-- Índices en polls
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
CREATE INDEX IF NOT EXISTS idx_polls_published ON polls(published);
CREATE INDEX IF NOT EXISTS idx_polls_featured ON polls(featured);
CREATE INDEX IF NOT EXISTS idx_polls_dates ON polls(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls(created_by);
CREATE INDEX IF NOT EXISTS idx_polls_target_audience ON polls(target_audience);

-- Índices en poll_options
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_votes_count ON poll_options(votes_count DESC);

-- Índices en poll_votes
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_option_id ON poll_votes(option_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id ON poll_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_voted_at ON poll_votes(voted_at);
CREATE INDEX IF NOT EXISTS idx_poll_votes_ip ON poll_votes(voter_ip);

-- Índices en poll_results
CREATE INDEX IF NOT EXISTS idx_poll_results_poll_id ON poll_results(poll_id);

-- Índices en poll_categories
CREATE INDEX IF NOT EXISTS idx_poll_categories_slug ON poll_categories(slug);
CREATE INDEX IF NOT EXISTS idx_poll_categories_active ON poll_categories(active);

-- ========================================
-- FUNCIONES Y TRIGGERS
-- ========================================

-- Función para actualizar timestamp updated_at
CREATE OR REPLACE FUNCTION update_poll_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp en polls
DROP TRIGGER IF EXISTS trigger_update_poll_timestamp ON polls;
CREATE TRIGGER trigger_update_poll_timestamp
    BEFORE UPDATE ON polls
    FOR EACH ROW
    EXECUTE FUNCTION update_poll_updated_at();

-- Función para actualizar contadores de votos
CREATE OR REPLACE FUNCTION update_poll_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar contador en la opción
    IF TG_OP = 'INSERT' THEN
        UPDATE poll_options
        SET votes_count = votes_count + 1
        WHERE id = NEW.option_id;

        -- Actualizar contador total en la encuesta
        UPDATE polls
        SET total_votes = total_votes + 1,
            total_participants = (
                SELECT COUNT(DISTINCT COALESCE(user_id::TEXT, voter_ip || voter_fingerprint))
                FROM poll_votes
                WHERE poll_id = NEW.poll_id
            )
        WHERE id = NEW.poll_id;

    ELSIF TG_OP = 'DELETE' THEN
        UPDATE poll_options
        SET votes_count = votes_count - 1
        WHERE id = OLD.option_id;

        UPDATE polls
        SET total_votes = total_votes - 1,
            total_participants = (
                SELECT COUNT(DISTINCT COALESCE(user_id::TEXT, voter_ip || voter_fingerprint))
                FROM poll_votes
                WHERE poll_id = OLD.poll_id
            )
        WHERE id = OLD.poll_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar contadores
DROP TRIGGER IF EXISTS trigger_update_vote_counts ON poll_votes;
CREATE TRIGGER trigger_update_vote_counts
    AFTER INSERT OR DELETE ON poll_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_poll_vote_counts();

-- Función para calcular porcentajes
CREATE OR REPLACE FUNCTION calculate_poll_percentages(p_poll_id INTEGER)
RETURNS VOID AS $$
DECLARE
    total_votes INTEGER;
BEGIN
    -- Obtener total de votos
    SELECT SUM(votes_count) INTO total_votes
    FROM poll_options
    WHERE poll_id = p_poll_id;

    -- Actualizar porcentajes
    IF total_votes > 0 THEN
        UPDATE poll_options
        SET percentage = ROUND((votes_count::DECIMAL / total_votes) * 100, 2)
        WHERE poll_id = p_poll_id;
    ELSE
        UPDATE poll_options
        SET percentage = 0.00
        WHERE poll_id = p_poll_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- DATOS INICIALES: CATEGORÍAS
-- ========================================

INSERT INTO poll_categories (name, slug, description, icon, color, display_order) VALUES
('Académico', 'academico', 'Encuestas relacionadas con temas académicos y educativos', '📚', '#3498db', 1),
('Eventos', 'eventos', 'Encuestas sobre eventos escolares y actividades', '🎉', '#9b59b6', 2),
('Instalaciones', 'instalaciones', 'Encuestas sobre infraestructura y servicios', '🏫', '#e74c3c', 3),
('Deportes', 'deportes', 'Encuestas relacionadas con actividades deportivas', '⚽', '#27ae60', 4),
('Cultura', 'cultura', 'Encuestas sobre actividades culturales y artísticas', '🎭', '#f39c12', 5),
('Servicios', 'servicios', 'Encuestas sobre servicios escolares', '🛎️', '#16a085', 6),
('General', 'general', 'Encuestas generales de la comunidad', '💬', '#95a5a6', 7)
ON CONFLICT (slug) DO NOTHING;

-- ========================================
-- VISTAS ÚTILES
-- ========================================

-- Vista de encuestas activas con estadísticas
CREATE OR REPLACE VIEW active_polls_with_stats AS
SELECT
    p.id,
    p.title,
    p.description,
    p.type,
    p.status,
    p.starts_at,
    p.ends_at,
    p.total_votes,
    p.total_participants,
    p.featured,
    p.image_url,
    p.color,
    COUNT(DISTINCT po.id) as options_count,
    CASE
        WHEN p.ends_at IS NOT NULL AND p.ends_at < NOW() THEN 'expired'
        WHEN p.starts_at IS NOT NULL AND p.starts_at > NOW() THEN 'scheduled'
        ELSE p.status
    END as computed_status
FROM polls p
LEFT JOIN poll_options po ON p.id = po.poll_id
WHERE p.published = TRUE
GROUP BY p.id
ORDER BY p.featured DESC, p.created_at DESC;

-- Vista de resultados detallados por encuesta
CREATE OR REPLACE VIEW poll_detailed_results AS
SELECT
    p.id as poll_id,
    p.title,
    p.type,
    po.id as option_id,
    po.text as option_text,
    po.votes_count,
    po.percentage,
    p.total_votes,
    p.total_participants
FROM polls p
LEFT JOIN poll_options po ON p.id = po.poll_id
ORDER BY p.id, po.display_order;

-- ========================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ========================================

COMMENT ON TABLE polls IS 'Tabla principal de encuestas y votaciones';
COMMENT ON TABLE poll_options IS 'Opciones de respuesta para cada encuesta';
COMMENT ON TABLE poll_votes IS 'Registro de votos emitidos';
COMMENT ON TABLE poll_results IS 'Resultados agregados para optimización de consultas';
COMMENT ON TABLE poll_categories IS 'Categorías para clasificar encuestas';
COMMENT ON TABLE poll_vote_reports IS 'Reportes de actividad sospechosa en votaciones';

-- ========================================
-- FINALIZACIÓN
-- ========================================

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Tablas del Sistema de Encuestas creadas exitosamente';
    RAISE NOTICE '📊 Total de tablas: 7';
    RAISE NOTICE '🔧 Total de funciones: 3';
    RAISE NOTICE '⚡ Total de triggers: 2';
    RAISE NOTICE '📈 Total de vistas: 2';
    RAISE NOTICE '📁 Total de categorías iniciales: 7';
END $$;
