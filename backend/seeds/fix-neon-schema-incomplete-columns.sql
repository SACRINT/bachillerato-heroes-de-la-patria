-- =====================================================
-- 🔧 FIX SCHEMA NEON - Agregar columnas faltantes
-- Análisis: 2025-11-02
-- Objetivo: Completar schema sin romper código existente
-- =====================================================

-- =====================================================
-- 1. TABLA: usuarios
-- =====================================================
-- Problema: Faltan columnas nombre, apellido_paterno, apellido_materno
-- Impacto: Registro de usuarios y perfil incompletos

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS nombre VARCHAR(100),
ADD COLUMN IF NOT EXISTS apellido_paterno VARCHAR(100),
ADD COLUMN IF NOT EXISTS apellido_materno VARCHAR(100);

-- Verificación
SELECT 'usuarios - Columnas agregadas:' as operacion;
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'usuarios' AND column_name IN ('nombre', 'apellido_paterno', 'apellido_materno')
ORDER BY column_name;

-- =====================================================
-- 2. TABLA: calificaciones
-- =====================================================
-- Problema: Faltan columnas de tipos de calificación y status
-- Impacto: Sistema de calificaciones incompleto

ALTER TABLE calificaciones
ADD COLUMN IF NOT EXISTS partial_grade NUMERIC,
ADD COLUMN IF NOT EXISTS continuous_assessment_grade NUMERIC,
ADD COLUMN IF NOT EXISTS final_grade NUMERIC,
ADD COLUMN IF NOT EXISTS status VARCHAR(50);

-- Nota: Mantener nombres españoles (estudiante_id, materia_id, parcial)
-- para coherencia con el resto del código en español

-- Verificación
SELECT 'calificaciones - Columnas agregadas:' as operacion;
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'calificaciones' AND column_name IN ('partial_grade', 'continuous_assessment_grade', 'final_grade', 'status')
ORDER BY column_name;

-- =====================================================
-- 3. TABLA: estudiantes
-- =====================================================
-- Revisión: La tabla tiene estructura básica
-- Mejora sugerida: Agregar campos académicos importantes si faltan

ALTER TABLE estudiantes
ADD COLUMN IF NOT EXISTS curp VARCHAR(18) UNIQUE,
ADD COLUMN IF NOT EXISTS tutor_id INTEGER,
ADD COLUMN IF NOT EXISTS grupo_id INTEGER,
ADD COLUMN IF NOT EXISTS status_academico VARCHAR(50);

-- Verificación
SELECT 'estudiantes - Columnas agregadas:' as operacion;
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'estudiantes' AND column_name IN ('curp', 'tutor_id', 'grupo_id', 'status_academico')
ORDER BY column_name;

-- =====================================================
-- 4. TABLA: docentes
-- =====================================================
-- Mejora: Agregar usuario_id para vincular con tabla usuarios

ALTER TABLE docentes
ADD COLUMN IF NOT EXISTS usuario_id INTEGER;

-- Verificación
SELECT 'docentes - Columnas agregadas:' as operacion;
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'docentes' AND column_name = 'usuario_id';

-- =====================================================
-- RESUMEN FINAL
-- =====================================================
-- Tablas verificadas y actualizadas:
-- ✅ usuarios - Agregadas: nombre, apellido_paterno, apellido_materno
-- ✅ calificaciones - Agregadas: partial_grade, continuous_assessment_grade, final_grade, status
-- ✅ estudiantes - Agregadas: curp, tutor_id, grupo_id, status_academico
-- ✅ docentes - Agregadas: usuario_id
--
-- NOTA IMPORTANTE:
-- No se renombraron tablas ni columnas para mantener compatibilidad
-- con código existente que usa nombres en español.
-- =====================================================

SELECT 'Schema update completado exitosamente' as resultado;
