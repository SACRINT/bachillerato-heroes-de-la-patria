/**
 * 📊 CHARTS DATA ROUTES
 * Endpoints para datos de gráficas del dashboard
 * Fecha: 18 de Octubre, 2025
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

/**
 * GET /api/charts/noticias-por-mes
 * Datos para gráfica de línea: Noticias publicadas por mes (últimos 12 meses)
 */
router.get('/noticias-por-mes', async (req, res) => {
    try {
        const query = `
            SELECT
                TO_CHAR(fecha_publicacion, 'Mon YYYY') as mes,
                DATE_TRUNC('month', fecha_publicacion) as fecha_mes,
                COUNT(*) as total
            FROM noticias
            WHERE fecha_publicacion >= CURRENT_DATE - INTERVAL '12 months'
            AND estado = 'publicada'
            GROUP BY DATE_TRUNC('month', fecha_publicacion), TO_CHAR(fecha_publicacion, 'Mon YYYY')
            ORDER BY fecha_mes ASC
        `;

        const result = await pool.query(query);

        // Formatear datos para Chart.js
        const labels = result.rows.map(row => row.mes);
        const data = result.rows.map(row => parseInt(row.total));

        res.json({
            success: true,
            labels,
            datasets: [{
                label: 'Noticias Publicadas',
                data,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4
            }]
        });
    } catch (error) {
        console.error('Error en /noticias-por-mes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener datos de noticias por mes'
        });
    }
});

/**
 * GET /api/charts/eventos-por-categoria
 * Datos para gráfica de barras: Eventos por categoría
 */
router.get('/eventos-por-categoria', async (req, res) => {
    try {
        const query = `
            SELECT
                categoria,
                COUNT(*) as total
            FROM eventos
            WHERE estado = 'publicado'
            GROUP BY categoria
            ORDER BY total DESC
        `;

        const result = await pool.query(query);

        // Formatear datos para Chart.js
        const labels = result.rows.map(row => row.categoria || 'Sin categoría');
        const data = result.rows.map(row => parseInt(row.total));

        // Colores para cada categoría
        const backgroundColors = [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)',
            'rgba(199, 199, 199, 0.7)',
            'rgba(83, 102, 255, 0.7)'
        ];

        res.json({
            success: true,
            labels,
            datasets: [{
                label: 'Eventos por Categoría',
                data,
                backgroundColor: backgroundColors.slice(0, labels.length),
                borderColor: backgroundColors.map(color => color.replace('0.7', '1')).slice(0, labels.length),
                borderWidth: 1
            }]
        });
    } catch (error) {
        console.error('Error en /eventos-por-categoria:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener eventos por categoría'
        });
    }
});

/**
 * GET /api/charts/quejas-por-tipo
 * Datos para gráfica de pie: Distribución de quejas por tipo
 */
router.get('/quejas-por-tipo', async (req, res) => {
    try {
        const query = `
            SELECT
                subject as tipo,
                COUNT(*) as total
            FROM quejas
            GROUP BY subject
            ORDER BY total DESC
            LIMIT 6
        `;

        const result = await pool.query(query);

        // Formatear datos para Chart.js
        const labels = result.rows.map(row => row.tipo || 'Sin especificar');
        const data = result.rows.map(row => parseInt(row.total));

        // Colores para el pie chart
        const backgroundColors = [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)'
        ];

        res.json({
            success: true,
            labels,
            datasets: [{
                label: 'Quejas por Tipo',
                data,
                backgroundColor: backgroundColors.slice(0, labels.length),
                borderColor: '#fff',
                borderWidth: 2
            }]
        });
    } catch (error) {
        console.error('Error en /quejas-por-tipo:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener quejas por tipo'
        });
    }
});

/**
 * GET /api/charts/suscriptores-crecimiento
 * Datos para gráfica de área: Crecimiento de suscriptores (últimos 12 meses)
 */
