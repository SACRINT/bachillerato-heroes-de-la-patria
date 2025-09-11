/**
 * 📊 RUTAS DE ANALÍTICAS Y REPORTES
 * Dashboard de métricas institucionales
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../config/database');
const { authenticateToken, requireAdmin, requireTeacher } = require('../middleware/auth');
const { logger } = require('../middleware/logger');
const router = express.Router();

// ============================================
// MÉTRICAS GENERALES (Admin y Docentes)
// ============================================

/**
 * GET /api/analytics/dashboard
 * Métricas principales del dashboard
 */
router.get('/dashboard', authenticateToken, requireTeacher, async (req, res, next) => {
    try {
        // Estadísticas de estudiantes
        const studentStats = await executeQuery(`
            SELECT 
                COUNT(*) as total_estudiantes,
                COUNT(CASE WHEN e.estatus = 'activo' THEN 1 END) as estudiantes_activos,
                COUNT(CASE WHEN e.estatus = 'egresado' THEN 1 END) as egresados,
                COUNT(CASE WHEN e.estatus = 'suspendido' THEN 1 END) as suspendidos,
                COUNT(DISTINCT e.especialidad) as especialidades_activas
            FROM estudiantes e
            JOIN usuarios u ON e.usuario_id = u.id
            WHERE u.activo = TRUE
        `);

        // Estadísticas de docentes
        const teacherStats = await executeQuery(`
            SELECT 
                COUNT(*) as total_docentes,
                COUNT(CASE WHEN d.tipo_contrato = 'base' THEN 1 END) as docentes_base,
                COUNT(CASE WHEN d.tipo_contrato = 'contrato' THEN 1 END) as docentes_contrato,
                COUNT(CASE WHEN d.tipo_contrato = 'honorarios' THEN 1 END) as docentes_honorarios,
                AVG(d.anos_experiencia) as promedio_experiencia
            FROM docentes d
            JOIN usuarios u ON d.usuario_id = u.id
            WHERE u.activo = TRUE
        `);

        // Estadísticas académicas actuales
        const academicStats = await executeQuery(`
            SELECT 
                COUNT(DISTINCT m.id) as materias_activas,
                COUNT(DISTINCT c.id) as cursos_disponibles,
                COUNT(im.id) as inscripciones_totales,
                AVG(cal.calificacion_final) as promedio_general
            FROM materias m
            JOIN cursos c ON m.curso_id = c.id
            LEFT JOIN inscripciones_materias im ON m.id = im.materia_id
            LEFT JOIN calificaciones cal ON m.id = cal.materia_id
            WHERE m.activa = TRUE
            AND cal.periodo = (SELECT MAX(periodo) FROM calificaciones WHERE YEAR(fecha_evaluacion) = YEAR(CURDATE()))
        `);

        // Actividad del chatbot (últimos 30 días)
        const chatbotStats = await executeQuery(`
            SELECT 
                COUNT(*) as total_mensajes,
                COUNT(DISTINCT session_id) as conversaciones_unicas,
                AVG(CASE WHEN satisfaction_rating IS NOT NULL THEN satisfaction_rating END) as satisfaccion_promedio,
                COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAYS) THEN 1 END) as mensajes_semana
            FROM chat_messages
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAYS)
        `);

        res.json({
            success: true,
            data: {
                students: studentStats[0],
                teachers: teacherStats[0],
                academic: academicStats[0],
                chatbot: chatbotStats[0]
            },
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/analytics/enrollment-trends
 * Tendencias de inscripción por período
 */
router.get('/enrollment-trends', authenticateToken, requireTeacher, async (req, res, next) => {
    try {
        const { months = 12 } = req.query;

        const trends = await executeQuery(`
            SELECT 
                DATE_FORMAT(e.fecha_ingreso, '%Y-%m') as periodo,
                COUNT(*) as nuevos_estudiantes,
                e.especialidad,
                COUNT(CASE WHEN e.estatus = 'activo' THEN 1 END) as actualmente_activos
            FROM estudiantes e
            JOIN usuarios u ON e.usuario_id = u.id
            WHERE e.fecha_ingreso >= DATE_SUB(NOW(), INTERVAL ? MONTH)
            AND u.activo = TRUE
            GROUP BY DATE_FORMAT(e.fecha_ingreso, '%Y-%m'), e.especialidad
            ORDER BY periodo DESC, e.especialidad
        `, [parseInt(months)]);

        // Resumen por especialidad
        const specialtyTrends = await executeQuery(`
            SELECT 
                e.especialidad,
                COUNT(*) as total_estudiantes,
                COUNT(CASE WHEN e.fecha_ingreso >= DATE_SUB(NOW(), INTERVAL 6 MONTH) THEN 1 END) as nuevos_6_meses,
                COUNT(CASE WHEN e.estatus = 'activo' THEN 1 END) as activos,
                COUNT(CASE WHEN e.estatus = 'egresado' THEN 1 END) as egresados
            FROM estudiantes e
            JOIN usuarios u ON e.usuario_id = u.id
            WHERE u.activo = TRUE
            GROUP BY e.especialidad
            ORDER BY total_estudiantes DESC
        `);

        res.json({
            success: true,
            data: {
                monthly_trends: trends,
                specialty_summary: specialtyTrends
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/analytics/academic-performance
 * Análisis de rendimiento académico
 */
router.get('/academic-performance', authenticateToken, requireTeacher, async (req, res, next) => {
    try {
        const { periodo, especialidad } = req.query;
        
        let periodCondition = '';
        let params = [];
        
        if (periodo) {
            periodCondition = 'AND cal.periodo = ?';
            params.push(periodo);
        } else {
            periodCondition = 'AND cal.periodo = (SELECT MAX(periodo) FROM calificaciones)';
        }

        // Estadísticas generales de calificaciones
        let performanceQuery = `
            SELECT 
                c.nombre as curso,
                e.especialidad,
                COUNT(cal.id) as total_evaluaciones,
                AVG(cal.calificacion_final) as promedio,
                COUNT(CASE WHEN cal.calificacion_final >= 9.0 THEN 1 END) as excelentes,
                COUNT(CASE WHEN cal.calificacion_final >= 8.0 AND cal.calificacion_final < 9.0 THEN 1 END) as muy_buenas,
                COUNT(CASE WHEN cal.calificacion_final >= 7.0 AND cal.calificacion_final < 8.0 THEN 1 END) as buenas,
                COUNT(CASE WHEN cal.calificacion_final < 7.0 THEN 1 END) as reprobadas,
                ROUND((COUNT(CASE WHEN cal.calificacion_final >= 7.0 THEN 1 END) / COUNT(cal.id)) * 100, 2) as porcentaje_aprobacion
            FROM calificaciones cal
            JOIN materias m ON cal.materia_id = m.id
            JOIN cursos c ON m.curso_id = c.id
            JOIN estudiantes e ON cal.estudiante_id = e.id
            WHERE 1=1 ${periodCondition}
        `;

        if (especialidad) {
            performanceQuery += ' AND e.especialidad = ?';
            params.push(especialidad);
        }

        performanceQuery += `
            GROUP BY c.id, e.especialidad
            ORDER BY promedio DESC
        `;

        const performance = await executeQuery(performanceQuery, params);

        // Top estudiantes por especialidad
        let topStudentsQuery = `
            SELECT 
                u.nombre,
                u.apellido_paterno,
                u.apellido_materno,
                e.matricula,
                e.especialidad,
                AVG(cal.calificacion_final) as promedio_general,
                COUNT(cal.id) as materias_evaluadas
            FROM calificaciones cal
            JOIN estudiantes e ON cal.estudiante_id = e.id
            JOIN usuarios u ON e.usuario_id = u.id
            JOIN materias m ON cal.materia_id = m.id
            WHERE u.activo = TRUE ${periodCondition}
        `;

        let topParams = [...params];
        if (especialidad) {
            topStudentsQuery += ' AND e.especialidad = ?';
            topParams.push(especialidad);
        }

        topStudentsQuery += `
            GROUP BY e.id
            HAVING materias_evaluadas >= 3
            ORDER BY promedio_general DESC
            LIMIT 10
        `;

        const topStudents = await executeQuery(topStudentsQuery, topParams);

        res.json({
            success: true,
            data: {
                course_performance: performance,
                top_students: topStudents
            },
            filters: {
                periodo: periodo || 'último período',
                especialidad: especialidad || 'todas'
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/analytics/chatbot-metrics
 * Métricas del sistema de chatbot
 */
router.get('/chatbot-metrics', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const { days = 30 } = req.query;

        // Métricas generales
        const generalMetrics = await executeQuery(`
            SELECT 
                COUNT(*) as total_mensajes,
                COUNT(DISTINCT cc.session_id) as conversaciones_totales,
                AVG(cc.satisfaction_rating) as satisfaccion_promedio,
                COUNT(CASE WHEN cm.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 END) as mensajes_hoy,
                COUNT(CASE WHEN cm.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAYS) THEN 1 END) as mensajes_semana
            FROM chat_messages cm
            LEFT JOIN chat_conversations cc ON cm.session_id = cc.session_id
            WHERE cm.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        `, [parseInt(days)]);

        // Consultas más frecuentes
        const frequentQueries = await executeQuery(`
            SELECT 
                query_text,
                COUNT(*) as frecuencia,
                AVG(response_time_ms) as tiempo_respuesta_promedio
            FROM chat_messages
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            AND query_text IS NOT NULL
            GROUP BY query_text
            ORDER BY frecuencia DESC
            LIMIT 10
        `, [parseInt(days)]);

        // Actividad por hora del día
        const hourlyActivity = await executeQuery(`
            SELECT 
                HOUR(created_at) as hora,
                COUNT(*) as total_mensajes,
                COUNT(DISTINCT session_id) as conversaciones_unicas
            FROM chat_messages
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY HOUR(created_at)
            ORDER BY hora
        `, [parseInt(days)]);

        // Tipos de usuario que más usan el chatbot
        const userTypeActivity = await executeQuery(`
            SELECT 
                COALESCE(cc.user_type, 'visitante') as tipo_usuario,
                COUNT(*) as total_mensajes,
                COUNT(DISTINCT cc.session_id) as conversaciones,
                AVG(cc.satisfaction_rating) as satisfaccion_promedio
            FROM chat_messages cm
            LEFT JOIN chat_conversations cc ON cm.session_id = cc.session_id
            WHERE cm.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY cc.user_type
            ORDER BY total_mensajes DESC
        `, [parseInt(days)]);

        // Tendencia diaria
        const dailyTrend = await executeQuery(`
            SELECT 
                DATE(created_at) as fecha,
                COUNT(*) as mensajes,
                COUNT(DISTINCT session_id) as conversaciones
            FROM chat_messages
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(created_at)
            ORDER BY fecha
        `, [parseInt(days)]);

        res.json({
            success: true,
            data: {
                general: generalMetrics[0],
                frequent_queries: frequentQueries,
                hourly_activity: hourlyActivity,
                user_types: userTypeActivity,
                daily_trend: dailyTrend
            },
            period: `${days} días`
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/analytics/attendance-summary
 * Resumen de asistencias
 */
router.get('/attendance-summary', authenticateToken, requireTeacher, async (req, res, next) => {
    try {
        const { mes, especialidad } = req.query;
        const currentMonth = mes || new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        let attendanceQuery = `
            SELECT 
                e.especialidad,
                COUNT(*) as total_registros,
                COUNT(CASE WHEN a.presente = TRUE THEN 1 END) as asistencias,
                COUNT(CASE WHEN a.presente = FALSE THEN 1 END) as faltas,
                ROUND((COUNT(CASE WHEN a.presente = TRUE THEN 1 END) / COUNT(*)) * 100, 2) as porcentaje_asistencia
            FROM asistencias a
            JOIN estudiantes e ON a.estudiante_id = e.id
            WHERE MONTH(a.fecha) = ? AND YEAR(a.fecha) = ?
        `;

        const params = [currentMonth, currentYear];

        if (especialidad) {
            attendanceQuery += ' AND e.especialidad = ?';
            params.push(especialidad);
        }

        attendanceQuery += ' GROUP BY e.especialidad ORDER BY porcentaje_asistencia DESC';

        const attendanceSummary = await executeQuery(attendanceQuery, params);

        // Estudiantes con mayor ausentismo
        let absenteeismQuery = `
            SELECT 
                u.nombre,
                u.apellido_paterno,
                u.apellido_materno,
                e.matricula,
                e.especialidad,
                COUNT(*) as total_registros,
                COUNT(CASE WHEN a.presente = FALSE THEN 1 END) as faltas,
                ROUND((COUNT(CASE WHEN a.presente = FALSE THEN 1 END) / COUNT(*)) * 100, 2) as porcentaje_faltas
            FROM asistencias a
            JOIN estudiantes e ON a.estudiante_id = e.id
            JOIN usuarios u ON e.usuario_id = u.id
            WHERE MONTH(a.fecha) = ? AND YEAR(a.fecha) = ?
        `;

        let absenteeismParams = [currentMonth, currentYear];

        if (especialidad) {
            absenteeismQuery += ' AND e.especialidad = ?';
            absenteeismParams.push(especialidad);
        }

        absenteeismQuery += `
            GROUP BY e.id
            HAVING total_registros >= 10 AND porcentaje_faltas > 20
            ORDER BY porcentaje_faltas DESC
            LIMIT 15
        `;

        const highAbsenteeism = await executeQuery(absenteeismQuery, absenteeismParams);

        res.json({
            success: true,
            data: {
                specialty_summary: attendanceSummary,
                high_absenteeism: highAbsenteeism
            },
            period: {
                mes: currentMonth,
                año: currentYear,
                especialidad: especialidad || 'todas'
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/analytics/system-logs
 * Análisis de logs del sistema (solo admin)
 */
router.get('/system-logs', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const { days = 7, nivel } = req.query;

        // Resumen de logs por nivel
        let logsQuery = `
            SELECT 
                nivel,
                COUNT(*) as total,
                COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 END) as ultimo_dia
            FROM logs_sistema
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        `;

        const params = [parseInt(days)];

        if (nivel) {
            logsQuery += ' AND nivel = ?';
            params.push(nivel);
        }

        logsQuery += ' GROUP BY nivel ORDER BY total DESC';

        const logsSummary = await executeQuery(logsQuery, params);

        // Errores más frecuentes
        const frequentErrors = await executeQuery(`
            SELECT 
                mensaje,
                COUNT(*) as frecuencia,
                MAX(created_at) as ultima_ocurrencia
            FROM logs_sistema
            WHERE nivel = 'error' 
            AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY mensaje
            ORDER BY frecuencia DESC
            LIMIT 10
        `, [parseInt(days)]);

        // Actividad por usuario (top 10)
        const userActivity = await executeQuery(`
            SELECT 
                u.email,
                u.tipo_usuario,
                COUNT(*) as total_acciones
            FROM logs_sistema ls
            JOIN usuarios u ON ls.usuario_id = u.id
            WHERE ls.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY ls.usuario_id
            ORDER BY total_acciones DESC
            LIMIT 10
        `, [parseInt(days)]);

        res.json({
            success: true,
            data: {
                logs_summary: logsSummary,
                frequent_errors: frequentErrors,
                user_activity: userActivity
            },
            period: `${days} días`,
            filters: {
                nivel: nivel || 'todos'
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/analytics/custom-report
 * Generar reporte personalizado
 */
router.post('/custom-report', authenticateToken, requireAdmin, [
    body('report_type').isIn(['academic', 'attendance', 'chatbot', 'users']).withMessage('Tipo de reporte inválido'),
    body('date_from').isISO8601().withMessage('Fecha inicial inválida'),
    body('date_to').isISO8601().withMessage('Fecha final inválida')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Parámetros inválidos',
                details: errors.array()
            });
        }

        const { report_type, date_from, date_to, filters = {} } = req.body;

        let reportData = {};

        switch (report_type) {
            case 'academic':
                reportData = await generateAcademicReport(date_from, date_to, filters);
                break;
            case 'attendance':
                reportData = await generateAttendanceReport(date_from, date_to, filters);
                break;
            case 'chatbot':
                reportData = await generateChatbotReport(date_from, date_to, filters);
                break;
            case 'users':
                reportData = await generateUsersReport(date_from, date_to, filters);
                break;
        }

        // Registrar generación del reporte
        await logger.info('Reporte personalizado generado', {
            tipo: report_type,
            periodo: `${date_from} - ${date_to}`,
            generadoPor: req.user.id
        });

        res.json({
            success: true,
            report_type: report_type,
            period: { from: date_from, to: date_to },
            data: reportData,
            generated_at: new Date().toISOString(),
            generated_by: req.user.email
        });

    } catch (error) {
        next(error);
    }
});

// ============================================
// FUNCIONES AUXILIARES PARA REPORTES
// ============================================

async function generateAcademicReport(dateFrom, dateTo, filters) {
    // Implementar lógica específica para reporte académico
    return { message: 'Reporte académico en desarrollo' };
}

async function generateAttendanceReport(dateFrom, dateTo, filters) {
    // Implementar lógica específica para reporte de asistencias
    return { message: 'Reporte de asistencias en desarrollo' };
}

async function generateChatbotReport(dateFrom, dateTo, filters) {
    // Implementar lógica específica para reporte de chatbot
    return { message: 'Reporte de chatbot en desarrollo' };
}

async function generateUsersReport(dateFrom, dateTo, filters) {
    // Implementar lógica específica para reporte de usuarios
    return { message: 'Reporte de usuarios en desarrollo' };
}

module.exports = router;