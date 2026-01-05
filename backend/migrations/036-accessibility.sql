-- =====================================================
-- MIGRACIÓN: Accessibility AI (Semana 27)
-- Accesibilidad e Inclusión
-- Fecha: Enero 2026
-- =====================================================
-- Tabla de auditorías WCAG
CREATE TABLE IF NOT EXISTS wcag_audits (
    id SERIAL PRIMARY KEY,
    audit_id VARCHAR(100) UNIQUE NOT NULL,
    url VARCHAR(500) NOT NULL,
    wcag_version VARCHAR(10) DEFAULT '2.1',
    target_level VARCHAR(5) DEFAULT 'AA',
    overall_score INTEGER,
    passed_level VARCHAR(5),
    meets_target BOOLEAN DEFAULT false,
    categories JSONB NOT NULL,
    recommendations TEXT [],
    audited_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_wcag_url ON wcag_audits(url);
CREATE INDEX IF NOT EXISTS idx_wcag_level ON wcag_audits(passed_level);
CREATE INDEX IF NOT EXISTS idx_wcag_date ON wcag_audits(created_at);
-- Tabla de preferencias de accesibilidad por usuario
CREATE TABLE IF NOT EXISTS user_accessibility_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    visual_mode VARCHAR(50) DEFAULT 'default',
    font_scale DECIMAL(3, 2) DEFAULT 1.0,
    line_height DECIMAL(3, 2) DEFAULT 1.5,
    reduce_motion BOOLEAN DEFAULT false,
    reduce_transparency BOOLEAN DEFAULT false,
    high_contrast BOOLEAN DEFAULT false,
    screen_reader BOOLEAN DEFAULT false,
    voice_input BOOLEAN DEFAULT false,
    voice_output BOOLEAN DEFAULT false,
    reading_level VARCHAR(30) DEFAULT 'intermediate',
    preferred_language VARCHAR(10) DEFAULT 'es',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_access_user ON user_accessibility_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_access_visual ON user_accessibility_preferences(visual_mode);
-- Tabla de transcripciones
CREATE TABLE IF NOT EXISTS accessibility_transcriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    audio_source VARCHAR(255),
    language VARCHAR(10) DEFAULT 'es-MX',
    detected_accent VARCHAR(50),
    transcription TEXT NOT NULL,
    confidence DECIMAL(4, 3),
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_trans_user ON accessibility_transcriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_trans_lang ON accessibility_transcriptions(language);
CREATE INDEX IF NOT EXISTS idx_trans_date ON accessibility_transcriptions(created_at);
-- Tabla de simplificaciones de texto
CREATE TABLE IF NOT EXISTS text_simplifications (
    id SERIAL PRIMARY KEY,
    original_text TEXT NOT NULL,
    simplified_text TEXT NOT NULL,
    original_level VARCHAR(30),
    target_level VARCHAR(30),
    achieved_level VARCHAR(30),
    grade_improvement DECIMAL(4, 2),
    changes JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_simplify_level ON text_simplifications(achieved_level);
CREATE INDEX IF NOT EXISTS idx_simplify_date ON text_simplifications(created_at);
-- Tabla de alt-texts generados
CREATE TABLE IF NOT EXISTS generated_alt_texts (
    id SERIAL PRIMARY KEY,
    image_url VARCHAR(500) NOT NULL,
    alt_text TEXT NOT NULL,
    short_description VARCHAR(255),
    detailed_description TEXT,
    confidence DECIMAL(4, 3),
    detected_elements JSONB,
    is_decorative BOOLEAN DEFAULT false,
    reviewed BOOLEAN DEFAULT false,
    reviewed_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_alt_url ON generated_alt_texts(image_url);
CREATE INDEX IF NOT EXISTS idx_alt_reviewed ON generated_alt_texts(reviewed);
-- Tabla de traducciones
CREATE TABLE IF NOT EXISTS accessibility_translations (
    id SERIAL PRIMARY KEY,
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    source_language VARCHAR(10) NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    is_indigenous BOOLEAN DEFAULT false,
    confidence DECIMAL(4, 3),
    cultural_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_transl_source ON accessibility_translations(source_language);
CREATE INDEX IF NOT EXISTS idx_transl_target ON accessibility_translations(target_language);
CREATE INDEX IF NOT EXISTS idx_transl_indigenous ON accessibility_translations(is_indigenous);
-- Tabla de evaluaciones de sesgo
CREATE TABLE IF NOT EXISTS bias_evaluations (
    id SERIAL PRIMARY KEY,
    evaluation_id VARCHAR(100) UNIQUE NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    test_data_size INTEGER,
    bias_categories JSONB NOT NULL,
    overall_score DECIMAL(4, 3),
    overall_status VARCHAR(30),
    fairness_metrics JSONB,
    recommendations TEXT [],
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bias_model ON bias_evaluations(model_id);
CREATE INDEX IF NOT EXISTS idx_bias_status ON bias_evaluations(overall_status);
CREATE INDEX IF NOT EXISTS idx_bias_date ON bias_evaluations(evaluated_at);
-- Tabla de comandos de voz procesados
CREATE TABLE IF NOT EXISTS voice_command_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    command_text VARCHAR(500) NOT NULL,
    recognized BOOLEAN DEFAULT false,
    matched_action VARCHAR(100),
    parameters JSONB,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_voice_user ON voice_command_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_action ON voice_command_logs(matched_action);
CREATE INDEX IF NOT EXISTS idx_voice_date ON voice_command_logs(processed_at);
-- Tabla de idiomas soportados
CREATE TABLE IF NOT EXISTS supported_languages (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    native_name VARCHAR(100),
    is_indigenous BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true
);
INSERT INTO supported_languages (code, name, native_name, is_indigenous)
VALUES ('es', 'Español', 'Español', false),
    ('en', 'English', 'English', false),
    ('nah', 'Náhuatl', 'Nāhuatl', true),
    ('yua', 'Maya', 'Maaya T''aan', true),
    ('zap', 'Zapoteco', 'Diidxazá', true),
    ('mix', 'Mixteco', 'Tu''un sávi', true) ON CONFLICT (code) DO NOTHING;
-- Tabla de modos visuales
CREATE TABLE IF NOT EXISTS visual_accessibility_modes (
    id SERIAL PRIMARY KEY,
    mode_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    colors JSONB NOT NULL,
    color_transform VARCHAR(50),
    font_size VARCHAR(20),
    line_height VARCHAR(20),
    is_active BOOLEAN DEFAULT true
);
INSERT INTO visual_accessibility_modes (mode_code, name, colors)
VALUES (
        'default',
        'Predeterminado',
        '{"primary": "#2196F3", "secondary": "#FF9800", "background": "#FFFFFF", "text": "#212121"}'
    ),
    (
        'highContrast',
        'Alto Contraste',
        '{"primary": "#FFFF00", "secondary": "#00FFFF", "background": "#000000", "text": "#FFFFFF"}'
    ),
    (
        'protanopia',
        'Protanopia',
        '{"primary": "#0077BB", "secondary": "#EE7733", "background": "#FFFFFF", "text": "#212121"}'
    ),
    (
        'deuteranopia',
        'Deuteranopia',
        '{"primary": "#0077BB", "secondary": "#CC3311", "background": "#FFFFFF", "text": "#212121"}'
    ),
    (
        'tritanopia',
        'Tritanopia',
        '{"primary": "#EE3377", "secondary": "#009988", "background": "#FFFFFF", "text": "#212121"}'
    ),
    (
        'lowVision',
        'Baja Visión',
        '{"primary": "#1565C0", "secondary": "#F57C00", "background": "#FFFCE8", "text": "#000000"}'
    ) ON CONFLICT (mode_code) DO NOTHING;
-- Vista: Estadísticas de accesibilidad
CREATE OR REPLACE VIEW v_accessibility_stats AS
SELECT (
        SELECT COUNT(*)
        FROM wcag_audits
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    ) as audits_30d,
    (
        SELECT AVG(overall_score)
        FROM wcag_audits
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    ) as avg_score,
    (
        SELECT COUNT(*)
        FROM user_accessibility_preferences
        WHERE visual_mode != 'default'
    ) as custom_visual_users,
    (
        SELECT COUNT(*)
        FROM accessibility_translations
        WHERE is_indigenous = true
    ) as indigenous_translations,
    (
        SELECT AVG(overall_score)
        FROM bias_evaluations
        WHERE evaluated_at >= CURRENT_DATE - INTERVAL '30 days'
    ) as avg_bias_score;
-- Vista: Uso de modos visuales
CREATE OR REPLACE VIEW v_visual_mode_usage AS
SELECT visual_mode,
    COUNT(*) as users,
    ROUND(
        COUNT(*) * 100.0 / (
            SELECT COUNT(*)
            FROM user_accessibility_preferences
        ),
        2
    ) as percentage
FROM user_accessibility_preferences
GROUP BY visual_mode
ORDER BY users DESC;
-- Comentarios
COMMENT ON TABLE wcag_audits IS 'Auditorías de accesibilidad WCAG';
COMMENT ON TABLE user_accessibility_preferences IS 'Preferencias de accesibilidad por usuario';
COMMENT ON TABLE accessibility_transcriptions IS 'Transcripciones de audio';
COMMENT ON TABLE text_simplifications IS 'Textos simplificados';
COMMENT ON TABLE generated_alt_texts IS 'Alt-texts generados automáticamente';
COMMENT ON TABLE accessibility_translations IS 'Traducciones incluyendo lenguas indígenas';
COMMENT ON TABLE bias_evaluations IS 'Evaluaciones de sesgo de modelos IA';
COMMENT ON TABLE voice_command_logs IS 'Comandos de voz procesados';
COMMENT ON TABLE supported_languages IS 'Idiomas soportados para traducción';
COMMENT ON TABLE visual_accessibility_modes IS 'Modos de visualización para accesibilidad';