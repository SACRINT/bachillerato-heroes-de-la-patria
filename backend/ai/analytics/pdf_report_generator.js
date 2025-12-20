/**
 * 📄 PDF REPORT GENERATOR - Semana 9 Tarea 6
 * 
 * Servicio para generar reportes en formato PDF
 * Usa datos estructurados del servicio de analítica
 * 
 * NOTA: Este módulo genera la estructura de datos.
 * La generación real del PDF se hace en el frontend con jsPDF/pdfmake
 * 
 * @author AI Architect Agent
 * @date Diciembre 2025
 */

const descriptiveAnalytics = require('./descriptive_analytics_service');
const devLogger = require('../../utils/devLogger');

class PDFReportGenerator {
    constructor() {
        this.templates = {
            weekly: this.getWeeklyTemplate(),
            monthly: this.getMonthlyTemplate(),
            executive: this.getExecutiveTemplate()
        };
    }

    getWeeklyTemplate() {
        return {
            title: 'Reporte Semanal de Analíticas',
            sections: ['summary', 'kpis', 'attendance', 'grades', 'aiUsage', 'anomalies'],
            includeCharts: true,
            includeRecommendations: true
        };
    }

    getMonthlyTemplate() {
        return {
            title: 'Reporte Mensual de Analíticas',
            sections: ['summary', 'kpis', 'trends', 'clusters', 'anomalies', 'predictions'],
            includeCharts: true,
            includeRecommendations: true,
            includeHistorical: true
        };
    }

    getExecutiveTemplate() {
        return {
            title: 'Reporte Ejecutivo',
            sections: ['summary', 'kpis', 'recommendations'],
            includeCharts: false,
            includeRecommendations: true,
            condensed: true
        };
    }

    /**
     * Genera estructura completa de datos para un reporte PDF
     * @param {string} templateType - Tipo de template (weekly, monthly, executive)
     * @returns {Object} Datos estructurados para generar PDF
     */
    async generateReportData(templateType = 'weekly') {
        const template = this.templates[templateType] || this.templates.weekly;

        try {
            const sections = [];

            // Obtener datos según las secciones del template
            if (template.sections.includes('summary')) {
                const summary = await descriptiveAnalytics.generateWeeklySummary();
                sections.push({
                    id: 'summary',
                    title: 'Resumen Ejecutivo',
                    type: 'text',
                    content: summary.fullNarrative,
                    subsections: summary.sections
                });
            }

            if (template.sections.includes('kpis')) {
                const dashboard = await descriptiveAnalytics.getExecutiveDashboard();
                sections.push({
                    id: 'kpis',
                    title: 'Indicadores Clave de Rendimiento',
                    type: 'metrics',
                    data: dashboard.kpis,
                    layout: 'grid' // 2x2 grid para KPIs
                });
            }

            if (template.sections.includes('clusters')) {
                const clusters = await descriptiveAnalytics.getStudentClusters();
                sections.push({
                    id: 'clusters',
                    title: 'Distribución de Estudiantes por Rendimiento',
                    type: 'chart',
                    chartType: 'pie',
                    data: clusters.chartData,
                    summary: `Total: ${clusters.totalStudents} estudiantes clasificados en ${clusters.data.length} grupos.`
                });
            }

            if (template.sections.includes('anomalies')) {
                const anomalies = await descriptiveAnalytics.detectAnomalies();
                sections.push({
                    id: 'anomalies',
                    title: 'Anomalías Detectadas',
                    type: 'table',
                    columns: ['Categoría', 'Severidad', 'Descripción', 'Valor', 'Rango Esperado'],
                    data: anomalies.anomalies.map(a => ({
                        categoria: a.category,
                        severidad: a.severity,
                        descripcion: a.message,
                        valor: a.value,
                        rangoEsperado: a.expectedRange
                    })),
                    emptyMessage: 'No se detectaron anomalías en este período.'
                });
            }

            if (template.includeRecommendations) {
                const insights = await descriptiveAnalytics.generateAutoInsights();
                sections.push({
                    id: 'recommendations',
                    title: 'Recomendaciones',
                    type: 'list',
                    items: insights.recommendations.map(r => ({
                        priority: r.priority,
                        action: r.action,
                        reason: r.reason
                    }))
                });
            }

            return {
                metadata: {
                    title: template.title,
                    institution: 'BGE Héroes de la Patria',
                    generatedAt: new Date().toISOString(),
                    templateType,
                    version: '1.0.0'
                },
                sections,
                styling: this.getDefaultStyling(),
                footer: {
                    text: 'Generado automáticamente por el Sistema de Analítica Inteligente',
                    pageNumbers: true,
                    confidential: true
                }
            };
        } catch (error) {
            devLogger.error('PDF_GENERATOR', 'Error generando datos de reporte:', error.message);
            throw error;
        }
    }

    getDefaultStyling() {
        return {
            colors: {
                primary: '#1e40af',    // blue-800
                secondary: '#6b7280',  // gray-500
                success: '#22c55e',    // green-500
                warning: '#f59e0b',    // amber-500
                danger: '#ef4444',     // red-500
                background: '#ffffff'
            },
            fonts: {
                title: { size: 24, bold: true },
                sectionTitle: { size: 18, bold: true },
                body: { size: 12, bold: false },
                caption: { size: 10, italic: true }
            },
            margins: {
                top: 40,
                right: 40,
                bottom: 40,
                left: 40
            },
            spacing: {
                sectionGap: 20,
                paragraphGap: 10
            }
        };
    }

    /**
     * Genera datos para reporte rápido (una página)
     */
    async generateQuickReport() {
        try {
            const dashboard = await descriptiveAnalytics.getExecutiveDashboard();
            const alerts = await descriptiveAnalytics.checkMetricAlerts();

            return {
                metadata: {
                    title: 'Reporte Rápido',
                    generatedAt: new Date().toISOString()
                },
                kpis: dashboard.kpis,
                alertCount: alerts.alerts?.length || 0,
                criticalAlerts: alerts.criticalCount || 0,
                status: alerts.hasAlerts ? 'attention_required' : 'normal',
                onePage: true
            };
        } catch (error) {
            devLogger.error('PDF_GENERATOR', 'Error en reporte rápido:', error.message);
            throw error;
        }
    }
}

module.exports = new PDFReportGenerator();
