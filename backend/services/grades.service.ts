/**
 * 🎓 GRADES SERVICE - TypeScript
 * Lógica de negocio para gestión de calificaciones.
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import GradeDAO from '../data/grades.dao';
import PeriodosEvaluacionDAO from '../data/periodos-evaluacion.dao';
import SubjectDAO from '../data/subject.dao';
import devLogger from '../utils/devLogger';

// =====================================================
// INTERFACES
// =====================================================

export interface CaptureGradeData {
    estudianteId: number;
    materiaId: number;
    periodoEvaluacionId: number;
    calificacion: number;
    observaciones?: string;
    faltas?: number;
}

export interface UserContext {
    id: number;
    role: string;
}

export interface ReportCardSubject {
    materia: string;
    clave: string;
    semestre: string;
    creditos: number;
    parciales: { [periodo: string]: number };
    promedio_final?: string;
}

export interface ReportCard {
    estudianteId: number;
    cicloEscolar: string;
    materias: ReportCardSubject[];
}

// =====================================================
// GRADES SERVICE CLASS
// =====================================================

class GradesService {

    /**
     * Capturar calificación
     * Valida reglas de negocio: periodo abierto, rango de calificación, unicidad.
     */
    async captureGrade(data: CaptureGradeData, user: UserContext): Promise<any> {
        const { estudianteId, materiaId, periodoEvaluacionId, calificacion } = data;

        // 1. Validar rango de calificación
        if (calificacion < 0 || calificacion > 10) {
            throw new Error('La calificación debe estar entre 0 y 10');
        }

        // 2. Validar que el periodo de evaluación esté abierto para captura
        const periodo = await PeriodosEvaluacionDAO.get(periodoEvaluacionId);
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
        const existing = await (GradeDAO as any).exists?.(estudianteId, materiaId, periodoEvaluacionId);

        if (existing) {
            // Actualizar si ya existe
            devLogger.log(`[GradesService] Actualizando calificación existente: ID ${existing.id}`);
            return await GradeDAO.update(existing.id, {
                calificacion,
                observaciones: data.observaciones,
                tipoEvaluacion: 'parcial'
            });
        } else {
            // Crear nueva
            return await GradeDAO.create({
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
    async getStudentReportCard(estudianteId: number, cicloEscolar: string): Promise<ReportCard> {
        // Obtener todas las califs del estudiante
        const grades = await GradeDAO.getByStudent(estudianteId);

        // Agrupar por materia
        const reportCard: { [key: string]: ReportCardSubject } = {};

        grades.forEach((grade: any) => {
            const materiaKey = grade.materia_id || grade.materia_nombre;
            if (!reportCard[materiaKey]) {
                reportCard[materiaKey] = {
                    materia: grade.materia_nombre || 'Sin nombre',
                    clave: grade.materia_clave || '',
                    semestre: grade.semestre || '',
                    creditos: grade.creditos || 0,
                    parciales: {}
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
            } else {
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
    async getAllPeriods(): Promise<any[]> {
        return await (PeriodosEvaluacionDAO as any).getAll?.() || (PeriodosEvaluacionDAO as any).list?.() || [];
    }

    /**
     * Obtener materias asignadas a un docente
     */
    async getTeacherSubjects(docenteId: number): Promise<any[]> {
        return await SubjectDAO.getByTeacher(docenteId);
    }

    /**
     * Obtener estudiantes inscritos en una materia para captura
     */
    async getSubjectStudents(materiaId: number): Promise<any[]> {
        return await SubjectDAO.getStudentsInSubject(materiaId);
    }
}

export default new GradesService();
module.exports = new GradesService();
