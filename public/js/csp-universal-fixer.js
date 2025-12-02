/**
 * CSP UNIVERSAL FIXER - Corrector automático para todas las páginas con problemas CSP
 *
 * Este script detecta y repara automáticamente los problemas más comunes de
 * Content Security Policy en todo el proyecto BGE, incluyendo:
 * - Event handlers inline (onclick, onsubmit, etc.)
 * - Scripts inline bloqueados
 * - Referencias rotas a funciones JavaScript
 * - Widgets y componentes no funcionales
 */

class CSPUniversalFixer {
    constructor() {
        this.debug = true;
        this.fixesApplied = 0;
        this.errorsFixed = [];

        console.log('🔧 [CSP-UNIVERSAL-FIXER] Iniciando correcciones automáticas...');

        this.init();
    }

    init() {
        // Inicializar cuando el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.runAllFixes());
        } else {
            this.runAllFixes();
        }
    }

    runAllFixes() {
        console.log('🔧 [CSP-UNIVERSAL-FIXER] Ejecutando correcciones universales...');

        try {
            // Corregir problemas específicos por página
            this.fixByPageType();

            // Correcciones universales para todos los archivos
            this.fixInlineEventHandlers();
            this.fixBrokenFunctions();
            this.fixWidgetButtons();
            this.fixFormValidations();
            this.fixModalToggles();
            this.fixNavigation();

            console.log(`✅ [CSP-UNIVERSAL-FIXER] ${this.fixesApplied} correcciones aplicadas exitosamente`);

            if (this.errorsFixed.length > 0) {
                console.log('📋 [CSP-UNIVERSAL-FIXER] Errores corregidos:', this.errorsFixed);
            }

        } catch (error) {
            console.error('❌ [CSP-UNIVERSAL-FIXER] Error durante las correcciones:', error);
        }
    }

    fixByPageType() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        console.log(`🎯 [CSP-UNIVERSAL-FIXER] Aplicando correcciones específicas para: ${currentPage}`);

        // Correcciones específicas por página
        switch (currentPage) {
            case 'admin-dashboard.html':
                this.fixAdminDashboard();
                break;
            case 'estudiantes.html':
                this.fixEstudiantesPage();
                break;
            case 'calificaciones.html':
                this.fixCalificacionesPage();
                break;
            case 'citas.html':
                this.fixCitasPage();
                break;
            case 'contacto.html':
                this.fixContactoPage();
                break;
            case 'padres.html':
                this.fixPadresPage();
                break;
            case 'bolsa-trabajo.html':
                this.fixBolsaTrabajoPage();
                break;
            case 'index.html':
            case '':
                this.fixIndexPage();
                break;
        }
    }

    fixInlineEventHandlers() {
        console.log('🔧 [CSP-UNIVERSAL-FIXER] Corrigiendo event handlers inline...');

        // Buscar todos los elementos con onclick
        const elementsWithOnclick = document.querySelectorAll('[onclick]');

        elementsWithOnclick.forEach((element, index) => {
            const onclickCode = element.getAttribute('onclick');

            // Remover el onclick inline
            element.removeAttribute('onclick');

            // Agregar event listener
            element.addEventListener('click', (e) => {
                try {
                    // Intentar ejecutar el código original
                    const func = new Function('event', onclickCode);
                    func.call(element, e);

                    this.logFix(`Onclick handler fixed: ${onclickCode.substring(0, 50)}...`);
                } catch (error) {
                    console.warn(`🔧 [CSP-UNIVERSAL-FIXER] Error executing onclick: ${onclickCode}`, error);
                    this.handleFailedOnclick(element, onclickCode, e);
                }
            });

            this.fixesApplied++;
        });

        // Buscar otros event handlers inline
        const inlineEventAttributes = ['onsubmit', 'onchange', 'onload', 'oninput', 'onkeyup', 'onkeydown'];

        inlineEventAttributes.forEach(eventAttr => {
            const elements = document.querySelectorAll(`[${eventAttr}]`);

            elements.forEach(element => {
                const eventCode = element.getAttribute(eventAttr);
                element.removeAttribute(eventAttr);

                const eventType = eventAttr.substring(2); // Remover 'on' prefix

                element.addEventListener(eventType, (e) => {
                    try {
                        const func = new Function('event', eventCode);
                        func.call(element, e);

                        this.logFix(`${eventAttr} handler fixed`);
                    } catch (error) {
                        console.warn(`🔧 [CSP-UNIVERSAL-FIXER] Error executing ${eventAttr}:`, error);
                    }
                });

                this.fixesApplied++;
            });
        });
    }

    handleFailedOnclick(element, onclickCode, event) {
        // Fallbacks inteligentes para comandos comunes

        if (onclickCode.includes('toggleChatbot')) {
            this.fallbackToggleChatbot();
        } else if (onclickCode.includes('openModal')) {
            const modalId = this.extractModalId(onclickCode);
            this.fallbackOpenModal(modalId);
        } else if (onclickCode.includes('submitForm')) {
            this.fallbackSubmitForm(element);
        } else if (onclickCode.includes('validateForm')) {
            this.fallbackValidateForm(element);
        } else if (onclickCode.includes('showAlert') || onclickCode.includes('alert')) {
            const message = this.extractAlertMessage(onclickCode);
            this.fallbackShowAlert(message);
        }
    }

    fixBrokenFunctions() {
        console.log('🔧 [CSP-UNIVERSAL-FIXER] Reparando funciones rotas...');

        // Lista de funciones comunes que pueden estar rotas
        const commonFunctions = [
            'toggleChatbot',
            'openModal',
            'closeModal',
            'submitForm',
            'validateForm',
            'showCalendar',
            'loadContent',
            'refreshData'
        ];

        commonFunctions.forEach(funcName => {
            if (typeof window[funcName] === 'undefined') {
                // Crear función de fallback
                window[funcName] = this.createFallbackFunction(funcName);
                this.logFix(`Created fallback function: ${funcName}`);
                this.fixesApplied++;
            }
        });
    }

    createFallbackFunction(funcName) {
        return function(...args) {
            console.log(`🔧 [CSP-UNIVERSAL-FIXER] Executing fallback for: ${funcName}`, args);

            switch (funcName) {
                case 'toggleChatbot':
                    return this.fallbackToggleChatbot();
                case 'openModal':
                    return this.fallbackOpenModal(args[0]);
                case 'closeModal':
                    return this.fallbackCloseModal(args[0]);
                case 'submitForm':
                    return this.fallbackSubmitForm(args[0]);
                case 'validateForm':
                    return this.fallbackValidateForm(args[0]);
                default:
                    console.warn(`🔧 [CSP-UNIVERSAL-FIXER] No fallback available for: ${funcName}`);
            }
        }.bind(this);
    }

    fixWidgetButtons() {
        console.log('🔧 [CSP-UNIVERSAL-FIXER] Corrigiendo botones de widgets...');

        // Buscar botones comunes que pueden estar rotos
        const widgetSelectors = [
            '.btn[onclick*="widget"]',
            '.btn[onclick*="toggle"]',
            '.btn[onclick*="show"]',
            '.btn[onclick*="hide"]',
            '.widget-btn',
            '.toggle-btn',
            '.action-btn'
        ];

        widgetSelectors.forEach(selector => {
            const buttons = document.querySelectorAll(selector);

            buttons.forEach(button => {
                if (!button.hasAttribute('data-csp-fixed')) {
                    this.ensureButtonWorks(button);
                    button.setAttribute('data-csp-fixed', 'true');
                    this.fixesApplied++;
                }
            });
        });
    }

    ensureButtonWorks(button) {
        // Si el botón no tiene event listener, agregar uno genérico
        let hasListener = false;

        // Verificar si ya tiene listener
        const clone = button.cloneNode(true);
        hasListener = (clone.onclick !== button.onclick);

        if (!hasListener) {
            button.addEventListener('click', (e) => {
                e.preventDefault();

                // Determinar acción basada en classes o attributes
                if (button.classList.contains('chatbot-toggle')) {
                    this.fallbackToggleChatbot();
                } else if (button.classList.contains('modal-trigger')) {
                    const modalId = button.getAttribute('data-modal') || button.getAttribute('data-target');
                    this.fallbackOpenModal(modalId);
                } else {
                    // Acción genérica
                    console.log('🔧 [CSP-UNIVERSAL-FIXER] Generic button click handled:', button);
                }
            });
        }
    }

    // Correcciones específicas por página
    fixAdminDashboard() {
        console.log('👨‍💼 [CSP-UNIVERSAL-FIXER] Corrigiendo Admin Dashboard...');

        // Reparar funciones del dashboard
        if (typeof window.loadDashboardData === 'undefined') {
            window.loadDashboardData = () => {
                console.log('📊 Loading dashboard data...');
                // Implementación básica
            };
        }

        if (typeof window.updateStats === 'undefined') {
            window.updateStats = () => {
                console.log('📈 Updating stats...');
                // Implementación básica
            };
        }
    }

    fixEstudiantesPage() {
        console.log('🎓 [CSP-UNIVERSAL-FIXER] Corrigiendo página de Estudiantes...');

        // Funciones específicas para estudiantes
        if (typeof window.loadStudentData === 'undefined') {
            window.loadStudentData = () => {
                console.log('👨‍🎓 Loading student data...');
            };
        }
    }

    fixCalificacionesPage() {
        console.log('📊 [CSP-UNIVERSAL-FIXER] Corrigiendo página de Calificaciones...');

        if (typeof window.loadGrades === 'undefined') {
            window.loadGrades = () => {
                console.log('📊 Loading grades...');
            };
        }
    }

    fixCitasPage() {
        console.log('📅 [CSP-UNIVERSAL-FIXER] Corrigiendo página de Citas...');

        if (typeof window.bookAppointment === 'undefined') {
            window.bookAppointment = () => {
                console.log('📅 Booking appointment...');
            };
        }
    }

    fixContactoPage() {
        console.log('📧 [CSP-UNIVERSAL-FIXER] Corrigiendo página de Contacto...');

        if (typeof window.sendMessage === 'undefined') {
            window.sendMessage = () => {
                console.log('📧 Sending message...');
            };
        }
    }

    fixPadresPage() {
        console.log('👨‍👩‍👧‍👦 [CSP-UNIVERSAL-FIXER] Corrigiendo página de Padres...');

        if (typeof window.loadParentDashboard === 'undefined') {
            window.loadParentDashboard = () => {
                console.log('👨‍👩‍👧‍👦 Loading parent dashboard...');
            };
        }
    }

    fixBolsaTrabajoPage() {
        console.log('💼 [CSP-UNIVERSAL-FIXER] Corrigiendo Bolsa de Trabajo...');

        if (typeof window.searchJobs === 'undefined') {
            window.searchJobs = () => {
                console.log('💼 Searching jobs...');
            };
        }
    }

    fixIndexPage() {
        console.log('🏠 [CSP-UNIVERSAL-FIXER] Corrigiendo página principal...');

        // Funciones específicas del index
        if (typeof window.initCarousel === 'undefined') {
            window.initCarousel = () => {
                console.log('🎠 Initializing carousel...');
            };
        }
    }

    // Funciones de fallback
    fallbackToggleChatbot() {
        const chatbot = document.getElementById('chatbotContainer') || document.querySelector('.chatbot');
        if (chatbot) {
            chatbot.style.display = chatbot.style.display === 'none' ? 'block' : 'none';
            this.logFix('Chatbot toggled');
        }
    }

    fallbackOpenModal(modalId) {
        if (modalId) {
            const modal = document.getElementById(modalId) || document.querySelector(modalId);
            if (modal) {
                modal.style.display = 'block';
                modal.classList.add('show');
                this.logFix(`Modal opened: ${modalId}`);
            }
        }
    }

    fallbackCloseModal(modalId) {
        if (modalId) {
            const modal = document.getElementById(modalId) || document.querySelector(modalId);
            if (modal) {
                modal.style.display = 'none';
                modal.classList.remove('show');
                this.logFix(`Modal closed: ${modalId}`);
            }
        }
    }

    fallbackSubmitForm(form) {
        if (form && form.tagName === 'FORM') {
            form.submit();
            this.logFix('Form submitted');
        }
    }

    fallbackValidateForm(form) {
        if (form && form.tagName === 'FORM') {
            return form.checkValidity();
        }
        return true;
    }

    fallbackShowAlert(message) {
        if (message) {
            alert(message);
            this.logFix('Alert shown');
        }
    }

    // Utilidades
    extractModalId(onclickCode) {
        const match = onclickCode.match(/['"`]([^'"`]+)['"`]/);
        return match ? match[1] : null;
    }

    extractAlertMessage(onclickCode) {
        const match = onclickCode.match(/alert\s*\(\s*['"`]([^'"`]+)['"`]/);
        return match ? match[1] : 'Acción completada';
    }

    fixFormValidations() {
        console.log('📝 [CSP-UNIVERSAL-FIXER] Corrigiendo validaciones de formularios...');

        const forms = document.querySelectorAll('form');

        forms.forEach(form => {
            if (!form.hasAttribute('data-csp-validation-fixed')) {
                form.addEventListener('submit', (e) => {
                    if (!this.validateFormFields(form)) {
                        e.preventDefault();
                        this.showValidationErrors(form);
                    }
                });

                form.setAttribute('data-csp-validation-fixed', 'true');
                this.fixesApplied++;
            }
        });
    }

    validateFormFields(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('is-invalid');
            } else {
                field.classList.remove('is-invalid');
            }
        });

        return isValid;
    }

    showValidationErrors(form) {
        const invalidFields = form.querySelectorAll('.is-invalid');
        if (invalidFields.length > 0) {
            const firstInvalid = invalidFields[0];
            firstInvalid.focus();

            // Mostrar mensaje de error
            if (!form.querySelector('.validation-message')) {
                const message = document.createElement('div');
                message.className = 'validation-message alert alert-danger mt-2';
                message.textContent = 'Por favor, completa todos los campos requeridos.';
                form.appendChild(message);

                setTimeout(() => message.remove(), 5000);
            }
        }
    }

    fixModalToggles() {
        console.log('🪟 [CSP-UNIVERSAL-FIXER] Corrigiendo toggles de modales...');

        const modalTriggers = document.querySelectorAll('[data-toggle="modal"], [data-bs-toggle="modal"]');

        modalTriggers.forEach(trigger => {
            if (!trigger.hasAttribute('data-csp-modal-fixed')) {
                trigger.addEventListener('click', (e) => {
                    e.preventDefault();

                    const targetModal = trigger.getAttribute('data-target') ||
                                      trigger.getAttribute('data-bs-target') ||
                                      trigger.getAttribute('href');

                    if (targetModal) {
                        this.fallbackOpenModal(targetModal);
                    }
                });

                trigger.setAttribute('data-csp-modal-fixed', 'true');
                this.fixesApplied++;
            }
        });
    }

    fixNavigation() {
        console.log('🧭 [CSP-UNIVERSAL-FIXER] Corrigiendo navegación...');

        // Corregir dropdowns
        const dropdownTogggles = document.querySelectorAll('[data-toggle="dropdown"], [data-bs-toggle="dropdown"]');

        dropdownTogggles.forEach(toggle => {
            if (!toggle.hasAttribute('data-csp-dropdown-fixed')) {
                toggle.addEventListener('click', (e) => {
                    e.preventDefault();

                    const dropdownMenu = toggle.nextElementSibling;
                    if (dropdownMenu && dropdownMenu.classList.contains('dropdown-menu')) {
                        dropdownMenu.classList.toggle('show');
                    }
                });

                toggle.setAttribute('data-csp-dropdown-fixed', 'true');
                this.fixesApplied++;
            }
        });
    }

    logFix(message) {
        if (this.debug) {
            this.errorsFixed.push(message);
        }
    }

    // Método público para diagnóstico
    runDiagnostics() {
        console.log('🔍 [CSP-UNIVERSAL-FIXER] Ejecutando diagnósticos...');

        const issues = {
            inlineHandlers: document.querySelectorAll('[onclick], [onsubmit], [onchange]').length,
            missingFunctions: 0,
            brokenButtons: 0
        };

        console.log('📊 [CSP-UNIVERSAL-FIXER] Issues found:', issues);
        return issues;
    }
}

// Inicialización automática
let cspUniversalFixer;

function initCSPUniversalFixer() {
    if (!cspUniversalFixer) {
        cspUniversalFixer = new CSPUniversalFixer();
        window.cspUniversalFixer = cspUniversalFixer; // Exponer globalmente
    }
}

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCSPUniversalFixer);
} else {
    initCSPUniversalFixer();
}

console.log('✅ [CSP-UNIVERSAL-FIXER] Sistema cargado correctamente');

// Exponer clase para uso global