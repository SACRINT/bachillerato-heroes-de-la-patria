-- 📚 MIGRACIÓN 100: QUALITY ASSURANCE SYSTEM
-- Propósito: Sistema de reportes de calidad y monitoreo de salud del contenido (Fase 5 - Semana 40)
-- 1. Reportes de Calidad de Usuarios
-- Permite a estudiantes y docentes reportar errores en cualquier tipo de contenido
CREATE TABLE IF NOT EXISTS content_quality_reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    -- 'video', 'lab', 'problem', 'document'
    content_id INTEGER NOT NULL,
    issue_type VARCHAR(50) NOT NULL,
    -- 'typo', 'bug', 'outdated', 'offensive', 'broken_link'
    description TEXT,
    status VARCHAR(50) DEFAULT 'open',
    -- 'open', 'investigating', 'resolved', 'dismissed'
    resolution_note TEXT,
    resolved_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 2. Chequeos Automáticos de Salud
-- Registro de scans automáticos (enlaces rotos, assets faltantes)
CREATE TABLE IF NOT EXISTS system_health_checks (
    id SERIAL PRIMARY KEY,
    check_name VARCHAR(100) NOT NULL,
    -- 'link_validator', 'asset_integrity', 'schema_validation'
    status VARCHAR(50) NOT NULL,
    -- 'pass', 'fail', 'warning'
    issues_found INTEGER DEFAULT 0,
    details_json JSONB,
    -- Detalles técnicos del scan
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_qa_reports_status ON content_quality_reports(status);
CREATE INDEX IF NOT EXISTS idx_qa_reports_content ON content_quality_reports(content_type, content_id);
-- Seed Data: Reporte inicial
INSERT INTO content_quality_reports (
        user_id,
        content_type,
        content_id,
        issue_type,
        description
    )
VALUES (
        1,
        'video',
        1,
        'typo',
        'El subtítulo en el minuto 2:30 dice "revolusion" en lugar de "revolución".'
    );