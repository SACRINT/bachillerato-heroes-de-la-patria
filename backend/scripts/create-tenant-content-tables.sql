-- ================================================================
-- CREACIÓN DE TABLAS MULTI-TENANT DE CONTENIDO
-- Fecha: 01 de Septiembre de 2026
-- SIPWEB-BG - FASE 1: Esquema SQL Multi-Tenant
--
-- INSTRUCCIONES:
-- 1. Abrir Neon Console (https://console.neon.tech)
-- 2. Ir a SQL Editor
-- 3. Copiar TODO este contenido
-- 4. Pegar en el editor
-- 5. Click en "Run" o Ctrl+Enter
-- 6. Esperar confirmación "Query executed successfully"
-- ================================================================

-- ================================================================
-- 1. TABLA tenant_pages - Páginas editables por director CMS
-- ================================================================
CREATE TABLE IF NOT EXISTS tenant_pages (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    page_slug VARCHAR(100) NOT NULL,
    page_title VARCHAR(255),
    page_content TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, page_slug)
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_tenant_pages_tenant ON tenant_pages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_pages_slug ON tenant_pages(page_slug);
CREATE INDEX IF NOT EXISTS idx_tenant_pages_published ON tenant_pages(is_published);

-- ================================================================
-- 2. TABLA tenant_banners - Carrusel de imágenes del hero
-- ================================================================
CREATE TABLE IF NOT EXISTS tenant_banners (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255),
    subtitle VARCHAR(500),
    image_url VARCHAR(500) NOT NULL,
    link_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_tenant_banners_tenant ON tenant_banners(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_banners_active ON tenant_banners(is_active);
CREATE INDEX IF NOT EXISTS idx_tenant_banners_order ON tenant_banners(sort_order);

-- ================================================================
-- 3. TABLA tenant_notices - Avisos y comunicados de zona
-- ================================================================
CREATE TABLE IF NOT EXISTS tenant_notices (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'aviso',
    is_zone_notice BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_tenant_notices_tenant ON tenant_notices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_notices_type ON tenant_notices(type);
CREATE INDEX IF NOT EXISTS idx_tenant_notices_zone ON tenant_notices(is_zone_notice);
CREATE INDEX IF NOT EXISTS idx_tenant_notices_published ON tenant_notices(is_published);

-- ================================================================
-- 4. TABLA tenant_programs - Oferta educativa (capacitaciones/talleres)
-- ================================================================
CREATE TABLE IF NOT EXISTS tenant_programs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    program_type VARCHAR(50) DEFAULT 'capacitacion',
    program_name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_tenant_programs_tenant ON tenant_programs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_programs_type ON tenant_programs(program_type);
CREATE INDEX IF NOT EXISTS idx_tenant_programs_active ON tenant_programs(is_active);

-- ================================================================
-- 5. TABLA tenant_files - Archivos segregados por tenant
-- ================================================================
CREATE TABLE IF NOT EXISTS tenant_files (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    file_type VARCHAR(50) NOT NULL,
    stored_path VARCHAR(500) NOT NULL,
    original_name VARCHAR(500),
    mime_type VARCHAR(100),
    file_size INTEGER,
    uploaded_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_tenant_files_tenant ON tenant_files(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_files_type ON tenant_files(file_type);

-- ================================================================
-- FUNCIONES TRIGGER PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- ================================================================

CREATE OR REPLACE FUNCTION update_tenant_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para cada tabla de contenido
DROP TRIGGER IF EXISTS update_tenant_pages_updated_at ON tenant_pages;
CREATE TRIGGER update_tenant_pages_updated_at
    BEFORE UPDATE ON tenant_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_content_updated_at();

DROP TRIGGER IF EXISTS update_tenant_banners_updated_at ON tenant_banners;
CREATE TRIGGER update_tenant_banners_updated_at
    BEFORE UPDATE ON tenant_banners
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_content_updated_at();

DROP TRIGGER IF EXISTS update_tenant_notices_updated_at ON tenant_notices;
CREATE TRIGGER update_tenant_notices_updated_at
    BEFORE UPDATE ON tenant_notices
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_content_updated_at();

DROP TRIGGER IF EXISTS update_tenant_programs_updated_at ON tenant_programs;
CREATE TRIGGER update_tenant_programs_updated_at
    BEFORE UPDATE ON tenant_programs
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_content_updated_at();

-- ================================================================
-- INSERCIÓN DE DATOS DEMO PARA EL PRIMER TENANT (id=1)
-- ================================================================

-- Páginas demo para BGE Héroes de la Patria
INSERT INTO tenant_pages (tenant_id, page_slug, page_title, page_content, is_published) VALUES
(1, 'conocenos', 'Conócenos', '<h2>Misión</h2><p>Formar integralmente a los jóvenes con valores, conocimientos y habilidades que les permitan interactuar positivamente con el entorno social.</p><h2>Visión</h2><p>Ser una institución educativa de excelencia que forme ciudadanos responsables y comprometidos con la sociedad.</p>', true),
(1, 'oferta-educativa', 'Oferta Educativa', '<h2>Bachillerato General Estatal</h2><p>Nuestro plan de estudios ofrece una formación integral con enfoque en competencias.</p>', true),
(1, 'servicios', 'Servicios', '<h2>Servicios del Plantel</h2><ul><li>Biblioteca</li><li>Laboratorio de cómputo</li><li>Área deportiva</li></ul>', true),
(1, 'reglamento', 'Reglamento Escolar', '<h2>Reglamento Interno</h2><p>Normas de convivencia y disciplina escolar.</p>', true)
ON CONFLICT (tenant_id, page_slug) DO NOTHING;

-- Banners demo
INSERT INTO tenant_banners (tenant_id, title, subtitle, image_url, link_url, sort_order) VALUES
(1, 'Bienvenidos a BGE Héroes de la Patria', 'Formando líderes del mañana', '/images/banner1.jpg', '/conocenos', 1),
(1, 'Oferta Educativa 2026', 'Inscríbete en nuestro bachillerato', '/images/banner2.jpg', '/oferta-educativa', 2),
(1, 'Servicios Escolares', 'Biblioteca, laboratorios y más', '/images/banner3.jpg', '/servicios', 3);

-- Avisos demo
INSERT INTO tenant_notices (tenant_id, title, content, type, is_zone_notice) VALUES
(1, 'Inicio de Clases 2026-2027', 'El próximo lunes 1 de septiembre inician las actividades del ciclo escolar 2026-2027. Hora de entrada: 7:00 AM.', 'aviso', false),
(1, 'Circulario de Zona 004', 'Se informa a todos los planteles de la zona escolar 004 que se realizará la reunión de supervisores el viernes 5 de septiembre.', 'circular_zona', true),
(1, 'Convocatoria: Olimpiadas del Conocimiento', 'Se convoca a los estudiantes a participar en las Olimpiadas del Conocimiento 2026. Inscripciones abiertas en dirección.', 'convocatoria', false);

-- Programas demo
INSERT INTO tenant_programs (tenant_id, program_type, program_name, description) VALUES
(1, 'capacitacion', 'Taller de Programación Básica', 'Curso de introducción a la programación con Python y HTML/CSS'),
(1, 'capacitacion', 'Taller de Inglés Nivel Básico', 'Curso de inglés para principiantes con enfoque en conversación'),
(1, 'paraescolar', 'Equipo de Debate', 'Formación de equipo representativo para competencias de debate'),
(1, 'club', 'Club de Ciencias', 'Exploración científica y proyectos de investigación');

-- ================================================================
-- VERIFICACIÓN FINAL
-- ================================================================

-- Contar registros insertados por tabla
SELECT 'tenant_pages' as tabla, COUNT(*) as registros FROM tenant_pages
UNION ALL
SELECT 'tenant_banners', COUNT(*) FROM tenant_banners
UNION ALL
SELECT 'tenant_notices', COUNT(*) FROM tenant_notices
UNION ALL
SELECT 'tenant_programs', COUNT(*) FROM tenant_programs
UNION ALL
SELECT 'tenant_files', COUNT(*) FROM tenant_files
UNION ALL
SELECT 'tenants (total)', COUNT(*) FROM tenants;

-- ================================================================
-- FIN DEL SCRIPT
-- ================================================================
