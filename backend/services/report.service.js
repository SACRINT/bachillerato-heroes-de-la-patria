/**
 * 📄 REPORT SERVICE
 * Servicio para generación de documentos PDF (Boletas, Reportes, etc.)
 */

const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const devLogger = require('../utils/devLogger');
const GradesService = require('./grades.service');
const StudentDAO = require('../data/student.dao');

class ReportService {

    constructor() {
        this.templateCache = {};
    }

    /**
     * Generar boleta de calificaciones en PDF
     * @param {number} estudianteId 
     * @param {string} cicloEscolar (e.g. '2025-2026')
     * @returns {Buffer} PDF buffer
     */
    async generateStudentReportCard(estudianteId, cicloEscolar) {
        try {
            // 1. Obtener Datos
            console.log(`Generando boleta para Estudiante ${estudianteId}, Ciclo ${cicloEscolar}`);

            const [reportData, studentData] = await Promise.all([
                GradesService.getStudentReportCard(estudianteId, cicloEscolar),
                StudentDAO.get(estudianteId) // Necesitamos nombre completo, grupo, etc.
            ]);

            // TODO: Si StudentDAO.get no devuelve nombre completo join, necesitamos ajustar.
            // Asumimos que StudentDAO.get devuelve info básica.
            // Si falta info, GradesService podría devolverla enriquecida si la query lo incluye.

            // Preparar contexto para la plantilla
            const context = {
                nombreCompleto: `${studentData.nombre} ${studentData.apellido_paterno} ${studentData.apellido_materno}`,
                matricula: studentData.matricula,
                semestre: studentData.semestre || 'N/A',
                grupo: studentData.grupo || 'A', // Fallback
                cicloEscolar: cicloEscolar,
                fechaEmision: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }),
                materias: reportData.materias // Array de {materia, clave, promedio_final, parciales: {P1, P2...}}
            };

            // 2. Renderizar HTML
            const html = await this.renderTemplate('boleta', context);

            // 3. Generar PDF con Puppeteer
            const browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox'] // Necesario en algunos entornos containerizados
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

        } catch (error) {
            devLogger.error('REPORTS', 'Error generando boleta PDF', error);
            throw new Error('No se pudo generar el reporte PDF');
        }
    }

    /**
     * Renderizar plantilla Handlebars
     */
    async renderTemplate(templateName, data) {
        // Cachear compilación si se desea optimizar
        // if (this.templateCache[templateName]) { ... }

        try {
            const templatePath = path.join(__dirname, '../templates', `${templateName}.hbs`);
            const templateContent = await fs.readFile(templatePath, 'utf-8');
            const template = handlebars.compile(templateContent);
            return template(data);
        } catch (error) {
            devLogger.error('REPORTS', `Error leyendo plantilla ${templateName}`, error);
            throw error;
        }
    }
}

module.exports = new ReportService();
