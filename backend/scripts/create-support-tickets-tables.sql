/**
 * SISTEMA DE TICKETS DE SOPORTE - ESQUEMA DE BASE DE DATOS
 * Bachillerato General Estatal "Héroes de la Patria"
 * Fase 3 - Ciclo 23
 *
 * CARACTERÍSTICAS:
 * - Sistema completo de tickets con estados y prioridades
 * - Asignación a departamentos y agentes
 * - Comentarios con threading
 * - Archivos adjuntos
 * - Historial completo de cambios (auditoría)
 * - SLA tracking y escalamiento
 * - Categorías personalizables
 * - Métricas y reportes
 */

-- ============================================
-- TABLA: support_departments
-- Departamentos que atienden tickets
-- ============================================
CREATE TABLE IF NOT EXISTS support_departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    email VARCHAR(255),
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    sla_response_hours INTEGER DEFAULT 24,  -- Tiempo máximo de primera respuesta
    sla_resolution_hours INTEGER DEFAULT 72, -- Tiempo máximo de resolución
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para departments
CREATE INDEX idx_support_departments_active ON support_departments(is_active);

-- Datos iniciales de departamentos
INSERT INTO support_departments (name, description, icon, sla_response_hours, sla_resolution_hours) VALUES
('Soporte Técnico', 'Problemas técnicos, sistemas, equipos', 'bi-laptop', 4, 48),
('Administración', 'Trámites administrativos, documentos', 'bi-file-earmark-text', 8, 72),
('Académico', 'Cuestiones académicas, calificaciones', 'bi-book', 12, 96),
('Finanzas', 'Pagos, colegiaturas, becas', 'bi-cash-coin', 8, 48),
('Infraestructura', 'Mantenimiento, instalaciones', 'bi-building', 24, 168),
('Recursos Humanos', 'Personal, nómina, contratos', 'bi-people', 24, 120)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- TABLA: support_ticket_categories
-- Categorías de tickets
-- ============================================
CREATE TABLE IF NOT EXISTS support_ticket_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    department_id INTEGER REFERENCES support_departments(id),
    color VARCHAR(20) DEFAULT '#6c757d',
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    tickets_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para categories
CREATE INDEX idx_support_categories_dept ON support_ticket_categories(department_id);
CREATE INDEX idx_support_categories_active ON support_ticket_categories(is_active);
CREATE INDEX idx_support_categories_slug ON support_ticket_categories(slug);

