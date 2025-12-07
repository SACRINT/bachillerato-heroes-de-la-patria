-- 📊 MIGRACIÓN 050: Sistema de Calificaciones (CORREGIDA)
-- Fecha: 06 Diciembre 2025
-- Autor: Gemini Agent
BEGIN;
-- 1. Tabla de Periodos de Evaluación
CREATE TABLE IF NOT EXISTS periodos_evaluacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    codigo VARCHAR(20) NOT NULL,
    ciclo_escolar VARCHAR(20) NOT NULL,
    fecha_inicio_captura TIMESTAMP,
    fecha_fin_captura TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(codigo, ciclo_escolar)
);
-- 2. Asegurar estructura de Materias (Subjects)
CREATE TABLE IF NOT EXISTS materias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
-- Agregar columnas a materias si no existen (Soporte para tabla legacy)
ALTER TABLE materias
ADD COLUMN IF NOT EXISTS clave VARCHAR(20);
ALTER TABLE materias
ADD COLUMN IF NOT EXISTS semestre INTEGER;
ALTER TABLE materias
ADD COLUMN IF NOT EXISTS grupo VARCHAR(10);
ALTER TABLE materias
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'basica';
ALTER TABLE materias
ADD COLUMN IF NOT EXISTS docente_id INTEGER REFERENCES docentes(id);
ALTER TABLE materias
ADD COLUMN IF NOT EXISTS activa BOOLEAN DEFAULT TRUE;
ALTER TABLE materias
ADD COLUMN IF NOT EXISTS horario VARCHAR(100);
ALTER TABLE materias
ADD COLUMN IF NOT EXISTS aula VARCHAR(50);
-- 3. Asegurar Inscripciones (Alumnos <-> Materias)
CREATE TABLE IF NOT EXISTS inscripciones_materias (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER REFERENCES estudiantes(id) ON DELETE CASCADE,
    materia_id INTEGER REFERENCES materias(id) ON DELETE CASCADE,
    fecha_inscripcion TIMESTAMP DEFAULT NOW(),
    calificacion_final NUMERIC(4, 2),
    status VARCHAR(20) DEFAULT 'cursando',
    UNIQUE(estudiante_id, materia_id)
);
-- 4. Tabla Central de Calificaciones (Grades)
CREATE TABLE IF NOT EXISTS calificaciones (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER NOT NULL REFERENCES estudiantes(id),
    materia_id INTEGER NOT NULL REFERENCES materias(id),
    periodo_evaluacion_id INTEGER NOT NULL REFERENCES periodos_evaluacion(id),
    -- Datos académicos
    calificacion NUMERIC(4, 2) NOT NULL CHECK (
        calificacion >= 0
        AND calificacion <= 10
    ),
    faltas INTEGER DEFAULT 0 CHECK (faltas >= 0),
    -- Metadatos y Auditoría
    observaciones TEXT,
    captured_by INTEGER REFERENCES usuarios(id),
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Restricción: Un alumno solo tiene una calificación por materia y periodo
    UNIQUE(estudiante_id, materia_id, periodo_evaluacion_id)
);
-- Índices para optimizar consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_calificaciones_estudiante ON calificaciones(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_materia ON calificaciones(materia_id);
-- El índice idx_materias_docente falló anteriormente porque la columna no existía en la tabla legacy.
-- Ahora que hicimos ALTER TABLE ADD COLUMN, debería funcionar.
CREATE INDEX IF NOT EXISTS idx_materias_docente ON materias(docente_id);
-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
DROP TRIGGER IF EXISTS update_calificaciones_modtime ON calificaciones;
CREATE TRIGGER update_calificaciones_modtime BEFORE
UPDATE ON calificaciones FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
COMMIT;