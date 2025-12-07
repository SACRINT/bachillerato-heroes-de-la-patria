/**
 * 📊 ATTENDANCE SERVICE - TypeScript
 * Servicio de gestión de asistencias escolares
 * 
 * Patrón Service Layer - Lógica de negocio independiente
 * Migración TypeScript: 07 Diciembre 2025
 */

import AttendanceDAO from '../data/attendance.dao';
import { AttendanceRow, AttendanceFilters, AttendanceRate, BulkAttendanceRecord } from '../data/attendance.dao';
import devLogger from '../utils/devLogger';

// EventBus import - using dynamic require for JS module compatibility
const EventBus = require('./eventBus.service').getInstance();

// =====================================================
// INTERFACES
// =====================================================

export class ServiceError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.name = 'ServiceError';
        this.statusCode = statusCode;
    }
}

export interface AttendanceCreateData {
    estudiante_id: number;
    materia_id: number;
    fecha: Date | string;
    presente: boolean;
    justificada?: boolean;
    motivo?: string;
    comentarios?: string;
    registrado_por: number;
}

export interface BulkAttendanceResult {
    attendances: AttendanceRow[];
    stats: {
        total: number;
        present: number;
        absent: number;
    };
}

export interface AttendanceReportResult {
    studentId: number;
    period: { start: Date | string; end: Date | string };
    stats: AttendanceRate;
    records: AttendanceRow[];
    hasIssues: boolean;
}

export interface ClassAttendanceResult {
    attendances: AttendanceRow[];
    stats: {
        total: number;
        present: number;
        absent: number;
        attendanceRate: string | number;
    };
    classId: number;
    date: Date | string;
}

// =====================================================
// ATTENDANCE SERVICE CLASS
// =====================================================

class AttendanceService {

    /**
     * Marcar asistencia individual
     */
    async markAttendance(data: AttendanceCreateData): Promise<AttendanceRow> {
        this._validateAttendanceData(data);

        try {
            const attendance = await AttendanceDAO.create(data as any);

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

            devLogger.log(`[AttendanceService] Asistencia marcada: Estudiante ${attendance.estudiante_id} - ${attendance.presente ? 'Presente' : 'Ausente'}`);

            return attendance;
        } catch (error: any) {
            devLogger.error('[AttendanceService] Error marcando asistencia', error);
            throw new ServiceError('Error al marcar asistencia', 500);
        }
    }

    /**
     * Marcar asistencia masiva (lista de clase)
     */
    async markBulkAttendance(attendanceRecords: BulkAttendanceRecord[], registeredBy: number): Promise<BulkAttendanceResult> {
        if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
            throw new ServiceError('Se requiere al menos un registro de asistencia', 400);
        }

