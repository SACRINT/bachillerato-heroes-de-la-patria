-- ========================================
-- TABLA: pagos
-- Registro de pagos de estudiantes
-- ========================================
CREATE TABLE pagos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    estudiante_id BIGINT NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha_pago DATE NOT NULL,
    metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia', 'oxxo_pay') DEFAULT 'efectivo',
    referencia_pago VARCHAR(255) UNIQUE NULL,
    estatus ENUM('pendiente', 'pagado', 'reembolsado', 'cancelado') DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
    INDEX idx_estudiante_id (estudiante_id),
    INDEX idx_fecha_pago (fecha_pago),
    INDEX idx_estatus (estatus)
);

-- ========================================
-- VISTA: vista_estudiantes_padres
-- Relaciona padres con sus estudiantes
-- ========================================
CREATE VIEW vista_estudiantes_padres AS
SELECT
    p.id AS padre_id,
    p.nombre AS padre_nombre,
    p.apellido_paterno AS padre_apellido_paterno,
    p.apellido_materno AS padre_apellido_materno,
    p.email AS padre_email,
    e.id AS estudiante_id,
    e.matricula,
    e.nia,
    e.curp,
    e.nombre AS estudiante_nombre,
    e.apellido_paterno AS estudiante_apellido_paterno,
    e.apellido_materno AS estudiante_apellido_materno,
    e.semestre,
    e.generacion,
    e.estatus AS estudiante_estatus
FROM
    usuarios p
JOIN
    estudiantes e ON p.id = e.tutor_id
WHERE
    p.tipo_usuario = 'padre_familia';

-- ========================================
-- VISTA: vista_calificaciones_padres
-- Calificaciones visibles para padres
-- ========================================
CREATE VIEW vista_calificaciones_padres AS
SELECT
    vep.padre_id,
    vep.estudiante_id,
    vep.estudiante_nombre,
    vep.estudiante_apellido_paterno,
    vep.estudiante_apellido_materno,
    m.nombre AS materia_nombre,
    c.periodo,
    c.calificacion,
    c.fecha_captura,
    d.nombre AS docente_nombre,
    d.apellido_paterno AS docente_apellido_paterno
FROM
    vista_estudiantes_padres vep
JOIN
    calificaciones c ON vep.estudiante_id = c.estudiante_id
JOIN
    materias m ON c.materia_id = m.id
JOIN
    docentes doc ON c.docente_id = doc.id
JOIN
    usuarios d ON doc.usuario_id = d.id;

-- ========================================
-- VISTA: vista_asistencias_padres
-- Asistencias visibles para padres
-- ========================================
CREATE VIEW vista_asistencias_padres AS
SELECT
    vep.padre_id,
    vep.estudiante_id,
    vep.estudiante_nombre,
    vep.estudiante_apellido_paterno,
    vep.estudiante_apellido_materno,
    a.fecha,
    a.estatus,
    a.observaciones,
    g.nombre AS grupo_nombre,
    m.nombre AS materia_nombre
FROM
    vista_estudiantes_padres vep
JOIN
    asistencias a ON vep.estudiante_id = a.estudiante_id
JOIN
    grupos g ON a.grupo_id = g.id
JOIN
    materias m ON g.materia_id = m.id;

-- ========================================
-- VISTA: vista_pagos_padres
-- Pagos visibles para padres
-- ========================================
CREATE VIEW vista_pagos_padres AS
SELECT
    vep.padre_id,
    vep.estudiante_id,
    vep.estudiante_nombre,
    vep.estudiante_apellido_paterno,
    vep.estudiante_apellido_materno,
    p.concepto,
    p.monto,
    p.fecha_pago,
    p.metodo_pago,
    p.estatus
FROM
    vista_estudiantes_padres vep
JOIN
    pagos p ON vep.estudiante_id = p.estudiante_id;
