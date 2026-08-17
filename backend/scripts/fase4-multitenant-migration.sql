-- ================================================================
-- FASE 4: SAAS MULTI-TENANT MIGRATION
-- Aislamiento de datos, Políticas RLS y Esquema Multi-Escuela
-- Versión: 3.5.0
-- Fecha: 16 de Agosto de 2026
-- ================================================================

-- Extensiones nativas disponibles en PostgreSQL 13+ (gen_random_uuid)

-- ================================================================
-- 1. TABLA TENANTS (Idempotente & Tolerante)
-- ================================================================

CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid(),
    school_name VARCHAR(255) DEFAULT 'Escuela',
    schema_name VARCHAR(100) DEFAULT 'public',
    domain VARCHAR(255) DEFAULT 'localhost',
    config_json JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'activo',
    admin_email VARCHAR(255),
    admin_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asegurar todas las columnas necesarias en tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS school_name VARCHAR(255) DEFAULT 'Escuela';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS schema_name VARCHAR(100) DEFAULT 'public';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS domain VARCHAR(255) DEFAULT 'localhost';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS config_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'activo';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS admin_email VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS admin_phone VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS nombre VARCHAR(255) DEFAULT 'Escuela';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS dominio VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subdomain VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subdominio VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS slug VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS color_primario VARCHAR(20);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS color_secundario VARCHAR(20);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS favicon_url TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS dominio_personalizado VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_storage_gb INTEGER DEFAULT 10;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_estudiantes INTEGER DEFAULT 500;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_docentes INTEGER DEFAULT 50;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS fecha_inicio_trial TIMESTAMP WITH TIME ZONE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS fecha_fin_trial TIMESTAMP WITH TIME ZONE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Relajar constraints NOT NULL en tenants si existían de esquemas viejos
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='schema_name') THEN
        ALTER TABLE tenants ALTER COLUMN schema_name DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='school_name') THEN
        ALTER TABLE tenants ALTER COLUMN school_name DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='domain') THEN
        ALTER TABLE tenants ALTER COLUMN domain DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='config_json') THEN
        ALTER TABLE tenants ALTER COLUMN config_json DROP NOT NULL;
    END IF;
END $$;

-- Sincronizar columnas duplicadas / aliases
UPDATE tenants SET
    nombre = COALESCE(nombre, school_name, 'Escuela Principal'),
    school_name = COALESCE(school_name, nombre, 'Escuela Principal'),
    domain = COALESCE(domain, dominio, 'localhost'),
    dominio = COALESCE(dominio, domain, 'localhost'),
    subdomain = COALESCE(subdomain, subdominio, slug, 'default'),
    subdominio = COALESCE(subdominio, subdomain, slug, 'default'),
    config_json = COALESCE(config_json, '{}'::jsonb);

