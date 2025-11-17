-- ============================================================================
-- AUDIT LOGS TABLE - Para tracking de eventos críticos
-- Semana 13 - Multi-Tenancy Enterprise
-- ============================================================================

-- Crear tabla audit_logs si no existe
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id UUID,
    tenant_id UUID,
    target_type VARCHAR(50),
    target_id UUID,
    changes JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    user_agent TEXT,
    severity VARCHAR(20) DEFAULT 'low',
    success BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);

-- Índice compuesto para queries por tenant + fecha
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created
    ON audit_logs(tenant_id, created_at DESC);

-- Índice GIN para búsqueda en metadata
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata_gin
    ON audit_logs USING GIN (metadata);

-- Comentarios de documentación
COMMENT ON TABLE audit_logs IS 'Registro de todos los eventos auditables del sistema';
COMMENT ON COLUMN audit_logs.event_type IS 'Tipo de evento (ej: user.login, user.deleted)';
COMMENT ON COLUMN audit_logs.changes IS 'Cambios realizados en formato JSON';
COMMENT ON COLUMN audit_logs.metadata IS 'Información adicional del evento';
COMMENT ON COLUMN audit_logs.severity IS 'Severidad: low, medium, high, critical';

-- ============================================================================
-- TENANTS TABLE (si no existe)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255) UNIQUE,
    plan VARCHAR(50) DEFAULT 'starter',
    status VARCHAR(20) DEFAULT 'active',
    config_json JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para tenants
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- Comentarios
COMMENT ON TABLE tenants IS 'Tabla de tenants para multi-tenancy';
COMMENT ON COLUMN tenants.subdomain IS 'Subdomain único (ej: school1)';
COMMENT ON COLUMN tenants.domain IS 'Domain completo opcional (ej: escuela.com)';
COMMENT ON COLUMN tenants.plan IS 'Plan de suscripción: starter, pro, enterprise';
COMMENT ON COLUMN tenants.status IS 'Estado: active, inactive, suspended';
COMMENT ON COLUMN tenants.config_json IS 'Configuración personalizada del tenant';

-- ============================================================================
-- AGREGAR tenant_id A TABLAS EXISTENTES (si no existe)
-- ============================================================================

-- NOTA: Solo ejecutar si tenant_id no existe en las tablas

-- Ejemplo para tabla estudiantes (repetir para todas las tablas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'estudiantes'
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE estudiantes ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        CREATE INDEX idx_estudiantes_tenant_id ON estudiantes(tenant_id);
    END IF;
END $$;

-- Repetir para otras tablas críticas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'usuarios'
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        CREATE INDEX idx_usuarios_tenant_id ON usuarios(tenant_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'docentes'
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE docentes ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        CREATE INDEX idx_docentes_tenant_id ON docentes(tenant_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'noticias'
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE noticias ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        CREATE INDEX idx_noticias_tenant_id ON noticias(tenant_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'calificaciones'
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE calificaciones ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        CREATE INDEX idx_calificaciones_tenant_id ON calificaciones(tenant_id);
    END IF;
END $$;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que audit_logs existe
SELECT 'audit_logs' AS table_name, COUNT(*) AS count FROM audit_logs;

-- Verificar que tenants existe
SELECT 'tenants' AS table_name, COUNT(*) AS count FROM tenants;

-- Ver todas las tablas con tenant_id
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE column_name = 'tenant_id'
AND table_schema = 'public'
ORDER BY table_name;

-- Ver todas las políticas RLS aplicadas
SELECT
    tablename,
    COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
