-- =====================================================
-- MIGRACIÓN: Teacher Tools - Herramientas IA Docentes (Semana 19)
-- Fecha: Enero 2026
-- =====================================================
-- Tabla de syllabus generados
CREATE TABLE IF NOT EXISTS generated_syllabus (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    subject VARCHAR(100) NOT NULL,
    semester VARCHAR(20),
    total_hours INTEGER,
    syllabus_data JSONB NOT NULL,
    status VARCHAR(30) DEFAULT 'draft',
    -- draft, published, archived
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_syllabus_teacher ON generated_syllabus(teacher_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_subject ON generated_syllabus(subject);
-- Tabla de rúbricas generadas
CREATE TABLE IF NOT EXISTS generated_rubrics (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    rubric_type VARCHAR(50) NOT NULL,
    -- essay, presentation, project, general
    rubric_data JSONB NOT NULL,
    times_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rubrics_teacher ON generated_rubrics(teacher_id);
CREATE INDEX IF NOT EXISTS idx_rubrics_type ON generated_rubrics(rubric_type);
-- Tabla de quizzes/exámenes generados
CREATE TABLE IF NOT EXISTS generated_quizzes (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    difficulty VARCHAR(30) DEFAULT 'intermedio',
    question_count INTEGER,
    quiz_data JSONB NOT NULL,
    times_used INTEGER DEFAULT 0,
    avg_score DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_quizzes_teacher ON generated_quizzes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject ON generated_quizzes(subject);
-- Tabla de análisis de textos
CREATE TABLE IF NOT EXISTS text_analyses (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    student_id INTEGER,
    assignment_id INTEGER,
    word_count INTEGER,
    overall_score INTEGER,
    grammar_score INTEGER,
    spelling_score INTEGER,
    style_score INTEGER,
    readability_score INTEGER,
    suggestions TEXT [],
    analysis_data JSONB,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_analyses_teacher ON text_analyses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_analyses_student ON text_analyses(student_id);
-- Tabla de verificaciones de plagio
CREATE TABLE IF NOT EXISTS plagiarism_checks (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    student_id INTEGER,
    assignment_id INTEGER,
    originality_score INTEGER,
    verdict VARCHAR(30),
    -- original, revisar, sospechoso
    ai_probability DECIMAL(5, 2),
    flags JSONB DEFAULT '[]',
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_plagiarism_teacher ON plagiarism_checks(teacher_id);
CREATE INDEX IF NOT EXISTS idx_plagiarism_verdict ON plagiarism_checks(verdict);
-- Tabla de snapshots de salud del grupo
CREATE TABLE IF NOT EXISTS group_health_snapshots (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    snapshot_date DATE NOT NULL,
    health_score INTEGER,
    academic_data JSONB,
    attendance_data JSONB,
    engagement_data JSONB,
    alerts JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, snapshot_date)
);
CREATE INDEX IF NOT EXISTS idx_health_group ON group_health_snapshots(group_id);
CREATE INDEX IF NOT EXISTS idx_health_date ON group_health_snapshots(snapshot_date);
-- Tabla de actividades sugeridas
CREATE TABLE IF NOT EXISTS activity_suggestions (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    subject VARCHAR(100),
    topic VARCHAR(255),
    suggested_activities JSONB NOT NULL,
    activity_used VARCHAR(100),
    -- cual actividad eligió el docente
    feedback VARCHAR(30),
    -- useful, not_useful, null
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_activities_teacher ON activity_suggestions(teacher_id);
-- Tabla de materiales didácticos generados
CREATE TABLE IF NOT EXISTS generated_materials (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    material_type VARCHAR(50) NOT NULL,
    -- infographic, flashcards, summary, worksheet
    subject VARCHAR(100),
    topic VARCHAR(255),
    material_data JSONB NOT NULL,
    downloads INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_materials_teacher ON generated_materials(teacher_id);
CREATE INDEX IF NOT EXISTS idx_materials_type ON generated_materials(material_type);
-- Tabla de métricas de uso de herramientas
CREATE TABLE IF NOT EXISTS teacher_tools_usage (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    tool_name VARCHAR(100) NOT NULL,
    usage_count INTEGER DEFAULT 1,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usage_date DATE DEFAULT CURRENT_DATE,
    UNIQUE(teacher_id, tool_name, usage_date)
);
CREATE INDEX IF NOT EXISTS idx_usage_teacher ON teacher_tools_usage(teacher_id);
CREATE INDEX IF NOT EXISTS idx_usage_tool ON teacher_tools_usage(tool_name);
-- Vista: Uso de herramientas por docente
CREATE OR REPLACE VIEW v_teacher_tools_summary AS
SELECT teacher_id,
    SUM(usage_count) as total_uses,
    COUNT(DISTINCT tool_name) as tools_used,
    MAX(last_used) as last_activity,
    jsonb_object_agg(tool_name, usage_count) as usage_by_tool
FROM teacher_tools_usage
WHERE usage_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY teacher_id
ORDER BY total_uses DESC;
-- Vista: Herramientas más populares
CREATE OR REPLACE VIEW v_popular_teacher_tools AS
SELECT tool_name,
    SUM(usage_count) as total_uses,
    COUNT(DISTINCT teacher_id) as unique_teachers
FROM teacher_tools_usage
WHERE usage_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY tool_name
ORDER BY total_uses DESC;
-- Comentarios
COMMENT ON TABLE generated_syllabus IS 'Syllabus generados por IA para docentes';
COMMENT ON TABLE generated_rubrics IS 'Rúbricas de evaluación generadas';
COMMENT ON TABLE generated_quizzes IS 'Quizzes y exámenes generados';
COMMENT ON TABLE text_analyses IS 'Análisis de textos de estudiantes';
COMMENT ON TABLE plagiarism_checks IS 'Verificaciones de plagio';
COMMENT ON TABLE group_health_snapshots IS 'Snapshots de salud de grupos';
COMMENT ON TABLE activity_suggestions IS 'Actividades sugeridas a docentes';
COMMENT ON TABLE generated_materials IS 'Materiales didácticos generados';
COMMENT ON TABLE teacher_tools_usage IS 'Métricas de uso de herramientas';