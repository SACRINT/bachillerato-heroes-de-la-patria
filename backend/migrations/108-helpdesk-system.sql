-- 🆘 MIGRACIÓN 108: HELPDESK SYSTEM
-- Propósito: Sistema de tickets de soporte técnico (Fase 7 - Semana 54)
-- 1. Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    category VARCHAR(50) NOT NULL,
    -- 'technical', 'academic', 'billing'
    subject VARCHAR(200) NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    -- 'open', 'in_progress', 'resolved', 'closed'
    priority VARCHAR(10) DEFAULT 'medium',
    assigned_to INTEGER,
    -- User ID del admin/staff
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 2. Mensajes del Ticket
CREATE TABLE IF NOT EXISTS ticket_messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL,
    -- Quien escribió el mensaje
    message_body TEXT NOT NULL,
    is_internal_note BOOLEAN DEFAULT FALSE,
    -- Solo visible para staff
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Indices
CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);