        try {
            // Agregar registrado_por a todos los registros
            const recordsWithUser = attendanceRecords.map(record => ({
                ...record,
                registrado_por: registeredBy
            }));

            const results = await AttendanceDAO.markBulkAttendance(recordsWithUser);

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

            devLogger.log(`[AttendanceService] Asistencia masiva marcada: ${stats.present}/${stats.total} presentes`);

            return { attendances: results, stats };
        } catch (error: any) {
            devLogger.error('[AttendanceService] Error en asistencia masiva', error);
            throw new ServiceError('Error al marcar asistencia masiva', 500);
        }
    }

    /**
     * Actualizar asistencia
     */
    async updateAttendance(id: number, data: any, updatedBy: number): Promise<AttendanceRow> {
        if (!id) throw new ServiceError('ID requerido', 400);

        try {
            const existing = await AttendanceDAO.get(id);
            if (!existing) throw new ServiceError('Registro no encontrado', 404);

            const updated = await AttendanceDAO.update(id, data);

            EventBus.emit('attendance:updated', {
                attendanceId: id,
                updatedBy
            });

            return updated;
        } catch (error: any) {
            if (error instanceof ServiceError) throw error;
            devLogger.error('[AttendanceService] Error actualizando asistencia', error);
            throw new ServiceError('Error al actualizar asistencia', 500);
        }
    }

    /**
     * Eliminar asistencia
     */
    async deleteAttendance(id: number, deletedBy: number): Promise<boolean> {
        if (!id) throw new ServiceError('ID requerido', 400);

        try {
            const existing = await AttendanceDAO.get(id);
            if (!existing) throw new ServiceError('Registro no encontrado', 404);

            await AttendanceDAO.delete(id);

            EventBus.emit('attendance:deleted', {
                attendanceId: id,
                studentId: existing.estudiante_id,
                deletedBy
            });

            return true;
        } catch (error: any) {
            if (error instanceof ServiceError) throw error;
            devLogger.error('[AttendanceService] Error eliminando asistencia', error);
            throw new ServiceError('Error al eliminar asistencia', 500);
        }
    }

    /**
     * Obtener registro de asistencia
     */
    async getAttendance(id: number): Promise<AttendanceRow> {
        if (!id) throw new ServiceError('ID requerido', 400);

        try {
            const attendance = await AttendanceDAO.get(id);
            if (!attendance) throw new ServiceError('Registro no encontrado', 404);
            return attendance;
        } catch (error: any) {
            if (error instanceof ServiceError) throw error;
            devLogger.error('[AttendanceService] Error obteniendo asistencia', error);
            throw new ServiceError('Error al obtener asistencia', 500);
        }
    }

    /**
     * Listar asistencias con filtros
     */
    async listAttendances(filters: AttendanceFilters = {}): Promise<AttendanceRow[]> {
        try {
            const attendances = await AttendanceDAO.list(filters);
            return attendances;
        } catch (error: any) {
            devLogger.error('[AttendanceService] Error listando asistencias', error);
            throw new ServiceError('Error al listar asistencias', 500);
        }
    }

    /**
     * Obtener asistencias de un estudiante
     */
    async getStudentAttendances(studentId: number, filters: AttendanceFilters = {}): Promise<AttendanceRow[]> {
        if (!studentId) throw new ServiceError('ID de estudiante requerido', 400);

        try {
            const attendances = await AttendanceDAO.getByStudent(studentId, filters);
            return attendances;
        } catch (error: any) {
            devLogger.error('[AttendanceService] Error obteniendo asistencias del estudiante', error);
            throw new ServiceError('Error al obtener asistencias del estudiante', 500);
        }
    }

    /**
     * Generar reporte de asistencia
     */
    async generateAttendanceReport(studentId: number, startDate: Date | string, endDate: Date | string): Promise<AttendanceReportResult> {
        if (!studentId) throw new ServiceError('ID de estudiante requerido', 400);

        try {
            const stats = await AttendanceDAO.getAttendanceRate(studentId, startDate, endDate);
            const records = await AttendanceDAO.getByStudent(studentId, {
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
        } catch (error: any) {
            devLogger.error('[AttendanceService] Error generando reporte', error);
            throw new ServiceError('Error al generar reporte', 500);
        }
    }

    /**
     * Obtener asistencia de una clase
     */
    async getClassAttendance(classId: number, date: Date | string): Promise<ClassAttendanceResult> {
        if (!classId) throw new ServiceError('ID de clase requerido', 400);
        if (!date) throw new ServiceError('Fecha requerida', 400);

        try {
            const attendances = await AttendanceDAO.getByClass(classId, date);

            const stats = {
                total: attendances.length,
                present: attendances.filter(a => a.presente).length,
                absent: attendances.filter(a => !a.presente).length,
                attendanceRate: attendances.length > 0
                    ? ((attendances.filter(a => a.presente).length / attendances.length) * 100).toFixed(2)
                    : 0
            };

            return { attendances, stats, classId, date };
        } catch (error: any) {
            devLogger.error('[AttendanceService] Error obteniendo asistencia de clase', error);
            throw new ServiceError('Error al obtener asistencia de clase', 500);
        }
    }

    /**
     * Verificar patrón de ausentismo
     */
    async checkAbsenteeismPattern(studentId: number): Promise<{ hasPattern: boolean; patterns: any[] }> {
        try {
            const patterns = await AttendanceDAO.detectAbsenteeismPatterns(studentId);

            // Detectar si hay 3+ faltas en una ventana de 5 días
            const hasPattern = patterns.some(p => p.faltas_consecutivas >= 3);

            if (hasPattern) {
                EventBus.emit('attendance:pattern_detected', {
                    studentId,
                    type: 'frequent_absences',
                    severity: 'medium',
                    details: 'Más de 3 faltas en 5 días'
                });

                devLogger.log(`[AttendanceService] ⚠️ Patrón de ausentismo detectado: Estudiante ${studentId}`);
            }

            return { hasPattern, patterns };
        } catch (error: any) {
            devLogger.error('[AttendanceService] Error verificando patrón de ausentismo', error);
            // No lanzar error, solo registrar
            return { hasPattern: false, patterns: [] };
        }
    }

    /**
     * Justificar falta
     */
    async justifyAbsence(attendanceId: number, motivo: string, justifiedBy: number): Promise<AttendanceRow> {
        if (!attendanceId) throw new ServiceError('ID de asistencia requerido', 400);
        if (!motivo) throw new ServiceError('Motivo requerido', 400);

        try {
            const attendance = await AttendanceDAO.get(attendanceId);
            if (!attendance) throw new ServiceError('Registro no encontrado', 404);

            if (attendance.presente) {
                throw new ServiceError('No se puede justificar una asistencia', 400);
            }

            const updated = await AttendanceDAO.update(attendanceId, {
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
        } catch (error: any) {
            if (error instanceof ServiceError) throw error;
            devLogger.error('[AttendanceService] Error justificando falta', error);
            throw new ServiceError('Error al justificar falta', 500);
        }
    }

    // ==========================================
    // VALIDACIONES
    // ==========================================

    private _validateAttendanceData(data: AttendanceCreateData): void {
        if (!data.estudiante_id) throw new ServiceError('ID de estudiante requerido', 400);
        if (!data.fecha) throw new ServiceError('Fecha requerida', 400);
        if (data.presente === undefined) throw new ServiceError('Estado de presencia requerido', 400);

        // Validar que la fecha no sea futura
        const attendanceDate = new Date(data.fecha);
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (attendanceDate > today) {
            throw new ServiceError('No se puede marcar asistencia para fechas futuras', 400);
        }
    }
}

export default new AttendanceService();
module.exports = new AttendanceService();
module.exports.ServiceError = ServiceError;
