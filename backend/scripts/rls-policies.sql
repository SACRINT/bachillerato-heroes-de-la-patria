-- ======================================================
-- 🔒 ROW-LEVEL SECURITY (RLS) POLICIES
-- Multi-tenancy: Aislamiento de datos por tenant
-- Semana 5 - Multi-tenancy Avanzado - Tarea 2
-- ======================================================

-- IMPORTANTE: Ejecutar este script DESPUÉS de tener la tabla 'tenants'
-- y haber agregado la columna 'tenant_id' a todas las tablas relevantes

-- ======================================================
-- 1. FUNCIÓN HELPER: Obtener tenant_id actual
-- ======================================================

-- Función que obtiene el tenant_id del contexto de la sesión
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS TEXT AS $$
BEGIN
    -- Intentar obtener de configuración de sesión
    BEGIN
        RETURN current_setting('app.current_tenant_id', true);
    EXCEPTION
        WHEN undefined_object THEN
            -- Si no está configurado, retornar 'default'
            RETURN 'default';
    END;
END;
$$ LANGUAGE plpgsql STABLE;

-- ======================================================
-- 2. AGREGAR COLUMNA tenant_id A TABLAS EXISTENTES
-- ======================================================

-- Usuarios
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';

CREATE INDEX IF NOT EXISTS idx_usuarios_tenant_id
ON usuarios(tenant_id);

-- Estudiantes
ALTER TABLE estudiantes
ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';

CREATE INDEX IF NOT EXISTS idx_estudiantes_tenant_id
ON estudiantes(tenant_id);

-- Calificaciones
ALTER TABLE calificaciones
ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';

CREATE INDEX IF NOT EXISTS idx_calificaciones_tenant_id
ON calificaciones(tenant_id);

-- Noticias
ALTER TABLE noticias
ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';

CREATE INDEX IF NOT EXISTS idx_noticias_tenant_id
ON noticias(tenant_id);

-- Citas
ALTER TABLE citas
ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';

CREATE INDEX IF NOT EXISTS idx_citas_tenant_id
ON citas(tenant_id);

-- Pending Approvals
ALTER TABLE pending_approvals
ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';

CREATE INDEX IF NOT EXISTS idx_pending_approvals_tenant_id
ON pending_approvals(tenant_id);

-- Suscriptores Notificaciones
ALTER TABLE suscriptores_notificaciones
ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';

CREATE INDEX IF NOT EXISTS idx_suscriptores_tenant_id
ON suscriptores_notificaciones(tenant_id);

-- ======================================================
-- 3. HABILITAR RLS EN TABLAS
-- ======================================================

-- Usuarios
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Estudiantes
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;

-- Calificaciones
ALTER TABLE calificaciones ENABLE ROW LEVEL SECURITY;

-- Noticias
ALTER TABLE noticias ENABLE ROW LEVEL SECURITY;

-- Citas
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

-- Pending Approvals
ALTER TABLE pending_approvals ENABLE ROW LEVEL SECURITY;

-- Suscriptores
ALTER TABLE suscriptores_notificaciones ENABLE ROW LEVEL SECURITY;

-- ======================================================
-- 4. CREAR POLÍTICAS RLS
-- ======================================================

-- ============ USUARIOS ============

-- SELECT: Solo ver usuarios del mismo tenant
DROP POLICY IF EXISTS usuarios_tenant_isolation_select ON usuarios;
CREATE POLICY usuarios_tenant_isolation_select ON usuarios
    FOR SELECT
    USING (tenant_id = current_tenant_id());

-- INSERT: Solo crear usuarios en su propio tenant
DROP POLICY IF EXISTS usuarios_tenant_isolation_insert ON usuarios;
CREATE POLICY usuarios_tenant_isolation_insert ON usuarios
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

-- UPDATE: Solo actualizar usuarios de su tenant
DROP POLICY IF EXISTS usuarios_tenant_isolation_update ON usuarios;
CREATE POLICY usuarios_tenant_isolation_update ON usuarios
    FOR UPDATE
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- DELETE: Solo eliminar usuarios de su tenant
DROP POLICY IF EXISTS usuarios_tenant_isolation_delete ON usuarios;
CREATE POLICY usuarios_tenant_isolation_delete ON usuarios
    FOR DELETE
    USING (tenant_id = current_tenant_id());

