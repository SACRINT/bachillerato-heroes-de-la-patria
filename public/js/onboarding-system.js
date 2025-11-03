/**
 * 🎯 SISTEMA DE ONBOARDING INTERACTIVO
 * Bachillerato General Estatal "Héroes de la Patria"
 * Sistema completo de introducción y tutorial para nuevos usuarios
 */

class OnboardingSystem {
    constructor() {
        this.currentStep = 0;
        this.totalSteps = 0;
        this.isActive = false;
        this.userType = 'visitor'; // visitor, student, parent, teacher, admin
        this.completedSteps = [];
        this.overlay = null;
        this.tooltip = null;
        this.progressBar = null;

        this.steps = {
            visitor: [
                {
                    target: 'body',
                    title: '👋 ¡Bienvenido al BGE Héroes de la Patria!',
                    content: 'Te guiaremos por las principales funciones de nuestro portal educativo.',
                    position: 'center',
                    action: 'highlight',
                    duration: 3000
                },
                {
                    target: 'nav',
                    title: '🧭 Navegación Principal',
                    content: 'Desde aquí puedes acceder a todas las secciones: Conocenos, Oferta Educativa, Servicios y más.',
                    position: 'bottom',
                    action: 'highlight'
                },
                {
                    target: '#darkModeToggle',
                    title: '🌙 Modo Oscuro',
                    content: 'Cambia entre tema claro y oscuro según tu preferencia. Se adapta automáticamente.',
                    position: 'left',
                    action: 'highlight'
                },
                {
                    target: '[data-notification-button]',
                    title: '🔔 Sistema de Notificaciones',
                    content: 'Configura las notificaciones para recibir avisos importantes del bachillerato.',
                    position: 'left',
                    action: 'highlight'
                },
                {
                    target: '.contact-section, #contact-form',
                    title: '📧 Formulario de Contacto',
                    content: 'Envía mensajes directamente. Solo emails reales pueden contactarnos (anti-spam activo).',
                    position: 'top',
                    action: 'highlight'
                },
                {
                    target: '#pwa-install-button',
                    title: '📱 Instalar Aplicación',
                    content: '¡Instala nuestra app para acceso rápido desde tu móvil o escritorio!',
                    position: 'right',
                    action: 'pulse'
                }
            ],
            student: [
                {
                    target: 'body',
                    title: '🎓 ¡Hola Estudiante!',
                    content: 'Descubre todas las herramientas diseñadas para potenciar tu aprendizaje.',
                    position: 'center',
                    action: 'highlight'
                },
                {
                    target: '#ai-tutor-btn',
                    title: '🤖 Tu Tutor de IA Personal',
                    content: 'Accede a tu asistente inteligente para resolver dudas y obtener ayuda personalizada.',
                    position: 'left',
                    action: 'pulse'
                },
                {
                    target: '.grades-section',
                    title: '📊 Consulta tus Calificaciones',
                    content: 'Ve tu progreso académico, calificaciones y estadísticas de rendimiento.',
                    position: 'top',
                    action: 'highlight'
                },
                {
                    target: '.calendar-section',
                    title: '📅 Calendario Académico',
                    content: 'Mantente al día con exámenes, entregas y eventos importantes.',
                    position: 'bottom',
                    action: 'highlight'
                },
                {
                    target: '[data-voice-button]',
                    title: '🎤 Dictado por Voz',
                    content: 'Usa tu voz para escribir en formularios. ¡Perfecto para tareas y proyectos!',
                    position: 'top',
                    action: 'highlight'
                }
            ],
            parent: [
                {
                    target: 'body',
                    title: '👨‍👩‍👧‍👦 Bienvenido Padre/Madre de Familia',
                    content: 'Mantente conectado con la educación de tu hijo/a.',
                    position: 'center',
                    action: 'highlight'
                },
                {
                    target: '.communication-section',
                    title: '💬 Comunicación con Docentes',
                    content: 'Chat directo con maestros para seguimiento académico y dudas.',
                    position: 'bottom',
                    action: 'highlight'
                },
                {
                    target: '.payments-section',
                    title: '💳 Pagos en Línea',
                    content: 'Realiza pagos de colegiatura e inscripciones de forma segura.',
                    position: 'top',
                    action: 'highlight'
                },
                {
                    target: '.reports-section',
                    title: '📋 Reportes Académicos',
                    content: 'Descarga boletas, reportes de asistencia y seguimiento académico.',
                    position: 'left',
                    action: 'highlight'
                }
            ],
            teacher: [
                {
                    target: 'body',
                    title: '👨‍🏫 Bienvenido Docente',
                    content: 'Herramientas avanzadas para potenciar tu enseñanza.',
                    position: 'center',
                    action: 'highlight'
                },
                {
                    target: '.content-generator',
                    title: '📚 Generador de Contenido IA',
                    content: 'Crea material didáctico personalizado con inteligencia artificial.',
                    position: 'bottom',
                    action: 'pulse'
                },
                {
                    target: '.virtual-labs',
                    title: '🧪 Laboratorios Virtuales',
                    content: 'Accede a simulaciones y experimentos virtuales para tus clases.',
                    position: 'top',
                    action: 'highlight'
                },
                {
                    target: '.grades-management',
                    title: '📊 Gestión de Calificaciones',
                    content: 'Registra y gestiona las calificaciones de tus estudiantes.',
                    position: 'right',
                    action: 'highlight'
                }
            ]
        };

        this.init();
    }

