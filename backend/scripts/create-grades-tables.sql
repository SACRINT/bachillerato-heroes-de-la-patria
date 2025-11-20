-- =====================================================
-- SCRIPT: Crear Tablas del Sistema de Calificaciones
-- Fecha: 19 Nov 2025 - SEMANA 2
--
-- Propósito: Sistema completo de captura y gestión
-- de calificaciones académicas
-- =====================================================

-- =====================================================
-- TABLA 1: Materias
-- =====================================================
CREATE TABLE IF NOT EXISTS materias (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    creditos INTEGER DEFAULT 0,
    semestre INTEGER CHECK (semestre >= 1 AND semestre <= 6),
    area VARCHAR(100), -- 'Básica', 'Propedéutica', 'Capacitación'
    horas_teoricas INTEGER DEFAULT 0,
    horas_practicas INTEGER DEFAULT 0,
    descripcion TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para materias
CREATE INDEX IF NOT EXISTS idx_materias_clave ON materias(clave);
CREATE INDEX IF NOT EXISTS idx_materias_semestre ON materias(semestre);
CREATE INDEX IF NOT EXISTS idx_materias_active ON materias(is_active);

-- =====================================================
-- TABLA 2: Calificaciones
-- =====================================================
CREATE TABLE IF NOT EXISTS calificaciones (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    materia_id INTEGER NOT NULL REFERENCES materias(id) ON DELETE RESTRICT,
    docente_id INTEGER REFERENCES docentes(id) ON DELETE SET NULL,
    parcial INTEGER NOT NULL CHECK (parcial >= 1 AND parcial <= 3),
    calificacion DECIMAL(4, 2) NOT NULL CHECK (calificacion >= 0 AND calificacion <= 10),
    ciclo_escolar VARCHAR(9) NOT NULL, -- Formato: 2024-2025
    fecha_captura TIMESTAMP DEFAULT NOW(),
    observaciones TEXT,
    tipo_evaluacion VARCHAR(50) DEFAULT 'ordinario', -- 'ordinario', 'extraordinario', 'titulo_suficiencia'
    is_final BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraint para evitar duplicados
    CONSTRAINT unique_grade_per_student_subject_partial
        UNIQUE (estudiante_id, materia_id, parcial, ciclo_escolar)
);

-- Índices para calificaciones
CREATE INDEX IF NOT EXISTS idx_calificaciones_estudiante ON calificaciones(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_materia ON calificaciones(materia_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_docente ON calificaciones(docente_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_ciclo ON calificaciones(ciclo_escolar);
CREATE INDEX IF NOT EXISTS idx_calificaciones_parcial ON calificaciones(parcial);
CREATE INDEX IF NOT EXISTS idx_calificaciones_fecha ON calificaciones(fecha_captura);

-- =====================================================
-- TABLA 3: Promedios por ciclo (desnormalización para performance)
-- =====================================================
CREATE TABLE IF NOT EXISTS promedios_ciclo (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    ciclo_escolar VARCHAR(9) NOT NULL,
    promedio_general DECIMAL(4, 2),
    total_materias INTEGER DEFAULT 0,
    materias_aprobadas INTEGER DEFAULT 0,
    materias_reprobadas INTEGER DEFAULT 0,
    creditos_acumulados INTEGER DEFAULT 0,
    ultima_actualizacion TIMESTAMP DEFAULT NOW(),

    CONSTRAINT unique_promedio_estudiante_ciclo
        UNIQUE (estudiante_id, ciclo_escolar)
);

-- Índice para promedios
CREATE INDEX IF NOT EXISTS idx_promedios_estudiante ON promedios_ciclo(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_promedios_ciclo ON promedios_ciclo(ciclo_escolar);

-- =====================================================
-- TABLA 4: Historial de cambios en calificaciones (auditoría)
-- =====================================================
CREATE TABLE IF NOT EXISTS calificaciones_historial (
    id SERIAL PRIMARY KEY,
    calificacion_id INTEGER NOT NULL,
    calificacion_anterior DECIMAL(4, 2),
    calificacion_nueva DECIMAL(4, 2),
    modificado_por INTEGER REFERENCES usuarios(id),
    motivo_cambio TEXT,
    fecha_cambio TIMESTAMP DEFAULT NOW()
);

-- Índice para historial
CREATE INDEX IF NOT EXISTS idx_historial_calificacion ON calificaciones_historial(calificacion_id);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON calificaciones_historial(fecha_cambio);

-- =====================================================
-- FUNCIÓN: Trigger para actualizar promedios automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_promedio_on_grade_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular y actualizar promedio del estudiante para el ciclo
    INSERT INTO promedios_ciclo (estudiante_id, ciclo_escolar, promedio_general, total_materias, materias_aprobadas, materias_reprobadas, ultima_actualizacion)
    SELECT
        NEW.estudiante_id,
        NEW.ciclo_escolar,
        ROUND(AVG(calificacion)::numeric, 2),
        COUNT(DISTINCT materia_id),
        COUNT(DISTINCT CASE WHEN calificacion >= 6 THEN materia_id END),
        COUNT(DISTINCT CASE WHEN calificacion < 6 THEN materia_id END),
        NOW()
    FROM calificaciones
    WHERE estudiante_id = NEW.estudiante_id AND ciclo_escolar = NEW.ciclo_escolar
    ON CONFLICT (estudiante_id, ciclo_escolar)
    DO UPDATE SET
        promedio_general = EXCLUDED.promedio_general,
        total_materias = EXCLUDED.total_materias,
        materias_aprobadas = EXCLUDED.materias_aprobadas,
        materias_reprobadas = EXCLUDED.materias_reprobadas,
        ultima_actualizacion = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trg_update_promedio ON calificaciones;
CREATE TRIGGER trg_update_promedio
AFTER INSERT OR UPDATE ON calificaciones
FOR EACH ROW
EXECUTE FUNCTION update_promedio_on_grade_change();

-- =====================================================
-- INSERTAR DATOS INICIALES - Materias BGE
-- =====================================================
INSERT INTO materias (clave, nombre, creditos, semestre, area, horas_teoricas, horas_practicas) VALUES
    -- Primer semestre
    ('MAT-101', 'Álgebra', 8, 1, 'Básica', 4, 0),
    ('QUI-101', 'Química I', 8, 1, 'Básica', 3, 2),
    ('ETI-101', 'Ética y Valores I', 4, 1, 'Básica', 2, 0),
    ('INF-101', 'Informática I', 6, 1, 'Básica', 2, 2),
    ('TLR-101', 'Taller de Lectura y Redacción I', 6, 1, 'Básica', 3, 1),
    ('ING-101', 'Inglés I', 6, 1, 'Básica', 3, 1),
    ('MET-101', 'Metodología de la Investigación', 6, 1, 'Básica', 3, 1),

    -- Segundo semestre
    ('MAT-201', 'Geometría y Trigonometría', 8, 2, 'Básica', 4, 0),
    ('QUI-201', 'Química II', 8, 2, 'Básica', 3, 2),
    ('ETI-201', 'Ética y Valores II', 4, 2, 'Básica', 2, 0),
    ('INF-201', 'Informática II', 6, 2, 'Básica', 2, 2),
    ('TLR-201', 'Taller de Lectura y Redacción II', 6, 2, 'Básica', 3, 1),
    ('ING-201', 'Inglés II', 6, 2, 'Básica', 3, 1),

    -- Tercer semestre
    ('MAT-301', 'Geometría Analítica', 8, 3, 'Básica', 4, 0),
    ('FIS-301', 'Física I', 8, 3, 'Básica', 3, 2),
    ('BIO-301', 'Biología I', 6, 3, 'Básica', 3, 1),
    ('HIS-301', 'Historia de México I', 6, 3, 'Básica', 3, 1),
    ('LIT-301', 'Literatura I', 6, 3, 'Básica', 3, 1),
    ('ING-301', 'Inglés III', 6, 3, 'Básica', 3, 1),

    -- Cuarto semestre
    ('MAT-401', 'Cálculo Diferencial', 8, 4, 'Básica', 4, 0),
    ('FIS-401', 'Física II', 8, 4, 'Básica', 3, 2),
    ('BIO-401', 'Biología II', 6, 4, 'Básica', 3, 1),
    ('HIS-401', 'Historia de México II', 6, 4, 'Básica', 3, 1),
    ('LIT-401', 'Literatura II', 6, 4, 'Básica', 3, 1),
    ('ING-401', 'Inglés IV', 6, 4, 'Básica', 3, 1),

    -- Quinto semestre
    ('MAT-501', 'Cálculo Integral', 8, 5, 'Propedéutica', 4, 0),
    ('GEO-501', 'Geografía', 6, 5, 'Básica', 3, 1),
    ('EST-501', 'Estructura Socioeconómica de México', 6, 5, 'Básica', 3, 1),
    ('FIL-501', 'Filosofía', 6, 5, 'Básica', 3, 1),
    ('ING-501', 'Inglés V', 6, 5, 'Básica', 3, 1),

    -- Sexto semestre
    ('MAT-601', 'Probabilidad y Estadística', 8, 6, 'Propedéutica', 4, 0),
    ('ECO-601', 'Ecología y Medio Ambiente', 6, 6, 'Básica', 3, 1),
    ('HUM-601', 'Historia Universal Contemporánea', 6, 6, 'Básica', 3, 1),
    ('PSI-601', 'Psicología', 6, 6, 'Básica', 3, 1),
    ('ING-601', 'Inglés VI', 6, 6, 'Básica', 3, 1)
ON CONFLICT (clave) DO NOTHING;

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE calificaciones IS 'Calificaciones de estudiantes por materia y parcial';
COMMENT ON TABLE materias IS 'Catálogo de materias del plan de estudios BGE';
COMMENT ON TABLE promedios_ciclo IS 'Promedios calculados por estudiante y ciclo escolar';
COMMENT ON TABLE calificaciones_historial IS 'Auditoría de cambios en calificaciones';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('calificaciones', 'materias', 'promedios_ciclo', 'calificaciones_historial')
ORDER BY table_name;
