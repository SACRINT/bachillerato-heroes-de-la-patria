"use strict";
/**
 * 📄 REPORT SERVICE - TypeScript Version
 * Servicio para generación de documentos PDF
 * Refactorizado: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
// const puppeteer = require('puppeteer'); // Lazy loaded
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const devLogger = require('../utils/devLogger.js');
const GradesService = require('./grades.service.js');
const StudentDAO = require('../data/student.dao.js');
// ============================================
// REPORT SERVICE CLASS
// ============================================
class ReportService {
    constructor() {
        this.templateCache = {};
    }
    /**
     * Generar boleta de calificaciones en PDF
     */
    async generateStudentReportCard(estudianteId, cicloEscolar) {
        try {
            console.log(`Generando boleta para Estudiante ${estudianteId}, Ciclo ${cicloEscolar}`);
            const [reportData, studentData] = await Promise.all([
                GradesService.getStudentReportCard(estudianteId, cicloEscolar),
                StudentDAO.get(estudianteId)
            ]);
            // Preparar contexto para la plantilla
            const context = {
                nombreCompleto: `${studentData.nombre} ${studentData.apellido_paterno} ${studentData.apellido_materno || ''}`.trim(),
                matricula: studentData.matricula,
                semestre: studentData.semestre || 'N/A',
                grupo: studentData.grupo || 'A',
                cicloEscolar: cicloEscolar,
                fechaEmision: new Date().toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                materias: reportData.materias
            };
            // Renderizar HTML
            const html = await this.renderTemplate('boleta', context);
            // Generar PDF con Puppeteer
            // NOTA: Puppeteer eliminado para reducir tamaño del bundle en Vercel (Serverless Function Size Limit)
            console.warn('[REPORTS] Generación de PDF deshabilitada en Vercel para optimizar tamaño.');
            throw new Error('La generación de PDF no está disponible en la versión Cloud.');

            /*
            let puppeteer;
            try {
                puppeteer = require('puppeteer');
            } catch (e) {
                console.warn('[REPORTS] Puppeteer no disponible:', e.message);
                throw new Error('Generación de PDF no disponible en este entorno');
            }

            const browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({
                format: 'Letter',
                printBackground: true,
                margin: {
                    top: '20px',
                    bottom: '20px',
                    left: '20px',
                    right: '20px'
                }
            });
            await browser.close();
            return pdfBuffer;
            */
        }
        catch (error) {
            devLogger.error('REPORTS', 'Error generando boleta PDF', error);
            throw new Error('No se pudo generar el reporte PDF');
        }
    }
    /**
     * Renderizar plantilla Handlebars
     */
    async renderTemplate(templateName, data) {
        try {
            const templatePath = path.join(__dirname, '../templates', `${templateName}.hbs`);
            const templateContent = await fs.readFile(templatePath, 'utf-8');
            const template = handlebars.compile(templateContent);
            return template(data);
        }
        catch (error) {
            devLogger.error('REPORTS', `Error leyendo plantilla ${templateName}`, error);
            throw error;
        }
    }
}
exports.ReportService = ReportService;
// ============================================
// EXPORTS
// ============================================
const reportService = new ReportService();
exports.default = reportService;
module.exports = reportService;
module.exports.ReportService = ReportService;
//# sourceMappingURL=report.service.js.map