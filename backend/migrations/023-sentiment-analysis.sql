-- =====================================================
-- MIGRACIÓN: Análisis de Sentimiento Institucional (Semana 14)
-- Fecha: Enero 2026
-- =====================================================
-- Tabla de análisis de sentimiento
CREATE TABLE IF NOT EXISTS sentiment_analyses (
    id SERIAL PRIMARY KEY,
    source_type VARCHAR(50) NOT NULL,
    -- 'quejas', 'chatbot', 'encuesta', 'comentario'
    source_id INTEGER,
    original_text TEXT NOT NULL,
    anonymized_text TEXT,
    sentiment_score DECIMAL(4, 3) NOT NULL,
    -- -1.000 a 1.000
    sentiment_label VARCHAR(20) NOT NULL,
    -- 'positive', 'neutral', 'negative'
    confidence DECIMAL(3, 2) DEFAULT 0.75,
    aspects JSONB DEFAULT '[]',
    critical_risk JSONB DEFAULT '{"detected": false}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sentiment_source ON sentiment_analyses(source_type);
CREATE INDEX IF NOT EXISTS idx_sentiment_label ON sentiment_analyses(sentiment_label);
CREATE INDEX IF NOT EXISTS idx_sentiment_date ON sentiment_analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_sentiment_critical ON sentiment_analyses((critical_risk->>'detected'));
-- Tabla de alertas de riesgo
CREATE TABLE IF NOT EXISTS sentiment_risk_alerts (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER REFERENCES sentiment_analyses(id),
    risk_level VARCHAR(20) NOT NULL,
    -- 'low', 'medium', 'high'
    keywords TEXT [] NOT NULL,
    status VARCHAR(30) DEFAULT 'pending',
    -- 'pending', 'reviewed', 'actioned', 'dismissed'
    reviewed_by VARCHAR(100),
    action_taken TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_alerts_level ON sentiment_risk_alerts(risk_level);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON sentiment_risk_alerts(status);
-- Tabla de métricas diarias (termómetro)
CREATE TABLE IF NOT EXISTS sentiment_daily_metrics (
    id SERIAL PRIMARY KEY,
    metric_date DATE UNIQUE NOT NULL,
    total_feedback INTEGER DEFAULT 0,
    avg_sentiment DECIMAL(4, 3),
    positive_count INTEGER DEFAULT 0,
    neutral_count INTEGER DEFAULT 0,
    negative_count INTEGER DEFAULT 0,
    critical_alerts INTEGER DEFAULT 0,
    aspect_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON sentiment_daily_metrics(metric_date);
-- Tabla de reportes mensuales
CREATE TABLE IF NOT EXISTS sentiment_monthly_reports (
    id SERIAL PRIMARY KEY,
    report_month VARCHAR(7) NOT NULL,
    -- 'YYYY-MM'
    overall_score DECIMAL(4, 3),
    overall_label VARCHAR(20),
    total_feedback INTEGER,
    trend_direction VARCHAR(20),
    trend_change DECIMAL(4, 3),
    recommendations JSONB DEFAULT '[]',
    full_report JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(report_month)
);
-- Tabla de configuración de léxico
CREATE TABLE IF NOT EXISTS sentiment_lexicon (
    id SERIAL PRIMARY KEY,
    word VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL,
    -- 'positive', 'negative', 'critical', 'slang_positive', 'slang_negative'
    weight DECIMAL(3, 2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    added_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(word, category)
);
-- Insertar léxico base
INSERT INTO sentiment_lexicon (word, category, weight)
VALUES ('excelente', 'positive', 1.0),
    ('bueno', 'positive', 0.8),
    ('genial', 'positive', 0.9),
    ('malo', 'negative', -0.8),
    ('pésimo', 'negative', -1.0),
    ('horrible', 'negative', -0.9),
    ('bullying', 'critical', -2.0),
    ('acoso', 'critical', -2.0),
    ('violencia', 'critical', -2.0),
    ('chido', 'slang_positive', 0.8),
    ('padre', 'slang_positive', 0.7),
    ('gacho', 'slang_negative', -0.7) ON CONFLICT (word, category) DO NOTHING;
-- Vista: Resumen semanal de sentimiento
CREATE OR REPLACE VIEW v_sentiment_weekly_summary AS
SELECT DATE_TRUNC('week', created_at)::DATE as week_start,
    COUNT(*) as total_analyses,
    AVG(sentiment_score) as avg_score,
    COUNT(*) FILTER (
        WHERE sentiment_label = 'positive'
    ) as positive,
    COUNT(*) FILTER (
        WHERE sentiment_label = 'negative'
    ) as negative,
    COUNT(*) FILTER (
        WHERE sentiment_label = 'neutral'
    ) as neutral,
    COUNT(*) FILTER (
        WHERE (critical_risk->>'detected')::boolean = true
    ) as critical_count
FROM sentiment_analyses
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week_start DESC;
-- Comentarios
COMMENT ON TABLE sentiment_analyses IS 'Análisis de sentimiento de feedback institucional';
COMMENT ON TABLE sentiment_risk_alerts IS 'Alertas de riesgo detectadas en comentarios';
COMMENT ON TABLE sentiment_daily_metrics IS 'Métricas diarias del termómetro institucional';
COMMENT ON TABLE sentiment_monthly_reports IS 'Reportes mensuales de clima estudiantil';
COMMENT ON TABLE sentiment_lexicon IS 'Diccionario de palabras para análisis de sentimiento';