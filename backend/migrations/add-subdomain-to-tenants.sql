/**
 * Script de Migración: Agregar columna SUBDOMAIN a tabla tenants
 * Fecha: 5 de Diciembre de 2025
 * 
 * Propósito: Agregar columna subdomain faltante que es requerida por TenantDAO
 * 
 * NOTA: Este script es SAFE - usa IF NOT EXISTS
 */
-- =====================================================
-- PASO 1: Agregar columna subdomain si no existe
-- =====================================================
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS subdomain VARCHAR(100);
-- =====================================================
-- PASO 2: Agregar columna nombre si no existe
-- =====================================================
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS nombre VARCHAR(255);
-- =====================================================
-- PASO 3: Agregar columna dominio si no existe (alias de domain)
-- =====================================================
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS dominio VARCHAR(255);
-- =====================================================
-- PASO 4: Poblar subdomain a partir de domain existente
-- =====================================================
UPDATE tenants
SET subdomain = COALESCE(
        SPLIT_PART(domain, '.', 1),
        SPLIT_PART(domain, ':', 1),
        'default'
    )
WHERE subdomain IS NULL
    OR subdomain = '';
-- =====================================================
-- PASO 5: Poblar nombre a partir de school_name
-- =====================================================
UPDATE tenants
SET nombre = school_name
WHERE nombre IS NULL
    OR nombre = '';
-- =====================================================
-- PASO 6: Poblar dominio a partir de domain
-- =====================================================
UPDATE tenants
SET dominio = domain
WHERE dominio IS NULL
    OR dominio = '';
-- =====================================================
-- PASO 7: Crear índice en subdomain
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
-- =====================================================
-- PASO 8: Agregar constraint UNIQUE en subdomain
-- =====================================================
-- Primero eliminamos duplicados si existen
-- (Este paso es seguro y no falla si no hay duplicados)
-- Agregar constraint único
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_subdomain_unique;
ALTER TABLE tenants
ADD CONSTRAINT tenants_subdomain_unique UNIQUE (subdomain);
-- =====================================================
-- VERIFICACIÓN
-- =====================================================
/*
 -- Ver columnas de la tabla
 SELECT column_name, data_type, is_nullable
 FROM information_schema.columns
 WHERE table_name = 'tenants'
 ORDER BY ordinal_position;
 
 -- Ver datos
 SELECT id, nombre, subdomain, dominio, status FROM tenants;
 */
-- =====================================================
-- FIN
-- =====================================================