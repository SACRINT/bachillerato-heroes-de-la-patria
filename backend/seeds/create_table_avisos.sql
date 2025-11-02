/**
 * 📋 SCRIPT DE CREACIÓN DE TABLA AVISOS
 * Bachillerato General Estatal "Héroes de la Patria"
 * Fecha: 27 de Octubre 2025
 */

-- Eliminar tabla si existe (CUIDADO: solo usar en desarrollo)
-- DROP TABLE IF EXISTS avisos CASCADE;

-- Crear tabla avisos
CREATE TABLE IF NOT EXISTS avisos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    resumen VARCHAR(500),
    imagen_url VARCHAR(500),

    -- Clasificación
    categoria VARCHAR(100) DEFAULT 'general', -- general, académico, administrativo, eventos, urgente
    tipo VARCHAR(50) DEFAULT 'aviso', -- aviso, alerta, comunicado
    prioridad VARCHAR(20) DEFAULT 'normal', -- baja, normal, alta, urgente
    etiquetas TEXT[], -- Array de etiquetas

    -- Publicación y estado
    estado VARCHAR(50) DEFAULT 'borrador', -- borrador, publicada, archivada, eliminada
    fecha_publicacion TIMESTAMP,
    fecha_expiracion TIMESTAMP, -- Fecha en que el aviso expira (opcional)
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Autor
    autor VARCHAR(255) NOT NULL,
    autor_id VARCHAR(100),

    -- SEO y metadata
    slug VARCHAR(300) UNIQUE,
    meta_descripcion VARCHAR(300),

    -- Métricas
    vistas INTEGER DEFAULT 0,
    destacada BOOLEAN DEFAULT false,

    -- Destinatarios (opcional)
    destinatarios TEXT[], -- Array de roles/grupos: ['estudiantes', 'docentes', 'padres', 'todos']

    -- Auditoría
    ip_address VARCHAR(45),
    user_agent TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_avisos_estado ON avisos(estado);
CREATE INDEX IF NOT EXISTS idx_avisos_categoria ON avisos(categoria);
CREATE INDEX IF NOT EXISTS idx_avisos_fecha_publicacion ON avisos(fecha_publicacion);
CREATE INDEX IF NOT EXISTS idx_avisos_fecha_expiracion ON avisos(fecha_expiracion);
CREATE INDEX IF NOT EXISTS idx_avisos_destacada ON avisos(destacada);
CREATE INDEX IF NOT EXISTS idx_avisos_autor_id ON avisos(autor_id);
CREATE INDEX IF NOT EXISTS idx_avisos_slug ON avisos(slug);
CREATE INDEX IF NOT EXISTS idx_avisos_prioridad ON avisos(prioridad);

-- Índice GIN para búsqueda en arrays
CREATE INDEX IF NOT EXISTS idx_avisos_etiquetas ON avisos USING GIN(etiquetas);
CREATE INDEX IF NOT EXISTS idx_avisos_destinatarios ON avisos USING GIN(destinatarios);

-- Trigger para actualizar fecha_modificacion automáticamente
CREATE OR REPLACE FUNCTION update_avisos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    NEW.fecha_modificacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_avisos_timestamp
BEFORE UPDATE ON avisos
FOR EACH ROW
EXECUTE FUNCTION update_avisos_updated_at();

-- Comentarios en la tabla
COMMENT ON TABLE avisos IS 'Tabla de avisos y alertas del sistema escolar';
COMMENT ON COLUMN avisos.categoria IS 'Categoría del aviso: general, académico, administrativo, eventos, urgente';
COMMENT ON COLUMN avisos.prioridad IS 'Prioridad: baja, normal, alta, urgente';
COMMENT ON COLUMN avisos.destinatarios IS 'Array de roles destinatarios: estudiantes, docentes, padres, todos';
COMMENT ON COLUMN avisos.fecha_expiracion IS 'Fecha en que el aviso expira y deja de mostrarse';

-- Insertar datos de prueba (OPCIONAL)
INSERT INTO avisos (titulo, contenido, resumen, categoria, tipo, prioridad, estado, fecha_publicacion, autor, destinatarios)
VALUES
    (
        'Inicio del Ciclo Escolar 2025-2026',
        'Se informa a toda la comunidad estudiantil que el inicio del ciclo escolar 2025-2026 será el día 15 de agosto de 2025. Se requiere presentarse con uniforme completo.',
        'Inicio de clases el 15 de agosto de 2025',
        'académico',
        'aviso',
        'alta',
        'publicada',
        CURRENT_TIMESTAMP,
        'Dirección General',
        ARRAY['estudiantes', 'padres', 'docentes']
    ),
    (
        'Mantenimiento del Sistema',
        'Se realizará mantenimiento programado del sistema el día sábado 28 de octubre de 2025 de 8:00 AM a 12:00 PM. El sistema no estará disponible durante este periodo.',
        'Mantenimiento del sistema el sábado 28 de octubre',
        'administrativo',
        'alerta',
        'normal',
        'publicada',
        CURRENT_TIMESTAMP,
        'Departamento de Sistemas',
        ARRAY['todos']
    ),
    (
        'Convocatoria Torneo Deportivo',
        'Se convoca a todos los estudiantes interesados en participar en el torneo deportivo interescolar 2025. Las inscripciones estarán abiertas del 1 al 15 de noviembre.',
        'Torneo deportivo - Inscripciones abiertas',
        'eventos',
        'comunicado',
        'normal',
        'publicada',
        CURRENT_TIMESTAMP,
        'Coordinación de Deportes',
        ARRAY['estudiantes']
    );

-- Verificar creación
SELECT COUNT(*) as total_avisos FROM avisos;
SELECT * FROM avisos ORDER BY fecha_publicacion DESC LIMIT 5;

COMMIT;
