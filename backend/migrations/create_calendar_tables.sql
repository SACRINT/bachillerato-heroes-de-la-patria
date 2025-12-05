-- Migration: Crear tablas del sistema de calendario
-- Fecha: 2025-12-03

-- Tabla principal de eventos
CREATE TABLE IF NOT EXISTS calendar_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    all_day BOOLEAN DEFAULT FALSE,
    location VARCHAR(255),
    type VARCHAR(50) NOT NULL CHECK (type IN ('academico', 'administrativo', 'cultural', 'deportivo', 'social', 'emergencia')),
    priority VARCHAR(20) DEFAULT 'media' CHECK (priority IN ('baja', 'media', 'alta', 'urgente')),
    is_public BOOLEAN DEFAULT TRUE,
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    google_event_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'programado' CHECK (status IN ('programado', 'en_curso', 'completado', 'cancelado')),
    created_by INTEGER NOT NULL,
    updated_by INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_calendar_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_type ON calendar_events(type);
CREATE INDEX IF NOT EXISTS idx_calendar_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_is_public ON calendar_events(is_public);
CREATE INDEX IF NOT EXISTS idx_calendar_created_by ON calendar_events(created_by);

-- Tabla de asistentes a eventos
CREATE TABLE IF NOT EXISTS event_attendees (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'registrado' CHECK (status IN ('registrado', 'confirmado', 'presente', 'ausente')),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_attendees_event ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_attendees_user ON event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_attendees_status ON event_attendees(status);

-- Tabla de recordatorios
CREATE TABLE IF NOT EXISTS event_reminders (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'push', 'sms')),
    minutes_before INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'enviado', 'error')),
    sent_at TIMESTAMP,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reminders_event ON event_reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON event_reminders(status);
CREATE INDEX IF NOT EXISTS idx_reminders_minutes ON event_reminders(minutes_before);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_updated_at();

CREATE TRIGGER event_attendees_updated_at
    BEFORE UPDATE ON event_attendees
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_updated_at();
