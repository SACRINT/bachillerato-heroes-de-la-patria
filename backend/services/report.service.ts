/**
 * 📄 REPORT SERVICE - TypeScript Version
 * Servicio para generación de documentos PDF
 * Refactorizado: 07 Diciembre 2025
 */

const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const devLogger = require('../utils/devLogger');
const GradesService = require('./grades.service');
const StudentDAO = require('../data/student.dao');

// ============================================
// INTERFACES
// ============================================

export interface StudentData {
    id: number;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    matricula: string;
    semestre?: string;
    grupo?: string;
}

export interface MateriaGrade {
    materia: string;
    clave: string;
    promedio_final: number;
    parciales: Record<string, number>;
}

export interface ReportData {
    materias: MateriaGrade[];
}

export interface ReportContext {
    nombreCompleto: string;
    matricula: string;
    semestre: string;
    grupo: string;
    cicloEscolar: string;
    fechaEmision: string;
    materias: MateriaGrade[];
}

// ============================================
// REPORT SERVICE CLASS
// ============================================

class ReportService {
    private templateCache: Record<string, any>;

    constructor() {
        this.templateCache = {};
    }

    /**
     * Generar boleta de calificaciones en PDF
     */
    async generateStudentReportCard(estudianteId: number, cicloEscolar: string): Promise<Buffer> {
        try {
            console.log(`Generando boleta para Estudiante ${estudianteId}, Ciclo ${cicloEscolar}`);

            const [reportData, studentData]: [ReportData, StudentData] = await Promise.all([
                GradesService.getStudentReportCard(estudianteId, cicloEscolar),
                StudentDAO.get(estudianteId)
            ]);

            // Preparar contexto para la plantilla
            const context: ReportContext = {
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

        } catch (error: any) {
            devLogger.error('REPORTS', 'Error generando boleta PDF', error);
            throw new Error('No se pudo generar el reporte PDF');
        }
    }

    /**
     * Renderizar plantilla Handlebars
     */
    async renderTemplate(templateName: string, data: Record<string, any>): Promise<string> {
        try {
            const templatePath = path.join(__dirname, '../templates', `${templateName}.hbs`);
            const templateContent = await fs.readFile(templatePath, 'utf-8');
            const template = handlebars.compile(templateContent);
            return template(data);
        } catch (error: any) {
            devLogger.error('REPORTS', `Error leyendo plantilla ${templateName}`, error);
            throw error;
        }
    }
}

// ============================================
// EXPORTS
// ============================================

const reportService = new ReportService();

export { ReportService };
export default reportService;

module.exports = reportService;
module.exports.ReportService = ReportService;
