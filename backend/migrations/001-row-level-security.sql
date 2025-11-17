-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES - MULTI-TENANCY ISOLATION
-- Semana 13 - Enterprise Multi-Tenancy
-- ============================================================================

-- Nota: Este script asume que la columna tenant_id ya existe en todas las tablas
-- Si no existe, ejecutar primero: ALTER TABLE tabla ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- ============================================================================
-- FUNCIONES HELPER
-- ============================================================================

-- Función para obtener el tenant_id actual desde la sesión PostgreSQL
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
    SELECT NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID;
$$ LANGUAGE SQL STABLE;

-- Función para verificar si el usuario es super-admin
CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
    SELECT COALESCE(current_setting('app.is_super_admin', TRUE)::BOOLEAN, FALSE);
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- TABLA: estudiantes
-- ============================================================================

-- Habilitar RLS
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;

-- Política de lectura: Solo ver estudiantes de tu tenant (o todos si eres super-admin)
CREATE POLICY estudiantes_tenant_isolation ON estudiantes
    FOR SELECT
    USING (
        is_super_admin() OR tenant_id = current_tenant_id()
    );

-- Política de inserción: Solo insertar en tu tenant
CREATE POLICY estudiantes_tenant_insert ON estudiantes
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

-- Política de actualización: Solo actualizar estudiantes de tu tenant
CREATE POLICY estudiantes_tenant_update ON estudiantes
    FOR UPDATE
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Política de eliminación: Solo eliminar estudiantes de tu tenant
CREATE POLICY estudiantes_tenant_delete ON estudiantes
    FOR DELETE
    USING (tenant_id = current_tenant_id());

-- ============================================================================
-- TABLA: usuarios
-- ============================================================================

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY usuarios_tenant_isolation ON usuarios
    FOR SELECT
    USING (
        is_super_admin() OR tenant_id = current_tenant_id()
    );

CREATE POLICY usuarios_tenant_insert ON usuarios
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY usuarios_tenant_update ON usuarios
    FOR UPDATE
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY usuarios_tenant_delete ON usuarios
    FOR DELETE
    USING (tenant_id = current_tenant_id());

-- ============================================================================
-- TABLA: docentes
-- ============================================================================

ALTER TABLE docentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY docentes_tenant_isolation ON docentes
    FOR SELECT
    USING (
        is_super_admin() OR tenant_id = current_tenant_id()
    );

CREATE POLICY docentes_tenant_insert ON docentes
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY docentes_tenant_update ON docentes
    FOR UPDATE
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY docentes_tenant_delete ON docentes
    FOR DELETE
    USING (tenant_id = current_tenant_id());

-- ============================================================================
-- TABLA: noticias
-- ============================================================================

ALTER TABLE noticias ENABLE ROW LEVEL SECURITY;

CREATE POLICY noticias_tenant_isolation ON noticias
    FOR SELECT
    USING (
        is_super_admin() OR tenant_id = current_tenant_id()
    );

CREATE POLICY noticias_tenant_insert ON noticias
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY noticias_tenant_update ON noticias
    FOR UPDATE
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY noticias_tenant_delete ON noticias
    FOR DELETE
    USING (tenant_id = current_tenant_id());

-- ============================================================================
-- TABLA: calificaciones
-- ============================================================================

ALTER TABLE calificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY calificaciones_tenant_isolation ON calificaciones
    FOR SELECT
    USING (
        is_super_admin() OR tenant_id = current_tenant_id()
    );

CREATE POLICY calificaciones_tenant_insert ON calificaciones
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY calificaciones_tenant_update ON calificaciones
    FOR UPDATE
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY calificaciones_tenant_delete ON calificaciones
    FOR DELETE
    USING (tenant_id = current_tenant_id());

-- ============================================================================
-- TABLA: asistencias
-- ============================================================================

ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY asistencias_tenant_isolation ON asistencias
    FOR SELECT
    USING (
        is_super_admin() OR tenant_id = current_tenant_id()
    );

CREATE POLICY asistencias_tenant_insert ON asistencias
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY asistencias_tenant_update ON asistencias
    FOR UPDATE
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY asistencias_tenant_delete ON asistencias
    FOR DELETE
    USING (tenant_id = current_tenant_id());

-- ============================================================================
-- TABLA: eventos
-- ============================================================================

ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY eventos_tenant_isolation ON eventos
    FOR SELECT
    USING (
        is_super_admin() OR tenant_id = current_tenant_id()
    );

CREATE POLICY eventos_tenant_insert ON eventos
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY eventos_tenant_update ON eventos
    FOR UPDATE
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY eventos_tenant_delete ON eventos
    FOR DELETE
    USING (tenant_id = current_tenant_id());

-- ============================================================================
-- TABLA: mensajes
-- ============================================================================

ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;

CREATE POLICY mensajes_tenant_isolation ON mensajes
    FOR SELECT
    USING (
        is_super_admin() OR tenant_id = current_tenant_id()
    );

CREATE POLICY mensajes_tenant_insert ON mensajes
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY mensajes_tenant_update ON mensajes
    FOR UPDATE
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY mensajes_tenant_delete ON mensajes
    FOR DELETE
    USING (tenant_id = current_tenant_id());

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Query para verificar políticas aplicadas
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- TESTING RLS
-- ============================================================================

-- NOTA: Para testing manual, ejecutar:
/*
-- 1. Configurar tenant_id en sesión
SET app.current_tenant_id = 'tenant-uuid-aqui';

-- 2. Verificar que solo ves datos de ese tenant
SELECT * FROM estudiantes;

-- 3. Intentar insertar con tenant_id diferente (debe fallar)
INSERT INTO estudiantes (nombre, tenant_id) VALUES ('Test', 'otro-tenant-uuid');
-- ERROR: new row violates row-level security policy

-- 4. Modo super-admin (ver todos los datos)
SET app.is_super_admin = TRUE;
SELECT * FROM estudiantes; -- Debería ver todos los estudiantes
*/
