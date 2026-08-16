"use strict";
/**
 * 📊 ATTENDANCE SERVICE - TypeScript
 * Servicio de gestión de asistencias escolares
 *
 * Patrón Service Layer - Lógica de negocio independiente
 * Migración TypeScript: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceError = void 0;
const attendance_dao_1 = __importDefault(require('../data/attendance.dao.js'));
const devLogger_1 = __importDefault(require('../utils/devLogger.js'));
// EventBus import - using dynamic require for JS module compatibility
const EventBus = require('./event-bus.service').getInstance();
// =====================================================
// INTERFACES
// =====================================================
class ServiceError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = 'ServiceError';
        this.statusCode = statusCode;
    }
}
exports.ServiceError = ServiceError;
// =====================================================
// ATTENDANCE SERVICE CLASS
// =====================================================
class AttendanceService {
    /**
     * Marcar asistencia individual
     */
    async markAttendance(data) {
        this._validateAttendanceData(data);
        try {
            const attendance = await attendance_dao_1.default.create(data);
            // Emitir evento
            EventBus.emit('attendance:marked', {
                attendanceId: attendance.id,
                studentId: attendance.estudiante_id,
                present: attendance.presente,
                date: attendance.fecha
            });
            // Si es falta, emitir evento específico
            if (!attendance.presente) {
                EventBus.emit('attendance:absence_detected', {
                    attendanceId: attendance.id,
                    studentId: attendance.estudiante_id,
                    date: attendance.fecha,
                    justified: attendance.justificada
                });
                // Verificar patrones de ausentismo
                await this.checkAbsenteeismPattern(attendance.estudiante_id);
            }
            devLogger_1.default.log(`[AttendanceService] Asistencia marcada: Estudiante ${attendance.estudiante_id} - ${attendance.presente ? 'Presente' : 'Ausente'}`);
            return attendance;
        }
        catch (error) {
            devLogger_1.default.error('[AttendanceService] Error marcando asistencia', error);
            throw new ServiceError('Error al marcar asistencia', 500);
        }
    }
    /**
     * Marcar asistencia masiva (lista de clase)
     */
    async markBulkAttendance(attendanceRecords, registeredBy) {
        if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
            throw new ServiceError('Se requiere al menos un registro de asistencia', 400);
        }
        try {
            // Agregar registrado_por a todos los registros
            const recordsWithUser = attendanceRecords.map(record => ({
                ...record,
                registrado_por: registeredBy
            }));
            const results = await attendance_dao_1.default.markBulkAttendance(recordsWithUser);
            // Emitir evento de asistencia masiva
            EventBus.emit('attendance:bulk_marked', {
                totalRecords: results.length,
                date: recordsWithUser[0].fecha,
                registeredBy
            });
            // Contar presentes y ausentes
            const stats = {
                total: results.length,
                present: results.filter(r => r.presente).length,
                absent: results.filter(r => !r.presente).length
            };
            devLogger_1.default.log(`[AttendanceService] Asistencia masiva marcada: ${stats.present}/${stats.total} presentes`);
            return { attendances: results, stats };
        }
        catch (error) {
            devLogger_1.default.error('[AttendanceService] Error en asistencia masiva', error);
            throw new ServiceError('Error al marcar asistencia masiva', 500);
        }
    }
    /**
     * Actualizar asistencia
     */
    async updateAttendance(id, data, updatedBy) {
        if (!id)
            throw new ServiceError('ID requerido', 400);
        try {
            const existing = await attendance_dao_1.default.get(id);
            if (!existing)
                throw new ServiceError('Registro no encontrado', 404);
            const updated = await attendance_dao_1.default.update(id, data);
            EventBus.emit('attendance:updated', {
                attendanceId: id,
                updatedBy
            });
            return updated;
        }
        catch (error) {
            if (error instanceof ServiceError)
                throw error;
            devLogger_1.default.error('[AttendanceService] Error actualizando asistencia', error);
            throw new ServiceError('Error al actualizar asistencia', 500);
        }
    }
    /**
     * Eliminar asistencia
     */
    async deleteAttendance(id, deletedBy) {
        if (!id)
            throw new ServiceError('ID requerido', 400);
        try {
            const existing = await attendance_dao_1.default.get(id);
            if (!existing)
                throw new ServiceError('Registro no encontrado', 404);
            await attendance_dao_1.default.delete(id);
            EventBus.emit('attendance:deleted', {
                attendanceId: id,
                studentId: existing.estudiante_id,
                deletedBy
            });
            return true;
        }
        catch (error) {
            if (error instanceof ServiceError)
                throw error;
            devLogger_1.default.error('[AttendanceService] Error eliminando asistencia', error);
            throw new ServiceError('Error al eliminar asistencia', 500);
        }
    }
    /**
     * Obtener registro de asistencia
     */
    async getAttendance(id) {
        if (!id)
            throw new ServiceError('ID requerido', 400);
        try {
            const attendance = await attendance_dao_1.default.get(id);
            if (!attendance)
                throw new ServiceError('Registro no encontrado', 404);
            return attendance;
        }
        catch (error) {
            if (error instanceof ServiceError)
                throw error;
            devLogger_1.default.error('[AttendanceService] Error obteniendo asistencia', error);
            throw new ServiceError('Error al obtener asistencia', 500);
        }
    }
    /**
     * Listar asistencias con filtros
     */
    async listAttendances(filters = {}) {
        try {
            const attendances = await attendance_dao_1.default.list(filters);
            return attendances;
        }
        catch (error) {
            devLogger_1.default.error('[AttendanceService] Error listando asistencias', error);
            throw new ServiceError('Error al listar asistencias', 500);
        }
    }
    /**
     * Obtener asistencias de un estudiante
     */
    async getStudentAttendances(studentId, filters = {}) {
        if (!studentId)
            throw new ServiceError('ID de estudiante requerido', 400);
        try {
            const attendances = await attendance_dao_1.default.getByStudent(studentId, filters);
            return attendances;
        }
        catch (error) {
            devLogger_1.default.error('[AttendanceService] Error obteniendo asistencias del estudiante', error);
            throw new ServiceError('Error al obtener asistencias del estudiante', 500);
        }
    }
    /**
     * Generar reporte de asistencia
     */
    async generateAttendanceReport(studentId, startDate, endDate) {
        if (!studentId)
            throw new ServiceError('ID de estudiante requerido', 400);
        try {
            const stats = await attendance_dao_1.default.getAttendanceRate(studentId, startDate, endDate);
            const records = await attendance_dao_1.default.getByStudent(studentId, {
                fecha_inicio: startDate,
                fecha_fin: endDate
            });
            return {
                studentId,
                period: { start: startDate, end: endDate },
                stats,
                records,
                hasIssues: parseFloat(stats.porcentaje_asistencia?.toString() || '0') < 85
            };
        }
        catch (error) {
            devLogger_1.default.error('[AttendanceService] Error generando reporte', error);
            throw new ServiceError('Error al generar reporte', 500);
        }
    }
    /**
     * Obtener asistencia de una clase
     */
    async getClassAttendance(classId, date) {
        if (!classId)
            throw new ServiceError('ID de clase requerido', 400);
        if (!date)
            throw new ServiceError('Fecha requerida', 400);
        try {
            const attendances = await attendance_dao_1.default.getByClass(classId, date);
            const stats = {
                total: attendances.length,
                present: attendances.filter(a => a.presente).length,
                absent: attendances.filter(a => !a.presente).length,
                attendanceRate: attendances.length > 0
                    ? ((attendances.filter(a => a.presente).length / attendances.length) * 100).toFixed(2)
                    : 0
            };
            return { attendances, stats, classId, date };
        }
        catch (error) {
            devLogger_1.default.error('[AttendanceService] Error obteniendo asistencia de clase', error);
            throw new ServiceError('Error al obtener asistencia de clase', 500);
        }
    }
    /**
     * Verificar patrón de ausentismo
     */
    async checkAbsenteeismPattern(studentId) {
        try {
            const patterns = await attendance_dao_1.default.detectAbsenteeismPatterns(studentId);
            // Detectar si hay 3+ faltas en una ventana de 5 días
            const hasPattern = patterns.some(p => p.faltas_consecutivas >= 3);
            if (hasPattern) {
                EventBus.emit('attendance:pattern_detected', {
                    studentId,
                    type: 'frequent_absences',
                    severity: 'medium',
                    details: 'Más de 3 faltas en 5 días'
                });
                devLogger_1.default.log(`[AttendanceService] ⚠️ Patrón de ausentismo detectado: Estudiante ${studentId}`);
            }
            return { hasPattern, patterns };
        }
        catch (error) {
            devLogger_1.default.error('[AttendanceService] Error verificando patrón de ausentismo', error);
            // No lanzar error, solo registrar
            return { hasPattern: false, patterns: [] };
        }
    }
    /**
     * Justificar falta
     */
    async justifyAbsence(attendanceId, motivo, justifiedBy) {
        if (!attendanceId)
            throw new ServiceError('ID de asistencia requerido', 400);
        if (!motivo)
            throw new ServiceError('Motivo requerido', 400);
        try {
            const attendance = await attendance_dao_1.default.get(attendanceId);
            if (!attendance)
                throw new ServiceError('Registro no encontrado', 404);
            if (attendance.presente) {
                throw new ServiceError('No se puede justificar una asistencia', 400);
            }
            const updated = await attendance_dao_1.default.update(attendanceId, {
                justificada: true,
                motivo
            });
            EventBus.emit('attendance:absence_justified', {
                attendanceId,
                studentId: attendance.estudiante_id,
                justifiedBy,
                motivo
            });
            return updated;
        }
        catch (error) {
            if (error instanceof ServiceError)
                throw error;
            devLogger_1.default.error('[AttendanceService] Error justificando falta', error);
            throw new ServiceError('Error al justificar falta', 500);
        }
    }
    // ==========================================
    // VALIDACIONES
    // ==========================================
    _validateAttendanceData(data) {
        if (!data.estudiante_id)
            throw new ServiceError('ID de estudiante requerido', 400);
        if (!data.fecha)
            throw new ServiceError('Fecha requerida', 400);
        if (data.presente === undefined)
            throw new ServiceError('Estado de presencia requerido', 400);
        // Validar que la fecha no sea futura
        const attendanceDate = new Date(data.fecha);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (attendanceDate > today) {
            throw new ServiceError('No se puede marcar asistencia para fechas futuras', 400);
        }
    }
}
exports.default = new AttendanceService();
module.exports = new AttendanceService();
module.exports.ServiceError = ServiceError;
//# sourceMappingURL=attendance.service.js.map