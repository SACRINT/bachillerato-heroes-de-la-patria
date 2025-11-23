-- Migración para optimización de rendimiento - Semana 26

-- Índice en la clave foránea de calificaciones para acelerar los JOINs.
CREATE INDEX IF NOT EXISTS idx_calificaciones_estudiante_id ON public.calificaciones(estudiante_id);

-- Índice en la columna usada para filtrar en la tabla de estudiantes.
CREATE INDEX IF NOT EXISTS idx_estudiantes_semestre ON public.estudiantes(semestre);

-- Índice compuesto para la tabla de calificaciones que puede ayudar en búsquedas más complejas.
CREATE INDEX IF NOT EXISTS idx_calificaciones_materia_id_estudiante_id ON public.calificaciones(materia_id, estudiante_id);

-- Índice en la columna de fecha para reportes de tendencias.
CREATE INDEX IF NOT EXISTS idx_calificaciones_created_at ON public.calificaciones(created_at);
