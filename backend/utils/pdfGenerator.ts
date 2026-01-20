/**
 * 📄 PDF GENERATOR SERVICE
 * Generación de boletas, reportes de asistencia y otros documentos
 * Actualizado: 19 Enero 2026
 */

import PDFDocument from 'pdfkit';
import { Response } from 'express';

// ============================================
// INTERFACES
// ============================================

interface SubjectGrade {
    materia: string;
    profesor: string;
    parcial1?: number | string;
    parcial2?: number | string;
    parcial3?: number | string;
    promedioFinal: number | string;
    faltas: number;
}

interface ReportCardData {
    studentName: string;
    matricula: string;
    grupo: string;
    cicloEscolar: string;
    promedioGeneral: number | string;
    grades: SubjectGrade[];
}

interface AttendanceRecord {
    fecha: string | Date;
    materia: string;
    presente: boolean;
    justificada?: boolean;
    motivo?: string;
}

interface AttendanceReportData {
    studentName: string;
    matricula: string;
    grupo: string;
    periodo: { start: string; end: string };
    records: AttendanceRecord[];
    stats: {
        totalClases: number;
        asistencias: number;
        faltas: number;
        faltasJustificadas: number;
        porcentajeAsistencia: number;
    };
}

interface ClassAttendanceData {
    className: string;
    grupo: string;
    profesor: string;
    fecha: string | Date;
    students: Array<{
        nombre: string;
        matricula: string;
        presente: boolean;
        observaciones?: string;
    }>;
    stats: {
        total: number;
        presentes: number;
        ausentes: number;
    };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function addHeader(doc: any, title: string): void {
    doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('BACHILLERATO GENERAL ESTATAL', { align: 'center' })
        .text('HÉROES DE LA PATRIA', { align: 'center' })
        .moveDown(0.5)
        .fontSize(12)
        .font('Helvetica')
        .text('CLAVE: 21EBH0000X', { align: 'center' })
        .moveDown(0.5)
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(title, { align: 'center' })
        .moveDown();
}

function addFooter(doc: any): void {
    const bottomY = 750;
    doc.fontSize(8)
        .font('Helvetica')
        .text(`Fecha de impresión: ${new Date().toLocaleDateString('es-MX')}`, 50, bottomY)
        .text('Generado por Sistema BGE Héroes de la Patria', 400, bottomY);
}

// ============================================
// REPORT CARD PDF (Boletas)
// ============================================

export const generateReportCardPDF = (data: ReportCardData, res: Response) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Stream to response
    doc.pipe(res);

    // --- Header ---
    doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('BACHILLERATO GENERAL ESTATAL', { align: 'center' })
        .text('HÉROES DE LA PATRIA', { align: 'center' })
        .translate(0, 10)
        .fontSize(12)
        .font('Helvetica')
        .text('CLAVE: 21EBH0000X', { align: 'center' }) // Placeholder CCT
        .translate(0, 20)
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('BOLETA DE CALIFICACIONES', { align: 'center' })
        .moveDown();

    // --- Student Info ---
    doc.translate(0, 20);

    const startX = 50;
    let currentY = doc.y;

    doc.font('Helvetica-Bold').fontSize(10).text('ALUMNO:', startX, currentY);
    doc.font('Helvetica').text(data.studentName.toUpperCase(), startX + 70, currentY);

    currentY += 15;
    doc.font('Helvetica-Bold').text('MATRÍCULA:', startX, currentY);
    doc.font('Helvetica').text(data.matricula, startX + 70, currentY);

    doc.font('Helvetica-Bold').text('GRUPO:', 350, currentY - 15);
    doc.font('Helvetica').text(data.grupo, 400, currentY - 15);

    doc.font('Helvetica-Bold').text('CICLO:', 350, currentY);
    doc.font('Helvetica').text(data.cicloEscolar, 400, currentY);

    // --- Trades Table Header ---
    doc.moveDown(2);
    currentY = doc.y + 20;

    const colX = {
        materia: 50,
        p1: 300,
        p2: 340,
        p3: 380,
        final: 430,
        faltas: 480
    };

    // Table Header Background
    doc.rect(50, currentY, 500, 20).fill('#e0e0e0').stroke();

    doc.fillColor('black').font('Helvetica-Bold').fontSize(9);
    doc.text('MATERIA / ASIGNATURA', colX.materia + 5, currentY + 5);
    doc.text('P1', colX.p1, currentY + 5);
    doc.text('P2', colX.p2, currentY + 5);
    doc.text('P3', colX.p3, currentY + 5);
    doc.text('FINAL', colX.final, currentY + 5);
    doc.text('FALTAS', colX.faltas, currentY + 5);

    // --- Table Rows ---
    currentY += 20;
    doc.font('Helvetica').fontSize(9);

