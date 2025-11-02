/**
 * 💰 API DE FINANZAS - PostgreSQL
 * Gestión de ingresos, gastos y pagos pendientes
 * Fecha: 31 Octubre 2025
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// =====================================================
// GET /api/finances - Obtener resumen financiero completo
// =====================================================
router.get('/', async (req, res) => {
    try {
        console.log('💰 [FINANCES] Obteniendo datos financieros...');

        // Verificar si las tablas existen
        const tablesCheck = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('ingresos', 'gastos', 'pagos_pendientes')
        `);

        const existingTables = tablesCheck.rows.map(r => r.table_name);
        console.log('📋 Tablas encontradas:', existingTables);

        let ingresos = [];
        let gastos = [];
        let pagosPendientes = [];
        let resumen = {
            ingresosMes: 0,
            pagosPendientes: 0,
            tasaCobro: 0,
            gastosMes: 0,
            utilidadMes: 0
        };

        // Cargar ingresos si la tabla existe
        if (existingTables.includes('ingresos')) {
            const ingresosResult = await pool.query(`
                SELECT
                    id,
                    concepto,
                    categoria,
                    monto,
                    fecha,
                    estado,
                    metodo_pago,
                    comprobante,
                    notas,
                    fecha_registro
                FROM ingresos
                ORDER BY fecha DESC
                LIMIT 100
            `);
            ingresos = ingresosResult.rows;

            // Calcular ingresos del mes actual
            const ingresosMesResult = await pool.query(`
                SELECT COALESCE(SUM(monto), 0) as total
                FROM ingresos
                WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE)
                AND estado = 'Recibido'
            `);
            resumen.ingresosMes = parseFloat(ingresosMesResult.rows[0].total);
        }

        // Cargar gastos si la tabla existe
        if (existingTables.includes('gastos')) {
            const gastosResult = await pool.query(`
                SELECT
                    id,
                    concepto,
                    categoria,
                    monto,
                    fecha,
                    estado,
                    proveedor,
                    comprobante,
                    notas,
                    fecha_registro
                FROM gastos
                ORDER BY fecha DESC
                LIMIT 100
            `);
            gastos = gastosResult.rows;

            // Calcular gastos del mes actual
            const gastosMesResult = await pool.query(`
                SELECT COALESCE(SUM(monto), 0) as total
                FROM gastos
                WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE)
                AND estado = 'Pagado'
            `);
            resumen.gastosMes = parseFloat(gastosMesResult.rows[0].total);
        }

        // Cargar pagos pendientes si la tabla existe
        if (existingTables.includes('pagos_pendientes')) {
            const pagosPendientesResult = await pool.query(`
                SELECT
                    id,
                    estudiante,
                    concepto,
                    monto,
                    fecha_vencimiento,
                    estado,
                    notas,
                    fecha_registro
                FROM pagos_pendientes
                WHERE estado = 'Pendiente'
                ORDER BY fecha_vencimiento ASC
                LIMIT 100
            `);
            pagosPendientes = pagosPendientesResult.rows;

            // Calcular total de pagos pendientes
            const totalPendienteResult = await pool.query(`
                SELECT COALESCE(SUM(monto), 0) as total
                FROM pagos_pendientes
                WHERE estado = 'Pendiente'
            `);
            resumen.pagosPendientes = parseFloat(totalPendienteResult.rows[0].total);
        }

        // Calcular utilidad del mes
        resumen.utilidadMes = resumen.ingresosMes - resumen.gastosMes;

        // Calcular tasa de cobro (% de ingresos recibidos vs pendientes)
        if (resumen.ingresosMes > 0 || resumen.pagosPendientes > 0) {
            resumen.tasaCobro = Math.round(
                (resumen.ingresosMes / (resumen.ingresosMes + resumen.pagosPendientes)) * 100
            );
        }

        const response = {
            success: true,
            resumen,
            ingresos,
            gastos,
            pagosPendientes,
            estadisticas: {
                totalIngresos: ingresos.length,
                totalGastos: gastos.length,
                totalPendientes: pagosPendientes.length
            },
            configuracion: {
                ultimaActualizacion: new Date().toISOString(),
                version: "1.0",
                tablasDisponibles: existingTables
            }
        };

        console.log('✅ [FINANCES] Datos financieros obtenidos');

        res.json(response);

    } catch (error) {
        console.error('❌ [FINANCES] Error obteniendo datos financieros:', error);

        // Devolver estructura vacía en caso de error
        res.json({
            success: true,
            resumen: {
                ingresosMes: 0,
                pagosPendientes: 0,
                tasaCobro: 0,
                gastosMes: 0,
                utilidadMes: 0
            },
            ingresos: [],
            gastos: [],
            pagosPendientes: [],
            estadisticas: {},
            configuracion: {
                ultimaActualizacion: new Date().toISOString(),
                version: "1.0",
                error: error.message
            }
        });
    }
});

// =====================================================
// GET /api/finances/stats - Estadísticas financieras
// =====================================================
router.get('/stats', async (req, res) => {
    try {
        console.log('📊 [FINANCES] Obteniendo estadísticas financieras...');

        // Por ahora devolver estadísticas vacías
        res.json({
            success: true,
            data: {
                ingresosTotales: 0,
                gastosTotales: 0,
                utilidadNeta: 0,
                pagosPendientes: 0
            }
        });

    } catch (error) {
        console.error('❌ [FINANCES] Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas financieras'
        });
    }
});

module.exports = router;
