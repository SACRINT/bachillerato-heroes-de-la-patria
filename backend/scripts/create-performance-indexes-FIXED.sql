-- =====================================================
-- 🚀 ÍNDICES DE RENDIMIENTO - VERSIÓN CORREGIDA
-- Fecha: 16 de Noviembre, 2025
-- Versión: 2.27.3 FIXED
-- SOLO ÍNDICES CONFIRMADOS QUE EXISTEN EN EL SCHEMA
-- =====================================================

-- TABLA: docentes (CONFIRMADO)
CREATE INDEX IF NOT EXISTS idx_docentes_apellidos_nombre ON docentes(apellido_paterno, apellido_materno, nombre);
CREATE INDEX IF NOT EXISTS idx_docentes_usuario_id ON docentes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_docentes_created_at ON docentes(created_at DESC);

-- TABLA: estudiantes (SIN grupo, SIN ciclo_escolar)
CREATE INDEX IF NOT EXISTS idx_estudiantes_apellidos_nombre ON estudiantes(apellido_paterno, apellido_materno, nombre);
CREATE INDEX IF NOT EXISTS idx_estudiantes_usuario_id ON estudiantes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_estudiantes_semestre ON estudiantes(semestre);
CREATE INDEX IF NOT EXISTS idx_estudiantes_created_at ON estudiantes(created_at DESC);

-- TABLA: calificaciones (SIN ciclo_escolar si no existe)
CREATE INDEX IF NOT EXISTS idx_calificaciones_docente_id ON calificaciones(docente_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_estudiante_materia ON calificaciones(estudiante_id, materia_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_fecha_evaluacion ON calificaciones(fecha_evaluacion DESC);
CREATE INDEX IF NOT EXISTS idx_calificaciones_created_at ON calificaciones(created_at DESC);

-- TABLA: usuarios (CONFIRMADO)
CREATE INDEX IF NOT EXISTS idx_usuarios_created_at ON usuarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usuarios_last_login ON usuarios(last_login DESC);

-- TABLA: citas (si existe)
CREATE INDEX IF NOT EXISTS idx_citas_created_at ON citas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_citas_fecha_estado ON citas(fecha_cita, estado);

-- TABLA: solicitudes_documentos (si existe)
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha ON solicitudes_documentos(fecha_solicitud DESC);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes_documentos(estado);

-- TABLA: ingresos (si existe)
CREATE INDEX IF NOT EXISTS idx_ingresos_fecha ON ingresos(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_ingresos_created_at ON ingresos(created_at DESC);

-- TABLA: gastos (si existe)
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_gastos_created_at ON gastos(created_at DESC);

-- TABLA: pagos_pendientes (si existe)
CREATE INDEX IF NOT EXISTS idx_pagos_fecha_vencimiento ON pagos_pendientes(fecha_vencimiento ASC);
CREATE INDEX IF NOT EXISTS idx_pagos_estudiante ON pagos_pendientes(estudiante_id);

-- TABLA: noticias (si existe)
CREATE INDEX IF NOT EXISTS idx_noticias_created_at ON noticias(created_at DESC);

-- TABLA: eventos (si existe)
CREATE INDEX IF NOT EXISTS idx_eventos_created_at ON eventos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha_inicio ON eventos(fecha_inicio DESC);

-- TABLA: contactos (si existe)
CREATE INDEX IF NOT EXISTS idx_contactos_created_at ON contactos(created_at DESC);

-- TABLA: avisos (si existe)
CREATE INDEX IF NOT EXISTS idx_avisos_created_at ON avisos(created_at DESC);

-- Actualizar estadísticas
ANALYZE docentes;
ANALYZE estudiantes;
ANALYZE calificaciones;
ANALYZE usuarios;

-- Verificar creación
SELECT count(*) as indices_creados FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%';
