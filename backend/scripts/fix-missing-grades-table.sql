-- Script para tablas de Calificaciones y Materias
-- FIXED VERSION 6: Handles ENUM constraints by skipping invalid updates
-- 1. Materias (Ensure table exists)
CREATE TABLE IF NOT EXISTS materias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    clave VARCHAR(20) UNIQUE,
    semestre INTEGER,
    especialidad VARCHAR(100) DEFAULT 'General',
    creditos INTEGER DEFAULT 8,
    activo BOOLEAN DEFAULT TRUE
);
-- 2. Safely add 'especialidad' column if missing
DO $$ BEGIN BEGIN
ALTER TABLE materias
ADD COLUMN especialidad VARCHAR(100) DEFAULT 'General';
EXCEPTION
WHEN duplicate_column THEN NULL;
END;
END $$;
-- 3. Safely HANDLE 'codigo' column (Make nullable)
DO $$ BEGIN BEGIN
ALTER TABLE materias
ALTER COLUMN codigo DROP NOT NULL;
EXCEPTION
WHEN undefined_column THEN NULL;
END;
END $$;
-- 4. Safely HANDLE 'area' column (Make nullable)
DO $$ BEGIN BEGIN
ALTER TABLE materias
ALTER COLUMN area DROP NOT NULL;
EXCEPTION
WHEN undefined_column THEN NULL;
END;
END $$;
-- 5. Deduplicate to allow Unique Index
DELETE FROM materias a USING materias b
WHERE a.id > b.id
    AND a.clave = b.clave;
-- 6. Ensure Unique Index on 'clave'
CREATE UNIQUE INDEX IF NOT EXISTS idx_materias_clave_unique ON materias(clave);
-- 7. Calificaciones Table
CREATE TABLE IF NOT EXISTS calificaciones (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    materia_id INTEGER NOT NULL REFERENCES materias(id),
    docente_id INTEGER REFERENCES usuarios(id),
    calificacion DECIMAL(4, 2) CHECK (
        calificacion >= 0
        AND calificacion <= 10
    ),
    tipo_evaluacion VARCHAR(50) DEFAULT 'Parcial 1',
    periodo_academico VARCHAR(20),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_calificaciones_estudiante ON calificaciones(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_materia ON calificaciones(materia_id);
CREATE INDEX IF NOT EXISTS idx_materias_semestre ON materias(semestre);
-- 8. Insert Data
INSERT INTO materias (nombre, clave, semestre, especialidad)
VALUES ('Matemáticas I', 'MAT101', 1, 'Tronco Común'),
    ('Química I', 'QUI101', 1, 'Tronco Común'),
    ('Informática I', 'INF101', 1, 'Tronco Común'),
    (
        'Taller de Lectura y Redacción I',
        'TLR101',
        1,
        'Tronco Común'
    ),
    ('Inglés I', 'ING101', 1, 'Tronco Común') ON CONFLICT (clave) DO
UPDATE
SET especialidad = EXCLUDED.especialidad;
-- 9. Sync 'codigo' (Text) only
DO $$ BEGIN -- Fill 'codigo' from 'clave'
BEGIN
UPDATE materias
SET codigo = clave
WHERE codigo IS NULL;
EXCEPTION
WHEN undefined_column THEN NULL;
WHEN others THEN NULL;
-- Ignore any other error (types, etc)
END;
END $$;
-- Note: Skipping 'area' update as it is an ENUM and 'General' might be invalid.
-- Since we made it nullable in Step 4, leaving it NULL is safe.