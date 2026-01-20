-- Migration: Portal de Docentes - Módulos Extendidos
-- Semana 21-25: Planeación, Tareas, Comunicación y Reportes
-- 1. Tabla de Planeaciones de Clase
CREATE TABLE IF NOT EXISTS planeaciones_clase (
    id SERIAL PRIMARY KEY,
    docente_id INTEGER NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,
    materia_id INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    unidad VARCHAR(255) NOT NULL,
    tema VARCHAR(500) NOT NULL,
    objetivos JSONB NOT NULL,
    -- Array de objetivos
    competencias JSONB DEFAULT '[]',
    -- Array de competencias
    contenido TEXT NOT NULL,
    actividades JSONB NOT NULL,
    -- Array de actividades estructuradas
    recursos JSONB DEFAULT '[]',
    -- Array de recursos necesarios
    evaluacion TEXT,
    tareas TEXT,
    observaciones TEXT,
    status VARCHAR(20) DEFAULT 'borrador',
    -- borrador, publicado, archivado
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_planeaciones_docente ON planeaciones_clase(docente_id);
CREATE INDEX IF NOT EXISTS idx_planeaciones_materia ON planeaciones_clase(materia_id);
CREATE INDEX IF NOT EXISTS idx_planeaciones_fecha ON planeaciones_clase(fecha);
CREATE INDEX IF NOT EXISTS idx_planeaciones_status ON planeaciones_clase(status);
-- 2. Tabla de Tareas y Asignaciones
CREATE TABLE IF NOT EXISTS tareas (
    id SERIAL PRIMARY KEY,
    docente_id INTEGER NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,
    materia_id INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
    titulo VARCHAR(500) NOT NULL,
    descripcion TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    -- tarea, proyecto, investigacion, practica, examen
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega TIMESTAMP NOT NULL,
    puntaje_maximo DECIMAL(5, 2) NOT NULL,
    criterios_evaluacion JSONB,
    archivos_adjuntos JSONB DEFAULT '[]',
    instrucciones_especiales TEXT,
    permite_entrega_tardia BOOLEAN DEFAULT true,
    penalizacion_tardia DECIMAL(5, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'borrador',
    -- borrador, publicado, cerrado, cancelado
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tareas_docente ON tareas(docente_id);
CREATE INDEX IF NOT EXISTS idx_tareas_materia ON tareas(materia_id);
CREATE INDEX IF NOT EXISTS idx_tareas_fecha_entrega ON tareas(fecha_entrega);
CREATE INDEX IF NOT EXISTS idx_tareas_status ON tareas(status);
-- 3. Tabla de Entregas de Tareas
CREATE TABLE IF NOT EXISTS entregas_tareas (
    id SERIAL PRIMARY KEY,
    tarea_id INTEGER NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
    estudiante_id INTEGER NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    fecha_entrega TIMESTAMP,
    archivo_url TEXT,
    comentarios_estudiante TEXT,
    calificacion DECIMAL(5, 2),
    retroalimentacion TEXT,
    fecha_calificacion TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pendiente',
    -- pendiente, entregado, revisado, calificado
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tarea_id, estudiante_id)
);
CREATE INDEX IF NOT EXISTS idx_entregas_tarea ON entregas_tareas(tarea_id);
CREATE INDEX IF NOT EXISTS idx_entregas_estudiante ON entregas_tareas(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_entregas_status ON entregas_tareas(status);
-- 4. Tabla de Mensajes Masivos
CREATE TABLE IF NOT EXISTS mensajes_masivos (
    id SERIAL PRIMARY KEY,
    docente_id INTEGER NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,
    materia_id INTEGER REFERENCES materias(id),
    destinatarios_tipo VARCHAR(50) NOT NULL,
    -- padres, estudiantes, ambos, grupo_especifico
    destinatarios_ids JSONB DEFAULT '[]',
    -- Array de IDs específicos si grupo_especifico
    asunto VARCHAR(500) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    -- aviso, urgente, recordatorio, felicitacion, citatorio
    canales JSONB NOT NULL,
    -- [email, sms, notificacion_app, whatsapp]
    programada BOOLEAN DEFAULT false,
    fecha_envio TIMESTAMP,
    fecha_envio_real TIMESTAMP,
    archivos_adjuntos JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'borrador',
    -- borrador, programada, enviando, enviada, fallida
    total_enviados INTEGER DEFAULT 0,
    error_mensaje TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mensajes_masivos_docente ON mensajes_masivos(docente_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_masivos_status ON mensajes_masivos(status);
CREATE INDEX IF NOT EXISTS idx_mensajes_masivos_fecha_envio ON mensajes_masivos(fecha_envio);
-- 5. Tabla de Entregas de Mensajes (Tracking)
CREATE TABLE IF NOT EXISTS entregas_mensajes (
    id SERIAL PRIMARY KEY,
    mensaje_id INTEGER NOT NULL REFERENCES mensajes_masivos(id) ON DELETE CASCADE,
    destinatario_id INTEGER NOT NULL,
    destinatario_tipo VARCHAR(20) NOT NULL,
    -- padre, estudiante
    canal VARCHAR(50) NOT NULL,
    -- email, sms, notificacion_app, whatsapp
    status VARCHAR(20) DEFAULT 'pendiente',
    -- pendiente, enviado, entregado, leido, fallido
    fecha_envio TIMESTAMP,
    fecha_lectura TIMESTAMP,
    error_mensaje TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_entregas_mensajes_mensaje ON entregas_mensajes(mensaje_id);
CREATE INDEX IF NOT EXISTS idx_entregas_mensajes_destinatario ON entregas_mensajes(destinatario_id, destinatario_tipo);
CREATE INDEX IF NOT EXISTS idx_entregas_mensajes_status ON entregas_mensajes(status);
-- 6. Tabla de Configuración de Reportes Automáticos
CREATE TABLE IF NOT EXISTS configuracion_reportes (
    id SERIAL PRIMARY KEY,
    docente_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_reporte VARCHAR(50) NOT NULL,
    -- calificaciones, asistencia, rendimiento, completo
    periodo VARCHAR(50) NOT NULL,
    materia_id INTEGER REFERENCES materias(id),
    automatico BOOLEAN DEFAULT false,
    frecuencia VARCHAR(20),
    -- semanal, quincenal, mensual
    destinatarios JSONB NOT NULL,
    -- Array de emails
    formato VARCHAR(20) DEFAULT 'pdf',
    -- pdf, excel, ambos
    ultima_generacion TIMESTAMP,
    proxima_generacion TIMESTAMP,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_configuracion_reportes_docente ON configuracion_reportes(docente_id);
CREATE INDEX IF NOT EXISTS idx_configuracion_reportes_proxima ON configuracion_reportes(proxima_generacion)
WHERE activo = true;
-- 7. Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS update_planeaciones_updated_at ON planeaciones_clase;
CREATE TRIGGER update_planeaciones_updated_at BEFORE
UPDATE ON planeaciones_clase FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_tareas_updated_at ON tareas;
CREATE TRIGGER update_tareas_updated_at BEFORE
UPDATE ON tareas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_entregas_updated_at ON entregas_tareas;
CREATE TRIGGER update_entregas_updated_at BEFORE
UPDATE ON entregas_tareas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_mensajes_updated_at ON mensajes_masivos;
CREATE TRIGGER update_mensajes_updated_at BEFORE
UPDATE ON mensajes_masivos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_reportes_updated_at ON configuracion_reportes;
CREATE TRIGGER update_reportes_updated_at BEFORE
UPDATE ON configuracion_reportes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- 8. Vistas útiles
CREATE OR REPLACE VIEW vista_tareas_pendientes AS
SELECT t.id as tarea_id,
    t.titulo,
    t.fecha_entrega,
    t.puntaje_maximo,
    m.nombre as materia,
    m.grupo,
    COUNT(et.id) as total_estudiantes,
    COUNT(
        CASE
            WHEN et.status = 'entregado' THEN 1
        END
    ) as entregas_recibidas,
    COUNT(
        CASE
            WHEN et.status = 'pendiente' THEN 1
        END
    ) as entregas_pendientes,
    COUNT(
        CASE
            WHEN et.status = 'calificado' THEN 1
        END
    ) as entregas_calificadas
FROM tareas t
    JOIN materias m ON t.materia_id = m.id
    LEFT JOIN entregas_tareas et ON t.id = et.tarea_id
WHERE t.status = 'publicado'
GROUP BY t.id,
    t.titulo,
    t.fecha_entrega,
    t.puntaje_maximo,
    m.nombre,
    m.grupo;
CREATE OR REPLACE VIEW vista_planeaciones_semanales AS
SELECT p.id,
    p.fecha,
    p.tema,
    p.unidad,
    m.nombre as materia,
    m.grupo,
    d.nombre || ' ' || d.apellido_paterno as docente,
    p.status,
    EXTRACT(
        DOW
        FROM p.fecha
    ) as dia_semana
FROM planeaciones_clase p
    JOIN materias m ON p.materia_id = m.id
    JOIN docentes d ON p.docente_id = d.id
WHERE p.deleted_at IS NULL
    AND p.status != 'archivado';
-- 9. Comentarios de documentación
COMMENT ON TABLE planeaciones_clase IS 'Planeaciones de clases por docente';
COMMENT ON TABLE tareas IS 'Sistema de asignación de tareas y proyectos';
COMMENT ON TABLE entregas_tareas IS 'Entregas y calificaciones de tareas';
COMMENT ON TABLE mensajes_masivos IS 'Comunicación masiva a padres y estudiantes';
COMMENT ON TABLE entregas_mensajes IS 'Tracking de entrega de mensajes masivos';
COMMENT ON TABLE configuracion_reportes IS 'Configuración de reportes automáticos';
COMMENT ON COLUMN tareas.tipo IS 'Tipos: tarea, proyecto, investigacion, practica, examen';
COMMENT ON COLUMN mensajes_masivos.tipo IS 'Tipos: aviso, urgente, recordatorio, felicitacion, citatorio';
COMMENT ON COLUMN mensajes_masivos.canales IS 'Array de canales: email, sms, notificacion_app, whatsapp';
-- Fin de migración