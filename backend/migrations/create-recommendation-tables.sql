/**
 * 🎯 RECOMMENDATION ENGINE DATABASE SCHEMA
 * SEMANA 19 - Sistema de Recomendaciones
 *
 * Tablas para recommendation engine:
 * - recommendation_interactions - Interacciones de usuarios con items
 * - cursos_disponibles - Cursos/materias (si no existe)
 * - materiales_estudio - Materiales de estudio (si no existe)
 * - actividades_extra - Actividades extracurriculares (si no existe)
 * - recursos_academicos - Recursos académicos (si no existe)
 *
 * Fecha: 17 Noviembre 2025
 * Estado: ✅ PRODUCTION-READY
 */

-- =============================================================================
-- TABLA: recommendation_interactions
-- Almacena todas las interacciones de usuarios con items (views, clicks, ratings)
-- =============================================================================

CREATE TABLE IF NOT EXISTS recommendation_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES usuarios(uuid) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('courses', 'materials', 'activities', 'resources')),
    item_id INTEGER NOT NULL,
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('view', 'click', 'enroll', 'rate', 'bookmark', 'complete')),
    rating DECIMAL(3, 2) CHECK (rating >= 0 AND rating <= 5), -- Rating opcional (0-5 estrellas)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para recommendation_interactions
