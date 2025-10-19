-- =====================================================
-- TABLA DE EVENTOS
-- Sistema de gestión de eventos del CMS
-- Fecha: 17 Octubre 2025
-- =====================================================

CREATE TABLE IF NOT EXISTS eventos (
    id SERIAL PRIMARY KEY,

    -- Contenido
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    imagen_url VARCHAR(500),

    -- Fecha y ubicación
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP,
    ubicacion VARCHAR(300),
    modalidad VARCHAR(50) DEFAULT 'presencial' CHECK (modalidad IN ('presencial', 'virtual', 'híbrido')),
    link_virtual VARCHAR(500),

    -- Categorización
    categoria VARCHAR(100),
    tipo VARCHAR(100),
    etiquetas TEXT[],

    -- Publicación
    estado VARCHAR(20) DEFAULT 'borrador' CHECK (estado IN ('borrador', 'publicado', 'cancelado', 'finalizado')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Organización
    organizador VARCHAR(255),
    organizador_id VARCHAR(100),
    contacto_email VARCHAR(255),
    contacto_telefono VARCHAR(50),

    -- Capacidad e inscripciones
    capacidad_maxima INTEGER,
    inscripciones_abiertas BOOLEAN DEFAULT true,
    requiere_inscripcion BOOLEAN DEFAULT false,

    -- SEO
    slug VARCHAR(300) UNIQUE,

    -- Destacado
    destacado BOOLEAN DEFAULT false,

    -- Metadatos
    ip_address VARCHAR(50),
    user_agent TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_eventos_estado ON eventos(estado);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha_inicio ON eventos(fecha_inicio DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_categoria ON eventos(categoria);
CREATE INDEX IF NOT EXISTS idx_eventos_modalidad ON eventos(modalidad);
CREATE INDEX IF NOT EXISTS idx_eventos_destacado ON eventos(destacado);
CREATE INDEX IF NOT EXISTS idx_eventos_slug ON eventos(slug);

-- Full-text search en español
CREATE INDEX IF NOT EXISTS idx_eventos_search ON eventos
USING gin(to_tsvector('spanish', titulo || ' ' || descripcion));

-- Comentarios
COMMENT ON TABLE eventos IS 'Eventos del bachillerato gestionados desde el CMS';
COMMENT ON COLUMN eventos.estado IS 'Estado: borrador, publicado, cancelado, finalizado';
COMMENT ON COLUMN eventos.modalidad IS 'Modalidad del evento: presencial, virtual, híbrido';
