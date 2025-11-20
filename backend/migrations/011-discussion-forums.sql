-- ========================================
-- MIGRACIÓN: Sistema de Foros de Discusión
-- BGE Héroes de la Patria
-- FASE 2 - Semana 15-16
-- ========================================

-- ========================================
-- TABLA: Categorías de Foros
-- ========================================
CREATE TABLE IF NOT EXISTS forum_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'fa-comments',
    color VARCHAR(20) DEFAULT '#3498db',

    -- Organización
    parent_id INTEGER REFERENCES forum_categories(id),
    sort_order INTEGER DEFAULT 0,

    -- Permisos
    allowed_roles TEXT[] DEFAULT ARRAY['estudiante', 'docente', 'padre', 'admin'],
    requires_approval BOOLEAN DEFAULT false,

    -- Estado
    is_active BOOLEAN DEFAULT true,
    is_locked BOOLEAN DEFAULT false,

    -- Estadísticas
    topic_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    last_post_at TIMESTAMP WITH TIME ZONE,
    last_post_user_id INTEGER REFERENCES usuarios(id),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Temas/Hilos
-- ========================================
CREATE TABLE IF NOT EXISTS forum_topics (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,

    -- Información básica
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(300) UNIQUE,
    content TEXT NOT NULL,

    -- Autor
    author_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Tipo
    topic_type VARCHAR(20) DEFAULT 'discussion', -- discussion, question, announcement, poll

    -- Estado
    status VARCHAR(20) DEFAULT 'open',           -- open, closed, solved, archived
    is_pinned BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,

    -- Moderación
    moderated_by INTEGER REFERENCES usuarios(id),
    moderated_at TIMESTAMP WITH TIME ZONE,
    moderation_reason TEXT,

    -- Estadísticas
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    participant_count INTEGER DEFAULT 1,

    -- Solución (para preguntas)
    solution_post_id INTEGER,
    solved_at TIMESTAMP WITH TIME ZONE,

    -- Gamificación
    xp_reward INTEGER DEFAULT 5,                 -- XP por crear tema
    coins_reward INTEGER DEFAULT 2,              -- IACoins por crear tema

    -- SEO y búsqueda
    tags JSONB,
    search_vector tsvector,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_reply_at TIMESTAMP WITH TIME ZONE,
    last_reply_user_id INTEGER REFERENCES usuarios(id)
);

-- ========================================
-- TABLA: Respuestas/Posts
-- ========================================
CREATE TABLE IF NOT EXISTS forum_posts (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
    parent_post_id INTEGER REFERENCES forum_posts(id) ON DELETE CASCADE,

    -- Contenido
    content TEXT NOT NULL,

    -- Autor
    author_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Estado
    is_solution BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    is_edited BOOLEAN DEFAULT false,
    edit_count INTEGER DEFAULT 0,

    -- Moderación
    is_hidden BOOLEAN DEFAULT false,
    hidden_by INTEGER REFERENCES usuarios(id),
    hidden_at TIMESTAMP WITH TIME ZONE,
    hidden_reason TEXT,

    -- Interacciones
    like_count INTEGER DEFAULT 0,
    dislike_count INTEGER DEFAULT 0,
    report_count INTEGER DEFAULT 0,

    -- Gamificación
    xp_earned INTEGER DEFAULT 0,
    coins_earned INTEGER DEFAULT 0,

    -- Editor info
    edited_at TIMESTAMP WITH TIME ZONE,
    edited_by INTEGER REFERENCES usuarios(id),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Reacciones (Likes/Dislikes)
-- ========================================
CREATE TABLE IF NOT EXISTS forum_reactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Puede ser a topic o post
    topic_id INTEGER REFERENCES forum_topics(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES forum_posts(id) ON DELETE CASCADE,

    reaction_type VARCHAR(20) NOT NULL,          -- like, dislike, helpful, insightful, funny

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Solo una reacción por usuario por contenido
    UNIQUE(user_id, topic_id),
    UNIQUE(user_id, post_id),
    CHECK (topic_id IS NOT NULL OR post_id IS NOT NULL)
);

-- ========================================
-- TABLA: Suscripciones a Temas
-- ========================================
CREATE TABLE IF NOT EXISTS forum_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    topic_id INTEGER NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,

    -- Configuración
    notify_email BOOLEAN DEFAULT true,
    notify_push BOOLEAN DEFAULT true,

    -- Estado
    is_muted BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, topic_id)
);

