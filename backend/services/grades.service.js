/**
 * 🎓 GRADES SERVICE
 * Lógica de negocio para gestión de calificaciones.
 */

const GradeDAO = require('../data/grade.dao');
const PeriodosEvaluacionDAO = require('../data/periodos-evaluacion.dao');
const SubjectDAO = require('../data/subject.dao');
const devLogger = require('../utils/devLogger');

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
        const periodo = await PeriodosEvaluacionDAO.get(periodoEvaluacionId);
        if (!periodo) {
            throw new Error('Periodo de evaluación no encontrado');
        }

        const now = new Date();
        const isOpen = periodo.estado === 'activo' &&
            (!periodo.fecha_inicio_captura || now >= periodo.fecha_inicio_captura) &&
            (!periodo.fecha_fin_captura || now <= periodo.fecha_fin_captura);

        // Permitir que administradores capturen fuera de tiempo si se requiere
        if (!isOpen && user.role !== 'admin') {
            throw new Error('El periodo de evaluación no está abierto para captura en este momento');
        }

        // 3. Verificar si ya existe calificación
        const existing = await GradeDAO.exists(estudianteId, materiaId, periodoEvaluacionId);

        if (existing) {
            // Actualizar si ya existe
            devLogger.log('GRADES', `Actualizando calificación existente: ID ${existing.id}`);
            return await GradeDAO.update(existing.id, {
                calificacion,
                observaciones: data.observaciones,
                faltas: data.faltas,
                captured_by: user.id
            });
        } else {
            // Crear nueva
            return await GradeDAO.create({
                estudiante_id: estudianteId,
                materia_id: materiaId,
                periodo_evaluacion_id: periodoEvaluacionId,
                calificacion,
                observaciones: data.observaciones,
                faltas: data.faltas,
                captured_by: user.id
            });
        }
    }

    /**
     * Obtener boleta de calificaciones
     */
    async getStudentReportCard(estudianteId, cicloEscolar) {
        // Obtener todas las califs del estudiante
        const grades = await GradeDAO.getByStudent(estudianteId, { cicloEscolar });

        // Agrupar por materia
        const reportCard = {};

        grades.forEach(grade => {
            const materiaKey = grade.materia_id || grade.materia_nombre; // Usar ID si posible, nombre fallback
            if (!reportCard[materiaKey]) {
                reportCard[materiaKey] = {
                    materia: grade.materia_nombre,
                    clave: grade.materia_clave,
                    semestre: grade.semestre,
                    creditos: grade.creditos,
                    parciales: {}
                };
            }
            // Asignar calificación al periodo correspondiente
            if (grade.periodo_codigo) {
                reportCard[materiaKey].parciales[grade.periodo_codigo] = parseFloat(grade.calificacion);
            }
        });

        // Calcular promedios por materia (simple)
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
    async getAllPeriods() {
        return await PeriodosEvaluacionDAO.getAll();
    }

    /**
     * Obtener materias asignadas a un docente
     */
    async getTeacherSubjects(docenteId) {
        return await SubjectDAO.getByTeacher(docenteId);
    }

    /**
     * Obtener estudiantes inscritos en una materia para captura
     */
    async getSubjectStudents(materiaId) {
        return await SubjectDAO.getStudentsInSubject(materiaId);
    }
}

module.exports = new GradesService();
