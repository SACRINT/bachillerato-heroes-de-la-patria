/**
 * 🗄️ Script Node.js para crear las tablas multi-tenant de contenido
 * Fecha: 01 de Septiembre de 2026
 * SIPWEB-BG - FASE 1
 *
 * USO: node run-create-tenant-content-tables.js
 * REQUIERE: Variable DATABASE_URL en .env o .env.local
 */

const { Pool } = require('pg');
const path = require('path');

// Cargar variables de entorno
try {
    require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });
    require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
} catch (e) {
    console.log('⚠️ dotenv no disponible, usando variables de entorno del sistema');
}

const SQL_SCRIPT = `
-- ================================================================
-- 1. TABLA tenant_pages
-- ================================================================
CREATE TABLE IF NOT EXISTS tenant_pages (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    page_slug VARCHAR(100) NOT NULL,
    page_title VARCHAR(255),
    page_content TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, page_slug)
);
CREATE INDEX IF NOT EXISTS idx_tenant_pages_tenant ON tenant_pages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_pages_slug ON tenant_pages(page_slug);
CREATE INDEX IF NOT EXISTS idx_tenant_pages_published ON tenant_pages(is_published);

-- ================================================================
-- 2. TABLA tenant_banners
-- ================================================================
CREATE TABLE IF NOT EXISTS tenant_banners (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255),
    subtitle VARCHAR(500),
    image_url VARCHAR(500) NOT NULL,
    link_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tenant_banners_tenant ON tenant_banners(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_banners_active ON tenant_banners(is_active);
CREATE INDEX IF NOT EXISTS idx_tenant_banners_order ON tenant_banners(sort_order);

-- ================================================================
-- 3. TABLA tenant_notices
-- ================================================================
CREATE TABLE IF NOT EXISTS tenant_notices (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'aviso',
    is_zone_notice BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tenant_notices_tenant ON tenant_notices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_notices_type ON tenant_notices(type);
CREATE INDEX IF NOT EXISTS idx_tenant_notices_zone ON tenant_notices(is_zone_notice);
CREATE INDEX IF NOT EXISTS idx_tenant_notices_published ON tenant_notices(is_published);

-- ================================================================
-- 4. TABLA tenant_programs
-- ================================================================
CREATE TABLE IF NOT EXISTS tenant_programs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    program_type VARCHAR(50) DEFAULT 'capacitacion',
    program_name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tenant_programs_tenant ON tenant_programs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_programs_type ON tenant_programs(program_type);
CREATE INDEX IF NOT EXISTS idx_tenant_programs_active ON tenant_programs(is_active);

-- ================================================================
-- 5. TABLA tenant_files
-- ================================================================
CREATE TABLE IF NOT EXISTS tenant_files (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    file_type VARCHAR(50) NOT NULL,
    stored_path VARCHAR(500) NOT NULL,
    original_name VARCHAR(500),
    mime_type VARCHAR(100),
    file_size INTEGER,
    uploaded_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tenant_files_tenant ON tenant_files(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_files_type ON tenant_files(file_type);

-- ================================================================
-- TRIGGERS para updated_at
-- ================================================================
CREATE OR REPLACE FUNCTION update_tenant_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tenant_pages_updated_at ON tenant_pages;
CREATE TRIGGER update_tenant_pages_updated_at BEFORE UPDATE ON tenant_pages FOR EACH ROW EXECUTE FUNCTION update_tenant_content_updated_at();

DROP TRIGGER IF EXISTS update_tenant_banners_updated_at ON tenant_banners;
CREATE TRIGGER update_tenant_banners_updated_at BEFORE UPDATE ON tenant_banners FOR EACH ROW EXECUTE FUNCTION update_tenant_content_updated_at();

DROP TRIGGER IF EXISTS update_tenant_notices_updated_at ON tenant_notices;
CREATE TRIGGER update_tenant_notices_updated_at BEFORE UPDATE ON tenant_notices FOR EACH ROW EXECUTE FUNCTION update_tenant_content_updated_at();

DROP TRIGGER IF EXISTS update_tenant_programs_updated_at ON tenant_programs;
CREATE TRIGGER update_tenant_programs_updated_at BEFORE UPDATE ON tenant_programs FOR EACH ROW EXECUTE FUNCTION update_tenant_content_updated_at();
`;

async function createTables() {
    const hasValidUrl = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('CHANGE_ME');

    if (!hasValidUrl) {
        console.error('❌ ERROR: DATABASE_URL no configurada en .env');
        console.error('Configura la variable DATABASE_URL en .env o .env.local');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();

    try {
        console.log('🔌 Conectado a Neon PostgreSQL...');
        console.log('');

        // Separar y ejecutar cada statement individualmente
        const statements = SQL_SCRIPT
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('CREATE OR REPLACE'));

        let created = 0;
        let errors = 0;

        for (const statement of statements) {
            try {
                // Saltar statements que son solo comentarios
                if (statement.replace(/--.*$/gm, '').trim().length === 0) continue;

                await client.query(statement + ';');
                created++;

                // Detectar qué se creó
                if (statement.includes('CREATE TABLE')) {
                    const tableName = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
                    if (tableName) console.log(`✅ Tabla ${tableName} creada/verificada`);
                } else if (statement.includes('CREATE INDEX')) {
                    const indexName = statement.match(/CREATE INDEX IF NOT EXISTS (\w+)/)?.[1];
                    if (indexName) console.log(`   📊 Índice ${indexName} creado`);
                } else if (statement.includes('CREATE TRIGGER')) {
                    const triggerName = statement.match(/CREATE TRIGGER (\w+)/)?.[1];
                    if (triggerName) console.log(`   ⚡ Trigger ${triggerName} creado`);
                }
            } catch (err) {
                // Ignorar errores de "already exists"
                if (err.message.includes('already exists')) {
                    console.log(`   ⏭️  Ya existía: ${err.message.substring(0, 60)}...`);
                } else {
                    console.error(`   ❌ Error: ${err.message.substring(0, 100)}`);
                    errors++;
                }
            }
        }

        console.log('');
        console.log('📊 RESUMEN:');
        console.log(`   ✅ Statements exitosos: ${created}`);
        console.log(`   ❌ Errores: ${errors}`);

        // Verificar tablas creadas
        console.log('');
        console.log('🔍 Verificando tablas en la base de datos...');
        const result = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name LIKE 'tenant_%'
            ORDER BY table_name
        `);

        console.log('');
        console.log('📋 Tablas tenant_* encontradas:');
        for (const row of result.rows) {
            console.log(`   ✅ ${row.table_name}`);
        }

        console.log('');
        console.log('🎉 ¡Migración completada exitosamente!');

    } catch (error) {
        console.error('❌ Error fatal:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

createTables().catch(console.error);