    data.grades.forEach((grade, index) => {
        // Alternating row background
        if (index % 2 === 1) {
            doc.rect(50, currentY, 500, 25).fill('#f9f9f9').stroke();
        }

        doc.fillColor('black');

        // Truncate subject if too long
        let subjectName = grade.materia;
        if (subjectName.length > 45) subjectName = subjectName.substring(0, 42) + '...';

        doc.text(subjectName, colX.materia + 5, currentY + 5);

        // Print Professor Name in smaller font below subject
        doc.fontSize(7).fillColor('#666666');
        doc.text(grade.profesor || '', colX.materia + 5, currentY + 14);
        doc.fontSize(9).fillColor('black');

        doc.text(grade.parcial1?.toString() || '-', colX.p1, currentY + 5);
        doc.text(grade.parcial2?.toString() || '-', colX.p2, currentY + 5);
        doc.text(grade.parcial3?.toString() || '-', colX.p3, currentY + 5);

        doc.font('Helvetica-Bold').text(grade.promedioFinal.toString(), colX.final, currentY + 5).font('Helvetica');
        doc.text(grade.faltas.toString(), colX.faltas + 10, currentY + 5);

        // Draw line
        doc.moveTo(50, currentY + 25).lineTo(550, currentY + 25).strokeColor('#cccccc').stroke();

        currentY += 25; // Increase row height to accommodate professor name
    });

    // --- General Average ---
    currentY += 10;
    doc.font('Helvetica-Bold').fontSize(11).text('PROMEDIO GENERAL:', 350, currentY);
    doc.fontSize(12).text(data.promedioGeneral.toString(), 480, currentY);

    // --- Signatures ---
    const bottomY = 700;

    doc.moveTo(100, bottomY).lineTo(250, bottomY).strokeColor('black').stroke();
    doc.fontSize(10).font('Helvetica').text('DIRECTOR', 150, bottomY + 5);

    doc.moveTo(350, bottomY).lineTo(500, bottomY).stroke();
    doc.text('TUTOR', 405, bottomY + 5);

    doc.fontSize(8).text(`Fecha de impresión: ${new Date().toLocaleDateString()}`, 50, 750);
    doc.text('Generado por Sistema BGE Héroes de la Patria', 400, 750);

    doc.end();
};

// ============================================
// STUDENT ATTENDANCE REPORT PDF
// ============================================

export const generateAttendanceReportPDF = (data: AttendanceReportData, res: Response) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    // Header
    addHeader(doc, 'REPORTE DE ASISTENCIA');

    // Student Info
    const startX = 50;
    let currentY = doc.y + 10;

    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('ALUMNO:', startX, currentY);
    doc.font('Helvetica').text(data.studentName.toUpperCase(), startX + 70, currentY);

    currentY += 15;
    doc.font('Helvetica-Bold').text('MATRÍCULA:', startX, currentY);
    doc.font('Helvetica').text(data.matricula, startX + 70, currentY);

    doc.font('Helvetica-Bold').text('GRUPO:', 300, currentY - 15);
    doc.font('Helvetica').text(data.grupo, 350, currentY - 15);

    doc.font('Helvetica-Bold').text('PERIODO:', 300, currentY);
    doc.font('Helvetica').text(`${formatDate(data.periodo.start)} - ${formatDate(data.periodo.end)}`, 350, currentY);

    // Stats Summary Box
    currentY += 40;
    doc.rect(50, currentY, 500, 60).fill('#f0f8ff').stroke('#007bff');

    doc.fillColor('black').font('Helvetica-Bold').fontSize(11);
    doc.text('RESUMEN DE ASISTENCIA', 55, currentY + 10);

    doc.fontSize(10).font('Helvetica');
    doc.text(`Total de Clases: ${data.stats.totalClases}`, 55, currentY + 30);
    doc.text(`Asistencias: ${data.stats.asistencias}`, 200, currentY + 30);
    doc.text(`Faltas: ${data.stats.faltas}`, 320, currentY + 30);
    doc.text(`Justificadas: ${data.stats.faltasJustificadas}`, 420, currentY + 30);

    // Attendance percentage with color
    const pctColor = data.stats.porcentajeAsistencia >= 80 ? '#28a745' :
        data.stats.porcentajeAsistencia >= 60 ? '#ffc107' : '#dc3545';
    doc.font('Helvetica-Bold').text('Porcentaje:', 55, currentY + 45);
    doc.fillColor(pctColor).text(`${data.stats.porcentajeAsistencia.toFixed(1)}%`, 120, currentY + 45);
    doc.fillColor('black');

    // Attendance Table
    currentY += 80;

    // Table Header
    doc.rect(50, currentY, 500, 20).fill('#e0e0e0');
    doc.fillColor('black').font('Helvetica-Bold').fontSize(9);
    doc.text('FECHA', 55, currentY + 5);
    doc.text('MATERIA', 130, currentY + 5);
    doc.text('ESTADO', 380, currentY + 5);
    doc.text('OBSERVACIONES', 440, currentY + 5);

    currentY += 20;
    doc.font('Helvetica').fontSize(8);

    // Table Rows (limit to fit page)
    const maxRows = Math.min(data.records.length, 25);
    for (let i = 0; i < maxRows; i++) {
        const record = data.records[i];

        if (i % 2 === 1) {
            doc.rect(50, currentY, 500, 18).fill('#f9f9f9');
        }

        doc.fillColor('black');
        doc.text(formatDate(record.fecha), 55, currentY + 4);

        let materia = record.materia;
        if (materia.length > 35) materia = materia.substring(0, 32) + '...';
        doc.text(materia, 130, currentY + 4);

        const estado = record.presente ? 'Presente' :
            record.justificada ? 'Justificada' : 'Falta';
        const estadoColor = record.presente ? '#28a745' :
            record.justificada ? '#ffc107' : '#dc3545';
        doc.fillColor(estadoColor).text(estado, 380, currentY + 4);
        doc.fillColor('black');

        if (record.motivo) {
            let motivo = record.motivo;
            if (motivo.length > 15) motivo = motivo.substring(0, 12) + '...';
            doc.text(motivo, 440, currentY + 4);
        }

        currentY += 18;
    }

    if (data.records.length > maxRows) {
        doc.fontSize(8).fillColor('#666').text(
            `... y ${data.records.length - maxRows} registros más`,
            50, currentY + 5
        );
    }

    // Footer
    addFooter(doc);

    // Signatures
    const sigY = 700;
    doc.strokeColor('black');
    doc.moveTo(100, sigY).lineTo(250, sigY).stroke();
    doc.fontSize(10).font('Helvetica').fillColor('black').text('TUTOR', 160, sigY + 5);

    doc.moveTo(350, sigY).lineTo(500, sigY).stroke();
    doc.text('PADRE/TUTOR', 390, sigY + 5);

    doc.end();
};

