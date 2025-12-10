declare const _exports: ReportService;
export = _exports;
declare class ReportService {
    /**
     * Generar reporte de estudiante
     * @param {number} studentId - ID del estudiante
     * @param {string} reportType - Tipo de reporte (academic, attendance, complete)
     * @returns {Promise<Object>} Reporte generado
     */
    generateStudentReport(studentId: number, reportType?: string): Promise<any>;
    /**
     * Generar reporte de grupo/clase
     * @param {number} groupId - ID del grupo
     * @returns {Promise<Object>} Reporte del grupo
     */
    generateGroupReport(groupId: number): Promise<any>;
    /**
     * Obtener analíticas generales del sistema
     * @param {Object} filters - Filtros de fecha, grupo, etc
     * @returns {Promise<Object>} Analíticas
     */
    getAnalytics(filters?: any): Promise<any>;
    /**
     * Exportar reporte a formato específico
     * @param {Object} reportData - Datos del reporte
     * @param {string} format - Formato (json, csv, pdf)
     * @returns {Promise<Buffer|String>} Reporte exportado
     */
    exportReport(reportData: any, format?: string): Promise<Buffer | string>;
    /**
     * Calcular estadísticas académicas
     * @private
     */
    private _calculateAcademicStats;
    /**
     * Calcular estadísticas de asistencia
     * @private
     */
    private _calculateAttendanceStats;
    /**
     * Calcular promedio de grupo
     * @private
     */
    private _calculateGroupAverage;
    /**
     * Obtener calificación más alta
     * @private
     */
    private _getHighestGrade;
    /**
     * Obtener calificación más baja
     * @private
     */
    private _getLowestGrade;
    /**
     * Calcular tasa de aprobación
     * @private
     */
    private _calculatePassRate;
    /**
     * Convertir datos a CSV
     * @private
     */
    private _convertToCSV;
}
//# sourceMappingURL=ReportService.d.ts.map