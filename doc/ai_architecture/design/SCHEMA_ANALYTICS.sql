-- ============================================
-- SCHEMA ANALÍTICO Y FALTANTE (Week 2 Design)
-- Propósito: Cubrir brechas para IA (Calificaciones) y preparar Analytics
-- Motor: PostgreSQL
-- ============================================
-- ============================================
-- 0. PRERREQUISITOS
-- ============================================
CREATE EXTENSION IF NOT EXISTS vector;
-- Requerido para 'vector(1536)'
-- 1. TABLA CORE FALTANTE: CALIFICACIONES (Requisito para Early Warning)
CREATE TABLE IF NOT EXISTS calificaciones (
    id SERIAL PRIMARY KEY,
    estudiante_id INT REFERENCES estudiantes(id) ON DELETE CASCADE,
    materia_id INT,
    -- Si existe tabla materias, referenciar. Si no, VARCHAR temporal.
    materia_nombre VARCHAR(100),
    -- Fallback si no hay ID
    docente_id INT REFERENCES docentes(id),
    parcial INT NOT NULL CHECK (
        parcial BETWEEN 1 AND 4
    ),
    -- 1, 2, 3, Final/Extra
    calificacion DECIMAL(4, 2) NOT NULL CHECK (
        calificacion >= 0
        AND calificacion <= 10
    ),
    faltas INT DEFAULT 0,
    observaciones TEXT,
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    periodo_escolar VARCHAR(20) -- Ej: '2025-A'
);
CREATE INDEX IF NOT EXISTS idx_calificaciones_estudiante ON calificaciones(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_riesgo ON calificaciones(calificacion)
WHERE calificacion < 6.0;
-- 2. TABLA ANALÍTICA: FACT_STUDENT_DAILY_ACTIVITY (Data Warehouse Star Schema)
-- Propósito: Métrica unificada diaria de actividad por alumno
CREATE TABLE IF NOT EXISTS analytics_student_activity_daily (
    id BIGSERIAL PRIMARY KEY,
    estudiante_id INT NOT NULL,
    fecha DATE NOT NULL,
    -- Métricas de Engagement
    login_count INT DEFAULT 0,
    documents_read INT DEFAULT 0,
    chatbot_interactions INT DEFAULT 0,
    -- Métricas Académicas (Calculadas)
    tareas_entregadas INT DEFAULT 0,
    retraso_promedio_minutos INT DEFAULT 0,
    -- Estado calculado por IA
    risk_score DECIMAL(3, 2),
    -- 0.00 a 1.00 calculado nocturno
    sentiment_score DECIMAL(3, 2),
    -- -1.0 a 1.0 (análisis de comentarios)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(estudiante_id, fecha)
);
-- 3. TABLA: AI_INTERACTION_LOGS (Auditoría y Reentrenamiento)
-- Propósito: Guardar interacción cruda para fine-tuning (SIN PII directa si es posible)
CREATE TABLE IF NOT EXISTS ai_interaction_logs (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    user_hash VARCHAR(64),
    -- Identificador pseudo-anonimizado
    role_type VARCHAR(20),
    -- 'estudiante', 'docente'
    -- Interacción
    model_version VARCHAR(50),
    -- 'gpt-4o-mini', 'llama-3-local'
    prompt_tokens INT,
    completion_tokens INT,
    latency_ms INT,
    -- Contenido (Cuidado con PII)
    user_query TEXT,
    ai_response TEXT,
    -- Feedback
    user_feedback_score INT,
    -- 1 (thump up) / -1 (thumb down)
    user_feedback_text TEXT,
    -- Contexto RAG
    retrieved_doc_ids TEXT [],
    -- Array de IDs de chunks usados
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 4. TABLA: STUDENT_360_PROFILE (Feature Store simplificado)
-- Propósito: Tabla plana desnormalizada para inferencia rápida del modelo de riesgo
CREATE TABLE IF NOT EXISTS feature_store_student_360 (
    estudiante_id INT PRIMARY KEY,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    -- Features Demográficos (Estáticos)
    edad INT,
    distancia_escuela_km DECIMAL(5, 2),
    -- Features Académicos (Dinámicos - Ventana 30 días)
    promedio_actual DECIMAL(4, 2),
    tendencia_calificaciones DECIMAL(4, 2),
    -- Pendiente de la recta de regresión
    total_faltas_acumuladas INT,
    -- Features Comportamiento (Dinámicos)
    dias_sin_login INT,
    uso_biblioteca_score DECIMAL(3, 2),
    vector_intereses_embedding VECTOR(1536) -- Para recomendación (Requiere pgvector)
);