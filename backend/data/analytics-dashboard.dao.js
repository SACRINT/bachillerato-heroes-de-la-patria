/**
 * 📊 ANALYTICS DASHBOARD DAO @author Gemini Code @date 2025-12-05
 */
const { executeQuery } = require('../config/database');

class AnalyticsDashboardDAO {
    static async getDashboardStats() {
        const [contactos, quejas, inscripciones, egresados, solicitudes, citas, noticias, eventos, avisos, comunicados] = await Promise.all([
            executeQuery(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'pendiente') as pendientes, COUNT(*) FILTER (WHERE status = 'respondida') as respondidos FROM contactos`, []),
            executeQuery(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'pendiente') as pendientes FROM quejas`, []),
            executeQuery(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'approved') as aprobadas, COUNT(*) FILTER (WHERE status = 'pending') as pendientes, COUNT(*) FILTER (WHERE status = 'rejected') as rechazadas FROM inscripciones_actividades`, []),
            executeQuery(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE verificado = true) as verificados, COUNT(*) FILTER (WHERE historia_exito IS NOT NULL) as con_cv FROM egresados`, []),
            executeQuery(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'pendiente') as pendientes FROM solicitudes_documentos`, []),
            executeQuery(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes, COUNT(*) FILTER (WHERE estado = 'aprobada') as confirmadas FROM citas`, []),
            executeQuery(`SELECT COUNT(*) as total FROM noticias WHERE estado = 'publicada'`, []),
            executeQuery(`SELECT COUNT(*) as total FROM eventos WHERE estado = 'publicado'`, []),
            executeQuery(`SELECT COUNT(*) as total FROM avisos WHERE estado = 'publicada'`, []),
            executeQuery(`SELECT COUNT(*) as total FROM comunicados WHERE estado = 'publicada'`, [])
        ]);
        return { contactos: contactos[0], quejas: quejas[0], inscripciones: inscripciones[0], egresados: egresados[0], solicitudes: solicitudes[0], citas: citas[0], noticias: noticias[0], eventos: eventos[0], avisos: avisos[0], comunicados: comunicados[0] };
    }

    static async getRecentActivity(limits = { contactos: 3, quejas: 3, inscripciones: 3, egresados: 2, citas: 2 }) {
        const [contactos, quejas, inscripciones, egresados, citas] = await Promise.all([
            executeQuery(`SELECT 'contacto' as tipo, nombre, email, fecha_creacion as timestamp, 'Nuevo mensaje de contacto' as accion FROM contactos ORDER BY fecha_creacion DESC LIMIT $1`, [limits.contactos]),
            executeQuery(`SELECT 'queja' as tipo, nombre, email, fecha_creacion as timestamp, 'Nueva queja registrada' as accion FROM quejas ORDER BY fecha_creacion DESC LIMIT $1`, [limits.quejas]),
            executeQuery(`SELECT 'inscripcion' as tipo, student_name as nombre, student_email as email, fecha_solicitud as timestamp, CONCAT('Inscripción a ', activity_name) as accion FROM inscripciones_actividades ORDER BY fecha_solicitud DESC LIMIT $1`, [limits.inscripciones]),
            executeQuery(`SELECT 'egresado' as tipo, nombre_completo as nombre, email, created_at as timestamp, 'Nuevo perfil de egresado' as accion FROM egresados ORDER BY created_at DESC LIMIT $1`, [limits.egresados]),
            executeQuery(`SELECT 'cita' as tipo, nombre_completo as nombre, email, created_at as timestamp, 'Nueva solicitud de cita' as accion FROM citas ORDER BY created_at DESC LIMIT $1`, [limits.citas])
        ]);
        return [...contactos, ...quejas, ...inscripciones, ...egresados, ...citas];
    }

    static async getChartsData() {
        const inscripcionesMes = await executeQuery(`SELECT TO_CHAR(fecha_solicitud, 'TMMonth') as mes, EXTRACT(MONTH FROM fecha_solicitud) as mes_num, COUNT(*) as total FROM inscripciones_actividades WHERE fecha_solicitud >= CURRENT_DATE - INTERVAL '6 months' GROUP BY mes_num, mes ORDER BY mes_num ASC`, []);
        const mensajesTipo = await executeQuery(`SELECT 'Contacto' as tipo, COUNT(*) as total FROM contactos UNION ALL SELECT 'Quejas', COUNT(*) FROM quejas UNION ALL SELECT 'Solicitudes', COUNT(*) FROM solicitudes_documentos UNION ALL SELECT 'Citas', COUNT(*) FROM citas`, []);
        const [noticias, eventos, avisos, comunicados] = await Promise.all([
            executeQuery(`SELECT COUNT(*) as total FROM noticias WHERE estado = 'publicada'`, []),
            executeQuery(`SELECT COUNT(*) as total FROM eventos WHERE estado = 'publicado'`, []),
            executeQuery(`SELECT COUNT(*) as total FROM avisos WHERE estado = 'publicada'`, []),
            executeQuery(`SELECT COUNT(*) as total FROM comunicados WHERE estado = 'publicada'`, [])
        ]);
        return { inscripcionesMes, mensajesTipo, contenidoCMS: { noticias: noticias[0]?.total || 0, eventos: eventos[0]?.total || 0, avisos: avisos[0]?.total || 0, comunicados: comunicados[0]?.total || 0 } };
    }

    static async getGeneralActivity() {
        const [inscripciones, mensajes, egresados, citas] = await Promise.all([
            executeQuery(`SELECT COUNT(*) as total FROM inscripciones_actividades`, []),
            executeQuery(`SELECT COUNT(*) as total FROM contactos`, []),
            executeQuery(`SELECT COUNT(*) as total FROM egresados`, []),
            executeQuery(`SELECT COUNT(*) as total FROM citas`, [])
        ]);
        return [parseInt(inscripciones[0]?.total || 0), parseInt(mensajes[0]?.total || 0), parseInt(egresados[0]?.total || 0), parseInt(citas[0]?.total || 0)];
    }
}
module.exports = AnalyticsDashboardDAO;
