/**
 * 🎯 CALIFICACIONES - EVENT HANDLERS (CSP-COMPLIANT)
 * Todos los handlers refactorizados de inline onclick/onchange/hover a addEventListener
 *
 * Propósito: Eliminar 18 inline handlers que violan CSP ENFORCE mode
 * Estándar: Content Security Policy (CSP) compliant
 * Fecha: 9 Noviembre 2025
 *
 * Nota: Este archivo debe cargarse DESPUÉS de calificaciones.html
 */

(function() {
    'use strict';

    // ============================================
    // INICIALIZACIÓN - Esperar DOM Listo
    // ============================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeEventHandlers);
    } else {
        // DOM ya está listo
        initializeEventHandlers();
    }

    // ============================================
    // FUNCIÓN PRINCIPAL DE INICIALIZACIÓN
    // ============================================

    function initializeEventHandlers() {
        console.log('[CALIFICACIONES-EVENTS] Inicializando event handlers...');

        // Registrar todos los handlers
        registerFeatureCardHandlers();
        registerModalTriggerButtons();
        registerFormHandlers();
        registerReportButtons();
        registerActionButtons();
        registerChatbotHandlers();

        console.log('[CALIFICACIONES-EVENTS] ✅ Event handlers inicializados correctamente');
    }

    // ============================================
    // FEATURE CARD SCROLL & HOVER HANDLERS
    // ============================================

    function registerFeatureCardHandlers() {
        // Card 1: Sistema de Evaluación
        const evalCard = document.querySelector('[data-scroll-target="sistema-evaluacion"]');
        if (evalCard) {
            evalCard.addEventListener('click', () => scrollToSection('sistema-evaluacion'));
            evalCard.addEventListener('mouseover', function() {
                this.style.transform = 'translateY(-5px)';
                this.style.transition = 'transform 0.2s ease';
            });
            evalCard.addEventListener('mouseout', function() {
                this.style.transform = 'translateY(0)';
            });
        }

        // Card 2: Escala de Calificaciones
        const scaleCard = document.querySelector('[data-scroll-target="escala-calificaciones"]');
        if (scaleCard) {
            scaleCard.addEventListener('click', () => scrollToSection('escala-calificaciones'));
            scaleCard.addEventListener('mouseover', function() {
                this.style.transform = 'translateY(-5px)';
                this.style.transition = 'transform 0.2s ease';
            });
            scaleCard.addEventListener('mouseout', function() {
                this.style.transform = 'translateY(0)';
            });
        }

        // Card 3: Acceso al Sistema (Login)
        const loginCard = document.querySelector('[data-action="showLoginModal"]');
        if (loginCard) {
            loginCard.addEventListener('click', showLoginModal);
            loginCard.addEventListener('mouseover', function() {
                this.style.transform = 'translateY(-5px)';
                this.style.transition = 'transform 0.2s ease';
            });
            loginCard.addEventListener('mouseout', function() {
                this.style.transform = 'translateY(0)';
            });
        }

        // Card 4: Reportes PDF
        const reportCard = document.querySelector('[data-action="showReportModal"]');
        if (reportCard) {
            reportCard.addEventListener('click', showReportModal);
            reportCard.addEventListener('mouseover', function() {
                this.style.transform = 'translateY(-5px)';
                this.style.transition = 'transform 0.2s ease';
            });
            reportCard.addEventListener('mouseout', function() {
                this.style.transform = 'translateY(0)';
            });
        }
    }

    // ============================================
    // MODAL TRIGGER BUTTONS
    // ============================================

    function registerModalTriggerButtons() {
        // Botones en panel de calificaciones
        const downloadReportBtn = document.querySelector('[data-action="generateReport-boleta"]');
        if (downloadReportBtn) {
            downloadReportBtn.addEventListener('click', () => generateReport('boleta'));
        }

        const detailedReportBtn = document.querySelector('[data-action="generateReport-detallado"]');
        if (detailedReportBtn) {
            detailedReportBtn.addEventListener('click', () => generateReport('detallado'));
        }

        const attendanceBtn = document.querySelector('[data-action="showAttendanceModal"]');
        if (attendanceBtn) {
            attendanceBtn.addEventListener('click', showAttendanceModal);
        }

        const scheduleBtn = document.querySelector('[data-action="showScheduleModal"]');
        if (scheduleBtn) {
            scheduleBtn.addEventListener('click', showScheduleModal);
        }

        // Botón logout
        const logoutBtn = document.querySelector('[data-action="logoutGradeSystem"]');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logoutGradeSystem);
        }
    }

    // ============================================
    // FORM HANDLERS
    // ============================================

    function registerFormHandlers() {
        // Formulario de login de estudiante
        const studentLoginBtn = document.querySelector('[data-action="loginAsStudent"]');
        if (studentLoginBtn) {
            studentLoginBtn.addEventListener('click', loginAsStudent);
        }

        // Formulario de login de padre
        const parentLoginBtn = document.querySelector('[data-action="loginAsParent"]');
        if (parentLoginBtn) {
            parentLoginBtn.addEventListener('click', loginAsParent);
        }

        // Botón generar reporte
        const generateReportBtn = document.querySelector('[data-action="generateReportPDF"]');
        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', generatePDF);
        }
    }

    // ============================================
    // REPORT GENERATION BUTTONS
    // ============================================

    function registerReportButtons() {
        // Descargar reporte de asistencia
        const attendanceReportBtn = document.querySelector('[data-action="generateAttendanceReport"]');
        if (attendanceReportBtn) {
            attendanceReportBtn.addEventListener('click', generateAttendanceReport);
        }

        // Imprimir horario
        const printScheduleBtn = document.querySelector('[data-action="printSchedule"]');
        if (printScheduleBtn) {
            printScheduleBtn.addEventListener('click', printSchedule);
        }
    }

    // ============================================
    // ACTION BUTTONS
    // ============================================

    function registerActionButtons() {
        // Botón de descarga en modal reporte
        const downloadPdfBtn = document.querySelector('[data-action="downloadPDF"]');
        if (downloadPdfBtn) {
            downloadPdfBtn.addEventListener('click', generatePDF);
        }
    }

    // ============================================
    // CHATBOT HANDLERS
    // ============================================

    function registerChatbotHandlers() {
        const chatbotInput = document.getElementById('chatbotInput');
        const chatbotSendBtn = document.querySelector('[data-action="sendMessage"]');

        if (chatbotInput) {
            chatbotInput.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    sendMessage();
                }
            });
        }

        if (chatbotSendBtn) {
            chatbotSendBtn.addEventListener('click', sendMessage);
        }
    }

    // ============================================
    // FUNCIONES QUE LLAMAN LOS EVENT HANDLERS
    // ============================================

    /**
     * Scroll a una sección
     */
    function scrollToSection(sectionId) {
        if (window.scrollToSection) {
            window.scrollToSection(sectionId);
        } else {
            // Fallback
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    /**
     * Mostrar modal de login
     */
    function showLoginModal() {
        if (window.showLoginModal) {
            window.showLoginModal();
        }
    }

    /**
     * Mostrar modal de reporte
     */
    function showReportModal() {
        if (window.showReportModal) {
            window.showReportModal();
        }
    }

    /**
     * Login como estudiante
     */
    function loginAsStudent() {
        if (window.loginAsStudent) {
            window.loginAsStudent();
        }
    }

    /**
     * Login como padre
     */
    function loginAsParent() {
        if (window.loginAsParent) {
            window.loginAsParent();
        }
    }

    /**
     * Generar reporte
     */
    function generateReport(reportType) {
        if (window.generateReport) {
            window.generateReport(reportType);
        }
    }

    /**
     * Generar PDF de boleta
     */
    function generatePDF() {
        if (window.generatePDF) {
            window.generatePDF();
        }
    }

    /**
     * Mostrar modal de asistencia
     */
    function showAttendanceModal() {
        if (window.showAttendanceModal) {
            window.showAttendanceModal();
        }
    }

    /**
     * Mostrar modal de horario
     */
    function showScheduleModal() {
        if (window.showScheduleModal) {
            window.showScheduleModal();
        }
    }

    /**
     * Generar reporte de asistencia
     */
    function generateAttendanceReport() {
        if (window.generateAttendanceReport) {
            window.generateAttendanceReport();
        }
    }

    /**
     * Imprimir horario
     */
    function printSchedule() {
        if (window.printSchedule) {
            window.printSchedule();
        }
    }

    /**
     * Logout del sistema de calificaciones
     */
    function logoutGradeSystem() {
        if (window.logoutGradeSystem) {
            window.logoutGradeSystem();
        }
    }

    /**
     * Enviar mensaje en chatbot
     */
    function sendMessage() {
        if (window.sendMessage) {
            window.sendMessage();
        }
    }

    // ============================================
    // EXPORT (if needed by other modules)
    // ============================================

    // Hacer disponible globalmente si es necesario
    window.calificacionesEvents = {
        scrollToSection,
        showLoginModal,
        showReportModal,
        loginAsStudent,
        loginAsParent,
        generateReport,
        generatePDF,
        showAttendanceModal,
        showScheduleModal,
        generateAttendanceReport,
        printSchedule,
        logoutGradeSystem,
        sendMessage
    };

})();
