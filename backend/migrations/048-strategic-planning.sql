-- =====================================================
-- MIGRACIÓN: Strategic Planning (Semana 39)
-- Planificación Estratégica Año 2
-- Fecha: Enero 2026
-- Fase 6: Cierre, Análisis y Planificación Futura
-- =====================================================
-- Tabla de objetivos de alto nivel
CREATE TABLE IF NOT EXISTS strategic_objectives (
    id SERIAL PRIMARY KEY,
    objective_id VARCHAR(20) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    category VARCHAR(100) NOT NULL,
    objective TEXT NOT NULL,
    kpis TEXT [],
    priority VARCHAR(20),
    owner VARCHAR(100),
    status VARCHAR(30) DEFAULT 'active',
    defined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_so_cycle ON strategic_objectives(cycle_year);
CREATE INDEX IF NOT EXISTS idx_so_category ON strategic_objectives(category);
-- Tabla de evaluación de necesidades
CREATE TABLE IF NOT EXISTS business_needs_evaluations (
    id SERIAL PRIMARY KEY,
    evaluation_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    stakeholder_inputs JSONB,
    market_trends JSONB,
    competitor_analysis JSONB,
    prioritized_needs JSONB,
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bne_cycle ON business_needs_evaluations(cycle_year);
-- Tabla de roadmaps
CREATE TABLE IF NOT EXISTS year_roadmaps (
    id SERIAL PRIMARY KEY,
    roadmap_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    quarters JSONB NOT NULL,
    milestones JSONB,
    status VARCHAR(30) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_yr_cycle ON year_roadmaps(cycle_year);
CREATE INDEX IF NOT EXISTS idx_yr_status ON year_roadmaps(status);
-- Tabla de planes de presupuesto
CREATE TABLE IF NOT EXISTS budget_plans (
    id SERIAL PRIMARY KEY,
    budget_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    total_budget DECIMAL(12, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    allocation JSONB NOT NULL,
    comparison JSONB,
    approval_status VARCHAR(30) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bp_cycle ON budget_plans(cycle_year);
CREATE INDEX IF NOT EXISTS idx_bp_status ON budget_plans(approval_status);
-- Tabla de planes de infraestructura
CREATE TABLE IF NOT EXISTS infrastructure_expansion_plans (
    id SERIAL PRIMARY KEY,
    plan_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    current_state JSONB,
    projected_growth JSONB,
    expansion_plan JSONB NOT NULL,
    total_additional_cost DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_iep_cycle ON infrastructure_expansion_plans(cycle_year);
-- Tabla de planes de contratación
CREATE TABLE IF NOT EXISTS hiring_plans (
    id SERIAL PRIMARY KEY,
    plan_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    current_team JSONB,
    proposed_hires JSONB NOT NULL,
    training_needs JSONB,
    total_cost DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_hp_cycle ON hiring_plans(cycle_year);
-- Tabla de KPIs de IA
CREATE TABLE IF NOT EXISTS ai_kpi_definitions (
    id SERIAL PRIMARY KEY,
    kpis_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    kpi_name VARCHAR(100) NOT NULL,
    current_value DECIMAL(10, 4),
    target_value DECIMAL(10, 4),
    improvement VARCHAR(20),
    unit VARCHAR(20),
    owner VARCHAR(100),
    defined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_akd_cycle ON ai_kpi_definitions(cycle_year);
CREATE INDEX IF NOT EXISTS idx_akd_kpi ON ai_kpi_definitions(kpi_name);
-- Tabla de estrategia de datos
CREATE TABLE IF NOT EXISTS data_strategies (
    id SERIAL PRIMARY KEY,
    strategy_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    pillars TEXT [],
    initiatives TEXT [],
    governance JSONB,
    status VARCHAR(30) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ds_cycle ON data_strategies(cycle_year);
-- Tabla de actualizaciones tecnológicas
CREATE TABLE IF NOT EXISTS technology_upgrade_plans (
    id SERIAL PRIMARY KEY,
    plan_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    upgrades JSONB NOT NULL,
    deprecated TEXT [],
    risk_assessment VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tup_cycle ON technology_upgrade_plans(cycle_year);
-- Tabla de proyectos de innovación
CREATE TABLE IF NOT EXISTS innovation_projects (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    project_name VARCHAR(200) NOT NULL,
    feasibility VARCHAR(20),
    impact VARCHAR(20),
    priority INTEGER,
    status VARCHAR(30) DEFAULT 'proposed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ip_cycle ON innovation_projects(cycle_year);
CREATE INDEX IF NOT EXISTS idx_ip_priority ON innovation_projects(priority);
-- Tabla de validaciones de stakeholders
CREATE TABLE IF NOT EXISTS stakeholder_validations (
    id SERIAL PRIMARY KEY,
    validation_id VARCHAR(100) UNIQUE NOT NULL,
    plan_id VARCHAR(100) NOT NULL,
    stakeholder_name VARCHAR(200) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending',
    feedback TEXT,
    validated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sv_plan ON stakeholder_validations(plan_id);
CREATE INDEX IF NOT EXISTS idx_sv_status ON stakeholder_validations(status);
-- Tabla de cronogramas macro
CREATE TABLE IF NOT EXISTS macro_schedules (
    id SERIAL PRIMARY KEY,
    schedule_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    phases JSONB NOT NULL,
    checkpoints JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ms_cycle ON macro_schedules(cycle_year);
-- Tabla de planes estratégicos consolidados
CREATE TABLE IF NOT EXISTS strategic_plans (
    id SERIAL PRIMARY KEY,
    plan_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    sections JSONB NOT NULL,
    status VARCHAR(30) DEFAULT 'draft',
    next_steps TEXT [],
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sp_cycle ON strategic_plans(cycle_year);
CREATE INDEX IF NOT EXISTS idx_sp_status ON strategic_plans(status);
-- Vista: Resumen de presupuesto por ciclo
CREATE OR REPLACE VIEW v_budget_summary AS
SELECT cycle_year,
    total_budget,
    currency,
    approval_status,
    created_at
FROM budget_plans
ORDER BY created_at DESC;
-- Vista: Objetivos activos por categoría
CREATE OR REPLACE VIEW v_active_objectives AS
SELECT cycle_year,
    category,
    COUNT(*) as objective_count,
    array_agg(objective) as objectives
FROM strategic_objectives
WHERE status = 'active'
GROUP BY cycle_year,
    category;
-- Comentarios
COMMENT ON TABLE strategic_objectives IS 'Objetivos estratégicos de alto nivel';
COMMENT ON TABLE business_needs_evaluations IS 'Evaluaciones de necesidades del negocio';
COMMENT ON TABLE year_roadmaps IS 'Roadmaps anuales';
COMMENT ON TABLE budget_plans IS 'Planes de presupuesto';
COMMENT ON TABLE infrastructure_expansion_plans IS 'Planes de expansión de infraestructura';
COMMENT ON TABLE hiring_plans IS 'Planes de contratación';
COMMENT ON TABLE ai_kpi_definitions IS 'Definiciones de KPIs de IA';
COMMENT ON TABLE data_strategies IS 'Estrategias de datos';
COMMENT ON TABLE technology_upgrade_plans IS 'Planes de actualización tecnológica';
COMMENT ON TABLE innovation_projects IS 'Proyectos de innovación';
COMMENT ON TABLE stakeholder_validations IS 'Validaciones de stakeholders';
COMMENT ON TABLE macro_schedules IS 'Cronogramas macro';
COMMENT ON TABLE strategic_plans IS 'Planes estratégicos consolidados';