router.get('/suscriptores-crecimiento', async (req, res) => {
    try {
        const query = `
            SELECT
                TO_CHAR(fecha_suscripcion, 'Mon YYYY') as mes,
                DATE_TRUNC('month', fecha_suscripcion) as fecha_mes,
                COUNT(*) as nuevos,
                SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', fecha_suscripcion)) as acumulado
            FROM suscriptores_notificaciones
            WHERE fecha_suscripcion >= CURRENT_DATE - INTERVAL '12 months'
            AND estado = 'activo'
            GROUP BY DATE_TRUNC('month', fecha_suscripcion), TO_CHAR(fecha_suscripcion, 'Mon YYYY')
            ORDER BY fecha_mes ASC
        `;

        const result = await pool.query(query);

        // Formatear datos para Chart.js
        const labels = result.rows.map(row => row.mes);
        const dataNuevos = result.rows.map(row => parseInt(row.nuevos));
        const dataAcumulado = result.rows.map(row => parseInt(row.acumulado));

        res.json({
            success: true,
            labels,
            datasets: [
                {
                    label: 'Nuevos Suscriptores',
                    data: dataNuevos,
                    fill: true,
                    backgroundColor: 'rgba(75, 192, 192, 0.3)',
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.4
                },
                {
                    label: 'Total Acumulado',
                    data: dataAcumulado,
                    fill: true,
                    backgroundColor: 'rgba(54, 162, 235, 0.3)',
                    borderColor: 'rgb(54, 162, 235)',
                    tension: 0.4
                }
            ]
        });
    } catch (error) {
        console.error('Error en /suscriptores-crecimiento:', error);

        // Si la tabla no existe, devolver datos vacíos en lugar de error
        if (error.code === '42P01') {
            console.warn('⚠️ Tabla "suscriptores" no existe - devolviendo datos vacíos');
            return res.json({
                success: true,
                labels: [],
                datasets: [
                    {
                        label: 'Nuevos Suscriptores',
                        data: [],
                        fill: true,
                        backgroundColor: 'rgba(75, 192, 192, 0.3)',
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.4
                    },
                    {
                        label: 'Acumulado',
                        data: [],
                        fill: false,
                        borderColor: 'rgb(255, 99, 132)',
                        borderDash: [5, 5],
                        tension: 0.4
                    }
                ]
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error al obtener crecimiento de suscriptores'
        });
    }
});

/**
 * GET /api/charts/resumen-general
 * Datos para múltiples gráficas pequeñas en el dashboard
 */
router.get('/resumen-general', async (req, res) => {
    try {
        const [
            noticiasResult,
            eventosResult,
            quejasResult,
            suscriptoresResult
        ] = await Promise.all([
            // Total de noticias por estado
            pool.query(`
                SELECT
                    estado,
                    COUNT(*) as total
                FROM noticias
                GROUP BY estado
            `),
            // Eventos próximos vs pasados
            pool.query(`
                SELECT
                    CASE
                        WHEN fecha_inicio > CURRENT_DATE THEN 'Próximos'
                        WHEN fecha_inicio <= CURRENT_DATE AND fecha_fin >= CURRENT_DATE THEN 'En curso'
                        ELSE 'Pasados'
                    END as tipo,
                    COUNT(*) as total
                FROM eventos
                WHERE estado = 'publicado'
                GROUP BY tipo
            `),
            // Quejas por estado
            pool.query(`
                SELECT
                    status,
                    COUNT(*) as total
                FROM quejas
                GROUP BY status
            `),
            // Suscriptores activos vs inactivos
            pool.query(`
                SELECT
                    CASE
                        WHEN estado = 'activo' THEN 'Activos'
                        ELSE 'Inactivos'
                    END as estado_sub,
                    COUNT(*) as total
                FROM suscriptores_notificaciones
                GROUP BY estado
            `)
        ]);

        res.json({
            success: true,
            noticias: {
                labels: noticiasResult.rows.map(r => r.estado),
                data: noticiasResult.rows.map(r => parseInt(r.total))
            },
            eventos: {
                labels: eventosResult.rows.map(r => r.tipo),
                data: eventosResult.rows.map(r => parseInt(r.total))
            },
            quejas: {
                labels: quejasResult.rows.map(r => r.status),
                data: quejasResult.rows.map(r => parseInt(r.total))
            },
            suscriptores: {
                labels: suscriptoresResult.rows.map(r => r.estado),
                data: suscriptoresResult.rows.map(r => parseInt(r.total))
            }
        });
    } catch (error) {
        console.error('Error en /resumen-general:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener resumen general'
        });
    }
});

module.exports = router;
