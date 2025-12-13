"use strict";
/**
 * 🎓 GRADES SERVICE - TypeScript
 * Lógica de negocio para gestión de calificaciones.
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const grades_dao_1 = __importDefault(require("../data/grades.dao"));
const periodos_evaluacion_dao_1 = __importDefault(require("../data/periodos-evaluacion.dao"));
const subject_dao_1 = __importDefault(require("../data/subject.dao"));
const devLogger_1 = __importDefault(require("../utils/devLogger"));
// =====================================================
// GRADES SERVICE CLASS
// =====================================================
class GradesService {
    /**
     * Capturar calificación
     * Valida reglas de negocio: periodo abierto, rango de calificación, unicidad.
     */
    async captureGrade(data, user) {
        const { estudianteId, materiaId, periodoEvaluacionId, calificacion } = data;
        // 1. Validar rango de calificación
        if (calificacion < 0 || calificacion > 10) {
            throw new Error('La calificación debe estar entre 0 y 10');
        }
        // 2. Validar que el periodo de evaluación esté abierto para captura
        const periodo = await periodos_evaluacion_dao_1.default.get(periodoEvaluacionId);
        if (!periodo) {
            throw new Error('Periodo de evaluación no encontrado');
        }
        const now = new Date();
        const isOpen = periodo.estado === 'activo' &&
            (!periodo.fecha_inicio_captura || now >= new Date(periodo.fecha_inicio_captura)) &&
            (!periodo.fecha_fin_captura || now <= new Date(periodo.fecha_fin_captura));
        // Permitir que administradores capturen fuera de tiempo si se requiere
        if (!isOpen && user.role !== 'admin') {
            throw new Error('El periodo de evaluación no está abierto para captura en este momento');
        }
        // 3. Verificar si ya existe calificación
        const existing = await grades_dao_1.default.exists?.(estudianteId, materiaId, periodoEvaluacionId);
        if (existing) {
            // Actualizar si ya existe
            devLogger_1.default.log(`[GradesService] Actualizando calificación existente: ID ${existing.id}`);
            return await grades_dao_1.default.update(existing.id, {
                calificacion,
                observaciones: data.observaciones,
                tipoEvaluacion: 'parcial'
            });
        }
        else {
            // Crear nueva
            return await grades_dao_1.default.create({
                estudianteId,
                materiaId,
                calificacion,
                tipoEvaluacion: 'parcial',
                periodoAcademico: periodo.codigo || periodo.id.toString(),
                observaciones: data.observaciones,
                docenteId: user.id
            });
        }
    }
    /**
     * Obtener boleta de calificaciones
     */
    async getStudentReportCard(estudianteId, cicloEscolar) {
        // Obtener todas las califs del estudiante
        const grades = await grades_dao_1.default.getByStudent(estudianteId);
        // Agrupar por materia
        const reportCard = {};
        grades.forEach((grade) => {
            const materiaKey = grade.materia_id || grade.materia_nombre;
            if (!reportCard[materiaKey]) {
                reportCard[materiaKey] = {
                    materia: grade.materia_nombre || 'Sin nombre',
                    clave: grade.materia_clave || '',
                    semestre: grade.semestre || '',
                    creditos: grade.creditos || 0,
                    parciales: {},
                    docente: grade.docente_nombre ? `${grade.docente_nombre} ${grade.docente_apellido || ''}`.trim() : 'Sin Asignar'
                };
            }
            // Asignar calificación al periodo correspondiente
            if (grade.periodo_academico) {
                reportCard[materiaKey].parciales[grade.periodo_academico] = parseFloat(grade.calificacion);
            }
        });
        // Calcular promedios por materia
        Object.values(reportCard).forEach(materia => {
            const califs = Object.values(materia.parciales);
            if (califs.length > 0) {
                const sum = califs.reduce((a, b) => a + b, 0);
                materia.promedio_final = (sum / califs.length).toFixed(1);
            }
            else {
                materia.promedio_final = '-';
            }
        });
        return {
            estudianteId,
            cicloEscolar,
            materias: Object.values(reportCard)
        };
    }
    // --- Métodos de Ayuda para Frontend ---
    /**
     * Obtener listado de periodos de evaluación
     */
    async getAllPeriods() {
        return await periodos_evaluacion_dao_1.default.getAll?.() || periodos_evaluacion_dao_1.default.list?.() || [];
    }
    /**
     * Obtener materias asignadas a un docente
     */
    async getTeacherSubjects(docenteId) {
        return await subject_dao_1.default.getByTeacher(docenteId);
    }
    /**
     * Obtener estudiantes inscritos en una materia para captura
     */
    async getSubjectStudents(materiaId) {
        return await subject_dao_1.default.getStudentsInSubject(materiaId);
    }
    /**
     * Obtener calificaciones de un grupo para un periodo específico
     */
    async getGradesByGroup(materiaId, periodoId) {
        const periodo = await periodos_evaluacion_dao_1.default.get(periodoId);
        if (!periodo)
            throw new Error('Periodo no encontrado');
        const periodoCode = periodo.codigo || periodo.id.toString();
        const result = await grades_dao_1.default.getAll({
            materiaId,
            periodo: periodoCode,
            limit: 1000
        });
        return result.rows;
    }
}
exports.default = new GradesService();
module.exports = new GradesService();
//# sourceMappingURL=grades.service.js.map