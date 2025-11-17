-- 🔍 DATABASE INDEXES OPTIMIZATION
-- Índices para mejorar performance de queries frecuentes
-- Semana 4 - Tarea 3

-- TABLA: usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);
CREATE INDEX IF NOT EXISTS idx_usuarios_created_at ON usuarios(created_at DESC);

-- TABLA: estudiantes
CREATE INDEX IF NOT EXISTS idx_estudiantes_usuario_id ON estudiantes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_estudiantes_generacion ON estudiantes(generacion);
CREATE INDEX IF NOT EXISTS idx_estudiantes_grupo ON estudiantes(grupo);

-- TABLA: calificaciones
CREATE INDEX IF NOT EXISTS idx_calificaciones_estudiante_id ON calificaciones(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_periodo ON calificaciones(periodo);

-- TABLA: noticias
CREATE INDEX IF NOT EXISTS idx_noticias_categoria ON noticias(categoria);
CREATE INDEX IF NOT EXISTS idx_noticias_fecha_pub ON noticias(fecha_publicacion DESC);

-- TABLA: citas
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha_solicitada);
CREATE INDEX IF NOT EXISTS idx_citas_status ON citas(status);

-- TABLA: pending_approvals
CREATE INDEX IF NOT EXISTS idx_approvals_status ON pending_approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_created ON pending_approvals(created_at DESC);

-- ÍNDICES COMPUESTOS
CREATE INDEX IF NOT EXISTS idx_estudiantes_gen_grupo ON estudiantes(generacion, grupo);
CREATE INDEX IF NOT EXISTS idx_calificaciones_est_per ON calificaciones(estudiante_id, periodo);
