-- =====================================================
-- MIGRACIÓN: Automatización Administrativa (Semana 16)
-- RPA + AI
-- Fecha: Enero 2026
-- =====================================================
-- Tabla de tareas de automatización
CREATE TABLE IF NOT EXISTS automation_tasks (
    id SERIAL PRIMARY KEY,
    task_type VARCHAR(50) NOT NULL,
    -- 'ocr', 'email_classification', 'payment_validation', 'certificate_generation', 'photo_validation', 'schedule_generation'
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    status VARCHAR(30) DEFAULT 'pending',
    -- pending, processing, completed, failed, review_required
    confidence DECIMAL(4, 3),
    processing_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_automation_type ON automation_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_automation_status ON automation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_automation_date ON automation_tasks(created_at);
-- Tabla de revisiones humanas (Human-in-the-loop)
CREATE TABLE IF NOT EXISTS automation_reviews (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(100) NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'pending',
    -- pending, in_review, approved, rejected
    assigned_to INTEGER,
    reviewer_notes TEXT,
    original_result JSONB,
    corrected_result JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON automation_reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_type ON automation_reviews(task_type);
CREATE INDEX IF NOT EXISTS idx_reviews_assigned ON automation_reviews(assigned_to);
-- Tabla de constancias generadas
CREATE TABLE IF NOT EXISTS generated_certificates (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    certificate_type VARCHAR(50) NOT NULL,
    folio VARCHAR(100) UNIQUE NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    downloaded_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMP,
    status VARCHAR(30) DEFAULT 'valid' -- valid, expired, revoked
);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON generated_certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_type ON generated_certificates(certificate_type);
CREATE INDEX IF NOT EXISTS idx_certificates_folio ON generated_certificates(folio);
-- Tabla de clasificación de correos
CREATE TABLE IF NOT EXISTS email_classifications (
    id SERIAL PRIMARY KEY,
    email_id VARCHAR(255),
    subject TEXT,
    category VARCHAR(50) NOT NULL,
    confidence DECIMAL(4, 3),
    priority VARCHAR(20) DEFAULT 'normal',
    suggested_department VARCHAR(100),
    auto_response_sent BOOLEAN DEFAULT false,
    classified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_emails_category ON email_classifications(category);
CREATE INDEX IF NOT EXISTS idx_emails_priority ON email_classifications(priority);
CREATE INDEX IF NOT EXISTS idx_emails_date ON email_classifications(classified_at);
-- Tabla de validaciones de pago
CREATE TABLE IF NOT EXISTS payment_validations (
    id SERIAL PRIMARY KEY,
    payment_reference VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2),
    payer_name VARCHAR(255),
    bank_reference VARCHAR(100),
    validation_status VARCHAR(30) NOT NULL,
    -- approved, rejected, requires_review
    matched_student_id INTEGER,
    checks_passed JSONB DEFAULT '[]',
    validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INTEGER,
    reviewed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payments_ref ON payment_validations(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_validations(validation_status);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payment_validations(matched_student_id);
-- Tabla de horarios generados
CREATE TABLE IF NOT EXISTS generated_schedules (
    id SERIAL PRIMARY KEY,
    semester VARCHAR(20) NOT NULL,
    total_groups INTEGER,
    total_assignments INTEGER,
    conflicts_detected INTEGER DEFAULT 0,
    optimization_score DECIMAL(4, 3),
    schedule_data JSONB NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by INTEGER,
    approved_at TIMESTAMP,
    status VARCHAR(30) DEFAULT 'draft' -- draft, approved, active, archived
);
CREATE INDEX IF NOT EXISTS idx_schedules_semester ON generated_schedules(semester);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON generated_schedules(status);
-- Tabla de métricas de automatización diarias
CREATE TABLE IF NOT EXISTS automation_daily_metrics (
    id SERIAL PRIMARY KEY,
    metric_date DATE UNIQUE NOT NULL,
    documents_processed INTEGER DEFAULT 0,
    emails_classified INTEGER DEFAULT 0,
    payments_validated INTEGER DEFAULT 0,
    certificates_generated INTEGER DEFAULT 0,
    photos_validated INTEGER DEFAULT 0,
    schedules_generated INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    human_interventions INTEGER DEFAULT 0,
    estimated_hours_saved DECIMAL(6, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON automation_daily_metrics(metric_date);
-- Vista: Resumen de automatización
CREATE OR REPLACE VIEW v_automation_summary AS
SELECT CURRENT_DATE as report_date,
    (
        SELECT COUNT(*)
        FROM automation_tasks
        WHERE status = 'completed'
            AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    ) as tasks_completed_30d,
    (
        SELECT COUNT(*)
        FROM automation_reviews
        WHERE status = 'pending'
    ) as pending_reviews,
    (
        SELECT SUM(estimated_hours_saved)
        FROM automation_daily_metrics
        WHERE metric_date >= CURRENT_DATE - INTERVAL '30 days'
    ) as hours_saved_30d,
    (
        SELECT COUNT(*)
        FROM generated_certificates
        WHERE generated_at >= CURRENT_DATE - INTERVAL '30 days'
    ) as certificates_30d;
-- Comentarios
COMMENT ON TABLE automation_tasks IS 'Tareas de automatización procesadas';
COMMENT ON TABLE automation_reviews IS 'Revisiones humanas pendientes (Human-in-the-loop)';
COMMENT ON TABLE generated_certificates IS 'Constancias generadas automáticamente';
COMMENT ON TABLE email_classifications IS 'Correos clasificados automáticamente';
COMMENT ON TABLE payment_validations IS 'Validaciones de pagos procesadas';
COMMENT ON TABLE generated_schedules IS 'Horarios generados con CSP solver';
COMMENT ON TABLE automation_daily_metrics IS 'Métricas diarias de automatización';