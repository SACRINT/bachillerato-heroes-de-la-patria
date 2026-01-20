-- Migration: Sistema de Aprendizaje Adaptativo e IA
-- Semana 56-65: Lecciones Adaptativas + Herramientas de IA
-- 1. Estilos de Aprendizaje (VARK)
CREATE TABLE IF NOT EXISTS learning_styles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    visual INTEGER DEFAULT 0,
    auditivo INTEGER DEFAULT 0,
    kinestesico INTEGER DEFAULT 0,
    lectura_escritura INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_learning_styles_user ON learning_styles(user_id);
-- 2. Contenidos Educativos
CREATE TABLE IF NOT EXISTS contenidos_educativos (
    id SERIAL PRIMARY KEY,
    materia_id INTEGER REFERENCES materias(id),
    tema VARCHAR(255) NOT NULL,
    descripcion TEXT,
    nivel_dificultad INTEGER DEFAULT 5,
    -- 1-10
    tipo_recurso VARCHAR(50),
    -- video, audio, lectura, practica, simulacion
    url_recurso TEXT,
    orden INTEGER DEFAULT 0,
    importancia INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_contenidos_materia ON contenidos_educativos(materia_id);
CREATE INDEX IF NOT EXISTS idx_contenidos_nivel ON contenidos_educativos(nivel_dificultad);
-- 3. Rutas de Aprendizaje Personalizadas
CREATE TABLE IF NOT EXISTS learning_paths (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    materia_id INTEGER REFERENCES materias(id),
    path_data JSONB NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_learning_paths_user ON learning_paths(user_id);
-- 4. Evaluaciones Adaptativas
CREATE TABLE IF NOT EXISTS adaptive_assessments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    materia_id INTEGER REFERENCES materias(id),
    nivel_inicial INTEGER DEFAULT 5,
    nivel_final INTEGER,
    correctas INTEGER DEFAULT 0,
    incorrectas INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_adaptive_assessments_user ON adaptive_assessments(user_id);
-- 5. Progreso de Aprendizaje
CREATE TABLE IF NOT EXISTS learning_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    contenido_id INTEGER REFERENCES contenidos_educativos(id),
    completado BOOLEAN DEFAULT false,
    tiempo_gastado INTEGER DEFAULT 0,
    -- segundos
    fecha_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accesos INTEGER DEFAULT 1,
    UNIQUE(user_id, contenido_id)
);
CREATE INDEX IF NOT EXISTS idx_learning_progress_user ON learning_progress(user_id);
-- Only create index if column exists
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'learning_progress'
        AND column_name = 'contenido_id'
) THEN CREATE INDEX IF NOT EXISTS idx_learning_progress_contenido ON learning_progress(contenido_id);
END IF;
END $$;
-- Agregar columna progreso_general a usuarios
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS progreso_general INTEGER DEFAULT 0;
-- 6. Banco de Preguntas para Evaluaciones
CREATE TABLE IF NOT EXISTS banco_preguntas (
    id SERIAL PRIMARY KEY,
    materia_id INTEGER REFERENCES materias(id),
    pregunta TEXT NOT NULL,
    nivel_dificultad INTEGER DEFAULT 5,
    opciones JSONB NOT NULL,
    respuesta_correcta VARCHAR(10) NOT NULL,
    explicacion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_banco_preguntas_materia ON banco_preguntas(materia_id);
CREATE INDEX IF NOT EXISTS idx_banco_preguntas_nivel ON banco_preguntas(nivel_dificultad);
-- 7. Conversaciones con Tutor IA
CREATE TABLE IF NOT EXISTS ai_tutor_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    mensaje_usuario TEXT NOT NULL,
    respuesta_ia TEXT NOT NULL,
    contexto JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_tutor_conversations(user_id);
-- 8. Conceptos y Grafo de Conocimiento
CREATE TABLE IF NOT EXISTS conceptos (
    id SERIAL PRIMARY KEY,
    materia_id INTEGER REFERENCES materias(id),
    tema VARCHAR(255),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    nivel INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS concepto_relaciones (
    id SERIAL PRIMARY KEY,
    concepto_origen INTEGER REFERENCES conceptos(id) ON DELETE CASCADE,
    concepto_destino INTEGER REFERENCES conceptos(id) ON DELETE CASCADE,
    tipo_relacion VARCHAR(50) DEFAULT 'relacionado',
    -- prerequisito, relacionado, derivado
    UNIQUE(concepto_origen, concepto_destino)
);
CREATE INDEX IF NOT EXISTS idx_conceptos_materia ON conceptos(materia_id);
CREATE INDEX IF NOT EXISTS idx_relaciones_origen ON concepto_relaciones(concepto_origen);
-- 9. Predicciones de Deserción
CREATE TABLE IF NOT EXISTS dropout_predictions (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    riesgo_porcentaje INTEGER NOT NULL,
    nivel_riesgo VARCHAR(20),
    -- bajo, medio, alto
    features JSONB NOT NULL,
    intervencion_realizada BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Only create estudiante_id indexes if column exists
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'dropout_predictions'
        AND column_name = 'estudiante_id'
) THEN CREATE INDEX IF NOT EXISTS idx_dropout_estudiante ON dropout_predictions(estudiante_id);
END IF;
END $$;
-- Only create nivel_riesgo index if column exists
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'dropout_predictions'
        AND column_name = 'nivel_riesgo'
) THEN CREATE INDEX IF NOT EXISTS idx_dropout_nivel ON dropout_predictions(nivel_riesgo);
END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_dropout_fecha ON dropout_predictions(created_at DESC);
-- 10. Análisis de Sentimiento
CREATE TABLE IF NOT EXISTS sentiment_analysis (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id),
    texto TEXT NOT NULL,
    sentimiento VARCHAR(20),
    -- positivo, negativo, neutral
    score DECIMAL(3, 2),
    confianza VARCHAR(10),
    fuente VARCHAR(50),
    -- foro, comentario, evaluacion
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sentiment_user ON sentiment_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_tipo ON sentiment_analysis(sentimiento);
-- 11. Comandos de Voz
CREATE TABLE IF NOT EXISTS voice_commands (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    transcription TEXT NOT NULL,
    intent JSONB,
    result JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_voice_commands_user ON voice_commands(user_id);
-- 12. Vistas útiles (omitidas - pueden tener incompatibilidades con esquema existente)
-- Las vistas se pueden crear manualmente después si es necesario
-- 13. Funciones
CREATE OR REPLACE FUNCTION recalcular_progreso_general(p_user_id INTEGER) RETURNS INTEGER AS $$
DECLARE progreso INTEGER;
BEGIN
SELECT AVG(
        CASE
            WHEN completado THEN 100
            ELSE 0
        END
    )::INTEGER INTO progreso
FROM learning_progress
WHERE user_id = p_user_id;
UPDATE usuarios
SET progreso_general = COALESCE(progreso, 0)
WHERE id = p_user_id;
RETURN COALESCE(progreso, 0);
END;
$$ LANGUAGE plpgsql;
-- 14. Trigger para actualizar progreso automáticamente
CREATE OR REPLACE FUNCTION trigger_update_progress() RETURNS TRIGGER AS $$ BEGIN PERFORM recalcular_progreso_general(NEW.user_id);
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trigger_learning_progress_update ON learning_progress;
CREATE TRIGGER trigger_learning_progress_update
AFTER
INSERT
    OR
UPDATE ON learning_progress FOR EACH ROW EXECUTE FUNCTION trigger_update_progress();
-- 15. Datos de ejemplo
INSERT INTO conceptos (materia_id, tema, nombre, descripcion, nivel)
VALUES (
        1,
        'Álgebra',
        'Ecuaciones lineales',
        'Ecuaciones de primer grado',
        1
    ),
    (
        1,
        'Álgebra',
        'Sistemas de ecuaciones',
        'Sistemas 2x2 y 3x3',
        2
    ),
    (
        1,
        'Geometría',
        'Teorema de Pitágoras',
        'Relación entre lados de triángulo rectángulo',
        2
    ),
    (
        2,
        'Revolución',
        'Independencia de México',
        'Proceso de independencia 1810-1821',
        1
    ) ON CONFLICT DO NOTHING;
-- 16. Comentarios
COMMENT ON TABLE learning_styles IS 'Estilos de aprendizaje VARK por usuario';
COMMENT ON TABLE contenidos_educativos IS 'Catálogo de recursos educativos';
COMMENT ON TABLE learning_paths IS 'Rutas de aprendizaje personalizadas';
COMMENT ON TABLE adaptive_assessments IS 'Evaluaciones adaptativas por dificultad';
COMMENT ON TABLE learning_progress IS 'Progreso de aprendizaje por contenido';
COMMENT ON TABLE ai_tutor_conversations IS 'Conversaciones con tutor IA';
COMMENT ON TABLE dropout_predictions IS 'Predicciones de riesgo de deserción';
COMMENT ON TABLE sentiment_analysis IS 'Análisis de sentimiento en texto';
-- Fin de migración