    init() {
        this.detectUserType();
        this.loadProgress();
        this.createOnboardingUI();
        this.setupEventListeners();

        // Auto-iniciar onboarding para nuevos usuarios
        if (!this.hasSeenOnboarding()) {
            setTimeout(() => this.start(), 1500);
        }

        console.log('🎯 [ONBOARDING] Sistema inicializado para usuario tipo:', this.userType);
    }

    detectUserType() {
        // Detectar tipo de usuario basado en URL, localStorage o contexto
        const path = window.location.pathname;
        const savedUserType = localStorage.getItem('bge_user_type');

        if (savedUserType) {
            this.userType = savedUserType;
        } else if (path.includes('estudiantes')) {
            this.userType = 'student';
        } else if (path.includes('padres')) {
            this.userType = 'parent';
        } else if (path.includes('admin') || path.includes('docentes')) {
            this.userType = 'teacher';
        } else {
            this.userType = 'visitor';
        }

        // Guardar tipo detectado
        localStorage.setItem('bge_user_type', this.userType);
        this.totalSteps = this.steps[this.userType]?.length || 0;
    }

    hasSeenOnboarding() {
        return localStorage.getItem(`bge_onboarding_${this.userType}`) === 'completed';
    }

    loadProgress() {
        const saved = localStorage.getItem(`bge_onboarding_progress_${this.userType}`);
        if (saved) {
            const progress = JSON.parse(saved);
            this.completedSteps = progress.completedSteps || [];
            this.currentStep = progress.currentStep || 0;
        }
    }

    saveProgress() {
        const progress = {
            completedSteps: this.completedSteps,
            currentStep: this.currentStep,
            timestamp: Date.now()
        };
        localStorage.setItem(`bge_onboarding_progress_${this.userType}`, JSON.stringify(progress));
    }

    createOnboardingUI() {
        // Crear overlay
        this.overlay = document.createElement('div');
        this.overlay.id = 'onboarding-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(3px);
            z-index: 10000;
            display: none;
            transition: all 0.3s ease;
        `;

        // Crear tooltip
        this.tooltip = document.createElement('div');
        this.tooltip.id = 'onboarding-tooltip';
        this.tooltip.style.cssText = `
            position: fixed;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            max-width: 350px;
            min-width: 280px;
            z-index: 10001;
            display: none;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            transform: scale(0.8);
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        `;

        // Crear barra de progreso
        this.progressBar = document.createElement('div');
        this.progressBar.id = 'onboarding-progress';
        this.progressBar.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 15px 20px;
            border-radius: 25px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            z-index: 10002;
            display: none;
            font-weight: bold;
            color: #333;
        `;

        document.body.appendChild(this.overlay);
        document.body.appendChild(this.tooltip);
        document.body.appendChild(this.progressBar);
    }

