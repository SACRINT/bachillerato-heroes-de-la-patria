-- ======================================================
-- 📊 AUDIT LOG TABLE MIGRATION
-- Tabla para registro de auditoría por tenant
-- Semana 5 - Multi-tenancy Avanzado - Tarea 11
-- ======================================================

-- Crear tabla audit_log
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    user_id UUID,
    event_type VARCHAR(100) NOT NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar queries
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_created ON audit_log(tenant_id, created_at);

-- Agregar constraint de foreign key (si tabla usuarios existe)
-- ALTER TABLE audit_log
-- ADD CONSTRAINT fk_audit_log_user
-- FOREIGN KEY (user_id) REFERENCES usuarios(uuid) ON DELETE SET NULL;

-- Agregar RLS a audit_log para aislamiento por tenant
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_log_tenant_isolation_select ON audit_log;
CREATE POLICY audit_log_tenant_isolation_select ON audit_log
    FOR SELECT
    USING (tenant_id = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS audit_log_tenant_isolation_insert ON audit_log;
CREATE POLICY audit_log_tenant_isolation_insert ON audit_log
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true));

-- Nota: No permitir UPDATE ni DELETE en audit_log (inmutabilidad)

-- Verificación
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'audit_log';
-- SELECT * FROM pg_policies WHERE tablename = 'audit_log';

-- COMENTARIO:
-- Esta tabla almacena todos los eventos de auditoría del sistema.
-- Los logs son inmutables (solo INSERT) y están aislados por tenant mediante RLS.
-- Recomendación: Archivar logs antiguos (>6 meses) a storage separado.
