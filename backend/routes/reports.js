"use strict";
/**
 * 📄 REPORTS ROUTES - TypeScript
 * Generación y descarga de documentos PDF (Boletas, Asistencia, etc.)
 * Actualizado: 19 Enero 2026
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const { authenticateToken, requireRole } = require('../middleware/auth.js');
const { executeQuery } = require('../config/database.js');
const { generateReportCardPDF, generateAttendanceReportPDF, generateClassAttendancePDF } = require('../utils/pdfGenerator.js');
const debugLog = require('../utils/debug-logger.js');
const { sanitizeError } = require('../middleware/errorHandler.js');
const router = express_1.default.Router();
// ============================================
// BOLETA (REPORT CARD)
// ============================================
/**
 * GET /api/reports/boleta/:studentId
 * Generate report card PDF for a student
 */
router.get('/boleta/:studentId', authenticateToken, async (req, res) => {
    try {
        const authReq = req;
        const { studentId } = req.params;
        const ciclo = req.query.ciclo || '2025-2026';
        // Get student info
        const studentInfo = await executeQuery(`
            SELECT u.nombre, u.apellido_paterno, u.apellido_materno,
                   e.matricula, g.nombre as grupo
            FROM usuarios u
            JOIN estudiantes e ON u.id = e.usuario_id
            LEFT JOIN grupos g ON e.grupo_id = g.id
            WHERE u.id = $1
        `, [studentId]);
        if (!studentInfo || studentInfo.length === 0) {
            res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
            return;
        }
        const student = studentInfo[0];
        // Get grades
        const grades = await executeQuery(`
            SELECT 
                m.nombre as materia,
                CONCAT(d.nombre, ' ', d.apellido_paterno) as profesor,
                c.parcial_1 as parcial1,
                c.parcial_2 as parcial2,
                c.parcial_3 as parcial3,
                c.promedio_final as promedioFinal,
                0 as faltas
            FROM calificaciones c
            JOIN materias m ON c.materia_id = m.id
            LEFT JOIN usuarios d ON m.docente_id = d.id
            WHERE c.estudiante_id = $1 AND c.ciclo_escolar = $2
            ORDER BY m.nombre
        `, [studentId, ciclo]);
        // Calculate average
        const validGrades = grades.filter((g) => g.promediofinal != null);
        const promedioGeneral = validGrades.length > 0
            ? (validGrades.reduce((sum, g) => sum + parseFloat(g.promediofinal), 0) / validGrades.length).toFixed(1)
            : 'N/A';
        const reportData = {
            studentName: `${student.nombre} ${student.apellido_paterno} ${student.apellido_materno || ''}`.trim(),
            matricula: student.matricula,
            grupo: student.grupo || 'N/A',
            cicloEscolar: ciclo,
            promedioGeneral,
            grades: grades.map((g) => ({
                materia: g.materia,
                profesor: g.profesor || 'N/A',
                parcial1: g.parcial1,
                parcial2: g.parcial2,
                parcial3: g.parcial3,
                promedioFinal: g.promediofinal || 'N/A',
                faltas: parseInt(g.faltas) || 0
            }))
        };
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="boleta_${student.matricula}_${ciclo}.pdf"`);
        generateReportCardPDF(reportData, res);
        debugLog.log('REPORTS', `Boleta generated for student ${studentId}`);
    }
    catch (error) {
        debugLog.error('REPORTS', 'Error generating boleta', sanitizeError(error, 'REPORTS'));
        res.status(500).json({ success: false, message: 'Error generando boleta' });
    }
});
// ============================================
// ATTENDANCE REPORTS
// ============================================
/**
 * GET /api/reports/asistencia/estudiante/:studentId
 * Generate attendance report PDF for a student
 */
router.get('/asistencia/estudiante/:studentId', authenticateToken, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { fecha_inicio, fecha_fin } = req.query;
        const endDate = fecha_fin ? new Date(fecha_fin) : new Date();
        const startDate = fecha_inicio ?
            new Date(fecha_inicio) :
            new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        // Get student info
        const studentInfo = await executeQuery(`
            SELECT u.nombre, u.apellido_paterno, u.apellido_materno,
                   e.matricula, g.nombre as grupo
            FROM usuarios u
            JOIN estudiantes e ON u.id = e.usuario_id
            LEFT JOIN grupos g ON e.grupo_id = g.id
            WHERE u.id = $1
        `, [studentId]);
        if (!studentInfo || studentInfo.length === 0) {
            res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
            return;
        }
        const student = studentInfo[0];
        // Get attendance records
        const records = await executeQuery(`
            SELECT a.fecha, m.nombre as materia, a.presente, a.justificada, a.motivo
            FROM asistencias a
            JOIN materias m ON a.materia_id = m.id
            WHERE a.estudiante_id = $1 
              AND a.fecha BETWEEN $2 AND $3
            ORDER BY a.fecha DESC
        `, [studentId, startDate.toISOString(), endDate.toISOString()]);
        // Calculate stats
        const totalClases = records.length;
        const asistencias = records.filter((r) => r.presente).length;
        const faltas = totalClases - asistencias;
        const faltasJustificadas = records.filter((r) => !r.presente && r.justificada).length;
        const porcentajeAsistencia = totalClases > 0 ? (asistencias / totalClases) * 100 : 0;
        const reportData = {
            studentName: `${student.nombre} ${student.apellido_paterno} ${student.apellido_materno || ''}`.trim(),
            matricula: student.matricula,
            grupo: student.grupo || 'N/A',
            periodo: {
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0]
            },
            records: records.map((r) => ({
                fecha: r.fecha,
                materia: r.materia,
                presente: r.presente,
                justificada: r.justificada,
                motivo: r.motivo
            })),
            stats: { totalClases, asistencias, faltas, faltasJustificadas, porcentajeAsistencia }
        };
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="asistencia_${student.matricula}.pdf"`);
        generateAttendanceReportPDF(reportData, res);
        debugLog.log('REPORTS', `Attendance report generated for student ${studentId}`);
    }
    catch (error) {
        debugLog.error('REPORTS', 'Error generating attendance report', sanitizeError(error, 'REPORTS'));
        res.status(500).json({ success: false, message: 'Error generando reporte de asistencia' });
    }
});
/**
 * GET /api/reports/asistencia/clase/:classId
 * Generate class attendance list PDF
 */
