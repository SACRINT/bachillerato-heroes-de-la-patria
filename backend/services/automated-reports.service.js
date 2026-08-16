"use strict";
/**
 * Automated Reports Service
 * Generación automática de reportes para docentes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require('../config/database.js');
class AutomatedReportsService {
    /**
     * Generar reporte de calificaciones
     */
    async generateGradesReport(docenteId, materiaId, periodo) {
        // Obtener datos
        const grades = await (0, database_1.executeQuery)(`
            SELECT 
                e.matricula,
                e.nombre || ' ' || e.apellido_paterno as estudiante,
                c.parcial,
                c.calificacion,
                c.observaciones,
                c.status
            FROM calificaciones c
            JOIN estudiantes e ON c.estudiante_id = e.id
            WHERE c.materia_id = $1 
            AND c.parcial = $2
            AND c.docente_id = (SELECT id FROM docentes WHERE usuario_id = $3)
            ORDER BY e.apellido_paterno, e.nombre
        `, [materiaId, periodo, docenteId]);
        const materia = await (0, database_1.executeQuery)(`
            SELECT nombre, grupo, semestre FROM materias WHERE id = $1
        `, [materiaId]);
        // Calcular estadísticas
        const totalEstudiantes = grades.length;
        const aprobados = grades.filter((g) => g.calificacion >= 6).length;
        const reprobados = totalEstudiantes - aprobados;
        const promedio = grades.reduce((sum, g) => sum + g.calificacion, 0) / totalEstudiantes || 0;
        // Generar PDF
        const reportData = {
            materia: materia[0].nombre,
            grupo: materia[0].grupo,
            semestre: materia[0].semestre,
            periodo,
            fecha: new Date(),
            estadisticas: {
                total: totalEstudiantes,
                aprobados,
                reprobados,
                promedio: promedio.toFixed(2)
            },
            calificaciones: grades
        };
        // TODO: Crear método específico en pdfGenerator para reportes de calificaciones
        // Por ahora retornamos un JSON como string en Buffer
        return Buffer.from(JSON.stringify(reportData, null, 2));
    }
    /**
     * Generar reporte de asistencia
     */
    async generateAttendanceReport(docenteId, materiaId, fechaInicio, fechaFin) {
        const attendance = await (0, database_1.executeQuery)(`
            SELECT 
                e.matricula,
                e.nombre || ' ' || e.apellido_paterno as estudiante,
                COUNT(*) as total_clases,
                COUNT(CASE WHEN a.estado = 'presente' THEN 1 END) as asistencias,
                COUNT(CASE WHEN a.estado IN ('falta', 'falta_injustificada') THEN 1 END) as faltas,
                COUNT(CASE WHEN a.estado = 'retardo' THEN 1 END) as retardos,
                ROUND(COUNT(CASE WHEN a.estado = 'presente' THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as porcentaje_asistencia
            FROM asistencias a
            JOIN estudiantes e ON a.estudiante_id = e.id
            WHERE a.materia_id = $1
            AND a.fecha BETWEEN $2 AND $3
            GROUP BY e.id, e.matricula, e.nombre, e.apellido_paterno
            ORDER BY e.apellido_paterno, e.nombre
        `, [materiaId, fechaInicio, fechaFin]);
        const materia = await (0, database_1.executeQuery)(`
            SELECT nombre, grupo FROM materias WHERE id = $1
        `, [materiaId]);
        const reportData = {
            materia: materia[0].nombre,
            grupo: materia[0].grupo,
            periodo: `${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`,
            fecha: new Date(),
            asistencias: attendance
        };
        // TODO: Crear método específico en pdfGenerator para reportes de asistencia
        // Por ahora retornamos JSON como Buffer
        return Buffer.from(JSON.stringify(reportData, null, 2));
    }
    /**
     * Generar reporte de rendimiento general
     */
    async generatePerformanceReport(docenteId, materiaId) {
        // Calificaciones por parcial
        const gradesByPeriod = await (0, database_1.executeQuery)(`
            SELECT 
                parcial,
                COUNT(*) as total,
                ROUND(AVG(calificacion), 2) as promedio,
                MIN(calificacion) as minima,
                MAX(calificacion) as maxima,
                COUNT(CASE WHEN calificacion >= 6 THEN 1 END) as aprobados,
                COUNT(CASE WHEN calificacion < 6 THEN 1 END) as reprobados
            FROM calificaciones
            WHERE materia_id = $1 
            AND docente_id = (SELECT id FROM docentes WHERE usuario_id = $2)
            AND status = 'aprobado'
            GROUP BY parcial
            ORDER BY parcial
        `, [materiaId, docenteId]);
        // Top 10 estudiantes
        const topStudents = await (0, database_1.executeQuery)(`
            SELECT 
                e.matricula,
                e.nombre || ' ' || e.apellido_paterno as estudiante,
                ROUND(AVG(c.calificacion), 2) as promedio
            FROM calificaciones c
            JOIN estudiantes e ON c.estudiante_id = e.id
            WHERE c.materia_id = $1
            AND c.docente_id = (SELECT id FROM docentes WHERE usuario_id = $2)
            AND c.status = 'aprobado'
            GROUP BY e.id, e.matricula, e.nombre, e.apellido_paterno
            ORDER BY promedio DESC
            LIMIT 10
        `, [materiaId, docenteId]);
        // Estudiantes con bajo rendimiento
        const lowPerformers = await (0, database_1.executeQuery)(`
            SELECT 
                e.matricula,
                e.nombre || ' ' || e.apellido_paterno as estudiante,
                ROUND(AVG(c.calificacion), 2) as promedio,
                COUNT(CASE WHEN c.calificacion < 6 THEN 1 END) as materias_reprobadas
            FROM calificaciones c
            JOIN estudiantes e ON c.estudiante_id = e.id
            WHERE c.materia_id = $1
            AND c.docente_id = (SELECT id FROM docentes WHERE usuario_id = $2)
            AND c.status = 'aprobado'
            GROUP BY e.id, e.matricula, e.nombre, e.apellido_paterno
            HAVING AVG(c.calificacion) < 7 OR COUNT(CASE WHEN c.calificacion < 6 THEN 1 END) > 0
            ORDER BY promedio ASC
        `, [materiaId, docenteId]);
        // Asistencia general
        const attendanceSummary = await (0, database_1.executeQuery)(`
            SELECT 
                COUNT(CASE WHEN estado = 'presente' THEN 1 END) as total_asistencias,
                COUNT(CASE WHEN estado IN ('falta', 'falta_injustificada') THEN 1 END) as total_faltas,
                COUNT(CASE WHEN estado = 'retardo' THEN 1 END) as total_retardos,
                ROUND(COUNT(CASE WHEN estado = 'presente' THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as porcentaje_asistencia_global
            FROM asistencias
            WHERE materia_id = $1
        `, [materiaId]);
        return {
            calificaciones_por_parcial: gradesByPeriod,
            mejores_estudiantes: topStudents,
            estudiantes_en_riesgo: lowPerformers,
            resumen_asistencia: attendanceSummary[0]
        };
    }
    /**
     * Generar reporte completo (calificaciones + asistencia + rendimiento)
     */
    async generateCompleteReport(docenteId, materiaId, periodo) {
        const [gradesReport, performanceData] = await Promise.all([
            this.generateGradesReport(docenteId, materiaId, periodo),
            this.generatePerformanceReport(docenteId, materiaId)
        ]);
        // TODO: Combinar en un PDF completo
        // Por ahora retornamos el reporte de calificaciones
        return gradesReport;
    }
    /**
     * Configurar reporte automático
     */
    async configureAutomaticReport(config) {
        const result = await (0, database_1.executeQuery)(`
            INSERT INTO configuracion_reportes (
                docente_id, tipo_reporte, periodo, materia_id,
                automatico, frecuencia, destinatarios, formato,
                proxima_generacion, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
            RETURNING *
        `, [
            config.docente_id,
            config.tipo_reporte,
            config.periodo,
            config.materia_id || null,
            config.automatico,
            config.frecuencia || null,
            JSON.stringify(config.destinatarios),
            config.formato,
            this.calculateNextGeneration(config.frecuencia)
        ]);
        return result[0];
    }
    /**
     * Calcular próxima fecha de generación
     */
    calculateNextGeneration(frecuencia) {
        const now = new Date();
        switch (frecuencia) {
            case 'semanal':
                now.setDate(now.getDate() + 7);
                break;
            case 'quincenal':
                now.setDate(now.getDate() + 15);
                break;
            case 'mensual':
                now.setMonth(now.getMonth() + 1);
                break;
            default:
                now.setMonth(now.getMonth() + 1);
        }
        return now;
    }
    /**
     * Ejecutar reportes automáticos programados
     */
    async runScheduledReports() {
        const pendingReports = await (0, database_1.executeQuery)(`
            SELECT * FROM configuracion_reportes
            WHERE automatico = true
            AND proxima_generacion <= CURRENT_TIMESTAMP
            AND activo = true
        `, []);
        let generated = 0;
        for (const config of pendingReports) {
            try {
                let reportBuffer;
                // Generar reporte según tipo
                switch (config.tipo_reporte) {
                    case 'calificaciones':
                        reportBuffer = await this.generateGradesReport(config.docente_id, config.materia_id, config.periodo);
                        break;
                    case 'asistencia':
                        const now = new Date();
                        const monthAgo = new Date(now);
                        monthAgo.setMonth(monthAgo.getMonth() - 1);
                        reportBuffer = await this.generateAttendanceReport(config.docente_id, config.materia_id, monthAgo, now);
                        break;
                    case 'completo':
                        reportBuffer = await this.generateCompleteReport(config.docente_id, config.materia_id, config.periodo);
                        break;
                    default:
                        continue;
                }
                // Enviar a destinatarios
                const destinatarios = JSON.parse(config.destinatarios);
                await this.sendReportToRecipients(reportBuffer, destinatarios, config.tipo_reporte);
                // Actualizar próxima generación
                await (0, database_1.executeQuery)(`
                    UPDATE configuracion_reportes
                    SET 
                        ultima_generacion = CURRENT_TIMESTAMP,
                        proxima_generacion = $2
                    WHERE id = $1
                `, [config.id, this.calculateNextGeneration(config.frecuencia)]);
                generated++;
            }
            catch (error) {
                console.error(`Error generando reporte ${config.id}:`, error);
                // Registrar error pero continuar con los demás
            }
        }
        return generated;
    }
    /**
     * Enviar reporte a destinatarios
     */
    async sendReportToRecipients(reportBuffer, destinatarios, tipoReporte) {
        // TODO: Integrar con EmailService para enviar PDFs adjuntos
        console.log(`Enviando reporte ${tipoReporte} a ${destinatarios.join(', ')}`);
        // Por ahora, crear notificación
        for (const email of destinatarios) {
            await (0, database_1.executeQuery)(`
                INSERT INTO notificaciones (
                    usuario_email, tipo, titulo, mensaje, prioridad, created_at
                ) VALUES ($1, 'reporte_automatico', $2, $3, 'media', CURRENT_TIMESTAMP)
            `, [
                email,
                `Nuevo reporte: ${tipoReporte}`,
                `Se ha generado un nuevo reporte automático de ${tipoReporte}. Revisa tu correo electrónico.`
            ]);
        }
    }
    /**
     * Obtener configuraciones de reportes de un docente
     */
    async getTeacherReportConfigs(docenteId) {
        return await (0, database_1.executeQuery)(`
            SELECT 
                cr.*,
                m.nombre as materia_nombre
            FROM configuracion_reportes cr
            LEFT JOIN materias m ON cr.materia_id = m.id
            WHERE cr.docente_id = $1
            ORDER BY cr.created_at DESC
        `, [docenteId]);
    }
    /**
     * Actualizar configuración de reporte
     */
    async updateReportConfig(id, data) {
        const updates = [];
        const params = [];
        let paramIndex = 1;
        const allowedFields = ['tipo_reporte', 'periodo', 'materia_id', 'automatico', 'frecuencia', 'destinatarios', 'formato'];
        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                updates.push(`${field} = $${paramIndex}`);
                if (field === 'destinatarios') {
                    params.push(JSON.stringify(data[field]));
                }
                else {
                    params.push(data[field]);
                }
                paramIndex++;
            }
        }
        if (updates.length === 0) {
            throw new Error('No hay campos para actualizar');
        }
        params.push(id);
        const result = await (0, database_1.executeQuery)(`
            UPDATE configuracion_reportes
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `, params);
        return result[0];
    }
    /**
     * Desactivar reporte automático
     */
    async deactivateReport(id) {
        await (0, database_1.executeQuery)(`
            UPDATE configuracion_reportes
            SET activo = false
            WHERE id = $1
        `, [id]);
    }
}
exports.default = new AutomatedReportsService();
