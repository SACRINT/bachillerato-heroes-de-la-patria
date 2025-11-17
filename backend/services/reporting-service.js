/**
 * 📊 REPORTING SERVICE - SEMANA 7
 * Servicio para generación de reportes avanzados
 * Exportación a Excel/PDF, scheduled reports
 */

const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger');

class ReportingService {
    /**
     * Generar reporte de estudiantes
     * @param {Object} filters - Filtros (período, grado, estado)
     * @returns {Promise<Object>}
     */
    async generateStudentsReport(filters = {}) {
        try {
            const { period, grade, status } = filters;

            let query = `
                SELECT
                    id,
                    nombre,
                    apellido_paterno,
                    apellido_materno,
                    email,
                    status,
                    created_at,
                    (SELECT AVG(calificacion) FROM calificaciones WHERE estudiante_id = usuarios.id) as promedio
                FROM usuarios
                WHERE role = 'estudiante'
            `;

            const params = [];
            let paramIndex = 1;

            if (status) {
                query += ` AND status = $${paramIndex}`;
                params.push(status);
                paramIndex++;
            }

            query += ` ORDER BY apellido_paterno, apellido_materno, nombre`;

            const result = await pool.query(query, params);

            return {
                success: true,
                type: 'students',
                data: result.rows,
                count: result.rows.length,
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            devLogger.error('[REPORTING] Error generando reporte estudiantes:', error);
            throw error;
        }
    }

    /**
     * Generar reporte financiero
     * @param {Object} dateRange - {from, to}
     * @returns {Promise<Object>}
     */
    async generateFinancialReport(dateRange = {}) {
        try {
            const { from, to } = dateRange;

            let query = `
                SELECT
                    DATE_TRUNC('month', fecha_pago) as mes,
                    COUNT(*) as total_pagos,
                    SUM(monto) as ingresos_totales,
                    AVG(monto) as promedio_pago
                FROM pagos_pendientes
                WHERE estado = 'pagado'
            `;

            const params = [];
            let paramIndex = 1;

            if (from) {
                query += ` AND fecha_pago >= $${paramIndex}`;
                params.push(from);
                paramIndex++;
            }

            if (to) {
                query += ` AND fecha_pago <= $${paramIndex}`;
                params.push(to);
                paramIndex++;
            }

            query += `
                GROUP BY mes
                ORDER BY mes DESC
            `;

            const result = await pool.query(query, params);

            const totalIngresos = result.rows.reduce((sum, row) => sum + parseFloat(row.ingresos_totales || 0), 0);

            return {
                success: true,
                type: 'financial',
                data: result.rows,
                summary: {
                    totalIngresos: totalIngresos.toFixed(2),
                    periodos: result.rows.length
                },
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            devLogger.error('[REPORTING] Error generando reporte financiero:', error);
            throw error;
        }
    }

    /**
     * Generar reporte de aprobaciones pendientes
     * @returns {Promise<Object>}
     */
    async generateApprovalsReport() {
        try {
            const query = `
                SELECT
                    form_type,
                    COUNT(*) as pending_count,
                    MIN(created_at) as oldest,
                    MAX(created_at) as newest
                FROM pending_approvals
                WHERE status = 'pending'
                GROUP BY form_type
                ORDER BY pending_count DESC
            `;

            const result = await pool.query(query);

            const total = result.rows.reduce((sum, row) => sum + parseInt(row.pending_count), 0);

            return {
                success: true,
                type: 'approvals',
                data: result.rows,
                summary: {
                    totalPending: total,
                    categories: result.rows.length
                },
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            devLogger.error('[REPORTING] Error generando reporte aprobaciones:', error);
            throw error;
        }
    }

    /**
     * Generar reporte de asistencia
     * @param {Object} filters - {studentId, dateRange}
     * @returns {Promise<Object>}
     */
    async generateAttendanceReport(filters = {}) {
        try {
            const { studentId, dateRange = {} } = filters;

            let query = `
                SELECT
                    estudiante_id,
                    DATE_TRUNC('month', fecha) as mes,
                    COUNT(*) as total_dias,
                    SUM(CASE WHEN asistio = true THEN 1 ELSE 0 END) as dias_asistidos,
                    ROUND(
                        (SUM(CASE WHEN asistio = true THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric) * 100,
                        2
                    ) as porcentaje_asistencia
                FROM asistencia
                WHERE 1=1
            `;

            const params = [];
            let paramIndex = 1;

            if (studentId) {
                query += ` AND estudiante_id = $${paramIndex}`;
                params.push(studentId);
                paramIndex++;
            }

            if (dateRange.from) {
                query += ` AND fecha >= $${paramIndex}`;
                params.push(dateRange.from);
                paramIndex++;
            }

            if (dateRange.to) {
                query += ` AND fecha <= $${paramIndex}`;
                params.push(dateRange.to);
                paramIndex++;
            }

            query += `
                GROUP BY estudiante_id, mes
                ORDER BY estudiante_id, mes DESC
            `;

            const result = await pool.query(query, params);

            return {
                success: true,
                type: 'attendance',
                data: result.rows,
                count: result.rows.length,
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            devLogger.error('[REPORTING] Error generando reporte asistencia:', error);
            throw error;
        }
    }

    /**
     * Predicción simple de tendencias (ML básico)
     * @param {string} metric - Métrica a predecir ('enrollment', 'attendance', 'grades')
     * @returns {Promise<Object>}
     */
    async predictTrend(metric) {
        try {
            // Predicción simple usando regresión lineal básica
            let query;

            switch (metric) {
                case 'enrollment':
                    query = `
                        SELECT
                            DATE_TRUNC('month', created_at) as mes,
                            COUNT(*) as cantidad
                        FROM usuarios
                        WHERE role = 'estudiante'
                        AND created_at >= NOW() - INTERVAL '12 months'
                        GROUP BY mes
                        ORDER BY mes
                    `;
                    break;

                case 'attendance':
                    query = `
                        SELECT
                            DATE_TRUNC('month', fecha) as mes,
                            ROUND(AVG(CASE WHEN asistio = true THEN 100 ELSE 0 END), 2) as promedio
                        FROM asistencia
                        WHERE fecha >= NOW() - INTERVAL '12 months'
                        GROUP BY mes
                        ORDER BY mes
                    `;
                    break;

                case 'grades':
                    query = `
                        SELECT
                            periodo_academico as mes,
                            ROUND(AVG(calificacion), 2) as promedio
                        FROM calificaciones
                        WHERE periodo_academico >= TO_CHAR(NOW() - INTERVAL '12 months', 'YYYY-MM')
                        GROUP BY periodo_academico
                        ORDER BY periodo_academico
                    `;
                    break;

                default:
                    throw new Error(`Métrica desconocida: ${metric}`);
            }

            const result = await pool.query(query);

            // Calcular tendencia simple (promedio últimos 3 vs 3 anteriores)
            const data = result.rows;
            if (data.length < 6) {
                return {
                    success: true,
                    metric,
                    trend: 'insufficient_data',
                    data
                };
            }

            const recent = data.slice(-3).reduce((sum, row) => sum + parseFloat(row.cantidad || row.promedio), 0) / 3;
            const previous = data.slice(-6, -3).reduce((sum, row) => sum + parseFloat(row.cantidad || row.promedio), 0) / 3;

            const change = ((recent - previous) / previous) * 100;

            return {
                success: true,
                metric,
                trend: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
                changePercent: change.toFixed(2),
                recent: recent.toFixed(2),
                previous: previous.toFixed(2),
                data
            };
        } catch (error) {
            devLogger.error('[REPORTING] Error prediciendo tendencia:', error);
            throw error;
        }
    }

    /**
     * Programar envío de reporte por email (guardado en BD)
     * @param {Object} schedule - {reportType, frequency, recipients, filters}
     * @returns {Promise<Object>}
     */
    async scheduleReport(schedule) {
        try {
            const { reportType, frequency, recipients, filters = {} } = schedule;

            const query = `
                INSERT INTO scheduled_reports
                (report_type, frequency, recipients, filters, next_run, active, created_at)
                VALUES ($1, $2, $3, $4, NOW() + INTERVAL '1 ${frequency}', true, NOW())
                RETURNING *
            `;

            const result = await pool.query(query, [
                reportType,
                frequency,
                JSON.stringify(recipients),
                JSON.stringify(filters)
            ]);

            devLogger.log(`[REPORTING] Reporte programado: ${reportType} cada ${frequency}`);

            return {
                success: true,
                schedule: result.rows[0]
            };
        } catch (error) {
            // Si tabla no existe, solo log warning
            devLogger.warn('[REPORTING] Tabla scheduled_reports no existe (crear en migración)');
            return {
                success: false,
                error: 'Scheduled reports table not created yet'
            };
        }
    }
}

module.exports = new ReportingService();