-- Crear índices en tenants
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- Asegurar tenant #1 por defecto (BGE Héroes de la Patria)
INSERT INTO tenants (id, uuid, school_name, nombre, domain, dominio, subdomain, subdominio, schema_name, status, config_json)
VALUES (
    1,
    'a45d6409-5fca-48f2-b108-fcca724ab3db',
    'Bachillerato General Estatal "Héroes de la Patria"',
    'Bachillerato General Estatal "Héroes de la Patria"',
    'localhost:3000',
    'localhost',
    'bge',
    'bge',
    'bge_heroes_de_la_patria',
    'activo',
    '{"school":{"name":"Bachillerato General Estatal \"Héroes de la Patria\"","shortName":"BGE Héroes","clave":"21EBH280X"},"branding":{"primaryColor":"#1F3A93","secondaryColor":"#FFB813","logoUrl":"/images/logo-bachillerato-HDLP.webp"},"features":{"gamification":true,"parentPortal":true,"teacherPortal":true}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    school_name = EXCLUDED.school_name,
    nombre = EXCLUDED.nombre,
    subdomain = COALESCE(tenants.subdomain, EXCLUDED.subdomain),
    status = 'activo';

-- ================================================================
-- 2. AGREGAR COLUMNA tenant_id A TABLAS NÚCLEO
-- ================================================================

-- Tablas núcleo
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE docentes ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE calificaciones ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE teacher_attendance_sessions ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE iacoins_balance ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE iacoins_balances ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE iacoins_transactions ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE bolsa_trabajo ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE avisos ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE noticias ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE citas ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;

-- Poblar registros existentes con tenant_id = 1 si tienen NULL
UPDATE usuarios SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE estudiantes SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE docentes SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE calificaciones SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE teacher_attendance_sessions SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE iacoins_balance SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE iacoins_balances SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE iacoins_transactions SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE user_streaks SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE challenges SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE tournaments SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE bolsa_trabajo SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE avisos SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE noticias SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE eventos SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE citas SET tenant_id = 1 WHERE tenant_id IS NULL;

-- Índices en tenant_id
CREATE INDEX IF NOT EXISTS idx_usuarios_tenant ON usuarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_estudiantes_tenant ON estudiantes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_docentes_tenant ON docentes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_tenant ON calificaciones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_tenant ON teacher_attendance_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_iacoins_balance_tenant ON iacoins_balance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_iacoins_balances_tenant ON iacoins_balances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_iacoins_trans_tenant ON iacoins_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_tenant ON user_streaks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_challenges_tenant ON challenges(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_tenant ON tournaments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_tenant ON bolsa_trabajo(tenant_id);

-- ================================================================
-- 3. POLÍTICAS RLS (Row-Level Security)
-- ================================================================

-- Helper RLS: La política permite acceso si:
-- 1. El tenant_id de la fila coincide con app.current_tenant_id
-- 2. app.current_tenant_id no está configurado (IS NULL o '') -> fallback seguro
-- 3. app.current_tenant_id = 'bypass' o 'all' (super-admin o migraciones)

-- 3.0 Rol y permisos para ejecución de queries en entorno multi-tenant
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bge_tenant_user') THEN
    CREATE ROLE bge_tenant_user NOINHERIT;
  END IF;
END
$$;
GRANT USAGE ON SCHEMA public TO bge_tenant_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bge_tenant_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bge_tenant_user;
GRANT bge_tenant_user TO current_user;

-- Función helper para extraer de manera 100% type-safe el tenant_id sin errores de cast
CREATE OR REPLACE FUNCTION current_app_tenant_id() RETURNS INTEGER AS $$
BEGIN
    RETURN NULLIF(REGEXP_REPLACE(COALESCE(current_setting('app.current_tenant_id', true), ''), '[^0-9]', '', 'g'), '')::integer;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;
GRANT EXECUTE ON FUNCTION current_app_tenant_id() TO bge_tenant_user;

-- 3.1 Estudiantes
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_estudiantes ON estudiantes;
CREATE POLICY tenant_isolation_estudiantes ON estudiantes
    USING (
        current_setting('app.current_tenant_id', true) IS NULL
        OR current_setting('app.current_tenant_id', true) = ''
        OR current_setting('app.current_tenant_id', true) = 'bypass'
        OR current_setting('app.current_tenant_id', true) = 'all'
        OR tenant_id = current_app_tenant_id()
    )
    WITH CHECK (
        current_setting('app.current_tenant_id', true) IS NULL
        OR current_setting('app.current_tenant_id', true) = ''
        OR current_setting('app.current_tenant_id', true) = 'bypass'
        OR tenant_id = current_app_tenant_id()
    );

-- 3.2 Docentes
ALTER TABLE docentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE docentes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_docentes ON docentes;
CREATE POLICY tenant_isolation_docentes ON docentes
    USING (
        current_setting('app.current_tenant_id', true) IS NULL
        OR current_setting('app.current_tenant_id', true) = ''
        OR current_setting('app.current_tenant_id', true) = 'bypass'
        OR current_setting('app.current_tenant_id', true) = 'all'
        OR tenant_id = current_app_tenant_id()
    )
    WITH CHECK (
        current_setting('app.current_tenant_id', true) IS NULL
        OR current_setting('app.current_tenant_id', true) = ''
        OR current_setting('app.current_tenant_id', true) = 'bypass'
        OR tenant_id = current_app_tenant_id()
    );

-- 3.3 Calificaciones
ALTER TABLE calificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE calificaciones FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_calificaciones ON calificaciones;
CREATE POLICY tenant_isolation_calificaciones ON calificaciones
    USING (
        current_setting('app.current_tenant_id', true) IS NULL
        OR current_setting('app.current_tenant_id', true) = ''
        OR current_setting('app.current_tenant_id', true) = 'bypass'
        OR current_setting('app.current_tenant_id', true) = 'all'
        OR tenant_id = current_app_tenant_id()
    )
    WITH CHECK (
        current_setting('app.current_tenant_id', true) IS NULL
        OR current_setting('app.current_tenant_id', true) = ''
        OR current_setting('app.current_tenant_id', true) = 'bypass'
        OR tenant_id = current_app_tenant_id()
    );

-- 3.4 Asistencias (teacher_attendance_sessions)
ALTER TABLE teacher_attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_attendance_sessions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_attendance ON teacher_attendance_sessions;
CREATE POLICY tenant_isolation_attendance ON teacher_attendance_sessions
    USING (
        current_setting('app.current_tenant_id', true) IS NULL
        OR current_setting('app.current_tenant_id', true) = ''
        OR current_setting('app.current_tenant_id', true) = 'bypass'
        OR current_setting('app.current_tenant_id', true) = 'all'
        OR tenant_id = current_app_tenant_id()
    )
    WITH CHECK (
        current_setting('app.current_tenant_id', true) IS NULL
        OR current_setting('app.current_tenant_id', true) = ''
        OR current_setting('app.current_tenant_id', true) = 'bypass'
        OR tenant_id = current_app_tenant_id()
    );

-- 3.5 IACoins Balance
ALTER TABLE iacoins_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE iacoins_balance FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_iacoins_balance ON iacoins_balance;
CREATE POLICY tenant_isolation_iacoins_balance ON iacoins_balance
    USING (
        current_setting('app.current_tenant_id', true) IS NULL
        OR current_setting('app.current_tenant_id', true) = ''
        OR current_setting('app.current_tenant_id', true) = 'bypass'
        OR current_setting('app.current_tenant_id', true) = 'all'
        OR tenant_id = current_app_tenant_id()
    )
    WITH CHECK (
        current_setting('app.current_tenant_id', true) IS NULL
        OR current_setting('app.current_tenant_id', true) = ''
        OR current_setting('app.current_tenant_id', true) = 'bypass'
        OR tenant_id = current_app_tenant_id()
    );

-- 3.6 User Streaks
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_user_streaks ON user_streaks;
CREATE POLICY tenant_isolation_user_streaks ON user_streaks
    USING (
        current_setting('app.current_tenant_id', true) IS NULL
        OR current_setting('app.current_tenant_id', true) = ''
        OR current_setting('app.current_tenant_id', true) = 'bypass'
        OR current_setting('app.current_tenant_id', true) = 'all'
        OR tenant_id = current_app_tenant_id()
    )
    WITH CHECK (
        current_setting('app.current_tenant_id', true) IS NULL
        OR current_setting('app.current_tenant_id', true) = ''
        OR current_setting('app.current_tenant_id', true) = 'bypass'
        OR tenant_id = current_app_tenant_id()
    );

-- 3.7 Challenges
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_challenges ON challenges;
CREATE POLICY tenant_isolation_challenges ON challenges
    USING (
        current_setting('app.current_tenant_id', true) IS NULL
        OR current_setting('app.current_tenant_id', true) = ''
        OR current_setting('app.current_tenant_id', true) = 'bypass'
        OR current_setting('app.current_tenant_id', true) = 'all'
        OR tenant_id = current_app_tenant_id()
    )
    WITH CHECK (
        current_setting('app.current_tenant_id', true) IS NULL
        OR current_setting('app.current_tenant_id', true) = ''
        OR current_setting('app.current_tenant_id', true) = 'bypass'
        OR tenant_id = current_app_tenant_id()
    );

-- 3.8 Tournaments
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_tournaments ON tournaments;
CREATE POLICY tenant_isolation_tournaments ON tournaments
    USING (
        current_setting('app.current_tenant_id', true) IS NULL
        OR current_setting('app.current_tenant_id', true) = ''
        OR current_setting('app.current_tenant_id', true) = 'bypass'
        OR current_setting('app.current_tenant_id', true) = 'all'
        OR tenant_id = current_app_tenant_id()
    )
    WITH CHECK (
        current_setting('app.current_tenant_id', true) IS NULL
        OR current_setting('app.current_tenant_id', true) = ''
        OR current_setting('app.current_tenant_id', true) = 'bypass'
        OR tenant_id = current_app_tenant_id()
    );

-- ================================================================
-- FIN DE MIGRACIÓN FASE 4
-- ================================================================
