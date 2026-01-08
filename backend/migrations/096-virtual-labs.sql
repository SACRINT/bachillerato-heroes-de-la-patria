-- 📚 MIGRACIÓN 096: SIMULATION & VIRTUAL LABS
-- Propósito: Infraestructura para laboratorios virtuales y simulaciones (Fase 5 - Semana 36)
-- 1. Definición de Laboratorios
CREATE TABLE IF NOT EXISTS virtual_labs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    -- Física, Química, Biología
    description TEXT,
    config_json JSONB NOT NULL,
    -- Configuración del motor de simulación (e.g. constantes físicas, reactivos disponibles)
    thumbnail_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 2. Sesiones de Laboratorio (Experimentos de usuarios)
CREATE TABLE IF NOT EXISTS lab_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    lab_id INTEGER REFERENCES virtual_labs(id),
    status VARCHAR(50) DEFAULT 'in_progress',
    -- 'in_progress', 'completed'
    state_json JSONB DEFAULT '{}',
    -- Estado actual de la simulación (posición objetos, temperatura, etc.)
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);
-- 3. Registro de Datos (Data Logging para análisis)
CREATE TABLE IF NOT EXISTS lab_measurements (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES lab_sessions(id) ON DELETE CASCADE,
    variable_name VARCHAR(100) NOT NULL,
    -- 'velocidad', 'temperatura', 'pH'
    value DECIMAL(10, 4) NOT NULL,
    timestamp_offset_ms INTEGER NOT NULL,
    -- Tiempo desde inicio del experimento
    note TEXT
);
-- 4. Reportes de Laboratorio (Conclusiones)
CREATE TABLE IF NOT EXISTS lab_reports (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES lab_sessions(id) ON DELETE CASCADE,
    hypothesis TEXT,
    observations TEXT,
    conclusion TEXT,
    grade DECIMAL(5, 2),
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_virtual_labs_subject ON virtual_labs(subject);
CREATE INDEX IF NOT EXISTS idx_lab_sessions_user ON lab_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_measurements_session ON lab_measurements(session_id);
-- Seed Data: Laboratorio de Caída Libre
INSERT INTO virtual_labs (title, subject, description, config_json)
VALUES (
        'Caída Libre y Gravedad',
        'Física',
        'Estudia la relación entre altura, tiempo y gravedad en el vacío.',
        '{"gravity": 9.81, "objects": [{"name": "Pelota", "mass": 1}, {"name": "Pluma", "mass": 0.05}], "vacuum_mode": true}'
    );
INSERT INTO virtual_labs (title, subject, description, config_json)
VALUES (
        'Titulación Ácido-Base',
        'Química',
        'Determina la concentración de un ácido desconocido.',
        '{"acid": "HCl", "base": "NaOH", "indicator": "Fenolftaleína"}'
    );