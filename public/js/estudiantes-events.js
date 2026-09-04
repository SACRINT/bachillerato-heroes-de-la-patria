/**
 * 🎯 PORTAL ESTUDIANTES - EVENT HANDLERS (CSP-COMPLIANT)
 * Todos los handlers refactorizados de inline onclick/onchange a addEventListener
 *
 * Propósito: Eliminar 25 inline handlers que violan CSP ENFORCE mode
 * Estándar: Content Security Policy (CSP) compliant
 * Fecha: 9 Noviembre 2025
 *
 * Nota: Este archivo debe cargarse DESPUÉS de estudiantes.html
 */

(function () {
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
        void 0;

        // Registrar todos los handlers
        registerFilterButtons();
        registerQuickAccessButtons();
        registerModalButtons();
        registerFormHandlers();
        registerCardHoverEffects();
        registerChatbotHandlers();
        registerContactLinkHandlers(); // CSP-compliant dynamic contact links

        void 0;
    }

    // ============================================
    // FILTER BUTTONS (Categorías)
    // ============================================

    function registerFilterButtons() {
        const filterButtons = document.querySelectorAll('.filter-btn');

        filterButtons.forEach(button => {
            button.addEventListener('click', function (e) {
                e.preventDefault();
                const category = this.getAttribute('data-filter-category');
                if (category) {
                    filterResources(category);
                }
            });
        });
    }

    // ============================================
    // QUICK ACCESS BUTTONS
    // ============================================

    function registerQuickAccessButtons() {
        // Botón "Iniciar Sesión" del login prompt
        const studentLoginBtn = document.querySelector('#loginPrompt .btn-primary');
        if (studentLoginBtn) {
            studentLoginBtn.addEventListener('click', showStudentLogin);
        }

        // Botón "Ver Tareas"
        const tasksBtn = document.querySelector('[data-action="showTasksModal"]');
        if (tasksBtn) {
            tasksBtn.addEventListener('click', showTasksModal);
        }

        // Botón "Horario" en modal
        const scheduleExportBtn = document.querySelector('[data-action="exportSchedule"]');
        if (scheduleExportBtn) {
            scheduleExportBtn.addEventListener('click', exportSchedule);
        }

        // Botón "Imprimir Horario"
        const schedulePrintBtn = document.querySelector('[data-action="printSchedule"]');
        if (schedulePrintBtn) {
            schedulePrintBtn.addEventListener('click', printSchedule);
        }
    }

    // ============================================
    // MODAL BUTTONS
    // ============================================

    function registerModalButtons() {
        // Botón "Añadir Clase" en modal horario
        const addClassBtn = document.querySelector('[data-action="addNewClass"]');
        if (addClassBtn) {
            addClassBtn.addEventListener('click', addNewClass);
        }

        // Botón "Limpiar Todo"
        const clearScheduleBtn = document.querySelector('[data-action="clearSchedule"]');
        if (clearScheduleBtn) {
            clearScheduleBtn.addEventListener('click', clearSchedule);
        }

        // Botón "Horario de Ejemplo"
        const sampleScheduleBtn = document.querySelector('[data-action="loadSampleSchedule"]');
        if (sampleScheduleBtn) {
            sampleScheduleBtn.addEventListener('click', loadSampleSchedule);
        }

        // Botón "Calcular Promedio"
        const calculateBtn = document.querySelector('[data-action="calculateAverage"]');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', calculateAverage);
        }

        // Botón "Solicitar Información" en modal evento
        const contactBtn = document.querySelector('[data-action="contactForRegistration"]');
        if (contactBtn) {
            contactBtn.addEventListener('click', contactForRegistration);
        }

        // Botón "Ver Consejos" en técnicas de estudio
        const studyTipsBtn = document.querySelector('[data-action="viewStudyTips"]');
        if (studyTipsBtn) {
            studyTipsBtn.addEventListener('click', () => {
                // El modal data-bs-toggle se maneja automáticamente con Bootstrap
            });
        }
    }

    // ============================================
    // FORM HANDLERS
    // ============================================

    function registerFormHandlers() {
        // Formulario de clase en PWA
        const formClasePwa = document.getElementById('form-clase-pwa');
        if (formClasePwa) {
            formClasePwa.addEventListener('submit', function (e) {
                e.preventDefault();
                // La lógica está en el script inline existente
                // Este es solo un registro de evento para mantener estructura
            });
        }

        // Botón eliminar clase
        const deleteClassBtn = document.querySelector('[data-action="deleteClass"]');
        if (deleteClassBtn) {
            deleteClassBtn.addEventListener('click', deleteClass);
        }
    }

    // ============================================
    // CARD HOVER EFFECTS (Mouse Events)
    // ============================================

    function registerCardHoverEffects() {
        const featureCards = document.querySelectorAll('.quick-access-card, .hover-lift');
        featureCards.forEach(card => {
            card.addEventListener('mouseover', function () {
                this.style.transform = 'translateY(-5px)';
                this.style.transition = 'all 0.3s ease';
            });

            card.addEventListener('mouseout', function () {
                this.style.transform = 'translateY(0)';
            });
        });

        // Recursos PWA cards
        const recursoCards = document.querySelectorAll('.recurso-card');
        recursoCards.forEach(card => {
            card.addEventListener('mouseenter', function () {
                this.style.transform = 'translateY(-5px)';
            });

            card.addEventListener('mouseleave', function () {
                this.style.transform = 'translateY(0)';
            });
        });
    }

    // ============================================
    // CHATBOT HANDLERS
    // ============================================

    function registerChatbotHandlers() {
        // Chatbot es gestionado de forma centralizada por js/chatbot.js
        // Se evita registrar listeners duplicados que desincronicen el DOM
    }

    // ============================================
    // CONTACT LINK HANDLERS (Dynamic Modal Content - CSP Compliant)
    // ============================================

    /**
     * Event delegation para links de contacto generados dinámicamente
     * Soporta: tel-link, mailto-link, whatsapp-link
     */
    function registerContactLinkHandlers() {
        // Usar event delegation en el body para capturar clics en elementos dinámicos
        document.body.addEventListener('click', function (e) {
            const button = e.target.closest('[data-action]');
            if (!button) return;

            const action = button.getAttribute('data-action');

            switch (action) {
                case 'tel-link': {
                    const phone = button.getAttribute('data-phone');
                    if (phone) {
                        window.location.href = 'tel:' + phone;
                    }
                    break;
                }
                case 'mailto-link': {
                    const email = button.getAttribute('data-email');
                    if (email) {
                        window.location.href = 'mailto:' + email + '?subject=Información sobre evento estudiantil';
                    }
                    break;
                }
                case 'whatsapp-link': {
                    const phone = button.getAttribute('data-phone');
                    if (phone) {
                        window.open('https://wa.me/' + phone + '?text=Hola, me interesa obtener información sobre los eventos estudiantiles', '_blank');
                    }
                    break;
                }
                // Otros actions se manejan en sus handlers específicos
            }
        });

        void 0;
    }

    // ============================================
    // FUNCIONES QUE LLAMAN LOS EVENT HANDLERS
    // ============================================

    /**
     * Filtrar recursos por categoría
     */
    function filterResources(categoria) {
        if (window.filterResources) {
            window.filterResources(categoria);
        }
    }

    /**
     * Mostrar modal de tareas
     */
    function showTasksModal() {
        if (window.showTasksModal) {
            window.showTasksModal();
        }
    }

    /**
     * Calcular promedio
     */
    function calculateAverage() {
        if (window.calculateAverage) {
            window.calculateAverage();
        }
    }

    /**
     * Agregar nueva clase a horario
     */
    function addNewClass() {
        if (window.addNewClass) {
            window.addNewClass();
        }
    }

    /**
     * Limpiar horario completo
     */
    function clearSchedule() {
        if (window.clearSchedule) {
            window.clearSchedule();
        }
    }

    /**
     * Cargar horario de ejemplo
     */
    function loadSampleSchedule() {
        if (window.loadSampleSchedule) {
            window.loadSampleSchedule();
        }
    }

    /**
     * Exportar horario
     */
    function exportSchedule() {
        if (window.exportSchedule) {
            window.exportSchedule();
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
     * Contactar para registración
     */
    function contactForRegistration() {
        if (window.contactForRegistration) {
            window.contactForRegistration();
        }
    }

    /**
     * Eliminar clase de horario
     */
    function deleteClass() {
        if (window.deleteClass) {
            window.deleteClass();
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

    /**
     * Mostrar modal de login del estudiante
     */
    function showStudentLogin() {
        if (window.showStudentLogin) {
            window.showStudentLogin();
        }
    }

    /**
     * Alternar visibilidad del chatbot
     */
    function toggleChatbot() {
        if (window.toggleChatbot) {
            window.toggleChatbot();
        }
    }

    // ============================================
    // EXPORT (if needed by other modules)
    // ============================================

    // Hacer disponible globalmente si es necesario
    window.estudiantesEvents = {
        filterResources,
        showTasksModal,
        calculateAverage,
        addNewClass,
        clearSchedule,
        loadSampleSchedule,
        exportSchedule,
        printSchedule,
        contactForRegistration,
        deleteClass,
        sendMessage,
        showStudentLogin,
        toggleChatbot
    };

})();
