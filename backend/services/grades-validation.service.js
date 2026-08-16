"use strict";
/**
 * Grades Validation Service
 * Maneja el flujo de aprobación y validación de calificaciones
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require('../config/database.js');
class GradesValidationService {
    /**
     * Calcular promedio general de un estudiante
     */
    async calculateStudentAverage(studentId, periodo) {
        var _a;
        const query = periodo
            ? `SELECT AVG(calificacion) as promedio 
               FROM calificaciones 
               WHERE estudiante_id = $1 AND periodo = $2 AND status != 'rechazado'`
            : `SELECT AVG(calificacion) as promedio 
               FROM calificaciones 
               WHERE estudiante_id = $1 AND status != 'rechazado'`;
        const params = periodo ? [studentId, periodo] : [studentId];
        const result = await (0, database_1.executeQuery)(query, params);
        return ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.promedio) ? parseFloat(result[0].promedio) : 0;
    }
    /**
     * Calcular promedio por materia
     */
    async calculateSubjectAverage(studentId, materiaId) {
        var _a;
        const result = await (0, database_1.executeQuery)(`
            SELECT AVG(calificacion) as promedio
            FROM calificaciones
            WHERE estudiante_id = $1 AND materia_id = $2 AND status != 'rechazado'
        `, [studentId, materiaId]);
        return ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.promedio) ? parseFloat(result[0].promedio) : 0;
    }
    /**
     * Validar calificación (aprobación por coordinador)
     */
    async validateGrade(validationData) {
        const { calificacion_id, validador_id, estado, comentarios } = validationData;
        // Obtener calificación actual
        const gradeData = await (0, database_1.executeQuery)(`
            SELECT * FROM calificaciones WHERE id = $1
        `, [calificacion_id]);
        if (!gradeData || gradeData.length === 0) {
            throw new Error('Calificación no encontrada');
        }
        const grade = gradeData[0];
        // Actualizar estado de validación
        await (0, database_1.executeQuery)(`
            UPDATE calificaciones
            SET 
                status = $1,
                validado_por = $2,
                fecha_validacion = CURRENT_TIMESTAMP,
                comentarios_validacion = $3
            WHERE id = $4
        `, [estado, validador_id, comentarios || null, calificacion_id]);
        // Registrar en auditoría
        await this.logAudit({
            calificacion_id,
            usuario_id: validador_id,
            accion: estado === 'aprobado' ? 'validacion' : 'rechazo',
            valor_anterior: grade.calificacion,
            valor_nuevo: grade.calificacion,
            comentarios: comentarios || `Calificación ${estado}`
        });
        // Si se aprobó, verificar si hay alertas de riesgo
        if (estado === 'aprobado') {
            await this.checkAndCreateRiskAlerts(grade.estudiante_id);
        }
    }
    /**
     * Registrar cambio en auditoría
     */
    async logAudit(entry) {
        await (0, database_1.executeQuery)(`
            INSERT INTO auditoria_calificaciones 
            (calificacion_id, usuario_id, accion, valor_anterior, valor_nuevo, comentarios, fecha_registro)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        `, [
            entry.calificacion_id,
            entry.usuario_id,
            entry.accion,
            entry.valor_anterior,
            entry.valor_nuevo,
            entry.comentarios
        ]);
    }
    /**
     * Obtener historial de auditoría
     */
    async getAuditHistory(calificacionId) {
        return await (0, database_1.executeQuery)(`
            SELECT 
                a.*,
                u.nombre || ' ' || u.apellido_paterno as usuario_nombre,
                u.role as usuario_role
            FROM auditoria_calificaciones a
            JOIN usuarios u ON a.usuario_id = u.id
            WHERE a.calificacion_id = $1
            ORDER BY a.fecha_registro DESC
        `, [calificacionId]);
    }
    /**
     * Verificar y crear alertas de estudiantes en riesgo
     */
    async checkAndCreateRiskAlerts(studentId) {
        var _a, _b;
        const alerts = [];
        // 1. Revisar promedio general
        const promedio = await this.calculateStudentAverage(studentId);
        if (promedio < 6) {
            alerts.push({
                estudiante_id: studentId,
                tipo_alerta: 'bajo_promedio',
                severidad: promedio < 5 ? 'critica' : 'alta',
                mensaje: `Promedio general bajo: ${promedio.toFixed(2)}`,
                data_adicional: { promedio }
            });
        }
        // 2. Contar materias reprobadas
        const reprobadas = await (0, database_1.executeQuery)(`
            SELECT COUNT(DISTINCT materia_id) as total
            FROM calificaciones
            WHERE estudiante_id = $1 AND calificacion < 6 AND status = 'aprobado'
        `, [studentId]);
        const totalReprobadas = parseInt(((_a = reprobadas[0]) === null || _a === void 0 ? void 0 : _a.total) || 0);
        if (totalReprobadas > 0) {
            alerts.push({
                estudiante_id: studentId,
                tipo_alerta: 'reprobado',
                severidad: totalReprobadas >= 3 ? 'critica' : totalReprobadas >= 2 ? 'alta' : 'media',
                mensaje: `${totalReprobadas} materia${totalReprobadas > 1 ? 's' : ''} reprobada${totalReprobadas > 1 ? 's' : ''}`,
                data_adicional: { total_materias: totalReprobadas }
            });
        }
        // 3. Revisar ausentismo
        const ausentismos = await (0, database_1.executeQuery)(`
            SELECT COUNT(*) as total
            FROM asistencias
            WHERE estudiante_id = $1 
            AND fecha >= CURRENT_DATE - INTERVAL '30 days'
            AND estado IN ('falta', 'falta_injustificada')
        `, [studentId]);
        const totalFaltas = parseInt(((_b = ausentismos[0]) === null || _b === void 0 ? void 0 : _b.total) || 0);
        if (totalFaltas > 5) {
            alerts.push({
                estudiante_id: studentId,
                tipo_alerta: 'ausentismo',
                severidad: totalFaltas > 10 ? 'alta' : 'media',
                mensaje: `${totalFaltas} faltas en el último mes`,
                data_adicional: { faltas_30_dias: totalFaltas }
            });
        }
        // Guardar alertas
        for (const alert of alerts) {
            await this.createRiskAlert(alert);
        }
    }
    /**
     * Crear alerta de riesgo
     */
    async createRiskAlert(alert) {
        // Verificar si ya existe alerta similar activa
        const existing = await (0, database_1.executeQuery)(`
            SELECT id FROM alertas_estudiantes
            WHERE estudiante_id = $1 
            AND tipo_alerta = $2 
            AND estado = 'activa'
            AND fecha_creacion >= CURRENT_DATE - INTERVAL '7 days'
        `, [alert.estudiante_id, alert.tipo_alerta]);
        if (existing && existing.length > 0) {
            // Actualizar alerta existente
            await (0, database_1.executeQuery)(`
                UPDATE alertas_estudiantes
                SET mensaje = $1, severidad = $2, data_adicional = $3, updated_at = CURRENT_TIMESTAMP
                WHERE id = $4
            `, [alert.mensaje, alert.severidad, JSON.stringify(alert.data_adicional), existing[0].id]);
        }
        else {
            // Crear nueva alerta
            await (0, database_1.executeQuery)(`
                INSERT INTO alertas_estudiantes
                (estudiante_id, tipo_alerta, severidad, mensaje, data_adicional, estado, fecha_creacion)
                VALUES ($1, $2, $3, $4, $5, 'activa', CURRENT_TIMESTAMP)
            `, [
                alert.estudiante_id,
                alert.tipo_alerta,
                alert.severidad,
                alert.mensaje,
                JSON.stringify(alert.data_adicional || {})
            ]);
        }
        // Notificar a tutores y padres
        await this.notifyRiskAlert(alert);
    }
    /**
     * Obtener alertas activas
     */
    async getActiveAlerts(filters) {
        let query = `
            SELECT 
                a.*,
                e.nombre || ' ' || e.apellido_paterno as estudiante_nombre,
                e.matricula,
                e.grado,
                e.grupo
            FROM alertas_estudiantes a
            JOIN estudiantes e ON a.estudiante_id = e.id
            WHERE a.estado = 'activa'
        `;
        const params = [];
        let paramIndex = 1;
        if (filters === null || filters === void 0 ? void 0 : filters.estudiante_id) {
            query += ` AND a.estudiante_id = $${paramIndex}`;
            params.push(filters.estudiante_id);
            paramIndex++;
        }
        if (filters === null || filters === void 0 ? void 0 : filters.severidad) {
            query += ` AND a.severidad = $${paramIndex}`;
            params.push(filters.severidad);
            paramIndex++;
        }
        query += ` ORDER BY 
            CASE a.severidad
                WHEN 'critica' THEN 1
                WHEN 'alta' THEN 2
                WHEN 'media' THEN 3
                WHEN 'baja' THEN 4
            END,
            a.fecha_creacion DESC
        `;
        return await (0, database_1.executeQuery)(query, params);
    }
    /**
     * Notificar alerta de riesgo
     */
    async notifyRiskAlert(alert) {
        // Obtener información del estudiante
        const student = await (0, database_1.executeQuery)(`
            SELECT e.*, u.nombre || ' ' || u.apellido_paterno as nombre_completo
            FROM estudiantes e
            JOIN usuarios u ON e.usuario_id = u.id
            WHERE e.id = $1
        `, [alert.estudiante_id]);
        if (!student || student.length === 0)
            return;
        // Obtener tutores/padres
        const tutores = await (0, database_1.executeQuery)(`
            SELECT u.email, u.nombre
            FROM guardians g
            JOIN student_guardians sg ON g.id = sg.guardian_id
            JOIN usuarios u ON g.usuario_id = u.id
            WHERE sg.student_id = $1
        `, [alert.estudiante_id]);
        // Crear notificaciones internas
        for (const tutor of tutores) {
            await (0, database_1.executeQuery)(`
                INSERT INTO notificaciones
                (usuario_email, tipo, titulo, mensaje, prioridad, created_at)
                VALUES ($1, 'alerta_academica', $2, $3, $4, CURRENT_TIMESTAMP)
            `, [
                tutor.email,
                `Alerta Académica: ${student[0].nombre_completo}`,
                `${alert.mensaje}. Es importante dar seguimiento inmediato.`,
                alert.severidad
            ]);
        }
        // TODO: Enviar email real (implementar con EmailService)
    }
    /**
     * Obtener calificaciones pendientes de validación
     */
    async getPendingValidations(coordinadorId) {
        return await (0, database_1.executeQuery)(`
            SELECT 
                c.*,
                e.nombre || ' ' || e.apellido_paterno as estudiante_nombre,
                e.matricula,
                m.nombre as materia_nombre,
                u.nombre || ' ' || u.apellido_paterno as docente_nombre
            FROM calificaciones c
            JOIN estudiantes e ON c.estudiante_id = e.id
            JOIN materias m ON c.materia_id = m.id
            JOIN docentes d ON m.docente_id = d.id
            JOIN usuarios u ON d.usuario_id = u.id
            WHERE c.status = 'pendiente'
            ORDER BY c.created_at ASC
        `, []);
    }
    /**
     * Generar reporte de calificaciones para un periodo
     */
    async generatePeriodReport(periodo, grupoId) {
        const query = grupoId
            ? `SELECT 
                e.id as estudiante_id,
                e.matricula,
                e.nombre || ' ' || e.apellido_paterno as nombre_completo,
                m.nombre as materia,
                c.calificacion,
                c.periodo,
                c.status
               FROM calificaciones c
               JOIN estudiantes e ON c.estudiante_id = e.id
               JOIN materias m ON c.materia_id = m.id
               WHERE c.periodo = $1 AND m.grupo = $2
               ORDER BY e.apellido_paterno, m.nombre`
            : `SELECT 
                e.id as estudiante_id,
                e.matricula,
                e.nombre || ' ' || e.apellido_paterno as nombre_completo,
                m.nombre as materia,
                c.calificacion,
                c.periodo,
                c.status
               FROM calificaciones c
               JOIN estudiantes e ON c.estudiante_id = e.id
               JOIN materias m ON c.materia_id = m.id
               WHERE c.periodo = $1
               ORDER BY e.apellido_paterno, m.nombre`;
        const params = grupoId ? [periodo, grupoId] : [periodo];
        const grades = await (0, database_1.executeQuery)(query, params);
        // Calcular estadísticas
        const stats = {
            total_calificaciones: grades.length,
            promedio_general: grades.reduce((sum, g) => sum + g.calificacion, 0) / grades.length || 0,
            aprobados: grades.filter(g => g.calificacion >= 6).length,
            reprobados: grades.filter(g => g.calificacion < 6).length,
            pendientes_validacion: grades.filter(g => g.status === 'pendiente').length
        };
        return {
            periodo,
            grupo_id: grupoId,
            calificaciones: grades,
            estadisticas: stats
        };
    }
}
exports.default = new GradesValidationService();