-- ========================================
-- TABLA: Reportes de Contenido
-- ========================================
CREATE TABLE IF NOT EXISTS forum_reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Contenido reportado
    topic_id INTEGER REFERENCES forum_topics(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES forum_posts(id) ON DELETE CASCADE,

    -- Detalles
    reason VARCHAR(50) NOT NULL,                 -- spam, offensive, harassment, inappropriate, other
    description TEXT,

    -- Estado
    status VARCHAR(20) DEFAULT 'pending',        -- pending, reviewed, resolved, dismissed
    reviewed_by INTEGER REFERENCES usuarios(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CHECK (topic_id IS NOT NULL OR post_id IS NOT NULL)
);

-- ========================================
-- TABLA: Menciones de Usuarios
-- ========================================
CREATE TABLE IF NOT EXISTS forum_mentions (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    mentioned_user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Estado
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(post_id, mentioned_user_id)
);

-- ========================================
-- TABLA: Encuestas en Foros
-- ========================================
CREATE TABLE IF NOT EXISTS forum_polls (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,

    question VARCHAR(500) NOT NULL,
    options JSONB NOT NULL,                      -- [{id: 1, text: "Opción A", votes: 0}]

    -- Configuración
    allows_multiple BOOLEAN DEFAULT false,
    ends_at TIMESTAMP WITH TIME ZONE,
    show_results_before_vote BOOLEAN DEFAULT false,

    -- Estadísticas
    total_votes INTEGER DEFAULT 0,
    voter_count INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Votos de Encuestas
-- ========================================
CREATE TABLE IF NOT EXISTS forum_poll_votes (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER NOT NULL REFERENCES forum_polls(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    option_ids INTEGER[] NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(poll_id, user_id)
);

-- ========================================
-- TABLA: Estadísticas de Usuario en Foros
-- ========================================
CREATE TABLE IF NOT EXISTS forum_user_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE UNIQUE,

    -- Contadores
    topics_created INTEGER DEFAULT 0,
    posts_created INTEGER DEFAULT 0,
    solutions_provided INTEGER DEFAULT 0,
    likes_received INTEGER DEFAULT 0,
    likes_given INTEGER DEFAULT 0,

    -- Gamificación
    total_xp_earned INTEGER DEFAULT 0,
    total_coins_earned INTEGER DEFAULT 0,

    -- Actividad
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Reputación
    reputation_score INTEGER DEFAULT 0,
    reputation_level VARCHAR(50) DEFAULT 'Novato',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ÍNDICES DE PERFORMANCE
-- ========================================

-- Categorías
CREATE INDEX IF NOT EXISTS idx_forum_categories_parent ON forum_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_forum_categories_slug ON forum_categories(slug);
CREATE INDEX IF NOT EXISTS idx_forum_categories_active ON forum_categories(is_active);

-- Topics
CREATE INDEX IF NOT EXISTS idx_forum_topics_category ON forum_topics(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_author ON forum_topics(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_status ON forum_topics(status);
CREATE INDEX IF NOT EXISTS idx_forum_topics_pinned ON forum_topics(is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_topics_created ON forum_topics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_topics_last_reply ON forum_topics(last_reply_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_topics_views ON forum_topics(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_forum_topics_search ON forum_topics USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_forum_topics_tags ON forum_topics USING GIN(tags);

-- Posts
CREATE INDEX IF NOT EXISTS idx_forum_posts_topic ON forum_posts(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_parent ON forum_posts(parent_post_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON forum_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_forum_posts_solution ON forum_posts(is_solution);

-- Reactions
CREATE INDEX IF NOT EXISTS idx_forum_reactions_topic ON forum_reactions(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_reactions_post ON forum_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_reactions_user ON forum_reactions(user_id);

-- Subscriptions
CREATE INDEX IF NOT EXISTS idx_forum_subscriptions_user ON forum_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_subscriptions_topic ON forum_subscriptions(topic_id);

-- Reports
CREATE INDEX IF NOT EXISTS idx_forum_reports_status ON forum_reports(status);
CREATE INDEX IF NOT EXISTS idx_forum_reports_topic ON forum_reports(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_reports_post ON forum_reports(post_id);

-- Mentions
CREATE INDEX IF NOT EXISTS idx_forum_mentions_user ON forum_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_forum_mentions_post ON forum_mentions(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_mentions_unread ON forum_mentions(mentioned_user_id, is_read);

-- ========================================
-- TRIGGERS
-- ========================================

-- Actualizar search_vector para búsqueda full-text
CREATE OR REPLACE FUNCTION forum_topics_search_trigger()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('spanish', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_forum_topics_search
BEFORE INSERT OR UPDATE ON forum_topics
FOR EACH ROW EXECUTE FUNCTION forum_topics_search_trigger();

-- Actualizar contadores de categoría
CREATE OR REPLACE FUNCTION update_category_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_categories SET topic_count = topic_count + 1 WHERE id = NEW.category_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_categories SET topic_count = GREATEST(0, topic_count - 1) WHERE id = OLD.category_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_category_topic_count
AFTER INSERT OR DELETE ON forum_topics
FOR EACH ROW EXECUTE FUNCTION update_category_counts();

-- Actualizar contadores de topic cuando hay posts
CREATE OR REPLACE FUNCTION update_topic_post_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_topics SET
            reply_count = reply_count + 1,
            last_reply_at = NEW.created_at,
            last_reply_user_id = NEW.author_id
        WHERE id = NEW.topic_id;

        UPDATE forum_categories SET
            post_count = post_count + 1,
            last_post_at = NEW.created_at,
            last_post_user_id = NEW.author_id
        WHERE id = (SELECT category_id FROM forum_topics WHERE id = NEW.topic_id);
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_topics SET reply_count = GREATEST(0, reply_count - 1) WHERE id = OLD.topic_id;
        UPDATE forum_categories SET post_count = GREATEST(0, post_count - 1)
        WHERE id = (SELECT category_id FROM forum_topics WHERE id = OLD.topic_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_topic_post_count
AFTER INSERT OR DELETE ON forum_posts
FOR EACH ROW EXECUTE FUNCTION update_topic_post_count();

-- ========================================
-- DATOS INICIALES: Categorías de Foro
-- ========================================
INSERT INTO forum_categories (name, slug, description, icon, color, sort_order) VALUES
    ('Anuncios Oficiales', 'anuncios', 'Comunicados importantes de la institución', 'fa-bullhorn', '#e74c3c', 1),
    ('Ayuda Académica', 'ayuda-academica', 'Preguntas y respuestas sobre materias', 'fa-question-circle', '#3498db', 2),
    ('Matemáticas', 'matematicas', 'Dudas sobre álgebra, cálculo, geometría', 'fa-calculator', '#9b59b6', 3),
    ('Ciencias', 'ciencias', 'Física, Química, Biología', 'fa-flask', '#27ae60', 4),
    ('Humanidades', 'humanidades', 'Historia, Literatura, Filosofía', 'fa-book', '#f39c12', 5),
    ('Idiomas', 'idiomas', 'Inglés, Francés, otros idiomas', 'fa-language', '#1abc9c', 6),
    ('Tecnología', 'tecnologia', 'Informática, programación, software', 'fa-laptop-code', '#2c3e50', 7),
    ('Proyectos Colaborativos', 'proyectos', 'Busca compañeros para proyectos', 'fa-users', '#8e44ad', 8),
    ('Orientación Vocacional', 'orientacion', 'Carreras, universidades, becas', 'fa-compass', '#16a085', 9),
    ('Vida Estudiantil', 'vida-estudiantil', 'Eventos, actividades, convivencia', 'fa-graduation-cap', '#e91e63', 10),
    ('Recursos y Material', 'recursos', 'Comparte apuntes, guías, tutoriales', 'fa-share-alt', '#00bcd4', 11),
    ('Sugerencias', 'sugerencias', 'Ideas para mejorar la plataforma', 'fa-lightbulb', '#ff9800', 12);

-- Subcategorías de Ayuda Académica
UPDATE forum_categories SET parent_id = (SELECT id FROM forum_categories WHERE slug = 'ayuda-academica') WHERE slug IN ('matematicas', 'ciencias', 'humanidades', 'idiomas', 'tecnologia');

-- ========================================
-- NIVELES DE REPUTACIÓN
-- ========================================
-- Los niveles se asignan basados en reputation_score:
-- 0-49: Novato
-- 50-199: Aprendiz
-- 200-499: Participante
-- 500-999: Contribuidor
-- 1000-2499: Experto
-- 2500-4999: Maestro
-- 5000+: Leyenda

-- ========================================
-- COMENTARIOS
-- ========================================
COMMENT ON TABLE forum_categories IS 'Categorías organizacionales del foro';
COMMENT ON TABLE forum_topics IS 'Hilos de discusión iniciados por usuarios';
COMMENT ON TABLE forum_posts IS 'Respuestas dentro de los temas';
COMMENT ON TABLE forum_reactions IS 'Likes y otras reacciones a contenido';
COMMENT ON TABLE forum_subscriptions IS 'Usuarios suscritos a temas';
COMMENT ON TABLE forum_reports IS 'Reportes de contenido inapropiado';
COMMENT ON TABLE forum_mentions IS 'Menciones @usuario en posts';
COMMENT ON TABLE forum_polls IS 'Encuestas integradas en temas';
COMMENT ON TABLE forum_user_stats IS 'Estadísticas y reputación de usuarios';

COMMENT ON COLUMN forum_topics.topic_type IS 'discussion, question, announcement, poll';
COMMENT ON COLUMN forum_topics.status IS 'open, closed, solved, archived';
COMMENT ON COLUMN forum_reactions.reaction_type IS 'like, dislike, helpful, insightful, funny';

-- ========================================
-- FIN DE MIGRACIÓN
-- ========================================
