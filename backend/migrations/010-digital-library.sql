-- ========================================
-- MIGRACIÓN: Sistema de Biblioteca Digital
-- BGE Héroes de la Patria
-- FASE 2 - Semana 13-14
-- ========================================

-- ========================================
-- TABLA: Categorías de Recursos
-- ========================================
CREATE TABLE IF NOT EXISTS library_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'fa-folder',
    color VARCHAR(20) DEFAULT '#3498db',
    parent_id INTEGER REFERENCES library_categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Recursos de Biblioteca
-- ========================================
CREATE TABLE IF NOT EXISTS library_resources (
    id SERIAL PRIMARY KEY,

    -- Información básica
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(300) UNIQUE,
    description TEXT,
    summary TEXT,

    -- Categorización
    category_id INTEGER REFERENCES library_categories(id),
    subject VARCHAR(100),                    -- Matemáticas, Historia, etc.
    grade_level VARCHAR(50),                 -- 1er, 2do, 3er semestre
    tags JSONB,                              -- ["algebra", "ecuaciones"]

    -- Tipo de recurso
    resource_type VARCHAR(50) NOT NULL,      -- book, article, video, audio, document, interactive
    format VARCHAR(50),                      -- pdf, epub, mp4, mp3, html

    -- Archivos
    file_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    preview_url VARCHAR(500),
    file_size INTEGER,                       -- En bytes
    duration INTEGER,                        -- Para videos/audio en segundos
    page_count INTEGER,                      -- Para documentos

    -- Metadatos
    author VARCHAR(200),
    publisher VARCHAR(200),
    publication_date DATE,
    isbn VARCHAR(20),
    language VARCHAR(10) DEFAULT 'es',

    -- Contenido externo
    external_url VARCHAR(500),
    embed_code TEXT,

    -- Gamificación
    xp_reward INTEGER DEFAULT 10,            -- XP por completar lectura
    coins_reward INTEGER DEFAULT 5,          -- IACoins por completar

    -- Estadísticas
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,

    -- Estado
    is_featured BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,        -- Requiere nivel/IACoins
    required_level INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,

    -- SEO
    meta_title VARCHAR(200),
    meta_description VARCHAR(500),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER REFERENCES usuarios(id)
);

-- ========================================
-- TABLA: Progreso de Lectura de Usuario
-- ========================================
CREATE TABLE IF NOT EXISTS library_user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    resource_id INTEGER NOT NULL REFERENCES library_resources(id) ON DELETE CASCADE,

    -- Progreso
    progress_percent INTEGER DEFAULT 0,      -- 0-100
    current_page INTEGER DEFAULT 0,
    current_position INTEGER DEFAULT 0,      -- Para videos/audio en segundos

    -- Tiempos
    total_time_spent INTEGER DEFAULT 0,      -- En segundos
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Estado
    is_completed BOOLEAN DEFAULT false,
    completion_count INTEGER DEFAULT 0,

    -- Notas y marcadores
    notes TEXT,
    bookmarks JSONB,                         -- [{page: 5, note: "importante"}]
    highlights JSONB,                        -- [{text: "...", page: 3, color: "yellow"}]

    -- Recompensas
    xp_earned INTEGER DEFAULT 0,
    coins_earned INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, resource_id)
);

-- ========================================
-- TABLA: Favoritos de Usuario
-- ========================================
CREATE TABLE IF NOT EXISTS library_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    resource_id INTEGER NOT NULL REFERENCES library_resources(id) ON DELETE CASCADE,

    -- Organización
    folder_name VARCHAR(100),
    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, resource_id)
);

-- ========================================
-- TABLA: Valoraciones y Reseñas
-- ========================================
CREATE TABLE IF NOT EXISTS library_reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    resource_id INTEGER NOT NULL REFERENCES library_resources(id) ON DELETE CASCADE,

    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,

    -- Moderación
    is_approved BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,

    -- Utilidad
    helpful_count INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, resource_id)
);

-- ========================================
-- TABLA: Historial de Descargas
-- ========================================
CREATE TABLE IF NOT EXISTS library_downloads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    resource_id INTEGER NOT NULL REFERENCES library_resources(id) ON DELETE CASCADE,

    download_type VARCHAR(20) DEFAULT 'full', -- full, preview, chapter
    ip_address VARCHAR(45),
    user_agent TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Colecciones/Listas de Lectura
-- ========================================
CREATE TABLE IF NOT EXISTS library_collections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,

    -- Estadísticas
    resource_count INTEGER DEFAULT 0,
    follower_count INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLA: Recursos en Colecciones
-- ========================================
CREATE TABLE IF NOT EXISTS library_collection_items (
    id SERIAL PRIMARY KEY,
    collection_id INTEGER NOT NULL REFERENCES library_collections(id) ON DELETE CASCADE,
    resource_id INTEGER NOT NULL REFERENCES library_resources(id) ON DELETE CASCADE,

    sort_order INTEGER DEFAULT 0,
    notes TEXT,

    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(collection_id, resource_id)
);

