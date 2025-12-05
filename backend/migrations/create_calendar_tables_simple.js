/**
 * Script SIMPLIFICADO para crear tablas de Calendar
 */

const { Pool } = require('pg');

async function createTables() {
    // Usar DATABASE_URL directamente sin SSL
    const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/bge_dev';

    const pool = new Pool({
        connectionString,
        ssl: false // Desactivar SSL para desarrollo local
    });

    const sql = `
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

        -- Tabla de asistentes
        CREATE TABLE IF NOT EXISTS event_attendees (
            id SERIAL PRIMARY KEY,
            event_id INTEGER NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL,
            status VARCHAR(20) DEFAULT 'registrado',
            registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (event_id, user_id)
        );

        -- Tabla de recordatorios
        CREATE TABLE IF NOT EXISTS event_reminders (
            id SERIAL PRIMARY KEY,
            event_id INTEGER NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
            type VARCHAR(20) NOT NULL,
            minutes_before INTEGER NOT NULL,
            status VARCHAR(20) DEFAULT 'pendiente',
            sent_at TIMESTAMP,
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        console.log('📅 Creando tablas de calendario...');
        await pool.query(sql);
        console.log('✅ Tablas creadas exitosamente');
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

createTables();
