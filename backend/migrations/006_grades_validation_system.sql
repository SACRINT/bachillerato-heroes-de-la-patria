-- Migration: Sistema Completo de Validación de Calificaciones
-- Semana 16-20: Workflow de aprobación, auditoría y alertas
-- 1. Agregar columnas de validación a calificaciones existentes
ALTER TABLE calificaciones
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pendiente',
    ADD COLUMN IF NOT EXISTS validado_por INTEGER REFERENCES usuarios(id),
    ADD COLUMN IF NOT EXISTS fecha_validacion TIMESTAMP,
    ADD COLUMN IF NOT EXISTS comentarios_validacion TEXT;
-- Indexar para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_calificaciones_status ON calificaciones(status);
CREATE INDEX IF NOT EXISTS idx_calificaciones_validado_por ON calificaciones(validado_por);
-- 2. Tabla de auditoría de calificaciones
CREATE TABLE IF NOT EXISTS auditoria_calificaciones (
    id SERIAL PRIMARY KEY,
    calificacion_id INTEGER NOT NULL REFERENCES calificaciones(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    accion VARCHAR(50) NOT NULL,
    -- 'creacion', 'modificacion', 'validacion', 'rechazo'
    valor_anterior DECIMAL(4, 2),
    valor_nuevo DECIMAL(4, 2),
    comentarios TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_auditoria_calificacion ON auditoria_calificaciones(calificacion_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria_calificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria_calificaciones(fecha_registro DESC);
-- 3. Tabla de alertas de estudiantes en riesgo
CREATE TABLE IF NOT EXISTS alertas_estudiantes (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    tipo_alerta VARCHAR(50) NOT NULL,
    -- 'bajo_promedio', 'reprobado', 'ausentismo', 'irregular'
    severidad VARCHAR(20) NOT NULL,
    -- 'baja', 'media', 'alta', 'critica'
    mensaje TEXT NOT NULL,
    data_adicional JSONB,
    estado VARCHAR(20) DEFAULT 'activa',
    -- 'activa', 'en_seguimiento', 'cerrada'
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP,
    motivo_cierre TEXT,
    atendida_por INTEGER REFERENCES usuarios(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_alertas_estudiante ON alertas_estudiantes(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_alertas_estado ON alertas_estudiantes(estado);
CREATE INDEX IF NOT EXISTS idx_alertas_severidad ON alertas_estudiantes(severidad);
CREATE INDEX IF NOT EXISTS idx_alertas_tipo ON alertas_estudiantes(tipo_alerta);
-- 4. Tabla de promedios calculados (cache)
CREATE TABLE IF NOT EXISTS promedios_estudiantes (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    periodo VARCHAR(20) NOT NULL,
    promedio_general DECIMAL(4, 2) NOT NULL,
    materias_cursadas INTEGER DEFAULT 0,
    materias_aprobadas INTEGER DEFAULT 0,
    materias_reprobadas INTEGER DEFAULT 0,
    creditos_obtenidos INTEGER DEFAULT 0,
    fecha_calculo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(estudiante_id, periodo)
);
CREATE INDEX IF NOT EXISTS idx_promedios_estudiante ON promedios_estudiantes(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_promedios_periodo ON promedios_estudiantes(periodo);
-- 5. Tabla de configuración de validación
CREATE TABLE IF NOT EXISTS configuracion_validacion (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor JSONB NOT NULL,
    descripcion TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Insertar configuraciones por defecto
INSERT INTO configuracion_validacion (clave, valor, descripcion)
VALUES (
        'promedio_minimo_aprobatorio',
        '{"valor": 6.0}',
        'Calificación mínima para aprobar'
    ),
    (
        'alerta_promedio_bajo',
        '{"valor": 6.0}',
        'Promedio debajo del cual se genera alerta'
    ),
    (
        'alerta_promedio_critico',
        '{"valor": 5.0}',
        'Promedio crítico que requiere intervención inmediata'
    ),
    (
        'max_materias_reprobadas',
        '{"valor": 3}',
        'Número máximo de materias reprobadas antes de generar alerta crítica'
    ),
    (
        'ausentismo_max_dias',
        '{"valor": 10}',
        'Faltas máximas en 30 días antes de generar alerta'
    ),
    (
        'requiere_validacion_coordinador',
        '{"valor": true}',
        'Si las calificaciones requieren aprobación de coordinador'
    ) ON CONFLICT (clave) DO NOTHING;
-- 6. Trigger para auditoría automática en modificaciones
CREATE OR REPLACE FUNCTION audit_calificacion_changes() RETURNS TRIGGER AS $$ BEGIN IF TG_OP = 'INSERT' THEN
INSERT INTO auditoria_calificaciones (
        calificacion_id,
        usuario_id,
        accion,
        valor_nuevo,
        comentarios
    )
VALUES (
        NEW.id,
        NEW.docente_id,
        'creacion',
        NEW.calificacion,
        'Calificación creada'
    );
ELSIF TG_OP = 'UPDATE' THEN IF NEW.calificacion != OLD.calificacion THEN
INSERT INTO auditoria_calificaciones (
        calificacion_id,
        usuario_id,
        accion,
        valor_anterior,
        valor_nuevo,
        comentarios
    )
VALUES (
        NEW.id,
        COALESCE(NEW.validado_por, NEW.docente_id),
        'modificacion',
        OLD.calificacion,
        NEW.calificacion,
        'Calificación modificada'
    );
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trigger_audit_calificaciones ON calificaciones;
CREATE TRIGGER trigger_audit_calificaciones
AFTER
INSERT
    OR
UPDATE ON calificaciones FOR EACH ROW EXECUTE FUNCTION audit_calificacion_changes();
-- 7. Función para calcular promedio automático
CREATE OR REPLACE FUNCTION calcular_promedio_estudiante(p_estudiante_id INTEGER, p_parcial VARCHAR) RETURNS TABLE(
        promedio DECIMAL(4, 2),
        materias_cursadas INTEGER,
        materias_aprobadas INTEGER,
        materias_reprobadas INTEGER
    ) AS $$ BEGIN RETURN QUERY
SELECT ROUND(AVG(c.calificacion)::numeric, 2) as promedio,
    COUNT(DISTINCT c.materia_id)::INTEGER as materias_cursadas,
    COUNT(
        DISTINCT CASE
            WHEN c.calificacion >= 6 THEN c.materia_id
        END
    )::INTEGER as materias_aprobadas,
    COUNT(
        DISTINCT CASE
            WHEN c.calificacion < 6 THEN c.materia_id
        END
    )::INTEGER as materias_reprobadas
FROM calificaciones c
WHERE c.estudiante_id = p_estudiante_id
    AND (
        p_parcial IS NULL
        OR c.parcial = p_parcial
    )
    AND (
        c.status = 'aprobado'
        OR c.status IS NULL
    );
END;
$$ LANGUAGE plpgsql;
-- 8. Vista consolidada de calificaciones con validación
CREATE OR REPLACE VIEW vista_calificaciones_completa AS
SELECT c.id,
    c.estudiante_id,
    e.matricula,
    e.nombre || ' ' || e.apellido_paterno as estudiante_nombre,
    c.materia_id,
    m.nombre as materia_nombre,
    c.docente_id,
    ud.nombre || ' ' || ud.apellido_paterno as docente_nombre,
    c.calificacion,
    c.parcial,
    c.status,
    c.validado_por,
    uv.nombre || ' ' || uv.apellido_paterno as validador_nombre,
    c.fecha_validacion,
    c.comentarios_validacion,
    c.observaciones,
    c.created_at,
    c.updated_at,
    CASE
        WHEN c.calificacion >= 9 THEN 'Excelente'
        WHEN c.calificacion >= 8 THEN 'Muy Bien'
        WHEN c.calificacion >= 7 THEN 'Bien'
        WHEN c.calificacion >= 6 THEN 'Suficiente'
        ELSE 'Insuficiente'
    END as calificacion_literal
FROM calificaciones c
    JOIN estudiantes e ON c.estudiante_id = e.id
    JOIN materias m ON c.materia_id = m.id
    LEFT JOIN docentes d ON c.docente_id = d.id
    LEFT JOIN usuarios ud ON d.usuario_id = ud.id
    LEFT JOIN usuarios uv ON c.validado_por = uv.id;
-- 9. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_calificaciones_estudiante_parcial ON calificaciones(estudiante_id, parcial);
CREATE INDEX IF NOT EXISTS idx_calificaciones_materia_parcial ON calificaciones(materia_id, parcial);
CREATE INDEX IF NOT EXISTS idx_calificaciones_docente ON calificaciones(docente_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_fecha ON calificaciones(created_at DESC);
-- 10. Comentarios de documentación
COMMENT ON TABLE auditoria_calificaciones IS 'Registro de todos los cambios en calificaciones para auditoría y compliance';
COMMENT ON TABLE alertas_estudiantes IS 'Sistema de alertas tempranas para identificar estudiantes en riesgo académico';
COMMENT ON TABLE promedios_estudiantes IS 'Cache de promedios calculados por periodo para mejorar rendimiento';
COMMENT ON COLUMN calificaciones.status IS 'Estado: pendiente, aprobado, rechazado';
COMMENT ON COLUMN alertas_estudiantes.severidad IS 'Niveles: baja, media, alta, critica';
-- Fin de migración