    setupEventListeners() {
        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                this.skip();
            }
        });

        // Botón de ayuda para reiniciar onboarding
        this.createHelpButton();
    }

    createHelpButton() {
        const helpButton = document.createElement('button');
        helpButton.id = 'onboarding-help-btn';
        helpButton.innerHTML = '❓';
        helpButton.title = 'Tutorial del sistema';
        helpButton.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            border: none;
            font-size: 20px;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 5px 15px rgba(240, 147, 251, 0.4);
            transition: all 0.3s ease;
            display: ${this.hasSeenOnboarding() ? 'flex' : 'none'};
            align-items: center;
            justify-content: center;
        `;

        helpButton.addEventListener('click', () => this.restart());
        helpButton.addEventListener('mouseenter', () => {
            helpButton.style.transform = 'scale(1.1)';
            helpButton.style.boxShadow = '0 8px 25px rgba(240, 147, 251, 0.6)';
        });
        helpButton.addEventListener('mouseleave', () => {
            helpButton.style.transform = 'scale(1)';
            helpButton.style.boxShadow = '0 5px 15px rgba(240, 147, 251, 0.4)';
        });

        document.body.appendChild(helpButton);
    }

    start() {
        if (this.totalSteps === 0) return;

        this.isActive = true;
        this.currentStep = 0;
        this.showOverlay();
        this.showStep(this.currentStep);

        console.log('🎯 [ONBOARDING] Iniciado para usuario:', this.userType);
    }

    restart() {
        this.currentStep = 0;
        this.completedSteps = [];
        this.start();
    }

    showOverlay() {
        this.overlay.style.display = 'block';
        this.progressBar.style.display = 'block';
        setTimeout(() => {
            this.overlay.style.opacity = '1';
        }, 10);
    }

    hideOverlay() {
        this.overlay.style.opacity = '0';
        this.progressBar.style.display = 'none';
        setTimeout(() => {
            this.overlay.style.display = 'none';
        }, 300);
    }

    showStep(stepIndex) {
        if (stepIndex >= this.totalSteps) {
            this.complete();
            return;
        }

        const step = this.steps[this.userType][stepIndex];
        if (!step) return;

        this.updateProgress();
        this.highlightTarget(step);
        this.showTooltip(step, stepIndex);
    }

    highlightTarget(step) {
        // Remover highlights anteriores
        document.querySelectorAll('.onboarding-highlight').forEach(el => {
            el.classList.remove('onboarding-highlight');
        });

        let target = document.querySelector(step.target);
        if (!target && step.target === 'body') {
            target = document.body;
        }

        if (target) {
            target.classList.add('onboarding-highlight');

            // Scroll al elemento si es necesario
            if (step.target !== 'body') {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'center'
                });
            }

            // Aplicar efectos especiales
            if (step.action === 'pulse') {
                target.style.animation = 'onboarding-pulse 2s infinite';
            }
        }

        // Agregar estilos CSS si no existen
        if (!document.getElementById('onboarding-styles')) {
            const style = document.createElement('style');
            style.id = 'onboarding-styles';
            style.textContent = `
                .onboarding-highlight {
                    position: relative;
                    z-index: 9999 !important;
                    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.8),
                                0 0 0 8px rgba(102, 126, 234, 0.4) !important;
                    border-radius: 8px !important;
                }

                @keyframes onboarding-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    showTooltip(step, stepIndex) {
        const target = document.querySelector(step.target);

        this.tooltip.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; font-size: 18px; flex: 1;">${step.title}</h3>
                <span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                    ${stepIndex + 1}/${this.totalSteps}
                </span>
            </div>
            <p style="margin: 0 0 20px 0; line-height: 1.5; opacity: 0.95;">${step.content}</p>
            <div style="display: flex; gap: 10px; justify-content: space-between;">
                <button onclick="onboardingSystem.skip()" style="
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 14px;
                ">Saltar tutorial</button>
                <div>
                    ${stepIndex > 0 ? `
                        <button onclick="onboardingSystem.previous()" style="
                            background: rgba(255,255,255,0.2);
                            border: none;
                            color: white;
                            padding: 8px 16px;
                            border-radius: 20px;
                            cursor: pointer;
                            margin-right: 8px;
                        ">← Anterior</button>
                    ` : ''}
                    <button onclick="onboardingSystem.next()" style="
                        background: rgba(255,255,255,0.3);
                        border: none;
                        color: white;
                        padding: 8px 16px;
                        border-radius: 20px;
                        cursor: pointer;
                        font-weight: bold;
                    ">${stepIndex === this.totalSteps - 1 ? 'Finalizar' : 'Siguiente →'}</button>
                </div>
            </div>
        `;

        this.positionTooltip(step, target);

        this.tooltip.style.display = 'block';
        setTimeout(() => {
            this.tooltip.style.transform = 'scale(1)';
        }, 10);

        // Auto avanzar si se especifica duración
        if (step.duration) {
            setTimeout(() => {
                if (this.isActive && this.currentStep === stepIndex) {
                    this.next();
                }
            }, step.duration);
        }
    }

    positionTooltip(step, target) {
        if (!target || step.position === 'center') {
            // Centrar tooltip
            this.tooltip.style.top = '50%';
            this.tooltip.style.left = '50%';
            this.tooltip.style.transform = 'translate(-50%, -50%) scale(1)';
            return;
        }

        const rect = target.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();

        let top, left;

        switch (step.position) {
            case 'top':
                top = rect.top - tooltipRect.height - 20;
                left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'bottom':
                top = rect.bottom + 20;
                left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'left':
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                left = rect.left - tooltipRect.width - 20;
                break;
            case 'right':
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                left = rect.right + 20;
                break;
            default:
                top = rect.bottom + 20;
                left = rect.left;
        }

        // Ajustar si sale de la pantalla
        if (left < 20) left = 20;
        if (left + tooltipRect.width > window.innerWidth - 20) {
            left = window.innerWidth - tooltipRect.width - 20;
        }
        if (top < 20) top = rect.bottom + 20;
        if (top + tooltipRect.height > window.innerHeight - 20) {
            top = rect.top - tooltipRect.height - 20;
        }

        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.transform = 'scale(1)';
    }

    updateProgress() {
        const progress = Math.round(((this.currentStep + 1) / this.totalSteps) * 100);
        this.progressBar.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span>Tutorial: ${this.currentStep + 1}/${this.totalSteps}</span>
                <div style="width: 100px; height: 8px; background: rgba(0,0,0,0.1); border-radius: 4px; overflow: hidden;">
                    <div style="width: ${progress}%; height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); border-radius: 4px; transition: width 0.3s ease;"></div>
                </div>
                <span style="font-size: 12px; color: #666;">${progress}%</span>
            </div>
        `;
    }

    next() {
        if (!this.completedSteps.includes(this.currentStep)) {
            this.completedSteps.push(this.currentStep);
        }

        this.currentStep++;
        this.saveProgress();

        this.tooltip.style.transform = 'scale(0.8)';
        setTimeout(() => {
            this.showStep(this.currentStep);
        }, 150);
    }

    previous() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.tooltip.style.transform = 'scale(0.8)';
            setTimeout(() => {
                this.showStep(this.currentStep);
            }, 150);
        }
    }

    skip() {
        this.complete();
    }

    complete() {
        this.isActive = false;

        // Mostrar mensaje de completion
        this.tooltip.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
                <h3 style="margin: 0 0 10px 0;">¡Tutorial Completado!</h3>
                <p style="margin: 0 0 20px 0;">Ya conoces las principales funciones del sistema.</p>
                <button onclick="onboardingSystem.finish()" style="
                    background: rgba(255,255,255,0.3);
                    border: none;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: bold;
                ">¡Empezar a usar el sistema!</button>
            </div>
        `;

        // Centrar tooltip final
        this.tooltip.style.top = '50%';
        this.tooltip.style.left = '50%';
        this.tooltip.style.transform = 'translate(-50%, -50%) scale(1)';

        // Auto-finish después de 5 segundos
        setTimeout(() => {
            if (this.tooltip.style.display !== 'none') {
                this.finish();
            }
        }, 5000);

        console.log('🎉 [ONBOARDING] Tutorial completado para usuario:', this.userType);
    }

    finish() {
        // Limpiar highlights
        document.querySelectorAll('.onboarding-highlight').forEach(el => {
            el.classList.remove('onboarding-highlight');
            el.style.animation = '';
        });

        // Ocultar UI
        this.tooltip.style.display = 'none';
        this.hideOverlay();

        // Marcar como completado
        localStorage.setItem(`bge_onboarding_${this.userType}`, 'completed');

        // Mostrar botón de ayuda
        const helpBtn = document.getElementById('onboarding-help-btn');
        if (helpBtn) {
            helpBtn.style.display = 'flex';
        }

        // Limpiar progreso temporal
        localStorage.removeItem(`bge_onboarding_progress_${this.userType}`);

        console.log('✅ [ONBOARDING] Sistema finalizado');
    }

    // API pública para otros scripts
    setUserType(type) {
        this.userType = type;
        localStorage.setItem('bge_user_type', type);
        this.totalSteps = this.steps[type]?.length || 0;
    }

    addCustomStep(userType, step) {
        if (!this.steps[userType]) {
            this.steps[userType] = [];
        }
        this.steps[userType].push(step);
    }

    triggerForElement(selector, title, content) {
        // Mostrar tooltip específico para un elemento
        const target = document.querySelector(selector);
        if (!target) return;

        const customStep = {
            target: selector,
            title: title,
            content: content,
            position: 'bottom'
        };

        this.isActive = true;
        this.showOverlay();
        this.highlightTarget(customStep);
        this.showTooltip(customStep, 0);
    }
}

// Inicializar automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.onboardingSystem = new OnboardingSystem();
});

// Exports para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OnboardingSystem;
}