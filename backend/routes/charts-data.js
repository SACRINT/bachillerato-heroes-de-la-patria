/**
 * 📊 CHARTS DATA ROUTES
 * Endpoints para datos de gráficas del dashboard
 * ✅ FASE 3 DAL - Refactorizado para usar DAO
 * Fecha: 18 de Octubre, 2025
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger.js');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors.js');
const router = express.Router();

// ✅ FASE 3: Using DAO layer
const ChartsDataDAO = require('../data/charts-data.dao.js');

/**
 * GET /api/charts/noticias-por-mes
 * Datos para gráfica de línea: Noticias publicadas por mes (últimos 12 meses)
 */
router.get('/noticias-por-mes', async (req, res) => {
    try {
        // ✅ FASE 3: Using ChartsDataDAO
        const rows = await ChartsDataDAO.getNoticiasPorMes();

        // Formatear datos para Chart.js
        const labels = rows.map(row => row.mes);
        const data = rows.map(row => parseInt(row.total));

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
        debugLog.error('CHARTS_DATA', 'Error en /noticias-por-mes:', sanitizeError(error, 'charts-data'));
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
        // ✅ FASE 3: Using ChartsDataDAO
        const rows = await ChartsDataDAO.getEventosPorCategoria();

        // Formatear datos para Chart.js
        const labels = rows.map(row => row.categoria || 'Sin categoría');
        const data = rows.map(row => parseInt(row.total));

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
        debugLog.error('CHARTS_DATA', 'Error en /eventos-por-categoria:', sanitizeError(error, 'charts-data'));
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
        // ✅ FASE 3: Using ChartsDataDAO
        const rows = await ChartsDataDAO.getQuejasPorTipo();

        // Formatear datos para Chart.js
        const labels = rows.map(row => row.tipo || 'Sin especificar');
        const data = rows.map(row => parseInt(row.total));

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
        debugLog.error('CHARTS_DATA', 'Error en /quejas-por-tipo:', sanitizeError(error, 'charts-data'));
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
        // ✅ FASE 3: Using ChartsDataDAO
        const rows = await ChartsDataDAO.getSuscriptoresCrecimiento();

        // Formatear datos para Chart.js
        const labels = rows.map(row => row.mes);
        const dataNuevos = rows.map(row => parseInt(row.nuevos));
        const dataAcumulado = rows.map(row => parseInt(row.acumulado));

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
        debugLog.error('CHARTS_DATA', 'Error en /suscriptores-crecimiento:', sanitizeError(error, 'charts-data'));

        // Si la tabla no existe, devolver datos vacíos en lugar de error
        if (error.code === '42P01') {
            debugLog.log('CHARTS_DATA', '⚠️ Tabla "suscriptores" no existe - devolviendo datos vacíos');
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
        // ✅ FASE 3: Using ChartsDataDAO
        const { noticias, eventos, quejas, suscriptores } = await ChartsDataDAO.getResumenGeneral();

        res.json({
            success: true,
            noticias: {
                labels: noticias.map(r => r.estado),
                data: noticias.map(r => parseInt(r.total))
            },
            eventos: {
                labels: eventos.map(r => r.tipo),
                data: eventos.map(r => parseInt(r.total))
            },
            quejas: {
                labels: quejas.map(r => r.status),
                data: quejas.map(r => parseInt(r.total))
            },
            suscriptores: {
                labels: suscriptores.map(r => r.estado_sub),
                data: suscriptores.map(r => parseInt(r.total))
            }
        });
    } catch (error) {
        debugLog.error('CHARTS_DATA', 'Error en /resumen-general:', sanitizeError(error, 'charts-data'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener resumen general'
        });
    }
});

module.exports = router;
