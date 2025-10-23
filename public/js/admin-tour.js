/**
 * ADMIN TOUR - Tour Guiado para Administradores
 * BGE Héroes de la Patria
 * Sistema de Onboarding Interactivo
 * Fecha: 19 de Octubre, 2025
 */

class AdminTour {
    constructor(options = {}) {
        this.tourId = options.tourId || 'admin-main-tour';
        this.autoStart = options.autoStart !== false;
        this.showProgress = options.showProgress !== false;
        this.allowSkip = options.allowSkip !== false;

        this.currentStep = 0;
        this.steps = [];
        this.completed = this.loadProgress();
        this.overlay = null;
        this.tooltipElement = null;

        this.init();
    }

    init() {
        // Verificar si el usuario ya completó el tour
        if (this.completed && !this.autoStart) {
            console.log('✅ Tour ya completado');
            return;
        }

        // Definir pasos del tour
        this.defineSteps();

        // Auto-iniciar si está configurado
        if (this.autoStart && !this.completed) {
            this.start();
        }

        // Agregar botón para reiniciar tour
        this.addRestartButton();

        console.log('✅ AdminTour inicializado');
    }

    /**
     * Definir pasos del tour
     */
    defineSteps() {
        this.steps = [
            {
                target: '.dashboard-header',
                title: '¡Bienvenido al Panel de Administración!',
                content: 'Este tour te ayudará a conocer las principales funciones de la plataforma BGE Héroes de la Patria.',
                position: 'bottom',
                highlightPadding: 10
            },
            {
                target: '.sidebar-menu',
                title: 'Menú de Navegación',
                content: 'Desde aquí puedes acceder a todas las secciones: Noticias, Eventos, Comunicados, Usuarios, Analytics y más.',
                position: 'right',
                highlightPadding: 15
            },
            {
                target: '[data-module="cms"]',
                title: 'Gestión de Contenidos (CMS)',
                content: 'Administra noticias, eventos y avisos. Puedes crear, editar, publicar y programar contenido para tu comunidad.',
                position: 'right',
                action: () => {
                    const cmsMenu = document.querySelector('[data-module="cms"]');
                    if (cmsMenu) cmsMenu.click();
                }
            },
            {
                target: '.stats-dashboard',
                title: 'Dashboard de Estadísticas',
                content: 'Visualiza métricas en tiempo real: visitas, usuarios activos, engagement y más. Incluye gráficos interactivos.',
                position: 'left',
                highlightPadding: 20
            },
            {
                target: '[data-module="analytics"]',
                title: 'Analytics Avanzado',
                content: 'Accede a reportes detallados, análisis predictivo y exportación de datos en múltiples formatos.',
                position: 'right'
            },
            {
                target: '.notification-bell',
                title: 'Notificaciones en Tiempo Real',
                content: 'Recibe alertas instantáneas sobre nuevos mensajes, solicitudes pendientes y eventos importantes.',
                position: 'bottom-left',
                highlightPadding: 8
            },
            {
                target: '.user-profile-menu',
                title: 'Perfil de Usuario',
                content: 'Aquí puedes configurar tu perfil, cambiar contraseña, gestionar roles y cerrar sesión.',
                position: 'bottom-left'
            },
            {
                target: '.search-global',
                title: 'Búsqueda Global',
                content: 'Busca rápidamente cualquier contenido: usuarios, noticias, eventos, documentos y más.',
                position: 'bottom',
                highlightPadding: 5
            },
            {
                target: '[data-module="approvals"]',
                title: 'Sistema de Aprobaciones',
                content: 'Revisa y aprueba solicitudes pendientes: inscripciones, documentos, quejas y sugerencias.',
                position: 'right'
            },
            {
                target: '.dark-mode-toggle',
                title: 'Modo Oscuro',
                content: 'Activa el modo oscuro para reducir la fatiga visual durante sesiones largas.',
                position: 'left',
                highlightPadding: 12
            },
            {
                target: '.help-center-btn',
                title: 'Centro de Ayuda',
                content: 'Si necesitas asistencia, consulta nuestra documentación completa o contacta al soporte técnico.',
                position: 'bottom-left'
            },
            {
                target: null,
                title: '¡Tour Completado!',
                content: `
                    <strong>¡Felicidades!</strong> Has completado el tour guiado.
                    <br><br>
                    <ul style="text-align: left; margin-top: 15px;">
                        <li>Puedes repetir este tour en cualquier momento desde el menú de ayuda</li>
                        <li>Explora cada sección a tu ritmo</li>
                        <li>Consulta la documentación para funciones avanzadas</li>
                    </ul>
                `,
                position: 'center',
                isCompletionStep: true
            }
        ];
    }

