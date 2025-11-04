/**
 * 🔍 DIAGNÓSTICO REAL DE APROBACIONES
 * Endpoint para ver EXACTAMENTE qué hay en la BD
 * Sin filtros, sin mentiras, información real
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

/**
 * GET /api/diagnostico-aprobaciones/todos-registros
 * Ver TODOS los registros de la tabla sin filtros
 */
router.get('/todos-registros', async (req, res) => {
    console.log('\n🔍 [DIAGNÓSTICO] Consultando TODOS los registros sin filtros...\n');

    try {
        // QUERY 1: Resumen
        const resumen = await pool.query(`
            SELECT
                COUNT(*) as total_registros,
                COUNT(*) FILTER (WHERE estado='pendiente') as pendiente_count,
                COUNT(*) FILTER (WHERE estado='aprobada') as aprobada_count,
                COUNT(*) FILTER (WHERE estado='rechazada') as rechazada_count,
                COUNT(*) FILTER (WHERE email_confirmado=true) as confirmados_count,
                COUNT(*) FILTER (WHERE email_confirmado=false) as no_confirmados_count
            FROM pendientes_aprobacion
        `);

        const stats = resumen.rows[0];
        console.log('📊 [DIAGNÓSTICO] Estadísticas generales:');
        console.log(`   - Total registros: ${stats.total_registros}`);
        console.log(`   - Estado pendiente: ${stats.pendiente_count}`);
        console.log(`   - Estado aprobada: ${stats.aprobada_count}`);
        console.log(`   - Estado rechazada: ${stats.rechazada_count}`);
        console.log(`   - Email confirmados: ${stats.confirmados_count}`);
        console.log(`   - Email NO confirmados: ${stats.no_confirmados_count}`);

        // QUERY 2: Desglose por estado
        const porEstado = await pool.query(`
            SELECT estado, COUNT(*) as cantidad
            FROM pendientes_aprobacion
            GROUP BY estado
            ORDER BY cantidad DESC
        `);

        console.log('\n📋 [DIAGNÓSTICO] Desglose por estado:');
        porEstado.rows.forEach(row => {
            console.log(`   - ${row.estado}: ${row.cantidad}`);
        });

        // QUERY 3: TODOS los registros
        const todos = await pool.query(`
            SELECT
                id,
                tipo_solicitud,
                email_usuario,
                estado,
                email_confirmado,
                fecha_solicitud,
                created_at
            FROM pendientes_aprobacion
            ORDER BY fecha_solicitud DESC
        `);

        console.log(`\n📋 [DIAGNÓSTICO] LISTADO COMPLETO (${todos.rows.length} registros):`);
        todos.rows.forEach((row, idx) => {
            console.log(`   ${idx+1}. ID ${row.id}: ${row.tipo_solicitud} | ${row.estado} | ${row.email_usuario}`);
        });

        res.json({
            success: true,
            resumen: stats,
            por_estado: porEstado.rows,
            todos_registros: todos.rows,
            total: todos.rows.length
        });

        console.log('\n✅ [DIAGNÓSTICO] Completado\n');

    } catch (error) {
        console.error('❌ [DIAGNÓSTICO] Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/diagnostico-aprobaciones/pendientes-solo
 * Ver SOLO registros con estado='pendiente' (lo que debería mostrar el dashboard)
 */
router.get('/pendientes-solo', async (req, res) => {
    console.log('\n🔍 [DIAGNÓSTICO] Consultando SOLO registros pendientes...\n');

    try {
        const pendientes = await pool.query(`
            SELECT
                id,
                tipo_solicitud,
                email_usuario,
                estado,
                email_confirmado,
                fecha_solicitud
            FROM pendientes_aprobacion
            WHERE estado = 'pendiente'
            ORDER BY fecha_solicitud DESC
        `);

        console.log(`📊 [DIAGNÓSTICO] Registros pendientes: ${pendientes.rows.length}`);
        pendientes.rows.forEach((row, idx) => {
            console.log(`   ${idx+1}. ID ${row.id}: ${row.tipo_solicitud} | ${row.email_usuario} | Confirmado: ${row.email_confirmado}`);
        });

        res.json({
            success: true,
            pendientes: pendientes.rows,
            total: pendientes.rows.length
        });

        console.log('\n✅ [DIAGNÓSTICO] Completado\n');

    } catch (error) {
        console.error('❌ [DIAGNÓSTICO] Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/diagnostico-aprobaciones/comparar
 * Comparar lo que la BD tiene vs lo que el endpoint normal retorna
 */
router.get('/comparar', async (req, res) => {
    console.log('\n🔍 [DIAGNÓSTICO] Comparando BD vs endpoint GET...\n');

    try {
        // BD real
        const bdReal = await pool.query(`
            SELECT COUNT(*) as total
            FROM pendientes_aprobacion
            WHERE estado = 'pendiente'
        `);

        // Lo que retorna el endpoint normal
        const endpointNormal = await pool.query(`
            SELECT * FROM pendientes_aprobacion
            WHERE estado = 'pendiente'
            ORDER BY fecha_solicitud DESC
            LIMIT 100
        `);

        console.log(`📊 [DIAGNÓSTICO] BD real: ${bdReal.rows[0].total} pendientes`);
        console.log(`📊 [DIAGNÓSTICO] Endpoint retorna: ${endpointNormal.rows.length} registros`);

        res.json({
            success: true,
            bd_real_total: bdReal.rows[0].total,
            endpoint_retorna: endpointNormal.rows.length,
            registros: endpointNormal.rows,
            corresponden: bdReal.rows[0].total === endpointNormal.rows.length
        });

        console.log('\n✅ [DIAGNÓSTICO] Completado\n');

    } catch (error) {
        console.error('❌ [DIAGNÓSTICO] Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
