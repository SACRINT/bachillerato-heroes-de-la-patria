/**
 * 📊 ANALYTICS DASHBOARD ROUTES
 * Endpoint para estadísticas del dashboard administrativo
 * INTEGRADO CON POSTGRESQL - 18 Oct 2025
 * ✅ FASE 3: Migrado a DAO
 */

const express = require('express');
const router = express.Router();
// ✅ FASE 3: Using DAO layer
const AnalyticsDashboardDAO = require('../data/analytics-dashboard.dao');

// ============================================
// GET /api/analytics/dashboard
// ============================================
router.get('/dashboard', async (req, res) => {
    try {
        const rawStats = await AnalyticsDashboardDAO.getDashboardStats();
        const { contactos = {}, quejas = {}, inscripciones = {}, egresados = {}, solicitudes = {}, citas = {}, noticias = {}, eventos = {}, avisos = {}, comunicados = {} } = rawStats || {};

        const stats = {
            mensajes: {
                total: parseInt(contactos.total || 0) + parseInt(quejas.total || 0),
                pendientes: parseInt(contactos.pendientes || 0) + parseInt(quejas.pendientes || 0),
                respondidos: parseInt(contactos.respondidos || 0),
                tendencia: '+N/A'
            },
            inscripciones: {
                total: parseInt(inscripciones.total || 0),
                aprobadas: parseInt(inscripciones.aprobadas || 0),
                pendientes: parseInt(inscripciones.pendientes || 0),
                rechazadas: parseInt(inscripciones.rechazadas || 0),
                tendencia: '+N/A'
            },
            egresados: {
                total: parseInt(egresados.total || 0),
                verificados: parseInt(egresados.verificados || 0),
                con_cv: parseInt(egresados.con_cv || 0),
                tendencia: '+N/A'
            },
            solicitudes: {
                total: parseInt(solicitudes.total || 0),
                pendientes: parseInt(solicitudes.pendientes || 0),
                tendencia: '+N/A'
            },
            citas: {
                total: parseInt(citas.total || 0),
                pendientes: parseInt(citas.pendientes || 0),
                confirmadas: parseInt(citas.confirmadas || 0),
                tendencia: '+N/A'
            },
            cms: {
                noticias: parseInt(noticias.total || 0),
                eventos: parseInt(eventos.total || 0),
                avisos: parseInt(avisos.total || 0),
                comunicados: parseInt(comunicados.total || 0),
                total: parseInt(noticias.total || 0) + parseInt(eventos.total || 0) + parseInt(avisos.total || 0) + parseInt(comunicados.total || 0)
            },
            resumen: {
                total_actividad: parseInt(contactos.total || 0) + parseInt(quejas.total || 0) + parseInt(inscripciones.total || 0) + parseInt(solicitudes.total || 0),
                pendientes_atencion: parseInt(contactos.pendientes || 0) + parseInt(quejas.pendientes || 0) + parseInt(inscripciones.pendientes || 0) + parseInt(solicitudes.pendientes || 0),
                contenido_publicado: parseInt(noticias.total || 0) + parseInt(eventos.total || 0) + parseInt(avisos.total || 0) + parseInt(comunicados.total || 0)
            }
        };

        res.json({ success: true, data: stats, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('ANALYTICS_DASHBOARD', '❌ Error obteniendo estadísticas del dashboard:', error);
        res.status(500).json({ success: false, message: 'Error obteniendo estadísticas', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
});

// ============================================
// GET /api/analytics/dashboard/recent-activity
// ============================================
router.get('/dashboard/recent-activity', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const allActivities = await AnalyticsDashboardDAO.getRecentActivity();
        allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const activities = allActivities.slice(0, limit).map((activity, index) => ({
            id: index + 1, tipo: activity.tipo, usuario: activity.nombre || 'Usuario',
            accion: activity.accion, timestamp: activity.timestamp, email: activity.email
        }));
        res.json({ success: true, data: activities, total: activities.length });
    } catch (error) {
        console.error('ANALYTICS_DASHBOARD', '❌ Error obteniendo actividad reciente:', error);
        res.status(500).json({ success: false, message: 'Error obteniendo actividad reciente' });
    }
});

// ============================================
// GET /api/analytics/dashboard/charts
// ============================================
router.get('/dashboard/charts', async (req, res) => {
    try {
        const type = req.query.type || 'all';
        const chartsData = await AnalyticsDashboardDAO.getChartsData();
        const actividadGeneral = await AnalyticsDashboardDAO.getGeneralActivity();

        const charts = {
            inscripciones_mes: {
                labels: chartsData.inscripcionesMes.length > 0 ? chartsData.inscripcionesMes.map(row => row.mes.substring(0, 3)) : ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                data: chartsData.inscripcionesMes.length > 0 ? chartsData.inscripcionesMes.map(row => parseInt(row.total)) : [0, 0, 0, 0, 0, 0]
            },
            mensajes_tipo: { labels: chartsData.mensajesTipo.map(row => row.tipo), data: chartsData.mensajesTipo.map(row => parseInt(row.total)) },
            contenido_cms: {
                labels: ['Noticias', 'Eventos', 'Avisos', 'Comunicados'],
                data: [parseInt(chartsData.contenidoCMS.noticias), parseInt(chartsData.contenidoCMS.eventos), parseInt(chartsData.contenidoCMS.avisos), parseInt(chartsData.contenidoCMS.comunicados)]
            },
            actividad_general: { labels: ['Inscripciones', 'Mensajes', 'Egresados', 'Citas'], data: actividadGeneral }
        };

        const response = type === 'all' ? charts : { [type]: charts[type] };
        res.json({ success: true, data: response, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('ANALYTICS_DASHBOARD', '❌ Error obteniendo datos de gráficas:', error);
        res.status(500).json({ success: false, message: 'Error obteniendo datos de gráficas' });
    }
});

module.exports = router;
