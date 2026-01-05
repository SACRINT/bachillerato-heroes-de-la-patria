-- =====================================================
-- MIGRACIÓN: Knowledge Transfer (Semana 35)
-- Documentación y Transferencia de Conocimiento
-- Fecha: Enero 2026
-- Fase 5: Consolidación, Ética y Futuro
-- =====================================================
-- Tabla de documentación técnica
CREATE TABLE IF NOT EXISTS technical_documentation (
    id SERIAL PRIMARY KEY,
    doc_id VARCHAR(100) UNIQUE NOT NULL,
    doc_type VARCHAR(50) NOT NULL,
    -- architecture, mlops, api_reference, etc.
    title VARCHAR(300) NOT NULL,
    version VARCHAR(20),
    content TEXT,
    sections JSONB,
    diagrams TEXT [],
    audience TEXT [],
    status VARCHAR(30) DEFAULT 'draft',
    -- draft, review, approved, published, outdated
    last_reviewed TIMESTAMP,
    reviewed_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_doc_type ON technical_documentation(doc_type);
CREATE INDEX IF NOT EXISTS idx_doc_status ON technical_documentation(status);
-- Tabla de manuales de usuario
CREATE TABLE IF NOT EXISTS user_manuals (
    id SERIAL PRIMARY KEY,
    manual_id VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    audience VARCHAR(50) NOT NULL,
    -- teacher, admin, student, parent
    chapters TEXT [],
    total_pages INTEGER,
    formats TEXT [],
    -- PDF, HTML, Mobile
    language VARCHAR(10) DEFAULT 'es-MX',
    version VARCHAR(20),
    status VARCHAR(30) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_manual_audience ON user_manuals(audience);
CREATE INDEX IF NOT EXISTS idx_manual_status ON user_manuals(status);
-- Tabla de tutoriales en video
CREATE TABLE IF NOT EXISTS video_tutorials (
    id SERIAL PRIMARY KEY,
    video_id VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    duration VARCHAR(20),
    audience TEXT [],
    topics TEXT [],
    generated_by_ai BOOLEAN DEFAULT false,
    platform VARCHAR(100),
    url VARCHAR(500),
    views INTEGER DEFAULT 0,
    rating DECIMAL(3, 2),
    status VARCHAR(30) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_video_ai ON video_tutorials(generated_by_ai);
CREATE INDEX IF NOT EXISTS idx_video_views ON video_tutorials(views);
-- Tabla de base de conocimiento
CREATE TABLE IF NOT EXISTS knowledge_base_articles (
    id SERIAL PRIMARY KEY,
    article_id VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(300) NOT NULL,
    category VARCHAR(100) NOT NULL,
    -- Troubleshooting, How-To, Architecture, Reference
    content TEXT,
    tags TEXT [],
    author VARCHAR(100),
    views INTEGER DEFAULT 0,
    helpful_votes INTEGER DEFAULT 0,
    status VARCHAR(30) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_kb_category ON knowledge_base_articles(category);
CREATE INDEX IF NOT EXISTS idx_kb_views ON knowledge_base_articles(views);
-- Tabla de Brown Bag Sessions
CREATE TABLE IF NOT EXISTS brown_bag_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    topic VARCHAR(300) NOT NULL,
    scheduled_date TIMESTAMP,
    duration_minutes INTEGER DEFAULT 45,
    presenter VARCHAR(200),
    agenda JSONB,
    target_audience TEXT [],
    materials TEXT [],
    registered_attendees INTEGER DEFAULT 0,
    actual_attendees INTEGER,
    recording_url VARCHAR(500),
    feedback_score DECIMAL(3, 2),
    status VARCHAR(30) DEFAULT 'scheduled',
    -- scheduled, in_progress, completed, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bbs_date ON brown_bag_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_bbs_status ON brown_bag_sessions(status);
-- Tabla de ADRs (Architecture Decision Records)
CREATE TABLE IF NOT EXISTS architecture_decisions (
    id SERIAL PRIMARY KEY,
    adr_id VARCHAR(100) UNIQUE NOT NULL,
    adr_number INTEGER UNIQUE NOT NULL,
    title VARCHAR(300) NOT NULL,
    status VARCHAR(30) DEFAULT 'proposed',
    -- proposed, accepted, deprecated, superseded
    context TEXT,
    decision TEXT,
    consequences TEXT [],
    alternatives JSONB,
    related_adrs INTEGER [],
    authors TEXT [],
    decision_date DATE,
    superseded_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_adr_number ON architecture_decisions(adr_number);
CREATE INDEX IF NOT EXISTS idx_adr_status ON architecture_decisions(status);
-- Tabla de guías de onboarding
CREATE TABLE IF NOT EXISTS onboarding_guides (
    id SERIAL PRIMARY KEY,
    guide_id VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    -- developer, admin, teacher
    title VARCHAR(200) NOT NULL,
    duration_days INTEGER,
    steps JSONB NOT NULL,
    checkpoints JSONB,
    buddy_required BOOLEAN DEFAULT true,
    completion_rate DECIMAL(5, 2),
    avg_time_to_complete VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_onboard_role ON onboarding_guides(role);
-- Tabla de progreso de onboarding
CREATE TABLE IF NOT EXISTS onboarding_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    guide_id VARCHAR(100) REFERENCES onboarding_guides(guide_id),
    current_step INTEGER DEFAULT 1,
    completed_steps INTEGER [],
    buddy_id INTEGER,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(30) DEFAULT 'in_progress' -- in_progress, completed, paused
);
CREATE INDEX IF NOT EXISTS idx_onboard_prog_user ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboard_prog_status ON onboarding_progress(status);
-- Tabla de paquetes de documentación
CREATE TABLE IF NOT EXISTS documentation_packages (
    id SERIAL PRIMARY KEY,
    package_id VARCHAR(100) UNIQUE NOT NULL,
    version VARCHAR(20) NOT NULL,
    deliverables JSONB NOT NULL,
    summary JSONB,
    completeness DECIMAL(4, 3),
    handoff_ready BOOLEAN DEFAULT false,
    recipient VARCHAR(200),
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_docpkg_version ON documentation_packages(version);
-- Vista: Estado de documentación
CREATE OR REPLACE VIEW v_documentation_status AS
SELECT doc_type,
    COUNT(*) as total_docs,
    COUNT(*) FILTER (
        WHERE status = 'published'
    ) as published,
    COUNT(*) FILTER (
        WHERE status = 'outdated'
    ) as outdated
FROM technical_documentation
GROUP BY doc_type;
-- Vista: Brown Bag próximas
CREATE OR REPLACE VIEW v_upcoming_brown_bags AS
SELECT session_id,
    topic,
    scheduled_date,
    presenter,
    registered_attendees
FROM brown_bag_sessions
WHERE status = 'scheduled'
    AND scheduled_date > NOW()
ORDER BY scheduled_date
LIMIT 10;
-- Comentarios
COMMENT ON TABLE technical_documentation IS 'Documentación técnica del sistema';
COMMENT ON TABLE user_manuals IS 'Manuales de usuario por audiencia';
COMMENT ON TABLE video_tutorials IS 'Tutoriales en video';
COMMENT ON TABLE knowledge_base_articles IS 'Artículos de base de conocimiento';
COMMENT ON TABLE brown_bag_sessions IS 'Sesiones Brown Bag de transferencia';
COMMENT ON TABLE architecture_decisions IS 'Registros de decisiones de arquitectura (ADRs)';
COMMENT ON TABLE onboarding_guides IS 'Guías de onboarding por rol';
COMMENT ON TABLE onboarding_progress IS 'Progreso de onboarding de usuarios';
COMMENT ON TABLE documentation_packages IS 'Paquetes de documentación entregables';