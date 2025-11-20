-- ========================================
-- MIGRACIÓN: Sistema de Marketplace de Recursos
-- BGE Héroes de la Patria
-- FASE 3 - Semana 23-24
-- ========================================

-- ========================================
-- TABLA: Categorías del Marketplace
-- ========================================
CREATE TABLE IF NOT EXISTS marketplace_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'fa-folder',
    color VARCHAR(20) DEFAULT '#3498db',
    parent_id INTEGER REFERENCES marketplace_categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Items del Marketplace
-- ========================================
CREATE TABLE IF NOT EXISTS marketplace_items (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES marketplace_categories(id),

    -- Información básica
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(300) UNIQUE,
    description TEXT NOT NULL,
    short_description VARCHAR(500),

    -- Tipo de item
    item_type VARCHAR(50) NOT NULL,               -- notes, guide, template, quiz_pack, tutorial, course

    -- Contenido
    content_url VARCHAR(500),                     -- URL del archivo/recurso
    preview_url VARCHAR(500),                     -- Preview/thumbnail
    file_type VARCHAR(50),                        -- pdf, docx, zip, video
    file_size_bytes BIGINT,

    -- Precios
    price_coins INTEGER NOT NULL DEFAULT 0,       -- Precio en IACoins
    original_price_coins INTEGER,                 -- Para descuentos
    is_free BOOLEAN DEFAULT false,

    -- Materia/Tema
    subject VARCHAR(100),
    topics JSONB DEFAULT '[]',
    grade_level VARCHAR(50),                      -- 1ro, 2do, 3ro, etc.

    -- Estado
    status VARCHAR(20) DEFAULT 'draft',           -- draft, pending_review, published, rejected, archived
    is_featured BOOLEAN DEFAULT false,

    -- Estadísticas
    view_count INTEGER DEFAULT 0,
    purchase_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    rating_avg DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,

    -- Metadatos
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',

    -- Moderación
    reviewed_by INTEGER REFERENCES usuarios(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- TABLA: Compras del Marketplace
-- ========================================
CREATE TABLE IF NOT EXISTS marketplace_purchases (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
    seller_id INTEGER NOT NULL REFERENCES usuarios(id),

    -- Transacción
    price_paid INTEGER NOT NULL,                  -- IACoins pagados
    transaction_id INTEGER,                       -- Referencia a iacoins_transactions

    -- Estado
    status VARCHAR(20) DEFAULT 'completed',       -- completed, refunded, disputed

    -- Acceso
    download_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(buyer_id, item_id)
);

-- ========================================
-- TABLA: Reviews del Marketplace
-- ========================================
CREATE TABLE IF NOT EXISTS marketplace_reviews (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
    reviewer_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Review
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    content TEXT,

    -- Estado
    is_verified_purchase BOOLEAN DEFAULT false,
    is_helpful INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT false,

    -- Respuesta del vendedor
    seller_response TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(item_id, reviewer_id)
);

-- ========================================
-- TABLA: Ganancias de Creadores
-- ========================================
CREATE TABLE IF NOT EXISTS creator_earnings (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Totales
    total_sales INTEGER DEFAULT 0,
    total_earnings INTEGER DEFAULT 0,             -- IACoins ganados
    available_balance INTEGER DEFAULT 0,          -- Balance disponible para retiro
    withdrawn_total INTEGER DEFAULT 0,

    -- Estadísticas
    items_sold INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0,

    -- Nivel de creador
    creator_level INTEGER DEFAULT 1,
    creator_xp INTEGER DEFAULT 0,

    -- Comisión (% que se queda la plataforma)
    commission_rate DECIMAL(5,4) DEFAULT 0.10,    -- 10% por defecto

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(creator_id)
);

-- ========================================
-- TABLA: Transacciones de Ganancias
-- ========================================
CREATE TABLE IF NOT EXISTS creator_transactions (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    purchase_id INTEGER REFERENCES marketplace_purchases(id),

    -- Tipo
    transaction_type VARCHAR(50) NOT NULL,        -- sale, commission, withdrawal, bonus

    -- Montos
    gross_amount INTEGER NOT NULL,
    commission_amount INTEGER DEFAULT 0,
    net_amount INTEGER NOT NULL,

    -- Balance después de transacción
    balance_after INTEGER,

    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Favoritos del Marketplace
-- ========================================
CREATE TABLE IF NOT EXISTS marketplace_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- ========================================
-- TABLA: Reportes de Items
-- ========================================
CREATE TABLE IF NOT EXISTS marketplace_reports (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
    reporter_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    reason VARCHAR(100) NOT NULL,                 -- copyright, inappropriate, misleading, spam
    description TEXT,

    status VARCHAR(20) DEFAULT 'pending',         -- pending, reviewed, resolved, dismissed
    reviewed_by INTEGER REFERENCES usuarios(id),
    resolution_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- TABLA: Promociones/Descuentos
-- ========================================
CREATE TABLE IF NOT EXISTS marketplace_promotions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE,                      -- Código promocional

    -- Descuento
    discount_type VARCHAR(20) NOT NULL,           -- percentage, fixed
    discount_value INTEGER NOT NULL,

    -- Aplicabilidad
    applies_to VARCHAR(50) DEFAULT 'all',         -- all, category, item, seller
    target_id INTEGER,                            -- ID de categoría/item/vendedor

    -- Restricciones
    min_purchase INTEGER DEFAULT 0,
    max_uses INTEGER,
    uses_count INTEGER DEFAULT 0,
    max_uses_per_user INTEGER DEFAULT 1,

    -- Vigencia
    starts_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ÍNDICES DE PERFORMANCE
-- ========================================

-- Categories
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_parent ON marketplace_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_slug ON marketplace_categories(slug);

-- Items
CREATE INDEX IF NOT EXISTS idx_marketplace_items_seller ON marketplace_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_category ON marketplace_items(category_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_status ON marketplace_items(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_type ON marketplace_items(item_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_subject ON marketplace_items(subject);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_price ON marketplace_items(price_coins);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_rating ON marketplace_items(rating_avg DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_featured ON marketplace_items(is_featured, status);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_purchases ON marketplace_items(purchase_count DESC);

-- Purchases
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_buyer ON marketplace_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_item ON marketplace_purchases(item_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_seller ON marketplace_purchases(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_date ON marketplace_purchases(purchased_at DESC);

-- Reviews
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_item ON marketplace_reviews(item_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_reviewer ON marketplace_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_rating ON marketplace_reviews(rating);

-- Creator Earnings
CREATE INDEX IF NOT EXISTS idx_creator_earnings_creator ON creator_earnings(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_transactions_creator ON creator_transactions(creator_id);

-- Favorites
CREATE INDEX IF NOT EXISTS idx_marketplace_favorites_user ON marketplace_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_favorites_item ON marketplace_favorites(item_id);

-- Reports
CREATE INDEX IF NOT EXISTS idx_marketplace_reports_item ON marketplace_reports(item_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reports_status ON marketplace_reports(status);

-- ========================================
-- TRIGGERS
-- ========================================

-- Actualizar rating promedio del item
CREATE OR REPLACE FUNCTION update_item_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE marketplace_items
    SET
        rating_avg = (SELECT AVG(rating) FROM marketplace_reviews WHERE item_id = NEW.item_id AND NOT is_hidden),
        rating_count = (SELECT COUNT(*) FROM marketplace_reviews WHERE item_id = NEW.item_id AND NOT is_hidden),
        updated_at = NOW()
    WHERE id = NEW.item_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_item_rating
AFTER INSERT OR UPDATE OR DELETE ON marketplace_reviews
FOR EACH ROW EXECUTE FUNCTION update_item_rating();

-- Actualizar estadísticas del creador
CREATE OR REPLACE FUNCTION update_creator_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE creator_earnings
    SET
        total_sales = total_sales + 1,
        items_sold = items_sold + 1,
        updated_at = NOW()
    WHERE creator_id = NEW.seller_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_creator_stats
AFTER INSERT ON marketplace_purchases
FOR EACH ROW EXECUTE FUNCTION update_creator_stats();

-- ========================================
-- DATOS INICIALES: Categorías
-- ========================================
INSERT INTO marketplace_categories (name, slug, description, icon, color, sort_order) VALUES
    ('Apuntes y Notas', 'apuntes', 'Apuntes de clase y notas de estudio', 'fa-sticky-note', '#f39c12', 1),
    ('Guías de Estudio', 'guias', 'Guías completas por tema o materia', 'fa-book-open', '#3498db', 2),
    ('Plantillas', 'plantillas', 'Plantillas para trabajos, ensayos y proyectos', 'fa-file-alt', '#9b59b6', 3),
    ('Packs de Quiz', 'quizzes', 'Colecciones de preguntas para practicar', 'fa-question-circle', '#e74c3c', 4),
    ('Tutoriales', 'tutoriales', 'Videos y guías paso a paso', 'fa-play-circle', '#1abc9c', 5),
    ('Resúmenes', 'resumenes', 'Resúmenes de libros y temas', 'fa-compress-alt', '#2ecc71', 6),
    ('Ejercicios Resueltos', 'ejercicios', 'Problemas resueltos con explicación', 'fa-calculator', '#e67e22', 7),
    ('Mapas Mentales', 'mapas-mentales', 'Diagramas y mapas conceptuales', 'fa-project-diagram', '#8e44ad', 8),
    ('Flashcards', 'flashcards', 'Tarjetas de memorización', 'fa-clone', '#16a085', 9),
    ('Proyectos', 'proyectos', 'Proyectos completos de ejemplo', 'fa-folder-open', '#2c3e50', 10)
ON CONFLICT (slug) DO NOTHING;

-- Subcategorías por materia
INSERT INTO marketplace_categories (name, slug, description, icon, color, parent_id, sort_order)
SELECT
    m.name || ' - ' || c.name,
    LOWER(REPLACE(m.name, ' ', '-')) || '-' || c.slug,
    c.description || ' para ' || m.name,
    c.icon,
    c.color,
    c.id,
    m.orden
FROM (
    VALUES
        ('Matemáticas', 1),
        ('Física', 2),
        ('Química', 3),
        ('Biología', 4),
        ('Historia', 5),
        ('Literatura', 6),
        ('Inglés', 7),
        ('Programación', 8)
) AS m(name, orden)
CROSS JOIN marketplace_categories c
WHERE c.parent_id IS NULL
ON CONFLICT (slug) DO NOTHING;

-- ========================================
-- DATOS INICIALES: Items de Ejemplo
-- ========================================
INSERT INTO marketplace_items (seller_id, category_id, title, slug, description, short_description, item_type, price_coins, subject, status, is_featured) VALUES
    (
        1,
        (SELECT id FROM marketplace_categories WHERE slug = 'apuntes' LIMIT 1),
        'Apuntes Completos de Álgebra Lineal',
        'apuntes-algebra-lineal-completos',
        'Apuntes detallados que cubren todos los temas de álgebra lineal: matrices, determinantes, espacios vectoriales, transformaciones lineales y más. Incluye ejemplos resueltos y ejercicios de práctica.',
        'Apuntes completos de álgebra lineal con ejemplos y ejercicios',
        'notes',
        150,
        'Matemáticas',
        'published',
        true
    ),
    (
        1,
        (SELECT id FROM marketplace_categories WHERE slug = 'quizzes' LIMIT 1),
        'Pack de 100 Preguntas de Historia de México',
        'pack-100-preguntas-historia-mexico',
        'Colección de 100 preguntas de opción múltiple sobre historia de México, desde la época prehispánica hasta la actualidad. Ideal para preparar exámenes.',
        '100 preguntas para practicar historia de México',
        'quiz_pack',
        200,
        'Historia',
        'published',
        true
    ),
    (
        1,
        (SELECT id FROM marketplace_categories WHERE slug = 'tutoriales' LIMIT 1),
        'Tutorial: Cómo Escribir un Ensayo Argumentativo',
        'tutorial-ensayo-argumentativo',
        'Guía completa paso a paso para escribir ensayos argumentativos efectivos. Incluye estructura, conectores, ejemplos y plantilla descargable.',
        'Aprende a escribir ensayos argumentativos',
        'tutorial',
        100,
        'Literatura',
        'published',
        false
    )
ON CONFLICT (slug) DO NOTHING;

-- ========================================
-- COMENTARIOS
-- ========================================
COMMENT ON TABLE marketplace_categories IS 'Categorías para organizar items del marketplace';
COMMENT ON TABLE marketplace_items IS 'Recursos educativos en venta';
COMMENT ON TABLE marketplace_purchases IS 'Registro de compras de usuarios';
COMMENT ON TABLE marketplace_reviews IS 'Reviews y calificaciones de items';
COMMENT ON TABLE creator_earnings IS 'Balance y estadísticas de creadores';
COMMENT ON TABLE creator_transactions IS 'Historial de transacciones de ganancias';
COMMENT ON TABLE marketplace_favorites IS 'Items guardados por usuarios';
COMMENT ON TABLE marketplace_reports IS 'Reportes de contenido inapropiado';
COMMENT ON TABLE marketplace_promotions IS 'Códigos promocionales y descuentos';

COMMENT ON COLUMN marketplace_items.item_type IS 'notes, guide, template, quiz_pack, tutorial, course';
COMMENT ON COLUMN marketplace_items.status IS 'draft, pending_review, published, rejected, archived';
COMMENT ON COLUMN marketplace_purchases.status IS 'completed, refunded, disputed';

-- ========================================
-- FIN DE MIGRACIÓN
-- ========================================
