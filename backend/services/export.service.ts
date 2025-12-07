/**
 * 📦 EXPORT SERVICE - TypeScript Version
 * Exportación de datos a múltiples formatos (CSV, JSON, Excel, PDF)
 * GDPR Compliant
 * Refactorizado: 07 Diciembre 2025
 */

const devLogger = require('../utils/devLogger');

// ============================================
// INTERFACES
// ============================================

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

// ============================================
// EXPORT SERVICE CLASS
// ============================================

class ExportService {

    async exportData(data: any, format: string = 'json', options: ExportOptions = {}): Promise<string | Buffer> {
        devLogger.log('EXPORT', `Exporting data to ${format}`, {
            dataType: Array.isArray(data) ? 'array' : 'object',
            itemCount: Array.isArray(data) ? data.length : 1
        });

        try {
            switch (format.toLowerCase()) {
                case 'json':
                    return this.exportToJSON(data, options);
                case 'csv':
                    return this.exportToCSV(data, options);
                case 'excel':
                    return await this.exportToExcel(data, options);
                case 'pdf':
                    return await this.exportToPDF(data, options);
                default:
                    throw new Error(`Formato no soportado: ${format}`);
            }
        } catch (error: any) {
            devLogger.error('EXPORT', `Error exporting to ${format}`, error.message);
            throw error;
        }
    }

    exportToJSON(data: any, options: ExportOptions = {}): string {
        devLogger.log('EXPORT', 'Exporting to JSON');

        try {
            const indent = options.pretty ? (options.indent || 2) : undefined;
            const json = JSON.stringify(data, null, indent);
            devLogger.log('EXPORT', 'JSON export completed', { size: json.length });
            return json;
        } catch (error: any) {
            devLogger.error('EXPORT', 'Error exporting to JSON', error.message);
            throw error;
        }
    }

    exportToCSV(data: any[], options: ExportOptions = {}): string {
        devLogger.log('EXPORT', 'Exporting to CSV', { rows: data.length });

        try {
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('Los datos deben ser un array no vacío');
            }

            const delimiter = options.delimiter || ',';
            const includeHeaders = options.headers !== false;
            const columns = options.columns || Object.keys(data[0]);

            let csv = '';

            if (includeHeaders) {
                csv += columns.map(col => this._escapeCSVValue(col)).join(delimiter) + '\n';
            }

            for (const row of data) {
                const values = columns.map(col => {
                    const value = row[col];
                    return this._escapeCSVValue(value);
                });
                csv += values.join(delimiter) + '\n';
            }

            devLogger.log('EXPORT', 'CSV export completed', { rows: data.length, columns: columns.length });
            return csv;
        } catch (error: any) {
            devLogger.error('EXPORT', 'Error exporting to CSV', error.message);
            throw error;
        }
    }

    async exportToExcel(data: any[], options: ExportOptions = {}): Promise<Buffer> {
        devLogger.log('EXPORT', 'Exporting to Excel', { rows: data.length });
        throw new Error('Exportación a Excel aún no implementada. Use CSV como alternativa.');
    }

    async exportToPDF(data: any, options: ExportOptions = {}): Promise<Buffer> {
        devLogger.log('EXPORT', 'Exporting to PDF');
        throw new Error('Exportación a PDF aún no implementada. Use JSON o CSV como alternativa.');
    }

    async exportStudents(students: any[], format: string = 'csv'): Promise<string | Buffer> {
        devLogger.log('EXPORT', `Exporting ${students.length} students to ${format}`);

        try {
            const safeData: StudentExport[] = students.map(student => ({
                id: student.id,
                nombre: student.nombre,
                email: student.email,
                role: student.role,
                status: student.status,
                created_at: student.created_at
            }));

            return await this.exportData(safeData, format, {
                headers: true,
                columns: ['id', 'nombre', 'email', 'role', 'status', 'created_at']
            });
        } catch (error: any) {
            devLogger.error('EXPORT', 'Error exporting students', error.message);
            throw error;
        }
    }

    async exportGrades(grades: any[], format: string = 'csv'): Promise<string | Buffer> {
        devLogger.log('EXPORT', `Exporting ${grades.length} grades to ${format}`);

        try {
            const safeData: GradeExport[] = grades.map(grade => ({
                estudiante_id: grade.estudiante_id,
                estudiante_nombre: grade.estudiante_nombre,
                materia: grade.materia,
                calificacion: grade.calificacion,
                periodo: grade.periodo,
                fecha: grade.fecha
            }));

            return await this.exportData(safeData, format, {
                headers: true,
                columns: ['estudiante_id', 'estudiante_nombre', 'materia', 'calificacion', 'periodo', 'fecha']
            });
        } catch (error: any) {
            devLogger.error('EXPORT', 'Error exporting grades', error.message);
            throw error;
        }
    }

    async exportAttendance(attendance: any[], format: string = 'csv'): Promise<string | Buffer> {
        devLogger.log('EXPORT', `Exporting ${attendance.length} attendance records to ${format}`);

        try {
            const safeData = attendance.map(record => ({
                estudiante_id: record.estudiante_id,
                estudiante_nombre: record.estudiante_nombre,
                fecha: record.fecha,
                status: record.status,
                materia: record.materia
            }));

            return await this.exportData(safeData, format, {
                headers: true,
                columns: ['estudiante_id', 'estudiante_nombre', 'fecha', 'status', 'materia']
            });
        } catch (error: any) {
            devLogger.error('EXPORT', 'Error exporting attendance', error.message);
            throw error;
        }
    }

    private _escapeCSVValue(value: any): string {
        if (value === null || value === undefined) {
            return '';
        }

        let stringValue = String(value);

        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            stringValue = stringValue.replace(/"/g, '""');
            return `"${stringValue}"`;
        }

        return stringValue;
    }

    private _convertToTable(data: any[]): TableData {
        if (!Array.isArray(data) || data.length === 0) {
            return { headers: [], rows: [] };
        }

        const headers = Object.keys(data[0]);
        const rows = data.map(row => headers.map(header => row[header]));

        return { headers, rows };
    }

    generateFilename(baseName: string, extension: string): string {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        return `${baseName}_${timestamp}.${extension}`;
    }
}

// ============================================
// EXPORTS
// ============================================

const exportService = new ExportService();

export { ExportService };
export default exportService;

module.exports = exportService;
module.exports.ExportService = ExportService;
