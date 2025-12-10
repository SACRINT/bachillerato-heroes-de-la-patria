/**
 * 📄 REPORT SERVICE - TypeScript Version
 * Servicio para generación de documentos PDF
 * Refactorizado: 07 Diciembre 2025
 */
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
declare class ReportService {
    private templateCache;
    constructor();
    /**
     * Generar boleta de calificaciones en PDF
     */
    generateStudentReportCard(estudianteId: number, cicloEscolar: string): Promise<Buffer>;
    /**
     * Renderizar plantilla Handlebars
     */
    renderTemplate(templateName: string, data: Record<string, any>): Promise<string>;
}
declare const reportService: ReportService;
export { ReportService };
export default reportService;
//# sourceMappingURL=report.service.d.ts.map