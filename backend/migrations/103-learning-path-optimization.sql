-- 📚 MIGRACIÓN 103: LEARNING PATH OPTIMIZATION
-- Propósito: Rutas de aprendizaje dinámicas y personalizadas (Fase 6 - Semana 43)
-- 1. Definición de Rutas de Aprendizaje Base
CREATE TABLE IF NOT EXISTS learning_paths (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_role VARCHAR(100),
    -- 'Data Scientist', 'Full Stack Dev', 'Bachillerato General'
    base_structure_json JSONB NOT NULL,
    -- Grafo de módulos [ { "module_id": 1, "next": [2, 3] } ]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 2. Rutas Personalizadas por Usuario (Instancia)
CREATE TABLE IF NOT EXISTS user_learning_paths (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    path_id INTEGER REFERENCES learning_paths(id),
    current_structure_json JSONB NOT NULL,
    -- Estructura modificada dinámicamente
    progress_status VARCHAR(50) DEFAULT 'active',
    last_optimization_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, path_id)
);
-- 3. Registro de Desviaciones / Optimizaciones
-- Guarda qué cambios hizo el algoritmo (e.g. "Agregado módulo de refuerzo de Álgebra")
CREATE TABLE IF NOT EXISTS path_optimizations_log (
    id SERIAL PRIMARY KEY,
    user_path_id INTEGER REFERENCES user_learning_paths(id) ON DELETE CASCADE,
    trigger_reason VARCHAR(100),
    -- 'failed_exam', 'low_engagement', 'advanced_placement'
    action_taken VARCHAR(100),
    -- 'add_module', 'skip_module', 'reorder'
    details_json JSONB,
    -- { "added_module_id": 50 }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_user_paths_user ON user_learning_paths(user_id);