-- Datos iniciales de categorías
INSERT INTO support_ticket_categories (name, slug, description, color, icon) VALUES
('Problema Técnico', 'technical-issue', 'Errores en sistemas, plataformas', '#dc3545', 'bi-bug'),
('Solicitud de Acceso', 'access-request', 'Permisos, cuentas, accesos', '#0dcaf0', 'bi-key'),
('Consulta General', 'general-inquiry', 'Preguntas generales', '#6c757d', 'bi-question-circle'),
('Reporte de Error', 'bug-report', 'Bugs en el sistema', '#fd7e14', 'bi-exclamation-triangle'),
('Solicitud de Cambio', 'change-request', 'Cambios en configuración', '#0d6efd', 'bi-arrow-repeat'),
('Mejora Sugerida', 'feature-request', 'Sugerencias de mejora', '#198754', 'bi-lightbulb'),
('Problema de Red', 'network-issue', 'Internet, conectividad', '#6f42c1', 'bi-wifi-off'),
('Problema de Hardware', 'hardware-issue', 'Equipos, impresoras, etc.', '#d63384', 'bi-display'),
('Otros', 'other', 'Otras categorías', '#adb5bd', 'bi-three-dots')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- TABLA: support_tickets
-- Tabla principal de tickets
-- ============================================
CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(20) NOT NULL UNIQUE, -- Formato: TKT-2025-000001

    -- Información del solicitante
    requester_id INTEGER NOT NULL,
    requester_role VARCHAR(20) NOT NULL, -- 'admin', 'teacher', 'student', 'parent'
    requester_name VARCHAR(200) NOT NULL,
    requester_email VARCHAR(255) NOT NULL,

    -- Información del ticket
    subject VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    category_id INTEGER REFERENCES support_ticket_categories(id),
    department_id INTEGER REFERENCES support_departments(id),

    -- Estado y prioridad
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'in_progress', 'waiting_user', 'resolved', 'closed', 'reopened'
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'

    -- Asignación
    assigned_to_id INTEGER, -- ID del agente asignado
    assigned_to_role VARCHAR(20), -- Rol del agente
    assigned_to_name VARCHAR(200),
    assigned_at TIMESTAMP,

    -- Resolución
    resolved_at TIMESTAMP,
    resolved_by_id INTEGER,
    resolved_by_name VARCHAR(200),
    resolution_notes TEXT,

    -- Cierre
    closed_at TIMESTAMP,
    closed_by_id INTEGER,
    closed_by_name VARCHAR(200),

    -- SLA tracking
    sla_response_deadline TIMESTAMP, -- Deadline para primera respuesta
    sla_resolution_deadline TIMESTAMP, -- Deadline para resolución
    first_response_at TIMESTAMP,
    response_sla_met BOOLEAN,
    resolution_sla_met BOOLEAN,

    -- Métricas
    total_comments INTEGER DEFAULT 0,
    total_attachments INTEGER DEFAULT 0,
    reopened_count INTEGER DEFAULT 0,

    -- Calificación del servicio
    satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
    satisfaction_comment TEXT,

    -- Metadata
    tags TEXT[], -- Array de tags
    is_escalated BOOLEAN DEFAULT FALSE,
    escalated_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('open', 'in_progress', 'waiting_user', 'resolved', 'closed', 'reopened')),
    CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

-- Índices para tickets
CREATE INDEX idx_support_tickets_number ON support_tickets(ticket_number);
CREATE INDEX idx_support_tickets_requester ON support_tickets(requester_id, requester_role);
CREATE INDEX idx_support_tickets_assigned ON support_tickets(assigned_to_id, assigned_to_role);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_category ON support_tickets(category_id);
CREATE INDEX idx_support_tickets_department ON support_tickets(department_id);
CREATE INDEX idx_support_tickets_created ON support_tickets(created_at DESC);
CREATE INDEX idx_support_tickets_sla_response ON support_tickets(sla_response_deadline) WHERE status NOT IN ('closed', 'resolved');
CREATE INDEX idx_support_tickets_sla_resolution ON support_tickets(sla_resolution_deadline) WHERE status NOT IN ('closed', 'resolved');
CREATE INDEX idx_support_tickets_escalated ON support_tickets(is_escalated) WHERE is_escalated = TRUE;

-- Full-text search en tickets
CREATE INDEX idx_support_tickets_search ON support_tickets
USING gin(to_tsvector('spanish', subject || ' ' || description));

-- ============================================
-- TABLA: support_ticket_comments
-- Comentarios y respuestas en tickets
-- ============================================
CREATE TABLE IF NOT EXISTS support_ticket_comments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,

    -- Autor del comentario
    author_id INTEGER NOT NULL,
    author_role VARCHAR(20) NOT NULL,
    author_name VARCHAR(200) NOT NULL,

    -- Contenido
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- Comentario interno (solo visible para staff)
    is_solution BOOLEAN DEFAULT FALSE, -- Marcado como solución

    -- Threading
    parent_comment_id INTEGER REFERENCES support_ticket_comments(id) ON DELETE CASCADE,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Índices para comments
CREATE INDEX idx_support_comments_ticket ON support_ticket_comments(ticket_id);
CREATE INDEX idx_support_comments_author ON support_ticket_comments(author_id, author_role);
CREATE INDEX idx_support_comments_parent ON support_ticket_comments(parent_comment_id);
CREATE INDEX idx_support_comments_created ON support_ticket_comments(created_at DESC);
CREATE INDEX idx_support_comments_internal ON support_ticket_comments(is_internal);

