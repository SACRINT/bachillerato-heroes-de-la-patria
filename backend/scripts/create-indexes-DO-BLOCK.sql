-- =====================================================
-- 🚀 ÍNDICES DE RENDIMIENTO - VERSIÓN DO BLOCK
-- Evita que Neon agregue EXPLAIN automáticamente
-- =====================================================

DO $$
BEGIN
    -- TABLA: docentes
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_docentes_apellidos_nombre ON docentes(apellido_paterno, apellido_materno, nombre)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_docentes_usuario_id ON docentes(usuario_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_docentes_created_at ON docentes(created_at DESC)';

    -- TABLA: estudiantes
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_estudiantes_apellidos_nombre ON estudiantes(apellido_paterno, apellido_materno, nombre)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_estudiantes_usuario_id ON estudiantes(usuario_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_estudiantes_semestre ON estudiantes(semestre)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_estudiantes_created_at ON estudiantes(created_at DESC)';

    -- TABLA: calificaciones
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_calificaciones_docente_id ON calificaciones(docente_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_calificaciones_estudiante_materia ON calificaciones(estudiante_id, materia_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_calificaciones_created_at ON calificaciones(created_at DESC)';

    -- TABLA: usuarios
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_usuarios_created_at ON usuarios(created_at DESC)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_usuarios_last_login ON usuarios(last_login DESC)';

    RAISE NOTICE 'Índices creados exitosamente';
END $$;

-- Verificar
SELECT count(*) as indices_nuevos FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%';
