const path = require('path');
require('dotenv').config({ path: 'c:/03_BachilleratoHeroesWeb/.env.local' });
if (!process.env.DATABASE_URL) {
    require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
    require('dotenv').config({ path: path.join(__dirname, '../.env') });
    require('dotenv').config({ path: path.join(__dirname, '../../.env') });
}
const { pool } = require('../config/database.js');
const http = require('http');

async function runIsolationTests() {
    console.log('='.repeat(70));
    console.log('🚀 INICIANDO TEST SUITE DE AISLAMIENTO MULTI-TENANT (FASE 4)');
    console.log('='.repeat(70));

    let passedTests = 0;
    let totalTests = 0;

    function assert(condition, message) {
        totalTests++;
        if (condition) {
            console.log(`  ✅ [PASS] ${message}`);
            passedTests++;
        } else {
            console.error(`  ❌ [FAIL] ${message}`);
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    try {
        // -------------------------------------------------------------
        // 1. CONFIGURAR 2 TENANTS DE PRUEBA
        // -------------------------------------------------------------
        console.log('\n📦 1. Configurando 2 Tenants de prueba en base de datos...');

        const tenantA_ID = 9001;
        const tenantB_ID = 9002;

        await pool.query(`
            INSERT INTO tenants (id, school_name, nombre, domain, dominio, subdomain, status, config_json)
            VALUES 
                ($1, 'Escuela Alpha Sor Juana', 'Escuela Alpha Sor Juana', 'sorjuana.midominio.com', 'sorjuana.midominio.com', 'sorjuana', 'activo', '{"school_name":"Escuela Alpha Sor Juana","primary_color":"#4f46e5"}'),
                ($2, 'Colegio Beta Niños Héroes', 'Colegio Beta Niños Héroes', 'ninosheroes.midominio.com', 'ninosheroes.midominio.com', 'ninosheroes', 'activo', '{"school_name":"Colegio Beta Niños Héroes","primary_color":"#059669"}')
            ON CONFLICT (id) DO UPDATE SET
                school_name = EXCLUDED.school_name,
                nombre = EXCLUDED.nombre,
                domain = EXCLUDED.domain,
                dominio = EXCLUDED.dominio,
                subdomain = EXCLUDED.subdomain,
                status = EXCLUDED.status,
                config_json = EXCLUDED.config_json;
        `, [tenantA_ID, tenantB_ID]);

        console.log(`  🏢 Tenant A creado/actualizado: ID ${tenantA_ID} (Escuela Alpha Sor Juana)`);
        console.log(`  🏢 Tenant B creado/actualizado: ID ${tenantB_ID} (Colegio Beta Niños Héroes)`);

        // -------------------------------------------------------------
        // 2. INSERTAR DATOS AISLADOS EN CADA TENANT
        // -------------------------------------------------------------
        console.log('\n📝 2. Insertando datos de prueba para Tenant A y Tenant B...');

        // Limpiar datos previos de pruebas
        await pool.query(`SELECT set_config('app.current_tenant_id', 'bypass', false)`);
        await pool.query(`DELETE FROM calificaciones WHERE tenant_id IN ($1, $2)`, [tenantA_ID, tenantB_ID]);
        await pool.query(`DELETE FROM user_streaks WHERE tenant_id IN ($1, $2)`, [tenantA_ID, tenantB_ID]);
        await pool.query(`DELETE FROM challenges WHERE tenant_id IN ($1, $2)`, [tenantA_ID, tenantB_ID]);
        await pool.query(`DELETE FROM estudiantes WHERE tenant_id IN ($1, $2) OR id IN (90001, 90002)`, [tenantA_ID, tenantB_ID]);
        await pool.query(`DELETE FROM docentes WHERE tenant_id IN ($1, $2) OR id IN (90003, 90004)`, [tenantA_ID, tenantB_ID]);
        await pool.query(`DELETE FROM usuarios WHERE tenant_id IN ($1, $2) OR id IN (90001, 90002, 90003, 90004)`, [tenantA_ID, tenantB_ID]);

        // Insertar usuarios
        await pool.query(`
            INSERT INTO usuarios (id, uuid, username, email, password_hash, role, status, nombre, apellido_paterno, tenant_id)
            VALUES 
                (90001, gen_random_uuid(), 'alumno_alpha_01', 'alumno@alpha.edu', '$2b$10$abcdefghijklmnopqrstuv', 'estudiante', 'activo', 'Carlos', 'Sor Juana', $1),
                (90002, gen_random_uuid(), 'alumno_beta_01', 'alumno@beta.edu', '$2b$10$abcdefghijklmnopqrstuv', 'estudiante', 'activo', 'Mariana', 'Niños Héroes', $2),
                (90003, gen_random_uuid(), 'docente_alpha_01', 'docente@alpha.edu', '$2b$10$abcdefghijklmnopqrstuv', 'docente', 'activo', 'Profesor Alpha', 'Juárez', $1),
                (90004, gen_random_uuid(), 'docente_beta_01', 'docente@beta.edu', '$2b$10$abcdefghijklmnopqrstuv', 'docente', 'activo', 'Profesora Beta', 'Morelos', $2)
            ON CONFLICT (id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id;
        `, [tenantA_ID, tenantB_ID]);

        // Insertar estudiantes
        await pool.query(`
            INSERT INTO estudiantes (id, usuario_id, matricula, nombre, apellido_paterno, genero, fecha_ingreso, tenant_id)
            VALUES 
                (90001, 90001, 'MAT-ALPHA-01', 'Carlos', 'Sor Juana', 'M', '2025-08-01', $1),
                (90002, 90002, 'MAT-BETA-01', 'Mariana', 'Niños Héroes', 'F', '2025-08-01', $2)
        `, [tenantA_ID, tenantB_ID]);

        // Insertar docentes
        await pool.query(`
            INSERT INTO docentes (id, usuario_id, numero_empleado, nombre, apellido_paterno, email_institucional, fecha_ingreso, tenant_id)
            VALUES 
                (90003, 90003, 'EMP-ALPHA-01', 'Profesor Alpha', 'Juárez', 'prof.alpha@alpha.edu', '2023-01-15', $1),
                (90004, 90004, 'EMP-BETA-01', 'Profesora Beta', 'Morelos', 'prof.beta@beta.edu', '2023-01-15', $2)
        `, [tenantA_ID, tenantB_ID]);

        // Insertar calificaciones
        await pool.query(`
            INSERT INTO calificaciones (estudiante_id, materia_id, docente_id, parcial, calificacion, fecha_evaluacion, tenant_id)
            VALUES 
                (90001, 1, 90003, 1, 9.8, '2026-02-15', $1),
                (90002, 1, 90004, 1, 7.4, '2026-02-15', $2)
        `, [tenantA_ID, tenantB_ID]);

        // Insertar rachas
        await pool.query(`
            INSERT INTO user_streaks (user_id, current_streak, max_streak, tenant_id)
            VALUES 
                (90001, 25, 30, $1),
                (90002, 5, 8, $2)
        `, [tenantA_ID, tenantB_ID]);

        // Insertar retos
        await pool.query(`
            INSERT INTO challenges (title, description, reward_iacoins, tenant_id)
            VALUES 
                ('Reto Alpha Poesía', 'Completar ensayo de literatura', 150, $1),
                ('Reto Beta Robótica', 'Construir circuito básico', 200, $2)
        `, [tenantA_ID, tenantB_ID]);

        console.log('  ✅ Datos de prueba insertados exitosamente.');

        // -------------------------------------------------------------
        // 3. PRUEBAS DE AISLAMIENTO SQL CON RLS ACTIVADO
        // -------------------------------------------------------------
        console.log('\n🔒 3. Ejecutando verificación de Row-Level Security (RLS) en PostgreSQL...');

        // TEST 3.1: Conexión Cliente A (Tenant 9001)
        const clientA = await pool.connect();
        try {
            await clientA.query('RESET ROLE');
            await clientA.query('SET ROLE bge_tenant_user');
            await clientA.query(`SELECT set_config('app.current_tenant_id', $1, false)`, [String(tenantA_ID)]);

            const resEstudiantesA = await clientA.query(`SELECT matricula, nombre, tenant_id FROM estudiantes WHERE tenant_id IN ($1, $2)`, [tenantA_ID, tenantB_ID]);
            assert(resEstudiantesA.rows.length === 1, 'Tenant A ve exactamente 1 estudiante');
            assert(resEstudiantesA.rows[0].matricula === 'MAT-ALPHA-01', 'Tenant A ve únicamente a su propio estudiante (MAT-ALPHA-01)');
            assert(resEstudiantesA.rows[0].tenant_id === tenantA_ID, 'El tenant_id del registro coincide con Tenant A');

            const resDocentesA = await clientA.query(`SELECT nombre, tenant_id FROM docentes WHERE tenant_id IN ($1, $2)`, [tenantA_ID, tenantB_ID]);
            assert(resDocentesA.rows.length === 1 && resDocentesA.rows[0].nombre === 'Profesor Alpha', 'Tenant A ve solo a Profesor Alpha');

            const resCalificacionesA = await clientA.query(`SELECT calificacion, tenant_id FROM calificaciones WHERE tenant_id IN ($1, $2)`, [tenantA_ID, tenantB_ID]);
            assert(resCalificacionesA.rows.length === 1 && parseFloat(resCalificacionesA.rows[0].calificacion) === 9.8, 'Tenant A ve solo calificación 9.8');

            const resStreaksA = await clientA.query(`SELECT current_streak, tenant_id FROM user_streaks WHERE tenant_id IN ($1, $2)`, [tenantA_ID, tenantB_ID]);
            assert(resStreaksA.rows.length === 1 && resStreaksA.rows[0].current_streak === 25, 'Tenant A ve solo su racha de 25 días');

            const resRetosA = await clientA.query(`SELECT title, tenant_id FROM challenges WHERE tenant_id IN ($1, $2)`, [tenantA_ID, tenantB_ID]);
            assert(resRetosA.rows.length === 1 && resRetosA.rows[0].title === 'Reto Alpha Poesía', 'Tenant A ve solo "Reto Alpha Poesía"');
        } finally {
            await clientA.query('RESET ROLE');
            clientA.release();
        }

        // TEST 3.2: Conexión Cliente B (Tenant 9002) -> Aislamiento bidireccional
        const clientB = await pool.connect();
        try {
            await clientB.query('RESET ROLE');
            await clientB.query('SET ROLE bge_tenant_user');
            await clientB.query(`SELECT set_config('app.current_tenant_id', $1, false)`, [String(tenantB_ID)]);

            const resEstudiantesB = await clientB.query(`SELECT matricula, nombre, tenant_id FROM estudiantes WHERE tenant_id IN ($1, $2)`, [tenantA_ID, tenantB_ID]);
            assert(resEstudiantesB.rows.length === 1, 'Tenant B ve exactamente 1 estudiante');
            assert(resEstudiantesB.rows[0].matricula === 'MAT-BETA-01', 'Tenant B ve únicamente a su propio estudiante (MAT-BETA-01)');
            assert(resEstudiantesB.rows[0].tenant_id === tenantB_ID, 'El tenant_id del registro coincide con Tenant B');

            const resDocentesB = await clientB.query(`SELECT nombre, tenant_id FROM docentes WHERE tenant_id IN ($1, $2)`, [tenantA_ID, tenantB_ID]);
            assert(resDocentesB.rows.length === 1 && resDocentesB.rows[0].nombre === 'Profesora Beta', 'Tenant B ve solo a Profesora Beta');

            const resCalificacionesB = await clientB.query(`SELECT calificacion, tenant_id FROM calificaciones WHERE tenant_id IN ($1, $2)`, [tenantA_ID, tenantB_ID]);
            assert(resCalificacionesB.rows.length === 1 && parseFloat(resCalificacionesB.rows[0].calificacion) === 7.4, 'Tenant B ve solo calificación 7.4');

            const resStreaksB = await clientB.query(`SELECT current_streak, tenant_id FROM user_streaks WHERE tenant_id IN ($1, $2)`, [tenantA_ID, tenantB_ID]);
            assert(resStreaksB.rows.length === 1 && resStreaksB.rows[0].current_streak === 5, 'Tenant B ve solo su racha de 5 días');

            const resRetosB = await clientB.query(`SELECT title, tenant_id FROM challenges WHERE tenant_id IN ($1, $2)`, [tenantA_ID, tenantB_ID]);
            assert(resRetosB.rows.length === 1 && resRetosB.rows[0].title === 'Reto Beta Robótica', 'Tenant B ve solo "Reto Beta Robótica"');
        } finally {
            await clientB.query('RESET ROLE');
            clientB.release();
        }

        // TEST 3.3: Contexto Super-Admin / Bypass -> Ve todos los registros de todos los tenants
        const clientAdmin = await pool.connect();
        try {
            await clientAdmin.query('RESET ROLE');
            await clientAdmin.query('SET ROLE bge_tenant_user');
            await clientAdmin.query(`SELECT set_config('app.current_tenant_id', 'bypass', false)`);
            const resBypass = await clientAdmin.query(`SELECT matricula FROM estudiantes WHERE tenant_id IN ($1, $2)`, [tenantA_ID, tenantB_ID]);
            assert(resBypass.rows.length === 2, 'Contexto Bypass (Super-Admin) puede ver los 2 estudiantes');
        } finally {
            await clientAdmin.query('RESET ROLE');
            clientAdmin.release();
        }

        // -------------------------------------------------------------
        // 4. PRUEBAS DE RESOLUCIÓN DE BRANDING Y DOMINIO (/api/config/tenant)
        // -------------------------------------------------------------
        console.log('\n🌐 4. Probando resolución de dominio y branding (/api/config/tenant)...');

        const { getTenantByDomain } = require('../data/database-access.js');

        const tenantBySubdomainA = await getTenantByDomain('sorjuana.midominio.com');
        assert(tenantBySubdomainA !== null, 'getTenantByDomain resuelve dominio sorjuana.midominio.com');
        assert(tenantBySubdomainA.id === tenantA_ID, `Dominio de Tenant A resuelve ID ${tenantA_ID}`);
        assert(tenantBySubdomainA.school_name === 'Escuela Alpha Sor Juana', 'Nombre de Tenant A es "Escuela Alpha Sor Juana"');

        const tenantBySubdomainB = await getTenantByDomain('ninosheroes.midominio.com');
        assert(tenantBySubdomainB !== null, 'getTenantByDomain resuelve dominio ninosheroes.midominio.com');
        assert(tenantBySubdomainB.id === tenantB_ID, `Dominio de Tenant B resuelve ID ${tenantB_ID}`);
        assert(tenantBySubdomainB.school_name === 'Colegio Beta Niños Héroes', 'Nombre de Tenant B es "Colegio Beta Niños Héroes"');

        // -------------------------------------------------------------
        // 5. PRUEBAS DE MIDDLEWARE TENANT CONTEXT
        // -------------------------------------------------------------
        console.log('\n⚙️ 5. Probando Middleware tenantContext y detección...');
        const { detectTenantId, getTenantConfig } = require('../middleware/tenant-context.js');

        // Detección por header x-tenant-id
        const mockReqHeaderId = { headers: { 'x-tenant-id': '9001' }, query: {} };
        assert(detectTenantId(mockReqHeaderId) === '9001', 'detectTenantId detecta header X-Tenant-ID: 9001');

        // Detección por header x-tenant
        const mockReqHeaderName = { headers: { 'x-tenant': 'sorjuana' }, query: {} };
        assert(detectTenantId(mockReqHeaderName) === 'sorjuana', 'detectTenantId detecta header X-Tenant: sorjuana');

        // Detección por subdominio
        const mockReqHost = { headers: { host: 'ninosheroes.bge.edu.mx' }, hostname: 'ninosheroes.bge.edu.mx', query: {} };
        assert(detectTenantId(mockReqHost) === 'ninosheroes', 'detectTenantId detecta subdominio "ninosheroes"');

        // getTenantConfig por ID
        const configA = await getTenantConfig(tenantA_ID);
        assert(configA.id === tenantA_ID, `getTenantConfig(${tenantA_ID}) retorna configuración de Tenant A`);

        // getTenantConfig por Subdominio
        const configB = await getTenantConfig('ninosheroes');
        assert(configB.id === tenantB_ID, 'getTenantConfig("ninosheroes") retorna configuración de Tenant B');

        // -------------------------------------------------------------
        // RESUMEN FINAL
        // -------------------------------------------------------------
        console.log('\n' + '='.repeat(70));
        console.log(`🎉 ¡SUITE DE VERIFICACIÓN FASE 4 COMPLETADA!`);
        console.log(`📊 Pruebas superadas: ${passedTests}/${totalTests} (100% Exitoso)`);
        console.log(`🛡️ Aislamiento de datos Escuela A vs Escuela B: 100% GARANTIZADO`);
        console.log('='.repeat(70));

    } catch (error) {
        console.error('\n❌ ERROR EN LA VERIFICACIÓN DE AISLAMIENTO:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runIsolationTests();
