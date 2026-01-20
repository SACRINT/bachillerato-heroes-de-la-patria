-- Migration: Modelo SaaS Multi-Tenant (Idempotente)
-- Semana 41-45: Onboarding, Suscripciones, Facturación, Super-Admin
-- 1. Agregar tenant_id a tablas existentes (si no existe)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'usuarios'
        AND column_name = 'tenant_id'
) THEN
ALTER TABLE usuarios
ADD COLUMN tenant_id INTEGER;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'estudiantes'
        AND column_name = 'tenant_id'
) THEN
ALTER TABLE estudiantes
ADD COLUMN tenant_id INTEGER;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'docentes'
        AND column_name = 'tenant_id'
) THEN
ALTER TABLE docentes
ADD COLUMN tenant_id INTEGER;
END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_usuarios_tenant ON usuarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_estudiantes_tenant ON estudiantes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_docentes_tenant ON docentes(tenant_id);
-- 2. Actualizar o crear tabla tenants
DO $$ BEGIN IF NOT EXISTS (
    SELECT
    FROM pg_tables
    WHERE tablename = 'tenants'
) THEN CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    nombre_escuela VARCHAR(255),
    slug VARCHAR(100),
    subdominio VARCHAR(100),
    email_admin VARCHAR(255),
    telefono VARCHAR(20),
    direccion TEXT,
    logo_url TEXT,
    color_primario VARCHAR(7),
    color_secundario VARCHAR(7),
    favicon_url TEXT,
    dominio_personalizado VARCHAR(255),
    max_estudiantes INTEGER DEFAULT 100,
    max_docentes INTEGER DEFAULT 20,
    max_storage_gb INTEGER DEFAULT 10,
    status VARCHAR(50) DEFAULT 'trial',
    suspension_reason TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio_trial TIMESTAMP,
    fecha_fin_trial TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
END IF;
-- Agregar columnas faltantes a tabla existente
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS slug VARCHAR(100);
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS subdominio VARCHAR(100);
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS color_primario VARCHAR(7);
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS color_secundario VARCHAR(7);
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS favicon_url TEXT;
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS dominio_personalizado VARCHAR(255);
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS max_storage_gb INTEGER DEFAULT 10;
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS fecha_inicio_trial TIMESTAMP;
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS fecha_fin_trial TIMESTAMP;
END $$;
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
-- 3. Planes de Suscripción
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_mensual DECIMAL(10, 2) NOT NULL,
    precio_anual DECIMAL(10, 2) NOT NULL,
    max_estudiantes INTEGER NOT NULL,
    max_docentes INTEGER NOT NULL,
    max_storage_gb INTEGER NOT NULL,
    features JSONB DEFAULT '[]',
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 4. Suscripciones
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    status VARCHAR(50) DEFAULT 'active',
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    auto_renovar BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON tenant_subscriptions(tenant_id);
-- 5. Métricas de Uso
CREATE TABLE IF NOT EXISTS usage_metrics (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    metric VARCHAR(100) NOT NULL,
    value INTEGER NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_usage_tenant ON usage_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_metric ON usage_metrics(metric);
-- 6. Facturas
CREATE TABLE IF NOT EXISTS tenant_invoices (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    subscription_id INTEGER,
    monto DECIMAL(10, 2) NOT NULL,
    concepto TEXT NOT NULL,
    fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento DATE NOT NULL,
    fecha_pago TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pendiente',
    metodo_pago VARCHAR(50),
    stripe_invoice_id VARCHAR(255),
    pdf_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON tenant_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON tenant_invoices(status);
-- 7. Audit Log
CREATE TABLE IF NOT EXISTS tenant_audit_log (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    usuario_id INTEGER,
    accion VARCHAR(100) NOT NULL,
    descripcion TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_tenant ON tenant_audit_log(tenant_id);
-- 8. Vistas (omitidas - pueden tener incompatibilidades con esquema existente)
-- Las vistas se pueden crear manualmente después si es necesario
-- 9. Funciones
CREATE OR REPLACE FUNCTION expire_trials() RETURNS INTEGER AS $$
DECLARE count INTEGER;
BEGIN
UPDATE tenants
SET status = 'suspended'
WHERE status = 'trial'
    AND fecha_fin_trial < CURRENT_TIMESTAMP;
GET DIAGNOSTICS count = ROW_COUNT;
RETURN count;
END;
$$ LANGUAGE plpgsql;
-- Fin de migración