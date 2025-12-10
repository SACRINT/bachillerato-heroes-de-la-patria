declare const _exports: ExportService;
export = _exports;
declare class ExportService {
    /**
     * Exportar datos a formato especificado
     * @param {Array|Object} data - Datos a exportar
     * @param {string} format - Formato (json, csv, excel, pdf)
     * @param {Object} options - Opciones de exportación
     * @returns {Promise<Buffer|String>} Datos exportados
     */
    exportData(data: any[] | any, format?: string, options?: any): Promise<Buffer | string>;
    /**
     * Exportar a JSON
     * @param {*} data - Datos
     * @param {Object} options - Opciones (pretty, indent)
     * @returns {string} JSON string
     */
    exportToJSON(data: any, options?: any): string;
    /**
     * Exportar a CSV
     * @param {Array} data - Array de objetos
     * @param {Object} options - Opciones (headers, delimiter, columns)
     * @returns {string} CSV string
     */
    exportToCSV(data: any[], options?: any): string;
    /**
     * Exportar a Excel (XLSX)
     * @param {Array} data - Array de objetos
     * @param {Object} options - Opciones (sheetName, columns)
     * @returns {Promise<Buffer>} Excel buffer
     */
    exportToExcel(data: any[], options?: any): Promise<Buffer>;
    /**
     * Exportar a PDF
     * @param {*} data - Datos
     * @param {Object} options - Opciones (title, orientation, pageSize)
     * @returns {Promise<Buffer>} PDF buffer
     */
    exportToPDF(data: any, options?: any): Promise<Buffer>;
    /**
     * Exportar tabla de estudiantes
     * @param {Array} students - Array de estudiantes
     * @param {string} format - Formato de exportación
     * @returns {Promise<string|Buffer>} Datos exportados
     */
    exportStudents(students: any[], format?: string): Promise<string | Buffer>;
    /**
     * Exportar reporte de calificaciones
     * @param {Array} grades - Array de calificaciones
     * @param {string} format - Formato de exportación
     * @returns {Promise<string|Buffer>} Datos exportados
     */
    exportGrades(grades: any[], format?: string): Promise<string | Buffer>;
    /**
     * Exportar reporte de asistencia
     * @param {Array} attendance - Array de asistencias
     * @param {string} format - Formato de exportación
     * @returns {Promise<string|Buffer>} Datos exportados
     */
    exportAttendance(attendance: any[], format?: string): Promise<string | Buffer>;
    /**
     * Escapar valor para CSV (manejar comas, comillas, saltos de línea)
     * @private
     */
    private _escapeCSVValue;
    /**
     * Convertir datos a formato tabular (para Excel/PDF)
     * @private
     */
    private _convertToTable;
    /**
     * Generar nombre de archivo con timestamp
     * @param {string} baseName - Nombre base del archivo
     * @param {string} extension - Extensión (.csv, .json, etc)
     * @returns {string} Nombre de archivo con timestamp
     */
    generateFilename(baseName: string, extension: string): string;
}
//# sourceMappingURL=ExportService.d.ts.map