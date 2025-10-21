-- ============================================
-- BIBLIOTECA DIGITAL - BGE
-- ============================================
-- Versión: 1.0.0
-- Fecha: 19 de Octubre, 2025
-- Descripción: Schema completo para biblioteca digital institucional
-- Características:
--   - Gestión de documentos con versionado
--   - Categorías jerárquicas
--   - Tags flexibles
--   - Control de acceso por roles
--   - Favoritos y ratings
--   - Historial de descargas
--   - Búsqueda full-text
-- ============================================

-- ============================================
-- TABLA: library_categories
-- Descripción: Categorías jerárquicas (árbol)
-- ============================================
CREATE TABLE IF NOT EXISTS library_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    parent_id INTEGER REFERENCES library_categories(id) ON DELETE CASCADE,

    -- Jerarquía
    level INTEGER DEFAULT 0,
    path VARCHAR(500),                      -- Ej: "1/5/12" para navegación rápida

    -- Metadata
    icon VARCHAR(100),                      -- Clase de icono Bootstrap
    color VARCHAR(20),                      -- Color hex para UI
    order_index INTEGER DEFAULT 0,         -- Orden de visualización

    -- Contadores
    total_documents INTEGER DEFAULT 0,

    -- Estado
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_categories_parent ON library_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON library_categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON library_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_path ON library_categories(path);

