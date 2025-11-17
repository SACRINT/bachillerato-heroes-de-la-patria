/**
 * MIGRATION: CREATE SEARCH_ANALYTICS TABLE - SEMANA 6
 * Tabla para tracking de búsquedas y analytics
 * Fecha: 17 Noviembre 2025
 */

-- Crear tabla search_analytics
CREATE TABLE IF NOT EXISTS search_analytics (
    id SERIAL PRIMARY KEY,
    query VARCHAR(500) NOT NULL,
    results_count INTEGER DEFAULT 0,
    time_ms NUMERIC(10, 2) DEFAULT 0,
    searched_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_searched_at ON search_analytics(searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_query_searched ON search_analytics(query, searched_at DESC);

-- Comentarios
COMMENT ON TABLE search_analytics IS 'Tracking de búsquedas para analytics';
COMMENT ON COLUMN search_analytics.query IS 'Término buscado (lowercase, trimmed)';
COMMENT ON COLUMN search_analytics.results_count IS 'Número de resultados encontrados';
COMMENT ON COLUMN search_analytics.time_ms IS 'Tiempo de búsqueda en milisegundos';

-- Verificar
SELECT 'search_analytics table created successfully' AS status;