-- ============================================
-- TABLA: support_ticket_attachments
-- Archivos adjuntos en tickets
-- ============================================
CREATE TABLE IF NOT EXISTS support_ticket_attachments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES support_ticket_comments(id) ON DELETE CASCADE,

    -- Uploader
    uploaded_by_id INTEGER NOT NULL,
    uploaded_by_role VARCHAR(20) NOT NULL,
    uploaded_by_name VARCHAR(200) NOT NULL,

    -- Archivo
    file_name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100),
    mime_type VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para attachments
CREATE INDEX idx_support_attachments_ticket ON support_ticket_attachments(ticket_id);
CREATE INDEX idx_support_attachments_comment ON support_ticket_attachments(comment_id);
CREATE INDEX idx_support_attachments_uploader ON support_ticket_attachments(uploaded_by_id, uploaded_by_role);

-- ============================================
-- TABLA: support_ticket_history
-- Historial completo de cambios (auditoría)
-- ============================================
CREATE TABLE IF NOT EXISTS support_ticket_history (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,

    -- Actor del cambio
    changed_by_id INTEGER NOT NULL,
    changed_by_role VARCHAR(20) NOT NULL,
    changed_by_name VARCHAR(200) NOT NULL,

    -- Cambio realizado
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'assigned', 'status_changed', 'priority_changed', etc.
    field_changed VARCHAR(100), -- Campo que cambió
    old_value TEXT,
    new_value TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para history
CREATE INDEX idx_support_history_ticket ON support_ticket_history(ticket_id);
CREATE INDEX idx_support_history_actor ON support_ticket_history(changed_by_id, changed_by_role);
CREATE INDEX idx_support_history_action ON support_ticket_history(action);
CREATE INDEX idx_support_history_created ON support_ticket_history(created_at DESC);

-- ============================================
-- TABLA: support_ticket_watchers
-- Usuarios que siguen un ticket (observadores)
-- ============================================
CREATE TABLE IF NOT EXISTS support_ticket_watchers (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    user_role VARCHAR(20) NOT NULL,
    user_name VARCHAR(200) NOT NULL,
    user_email VARCHAR(255) NOT NULL,

    notify_comments BOOLEAN DEFAULT TRUE,
    notify_status_change BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (ticket_id, user_id, user_role)
);

-- Índices para watchers
CREATE INDEX idx_support_watchers_ticket ON support_ticket_watchers(ticket_id);
CREATE INDEX idx_support_watchers_user ON support_ticket_watchers(user_id, user_role);

-- ============================================
-- TABLA: support_canned_responses
-- Respuestas predefinidas/plantillas
-- ============================================
CREATE TABLE IF NOT EXISTS support_canned_responses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category_id INTEGER REFERENCES support_ticket_categories(id),
    department_id INTEGER REFERENCES support_departments(id),

    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,

    created_by_id INTEGER NOT NULL,
    created_by_name VARCHAR(200) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para canned responses
CREATE INDEX idx_canned_responses_category ON support_canned_responses(category_id);
CREATE INDEX idx_canned_responses_department ON support_canned_responses(department_id);
CREATE INDEX idx_canned_responses_active ON support_canned_responses(is_active);

-- ============================================
-- VISTAS OPTIMIZADAS
-- ============================================

-- Vista: Tickets con información completa
CREATE OR REPLACE VIEW v_support_tickets_full AS
SELECT
    t.*,
    c.name as category_name,
    c.color as category_color,
    c.icon as category_icon,
    d.name as department_name,
    d.email as department_email,

    -- Calcular si está vencido SLA
    CASE
        WHEN t.status NOT IN ('closed', 'resolved') AND t.sla_response_deadline < CURRENT_TIMESTAMP AND t.first_response_at IS NULL
        THEN TRUE
        ELSE FALSE
    END as response_sla_overdue,

    CASE
        WHEN t.status NOT IN ('closed', 'resolved') AND t.sla_resolution_deadline < CURRENT_TIMESTAMP
        THEN TRUE
        ELSE FALSE
    END as resolution_sla_overdue,

    -- Tiempo transcurrido
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.created_at))/3600 as hours_open,

    CASE
        WHEN t.resolved_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (t.resolved_at - t.created_at))/3600
        ELSE NULL
    END as hours_to_resolution,

    CASE
        WHEN t.first_response_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (t.first_response_at - t.created_at))/3600
        ELSE NULL
    END as hours_to_first_response