-- ============ ESTUDIANTES ============

DROP POLICY IF EXISTS estudiantes_tenant_isolation_select ON estudiantes;
CREATE POLICY estudiantes_tenant_isolation_select ON estudiantes
    FOR SELECT
    USING (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS estudiantes_tenant_isolation_insert ON estudiantes;
CREATE POLICY estudiantes_tenant_isolation_insert ON estudiantes
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS estudiantes_tenant_isolation_update ON estudiantes;
CREATE POLICY estudiantes_tenant_isolation_update ON estudiantes
    FOR UPDATE
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS estudiantes_tenant_isolation_delete ON estudiantes;
CREATE POLICY estudiantes_tenant_isolation_delete ON estudiantes
    FOR DELETE
    USING (tenant_id = current_tenant_id());

-- ============ CALIFICACIONES ============

DROP POLICY IF EXISTS calificaciones_tenant_isolation_select ON calificaciones;
CREATE POLICY calificaciones_tenant_isolation_select ON calificaciones
    FOR SELECT
    USING (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS calificaciones_tenant_isolation_insert ON calificaciones;
CREATE POLICY calificaciones_tenant_isolation_insert ON calificaciones
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS calificaciones_tenant_isolation_update ON calificaciones;
CREATE POLICY calificaciones_tenant_isolation_update ON calificaciones
    FOR UPDATE
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS calificaciones_tenant_isolation_delete ON calificaciones;
CREATE POLICY calificaciones_tenant_isolation_delete ON calificaciones
    FOR DELETE
    USING (tenant_id = current_tenant_id());

-- ============ NOTICIAS ============

DROP POLICY IF EXISTS noticias_tenant_isolation_select ON noticias;
CREATE POLICY noticias_tenant_isolation_select ON noticias
    FOR SELECT
    USING (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS noticias_tenant_isolation_insert ON noticias;
CREATE POLICY noticias_tenant_isolation_insert ON noticias
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS noticias_tenant_isolation_update ON noticias;
CREATE POLICY noticias_tenant_isolation_update ON noticias
    FOR UPDATE
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS noticias_tenant_isolation_delete ON noticias;
CREATE POLICY noticias_tenant_isolation_delete ON noticias
    FOR DELETE
    USING (tenant_id = current_tenant_id());

-- ============ CITAS ============

DROP POLICY IF EXISTS citas_tenant_isolation_select ON citas;
CREATE POLICY citas_tenant_isolation_select ON citas
    FOR SELECT
    USING (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS citas_tenant_isolation_insert ON citas;
CREATE POLICY citas_tenant_isolation_insert ON citas
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS citas_tenant_isolation_update ON citas;
CREATE POLICY citas_tenant_isolation_update ON citas
    FOR UPDATE
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS citas_tenant_isolation_delete ON citas;
CREATE POLICY citas_tenant_isolation_delete ON citas
    FOR DELETE
    USING (tenant_id = current_tenant_id());

-- ============ PENDING APPROVALS ============

DROP POLICY IF EXISTS pending_approvals_tenant_isolation_select ON pending_approvals;
CREATE POLICY pending_approvals_tenant_isolation_select ON pending_approvals
    FOR SELECT
    USING (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS pending_approvals_tenant_isolation_insert ON pending_approvals;
CREATE POLICY pending_approvals_tenant_isolation_insert ON pending_approvals
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS pending_approvals_tenant_isolation_update ON pending_approvals;
CREATE POLICY pending_approvals_tenant_isolation_update ON pending_approvals
    FOR UPDATE
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS pending_approvals_tenant_isolation_delete ON pending_approvals;
CREATE POLICY pending_approvals_tenant_isolation_delete ON pending_approvals
    FOR DELETE
    USING (tenant_id = current_tenant_id());

-- ============ SUSCRIPTORES NOTIFICACIONES ============

DROP POLICY IF EXISTS suscriptores_tenant_isolation_select ON suscriptores_notificaciones;
CREATE POLICY suscriptores_tenant_isolation_select ON suscriptores_notificaciones
    FOR SELECT
    USING (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS suscriptores_tenant_isolation_insert ON suscriptores_notificaciones;
CREATE POLICY suscriptores_tenant_isolation_insert ON suscriptores_notificaciones
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS suscriptores_tenant_isolation_update ON suscriptores_notificaciones;
CREATE POLICY suscriptores_tenant_isolation_update ON suscriptores_notificaciones
    FOR UPDATE
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS suscriptores_tenant_isolation_delete ON suscriptores_notificaciones;
CREATE POLICY suscriptores_tenant_isolation_delete ON suscriptores_notificaciones
    FOR DELETE
    USING (tenant_id = current_tenant_id());

-- ======================================================
-- 5. CREAR TABLA TENANTS (SI NO EXISTE)
-- ======================================================

CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    dominio VARCHAR(255) UNIQUE,
    status VARCHAR(50) DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo', 'suspendido')),
    config_json JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para tenant
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_dominio ON tenants(dominio);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- ======================================================
-- 6. INSERTAR TENANT DEFAULT (SI NO EXISTE)
-- ======================================================

INSERT INTO tenants (id, nombre, subdomain, dominio, status, config_json)
VALUES (
    'default',
    'BGE Héroes de la Patria',
    'default',
    'localhost',
    'activo',
    '{"school_name": "BGE Héroes de la Patria", "school_short_name": "BGE", "school_type": "Bachillerato General por Competencias", "colors": {"primary": "#1e40af", "secondary": "#dc2626"}}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ======================================================
-- 7. ACTUALIZAR DATOS EXISTENTES CON tenant_id='default'
-- ======================================================

-- Solo actualizar registros que NO tienen tenant_id o tienen NULL
UPDATE usuarios SET tenant_id = 'default' WHERE tenant_id IS NULL OR tenant_id = '';
UPDATE estudiantes SET tenant_id = 'default' WHERE tenant_id IS NULL OR tenant_id = '';
UPDATE calificaciones SET tenant_id = 'default' WHERE tenant_id IS NULL OR tenant_id = '';
UPDATE noticias SET tenant_id = 'default' WHERE tenant_id IS NULL OR tenant_id = '';
UPDATE citas SET tenant_id = 'default' WHERE tenant_id IS NULL OR tenant_id = '';
UPDATE pending_approvals SET tenant_id = 'default' WHERE tenant_id IS NULL OR tenant_id = '';
UPDATE suscriptores_notificaciones SET tenant_id = 'default' WHERE tenant_id IS NULL OR tenant_id = '';

-- ======================================================
-- 8. VERIFICACIÓN DE RLS
-- ======================================================

-- Queries de verificación (comentadas, descomentar para testing):

-- Verificar que RLS está habilitado
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('usuarios', 'estudiantes', 'calificaciones', 'noticias', 'citas', 'pending_approvals', 'suscriptores_notificaciones');

-- Ver políticas creadas
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- Testing de aislamiento (descomentar para probar):
-- SET app.current_tenant_id = 'tenant1';
-- SELECT * FROM estudiantes; -- Solo debe mostrar estudiantes de tenant1

-- SET app.current_tenant_id = 'default';
-- SELECT * FROM estudiantes; -- Solo debe mostrar estudiantes de default

-- ======================================================
-- FIN DEL SCRIPT
-- ======================================================

-- NOTAS IMPORTANTES:
-- 1. Este script es IDEMPOTENTE (se puede ejecutar múltiples veces sin problemas)
-- 2. Las políticas RLS solo afectan a usuarios normales, NO a superusers de PostgreSQL
-- 3. Para testing, crear tenants adicionales con:
--    INSERT INTO tenants (id, nombre, subdomain, dominio, status) VALUES ('tenant1', 'Escuela 1', 'tenant1', 'tenant1.bge.edu.mx', 'activo');
-- 4. Para deshabilitar RLS temporalmente (solo para debugging):
--    ALTER TABLE tabla_name DISABLE ROW LEVEL SECURITY;
-- 5. En producción, NUNCA usar cuenta de superuser, usar roles con permisos limitados

-- Documentación: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