router.get('/asistencia/clase/:classId', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    try {
        const { classId } = req.params;
        const { fecha } = req.query;
        const date = fecha ? new Date(fecha) : new Date();
        // Get class info
        const classInfo = await executeQuery(`
            SELECT m.nombre as materia, g.nombre as grupo,
                   CONCAT(d.nombre, ' ', d.apellido_paterno) as profesor
            FROM materias m
            JOIN grupos g ON m.grupo_id = g.id
            LEFT JOIN usuarios d ON m.docente_id = d.id
            WHERE m.id = $1
        `, [classId]);
        if (!classInfo || classInfo.length === 0) {
            res.status(404).json({ success: false, message: 'Clase no encontrada' });
            return;
        }
        const classData = classInfo[0];
        // Get students and attendance
        const students = await executeQuery(`
            SELECT 
                CONCAT(u.apellido_paterno, ' ', u.apellido_materno, ' ', u.nombre) as nombre,
                e.matricula,
                COALESCE(a.presente, false) as presente,
                a.comentarios as observaciones
            FROM inscripciones_materias im
            JOIN usuarios u ON im.usuario_id = u.id
            JOIN estudiantes e ON u.id = e.usuario_id
            LEFT JOIN asistencias a ON a.estudiante_id = u.id 
                AND a.materia_id = $1 
                AND DATE(a.fecha) = DATE($2)
            WHERE im.materia_id = $1 AND im.activo = true
            ORDER BY u.apellido_paterno, u.apellido_materno, u.nombre
        `, [classId, date.toISOString()]);
        const presentes = students.filter((s) => s.presente).length;
        const reportData = {
            className: classData.materia,
            grupo: classData.grupo,
            profesor: classData.profesor || 'N/A',
            fecha: date,
            students: students.map((s) => ({
                nombre: s.nombre,
                matricula: s.matricula,
                presente: s.presente,
                observaciones: s.observaciones
            })),
            stats: { total: students.length, presentes, ausentes: students.length - presentes }
        };
        const dateStr = date.toISOString().split('T')[0];
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="lista_asistencia_${classId}_${dateStr}.pdf"`);
        generateClassAttendancePDF(reportData, res);
        debugLog.log('REPORTS', `Class attendance PDF generated for class ${classId}`);
    }
    catch (error) {
        debugLog.error('REPORTS', 'Error generating class attendance PDF', sanitizeError(error, 'REPORTS'));
        res.status(500).json({ success: false, message: 'Error generando lista de asistencia' });
    }
});
/**
 * GET /api/reports/available
 * List available reports
 */
router.get('/available', authenticateToken, async (req, res) => {
    const authReq = req;
    const role = authReq.user.role;
    const reports = [];
    if (['estudiante', 'padre'].includes(role)) {
        reports.push({ id: 'boleta', name: 'Boleta de Calificaciones', endpoint: '/api/reports/boleta/:studentId' }, { id: 'asistencia', name: 'Reporte de Asistencia', endpoint: '/api/reports/asistencia/estudiante/:studentId' });
    }
    if (['docente', 'admin'].includes(role)) {
        reports.push({ id: 'lista-asistencia', name: 'Lista de Asistencia', endpoint: '/api/reports/asistencia/clase/:classId' });
    }
    res.json({ success: true, data: reports });
});
exports.default = router;