FROM support_tickets t
LEFT JOIN support_ticket_categories c ON t.category_id = c.id
LEFT JOIN support_departments d ON t.department_id = d.id;

-- Vista: Estadísticas por departamento
CREATE OR REPLACE VIEW v_support_department_stats AS
SELECT
    d.id,
    d.name,
    d.email,
    COUNT(t.id) as total_tickets,
    COUNT(CASE WHEN t.status = 'open' THEN 1 END) as open_tickets,
    COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tickets,
    COUNT(CASE WHEN t.status = 'waiting_user' THEN 1 END) as waiting_user_tickets,
    COUNT(CASE WHEN t.status = 'resolved' THEN 1 END) as resolved_tickets,
    COUNT(CASE WHEN t.status = 'closed' THEN 1 END) as closed_tickets,
    COUNT(CASE WHEN t.priority = 'urgent' THEN 1 END) as urgent_tickets,
    COUNT(CASE WHEN t.priority = 'high' THEN 1 END) as high_priority_tickets,
    AVG(CASE WHEN t.satisfaction_rating IS NOT NULL THEN t.satisfaction_rating END) as avg_satisfaction,
    AVG(CASE WHEN t.resolved_at IS NOT NULL THEN EXTRACT(EPOCH FROM (t.resolved_at - t.created_at))/3600 END) as avg_resolution_hours,
    COUNT(CASE WHEN t.response_sla_met = TRUE THEN 1 END)::FLOAT / NULLIF(COUNT(CASE WHEN t.first_response_at IS NOT NULL THEN 1 END), 0) * 100 as response_sla_compliance_pct,
    COUNT(CASE WHEN t.resolution_sla_met = TRUE THEN 1 END)::FLOAT / NULLIF(COUNT(CASE WHEN t.resolved_at IS NOT NULL THEN 1 END), 0) * 100 as resolution_sla_compliance_pct
FROM support_departments d
LEFT JOIN support_tickets t ON d.id = t.department_id
GROUP BY d.id, d.name, d.email;

-- Vista: Estadísticas por agente
CREATE OR REPLACE VIEW v_support_agent_stats AS
SELECT
    t.assigned_to_id as agent_id,
    t.assigned_to_role as agent_role,
    t.assigned_to_name as agent_name,
    COUNT(t.id) as total_assigned,
    COUNT(CASE WHEN t.status IN ('open', 'in_progress', 'waiting_user') THEN 1 END) as active_tickets,
    COUNT(CASE WHEN t.status = 'resolved' THEN 1 END) as resolved_tickets,
    COUNT(CASE WHEN t.status = 'closed' THEN 1 END) as closed_tickets,
    AVG(CASE WHEN t.satisfaction_rating IS NOT NULL THEN t.satisfaction_rating END) as avg_satisfaction,
    AVG(CASE WHEN t.resolved_at IS NOT NULL THEN EXTRACT(EPOCH FROM (t.resolved_at - t.created_at))/3600 END) as avg_resolution_hours
FROM support_tickets t
WHERE t.assigned_to_id IS NOT NULL
GROUP BY t.assigned_to_id, t.assigned_to_role, t.assigned_to_name;

-- ============================================
-- FUNCIONES
-- ============================================

-- Función: Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_support_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función: Generar número de ticket automático
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    sequence_part VARCHAR(6);
    max_number INTEGER;
BEGIN
    year_part := TO_CHAR(CURRENT_TIMESTAMP, 'YYYY');

    -- Obtener el último número de este año
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 10) AS INTEGER)), 0) + 1
    INTO max_number
    FROM support_tickets
    WHERE ticket_number LIKE 'TKT-' || year_part || '-%';

    sequence_part := LPAD(max_number::TEXT, 6, '0');
    NEW.ticket_number := 'TKT-' || year_part || '-' || sequence_part;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función: Calcular SLA deadlines
