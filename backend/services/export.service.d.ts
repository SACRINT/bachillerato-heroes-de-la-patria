/**
 * 📦 EXPORT SERVICE - TypeScript Version
 * Exportación de datos a múltiples formatos (CSV, JSON, Excel, PDF)
 * GDPR Compliant
 * Refactorizado: 07 Diciembre 2025
 */
export interface ExportOptions {
    pretty?: boolean;
    indent?: number;
    headers?: boolean;
    delimiter?: string;
    columns?: string[];
    sheetName?: string;
    title?: string;
}
export interface TableData {
    headers: string[];
    rows: any[][];
}
export interface StudentExport {
    id: number;
    nombre: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
}
export interface GradeExport {
    estudiante_id: number;
    estudiante_nombre: string;
    materia: string;
    calificacion: number;
    periodo: string;
    fecha: string;
}
declare class ExportService {
    exportData(data: any, format?: string, options?: ExportOptions): Promise<string | Buffer>;
    exportToJSON(data: any, options?: ExportOptions): string;
    exportToCSV(data: any[], options?: ExportOptions): string;
    exportToExcel(data: any[], options?: ExportOptions): Promise<Buffer>;
    exportToPDF(data: any, options?: ExportOptions): Promise<Buffer>;
    exportStudents(students: any[], format?: string): Promise<string | Buffer>;
    exportGrades(grades: any[], format?: string): Promise<string | Buffer>;
    exportAttendance(attendance: any[], format?: string): Promise<string | Buffer>;
    private _escapeCSVValue;
    private _convertToTable;
    generateFilename(baseName: string, extension: string): string;
}
declare const exportService: ExportService;
export { ExportService };
export default exportService;
//# sourceMappingURL=export.service.d.ts.map