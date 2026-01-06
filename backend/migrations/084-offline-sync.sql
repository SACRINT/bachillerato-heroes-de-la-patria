-- Tabla de Cola de Sincronización (Sync Queue)
-- Almacena cambios realizados offline para procesarlos cuando haya conexión
CREATE TABLE IF NOT EXISTS sync_queue (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    operation_type VARCHAR(20) NOT NULL,
    -- 'INSERT', 'UPDATE', 'DELETE'
    entity_name VARCHAR(50) NOT NULL,
    -- 'grades', 'notes', 'progress'
    payload JSONB NOT NULL,
    -- Datos a sincronizar
    status VARCHAR(20) DEFAULT 'pending',
    -- 'pending', 'processed', 'failed'
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);
-- Tabla de Versiones de Datos (Data Versioning)
-- Para controlar qué datos necesita descargar el cliente
CREATE TABLE IF NOT EXISTS data_versions (
    entity_name VARCHAR(50) PRIMARY KEY,
    -- 'syllabus', 'teachers', 'calendar'
    version BIGINT DEFAULT 1,
    last_updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_sync_user_status ON sync_queue(user_id, status);