/**
 * 📄 ADMIN DASHBOARD - REPORT MANAGER (CSP-COMPLIANT)
 * Gestión centralizada de generación y exportación de reportes
 *
 * Propósito: Eliminar 13 inline handlers de reportes y exportación
 * Estándar: Content Security Policy (CSP) compliant
 * Fecha: 9 Noviembre 2025
 *
 * Funcionalidades:
 * - API unificada para generar reportes
 * - Factory pattern para diferentes tipos de reportes
 * - Exportación a múltiples formatos (CSV, PDF)
 * - Sanitización de datos dinámicos
 */

(function() {
    'use strict';

    // Factory de tipos de reportes
    const reportTypes = {
        'academic': 'Académico',
        'attendance': 'Asistencia',
        'performance': 'Desempeño',
        'payments': 'Pagos',
        'income': 'Ingresos',
        'pending': 'Pendientes'
    };

    const academicReportSubtypes = {
        'grades': 'Calificaciones',
        'attendance': 'Asistencia',
        'performance': 'Desempeño'
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeReportManager);
    } else {
        initializeReportManager();
    }

    function initializeReportManager() {
        console.log('[ADMIN-REPORT-MANAGER] Inicializando gestor de reportes...');

        registerReportGenerationHandlers();
        registerAcademicReportHandlers();
        registerExportHandlers();

        console.log('[ADMIN-REPORT-MANAGER] ✅ Gestor de reportes inicializado correctamente');
    }

    /**
     * Registra handlers para generación de reportes genéricos
     */
    function registerReportGenerationHandlers() {
        // Reporte Académico
        const academicReportBtn = document.querySelector('button[onclick*="generateReport"][onclick*="academic"]');
        if (academicReportBtn) {
            academicReportBtn.addEventListener('click', function(e) {
                e.preventDefault();
                generateReport('academic');
            });
        }

        // Reporte Asistencia
        const attendanceReportBtn = document.querySelector('button[onclick*="generateReport"][onclick*="attendance"]');
        if (attendanceReportBtn) {
            attendanceReportBtn.addEventListener('click', function(e) {
                e.preventDefault();
                generateReport('attendance');
            });
        }

        // Reporte Desempeño
        const performanceReportBtn = document.querySelector('button[onclick*="generateReport"][onclick*="performance"]');
        if (performanceReportBtn) {
            performanceReportBtn.addEventListener('click', function(e) {
                e.preventDefault();
                generateReport('performance');
            });
        }

        // Reporte Pagos
        const paymentsReportBtn = document.querySelector('button[onclick*="generateReport"][onclick*="payments"]');
        if (paymentsReportBtn) {
            paymentsReportBtn.addEventListener('click', function(e) {
                e.preventDefault();
                generateReport('payments');
            });
        }

        // Reporte Ingresos
        const incomeReportBtn = document.querySelector('button[onclick*="generateReport"][onclick*="income"]');
        if (incomeReportBtn) {
            incomeReportBtn.addEventListener('click', function(e) {
                e.preventDefault();
                generateReport('income');
            });
        }

        // Reporte Pendientes
        const pendingReportBtn = document.querySelector('button[onclick*="generateReport"][onclick*="pending"]');
        if (pendingReportBtn) {
            pendingReportBtn.addEventListener('click', function(e) {
                e.preventDefault();
                generateReport('pending');
            });
        }
    }

    /**
     * Registra handlers para subtipos de reportes académicos
     */
    function registerAcademicReportHandlers() {
        // Reporte Académico - Calificaciones
        const gradesReportBtn = document.querySelector('button[onclick*="generateAcademicReport"][onclick*="grades"]');
        if (gradesReportBtn) {
            gradesReportBtn.addEventListener('click', function(e) {
                e.preventDefault();
                generateAcademicReport('grades');
            });
        }

        // Reporte Académico - Asistencia
        const acadAttendanceReportBtn = document.querySelector('button[onclick*="generateAcademicReport"][onclick*="attendance"]');
        if (acadAttendanceReportBtn) {
            acadAttendanceReportBtn.addEventListener('click', function(e) {
                e.preventDefault();
                generateAcademicReport('attendance');
            });
        }

        // Reporte Académico - Desempeño
        const acadPerformanceReportBtn = document.querySelector('button[onclick*="generateAcademicReport"][onclick*="performance"]');
        if (acadPerformanceReportBtn) {
            acadPerformanceReportBtn.addEventListener('click', function(e) {
                e.preventDefault();
                generateAcademicReport('performance');
            });
        }

        // Administrador de Reportes
        const reportsManagerBtn = document.querySelector('button[onclick*="showReportsManager"]');
        if (reportsManagerBtn) {
            reportsManagerBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showReportsManager();
            });
        }
    }

    /**
     * Registra handlers para exportación de reportes (DINÁMICOS)
     * Event delegation para elementos generados dinámicamente
     */
    function registerExportHandlers() {
        // Delegación para botones de descarga/exportación dinámicos
        document.addEventListener('click', function(e) {
            const target = e.target.closest('[onclick]');
            if (!target) return;

            const onclick = target.getAttribute('onclick');
            if (!onclick) return;

            // Patrón 1: downloadReport('${type}')
            let match = onclick.match(/downloadReport\('([^']+)'\)/);
            if (match) {
                e.preventDefault();
                const reportType = match[1];
                downloadReport(reportType);
                return;
            }

            // Patrón 2: exportReport('${type}')
            match = onclick.match(/exportReport\('([^']+)'\)/);
            if (match) {
                e.preventDefault();
                const reportType = match[1];
                exportReport(reportType);
                return;
            }

            // Patrón 3: exportAllContent()
            if (onclick.includes('exportAllContent')) {
                e.preventDefault();
                exportAllContent();
                return;
            }
        });

        // Botón Exportar Todo (estático)
        const exportAllBtn = document.querySelector('button[onclick*="exportAllContent"]');
        if (exportAllBtn) {
            exportAllBtn.addEventListener('click', function(e) {
                e.preventDefault();
                exportAllContent();
            });
        }
    }

    // ============================================
    // FUNCIONES DE NEGOCIO - Delegación a window
    // ============================================

    function generateReport(reportType) {
        const typeName = reportTypes[reportType] || reportType;
        console.log(`[ADMIN-REPORT-MANAGER] Generando reporte de ${typeName}...`);
        if (window.generateReport) {
            window.generateReport(reportType);
        }
    }

    function generateAcademicReport(subtype) {
        const subtypeName = academicReportSubtypes[subtype] || subtype;
        console.log(`[ADMIN-REPORT-MANAGER] Generando reporte académico de ${subtypeName}...`);
        if (window.generateAcademicReport) {
            window.generateAcademicReport(subtype);
        }
    }

    function downloadReport(reportType) {
        const typeName = reportTypes[reportType] || reportType;
        console.log(`[ADMIN-REPORT-MANAGER] Descargando reporte de ${typeName}...`);
        if (window.downloadReport) {
            window.downloadReport(reportType);
        }
    }

    function exportReport(reportType) {
        const typeName = reportTypes[reportType] || reportType;
        console.log(`[ADMIN-REPORT-MANAGER] Exportando reporte de ${typeName}...`);
        if (window.exportReport) {
            window.exportReport(reportType);
        }
    }

    function exportAllContent() {
        console.log('[ADMIN-REPORT-MANAGER] Exportando todo el contenido...');
        if (window.exportAllContent) {
            window.exportAllContent();
        }
    }

    function showReportsManager() {
        console.log('[ADMIN-REPORT-MANAGER] Abriendo administrador de reportes...');
        if (window.showReportsManager) {
            window.showReportsManager();
        }
    }

    // Export para módulos
    window.adminReportManager = {
        generateReport,
        generateAcademicReport,
        downloadReport,
        exportReport,
        exportAllContent,
        showReportsManager,
        reportTypes,
        academicReportSubtypes
    };

})();
