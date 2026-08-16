/**
 * 📊 CALIFICACIONES - EVENT HANDLERS (CSP-COMPLIANT)
 * Todos los handlers refactorizados de inline onclick/onload a addEventListener
 *
 * Propósito: Eliminar 5 inline handlers que violan CSP ENFORCE mode
 * Estándar: Content Security Policy (CSP) compliant
 * Fecha: 9 Noviembre 2025
 *
 * Nota: Este archivo debe cargarse DESPUÉS de calificaciones.html
 */

(function() {
    'use strict';

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeEventHandlers);
    } else {
        initializeEventHandlers();
    }

    function initializeEventHandlers() {
        

        registerReportButtons();
        registerDetailsHandlers();

        
    }

    /**
     * Botones de generación de reportes
     */
    function registerReportButtons() {
        // Botón generar reporte general
        const generateReportBtn = document.querySelector('button[onclick*="generateReport"]');
        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', function(e) {
                e.preventDefault();
                generateReport();
            });
        }

        // Botón generar reporte de asistencia
        const generateAttendanceBtn = document.querySelector('button[onclick*="generateAttendanceReport"]');
        if (generateAttendanceBtn) {
            generateAttendanceBtn.addEventListener('click', function(e) {
                e.preventDefault();
                generateAttendanceReport();
            });
        }

        // Botón imprimir horario
        const printScheduleBtn = document.querySelector('button[onclick*="printSchedule"]');
        if (printScheduleBtn) {
            printScheduleBtn.addEventListener('click', function(e) {
                e.preventDefault();
                printSchedule();
            });
        }
    }

    /**
     * Handlers para mostrar detalles
     */
    function registerDetailsHandlers() {
        // Botones mostrar detalle de materia (dinámicos)
        document.addEventListener('click', function(e) {
            if (e.target.closest('button[onclick*="showSubjectDetail"]')) {
                e.preventDefault();
                const button = e.target.closest('button[onclick*="showSubjectDetail"]');
                const onclick = button.getAttribute('onclick');
                const match = onclick.match(/showSubjectDetail\('([^']+)'\)/);
                const materia = match ? match[1] : null;
                if (materia) {
                    showSubjectDetail(materia);
                }
            }
        });
    }

    // ============================================
    // FUNCIONES DE NEGOCIO
    // ============================================

    function generateReport() {
        
        if (window.generateReport) {
            window.generateReport();
        }
    }

    function showSubjectDetail(materia) {
        
        if (window.showSubjectDetail) {
            window.showSubjectDetail(materia);
        }
    }

    function generateAttendanceReport() {
        
        if (window.generateAttendanceReport) {
            window.generateAttendanceReport();
        }
    }

    function printSchedule() {
        
        if (window.printSchedule) {
            window.printSchedule();
        }
    }

    // Export para módulos
    window.calificacionesEvents = {
        generateReport,
        showSubjectDetail,
        generateAttendanceReport,
        printSchedule
    };

    // Export directo para acceso desde event-handler-registry.js
    window.showSubjectDetail = showSubjectDetail;
    window.generateReport = generateReport;
    window.generateAttendanceReport = generateAttendanceReport;
    window.printSchedule = printSchedule;

})();
