/**
 * SCRIPT SQL - PORTAL DE PADRES DE FAMILIA
 * BGE Héroes de la Patria
 * Fecha: 19 de Octubre, 2025
 *
 * DESCRIPCIÓN:
 * Sistema completo para gestión de portal de padres que incluye:
 * - Registro de padres/tutores
 * - Relación padres-estudiantes (1:N)
 * - Visualización de calificaciones
 * - Seguimiento de asistencia
 * - Historial de pagos
 * - Comunicación bidireccional
 */

-- ============================================
-- TABLA: parents (Padres/Tutores)
-- ============================================
CREATE TABLE IF NOT EXISTS parents (
    id SERIAL PRIMARY KEY,

    -- Información Personal
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100),
    nombre_completo VARCHAR(255) GENERATED ALWAYS AS (
        CONCAT(nombre, ' ', apellido_paterno, ' ', COALESCE(apellido_materno, ''))
    ),

    -- Datos de Contacto
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    telefono_emergencia VARCHAR(20),
    direccion TEXT,

    -- Autenticación
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),

    -- Relación con Estudiante
    parentesco VARCHAR(50) CHECK (parentesco IN ('padre', 'madre', 'tutor', 'abuelo', 'otro')),

    -- Estado
    activo BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- ============================================
-- TABLA: students (Estudiantes)
-- ============================================
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,

    -- Información Personal
    matricula VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100),
    nombre_completo VARCHAR(255) GENERATED ALWAYS AS (
        CONCAT(nombre, ' ', apellido_paterno, ' ', COALESCE(apellido_materno, ''))
    ),
    fecha_nacimiento DATE,

    -- Información Académica
    grado INTEGER CHECK (grado BETWEEN 1 AND 3),
    grupo VARCHAR(10),
    turno VARCHAR(20) CHECK (turno IN ('matutino', 'vespertino')),
    especialidad VARCHAR(100),

    -- Estado
    activo BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: parents_students (Relación N:N)
-- ============================================
CREATE TABLE IF NOT EXISTS parents_students (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,

    -- Tipo de relación
    tipo_relacion VARCHAR(50) NOT NULL CHECK (tipo_relacion IN ('padre', 'madre', 'tutor_legal', 'familiar', 'otro')),

    -- Permisos específicos
    ver_calificaciones BOOLEAN DEFAULT TRUE,
    ver_asistencia BOOLEAN DEFAULT TRUE,
    ver_pagos BOOLEAN DEFAULT TRUE,
    recibir_notificaciones BOOLEAN DEFAULT TRUE,

    -- Estado
    activo BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraint único: un padre no puede tener doble relación con mismo estudiante
    UNIQUE (parent_id, student_id)
);

-- ============================================
-- TABLA: grades (Calificaciones)
-- ============================================
CREATE TABLE IF NOT EXISTS grades (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,

    -- Información de la Materia
    materia VARCHAR(100) NOT NULL,
    profesor VARCHAR(255),

    -- Periodo Académico
    periodo VARCHAR(50) NOT NULL, -- 'parcial_1', 'parcial_2', 'final', etc.
    ciclo_escolar VARCHAR(20) NOT NULL, -- '2025-2026'

    -- Calificación
    calificacion DECIMAL(4,2) CHECK (calificacion >= 0 AND calificacion <= 10),
    calificacion_letra VARCHAR(2), -- 'MB', 'B', 'S', 'NA'

    -- Detalles
    faltas INTEGER DEFAULT 0,
    retardos INTEGER DEFAULT 0,
    observaciones TEXT,

    -- Visibilidad
    visible_padres BOOLEAN DEFAULT TRUE,
    fecha_publicacion TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Index para búsquedas rápidas
    CONSTRAINT unique_grade UNIQUE (student_id, materia, periodo, ciclo_escolar)
);

-- ============================================
-- TABLA: attendance (Asistencia)
-- ============================================
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,

    -- Fecha y Detalles
    fecha DATE NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('asistencia', 'falta', 'retardo', 'justificada')),

    -- Información Adicional
    materia VARCHAR(100), -- NULL = asistencia general del día
    hora TIME,

    -- Justificación
    justificada BOOLEAN DEFAULT FALSE,
    motivo_justificacion TEXT,
    documento_justificacion VARCHAR(255), -- URL del documento

    -- Notificación
    notificado_padres BOOLEAN DEFAULT FALSE,
    fecha_notificacion TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Index
    CONSTRAINT unique_attendance UNIQUE (student_id, fecha, materia)
);

