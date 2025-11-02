/**
 * 📊 ANALYTICS DASHBOARD ROUTES
 * Endpoint para estadísticas del dashboard administrativo
 * INTEGRADO CON POSTGRESQL - 18 Oct 2025
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// ============================================
// GET /api/analytics/dashboard
// Obtener estadísticas del dashboard
// ============================================
router.get('/dashboard', async (req, res) => {
    try {
        // Obtener todas las estadísticas en paralelo
        const [
            contactosResult,
            quejasResult,
            inscripcionesResult,
            egresadosResult,
            solicitudesResult,
            citasResult,
            noticiasResult,
            eventosResult,
            avisosResult,
            comunicadosResult
        ] = await Promise.all([
            // Contactos
            pool.query(`
                SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'pendiente') as pendientes,
                    COUNT(*) FILTER (WHERE status = 'respondida') as respondidos
                FROM contactos
            `),
            // Quejas
            pool.query(`
                SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'pendiente') as pendientes
                FROM quejas
            `),
            // Inscripciones
            pool.query(`
                SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'approved') as aprobadas,
                    COUNT(*) FILTER (WHERE status = 'pending') as pendientes,
                    COUNT(*) FILTER (WHERE status = 'rejected') as rechazadas
                FROM inscripciones_actividades
            `),
            // Egresados
            pool.query(`
                SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE verificado = true) as verificados,
                    COUNT(*) FILTER (WHERE historia_exito IS NOT NULL) as con_cv
                FROM egresados
            `),
            // Solicitudes de documentos
            pool.query(`
                SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'pendiente') as pendientes
                FROM solicitudes_documentos
            `),
            // Citas
            pool.query(`
                SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
                    COUNT(*) FILTER (WHERE estado = 'aprobada') as confirmadas
                FROM citas
            `),
            // Noticias
            pool.query(`SELECT COUNT(*) as total FROM noticias WHERE estado = 'publicada'`),
            // Eventos
            pool.query(`SELECT COUNT(*) as total FROM eventos WHERE estado = 'publicado'`),
            // Avisos
            pool.query(`SELECT COUNT(*) as total FROM avisos WHERE estado = 'publicada'`),
            // Comunicados
            pool.query(`SELECT COUNT(*) as total FROM comunicados WHERE estado = 'publicada'`)
        ]);

        // Extraer datos con valores por defecto si no hay resultados
        const contactos = contactosResult.rows[0] || { total: 0, pendientes: 0, respondidos: 0 };
        const quejas = quejasResult.rows[0] || { total: 0, pendientes: 0 };
        const inscripciones = inscripcionesResult.rows[0] || { total: 0, aprobadas: 0, pendientes: 0, rechazadas: 0 };
        const egresados = egresadosResult.rows[0] || { total: 0, verificados: 0, con_cv: 0 };
        const solicitudes = solicitudesResult.rows[0] || { total: 0, pendientes: 0 };
        const citas = citasResult.rows[0] || { total: 0, pendientes: 0, confirmadas: 0 };
        const noticias = noticiasResult.rows[0] || { total: 0 };
        const eventos = eventosResult.rows[0] || { total: 0 };
        const avisos = avisosResult.rows[0] || { total: 0 };
        const comunicados = comunicadosResult.rows[0] || { total: 0 };

        // Construir respuesta con datos reales
        const stats = {
            mensajes: {
                total: parseInt(contactos.total) + parseInt(quejas.total),
                pendientes: parseInt(contactos.pendientes) + parseInt(quejas.pendientes),
                respondidos: parseInt(contactos.respondidos),
                tendencia: calcularTendencia(parseInt(contactos.total))
            },
            inscripciones: {
                total: parseInt(inscripciones.total),
                aprobadas: parseInt(inscripciones.aprobadas),
                pendientes: parseInt(inscripciones.pendientes),
                rechazadas: parseInt(inscripciones.rechazadas),
                tendencia: calcularTendencia(parseInt(inscripciones.total))
            },
            egresados: {
                total: parseInt(egresados.total),
                verificados: parseInt(egresados.verificados),
                con_cv: parseInt(egresados.con_cv),
                tendencia: calcularTendencia(parseInt(egresados.total))
            },
            solicitudes: {
                total: parseInt(solicitudes.total),
                pendientes: parseInt(solicitudes.pendientes),
                tendencia: calcularTendencia(parseInt(solicitudes.total))
            },
            citas: {
                total: parseInt(citas.total),
                pendientes: parseInt(citas.pendientes),
                confirmadas: parseInt(citas.confirmadas),
                tendencia: calcularTendencia(parseInt(citas.total))
            },
            cms: {
                noticias: parseInt(noticias.total),
                eventos: parseInt(eventos.total),
                avisos: parseInt(avisos.total),
                comunicados: parseInt(comunicados.total),
                total: parseInt(noticias.total) + parseInt(eventos.total) +
                       parseInt(avisos.total) + parseInt(comunicados.total)
            },
            resumen: {
                total_actividad: parseInt(contactos.total) + parseInt(quejas.total) +
                                parseInt(inscripciones.total) + parseInt(solicitudes.total),
                pendientes_atencion: parseInt(contactos.pendientes) + parseInt(quejas.pendientes) +
                                    parseInt(inscripciones.pendientes) + parseInt(solicitudes.pendientes),
                contenido_publicado: parseInt(noticias.total) + parseInt(eventos.total) +
                                    parseInt(avisos.total) + parseInt(comunicados.total)
            }
        };

        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas del dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo estadísticas',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * Calcular tendencia basada en el total
 * TODO: Implementar cálculo real comparando con mes anterior
 */
