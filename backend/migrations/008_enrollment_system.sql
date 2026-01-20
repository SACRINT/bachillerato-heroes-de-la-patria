-- Migration: Sistema de Inscripciones
-- Semana 26-30: Pre-registro, documentos, citas, pagos y matrícula
-- 1. Tabla de Solicitudes de Inscripción
CREATE TABLE IF NOT EXISTS solicitudes_inscripcion (
    id SERIAL PRIMARY KEY,
    tipo_inscripcion VARCHAR(50) NOT NULL,
    -- nuevo_ingreso, reingreso, cambio_escuela
    ciclo_escolar VARCHAR(20) NOT NULL,
    -- Datos personales
    nombres VARCHAR(255) NOT NULL,
    apellido_paterno VARCHAR(255) NOT NULL,
    apellido_materno VARCHAR(255),
    fecha_nacimiento DATE NOT NULL,
    curp VARCHAR(18) NOT NULL UNIQUE,
    genero VARCHAR(20) NOT NULL,
    nacionalidad VARCHAR(100) DEFAULT 'Mexicana',
    -- Contacto
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    telefono_emergencia VARCHAR(20),
    -- Dirección
    calle VARCHAR(255) NOT NULL,
    numero_exterior VARCHAR(10) NOT NULL,
    numero_interior VARCHAR(10),
    colonia VARCHAR(255) NOT NULL,
    municipio VARCHAR(255) NOT NULL,
    estado VARCHAR(255) NOT NULL,
    codigo_postal VARCHAR(10) NOT NULL,
    -- Académico
    escuela_procedencia VARCHAR(500) NOT NULL,
    promedio_previo DECIMAL(4, 2) NOT NULL,
    semestre_solicita INTEGER DEFAULT 1,
    -- Tutor
    tutor_nombre VARCHAR(255) NOT NULL,
    tutor_apellido_paterno VARCHAR(255) NOT NULL,
    tutor_apellido_materno VARCHAR(255),
    tutor_parentesco VARCHAR(50) NOT NULL,
    tutor_telefono VARCHAR(20) NOT NULL,
    tutor_email VARCHAR(255) NOT NULL,
    tutor_curp VARCHAR(18) NOT NULL,
    -- Documentos
    documentos JSONB DEFAULT '{}',
    -- Status del proceso
    status VARCHAR(50) DEFAULT 'borrador',
    -- borrador, pendiente_revision, documentos_incompletos, aprobado, rechazado, inscrito
    motivo_rechazo TEXT,
    -- Pago
    pago_realizado BOOLEAN DEFAULT false,
    pago_monto DECIMAL(10, 2),
    pago_referencia VARCHAR(255),
    pago_metodo VARCHAR(50),
    pago_fecha TIMESTAMP,
    -- Cita
    cita_id INTEGER,
    cita_fecha TIMESTAMP,
    cita_completada BOOLEAN DEFAULT false,
    fecha_cita_completada TIMESTAMP,
    -- Matrícula
    matricula VARCHAR(20) UNIQUE,
    fecha_asignacion_matricula TIMESTAMP,
    -- Carta de aceptación
    carta_generada BOOLEAN DEFAULT false,
    carta_url TEXT,
    carta_fecha TIMESTAMP,
    -- Workflow
    fecha_envio TIMESTAMP,
    fecha_aprobacion TIMESTAMP,
    fecha_rechazo TIMESTAMP,
    aprobado_por INTEGER REFERENCES usuarios(id),
    rechazado_por INTEGER REFERENCES usuarios(id),
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_solicitudes_status ON solicitudes_inscripcion(status);
CREATE INDEX IF NOT EXISTS idx_solicitudes_ciclo ON solicitudes_inscripcion(ciclo_escolar);
CREATE INDEX IF NOT EXISTS idx_solicitudes_curp ON solicitudes_inscripcion(curp);
CREATE INDEX IF NOT EXISTS idx_solicitudes_email ON solicitudes_inscripcion(email);
CREATE INDEX IF NOT EXISTS idx_solicitudes_matricula ON solicitudes_inscripcion(matricula)
WHERE matricula IS NOT NULL;
-- 2. Tabla de Documentos de Inscripción
CREATE TABLE IF NOT EXISTS documentos_inscripcion (
    id SERIAL PRIMARY KEY,
    solicitud_id INTEGER NOT NULL REFERENCES solicitudes_inscripcion(id) ON DELETE CASCADE,
    tipo_documento VARCHAR(100) NOT NULL,
    -- acta_nacimiento, curp_archivo, certificado_secundaria, etc.
    nombre_archivo VARCHAR(500) NOT NULL,
    url TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    tamano_bytes BIGINT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_documentos_solicitud ON documentos_inscripcion(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON documentos_inscripcion(tipo_documento);
-- 3. Tabla de Pagos de Inscripción
CREATE TABLE IF NOT EXISTS pagos_inscripcion (
    id SERIAL PRIMARY KEY,
    solicitud_id INTEGER NOT NULL REFERENCES solicitudes_inscripcion(id) ON DELETE CASCADE,
    monto DECIMAL(10, 2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'MXN',
    metodo_pago VARCHAR(50) NOT NULL,
    -- tarjeta, oxxo, transferencia, efectivo
    status VARCHAR(50) DEFAULT 'pendiente',
    -- pendiente, procesando, completado, fallido, reembolsado
    -- Stripe
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    stripe_charge_id VARCHAR(255),
    -- OXXO
    oxxo_referencia VARCHAR(20),
    fecha_expiracion TIMESTAMP,
    -- Recibo
    recibo_url TEXT,
    recibo_generado BOOLEAN DEFAULT false,
    -- Reembolso
    motivo_reembolso TEXT,
    fecha_reembolso TIMESTAMP,
    -- Timestamps
    fecha_pago TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motivo_fallo TEXT
);
CREATE INDEX IF NOT EXISTS idx_pagos_solicitud ON pagos_inscripcion(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_pagos_status ON pagos_inscripcion(status);
CREATE INDEX IF NOT EXISTS idx_pagos_stripe ON pagos_inscripcion(stripe_payment_intent_id)
WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pagos_oxxo ON pagos_inscripcion(oxxo_referencia)
WHERE oxxo_referencia IS NOT NULL;
-- 4. Tabla de Configuración de Inscripción
CREATE TABLE IF NOT EXISTS configuracion_inscripciones (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor JSONB NOT NULL,
    descripcion TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Insertar configuraciones por defecto
INSERT INTO configuracion_inscripciones (clave, valor, descripcion)
VALUES (
        'pago_inscripcion_monto',
        '{"valor": 3000}',
        'Monto de pago de inscripción en MXN'
    ),
    (
        'documentos_requeridos',
        '{"documentos": ["acta_nacimiento", "curp_archivo", "certificado_secundaria", "comprobante_domicilio", "ine_tutor", "fotos"]}',
        'Lista de documentos requeridos'
    ),
    (
        'promedio_minimo',
        '{"valor": 7.0}',
        'Promedio mínimo requerido para aceptación'
    ),
    (
        'periodos_inscripcion',
        '{"periodos": [{"inicio": "2026-01-01", "fin": "2026-03-31", "ciclo": "2026-2027"}]}',
        'Periodos activos de inscripción'
    ),
    (
        'cupo_maximo',
        '{"primer_semestre": 150, "tercero": 50, "quinto": 30}',
        'Cupos máximos por semestre'
    ) ON CONFLICT (clave) DO NOTHING;
-- 5. Triggers
DROP TRIGGER IF EXISTS update_solicitudes_updated_at ON solicitudes_inscripcion;
CREATE TRIGGER update_solicitudes_updated_at BEFORE
UPDATE ON solicitudes_inscripcion FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_pagos_updated_at ON pagos_inscripcion;
CREATE TRIGGER update_pagos_updated_at BEFORE
UPDATE ON pagos_inscripcion FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- 6. Vistas útiles
CREATE OR REPLACE VIEW vista_solicitudes_dashboard AS
SELECT s.id,
    s.nombres || ' ' || s.apellido_paterno || ' ' || COALESCE(s.apellido_materno, '') as nombre_completo,
    s.curp,
    s.email,
    s.telefono,
    s.tipo_inscripcion,
    s.ciclo_escolar,
    s.semestre_solicita,
    s.promedio_previo,
    s.status,
    s.pago_realizado,
    s.cita_completada,
    s.matricula,
    s.created_at,
    CASE
        WHEN s.status = 'inscrito' THEN 'Proceso completado'
        WHEN s.status = 'aprobado'
        AND s.pago_realizado
        AND s.cita_completada THEN 'Listo para inscribir'
        WHEN s.status = 'aprobado'
        AND s.pago_realizado THEN 'Pendiente de cita'
        WHEN s.status = 'aprobado' THEN 'Pendiente de pago'
        WHEN s.status = 'pendiente_revision' THEN 'En revisión'
        WHEN s.status = 'rechazado' THEN 'Rechazado'
        ELSE 'Pendiente'
    END as status_proceso
FROM solicitudes_inscripcion s
WHERE s.deleted_at IS NULL;
CREATE OR REPLACE VIEW vista_pagos_pendientes AS
SELECT p.id,
    p.solicitud_id,
    s.nombres || ' ' || s.apellido_paterno as nombre_completo,
    p.monto,
    p.metodo_pago,
    p.oxxo_referencia,
    p.fecha_expiracion,
    p.created_at
FROM pagos_inscripcion p
    JOIN solicitudes_inscripcion s ON p.solicitud_id = s.id
WHERE p.status = 'pendiente'
ORDER BY p.created_at DESC;
-- 7. Secuencia para matrícula
CREATE SEQUENCE IF NOT EXISTS matricula_seq START 1;
-- 8. Función para generar matrícula automática
CREATE OR REPLACE FUNCTION generar_matricula(p_tipo_inscripcion VARCHAR, p_year INTEGER) RETURNS VARCHAR AS $$
DECLARE v_tipo_codigo CHAR(1);
v_consecutivo INTEGER;
v_matricula VARCHAR(20);
BEGIN -- Determinar código de tipo
v_tipo_codigo := CASE
    p_tipo_inscripcion
    WHEN 'nuevo_ingreso' THEN 'N'
    WHEN 'reingreso' THEN 'R'
    WHEN 'cambio_escuela' THEN 'C'
    ELSE 'N'
END;
-- Obtener siguiente consecutivo
SELECT COALESCE(
        MAX(
            CAST(
                SUBSTRING(
                    matricula
                    FROM 6
                ) AS INTEGER
            )
        ),
        0
    ) + 1 INTO v_consecutivo
FROM solicitudes_inscripcion
WHERE matricula LIKE p_year || v_tipo_codigo || '%';
-- Generar matrícula: AÑO + TIPO + CONSECUTIVO
v_matricula := p_year || v_tipo_codigo || LPAD(v_consecutivo::TEXT, 4, '0');
RETURN v_matricula;
END;
$$ LANGUAGE plpgsql;
-- 9. Comentarios
COMMENT ON TABLE solicitudes_inscripcion IS 'Solicitudes de inscripción de aspirantes';
COMMENT ON TABLE documentos_inscripcion IS 'Documentos digitalizados de cada solicitud';
COMMENT ON TABLE pagos_inscripcion IS 'Registro de pagos con integración Stripe/OXXO';
COMMENT ON TABLE configuracion_inscripciones IS 'Configuración del sistema de inscripciones';
COMMENT ON COLUMN solicitudes_inscripcion.status IS 'Status: borrador, pendiente_revision, documentos_incompletos, aprobado, rechazado, inscrito';
COMMENT ON COLUMN pagos_inscripcion.metodo_pago IS 'Métodos: tarjeta, oxxo, transferencia, efectivo';
COMMENT ON COLUMN pagos_inscripcion.status IS 'Status: pendiente, procesando, completado, fallido, reembolsado';
-- Fin de migración