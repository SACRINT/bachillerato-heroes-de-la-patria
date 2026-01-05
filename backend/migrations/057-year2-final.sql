-- MIGRACION Year 2 Final (Semana 48)
-- Cierre Final y Transicion
CREATE TABLE IF NOT EXISTS final_reports (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    executive_summary JSONB,
    technical_achievements TEXT [],
    lessons_learned TEXT [],
    status VARCHAR(30) DEFAULT 'draft',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS year_transitions (
    id SERIAL PRIMARY KEY,
    transition_id VARCHAR(100) UNIQUE NOT NULL,
    from_cycle VARCHAR(20) NOT NULL,
    to_cycle VARCHAR(20) NOT NULL,
    tasks JSONB,
    readiness INTEGER DEFAULT 0,
    go_live_date DATE,
    status VARCHAR(30) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS data_archives (
    id SERIAL PRIMARY KEY,
    archive_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    components JSONB,
    total_size VARCHAR(30),
    retention VARCHAR(20),
    encryption VARCHAR(30),
    status VARCHAR(30) DEFAULT 'pending',
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS year_celebrations (
    id SERIAL PRIMARY KEY,
    celebration_id VARCHAR(100) UNIQUE NOT NULL,
    event_name VARCHAR(300) NOT NULL,
    event_date DATE,
    awards JSONB,
    attendees INTEGER,
    status VARCHAR(30) DEFAULT 'planned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS year_summaries (
    id SERIAL PRIMARY KEY,
    summary_id VARCHAR(100) UNIQUE NOT NULL,
    cycle_year VARCHAR(20) NOT NULL,
    phase VARCHAR(30),
    duration VARCHAR(50),
    sprints INTEGER,
    features JSONB,
    impact JSONB,
    technical_metrics JSONB,
    next_steps JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_fr_cycle ON final_reports(cycle_year);
CREATE INDEX IF NOT EXISTS idx_yt_from ON year_transitions(from_cycle);
CREATE INDEX IF NOT EXISTS idx_da_cycle ON data_archives(cycle_year);
CREATE INDEX IF NOT EXISTS idx_ys_cycle ON year_summaries(cycle_year);
-- Vista resumen del ciclo
CREATE OR REPLACE VIEW v_cycle_summary AS
SELECT cycle_year,
    phase,
    sprints,
    features,
    impact
FROM year_summaries
ORDER BY created_at DESC;
COMMENT ON TABLE final_reports IS 'Reportes finales de ciclo';
COMMENT ON TABLE year_transitions IS 'Transiciones entre ciclos';
COMMENT ON TABLE data_archives IS 'Archivos de datos';
COMMENT ON TABLE year_celebrations IS 'Celebraciones de fin de ciclo';
COMMENT ON TABLE year_summaries IS 'Resumenes anuales';