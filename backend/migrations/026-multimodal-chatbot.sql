-- =====================================================
-- MIGRACIÓN: Chatbot Multimodal (Semana 17)
-- Fecha: Enero 2026
-- =====================================================
-- Tabla de interacciones multimodales
CREATE TABLE IF NOT EXISTS multimodal_interactions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_id INTEGER,
    interaction_type VARCHAR(30) NOT NULL,
    -- 'image', 'audio', 'voice_input', 'voice_output', 'visual_generation'
    input_modality VARCHAR(30),
    -- 'text', 'image', 'audio'
    output_modality VARCHAR(30),
    -- 'text', 'image', 'audio', 'graph'
    content_type VARCHAR(50),
    -- 'math_problem', 'chemistry', 'physics', etc.
    input_size_bytes INTEGER,
    output_size_bytes INTEGER,
    processing_time_ms INTEGER,
    confidence DECIMAL(4, 3),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_multimodal_session ON multimodal_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_multimodal_user ON multimodal_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_multimodal_type ON multimodal_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_multimodal_date ON multimodal_interactions(created_at);
-- Tabla de imágenes procesadas
CREATE TABLE IF NOT EXISTS processed_images (
    id SERIAL PRIMARY KEY,
    interaction_id INTEGER REFERENCES multimodal_interactions(id),
    original_filename VARCHAR(255),
    storage_path VARCHAR(500),
    mime_type VARCHAR(50),
    width INTEGER,
    height INTEGER,
    file_size_bytes INTEGER,
    content_type_detected VARCHAR(50),
    detection_confidence DECIMAL(4, 3),
    extracted_data JSONB DEFAULT '{}',
    safety_check_passed BOOLEAN DEFAULT true,
    safety_check_details JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_images_interaction ON processed_images(interaction_id);
CREATE INDEX IF NOT EXISTS idx_images_content ON processed_images(content_type_detected);
CREATE INDEX IF NOT EXISTS idx_images_safety ON processed_images(safety_check_passed);
-- Tabla de transcripciones de audio
CREATE TABLE IF NOT EXISTS audio_transcriptions (
    id SERIAL PRIMARY KEY,
    interaction_id INTEGER REFERENCES multimodal_interactions(id),
    original_filename VARCHAR(255),
    audio_duration_seconds DECIMAL(8, 2),
    language VARCHAR(10) DEFAULT 'es-MX',
    transcribed_text TEXT,
    confidence DECIMAL(4, 3),
    word_timestamps JSONB DEFAULT '[]',
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_transcriptions_interaction ON audio_transcriptions(interaction_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_language ON audio_transcriptions(language);
-- Tabla de síntesis de voz
CREATE TABLE IF NOT EXISTS speech_synthesis (
    id SERIAL PRIMARY KEY,
    interaction_id INTEGER REFERENCES multimodal_interactions(id),
    input_text TEXT NOT NULL,
    text_length INTEGER,
    voice_config JSONB DEFAULT '{}',
    -- language, voice, speed, pitch
    audio_duration_seconds DECIMAL(8, 2),
    audio_format VARCHAR(20) DEFAULT 'mp3',
    storage_path VARCHAR(500),
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_synthesis_interaction ON speech_synthesis(interaction_id);
-- Tabla de gráficos generados
CREATE TABLE IF NOT EXISTS generated_visuals (
    id SERIAL PRIMARY KEY,
    interaction_id INTEGER REFERENCES multimodal_interactions(id),
    visual_type VARCHAR(30) NOT NULL,
    -- 'graph', 'diagram', 'formula', 'timeline', 'chart'
    format VARCHAR(20) DEFAULT 'svg',
    render_data JSONB NOT NULL,
    storage_path VARCHAR(500),
    width INTEGER,
    height INTEGER,
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_visuals_interaction ON generated_visuals(interaction_id);
CREATE INDEX IF NOT EXISTS idx_visuals_type ON generated_visuals(visual_type);
-- Tabla de métricas de latencia
CREATE TABLE IF NOT EXISTS multimodal_latency_metrics (
    id SERIAL PRIMARY KEY,
    metric_date DATE UNIQUE NOT NULL,
    image_processing_avg_ms INTEGER,
    image_processing_p95_ms INTEGER,
    audio_transcription_avg_ms INTEGER,
    audio_transcription_p95_ms INTEGER,
    speech_synthesis_avg_ms INTEGER,
    speech_synthesis_p95_ms INTEGER,
    visual_generation_avg_ms INTEGER,
    visual_generation_p95_ms INTEGER,
    total_interactions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_latency_date ON multimodal_latency_metrics(metric_date);
-- Tabla de costos de procesamiento
CREATE TABLE IF NOT EXISTS multimodal_costs (
    id SERIAL PRIMARY KEY,
    cost_date DATE NOT NULL,
    images_processed INTEGER DEFAULT 0,
    audio_minutes_transcribed DECIMAL(10, 2) DEFAULT 0,
    speech_minutes_synthesized DECIMAL(10, 2) DEFAULT 0,
    visuals_generated INTEGER DEFAULT 0,
    total_cost_usd DECIMAL(10, 4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cost_date)
);
CREATE INDEX IF NOT EXISTS idx_costs_date ON multimodal_costs(cost_date);
-- Tabla de configuración de seguridad
CREATE TABLE IF NOT EXISTS multimodal_safety_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100)
);
-- Insertar configuración de seguridad inicial
INSERT INTO multimodal_safety_config (config_key, config_value, description)
VALUES (
        'blocked_categories',
        '["nsfw", "violence", "drugs", "weapons"]',
        'Categorías de contenido bloqueadas'
    ),
    (
        'enabled',
        'true',
        'Filtros de seguridad habilitados'
    ),
    (
        'confidence_threshold',
        '0.7',
        'Umbral de confianza para bloqueo'
    ) ON CONFLICT (config_key) DO NOTHING;
-- Vista: Resumen de uso multimodal
CREATE OR REPLACE VIEW v_multimodal_usage_summary AS
SELECT DATE_TRUNC('day', created_at)::DATE as usage_date,
    COUNT(*) as total_interactions,
    COUNT(*) FILTER (
        WHERE interaction_type = 'image'
    ) as images,
    COUNT(*) FILTER (
        WHERE interaction_type = 'audio'
    ) as audio,
    COUNT(*) FILTER (
        WHERE interaction_type = 'voice_output'
    ) as voice_output,
    COUNT(*) FILTER (
        WHERE interaction_type = 'visual_generation'
    ) as visuals,
    AVG(processing_time_ms) as avg_processing_ms
FROM multimodal_interactions
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY usage_date DESC;
-- Comentarios
COMMENT ON TABLE multimodal_interactions IS 'Interacciones multimodales del chatbot';
COMMENT ON TABLE processed_images IS 'Imágenes procesadas y analizadas';
COMMENT ON TABLE audio_transcriptions IS 'Transcripciones de audio a texto';
COMMENT ON TABLE speech_synthesis IS 'Síntesis de texto a voz';
COMMENT ON TABLE generated_visuals IS 'Gráficos y diagramas generados';
COMMENT ON TABLE multimodal_latency_metrics IS 'Métricas de latencia por día';
COMMENT ON TABLE multimodal_costs IS 'Costos de procesamiento multimodal';
COMMENT ON TABLE multimodal_safety_config IS 'Configuración de filtros de seguridad';