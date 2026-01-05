-- CORRECCION 052 - tabla faltante
CREATE TABLE IF NOT EXISTS active_modules (
    id SERIAL PRIMARY KEY,
    module_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    version VARCHAR(20),
    status VARCHAR(30) DEFAULT 'active',
    dependencies TEXT [],
    configuration JSONB,
    endpoints TEXT [],
    documentation_url VARCHAR(500),
    activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_am_status ON active_modules(status);
COMMENT ON TABLE active_modules IS 'Modulos activos del sistema';