function calcularTendencia(total) {
    if (total === 0) return '0%';
    // Por ahora retornar un valor indicativo
    return '+N/A';
}

// ============================================
// GET /api/analytics/dashboard/recent-activity
// Obtener actividad reciente desde PostgreSQL
// ============================================
router.get('/dashboard/recent-activity', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        // Obtener actividades de diferentes fuentes
        const [contactosRecent, quejasRecent, inscripcionesRecent, egresadosRecent, citasRecent] = await Promise.all([
            pool.query(`
                SELECT 'contacto' as tipo, nombre, email, fecha_creacion as timestamp, 'Nuevo mensaje de contacto' as accion
                FROM contactos
                ORDER BY fecha_creacion DESC
                LIMIT $1
            `, [3]),
            pool.query(`
                SELECT 'queja' as tipo, nombre, email, fecha_creacion as timestamp, 'Nueva queja registrada' as accion
                FROM quejas
                ORDER BY fecha_creacion DESC
                LIMIT $1
            `, [3]),
            pool.query(`
                SELECT 'inscripcion' as tipo, student_name as nombre, student_email as email, fecha_solicitud as timestamp,
                       CONCAT('Inscripción a ', activity_name) as accion
                FROM inscripciones_actividades
                ORDER BY fecha_solicitud DESC
                LIMIT $1
            `, [3]),
            pool.query(`
                SELECT 'egresado' as tipo, nombre_completo as nombre, email, created_at as timestamp, 'Nuevo perfil de egresado' as accion
                FROM egresados
                ORDER BY created_at DESC
                LIMIT $1
            `, [2]),
            pool.query(`
                SELECT 'cita' as tipo, nombre_completo as nombre, email, created_at as timestamp, 'Nueva solicitud de cita' as accion
                FROM citas
                ORDER BY created_at DESC
                LIMIT $1
            `, [2])
        ]);

        // Combinar y ordenar todas las actividades
        const allActivities = [
            ...contactosRecent.rows,
            ...quejasRecent.rows,
            ...inscripcionesRecent.rows,
            ...egresadosRecent.rows,
            ...citasRecent.rows
        ];

        // Ordenar por timestamp descendente
        allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Formatear actividades
        const activities = allActivities.slice(0, limit).map((activity, index) => ({
            id: index + 1,
            tipo: activity.tipo,
            usuario: activity.nombre || 'Usuario',
            accion: activity.accion,
            timestamp: activity.timestamp,
            email: activity.email
        }));

        res.json({
            success: true,
            data: activities,
            total: activities.length
        });

    } catch (error) {
        console.error('❌ Error obteniendo actividad reciente:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo actividad reciente'
        });
    }
});

