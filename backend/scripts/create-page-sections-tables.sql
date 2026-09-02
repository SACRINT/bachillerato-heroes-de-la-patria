-- ============================================================
-- TABLAS DE CONFIGURACIÓN DE PÁGINAS Y SECCIONES MULTI-TENANT
-- Fecha: 2026-09-01
-- Propósito: Permitir a directores configurar páginas como plantillas
-- ============================================================

-- 1. TABLA: Configuración de páginas por tenant
-- Controla qué páginas están activas y su orden
CREATE TABLE IF NOT EXISTS tenant_page_configs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    page_slug VARCHAR(100) NOT NULL,          -- 'conocenos', 'oferta-educativa', etc.
    page_title VARCHAR(255) DEFAULT '',       -- Título personalizado (opcional)
    is_active BOOLEAN DEFAULT true,           -- Si la página está visible
    sort_order INTEGER DEFAULT 0,             -- Orden en el menú/navegación
    config_json JSONB DEFAULT '{}',           -- Configuración extra flexible
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, page_slug)
);

-- Índices para tenant_page_configs
CREATE INDEX IF NOT EXISTS idx_page_configs_tenant ON tenant_page_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_page_configs_active ON tenant_page_configs(tenant_id, is_active);

-- 2. TABLA: Secciones dentro de cada página
-- Cada sección es un bloque de contenido configurable
CREATE TABLE IF NOT EXISTS tenant_page_sections (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    page_slug VARCHAR(100) NOT NULL,          -- Página padre
    section_key VARCHAR(100) NOT NULL,        -- 'mision', 'vision', 'modelo_educativo', etc.
    section_title VARCHAR(255) DEFAULT '',    -- Título de la sección
    section_subtitle VARCHAR(500) DEFAULT '', -- Subtítulo opcional
    section_content TEXT DEFAULT '',           -- Contenido HTML o texto plano
    section_image_url VARCHAR(500) DEFAULT '',-- Imagen de la sección
    section_icon VARCHAR(100) DEFAULT '',     -- Icono FontAwesome
    is_active BOOLEAN DEFAULT true,           -- Si la sección está visible
    sort_order INTEGER DEFAULT 0,             -- Orden dentro de la página
    config_json JSONB DEFAULT '{}',           -- Datos extra (listas, items, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, page_slug, section_key)
);

-- Índices para tenant_page_sections
CREATE INDEX IF NOT EXISTS idx_page_sections_tenant ON tenant_page_sections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_page_sections_page ON tenant_page_sections(tenant_id, page_slug);
CREATE INDEX IF NOT EXISTS idx_page_sections_active ON tenant_page_sections(tenant_id, page_slug, is_active);

-- 3. TABLA: Items dinámicos para secciones con listas
-- Para secciones que tienen múltiples items (como "Pilares", "Competencias", etc.)
CREATE TABLE IF NOT EXISTS tenant_section_items (
    id SERIAL PRIMARY KEY,
    section_id INTEGER NOT NULL REFERENCES tenant_page_sections(id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    item_key VARCHAR(100) DEFAULT '',         -- Identificador del item
    item_title VARCHAR(255) DEFAULT '',       -- Título del item
    item_content TEXT DEFAULT '',              -- Contenido/descripción
    item_image_url VARCHAR(500) DEFAULT '',   -- Imagen del item
    item_icon VARCHAR(100) DEFAULT '',        -- Icono
    item_link VARCHAR(500) DEFAULT '',        -- Enlace opcional
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    config_json JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para tenant_section_items
CREATE INDEX IF NOT EXISTS idx_section_items_section ON tenant_section_items(section_id);
CREATE INDEX IF NOT EXISTS idx_section_items_tenant ON tenant_section_items(tenant_id);

-- ============================================================
-- TRIGGERS: Auto-actualizar updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_page_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_page_config
    BEFORE UPDATE ON tenant_page_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_page_config_timestamp();

CREATE TRIGGER trigger_update_page_section
    BEFORE UPDATE ON tenant_page_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_page_config_timestamp();

CREATE TRIGGER trigger_update_section_item
    BEFORE UPDATE ON tenant_section_items
    FOR EACH ROW
    EXECUTE FUNCTION update_page_config_timestamp();

-- ============================================================
-- FUNCIÓN: Obtener configuración completa de una página
-- ============================================================

CREATE OR REPLACE FUNCTION get_page_full_config(
    p_tenant_id INTEGER,
    p_page_slug VARCHAR
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'page', json_build_object(
            'id', pc.id,
            'slug', pc.page_slug,
            'title', pc.page_title,
            'is_active', pc.is_active,
            'sort_order', pc.sort_order,
            'config', pc.config_json
        ),
        'sections', (
            SELECT json_agg(json_build_object(
                'id', ps.id,
                'key', ps.section_key,
                'title', ps.section_title,
                'subtitle', ps.section_subtitle,
                'content', ps.section_content,
                'image_url', ps.section_image_url,
                'icon', ps.section_icon,
                'is_active', ps.is_active,
                'sort_order', ps.sort_order,
                'config', ps.config_json,
                'items', (
                    SELECT json_agg(json_build_object(
                        'id', si.id,
                        'key', si.item_key,
                        'title', si.item_title,
                        'content', si.item_content,
                        'image_url', si.item_image_url,
                        'icon', si.item_icon,
                        'link', si.item_link,
                        'is_active', si.is_active,
                        'sort_order', si.sort_order,
                        'config', si.config_json
                    ) ORDER BY si.sort_order)
                    FROM tenant_section_items si
                    WHERE si.section_id = ps.id AND si.is_active = true
                )
            ) ORDER BY ps.sort_order)
            FROM tenant_page_sections ps
            WHERE ps.tenant_id = p_tenant_id
            AND ps.page_slug = p_page_slug
            AND ps.is_active = true
        )
    ) INTO result
    FROM tenant_page_configs pc
    WHERE pc.tenant_id = p_tenant_id
    AND pc.page_slug = p_page_slug;

    RETURN result;
END;
$$ LANGUAGE plpgsql;
