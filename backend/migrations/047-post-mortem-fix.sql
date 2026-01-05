-- CORRECCION Post-Mortem 047
-- Vista 1
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'annual_incident_reviews'
        AND column_name = 'cycle_year'
) THEN EXECUTE 'CREATE OR REPLACE VIEW v_post_mortem_summary AS SELECT air.cycle_year, air.total_incidents, air.critical as critical_incidents, da.total_uptime, da.total_downtime_minutes FROM annual_incident_reviews air LEFT JOIN downtime_analysis da ON air.cycle_year = da.cycle_year';
END IF;
END $$;
-- Vista 2
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'automation_savings'
        AND column_name = 'cycle_year'
) THEN EXECUTE 'CREATE OR REPLACE VIEW v_annual_savings AS SELECT cycle_year, SUM(hours_saved) as total_hours_saved, SUM(cost_saved) as total_cost_saved FROM automation_savings GROUP BY cycle_year';
END IF;
END $$;
-- Comentarios condicionales
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'annual_incident_reviews'
) THEN COMMENT ON TABLE annual_incident_reviews IS 'Revision anual de incidentes';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'downtime_analysis'
) THEN COMMENT ON TABLE downtime_analysis IS 'Analisis de downtime';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'model_accuracy_evaluations'
) THEN COMMENT ON TABLE model_accuracy_evaluations IS 'Evaluacion de precision de modelos';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'automation_savings'
) THEN COMMENT ON TABLE automation_savings IS 'Ahorro por automatizacion';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'architecture_errors'
) THEN COMMENT ON TABLE architecture_errors IS 'Errores de arquitectura identificados';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'annual_security_analysis'
) THEN COMMENT ON TABLE annual_security_analysis IS 'Analisis anual de seguridad';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'vendor_evaluations'
) THEN COMMENT ON TABLE vendor_evaluations IS 'Evaluaciones de proveedores';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'sla_compliance_reviews'
) THEN COMMENT ON TABLE sla_compliance_reviews IS 'Revisiones de cumplimiento de SLAs';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'lessons_learned'
) THEN COMMENT ON TABLE lessons_learned IS 'Lecciones aprendidas';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'annual_technical_reports'
) THEN COMMENT ON TABLE annual_technical_reports IS 'Reportes tecnicos anuales';
END IF;
END $$;
-- Crear tabla faltante si no existe
CREATE TABLE IF NOT EXISTS annual_technical_reports (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    executive_summary JSONB NOT NULL DEFAULT '{}',
    recommendations TEXT [],
    signoff JSONB,
    status VARCHAR(30) DEFAULT 'draft'
);
CREATE INDEX IF NOT EXISTS idx_atr_cycle ON annual_technical_reports(cycle_year);