CREATE INDEX IF NOT EXISTS idx_recom_user_id ON recommendation_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recom_item_type_id ON recommendation_interactions(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_recom_interaction_type ON recommendation_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_recom_created_at ON recommendation_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recom_user_item ON recommendation_interactions(user_id, item_type, item_id);

COMMENT ON TABLE recommendation_interactions IS 'Interacciones de usuarios con items para recommendation engine';
COMMENT ON COLUMN recommendation_interactions.item_type IS 'Tipo de item: courses, materials, activities, resources';
COMMENT ON COLUMN recommendation_interactions.interaction_type IS 'Tipo de interacción: view, click, enroll, rate, bookmark, complete';

-- =============================================================================
-- TABLA: cursos_disponibles
-- Cursos/materias electivas disponibles
-- =============================================================================

CREATE TABLE IF NOT EXISTS cursos_disponibles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100),
    nivel VARCHAR(50),
    creditos INTEGER DEFAULT 0,
    tags JSONB DEFAULT '[]',
    activo BOOLEAN DEFAULT true,
    visualizaciones INTEGER DEFAULT 0,
    inscritos INTEGER DEFAULT 0,
    calificacion_promedio DECIMAL(3, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cursos_categoria ON cursos_disponibles(categoria);
CREATE INDEX IF NOT EXISTS idx_cursos_activo ON cursos_disponibles(activo);
CREATE INDEX IF NOT EXISTS idx_cursos_visualizaciones ON cursos_disponibles(visualizaciones DESC);

COMMENT ON TABLE cursos_disponibles IS 'Cursos y materias electivas disponibles';

-- =============================================================================
-- TABLA: materiales_estudio
-- Materiales de estudio (PDFs, videos, presentaciones)
-- =============================================================================

CREATE TABLE IF NOT EXISTS materiales_estudio (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50), -- pdf, video, presentacion, articulo
    nivel VARCHAR(50),
    tags JSONB DEFAULT '[]',
    url VARCHAR(500),
    activo BOOLEAN DEFAULT true,
    visualizaciones INTEGER DEFAULT 0,
    descargas INTEGER DEFAULT 0,
    calificacion_promedio DECIMAL(3, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_materiales_tipo ON materiales_estudio(tipo);
CREATE INDEX IF NOT EXISTS idx_materiales_activo ON materiales_estudio(activo);
CREATE INDEX IF NOT EXISTS idx_materiales_visualizaciones ON materiales_estudio(visualizaciones DESC);

COMMENT ON TABLE materiales_estudio IS 'Materiales de estudio (PDFs, videos, etc)';

-- =============================================================================
-- TABLA: actividades_extra
-- Actividades extracurriculares (deportes, clubes, talleres)
-- =============================================================================

CREATE TABLE IF NOT EXISTS actividades_extra (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50), -- deporte, club, taller, evento
    tags JSONB DEFAULT '[]',
    cupo_maximo INTEGER DEFAULT 30,
    inscritos INTEGER DEFAULT 0,
    fecha_inicio DATE,
    fecha_fin DATE,
    activo BOOLEAN DEFAULT true,
    visualizaciones INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_actividades_tipo ON actividades_extra(tipo);
CREATE INDEX IF NOT EXISTS idx_actividades_activo ON actividades_extra(activo);
CREATE INDEX IF NOT EXISTS idx_actividades_fecha_inicio ON actividades_extra(fecha_inicio DESC);

COMMENT ON TABLE actividades_extra IS 'Actividades extracurriculares (deportes, clubes, talleres)';

-- =============================================================================
-- TABLA: recursos_academicos
-- Recursos académicos (tutorías, biblioteca, orientación)
-- =============================================================================

CREATE TABLE IF NOT EXISTS recursos_academicos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100),
    tags JSONB DEFAULT '[]',
    url VARCHAR(500),
    activo BOOLEAN DEFAULT true,
    visualizaciones INTEGER DEFAULT 0,
    accesos INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_recursos_categoria ON recursos_academicos(categoria);
CREATE INDEX IF NOT EXISTS idx_recursos_activo ON recursos_academicos(activo);
CREATE INDEX IF NOT EXISTS idx_recursos_visualizaciones ON recursos_academicos(visualizaciones DESC);

COMMENT ON TABLE recursos_academicos IS 'Recursos académicos (tutorías, biblioteca, orientación)';

-- =============================================================================
-- TABLAS AUXILIARES PARA COLLABORATIVE FILTERING
-- =============================================================================

-- Tabla para tracking de visualizaciones de materiales
CREATE TABLE IF NOT EXISTS materiales_visualizados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(uuid) ON DELETE CASCADE,
    material_id INTEGER NOT NULL REFERENCES materiales_estudio(id) ON DELETE CASCADE,
    progreso DECIMAL(3, 2) DEFAULT 0.00 CHECK (progreso >= 0 AND progreso <= 1),
    completado BOOLEAN DEFAULT false,
    tiempo_minutos INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mat_vis_usuario ON materiales_visualizados(usuario_id);
CREATE INDEX IF NOT EXISTS idx_mat_vis_material ON materiales_visualizados(material_id);

COMMENT ON TABLE materiales_visualizados IS 'Tracking de visualizaciones de materiales para collaborative filtering';

-- Tabla para tracking de participación en actividades
CREATE TABLE IF NOT EXISTS participacion_actividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID NOT NULL REFERENCES usuarios(uuid) ON DELETE CASCADE,
    actividad_id INTEGER NOT NULL REFERENCES actividades_extra(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'activo' CHECK (status IN ('activo', 'completado', 'cancelado')),
    asistencias INTEGER DEFAULT 0,
    sesiones_totales INTEGER DEFAULT 0,
    calificacion_actividad DECIMAL(3, 2) CHECK (calificacion_actividad >= 0 AND calificacion_actividad <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_part_act_estudiante ON participacion_actividades(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_part_act_actividad ON participacion_actividades(actividad_id);

COMMENT ON TABLE participacion_actividades IS 'Participación de estudiantes en actividades para collaborative filtering';

-- Tabla para tracking de acceso a recursos
CREATE TABLE IF NOT EXISTS acceso_recursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(uuid) ON DELETE CASCADE,
    recurso_id INTEGER NOT NULL REFERENCES recursos_academicos(id) ON DELETE CASCADE,
    tiempo_minutos INTEGER DEFAULT 0,
    guardado BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_acceso_usuario ON acceso_recursos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_acceso_recurso ON acceso_recursos(recurso_id);

COMMENT ON TABLE acceso_recursos IS 'Acceso a recursos académicos para collaborative filtering';

-- =============================================================================
-- TRIGGERS PARA ACTUALIZAR updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_cursos_updated_at BEFORE UPDATE ON cursos_disponibles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_materiales_updated_at BEFORE UPDATE ON materiales_estudio
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_actividades_updated_at BEFORE UPDATE ON actividades_extra
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_recursos_updated_at BEFORE UPDATE ON recursos_academicos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_mat_vis_updated_at BEFORE UPDATE ON materiales_visualizados
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_part_act_updated_at BEFORE UPDATE ON participacion_actividades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- DATOS DE EJEMPLO
-- =============================================================================

-- Insertar cursos de ejemplo
INSERT INTO cursos_disponibles (nombre, descripcion, categoria, nivel, tags, activo) VALUES
('Programación en Python', 'Introducción a la programación con Python', 'Tecnología', 'Básico', '["programacion", "python", "introduccion"]', true),
('Diseño Gráfico', 'Diseño gráfico con Adobe Photoshop', 'Arte y Diseño', 'Intermedio', '["diseño", "photoshop", "creativo"]', true),
('Inglés Avanzado', 'Curso avanzado de inglés conversacional', 'Idiomas', 'Avanzado', '["ingles", "conversacion", "avanzado"]', true),
('Matemáticas Financieras', 'Introducción a las finanzas personales', 'Matemáticas', 'Intermedio', '["finanzas", "matematicas", "economia"]', true),
('Robótica y Arduino', 'Construcción de robots con Arduino', 'Tecnología', 'Intermedio', '["robotica", "arduino", "stem"]', true);

-- Insertar materiales de ejemplo
INSERT INTO materiales_estudio (titulo, descripcion, tipo, nivel, tags, activo) VALUES
('Guía de Álgebra Lineal', 'Guía completa de álgebra lineal', 'pdf', 'Intermedio', '["matematicas", "algebra", "guia"]', true),
('Video: Cálculo Diferencial', 'Video tutorial de cálculo diferencial', 'video', 'Avanzado', '["calculo", "diferencial", "video"]', true),
('Presentación: Historia de México', 'Presentación sobre la historia de México', 'presentacion', 'Básico', '["historia", "mexico", "presentacion"]', true),
('Artículo: Cambio Climático', 'Artículo científico sobre cambio climático', 'articulo', 'Intermedio', '["ciencia", "clima", "articulo"]', true);

-- Insertar actividades de ejemplo
INSERT INTO actividades_extra (nombre, descripcion, tipo, fecha_inicio, fecha_fin, activo) VALUES
('Club de Ajedrez', 'Club de ajedrez para todos los niveles', 'club', '2025-01-15', '2025-06-15', true),
('Taller de Teatro', 'Taller de teatro y expresión corporal', 'taller', '2025-02-01', '2025-05-30', true),
('Equipo de Fútbol', 'Equipo representativo de fútbol', 'deporte', '2025-01-10', '2025-12-10', true),
('Grupo de Debate', 'Grupo de debate y oratoria', 'club', '2025-02-15', '2025-11-30', true);

-- Insertar recursos de ejemplo
INSERT INTO recursos_academicos (titulo, descripcion, categoria, url, activo) VALUES
('Tutorías de Matemáticas', 'Tutorías personalizadas de matemáticas', 'Tutorías', '/tutoring/math', true),
('Biblioteca Digital', 'Acceso a libros digitales y revistas', 'Biblioteca', '/library/digital', true),
('Orientación Vocacional', 'Servicio de orientación vocacional', 'Orientación', '/guidance/vocational', true),
('Apoyo Psicológico', 'Servicio de apoyo psicológico', 'Orientación', '/support/psychological', true);

-- =============================================================================
-- VERIFICACIONES
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Tablas creadas:';
    RAISE NOTICE '  - recommendation_interactions';
    RAISE NOTICE '  - cursos_disponibles';
    RAISE NOTICE '  - materiales_estudio';
    RAISE NOTICE '  - actividades_extra';
    RAISE NOTICE '  - recursos_academicos';
    RAISE NOTICE '  - materiales_visualizados';
    RAISE NOTICE '  - participacion_actividades';
    RAISE NOTICE '  - acceso_recursos';
    RAISE NOTICE '';
    RAISE NOTICE 'Datos de ejemplo insertados:';
    RAISE NOTICE '  - 5 cursos';
    RAISE NOTICE '  - 4 materiales';
    RAISE NOTICE '  - 4 actividades';
    RAISE NOTICE '  - 4 recursos';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Recommendation Engine Database Schema - COMPLETADO';
END $$;