// ============================================
// GET /api/analytics/dashboard/charts
// Obtener datos para gráficas desde PostgreSQL
// ============================================
router.get('/dashboard/charts', async (req, res) => {
    try {
        const type = req.query.type || 'all';

        // Obtener inscripciones por mes (últimos 6 meses)
        const inscripcionesMes = await pool.query(`
            SELECT
                TO_CHAR(fecha_solicitud, 'TMMonth') as mes,
                EXTRACT(MONTH FROM fecha_solicitud) as mes_num,
                COUNT(*) as total
            FROM inscripciones_actividades
            WHERE fecha_solicitud >= CURRENT_DATE - INTERVAL '6 months'
            GROUP BY mes_num, mes
            ORDER BY mes_num ASC
        `);

        // Obtener mensajes por tipo
        const mensajesTipo = await pool.query(`
            SELECT
                'Contacto' as tipo,
                COUNT(*) as total
            FROM contactos
            UNION ALL
            SELECT
                'Quejas' as tipo,
                COUNT(*) as total
            FROM quejas
            UNION ALL
            SELECT
                'Solicitudes' as tipo,
                COUNT(*) as total
            FROM solicitudes_documentos
            UNION ALL
            SELECT
                'Citas' as tipo,
                COUNT(*) as total
            FROM citas
        `);

        // Obtener contenido CMS publicado
        const contenidoCMS = await Promise.all([
            pool.query(`SELECT COUNT(*) as total FROM noticias WHERE estado = 'publicada'`),
            pool.query(`SELECT COUNT(*) as total FROM eventos WHERE estado = 'publicado'`),
            pool.query(`SELECT COUNT(*) as total FROM avisos WHERE estado = 'publicada'`),
            pool.query(`SELECT COUNT(*) as total FROM comunicados WHERE estado = 'publicada'`)
        ]);

        // Formatear datos para gráficas
        const charts = {
            inscripciones_mes: {
                labels: inscripcionesMes.rows.length > 0
                    ? inscripcionesMes.rows.map(row => row.mes.substring(0, 3))
                    : ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                data: inscripcionesMes.rows.length > 0
                    ? inscripcionesMes.rows.map(row => parseInt(row.total))
                    : [0, 0, 0, 0, 0, 0]
            },
            mensajes_tipo: {
                labels: mensajesTipo.rows.map(row => row.tipo),
                data: mensajesTipo.rows.map(row => parseInt(row.total))
            },
            contenido_cms: {
                labels: ['Noticias', 'Eventos', 'Avisos', 'Comunicados'],
                data: [
                    parseInt(contenidoCMS[0].rows[0]?.total || 0),
                    parseInt(contenidoCMS[1].rows[0]?.total || 0),
                    parseInt(contenidoCMS[2].rows[0]?.total || 0),
                    parseInt(contenidoCMS[3].rows[0]?.total || 0)
                ]
            },
            actividad_general: {
                labels: ['Inscripciones', 'Mensajes', 'Egresados', 'Citas'],
                data: await obtenerActividadGeneral()
            }
        };

        const response = type === 'all' ? charts : { [type]: charts[type] };

        res.json({
            success: true,
            data: response,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error obteniendo datos de gráficas:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo datos de gráficas'
        });
    }
});

/**
 * Obtener actividad general por categoría
 */
async function obtenerActividadGeneral() {
    const [inscripciones, mensajes, egresados, citas] = await Promise.all([
        pool.query(`SELECT COUNT(*) as total FROM inscripciones_actividades`),
        pool.query(`SELECT COUNT(*) as total FROM contactos`),
        pool.query(`SELECT COUNT(*) as total FROM egresados`),
        pool.query(`SELECT COUNT(*) as total FROM citas`)
    ]);

    return [
        parseInt(inscripciones.rows[0]?.total || 0),
        parseInt(mensajes.rows[0]?.total || 0),
        parseInt(egresados.rows[0]?.total || 0),
        parseInt(citas.rows[0]?.total || 0)
    ];
}

module.exports = router;
