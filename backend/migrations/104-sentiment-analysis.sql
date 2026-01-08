-- 📚 MIGRACIÓN 104: SENTIMENT ANALYSIS
-- Propósito: Monitoreo de clima emocional y detección de toxicidad (Fase 6 - Semana 44)
-- 1. Logs de Sentimiento
CREATE TABLE IF NOT EXISTS sentiment_analysis_logs (
    id SERIAL PRIMARY KEY,
    source_type VARCHAR(50) NOT NULL,
    -- 'forum_post', 'comment', 'chat_message'
    source_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    text_content TEXT,
    sentiment_score DECIMAL(5, 2),
    -- -1.0 (Negativo) a 1.0 (Positivo)
    toxicity_score DECIMAL(5, 2) DEFAULT 0.0,
    -- 0.0 a 1.0 (Probabilidad de ser tóxico)
    detected_emotions JSONB,
    -- { "joy": 0.1, "anger": 0.8 }
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 2. Alertas de Moderación
CREATE TABLE IF NOT EXISTS moderation_alerts (
    id SERIAL PRIMARY KEY,
    sentiment_log_id INTEGER REFERENCES sentiment_analysis_logs(id) ON DELETE CASCADE,
    alert_level VARCHAR(20),
    -- 'warning', 'critical'
    status VARCHAR(50) DEFAULT 'pending',
    -- 'pending', 'reviewed', 'dismissed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_sentiment_source ON sentiment_analysis_logs(source_type, source_id);