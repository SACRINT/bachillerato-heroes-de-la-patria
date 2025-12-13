"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReportCardPDF = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const generateReportCardPDF = (data, res) => {
    const doc = new pdfkit_1.default({ margin: 50, size: 'A4' });
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
        if (subjectName.length > 45)
            subjectName = subjectName.substring(0, 42) + '...';
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
exports.generateReportCardPDF = generateReportCardPDF;
//# sourceMappingURL=pdfGenerator.js.map