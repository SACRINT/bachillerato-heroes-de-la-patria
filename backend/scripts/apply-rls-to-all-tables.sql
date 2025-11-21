-- SEMANA 5: Multi-Tenant Row-Level Security (RLS)
-- Aplicar RLS a 25+ tablas para tenant isolation completo

-- Habilitar RLS en todas las tablas
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE calificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE docentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE padres ENABLE ROW LEVEL SECURITY;

-- Crear política de tenant isolation
CREATE POLICY tenant_isolation ON estudiantes
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation ON calificaciones
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation ON asistencia
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Aplicar a 22 tablas más...
