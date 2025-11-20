-- ========================================
-- MIGRACIÓN: Tabla de Generaciones IA
-- BGE Héroes de la Patria
-- FASE 1 - Semana 3-4
-- ========================================

-- Tabla para registrar todas las generaciones de IA
CREATE TABLE IF NOT EXISTS ai_generations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Información del proveedor
    provider VARCHAR(50) NOT NULL,           -- openai, anthropic, gemini
    model VARCHAR(100) NOT NULL,             -- gpt-4, claude-3-opus, etc

    -- Tipo de generación
    generation_type VARCHAR(50) NOT NULL,    -- text, essay, summary, code, etc

    -- Contenido (preview)
    prompt_preview VARCHAR(500),             -- Primeros 500 chars del prompt

    -- Métricas
    tokens_used INTEGER DEFAULT 0,
    coins_cost INTEGER DEFAULT 0,
    response_length INTEGER DEFAULT 0,

    -- Estado
    status VARCHAR(20) NOT NULL DEFAULT 'processing',  -- processing, completed, failed
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Índices
    CONSTRAINT valid_status CHECK (status IN ('processing', 'completed', 'failed'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_gen_user ON ai_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_gen_provider ON ai_generations(provider);
CREATE INDEX IF NOT EXISTS idx_ai_gen_type ON ai_generations(generation_type);
CREATE INDEX IF NOT EXISTS idx_ai_gen_status ON ai_generations(status);
CREATE INDEX IF NOT EXISTS idx_ai_gen_created ON ai_generations(created_at DESC);

-- Índice compuesto para historial de usuario
CREATE INDEX IF NOT EXISTS idx_ai_gen_user_created ON ai_generations(user_id, created_at DESC);

-- Comentarios
COMMENT ON TABLE ai_generations IS 'Registro de todas las generaciones de contenido con IA';
COMMENT ON COLUMN ai_generations.provider IS 'Proveedor de IA utilizado';
COMMENT ON COLUMN ai_generations.tokens_used IS 'Tokens consumidos en la generación';
COMMENT ON COLUMN ai_generations.coins_cost IS 'IACoins cobrados al usuario';

-- ========================================
-- TABLA: Plantillas de prompts
-- ========================================
CREATE TABLE IF NOT EXISTS ai_prompt_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,

    -- Configuración
    category VARCHAR(50) NOT NULL,           -- academic, creative, code, etc
    generation_type VARCHAR(50) NOT NULL,
    provider VARCHAR(50) DEFAULT 'openai',
    model VARCHAR(100) DEFAULT 'gpt-3.5-turbo',

    -- Prompts
    system_prompt TEXT,
    user_prompt_template TEXT NOT NULL,      -- Con placeholders {topic}, {subject}, etc

    -- Costos
    coin_cost INTEGER DEFAULT 10,
    estimated_tokens INTEGER DEFAULT 500,

    -- Estadísticas
    usage_count INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2),

    -- Estado
    is_active BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false,
    min_level INTEGER DEFAULT 1,             -- Nivel mínimo para usar

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ai_templates_category ON ai_prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_ai_templates_type ON ai_prompt_templates(generation_type);
CREATE INDEX IF NOT EXISTS idx_ai_templates_active ON ai_prompt_templates(is_active);

-- ========================================
-- Datos iniciales: Plantillas de ejemplo
-- ========================================
INSERT INTO ai_prompt_templates (name, slug, description, category, generation_type, system_prompt, user_prompt_template, coin_cost, estimated_tokens)
VALUES
    ('Ensayo Académico', 'essay-academic', 'Genera ensayos bien estructurados', 'academic', 'essay',
     'Eres un asistente académico experto en redacción.',
     'Escribe un ensayo académico sobre: {topic}. Incluye introducción, desarrollo con argumentos y conclusión.',
     15, 1000),

    ('Resumen de Texto', 'summary-text', 'Resume textos largos de forma concisa', 'academic', 'summary',
     'Eres un experto en síntesis de información.',
     'Resume el siguiente texto en los puntos más importantes:\n\n{text}',
     5, 300),

    ('Explicación Simple', 'explain-simple', 'Explica conceptos de forma sencilla', 'academic', 'explanation',
     'Eres un profesor que explica de forma clara y simple.',
     'Explica el concepto de {concept} como si hablaras con un estudiante de preparatoria.',
     8, 500),

    ('Quiz de Práctica', 'quiz-practice', 'Genera preguntas para practicar', 'academic', 'quiz',
     'Eres un experto en evaluación educativa.',
     'Genera 5 preguntas de opción múltiple sobre {topic} con respuestas y explicaciones.',
     10, 800),

    ('Corrector de Gramática', 'grammar-check', 'Revisa y corrige textos', 'academic', 'text',
     'Eres un corrector de estilo y gramática en español.',
     'Revisa el siguiente texto y corrige errores gramaticales y de estilo:\n\n{text}',
     5, 400),

    ('Traductor ES-EN', 'translate-es-en', 'Traduce español a inglés', 'language', 'translation',
     'Eres un traductor profesional español-inglés.',
     'Traduce el siguiente texto de español a inglés:\n\n{text}',
     5, 400),

    ('Generador de Código', 'code-generator', 'Genera código con explicación', 'code', 'code',
     'Eres un programador experto que escribe código limpio y documentado.',
     'Genera código en {language} para: {task}. Incluye comentarios explicativos.',
     12, 600);

-- ========================================
-- FIN DE MIGRACIÓN
-- ========================================
