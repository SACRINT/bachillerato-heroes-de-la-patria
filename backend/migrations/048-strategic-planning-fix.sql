-- =====================================================
-- CORRECCIÓN: Strategic Planning (048) - Solo tablas existentes
-- =====================================================
-- Vistas
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'budget_plans'
        AND column_name = 'cycle_year'
) THEN EXECUTE '
        CREATE OR REPLACE VIEW v_budget_summary AS
        SELECT cycle_year,
            total_budget,
            currency,
            approval_status,
            created_at
        FROM budget_plans
        ORDER BY created_at DESC';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'strategic_objectives'
        AND column_name = 'cycle_year'
) THEN EXECUTE '
        CREATE OR REPLACE VIEW v_active_objectives AS
        SELECT cycle_year,
            category,
            COUNT(*) as objective_count,
            array_agg(objective) as objectives
        FROM strategic_objectives
        WHERE status = ''active''
        GROUP BY cycle_year, category';
END IF;
END $$;
-- Comentarios solo si las tablas existen
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'strategic_objectives'
) THEN COMMENT ON TABLE strategic_objectives IS 'Objetivos estratégicos de alto nivel';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'business_needs_evaluations'
) THEN COMMENT ON TABLE business_needs_evaluations IS 'Evaluaciones de necesidades del negocio';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'year_roadmaps'
) THEN COMMENT ON TABLE year_roadmaps IS 'Roadmaps anuales';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'budget_plans'
) THEN COMMENT ON TABLE budget_plans IS 'Planes de presupuesto';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'infrastructure_expansion_plans'
) THEN COMMENT ON TABLE infrastructure_expansion_plans IS 'Planes de expansión de infraestructura';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'hiring_plans'
) THEN COMMENT ON TABLE hiring_plans IS 'Planes de contratación';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'ai_kpi_definitions'
) THEN COMMENT ON TABLE ai_kpi_definitions IS 'Definiciones de KPIs de IA';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'data_strategies'
) THEN COMMENT ON TABLE data_strategies IS 'Estrategias de datos';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'technology_upgrade_plans'
) THEN COMMENT ON TABLE technology_upgrade_plans IS 'Planes de actualización tecnológica';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'innovation_projects'
) THEN COMMENT ON TABLE innovation_projects IS 'Proyectos de innovación';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'stakeholder_validations'
) THEN COMMENT ON TABLE stakeholder_validations IS 'Validaciones de stakeholders';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'macro_schedules'
) THEN COMMENT ON TABLE macro_schedules IS 'Cronogramas macro';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'strategic_plans'
) THEN COMMENT ON TABLE strategic_plans IS 'Planes estratégicos consolidados';
END IF;
END $$;
-- Crear tablas faltantes del script 048 si no existen
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
COMMENT ON TABLE stakeholder_validations IS 'Validaciones de stakeholders';
CREATE TABLE IF NOT EXISTS macro_schedules (
    id SERIAL PRIMARY KEY,
    schedule_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    phases JSONB NOT NULL DEFAULT '[]',
    checkpoints JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ms_cycle ON macro_schedules(cycle_year);
COMMENT ON TABLE macro_schedules IS 'Cronogramas macro';
CREATE TABLE IF NOT EXISTS strategic_plans (
    id SERIAL PRIMARY KEY,
    plan_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    sections JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(30) DEFAULT 'draft',
    next_steps TEXT [],
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sp_cycle ON strategic_plans(cycle_year);
CREATE INDEX IF NOT EXISTS idx_sp_status ON strategic_plans(status);
COMMENT ON TABLE strategic_plans IS 'Planes estratégicos consolidados';