-- ============================================
-- TABLA: library_documents
-- Descripción: Documentos principales (metadata)
-- ============================================
CREATE TABLE IF NOT EXISTS library_documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(300) NOT NULL UNIQUE,
    description TEXT,

    -- Categorización
    category_id INTEGER NOT NULL REFERENCES library_categories(id) ON DELETE RESTRICT,

    -- Autor
    author_id INTEGER NOT NULL,             -- Usuario que subió
    author_role VARCHAR(20) NOT NULL,       -- 'admin', 'teacher', etc.
    author_name VARCHAR(200),

    -- Tipo de documento
    document_type VARCHAR(50) NOT NULL,     -- 'reglamento', 'manual', 'recurso', 'guia', 'formato', 'otro'

    -- Versión actual
    current_version_id INTEGER,             -- FK a library_document_versions
    current_version_number VARCHAR(20),     -- Ej: "1.0", "2.3"

    -- Metadata
    language VARCHAR(10) DEFAULT 'es',      -- 'es', 'en'
    file_extension VARCHAR(10),             -- 'pdf', 'doc', 'xlsx'
    total_pages INTEGER,

    -- Estadísticas
    total_versions INTEGER DEFAULT 1,
    total_downloads INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    total_favorites INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0.00,

    -- Estado
    is_published BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,      -- Documento destacado
    is_archived BOOLEAN DEFAULT FALSE,

    -- Timestamps
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_document_type CHECK (document_type IN ('reglamento', 'manual', 'recurso', 'guia', 'formato', 'otro')),
    CONSTRAINT valid_author_role CHECK (author_role IN ('admin', 'teacher', 'parent', 'student'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_documents_category ON library_documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_author ON library_documents(author_id, author_role);
CREATE INDEX IF NOT EXISTS idx_documents_type ON library_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_published ON library_documents(is_published, is_archived);
CREATE INDEX IF NOT EXISTS idx_documents_featured ON library_documents(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_documents_slug ON library_documents(slug);

-- Full-text search en título y descripción
CREATE INDEX IF NOT EXISTS idx_documents_search ON library_documents
USING gin(to_tsvector('spanish', title || ' ' || COALESCE(description, '')));

-- ============================================
-- TABLA: library_document_versions
-- Descripción: Versiones de documentos
-- ============================================
CREATE TABLE IF NOT EXISTS library_document_versions (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES library_documents(id) ON DELETE CASCADE,

    -- Versión
    version_number VARCHAR(20) NOT NULL,    -- Ej: "1.0", "2.3"
    version_notes TEXT,                     -- Changelog

    -- Archivo
    file_name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_url VARCHAR(1000),
    file_size BIGINT NOT NULL,              -- Bytes
    file_hash VARCHAR(64),                  -- SHA-256 para integridad

    -- Metadata del archivo
    mime_type VARCHAR(100),
    file_extension VARCHAR(10),

    -- Autor de la versión
    uploaded_by INTEGER NOT NULL,
    uploaded_by_role VARCHAR(20) NOT NULL,
    uploaded_by_name VARCHAR(200),

    -- Estado
    is_current BOOLEAN DEFAULT FALSE,       -- Si es la versión actual

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT unique_document_version UNIQUE (document_id, version_number)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_versions_document ON library_document_versions(document_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_versions_current ON library_document_versions(document_id, is_current) WHERE is_current = TRUE;
CREATE INDEX IF NOT EXISTS idx_versions_uploaded_by ON library_document_versions(uploaded_by, uploaded_by_role);

-- ============================================
-- TABLA: library_tags
-- Descripción: Tags para clasificación flexible
-- ============================================
CREATE TABLE IF NOT EXISTS library_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,

    -- Metadata
    color VARCHAR(20),                      -- Color hex para UI
    usage_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tags_slug ON library_tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_usage ON library_tags(usage_count DESC);

-- ============================================
-- TABLA: library_document_tags
-- Descripción: Relación N:N documentos-tags
-- ============================================
CREATE TABLE IF NOT EXISTS library_document_tags (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES library_documents(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES library_tags(id) ON DELETE CASCADE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT unique_document_tag UNIQUE (document_id, tag_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_document_tags_document ON library_document_tags(document_id);
CREATE INDEX IF NOT EXISTS idx_document_tags_tag ON library_document_tags(tag_id);

-- ============================================
-- TABLA: library_document_permissions
-- Descripción: Control de acceso por rol
-- ============================================
CREATE TABLE IF NOT EXISTS library_document_permissions (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES library_documents(id) ON DELETE CASCADE,

    -- Rol con permiso
    role VARCHAR(20) NOT NULL,              -- 'admin', 'teacher', 'parent', 'student', 'public'

    -- Permisos
    can_view BOOLEAN DEFAULT TRUE,
    can_download BOOLEAN DEFAULT TRUE,
    can_comment BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT unique_document_role_permission UNIQUE (document_id, role),
    CONSTRAINT valid_permission_role CHECK (role IN ('admin', 'teacher', 'parent', 'student', 'public'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_permissions_document ON library_document_permissions(document_id);
CREATE INDEX IF NOT EXISTS idx_permissions_role ON library_document_permissions(role, can_view);

-- ============================================
-- TABLA: library_favorites
-- Descripción: Documentos favoritos por usuario
-- ============================================
CREATE TABLE IF NOT EXISTS library_favorites (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES library_documents(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    user_role VARCHAR(20) NOT NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT unique_user_favorite UNIQUE (document_id, user_id, user_role)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_favorites_document ON library_favorites(document_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON library_favorites(user_id, user_role, created_at DESC);

-- ============================================
-- TABLA: library_download_history
-- Descripción: Historial de descargas
-- ============================================
CREATE TABLE IF NOT EXISTS library_download_history (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES library_documents(id) ON DELETE CASCADE,
    version_id INTEGER REFERENCES library_document_versions(id) ON DELETE SET NULL,

    -- Usuario
    user_id INTEGER,
    user_role VARCHAR(20),
    user_name VARCHAR(200),

    -- Metadata de descarga
    ip_address INET,
    user_agent TEXT,

    -- Timestamps
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_download_history_document ON library_download_history(document_id, downloaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_download_history_user ON library_download_history(user_id, user_role, downloaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_download_history_date ON library_download_history(downloaded_at DESC);

-- ============================================
-- TABLA: library_document_comments
-- Descripción: Comentarios en documentos
-- ============================================
CREATE TABLE IF NOT EXISTS library_document_comments (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES library_documents(id) ON DELETE CASCADE,

    -- Autor del comentario
    user_id INTEGER NOT NULL,
    user_role VARCHAR(20) NOT NULL,
    user_name VARCHAR(200),

    -- Contenido
    comment TEXT NOT NULL,

    -- Thread (respuestas)
    parent_comment_id INTEGER REFERENCES library_document_comments(id) ON DELETE CASCADE,

    -- Estado
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_comments_document ON library_document_comments(document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_user ON library_document_comments(user_id, user_role);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON library_document_comments(parent_comment_id);

-- ============================================
-- TABLA: library_document_ratings
-- Descripción: Calificaciones de documentos
-- ============================================
CREATE TABLE IF NOT EXISTS library_document_ratings (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES library_documents(id) ON DELETE CASCADE,

    -- Usuario
    user_id INTEGER NOT NULL,
    user_role VARCHAR(20) NOT NULL,

    -- Rating
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT unique_user_rating UNIQUE (document_id, user_id, user_role)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ratings_document ON library_document_ratings(document_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON library_document_ratings(user_id, user_role);

-- ============================================
-- VISTAS OPTIMIZADAS
-- ============================================

-- Vista: Documentos con toda su metadata
CREATE OR REPLACE VIEW v_library_documents_full AS
SELECT
    d.id,
    d.title,
    d.slug,
    d.description,
    d.document_type,
    d.current_version_number,
    d.file_extension,
    d.language,
    d.total_downloads,
    d.total_views,
    d.total_favorites,
    d.total_comments,
    d.avg_rating,
    d.is_published,
    d.is_featured,
    d.published_at,
    d.created_at,
    d.updated_at,

    -- Categoría
    c.name AS category_name,
    c.slug AS category_slug,
    c.path AS category_path,

    -- Autor
    d.author_name,
    d.author_role,

    -- Versión actual
    v.file_url AS current_file_url,
    v.file_size AS current_file_size,
    v.mime_type AS current_mime_type,

    -- Tags (agregados)
    (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'slug', t.slug, 'color', t.color))
     FROM library_tags t
     JOIN library_document_tags dt ON t.id = dt.tag_id
     WHERE dt.document_id = d.id) AS tags,

    -- Contar favoritos del usuario (placeholder - se completa en query)
    0 AS user_has_favorite
FROM library_documents d
LEFT JOIN library_categories c ON d.category_id = c.id
LEFT JOIN library_document_versions v ON d.current_version_id = v.id
WHERE d.is_archived = FALSE;

-- Vista: Estadísticas por categoría
CREATE OR REPLACE VIEW v_library_category_stats AS
SELECT
    c.id,
    c.name,
    c.slug,
    c.parent_id,
    c.level,
    COUNT(d.id) AS total_documents,
    SUM(d.total_downloads) AS total_downloads,
    AVG(d.avg_rating) AS avg_rating
FROM library_categories c
LEFT JOIN library_documents d ON c.id = d.category_id AND d.is_published = TRUE AND d.is_archived = FALSE
GROUP BY c.id, c.name, c.slug, c.parent_id, c.level;

-- ============================================
-- FUNCIONES POSTGRESQL
-- ============================================

-- Función: Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función: Actualizar contador de documentos en categoría
CREATE OR REPLACE FUNCTION update_category_document_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE library_categories
        SET total_documents = total_documents + 1
        WHERE id = NEW.category_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE library_categories
        SET total_documents = GREATEST(0, total_documents - 1)
        WHERE id = OLD.category_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.category_id != OLD.category_id THEN
        -- Decrementar categoría antigua
        UPDATE library_categories
        SET total_documents = GREATEST(0, total_documents - 1)
        WHERE id = OLD.category_id;
        -- Incrementar categoría nueva
        UPDATE library_categories
        SET total_documents = total_documents + 1
        WHERE id = NEW.category_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función: Actualizar rating promedio
CREATE OR REPLACE FUNCTION update_document_avg_rating()
RETURNS TRIGGER AS $$
DECLARE
    new_avg DECIMAL(3,2);
BEGIN
    SELECT AVG(rating)::DECIMAL(3,2) INTO new_avg
    FROM library_document_ratings
    WHERE document_id = COALESCE(NEW.document_id, OLD.document_id);

    UPDATE library_documents
    SET avg_rating = COALESCE(new_avg, 0.00)
    WHERE id = COALESCE(NEW.document_id, OLD.document_id);

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función: Actualizar contador de favoritos
CREATE OR REPLACE FUNCTION update_document_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE library_documents
        SET total_favorites = total_favorites + 1
        WHERE id = NEW.document_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE library_documents
        SET total_favorites = GREATEST(0, total_favorites - 1)
        WHERE id = OLD.document_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función: Actualizar contador de tags
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE library_tags
        SET usage_count = usage_count + 1
        WHERE id = NEW.tag_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE library_tags
        SET usage_count = GREATEST(0, usage_count - 1)
        WHERE id = OLD.tag_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Actualizar updated_at en documentos
DROP TRIGGER IF EXISTS trigger_documents_updated_at ON library_documents;
CREATE TRIGGER trigger_documents_updated_at
    BEFORE UPDATE ON library_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_library_updated_at();

-- Trigger: Actualizar updated_at en categorías
DROP TRIGGER IF EXISTS trigger_categories_updated_at ON library_categories;
CREATE TRIGGER trigger_categories_updated_at
    BEFORE UPDATE ON library_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_library_updated_at();

-- Trigger: Actualizar contador de documentos en categoría
DROP TRIGGER IF EXISTS trigger_update_category_count ON library_documents;
CREATE TRIGGER trigger_update_category_count
    AFTER INSERT OR UPDATE OR DELETE ON library_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_category_document_count();

-- Trigger: Actualizar rating promedio
DROP TRIGGER IF EXISTS trigger_update_avg_rating ON library_document_ratings;
CREATE TRIGGER trigger_update_avg_rating
    AFTER INSERT OR UPDATE OR DELETE ON library_document_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_document_avg_rating();

-- Trigger: Actualizar contador de favoritos
DROP TRIGGER IF EXISTS trigger_update_favorites_count ON library_favorites;
CREATE TRIGGER trigger_update_favorites_count
    AFTER INSERT OR DELETE ON library_favorites
    FOR EACH ROW
    EXECUTE FUNCTION update_document_favorites_count();

-- Trigger: Actualizar contador de uso de tags
DROP TRIGGER IF EXISTS trigger_update_tag_usage ON library_document_tags;
CREATE TRIGGER trigger_update_tag_usage
    AFTER INSERT OR DELETE ON library_document_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_tag_usage_count();

-- ============================================
-- DATOS DE EJEMPLO (DESARROLLO)
-- ============================================

-- Categorías de ejemplo
INSERT INTO library_categories (id, name, slug, description, parent_id, level, path, icon, color, order_index)
VALUES
    (1, 'Reglamentos', 'reglamentos', 'Reglamentos institucionales y normativos', NULL, 0, '1', 'bi-shield-check', '#e74c3c', 1),
    (2, 'Manuales', 'manuales', 'Manuales de procedimientos y operación', NULL, 0, '2', 'bi-book', '#3498db', 2),
    (3, 'Recursos Educativos', 'recursos-educativos', 'Materiales didácticos y recursos para docentes', NULL, 0, '3', 'bi-journal-text', '#2ecc71', 3),
    (4, 'Formatos', 'formatos', 'Formatos y plantillas oficiales', NULL, 0, '4', 'bi-file-earmark-text', '#f39c12', 4),
    (5, 'Reglamento Interno', 'reglamento-interno', 'Reglamento interno del plantel', 1, 1, '1/5', 'bi-shield', '#c0392b', 1),
    (6, 'Reglamento Escolar', 'reglamento-escolar', 'Reglamento para estudiantes', 1, 1, '1/6', 'bi-person-badge', '#e67e22', 2)
ON CONFLICT DO NOTHING;

-- Tags de ejemplo
INSERT INTO library_tags (name, slug, color)
VALUES
    ('Estudiantes', 'estudiantes', '#3498db'),
    ('Docentes', 'docentes', '#2ecc71'),
    ('Padres', 'padres', '#e74c3c'),
    ('Administrativo', 'administrativo', '#9b59b6'),
    ('Urgente', 'urgente', '#e67e22')
ON CONFLICT DO NOTHING;

-- ============================================
-- COMENTARIOS Y NOTAS
-- ============================================

-- CARACTERÍSTICAS IMPLEMENTADAS:
-- ✅ Gestión de documentos con versionado completo
-- ✅ Categorías jerárquicas (árbol ilimitado)
-- ✅ Tags flexibles para clasificación
-- ✅ Control de acceso granular por rol
-- ✅ Favoritos por usuario
-- ✅ Historial completo de descargas
-- ✅ Sistema de comentarios con threading
-- ✅ Ratings de 1-5 estrellas
-- ✅ Búsqueda full-text optimizada
-- ✅ 20+ índices para performance
-- ✅ Triggers automáticos para contadores

-- INTEGRACIONES NECESARIAS:
-- 1. Sistema de upload de archivos existente
-- 2. Sistema de roles y permisos (Ciclo 10)
-- 3. Sistema de autenticación JWT

-- PRÓXIMOS PASOS:
-- 1. Ejecutar este script en PostgreSQL
-- 2. Crear API REST en backend/routes/digital-library.js
-- 3. Crear interfaz frontend biblioteca.html
-- 4. Implementar búsqueda avanzada

COMMENT ON TABLE library_categories IS 'Categorías jerárquicas para organización de documentos';
COMMENT ON TABLE library_documents IS 'Documentos principales con metadata completa';
COMMENT ON TABLE library_document_versions IS 'Versiones de documentos con control de cambios';
COMMENT ON TABLE library_tags IS 'Tags para clasificación flexible de documentos';
COMMENT ON TABLE library_document_permissions IS 'Control de acceso granular por rol';
COMMENT ON TABLE library_favorites IS 'Documentos favoritos por usuario';
COMMENT ON TABLE library_download_history IS 'Historial completo de descargas para analytics';