CREATE OR REPLACE FUNCTION calculate_sla_deadlines()
RETURNS TRIGGER AS $$
DECLARE
    dept_response_hours INTEGER;
    dept_resolution_hours INTEGER;
BEGIN
    -- Obtener SLA del departamento
    SELECT sla_response_hours, sla_resolution_hours
    INTO dept_response_hours, dept_resolution_hours
    FROM support_departments
    WHERE id = NEW.department_id;

    -- Si no hay departamento, usar valores por defecto
    dept_response_hours := COALESCE(dept_response_hours, 24);
    dept_resolution_hours := COALESCE(dept_resolution_hours, 72);

    -- Ajustar por prioridad
    CASE NEW.priority
        WHEN 'urgent' THEN
            dept_response_hours := dept_response_hours / 4;
            dept_resolution_hours := dept_resolution_hours / 2;
        WHEN 'high' THEN
            dept_response_hours := dept_response_hours / 2;
            dept_resolution_hours := CAST(dept_resolution_hours * 0.75 AS INTEGER);
        WHEN 'low' THEN
            dept_response_hours := CAST(dept_response_hours * 1.5 AS INTEGER);
            dept_resolution_hours := CAST(dept_resolution_hours * 1.5 AS INTEGER);
    END CASE;

    NEW.sla_response_deadline := NEW.created_at + (dept_response_hours || ' hours')::INTERVAL;
    NEW.sla_resolution_deadline := NEW.created_at + (dept_resolution_hours || ' hours')::INTERVAL;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función: Registrar cambio en historial
CREATE OR REPLACE FUNCTION log_ticket_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Status change
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO support_ticket_history (ticket_id, changed_by_id, changed_by_role, changed_by_name, action, field_changed, old_value, new_value)
        VALUES (NEW.id, COALESCE(NEW.assigned_to_id, NEW.requester_id), COALESCE(NEW.assigned_to_role, NEW.requester_role),
                COALESCE(NEW.assigned_to_name, NEW.requester_name), 'status_changed', 'status', OLD.status, NEW.status);
    END IF;

    -- Priority change
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
        INSERT INTO support_ticket_history (ticket_id, changed_by_id, changed_by_role, changed_by_name, action, field_changed, old_value, new_value)
        VALUES (NEW.id, COALESCE(NEW.assigned_to_id, NEW.requester_id), COALESCE(NEW.assigned_to_role, NEW.requester_role),
                COALESCE(NEW.assigned_to_name, NEW.requester_name), 'priority_changed', 'priority', OLD.priority, NEW.priority);
    END IF;

    -- Assignment change
    IF OLD.assigned_to_id IS DISTINCT FROM NEW.assigned_to_id THEN
        INSERT INTO support_ticket_history (ticket_id, changed_by_id, changed_by_role, changed_by_name, action, field_changed, old_value, new_value)
        VALUES (NEW.id, COALESCE(NEW.assigned_to_id, NEW.requester_id), COALESCE(NEW.assigned_to_role, NEW.requester_role),
                COALESCE(NEW.assigned_to_name, NEW.requester_name), 'assigned', 'assigned_to', OLD.assigned_to_name, NEW.assigned_to_name);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función: Verificar SLA compliance al resolver
CREATE OR REPLACE FUNCTION check_sla_compliance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.resolved_at IS NOT NULL AND OLD.resolved_at IS NULL THEN
        NEW.resolution_sla_met := (NEW.resolved_at <= NEW.sla_resolution_deadline);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función: Actualizar contador de categoría
CREATE OR REPLACE FUNCTION update_category_ticket_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE support_ticket_categories SET tickets_count = tickets_count + 1 WHERE id = NEW.category_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE support_ticket_categories SET tickets_count = tickets_count - 1 WHERE id = OLD.category_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.category_id != NEW.category_id THEN
        UPDATE support_ticket_categories SET tickets_count = tickets_count - 1 WHERE id = OLD.category_id;
        UPDATE support_ticket_categories SET tickets_count = tickets_count + 1 WHERE id = NEW.category_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función: Actualizar contadores de ticket
