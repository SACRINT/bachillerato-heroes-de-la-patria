-- ========================================================
-- MIGRACIÓN: Tablas CMS para configuración del Director
-- Fecha: 2026-09-01
-- Descripción: Tablas para que el director pueda configurar
--              personal, línea del tiempo, galería,
--              testimonios, instalaciones e imágenes hero.
-- NOTA: tenant_id DEFAULT 1 (single-tenant por ahora)
-- ========================================================

-- 1. TABLA DE PERSONAL DEL PLANTEL
CREATE TABLE IF NOT EXISTS tenant_staff (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER DEFAULT 1,
    full_name VARCHAR(255) NOT NULL,
    position VARCHAR(150),
    department VARCHAR(100),
    photo_url VARCHAR(500),
    email VARCHAR(255),
    phone VARCHAR(20),
    bio TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_staff_tenant ON tenant_staff(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_staff_active ON tenant_staff(tenant_id, is_active);

-- 2. TABLA DE LÍNEA DEL TIEMPO
CREATE TABLE IF NOT EXISTS tenant_timeline (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER DEFAULT 1,
    year VARCHAR(10) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    event_type VARCHAR(50) DEFAULT 'hitos',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_timeline_tenant ON tenant_timeline(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_timeline_year ON tenant_timeline(tenant_id, year);

-- 3. TABLA DE GALERÍA DE IMÁGENES
CREATE TABLE IF NOT EXISTS tenant_gallery (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER DEFAULT 1,
    title VARCHAR(255),
    description TEXT,
    image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    category VARCHAR(100),
    album VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_gallery_tenant ON tenant_gallery(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_gallery_category ON tenant_gallery(tenant_id, category);

-- 4. TABLA DE TESTIMONIOS DE EGRESADOS
CREATE TABLE IF NOT EXISTS tenant_testimonials (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER DEFAULT 1,
    person_name VARCHAR(255) NOT NULL,
    graduation_year VARCHAR(10),
    occupation VARCHAR(255),
    testimonial TEXT NOT NULL,
    photo_url VARCHAR(500),
    rating INTEGER DEFAULT 5,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_testimonials_tenant ON tenant_testimonials(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_testimonials_featured ON tenant_testimonials(tenant_id, is_featured);

-- 5. TABLA DE INSTALACIONES
CREATE TABLE IF NOT EXISTS tenant_installations (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER DEFAULT 1,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    capacity VARCHAR(50),
    features TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_installations_tenant ON tenant_installations(tenant_id);

-- 6. TABLA DE IMÁGENES DEL HERO
CREATE TABLE IF NOT EXISTS tenant_hero_images (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER DEFAULT 1,
    image_url VARCHAR(500) NOT NULL,
    title VARCHAR(255),
    subtitle VARCHAR(500),
    link_url VARCHAR(500),
    button_text VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_hero_images_tenant ON tenant_hero_images(tenant_id);

-- ========================================================
-- DATOS DE EJEMPLO (para testing inicial)
-- ========================================================

INSERT INTO tenant_staff (tenant_id, full_name, position, department, photo_url, sort_order)
VALUES (1, 'Director del Plantel', 'Director', 'Administración', '/images/placeholder/teacher-placeholder.webp', 1);

INSERT INTO tenant_timeline (tenant_id, year, title, description, sort_order)
VALUES (1, '2010', 'Fundación del Plantel', 'Se funda el bachillerato con la misión de formar jóvenes íntegros.', 1);

INSERT INTO tenant_gallery (tenant_id, title, image_url, category, sort_order)
VALUES (1, 'Inicio de ciclo escolar', '/images/placeholder/teacher-placeholder.webp', 'eventos', 1);

INSERT INTO tenant_testimonials (tenant_id, person_name, graduation_year, occupation, testimonial, rating)
VALUES (1, 'Egresado Ejemplo', '2020', 'Ingeniero en Sistemas', 'Mi experiencia en el bachillerato fue transformadora. Los docentes me prepararon para enfrentar los retos profesionales.', 5);

INSERT INTO tenant_installations (tenant_id, name, description, image_url, capacity, sort_order)
VALUES (1, 'Laboratorio de Ciencias', 'Espacio equipado para prácticas de física, química y biología.', '/images/placeholder/teacher-placeholder.webp', '30 alumnos', 1);

INSERT INTO tenant_hero_images (tenant_id, image_url, title, subtitle, sort_order)
VALUES (1, '/images/hero/fachada1.webp', 'Bachillerato General Estatal', 'Formando líderes del mañana con educación de excelencia', 1);