-- ============================================
-- TABLA: payments (Pagos)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,

    -- Información del Pago
    concepto VARCHAR(255) NOT NULL,
    descripcion TEXT,
    monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),

    -- Estado
    estatus VARCHAR(50) NOT NULL CHECK (estatus IN ('pendiente', 'pagado', 'vencido', 'cancelado')),

    -- Fechas
    fecha_limite DATE NOT NULL,
    fecha_pago TIMESTAMP,

    -- Detalles de Pago
    metodo_pago VARCHAR(50), -- 'efectivo', 'transferencia', 'tarjeta'
    referencia VARCHAR(100),
    recibo_url VARCHAR(255),

    -- Periodo
    ciclo_escolar VARCHAR(20) NOT NULL,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: parent_notifications (Notificaciones)
-- ============================================
CREATE TABLE IF NOT EXISTS parent_notifications (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,

    -- Contenido
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('calificacion', 'asistencia', 'pago', 'aviso', 'evento', 'general')),
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,

    -- Prioridad
    prioridad VARCHAR(20) DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),

    -- Estado
    leida BOOLEAN DEFAULT FALSE,
    fecha_lectura TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP -- NULL = no expira
);

-- ============================================
-- TABLA: parent_messages (Mensajes Bidireccionales)
-- ============================================
CREATE TABLE IF NOT EXISTS parent_messages (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,

    -- Contenido
    asunto VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,

    -- Direccionalidad
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrante', 'saliente')), -- entrante: padre->escuela, saliente: escuela->padre
    destinatario VARCHAR(100), -- Departamento o profesor destinatario

    -- Estado
    leido BOOLEAN DEFAULT FALSE,
    respondido BOOLEAN DEFAULT FALSE,
    parent_message_id INTEGER REFERENCES parent_messages(id), -- Para hilos de conversación

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

-- Parents
CREATE INDEX IF NOT EXISTS idx_parents_email ON parents(email);
CREATE INDEX IF NOT EXISTS idx_parents_activo ON parents(activo) WHERE activo = TRUE;

-- Students
CREATE INDEX IF NOT EXISTS idx_students_matricula ON students(matricula);
CREATE INDEX IF NOT EXISTS idx_students_grado_grupo ON students(grado, grupo);
CREATE INDEX IF NOT EXISTS idx_students_activo ON students(activo) WHERE activo = TRUE;

-- Parents-Students Relationship
CREATE INDEX IF NOT EXISTS idx_parents_students_parent ON parents_students(parent_id);
CREATE INDEX IF NOT EXISTS idx_parents_students_student ON parents_students(student_id);
CREATE INDEX IF NOT EXISTS idx_parents_students_activo ON parents_students(activo) WHERE activo = TRUE;

-- Grades
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_periodo ON grades(periodo, ciclo_escolar);
CREATE INDEX IF NOT EXISTS idx_grades_visible ON grades(visible_padres) WHERE visible_padres = TRUE;

-- Attendance
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_fecha ON attendance(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_tipo ON attendance(tipo);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_estatus ON payments(estatus);
CREATE INDEX IF NOT EXISTS idx_payments_fecha_limite ON payments(fecha_limite);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_parent ON parent_notifications(parent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_leida ON parent_notifications(leida) WHERE leida = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON parent_notifications(created_at DESC);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_parent ON parent_messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_messages_tipo ON parent_messages(tipo);
CREATE INDEX IF NOT EXISTS idx_messages_leido ON parent_messages(leido) WHERE leido = FALSE;

-- ============================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_parents_updated_at ON parents;
CREATE TRIGGER update_parents_updated_at
    BEFORE UPDATE ON parents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF NOT EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_grades_updated_at ON grades;
CREATE TRIGGER update_grades_updated_at
    BEFORE UPDATE ON grades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Resumen de estudiantes por padre
CREATE OR REPLACE VIEW v_parent_students_summary AS
SELECT
    p.id as parent_id,
    p.nombre_completo as parent_name,
    p.email as parent_email,
    s.id as student_id,
    s.matricula,
    s.nombre_completo as student_name,
    s.grado,
    s.grupo,
    ps.tipo_relacion,
    ps.ver_calificaciones,
    ps.ver_asistencia,
    ps.ver_pagos
FROM parents p
INNER JOIN parents_students ps ON p.id = ps.parent_id
INNER JOIN students s ON ps.student_id = s.id
WHERE p.activo = TRUE AND s.activo = TRUE AND ps.activo = TRUE;

-- Vista: Estadísticas de asistencia por estudiante
CREATE OR REPLACE VIEW v_student_attendance_stats AS
SELECT
    student_id,
    DATE_TRUNC('month', fecha) as mes,
    COUNT(*) FILTER (WHERE tipo = 'asistencia') as asistencias,
    COUNT(*) FILTER (WHERE tipo = 'falta') as faltas,
    COUNT(*) FILTER (WHERE tipo = 'retardo') as retardos,
    COUNT(*) FILTER (WHERE tipo = 'justificada') as faltas_justificadas,
    ROUND(
        (COUNT(*) FILTER (WHERE tipo = 'asistencia')::DECIMAL /
         NULLIF(COUNT(*), 0) * 100),
        2
    ) as porcentaje_asistencia
FROM attendance
GROUP BY student_id, DATE_TRUNC('month', fecha);

-- Vista: Pagos pendientes por estudiante
CREATE OR REPLACE VIEW v_pending_payments AS
SELECT
    s.id as student_id,
    s.matricula,
    s.nombre_completo as student_name,
    p.id as payment_id,
    p.concepto,
    p.monto,
    p.fecha_limite,
    CASE
        WHEN p.fecha_limite < CURRENT_DATE THEN 'vencido'
        WHEN p.fecha_limite <= CURRENT_DATE + INTERVAL '7 days' THEN 'proximo_vencer'
        ELSE 'vigente'
    END as urgencia
FROM students s
INNER JOIN payments p ON s.id = p.student_id
WHERE p.estatus = 'pendiente'
ORDER BY p.fecha_limite ASC;

-- ============================================
-- DATOS DE EJEMPLO (Solo para desarrollo)
-- ============================================

/*
-- ============================================
-- DATOS DE EJEMPLO (Temporalmente deshabilitados para depuración)
-- ============================================

-- Insertar padre de ejemplo
INSERT INTO parents (nombre, apellido_paterno, apellido_materno, email, telefono, password_hash, parentesco, email_verified)
VALUES
('Juan', 'García', 'López', 'juan.garcia@example.com', '4421234567', '$2b$10$examplehash', 'padre', TRUE),
('María', 'Martínez', 'Pérez', 'maria.martinez@example.com', '4429876543', '$2b$10$examplehash2', 'madre', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insertar estudiante de ejemplo
INSERT INTO students (matricula, nombre, apellido_paterno, apellido_materno, fecha_nacimiento, grado, grupo, turno, especialidad)
VALUES
('2025001', 'Carlos', 'García', 'Martínez', '2008-05-15', 2, 'A', 'matutino', 'Químico-Biológicas')
ON CONFLICT (matricula) DO NOTHING;

-- Relacionar padre con estudiante
INSERT INTO parents_students (parent_id, student_id, tipo_relacion)
SELECT p.id, s.id, 'padre'
FROM parents p, students s
WHERE p.email = 'juan.garcia@example.com'
AND s.matricula = '2025001'
ON CONFLICT (parent_id, student_id) DO NOTHING;

-- Calificaciones de ejemplo
INSERT INTO grades (student_id, materia, profesor, periodo, ciclo_escolar, calificacion, calificacion_letra, visible_padres)
SELECT s.id, 'Matemáticas', 'Prof. Ana Rodríguez', 'parcial_1', '2025-2026', 9.5, 'MB', TRUE
FROM students s WHERE s.matricula = '2025001'
ON CONFLICT (student_id, materia, periodo, ciclo_escolar) DO NOTHING;

-- Asistencia de ejemplo
INSERT INTO attendance (student_id, fecha, tipo, justificada)
SELECT s.id, CURRENT_DATE - INTERVAL '1 day', 'asistencia', FALSE
FROM students s WHERE s.matricula = '2025001'
ON CONFLICT (student_id, fecha, materia) DO NOTHING;

-- Pago de ejemplo
INSERT INTO payments (student_id, concepto, descripcion, monto, estatus, fecha_limite, ciclo_escolar)
SELECT s.id, 'Colegiatura Octubre 2025', 'Pago mensual de colegiatura', 2500.00, 'pendiente', CURRENT_DATE + INTERVAL '10 days', '2025-2026'
FROM students s WHERE s.matricula = '2025001';
*/

COMMENT ON TABLE parents IS 'Registro de padres/tutores con acceso al portal';
COMMENT ON TABLE students IS 'Estudiantes del bachillerato';
COMMENT ON TABLE parents_students IS 'Relación N:N entre padres y estudiantes';
COMMENT ON TABLE grades IS 'Calificaciones de estudiantes por materia y periodo';
COMMENT ON TABLE attendance IS 'Registro de asistencia diaria';
COMMENT ON TABLE payments IS 'Historial de pagos y cuotas';
COMMENT ON TABLE parent_notifications IS 'Notificaciones para padres';
COMMENT ON TABLE parent_messages IS 'Sistema de mensajería bidireccional';
