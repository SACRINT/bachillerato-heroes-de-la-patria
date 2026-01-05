-- =====================================================
-- MIGRACIÓN: Innovation R&D (Semana 32)
-- Innovación - Nuevas Fronteras
-- Fecha: Enero 2026
-- Fase 5: Consolidación, Ética y Futuro
-- =====================================================
-- Tabla de tecnologías emergentes
CREATE TABLE IF NOT EXISTS emerging_technologies (
    id SERIAL PRIMARY KEY,
    tech_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    -- architecture, video, ar, agents, voice, federated, emotional
    description TEXT,
    status VARCHAR(30) DEFAULT 'research',
    -- research, evaluation, pilot, production, archived
    potential_use TEXT,
    feasibility DECIMAL(4, 3),
    papers TEXT [],
    pros TEXT [],
    cons TEXT [],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tech_category ON emerging_technologies(category);
CREATE INDEX IF NOT EXISTS idx_tech_status ON emerging_technologies(status);
-- Tabla de proyectos de innovación
CREATE TABLE IF NOT EXISTS innovation_projects (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(100) UNIQUE NOT NULL,
    tech_id VARCHAR(100) REFERENCES emerging_technologies(tech_id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(30) DEFAULT 'proposal',
    -- proposal, approved, in_progress, completed, cancelled
    priority INTEGER DEFAULT 5,
    timeline VARCHAR(50),
    budget DECIMAL(12, 2),
    expected_roi VARCHAR(50),
    team JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_project_status ON innovation_projects(status);
CREATE INDEX IF NOT EXISTS idx_project_priority ON innovation_projects(priority);
-- Tabla de PoC (Proof of Concept)
CREATE TABLE IF NOT EXISTS poc_designs (
    id SERIAL PRIMARY KEY,
    poc_id VARCHAR(100) UNIQUE NOT NULL,
    project_id VARCHAR(100) REFERENCES innovation_projects(project_id),
    phases JSONB NOT NULL,
    total_duration VARCHAR(50),
    budget DECIMAL(10, 2),
    team JSONB,
    success_criteria TEXT [],
    risks JSONB,
    status VARCHAR(30) DEFAULT 'designed',
    -- designed, approved, in_progress, completed, failed
    technical_validation JSONB,
    ethical_validation JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_poc_status ON poc_designs(status);
-- Tabla de evaluaciones de tecnología
CREATE TABLE IF NOT EXISTS technology_evaluations (
    id SERIAL PRIMARY KEY,
    evaluation_id VARCHAR(100) UNIQUE NOT NULL,
    tech_id VARCHAR(100) REFERENCES emerging_technologies(tech_id),
    evaluation_type VARCHAR(50) NOT NULL,
    -- feasibility, ethical, cost, impact
    score DECIMAL(4, 2),
    criteria JSONB,
    findings TEXT [],
    recommendations TEXT [],
    evaluator VARCHAR(100),
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_eval_tech ON technology_evaluations(tech_id);
CREATE INDEX IF NOT EXISTS idx_eval_type ON technology_evaluations(evaluation_type);
-- Tabla de prototipos
CREATE TABLE IF NOT EXISTS innovation_prototypes (
    id SERIAL PRIMARY KEY,
    prototype_id VARCHAR(100) UNIQUE NOT NULL,
    poc_id VARCHAR(100) REFERENCES poc_designs(poc_id),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    -- video, ar_experience, agent, voice, model
    concept JSONB,
    mock_output JSONB,
    estimated_cost DECIMAL(10, 2),
    feasibility DECIMAL(4, 3),
    ethical_considerations TEXT [],
    status VARCHAR(30) DEFAULT 'concept',
    -- concept, development, testing, validated, archived
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_proto_type ON innovation_prototypes(type);
CREATE INDEX IF NOT EXISTS idx_proto_status ON innovation_prototypes(status);
-- Tabla de hackathons
CREATE TABLE IF NOT EXISTS innovation_hackathons (
    id SERIAL PRIMARY KEY,
    hackathon_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    theme VARCHAR(200),
    event_date DATE,
    duration_hours INTEGER,
    participants_count INTEGER,
    teams JSONB,
    winning_ideas JSONB,
    status VARCHAR(30) DEFAULT 'planned',
    -- planned, in_progress, completed
    outcomes TEXT [],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_hackathon_date ON innovation_hackathons(event_date);
CREATE INDEX IF NOT EXISTS idx_hackathon_status ON innovation_hackathons(status);
-- Tabla de propuestas de innovación
CREATE TABLE IF NOT EXISTS innovation_proposals (
    id SERIAL PRIMARY KEY,
    proposal_id VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    summary TEXT,
    priority INTEGER,
    timeline VARCHAR(50),
    budget DECIMAL(12, 2),
    expected_roi VARCHAR(50),
    stakeholders TEXT [],
    status VARCHAR(30) DEFAULT 'draft',
    -- draft, submitted, under_review, approved, rejected
    submitted_at TIMESTAMP,
    decision_at TIMESTAMP,
    decision_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_proposal_status ON innovation_proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposal_priority ON innovation_proposals(priority);
-- Insertar tecnologías emergentes iniciales
INSERT INTO emerging_technologies (
        tech_id,
        name,
        category,
        description,
        status,
        feasibility
    )
VALUES (
        'mamba',
        'Mamba (State Space Models)',
        'architecture',
        'Arquitectura alternativa a Transformers con complejidad lineal',
        'research',
        0.65
    ),
    (
        'rwkv',
        'RWKV',
        'architecture',
        'Combina ventajas de RNN y Transformers',
        'research',
        0.70
    ),
    (
        'moe',
        'Mixture of Experts',
        'architecture',
        'Activación selectiva de sub-redes especializadas',
        'evaluation',
        0.75
    ),
    (
        'video_gen',
        'Video Educativo Generativo',
        'video',
        'Videos educativos generados por IA',
        'evaluation',
        0.80
    ),
    (
        'ar_math',
        'AR Matemáticas',
        'ar',
        'Tutor de matemáticas con realidad aumentada',
        'evaluation',
        0.78
    ),
    (
        'langgraph',
        'LangGraph Agents',
        'agents',
        'Agentes autónomos estructurados',
        'evaluation',
        0.82
    ),
    (
        'voice_clone',
        'Voice Cloning Educativo',
        'voice',
        'Clonación de voz para contenido educativo',
        'research',
        0.75
    ),
    (
        'federated',
        'Federated Learning',
        'federated',
        'Entrenamiento distribuido preservando privacidad',
        'research',
        0.50
    ) ON CONFLICT (tech_id) DO NOTHING;
-- Vista: Pipeline de innovación
CREATE OR REPLACE VIEW v_innovation_pipeline AS
SELECT status,
    COUNT(*) as count,
    AVG(budget) as avg_budget
FROM innovation_projects
GROUP BY status
ORDER BY CASE
        status
        WHEN 'in_progress' THEN 1
        WHEN 'approved' THEN 2
        WHEN 'proposal' THEN 3
        ELSE 4
    END;
-- Vista: Tecnologías por categoría
CREATE OR REPLACE VIEW v_technologies_by_category AS
SELECT category,
    COUNT(*) as count,
    AVG(feasibility) as avg_feasibility,
    COUNT(*) FILTER (
        WHERE status = 'pilot'
            OR status = 'production'
    ) as in_production
FROM emerging_technologies
GROUP BY category
ORDER BY avg_feasibility DESC;
-- Comentarios
COMMENT ON TABLE emerging_technologies IS 'Tecnologías emergentes bajo evaluación';
COMMENT ON TABLE innovation_projects IS 'Proyectos de innovación';
COMMENT ON TABLE poc_designs IS 'Diseños de Proof of Concept';
COMMENT ON TABLE technology_evaluations IS 'Evaluaciones de tecnología';
COMMENT ON TABLE innovation_prototypes IS 'Prototipos de innovación';
COMMENT ON TABLE innovation_hackathons IS 'Hackathons de innovación';
COMMENT ON TABLE innovation_proposals IS 'Propuestas de innovación';