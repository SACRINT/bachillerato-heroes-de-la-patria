-- ========================================
-- CREACIÓN DE TABLAS FINANCIERAS
-- BGE Héroes de la Patria - Neon Database
-- Fecha: 3 de Noviembre 2025
-- ========================================

-- 1. TABLA: ingresos
-- Registra todos los ingresos económicos de la institución
CREATE TABLE IF NOT EXISTS ingresos (
    id SERIAL PRIMARY KEY,
    concepto VARCHAR(200) NOT NULL,
    descripcion TEXT,
    monto DECIMAL(12, 2) NOT NULL,
    categoria VARCHAR(100),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    periodo_fiscal VARCHAR(20),
    responsable VARCHAR(200),
    numero_comprobante VARCHAR(50),
    referencia VARCHAR(200),
    estado VARCHAR(50) DEFAULT 'registrado',
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA: gastos
-- Registra todos los gastos e egresos de la institución
CREATE TABLE IF NOT EXISTS gastos (
    id SERIAL PRIMARY KEY,
    concepto VARCHAR(200) NOT NULL,
    descripcion TEXT,
    monto DECIMAL(12, 2) NOT NULL,
    categoria VARCHAR(100),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    periodo_fiscal VARCHAR(20),
    responsable VARCHAR(200),
    numero_comprobante VARCHAR(50),
    referencia VARCHAR(200),
    estado VARCHAR(50) DEFAULT 'registrado',
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLA: pagos_pendientes
-- Registra los pagos pendientes de estudiantes
CREATE TABLE IF NOT EXISTS pagos_pendientes (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER,
    estudiante VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    monto DECIMAL(12, 2) NOT NULL,
    concepto VARCHAR(200) NOT NULL,
    periodo VARCHAR(50),
    fecha_vencimiento DATE NOT NULL,
    fecha_recordatorio DATE,
    estado VARCHAR(50) DEFAULT 'pendiente',
    numero_pago VARCHAR(50),
    intentos_cobro INTEGER DEFAULT 0,
    fecha_ultimo_intento DATE,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLA: pending_approvals
-- Registra solicitudes pendientes de aprobación
CREATE TABLE IF NOT EXISTS pending_approvals (
    id SERIAL PRIMARY KEY,
    form_type VARCHAR(100) NOT NULL,
    submission_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by VARCHAR(200),
    review_date TIMESTAMP,
    review_comments TEXT,
    priority VARCHAR(20) DEFAULT 'normal'
);

-- ========================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ========================================

-- Índices para tabla ingresos
CREATE INDEX IF NOT EXISTS idx_ingresos_fecha ON ingresos(fecha);
CREATE INDEX IF NOT EXISTS idx_ingresos_categoria ON ingresos(categoria);
CREATE INDEX IF NOT EXISTS idx_ingresos_periodo ON ingresos(periodo_fiscal);
CREATE INDEX IF NOT EXISTS idx_ingresos_estado ON ingresos(estado);

-- Índices para tabla gastos
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos(categoria);
CREATE INDEX IF NOT EXISTS idx_gastos_periodo ON gastos(periodo_fiscal);
CREATE INDEX IF NOT EXISTS idx_gastos_estado ON gastos(estado);

-- Índices para tabla pagos_pendientes
CREATE INDEX IF NOT EXISTS idx_pagos_estudiante ON pagos_pendientes(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON pagos_pendientes(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_vencimiento ON pagos_pendientes(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_pagos_periodo ON pagos_pendientes(periodo);

-- Índices para tabla pending_approvals
CREATE INDEX IF NOT EXISTS idx_approvals_status ON pending_approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_form_type ON pending_approvals(form_type);
CREATE INDEX IF NOT EXISTS idx_approvals_created ON pending_approvals(created_at);

-- ========================================
-- INSERCIÓN DE DATOS DEMO
-- ========================================

-- Datos demo para ingresos
INSERT INTO ingresos (concepto, descripcion, monto, categoria, fecha, periodo_fiscal, estado)
VALUES
    ('Colegiaturas Septiembre', 'Cobro de colegiaturas mes de septiembre', 45000.00, 'Colegiaturas', '2025-09-30', '2025', 'registrado'),
    ('Cuota de Inscripción', 'Cuota de inscripción estudiantes nuevos', 8500.00, 'Inscripciones', '2025-10-01', '2025', 'registrado'),
    ('Servicios Complementarios', 'Ingresos por servicios escolares', 3500.00, 'Servicios', '2025-10-15', '2025', 'registrado')
ON CONFLICT DO NOTHING;

-- Datos demo para gastos
INSERT INTO gastos (concepto, descripcion, monto, categoria, fecha, periodo_fiscal, estado)
VALUES
    ('Salarios Personal', 'Nómina docentes y administrativos septiembre', 32000.00, 'Personal', '2025-09-30', '2025', 'registrado'),
    ('Servicios Utilities', 'Pago de electricidad, agua e internet', 2500.00, 'Servicios', '2025-10-05', '2025', 'registrado'),
    ('Material Didáctico', 'Compra de material para aulas', 1200.00, 'Materiales', '2025-10-10', '2025', 'registrado')
ON CONFLICT DO NOTHING;

-- Datos demo para pagos pendientes
INSERT INTO pagos_pendientes (estudiante, email, monto, concepto, periodo, fecha_vencimiento, estado)
VALUES
    ('Carlos López García', 'carlos@example.com', 1500.00, 'Colegiatura Octubre', '2025-10', '2025-10-15', 'pendiente'),
    ('María Rodríguez López', 'maria@example.com', 2000.00, 'Colegiatura Septiembre', '2025-09', '2025-09-30', 'vencida')
ON CONFLICT DO NOTHING;

-- Datos demo para pending_approvals
INSERT INTO pending_approvals (form_type, submission_data, status, priority)
VALUES
    ('new_student_registration', '{"name": "Juan Pérez", "email": "juan@example.com", "grade": "1A"}', 'pending', 'normal'),
    ('teacher_application', '{"name": "Dr. Luis García", "subject": "Matemáticas", "experience": "5 años"}', 'pending', 'normal')
ON CONFLICT DO NOTHING;

-- ========================================
-- CONFIRMAR CREACIÓN
-- ========================================
\dt ingresos
\dt gastos
\dt pagos_pendientes
\dt pending_approvals
