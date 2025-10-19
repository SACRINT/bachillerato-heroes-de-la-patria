-- =====================================================
-- TABLA DE NOTICIAS
-- Sistema de gestión de noticias del CMS
-- Fecha: 17 Octubre 2025
-- =====================================================

CREATE TABLE IF NOT EXISTS noticias (
    id SERIAL PRIMARY KEY,

    -- Contenido
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    resumen VARCHAR(500),
    imagen_url VARCHAR(500),

    -- Categorización
    categoria VARCHAR(100),
    etiquetas TEXT[],

    -- Publicación
    estado VARCHAR(20) DEFAULT 'borrador' CHECK (estado IN ('borrador', 'publicada', 'archivada')),
    fecha_publicacion TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Autoría
    autor VARCHAR(255) NOT NULL,
    autor_id VARCHAR(100),

    -- SEO
    slug VARCHAR(300) UNIQUE,
    meta_descripcion VARCHAR(160),

    -- Estadísticas
    vistas INTEGER DEFAULT 0,
    destacada BOOLEAN DEFAULT false,

    -- Metadatos
    ip_address VARCHAR(50),
    user_agent TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_noticias_estado ON noticias(estado);
CREATE INDEX IF NOT EXISTS idx_noticias_fecha_pub ON noticias(fecha_publicacion DESC);
CREATE INDEX IF NOT EXISTS idx_noticias_categoria ON noticias(categoria);
CREATE INDEX IF NOT EXISTS idx_noticias_autor ON noticias(autor);
CREATE INDEX IF NOT EXISTS idx_noticias_destacada ON noticias(destacada);
CREATE INDEX IF NOT EXISTS idx_noticias_slug ON noticias(slug);

-- Full-text search en español
CREATE INDEX IF NOT EXISTS idx_noticias_search ON noticias
USING gin(to_tsvector('spanish', titulo || ' ' || contenido));

-- Comentarios
COMMENT ON TABLE noticias IS 'Noticias del bachillerato gestionadas desde el CMS';
COMMENT ON COLUMN noticias.estado IS 'Estado: borrador (no visible), publicada (visible), archivada (oculta pero guardada)';
COMMENT ON COLUMN noticias.slug IS 'URL amigable única para SEO (ej: apertura-inscripciones-2025)';