-- ========================================
-- TABLA: Recursos Relacionados
-- ========================================
CREATE TABLE IF NOT EXISTS library_related_resources (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER NOT NULL REFERENCES library_resources(id) ON DELETE CASCADE,
    related_resource_id INTEGER NOT NULL REFERENCES library_resources(id) ON DELETE CASCADE,

    relation_type VARCHAR(50) DEFAULT 'similar', -- similar, sequel, prerequisite, supplementary
    relevance_score INTEGER DEFAULT 50,          -- 1-100

    UNIQUE(resource_id, related_resource_id)
);

-- ========================================
-- ÍNDICES DE PERFORMANCE
-- ========================================

-- Categorías
CREATE INDEX IF NOT EXISTS idx_library_categories_parent ON library_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_library_categories_slug ON library_categories(slug);

-- Recursos
CREATE INDEX IF NOT EXISTS idx_library_resources_category ON library_resources(category_id);
CREATE INDEX IF NOT EXISTS idx_library_resources_subject ON library_resources(subject);
CREATE INDEX IF NOT EXISTS idx_library_resources_type ON library_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_library_resources_featured ON library_resources(is_featured, is_active);
CREATE INDEX IF NOT EXISTS idx_library_resources_rating ON library_resources(avg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_library_resources_views ON library_resources(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_library_resources_created ON library_resources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_library_resources_tags ON library_resources USING GIN(tags);

-- Progreso
CREATE INDEX IF NOT EXISTS idx_library_progress_user ON library_user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_library_progress_resource ON library_user_progress(resource_id);
CREATE INDEX IF NOT EXISTS idx_library_progress_completed ON library_user_progress(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_library_progress_recent ON library_user_progress(last_accessed_at DESC);

-- Favoritos
CREATE INDEX IF NOT EXISTS idx_library_favorites_user ON library_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_library_favorites_resource ON library_favorites(resource_id);

-- Reseñas
CREATE INDEX IF NOT EXISTS idx_library_reviews_resource ON library_reviews(resource_id);
CREATE INDEX IF NOT EXISTS idx_library_reviews_user ON library_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_library_reviews_rating ON library_reviews(rating DESC);

-- Descargas
CREATE INDEX IF NOT EXISTS idx_library_downloads_user ON library_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_library_downloads_resource ON library_downloads(resource_id);
CREATE INDEX IF NOT EXISTS idx_library_downloads_date ON library_downloads(created_at DESC);

-- Colecciones
CREATE INDEX IF NOT EXISTS idx_library_collections_user ON library_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_library_collections_public ON library_collections(is_public);
CREATE INDEX IF NOT EXISTS idx_library_collection_items_collection ON library_collection_items(collection_id);

-- ========================================
-- DATOS INICIALES: Categorías
-- ========================================
INSERT INTO library_categories (name, slug, description, icon, color, sort_order) VALUES
    ('Matemáticas', 'matematicas', 'Álgebra, Geometría, Cálculo y más', 'fa-calculator', '#3498db', 1),
    ('Física', 'fisica', 'Mecánica, Termodinámica, Electromagnetismo', 'fa-atom', '#9b59b6', 2),
    ('Química', 'quimica', 'Química General, Orgánica e Inorgánica', 'fa-flask', '#27ae60', 3),
    ('Biología', 'biologia', 'Anatomía, Ecología, Genética', 'fa-leaf', '#2ecc71', 4),
    ('Historia', 'historia', 'Historia de México y Universal', 'fa-landmark', '#f39c12', 5),
    ('Geografía', 'geografia', 'Geografía Física y Humana', 'fa-globe-americas', '#1abc9c', 6),
    ('Literatura', 'literatura', 'Literatura Mexicana y Universal', 'fa-book-open', '#e74c3c', 7),
    ('Inglés', 'ingles', 'Gramática, Vocabulario, Reading', 'fa-language', '#3498db', 8),
    ('Filosofía', 'filosofia', 'Ética, Lógica, Filosofía Contemporánea', 'fa-brain', '#8e44ad', 9),
    ('Informática', 'informatica', 'Programación, Ofimática, Redes', 'fa-laptop-code', '#2c3e50', 10),
    ('Arte', 'arte', 'Historia del Arte, Técnicas Artísticas', 'fa-palette', '#e91e63', 11),
    ('Educación Física', 'educacion-fisica', 'Deportes, Salud, Bienestar', 'fa-running', '#ff5722', 12),
    ('Orientación', 'orientacion', 'Desarrollo Personal, Vocacional', 'fa-compass', '#00bcd4', 13),
    ('Material de Apoyo', 'material-apoyo', 'Guías de Estudio, Formularios', 'fa-file-alt', '#607d8b', 14);

-- ========================================
-- DATOS INICIALES: Recursos de Ejemplo
-- ========================================
INSERT INTO library_resources (
    title, slug, description, summary, category_id, subject, grade_level,
    resource_type, format, author, xp_reward, coins_reward, tags
) VALUES
    (
        'Álgebra Básica: Fundamentos',
        'algebra-basica-fundamentos',
        'Guía completa de álgebra básica para primer semestre. Cubre operaciones con polinomios, factorización y ecuaciones lineales.',
        'Aprende los fundamentos del álgebra desde cero.',
        1, 'Matemáticas', '1er Semestre',
        'document', 'pdf',
        'Dr. Juan Pérez García',
        25, 10,
        '["algebra", "ecuaciones", "polinomios", "factorizacion"]'
    ),
    (
        'Historia de México: Independencia',
        'historia-mexico-independencia',
        'Material completo sobre el movimiento de Independencia de México, desde sus antecedentes hasta la consumación.',
        'Conoce los eventos que forjaron nuestra nación.',
        5, 'Historia', '2do Semestre',
        'document', 'pdf',
        'Mtra. María López Hernández',
        30, 15,
        '["independencia", "hidalgo", "morelos", "mexico"]'
    ),
    (
        'Introducción a la Programación',
        'introduccion-programacion',
        'Curso introductorio de programación con ejemplos prácticos en JavaScript y Python.',
        'Aprende a programar desde cero con ejercicios prácticos.',
        10, 'Informática', '3er Semestre',
        'interactive', 'html',
        'Ing. Carlos Ramírez',
        50, 25,
        '["programacion", "javascript", "python", "algoritmos"]'
    ),
    (
        'Física: Cinemática',
        'fisica-cinematica',
        'Estudio del movimiento sin considerar las causas. Incluye MRU, MRUA y tiro parabólico.',
        'Domina los conceptos básicos del movimiento.',
        2, 'Física', '2do Semestre',
        'video', 'mp4',
        'Dr. Roberto Sánchez',
        35, 15,
        '["cinematica", "mru", "mrua", "movimiento"]'
    ),
    (
        'Química: Tabla Periódica Interactiva',
        'quimica-tabla-periodica',
        'Explora la tabla periódica de forma interactiva. Conoce las propiedades de cada elemento.',
        'Descubre los secretos de los elementos químicos.',
        3, 'Química', '1er Semestre',
        'interactive', 'html',
        'Dra. Ana Martínez',
        20, 10,
        '["tabla periodica", "elementos", "quimica", "interactivo"]'
    );

-- ========================================
-- TRIGGER: Actualizar contador de recursos en colección
-- ========================================
CREATE OR REPLACE FUNCTION update_collection_resource_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE library_collections SET resource_count = resource_count + 1 WHERE id = NEW.collection_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE library_collections SET resource_count = resource_count - 1 WHERE id = OLD.collection_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_collection_count
AFTER INSERT OR DELETE ON library_collection_items
FOR EACH ROW EXECUTE FUNCTION update_collection_resource_count();

-- ========================================
-- TRIGGER: Actualizar rating promedio
-- ========================================
CREATE OR REPLACE FUNCTION update_resource_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE library_resources
    SET
        avg_rating = (SELECT COALESCE(AVG(rating), 0) FROM library_reviews WHERE resource_id = COALESCE(NEW.resource_id, OLD.resource_id)),
        rating_count = (SELECT COUNT(*) FROM library_reviews WHERE resource_id = COALESCE(NEW.resource_id, OLD.resource_id))
    WHERE id = COALESCE(NEW.resource_id, OLD.resource_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_resource_rating
AFTER INSERT OR UPDATE OR DELETE ON library_reviews
FOR EACH ROW EXECUTE FUNCTION update_resource_rating();

-- ========================================
-- COMENTARIOS
-- ========================================
COMMENT ON TABLE library_resources IS 'Recursos educativos de la biblioteca digital';
COMMENT ON TABLE library_user_progress IS 'Progreso de lectura/visualización de usuarios';
COMMENT ON TABLE library_favorites IS 'Recursos marcados como favoritos';
COMMENT ON TABLE library_reviews IS 'Valoraciones y reseñas de usuarios';
COMMENT ON TABLE library_collections IS 'Listas de lectura personalizadas';

COMMENT ON COLUMN library_resources.xp_reward IS 'Puntos de experiencia al completar el recurso';
COMMENT ON COLUMN library_resources.coins_reward IS 'IACoins otorgados al completar';
COMMENT ON COLUMN library_user_progress.bookmarks IS 'JSON con marcadores de página';
COMMENT ON COLUMN library_user_progress.highlights IS 'JSON con texto resaltado';

-- ========================================
-- FIN DE MIGRACIÓN
-- ========================================
