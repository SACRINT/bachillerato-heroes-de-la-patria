-- Migration: Laboratorios Virtuales y Preparación de Metaverso
-- Semana 66-70: Labs 3D + VR Testing + Documentación
-- 1. Experimentos de Laboratorio
CREATE TABLE IF NOT EXISTS lab_experiments (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL,
    -- quimica, fisica, biologia
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    nivel_educativo VARCHAR(50),
    -- bachillerato, preparatoria
    dificultad INTEGER DEFAULT 5,
    -- 1-10
    duracion_estimada INTEGER DEFAULT 30,
    -- minutos
    assets_3d JSONB DEFAULT '{}',
    -- URLs y configuración de modelos 3D
    instrucciones JSONB DEFAULT '[]',
    objetivos_aprendizaje TEXT [],
    requisitos_previos TEXT [],
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lab_experiments_tipo ON lab_experiments(tipo);
CREATE INDEX IF NOT EXISTS idx_lab_experiments_dificultad ON lab_experiments(dificultad);
-- 2. Sesiones de Laboratorio
CREATE TABLE IF NOT EXISTS lab_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    experimento_id INTEGER NOT NULL REFERENCES lab_experiments(id),
    tipo_lab VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'en_progreso',
    -- en_progreso, completado, abandonado
    progreso INTEGER DEFAULT 0,
    -- 0-100
    tiempo_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tiempo_fin TIMESTAMP,
    datos_sesion JSONB DEFAULT '{}',
    resultados JSONB,
    calificacion DECIMAL(3, 1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lab_sessions_user ON lab_sessions(user_id);
-- Only create experimento_id index if column exists
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'lab_sessions'
        AND column_name = 'experimento_id'
) THEN CREATE INDEX IF NOT EXISTS idx_lab_sessions_experimento ON lab_sessions(experimento_id);
END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_lab_sessions_status ON lab_sessions(status);
-- 3. Progreso por Pasos del Laboratorio
CREATE TABLE IF NOT EXISTS lab_progress_steps (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES lab_sessions(id) ON DELETE CASCADE,
    paso_numero INTEGER NOT NULL,
    datos_paso JSONB NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lab_progress_session ON lab_progress_steps(session_id);
-- 4. Reactivos Químicos (para lab de química)
CREATE TABLE IF NOT EXISTS lab_reactivos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    formula_quimica VARCHAR(100),
    modelo_3d_url TEXT,
    propiedades JSONB DEFAULT '{}',
    peligrosidad VARCHAR(20) DEFAULT 'baja' -- baja, media, alta
);
-- Add experimento_id column if doesn't exist (wrapped in DO block)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'lab_reactivos'
        AND column_name = 'experimento_id'
) THEN
ALTER TABLE lab_reactivos
ADD COLUMN experimento_id INTEGER;
END IF;
-- Create index if column exists
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'lab_reactivos'
        AND column_name = 'experimento_id'
) THEN CREATE INDEX IF NOT EXISTS idx_lab_reactivos_experimento ON lab_reactivos(experimento_id);
END IF;
END $$;
-- 5. Pasos del Experimento
CREATE TABLE IF NOT EXISTS lab_pasos (
    id SERIAL PRIMARY KEY,
    experimento_id INTEGER NOT NULL REFERENCES lab_experiments(id) ON DELETE CASCADE,
    orden INTEGER NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    instruccion_visual_url TEXT,
    validacion_criterios JSONB,
    tiempo_estimado INTEGER DEFAULT 5 -- minutos
);
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'lab_pasos'
        AND column_name = 'experimento_id'
) THEN CREATE INDEX IF NOT EXISTS idx_lab_pasos_experimento ON lab_pasos(experimento_id);
END IF;
END $$;
-- 6. Muestras Biológicas (para lab de biología)
CREATE TABLE IF NOT EXISTS lab_muestras (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(100),
    -- celula, tejido, organismo
    magnificacion_recomendada INTEGER DEFAULT 400,
    imagen_microscopio_url TEXT,
    modelo_3d_url TEXT,
    descripcion TEXT
);
-- Add experimento_id column if doesn't exist (wrapped in DO block)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'lab_muestras'
        AND column_name = 'experimento_id'
) THEN
ALTER TABLE lab_muestras
ADD COLUMN experimento_id INTEGER;
END IF;
-- Create index if column exists
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'lab_muestras'
        AND column_name = 'experimento_id'
) THEN CREATE INDEX IF NOT EXISTS idx_lab_muestras_experimento ON lab_muestras(experimento_id);
END IF;
END $$;
-- 7. Integración Labs con Evaluaciones
CREATE TABLE IF NOT EXISTS assessment_lab_results (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL,
    lab_session_id INTEGER NOT NULL REFERENCES lab_sessions(id),
    calificacion DECIMAL(3, 1) NOT NULL,
    peso_porcentaje INTEGER DEFAULT 20,
    -- % que vale el lab en la evaluación
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_assessment_lab_assessment ON assessment_lab_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_lab_session ON assessment_lab_results(lab_session_id);
-- 8. Assets del Metaverso
CREATE TABLE IF NOT EXISTS metaverse_assets (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    -- modelo, textura, audio, animacion
    categoria VARCHAR(100),
    -- avatar, edificio, mobiliario, laboratorio
    url_original TEXT NOT NULL,
    url_optimizado TEXT,
    tamanio_mb DECIMAL(10, 2),
    vertices INTEGER,
    vertices_optimizados INTEGER,
    formato VARCHAR(20),
    -- gltf, glb, fbx
    optimizado BOOLEAN DEFAULT false,
    lod_configurado BOOLEAN DEFAULT false,
    -- Level of Detail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_metaverse_assets_tipo ON metaverse_assets(tipo);
CREATE INDEX IF NOT EXISTS idx_metaverse_assets_optimizado ON metaverse_assets(optimizado);
-- 9. Resultados de Tests VR
CREATE TABLE IF NOT EXISTS vr_test_results (
    id SERIAL PRIMARY KEY,
    dispositivo VARCHAR(100) NOT NULL,
    fps_promedio INTEGER,
    fps_minimo INTEGER,
    latencia_ms INTEGER,
    memoria_mb INTEGER,
    aprobado BOOLEAN DEFAULT false,
    notas TEXT,
    fecha_test TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vr_tests_dispositivo ON vr_test_results(dispositivo);
CREATE INDEX IF NOT EXISTS idx_vr_tests_fecha ON vr_test_results(fecha_test DESC);
-- 10. Documentación Técnica
CREATE TABLE IF NOT EXISTS documentacion_tecnica (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    -- metaverso, api, labs
    titulo VARCHAR(255),
    contenido TEXT NOT NULL,
    version VARCHAR(20),
    formato VARCHAR(20) DEFAULT 'markdown',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_docs_tipo ON documentacion_tecnica(tipo);
-- 11. Demos para Escuelas
CREATE TABLE IF NOT EXISTS school_demos (
    id SERIAL PRIMARY KEY,
    school_id INTEGER,
    nombre_escuela VARCHAR(255),
    config JSONB NOT NULL,
    url_demo TEXT NOT NULL,
    activo BOOLEAN DEFAULT true,
    vistas INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_school_demos_school ON school_demos(school_id);
CREATE INDEX IF NOT EXISTS idx_school_demos_activo ON school_demos(activo)
WHERE activo = true;
-- 12. Vistas útiles (omitidas - pueden tener incompatibilidades con esquema existente)
-- Las vistas se pueden crear manualmente después si es necesario
-- 13. Funciones
CREATE OR REPLACE FUNCTION get_lab_leaderboard(p_tipo_lab VARCHAR) RETURNS TABLE (
        user_id INTEGER,
        nombre VARCHAR,
        experimentos_completados BIGINT,
        calificacion_promedio DECIMAL,
        tiempo_total_min INTEGER
    ) AS $$ BEGIN RETURN QUERY
SELECT u.id,
    u.nombre,
    COUNT(ls.id) as experimentos_completados,
    AVG(ls.calificacion) as calificacion_promedio,
    CAST(
        SUM(
            EXTRACT(
                EPOCH
                FROM (ls.tiempo_fin - ls.tiempo_inicio)
            ) / 60
        ) AS INTEGER
    ) as tiempo_total_min
FROM usuarios u
    JOIN lab_sessions ls ON u.id = ls.user_id
WHERE ls.tipo_lab = p_tipo_lab
    AND ls.status = 'completado'
GROUP BY u.id,
    u.nombre
ORDER BY calificacion_promedio DESC,
    experimentos_completados DESC
LIMIT 10;
END;
$$ LANGUAGE plpgsql;
-- 14. Insertar experimentos de ejemplo
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM lab_experiments
    LIMIT 1
) THEN -- Química
INSERT INTO lab_experiments (
        tipo,
        nombre,
        descripcion,
        dificultad,
        duracion_estimada
    )
VALUES (
        'quimica',
        'Reacción Ácido-Base',
        'Neutralización de HCl con NaOH',
        3,
        15
    ),
    (
        'quimica',
        'Síntesis de Agua',
        'Combinación de H2 y O2 para formar H2O',
        5,
        20
    ),
    (
        'quimica',
        'Tabla Periódica Interactiva',
        'Exploración de elementos y propiedades',
        2,
        10
    );
-- Física
INSERT INTO lab_experiments (
        tipo,
        nombre,
        descripcion,
        dificultad,
        duracion_estimada
    )
VALUES (
        'fisica',
        'Movimiento Parabólico',
        'Proyectiles y trayectorias',
        4,
        20
    ),
    (
        'fisica',
        'Ley de Hooke',
        'Elasticidad de resortes',
        3,
        15
    ),
    (
        'fisica',
        'Péndulo Simple',
        'Periodo y frecuencia',
        3,
        15
    );
-- Biología
INSERT INTO lab_experiments (
        tipo,
        nombre,
        descripcion,
        dificultad,
        duracion_estimada
    )
VALUES (
        'biologia',
        'Células Epiteliales',
        'Observación de células humanas',
        2,
        15
    ),
    (
        'biologia',
        'Mitosis Vegetal',
        'División celular en plantas',
        4,
        25
    ),
    (
        'biologia',
        'Microorganismos',
        'Bacterias y protozoarios',
        3,
        20
    );
END IF;
END $$;
-- 15. Comentarios
COMMENT ON TABLE lab_experiments IS 'Catálogo de experimentos virtuales de laboratorio';
COMMENT ON TABLE lab_sessions IS 'Sesiones de usuario en laboratorios virtuales';
COMMENT ON TABLE metaverse_assets IS 'Assets 3D para el metaverso educativo';
COMMENT ON TABLE vr_test_results IS 'Resultados de pruebas de compatibilidad VR';
COMMENT ON TABLE school_demos IS 'Demos personalizadas para escuelas clientes';
-- Fin de migración