// ============================================
// CLASS ATTENDANCE LIST PDF
// ============================================

export const generateClassAttendancePDF = (data: ClassAttendanceData, res: Response) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    // Header
    addHeader(doc, 'LISTA DE ASISTENCIA');

    // Class Info
    const startX = 50;
    let currentY = doc.y + 10;

    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('MATERIA:', startX, currentY);
    doc.font('Helvetica').text(data.className.toUpperCase(), startX + 70, currentY);

    currentY += 15;
    doc.font('Helvetica-Bold').text('GRUPO:', startX, currentY);
    doc.font('Helvetica').text(data.grupo, startX + 70, currentY);

    doc.font('Helvetica-Bold').text('PROFESOR:', 250, currentY - 15);
    doc.font('Helvetica').text(data.profesor, 310, currentY - 15);

    doc.font('Helvetica-Bold').text('FECHA:', 250, currentY);
    doc.font('Helvetica').text(formatDate(data.fecha), 310, currentY);

    // Stats
    currentY += 30;
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text(`Total: ${data.stats.total}`, 50, currentY);
    doc.fillColor('#28a745').text(`Presentes: ${data.stats.presentes}`, 150, currentY);
    doc.fillColor('#dc3545').text(`Ausentes: ${data.stats.ausentes}`, 280, currentY);
    doc.fillColor('black');

    // Attendance Table
    currentY += 30;

    // Table Header
    doc.rect(50, currentY, 500, 20).fill('#e0e0e0');
    doc.fillColor('black').font('Helvetica-Bold').fontSize(9);
    doc.text('#', 55, currentY + 5);
    doc.text('MATRÍCULA', 80, currentY + 5);
    doc.text('NOMBRE DEL ALUMNO', 180, currentY + 5);
    doc.text('ASIST.', 420, currentY + 5);
    doc.text('OBSERVACIONES', 470, currentY + 5);

    currentY += 20;
    doc.font('Helvetica').fontSize(8);

    // Table Rows
    data.students.forEach((student, index) => {
        if (currentY > 680) {
            // New page if needed
            doc.addPage();
            currentY = 50;
        }

        if (index % 2 === 1) {
            doc.rect(50, currentY, 500, 18).fill('#f9f9f9');
        }

        doc.fillColor('black');
        doc.text((index + 1).toString(), 55, currentY + 4);
        doc.text(student.matricula, 80, currentY + 4);

        let nombre = student.nombre;
        if (nombre.length > 35) nombre = nombre.substring(0, 32) + '...';
        doc.text(nombre, 180, currentY + 4);

        // Checkbox
        if (student.presente) {
            doc.fillColor('#28a745').text('✓', 430, currentY + 4);
        } else {
            doc.fillColor('#dc3545').text('✗', 430, currentY + 4);
        }
        doc.fillColor('black');

        if (student.observaciones) {
            let obs = student.observaciones;
            if (obs.length > 12) obs = obs.substring(0, 9) + '...';
            doc.text(obs, 470, currentY + 4);
        }

        currentY += 18;
    });

    // Footer
    addFooter(doc);

    // Signature
    const sigY = Math.min(currentY + 40, 700);
    doc.strokeColor('black').moveTo(350, sigY).lineTo(500, sigY).stroke();
    doc.fontSize(10).font('Helvetica').text('FIRMA DEL DOCENTE', 380, sigY + 5);

    doc.end();
};

// Export all functions
export default {
    generateReportCardPDF,
    generateAttendanceReportPDF,
    generateClassAttendancePDF
};
