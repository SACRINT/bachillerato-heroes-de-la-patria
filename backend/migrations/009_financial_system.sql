-- Migration: Sistema Financiero Completo
-- Semana 31-35: Stripe, Colegiaturas, Servicios, IA Coins
-- 1. Tabla de Transacciones Financieras (General)
CREATE TABLE IF NOT EXISTS transacciones_financieras (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    -- inscripcion, colegiatura, servicio, ia_coins
    monto DECIMAL(10, 2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'MXN',
    -- Stripe IDs
    stripe_session_id VARCHAR(255) UNIQUE,
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    stripe_charge_id VARCHAR(255),
    -- OXXO
    oxxo_referencia VARCHAR(20),
    fecha_expiracion TIMESTAMP,
    -- Status
    status VARCHAR(50) DEFAULT 'pendiente',
    -- pendiente, procesando, completado, fallido, reembolsado
    motivo_fallo TEXT,
    fecha_reembolso TIMESTAMP,
    -- Recibo
    recibo_url TEXT,
    recibo_generado BOOLEAN DEFAULT false,
    -- Metadata
    metadata JSONB DEFAULT '{}',
    -- Timestamps
    fecha_pago TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_transacciones_tipo ON transacciones_financieras(tipo);
CREATE INDEX IF NOT EXISTS idx_transacciones_status ON transacciones_financieras(status);
CREATE INDEX IF NOT EXISTS idx_transacciones_stripe_session ON transacciones_financieras(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_stripe_intent ON transacciones_financieras(stripe_payment_intent_id);
-- 2. Tabla de Colegiaturas
CREATE TABLE IF NOT EXISTS colegiaturas (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    mes INTEGER NOT NULL,
    -- 1-12
    anio INTEGER NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    ciclo_escolar VARCHAR(20) NOT NULL,
    -- Status y pagos
    status VARCHAR(50) DEFAULT 'pendiente',
    -- pendiente, pagado, vencido, parcial, condonado
    monto_pagado DECIMAL(10, 2) DEFAULT 0,
    metodo_pago VARCHAR(50),
    referencia_pago VARCHAR(255),
    fecha_pago TIMESTAMP,
    -- Ajustes
    recargo_mora DECIMAL(10, 2) DEFAULT 0,
    descuento DECIMAL(10, 2) DEFAULT 0,
    motivo_descuento TEXT,
    motivo_condonacion TEXT,
    nota TEXT,
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(estudiante_id, mes, anio)
);
CREATE INDEX IF NOT EXISTS idx_colegiaturas_estudiante ON colegiaturas(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_colegiaturas_status ON colegiaturas(status);
CREATE INDEX IF NOT EXISTS idx_colegiaturas_fecha_venc ON colegiaturas(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_colegiaturas_ciclo ON colegiaturas(ciclo_escolar);
-- 3. Tabla de Servicios Escolares
CREATE TABLE IF NOT EXISTS servicios_escolares (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    -- unico, mensual, anual
    categoria VARCHAR(100),
    -- biblioteca, laboratorio, deportes, etc
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_servicios_activo ON servicios_escolares(activo);
CREATE INDEX IF NOT EXISTS idx_servicios_categoria ON servicios_escolares(categoria);
-- Insertar servicios por defecto
INSERT INTO servicios_escolares (
        nombre,
        descripcion,
        precio,
        tipo,
        categoria,
        orden
    )
VALUES (
        'Credencial Escolar',
        'Credencial de estudiante con foto',
        150,
        'unico',
        'administrativo',
        1
    ),
    (
        'Seguro Escolar',
        'Seguro de accidentes escolares',
        500,
        'anual',
        'seguros',
        2
    ),
    (
        'Biblioteca Digital',
        'Acceso a plataforma de libros digitales',
        200,
        'mensual',
        'biblioteca',
        3
    ),
    (
        'Laboratorio de Cómputo',
        'Acceso extendido a laboratorio',
        300,
        'mensual',
        'laboratorios',
        4
    ),
    (
        'Talleres Extraescolares',
        'Inscripción a talleres deportivos y artísticos',
        400,
        'mensual',
        'deportes',
        5
    ),
    (
        'Certificado de Estudios',
        'Certificado oficial',
        200,
        'unico',
        'administrativo',
        6
    ),
    (
        'Constancia de Estudios',
        'Constancia oficial',
        100,
        'unico',
        'administrativo',
        7
    ) ON CONFLICT DO NOTHING;
-- 4. Tabla de Pagos de Servicios
CREATE TABLE IF NOT EXISTS pagos_servicios (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    servicio_id INTEGER NOT NULL REFERENCES servicios_escolares(id),
    monto DECIMAL(10, 2) NOT NULL,
    metodo_pago VARCHAR(50),
    status VARCHAR(50) DEFAULT 'completado',
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nota TEXT
);
CREATE INDEX IF NOT EXISTS idx_pagos_servicios_estudiante ON pagos_servicios(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_pagos_servicios_servicio ON pagos_servicios(servicio_id);
-- 5. Tabla de IA Coins (Moneda Virtual)
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS ia_coins INTEGER DEFAULT 0;
CREATE TABLE IF NOT EXISTS ia_coins_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    -- compra, gasto, reembolso, bonus
    cantidad INTEGER NOT NULL,
    monto_mxn DECIMAL(10, 2) DEFAULT 0,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ia_coins_user ON ia_coins_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ia_coins_tipo ON ia_coins_transactions(tipo);
-- 6. Configuración de Colegiaturas
INSERT INTO configuracion_inscripciones (clave, valor, descripcion)
VALUES (
        'monto_colegiatura',
        '{"valor": 2500}',
        'Monto mensual de colegiatura en MXN'
    ),
    (
        'recargo_mora_porcentaje',
        '{"valor": 0.05}',
        'Porcentaje de recargo por mora (5%)'
    ),
    (
        'meses_colegiatura',
        '{"meses": [8,9,10,11,12,1,2,3,4,5,6]}',
        'Meses de pago (agosto a junio)'
    ) ON CONFLICT (clave) DO NOTHING;
-- 7. Triggers
DROP TRIGGER IF EXISTS update_transacciones_updated_at ON transacciones_financieras;
CREATE TRIGGER update_transacciones_updated_at BEFORE
UPDATE ON transacciones_financieras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_colegiaturas_updated_at ON colegiaturas;
CREATE TRIGGER update_colegiaturas_updated_at BEFORE
UPDATE ON colegiaturas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- 8. Vistas útiles
CREATE OR REPLACE VIEW vista_finanzas_dashboard AS
SELECT DATE_TRUNC('month', created_at) as mes,
    tipo,
    COUNT(*) as total_transacciones,
    SUM(
        CASE
            WHEN status = 'completado' THEN monto
            ELSE 0
        END
    ) as ingresos,
    AVG(
        CASE
            WHEN status = 'completado' THEN monto
        END
    ) as ticket_promedio
FROM transacciones_financieras
GROUP BY DATE_TRUNC('month', created_at),
    tipo;
CREATE OR REPLACE VIEW vista_colegiaturas_pendientes AS
SELECT c.*,
    e.matricula,
    e.nombre || ' ' || e.apellido_paterno as estudiante_nombre,
    u.email,
    CASE
        WHEN c.fecha_vencimiento < CURRENT_DATE THEN 'vencido'
        ELSE 'pendiente'
    END as status_real,
    c.monto + COALESCE(c.recargo_mora, 0) - COALESCE(c.descuento, 0) as monto_total
FROM colegiaturas c
    JOIN estudiantes e ON c.estudiante_id = e.id
    LEFT JOIN usuarios u ON e.usuario_id = u.id
WHERE c.status IN ('pendiente', 'vencido');
-- 9. Comentarios
COMMENT ON TABLE transacciones_financieras IS 'Registro unificado de todas las transacciones financieras';
COMMENT ON TABLE colegiaturas IS 'Colegiaturas mensuales de estudiantes';
COMMENT ON TABLE servicios_escolares IS 'Catálogo de servicios escolares adicionales';
COMMENT ON TABLE pagos_servicios IS 'Registro de pagos por servicios adicionales';
COMMENT ON TABLE ia_coins_transactions IS 'Historial de transacciones de moneda virtual IA Coins';
-- Fin de migración