    /**
     * Iniciar tour
     */
    start() {
        this.currentStep = 0;
        this.createOverlay();
        this.showStep(this.currentStep);
    }

    /**
     * Crear overlay oscuro
     */
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'tour-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9998;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(this.overlay);
    }

    /**
     * Mostrar paso específico
     */
    showStep(index) {
        if (index >= this.steps.length) {
            this.complete();
            return;
        }

        const step = this.steps[index];

        // Ejecutar acción del paso si existe
        if (step.action && typeof step.action === 'function') {
            step.action();
        }

        // Crear/actualizar tooltip
        this.showTooltip(step);

        // Highlight del elemento target
        if (step.target) {
            this.highlightElement(step.target, step.highlightPadding || 10);
        }
    }

    /**
     * Mostrar tooltip
     */
    showTooltip(step) {
        // Remover tooltip anterior
        if (this.tooltipElement) {
            this.tooltipElement.remove();
        }

        // Crear nuevo tooltip
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.className = 'tour-tooltip';
        this.tooltipElement.style.cssText = `
            position: fixed;
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            z-index: 9999;
            max-width: 400px;
            min-width: 300px;
        `;

        this.tooltipElement.innerHTML = `
            ${this.showProgress ? `
                <div class="tour-progress" style="
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 10px;
                    text-align: right;
                ">
                    Paso ${this.currentStep + 1} de ${this.steps.length}
                </div>
            ` : ''}

            <h3 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 18px;">
                ${step.title}
            </h3>

            <div style="color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                ${step.content}
            </div>

            <div class="tour-actions" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                ${this.allowSkip && !step.isCompletionStep ? `
                    <button id="tour-skip" style="
                        background: none;
                        border: none;
                        color: #999;
                        cursor: pointer;
                        padding: 8px 12px;
                    ">
                        Saltar tour
                    </button>
                ` : '<div></div>'}

                <div style="display: flex; gap: 10px;">
                    ${this.currentStep > 0 && !step.isCompletionStep ? `
                        <button id="tour-prev" style="
                            background: #e0e0e0;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 5px;
                            cursor: pointer;
                            font-weight: 500;
                        ">
                            Anterior
                        </button>
                    ` : ''}

                    <button id="tour-next" style="
                        background: #3498db;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: 500;
                    ">
                        ${step.isCompletionStep ? 'Finalizar' : 'Siguiente'}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(this.tooltipElement);

        // Posicionar tooltip
        this.positionTooltip(step);

        // Agregar event listeners
        this.attachTooltipListeners();
    }

    /**
     * Posicionar tooltip respecto al elemento target
     */
    positionTooltip(step) {
        if (!step.target || step.position === 'center') {
            // Centrar en pantalla
            this.tooltipElement.style.top = '50%';
            this.tooltipElement.style.left = '50%';
            this.tooltipElement.style.transform = 'translate(-50%, -50%)';
            return;
        }

        const targetElement = document.querySelector(step.target);
        if (!targetElement) {
            console.warn(`Elemento target no encontrado: ${step.target}`);
            return;
        }

        const targetRect = targetElement.getBoundingClientRect();
        const tooltipRect = this.tooltipElement.getBoundingClientRect();

        let top, left;

        switch (step.position) {
            case 'top':
                top = targetRect.top - tooltipRect.height - 20;
                left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                break;

            case 'bottom':
                top = targetRect.bottom + 20;
                left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                break;

            case 'left':
                top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                left = targetRect.left - tooltipRect.width - 20;
                break;

            case 'right':
                top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                left = targetRect.right + 20;
                break;

            case 'bottom-left':
                top = targetRect.bottom + 20;
                left = targetRect.left;
                break;

            case 'bottom-right':
                top = targetRect.bottom + 20;
                left = targetRect.right - tooltipRect.width;
                break;

            default:
                top = targetRect.bottom + 20;
                left = targetRect.left;
        }

        // Ajustar si está fuera de viewport
        if (top < 10) top = 10;
        if (left < 10) left = 10;
        if (top + tooltipRect.height > window.innerHeight - 10) {
            top = window.innerHeight - tooltipRect.height - 10;
        }
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }

        this.tooltipElement.style.top = `${top}px`;
        this.tooltipElement.style.left = `${left}px`;
        this.tooltipElement.style.transform = 'none';
    }

    /**
     * Highlight element
     */
    highlightElement(selector, padding = 10) {
        // Remover highlight anterior
        this.removeHighlight();

        const element = document.querySelector(selector);
        if (!element) return;

        const rect = element.getBoundingClientRect();

        const highlight = document.createElement('div');
        highlight.className = 'tour-highlight';
        highlight.style.cssText = `
            position: fixed;
            top: ${rect.top - padding}px;
            left: ${rect.left - padding}px;
            width: ${rect.width + (padding * 2)}px;
            height: ${rect.height + (padding * 2)}px;
            border: 3px solid #3498db;
            border-radius: 8px;
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
            z-index: 9998;
            pointer-events: none;
            transition: all 0.3s ease;
        `;

        document.body.appendChild(highlight);
        this.currentHighlight = highlight;
    }

    /**
     * Remover highlight
     */
    removeHighlight() {
        if (this.currentHighlight) {
            this.currentHighlight.remove();
            this.currentHighlight = null;
        }
    }

    /**
     * Adjuntar listeners del tooltip
     */
    attachTooltipListeners() {
        const nextBtn = document.getElementById('tour-next');
        const prevBtn = document.getElementById('tour-prev');
        const skipBtn = document.getElementById('tour-skip');

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.next());
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previous());
        }

        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.skip());
        }
    }

    /**
     * Ir al siguiente paso
     */
    next() {
        this.currentStep++;
        this.showStep(this.currentStep);
    }

    /**
     * Ir al paso anterior
     */
    previous() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }

    /**
     * Saltar tour
     */
    skip() {
        if (confirm('¿Estás seguro de que deseas saltar el tour?')) {
            this.close();
        }
    }

    /**
     * Completar tour
     */
    complete() {
        this.saveProgress(true);
        this.close();
        this.showCompletionMessage();
    }

    /**
     * Cerrar tour
     */
    close() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }

        if (this.tooltipElement) {
            this.tooltipElement.remove();
            this.tooltipElement = null;
        }

        this.removeHighlight();
    }

    /**
     * Mostrar mensaje de completitud
     */
    showCompletionMessage() {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2ecc71;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        message.innerHTML = '✅ ¡Tour completado exitosamente!';

        document.body.appendChild(message);

        setTimeout(() => {
            message.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => message.remove(), 300);
        }, 3000);
    }

    /**
     * Agregar botón para reiniciar tour
     */
    addRestartButton() {
        const helpMenu = document.querySelector('.help-menu');
        if (!helpMenu) return;

        const button = document.createElement('button');
        button.className = 'restart-tour-btn';
        button.innerHTML = '🎓 Repetir Tour Guiado';
        button.onclick = () => this.restart();

        helpMenu.appendChild(button);
    }

    /**
     * Reiniciar tour
     */
    restart() {
        this.completed = false;
        this.currentStep = 0;
        this.saveProgress(false);
        this.start();
    }

    /**
     * Guardar progreso
     */
    saveProgress(completed) {
        try {
            localStorage.setItem(`tour_${this.tourId}_completed`, JSON.stringify(completed));
        } catch (error) {
            console.error('Error guardando progreso del tour:', error);
        }
    }

    /**
     * Cargar progreso
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem(`tour_${this.tourId}_completed`);
            return saved ? JSON.parse(saved) : false;
        } catch (error) {
            console.error('Error cargando progreso del tour:', error);
            return false;
        }
    }
}

// Auto-inicializar en páginas de administración
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const isAdminPage = window.location.pathname.includes('/admin');
        const isFirstVisit = !localStorage.getItem('admin_visited_before');

        if (isAdminPage && isFirstVisit) {
            window.adminTour = new AdminTour({
                autoStart: true
            });

            localStorage.setItem('admin_visited_before', 'true');
        } else if (isAdminPage) {
            // Inicializar sin auto-start para permitir reinicio manual
            window.adminTour = new AdminTour({
                autoStart: false
            });
        }
    });
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminTour;
}
