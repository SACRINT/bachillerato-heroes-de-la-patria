/**
 * Script de Migración: Crear Tabla TENANTS para Arquitectura Multi-Tenant
 * Fecha: 8 de Noviembre de 2025
 *
 * Propósito: Crear la tabla base para un sistema multi-tenant escalable
 * Cada registro representa una escuela/institución con su configuración única
 *
 * NOTA: Este script es SEGURO - crea tabla si no existe
 */

-- =====================================================
-- PASO 1: Crear tabla TENANTS
-- =====================================================

CREATE TABLE IF NOT EXISTS tenants (
    -- Identificador único
    id SERIAL PRIMARY KEY,

    -- UUID para referencias externas
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,

    -- Nombre de schema PostgreSQL para datos separados (ej: 'heroes_de_la_patria')
    schema_name VARCHAR(255) UNIQUE NOT NULL,

    -- Nombre de la escuela/institución
    school_name VARCHAR(255) NOT NULL,

    -- Dominio personalizado (ej: 'heroes.localhost' o 'heroes.bge.edu.mx')
    domain VARCHAR(255) UNIQUE NOT NULL,

    -- Configuración completa del tenant en JSON
    config_json JSONB NOT NULL,

    -- Estado del tenant
    status VARCHAR(50) DEFAULT 'activo',  -- 'activo', 'inactivo', 'suspendido'

    -- Información de contacto
    admin_email VARCHAR(255),
    admin_phone VARCHAR(20),

    -- Auditoria
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('activo', 'inactivo', 'suspendido'))
);

-- =====================================================
-- PASO 2: Crear índices para optimizar búsquedas
-- =====================================================

-- Índice en domain para búsquedas rápidas (criticial para routing)
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);

-- Índice en uuid para referencias
CREATE INDEX IF NOT EXISTS idx_tenants_uuid ON tenants(uuid);

-- Índice en schema_name para datos separados
CREATE INDEX IF NOT EXISTS idx_tenants_schema_name ON tenants(schema_name);

-- Índice en status para filtrar tenants activos
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- =====================================================
-- PASO 3: Crear trigger para actualizar updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_tenants_updated_at();

-- =====================================================
-- PASO 4: Insertar el PRIMER TENANT - BGE Héroes de la Patria
-- =====================================================

INSERT INTO tenants (schema_name, school_name, domain, config_json, admin_email, admin_phone, status)
VALUES (
    'bge_heroes_de_la_patria',
    'Bachillerato General Estatal "Héroes de la Patria"',
    'localhost:3000',
    '{
        "school": {
            "name": "Bachillerato General Estatal \"Héroes de la Patria\"",
            "shortName": "BGE Héroes",
            "abbreviation": "BGE",
            "clave": "21EBH280X",
            "zone": "004"
        },
        "branding": {
            "primaryColor": "#1F3A93",
            "secondaryColor": "#FFB813",
            "accentColor": "#D4AF37",
            "logoUrl": "https://bge-heroesdelapatria.vercel.app/images/logo.png",
            "faviconUrl": "https://bge-heroesdelapatria.vercel.app/favicon.ico"
        },
        "features": {
            "studentManagement": true,
            "gradeTracking": true,
            "parentPortal": true,
            "teacherPortal": true,
            "announcements": true,
            "events": true,
            "library": true,
            "jobBoard": true,
            "alumni": true,
            "payments": true,
            "surveys": true,
            "tickets": true,
            "messaging": true,
            "timetable": true,
            "documents": true,
            "googleOAuth": true,
            "multiTenant": true
        },
        "authentication": {
            "providers": ["local", "google"],
            "sessionTimeout": 3600,
            "passwordMinLength": 8,
            "requireMFA": false
        },
        "roles": [
            {
                "name": "admin",
                "description": "Administrador del sistema",
                "permissions": ["*"]
            },
            {
                "name": "director",
                "description": "Director de la institución",
                "permissions": ["view:*", "edit:students", "edit:teachers", "view:reports", "manage:users"]
            },
            {
                "name": "docente",
                "description": "Profesor",
                "permissions": ["view:students", "edit:grades", "view:timetable", "manage:assignments"]
            },
            {
                "name": "estudiante",
                "description": "Estudiante",
                "permissions": ["view:own_grades", "view:announcements", "view:events", "view:library"]
            },
            {
                "name": "padre",
                "description": "Padre/Tutor",
                "permissions": ["view:student_grades", "view:announcements", "contact:teachers"]
            },
            {
                "name": "guest",
                "description": "Visitante",
                "permissions": ["view:public_info"]
            }
        ],
        "contact": {
            "phone": "+56234567890",
            "email": "admin@bgeheroes.edu.mx",
            "address": "Calle Principal 123, Ciudad, Estado",
            "website": "https://bgeheroes.edu.mx"
        },
        "policies": {
            "privacyPolicy": true,
            "termsOfService": true,
            "dataRetention": 3650,
            "gdprCompliant": true
        },
        "integrations": {
            "googleClassroom": false,
            "googleMeet": true,
            "microsoftTeams": false,
            "zoom": false
        },
        "notifications": {
            "emailNotifications": true,
            "smsNotifications": false,
            "pushNotifications": true,
            "announcements": true,
            "gradeUpdates": true,
            "eventReminders": true
        }
    }'::jsonb,
    'admin@bgeheroes.edu.mx',
    '+56234567890',
    'activo'
)
ON CONFLICT (domain) DO NOTHING;

-- =====================================================
-- PASO 5: Verificación (Ejecutar después de migración)
-- =====================================================

/*
-- Ver estructura de la tabla
\d tenants

-- Ver columnas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tenants'
ORDER BY ordinal_position;

-- Ver índices
\di idx_tenants*

-- Contar tenants
SELECT COUNT(*) as total_tenants FROM tenants;

-- Ver primer tenant
SELECT id, uuid, school_name, domain, status FROM tenants LIMIT 1;

-- Ver configuración JSON de primer tenant
SELECT
    school_name,
    domain,
    config_json -> 'school' ->> 'name' as school_name_from_config,
    config_json -> 'features' ->> 'googleOAuth' as has_google_oauth
FROM tenants
LIMIT 1;
*/

-- =====================================================
-- Fin del Script de Migración
-- =====================================================

-- INSTRUCCIONES DE USO:
-- 1. Abrir Neon Console
-- 2. Ir a SQL Editor
-- 3. Copiar TODO este contenido
-- 4. Pegar en el editor
-- 5. Click en "Run" o Ctrl+Enter
-- 6. Esperar confirmación "Query executed successfully"
-- 7. Reiniciar servidor backend