CREATE OR REPLACE FUNCTION update_ticket_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'support_ticket_comments' THEN
        UPDATE support_tickets SET total_comments = total_comments + 1 WHERE id = NEW.ticket_id;

        -- Si es el primer comentario y no es del requester, marcar first_response_at
        UPDATE support_tickets
        SET first_response_at = NEW.created_at,
            response_sla_met = (NEW.created_at <= sla_response_deadline)
        WHERE id = NEW.ticket_id
        AND first_response_at IS NULL
        AND NEW.author_id != requester_id;
    ELSIF TG_TABLE_NAME = 'support_ticket_attachments' THEN
        UPDATE support_tickets SET total_attachments = total_attachments + 1 WHERE id = NEW.ticket_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Updated at para tickets
CREATE TRIGGER trigger_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_support_updated_at();

-- Trigger: Updated at para departments
CREATE TRIGGER trigger_departments_updated_at
    BEFORE UPDATE ON support_departments
    FOR EACH ROW
    EXECUTE FUNCTION update_support_updated_at();

-- Trigger: Updated at para categories
CREATE TRIGGER trigger_categories_updated_at
    BEFORE UPDATE ON support_ticket_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_support_updated_at();

-- Trigger: Updated at para comments
CREATE TRIGGER trigger_comments_updated_at
    BEFORE UPDATE ON support_ticket_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_support_updated_at();

-- Trigger: Generar número de ticket
CREATE TRIGGER trigger_generate_ticket_number
    BEFORE INSERT ON support_tickets
    FOR EACH ROW
    WHEN (NEW.ticket_number IS NULL)
    EXECUTE FUNCTION generate_ticket_number();

-- Trigger: Calcular SLA deadlines
CREATE TRIGGER trigger_calculate_sla
    BEFORE INSERT ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION calculate_sla_deadlines();

-- Trigger: Log de cambios
CREATE TRIGGER trigger_log_ticket_changes
    AFTER UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION log_ticket_change();

-- Trigger: Verificar SLA compliance
CREATE TRIGGER trigger_check_sla_compliance
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION check_sla_compliance();

-- Trigger: Actualizar contador de categoría
CREATE TRIGGER trigger_update_category_count
    AFTER INSERT OR UPDATE OR DELETE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_category_ticket_count();

-- Trigger: Actualizar contadores de comentarios
CREATE TRIGGER trigger_update_comment_count
    AFTER INSERT ON support_ticket_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_counters();

-- Trigger: Actualizar contadores de attachments
CREATE TRIGGER trigger_update_attachment_count
    AFTER INSERT ON support_ticket_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_counters();

-- ============================================
-- RESUMEN DE ESTRUCTURAS CREADAS
-- ============================================
/**
 * TABLAS CREADAS: 9
 * - support_departments (Departamentos de soporte)
 * - support_ticket_categories (Categorías de tickets)
 * - support_tickets (Tickets principales)
 * - support_ticket_comments (Comentarios)
 * - support_ticket_attachments (Archivos adjuntos)
 * - support_ticket_history (Historial de cambios)
 * - support_ticket_watchers (Observadores)
 * - support_canned_responses (Respuestas predefinidas)
 *
 * VISTAS CREADAS: 3
 * - v_support_tickets_full
 * - v_support_department_stats
 * - v_support_agent_stats
 *
 * FUNCIONES CREADAS: 7
 * - update_support_updated_at()
 * - generate_ticket_number()
 * - calculate_sla_deadlines()
 * - log_ticket_change()
 * - check_sla_compliance()
 * - update_category_ticket_count()
 * - update_ticket_counters()
 *
 * TRIGGERS CREADOS: 11
 * - Actualización automática de updated_at (4 triggers)
 * - Generación de número de ticket
 * - Cálculo de SLA deadlines
 * - Log de cambios
 * - Verificación de SLA compliance
 * - Actualización de contadores (3 triggers)
 *
 * ÍNDICES CREADOS: 35+
 * - Búsqueda optimizada
 * - Full-text search
 * - SLA tracking
 * - Performance optimization
 */
