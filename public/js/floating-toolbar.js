/**
 * 🎯 BARRA DE HERRAMIENTAS FLOTANTE
 * Sistema de botones flotantes horizontales para acceso rápido
 * window.getTenantConfigValue('school_full_name_with_quotes', 'Bachillerato General Estatal "window.getTenantConfigValue('school_institution_name', 'window.getTenantConfigValue('school_institution_name', 'window.getTenantConfigValue('school_institution_name', 'window.getTenantConfigValue('school_institution_name', 'window.getTenantConfigValue('school_institution_name', 'window.getTenantConfigValue('school_institution_name', 'Héroes de la Patria')')')')')')"')
 */

class FloatingToolbar {
    constructor() {
        this.buttons = [
            {
                id: 'dashboard-btn',
                icon: '📊',
                title: 'Dashboard Analytics',
                color: '#3498db',
                action: () => this.openDashboard()
            },
            {
                id: 'lab-btn',
                icon: '🧪',
                title: 'Laboratorios Virtuales',
                color: '#e74c3c',
                action: () => this.openVirtualLabs()
            },
            {
                id: 'games-btn',
                icon: '🎮',
                title: 'Sistema de Gamificación',
                color: '#9b59b6',
                action: () => this.openGamification()
            },
            {
                id: 'settings-btn',
                icon: '⚙️',
                title: 'Configuración',
                color: '#95a5a6',
                action: () => this.openSettings()
            },
            {
                id: 'security-btn',
                icon: '🛡️',
                title: 'Centro de Seguridad',
                color: '#27ae60',
                action: () => this.openSecurity()
            },
            {
                id: 'reports-btn',
                icon: '📋',
                title: 'Reportes Académicos',
                color: '#f39c12',
                action: () => this.openReports()
            }
        ];

        this.init();
    }

    init() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createToolbar());
        } else {
            this.createToolbar();
        }
    }

    createToolbar() {
        // Verificar si ya existe
        if (document.getElementById('floating-toolbar')) return;

        console.log('🎨 Creando barra de herramientas flotante...');

        // Crear contenedor principal
        const toolbar = document.createElement('div');
        toolbar.id = 'floating-toolbar';
        toolbar.className = 'floating-toolbar';

        // Crear botones
        this.buttons.forEach((btn, index) => {
            const button = this.createButton(btn, index);
            toolbar.appendChild(button);
        });

        // Agregar estilos
        this.addStyles();

        // Agregar al DOM
        document.body.appendChild(toolbar);

        console.log('✅ Barra de herramientas flotante creada');
    }

    createButton(config, index) {
        const button = document.createElement('button');
        button.id = config.id;
        button.className = 'floating-toolbar-btn';

        // Sanitize icon HTML with DOMPurify if available, fallback to window.sanitizeHTML
        const sanitizedIcon = (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize)
            ? DOMPurify.sanitize(config.icon)
            : (typeof window.sanitizeHTML === 'function' ? window.sanitizeHTML(config.icon) : config.icon);

        button.innerHTML = sanitizedIcon;
        button.title = config.title;
        button.style.setProperty('--btn-color', config.color);
        button.style.setProperty('--btn-index', index);

        button.addEventListener('click', config.action);

        return button;
    }

    addStyles() {
        if (document.getElementById('floating-toolbar-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'floating-toolbar-styles';
        styles.textContent = `
            .floating-toolbar {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 10px;
                z-index: 1000;
                padding: 10px;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 25px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }

            .floating-toolbar-btn {
                width: 50px;
                height: 50px;
                border: none;
                border-radius: 50%;
                background: var(--btn-color, #3498db);
                color: white;
                font-size: 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                position: relative;
                overflow: hidden;
            }

            .floating-toolbar-btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                transform: translateX(-100%);
                transition: transform 0.6s;
            }

            .floating-toolbar-btn:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                filter: brightness(1.1);
            }

            .floating-toolbar-btn:hover::before {
                transform: translateX(100%);
            }

            .floating-toolbar-btn:active {
                transform: translateY(-2px);
            }

            /* Responsive */
            @media (max-width: 768px) {
                .floating-toolbar {
                    bottom: 15px;
                    gap: 8px;
                    padding: 8px;
                }

                .floating-toolbar-btn {
                    width: 45px;
                    height: 45px;
                    font-size: 18px;
                }
            }

            @media (max-width: 480px) {
                .floating-toolbar {
                    gap: 6px;
                    padding: 6px;
                }

                .floating-toolbar-btn {
                    width: 40px;
                    height: 40px;
                    font-size: 16px;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    // Acciones de los botones
    openDashboard() {
        console.log('📊 Abriendo Dashboard Analytics...');
        window.open('./admin-dashboard.html', '_blank');
    }

    openVirtualLabs() {
        console.log('🧪 Abriendo Laboratorios Virtuales...');
        window.open('./ar-vr-lab.html', '_blank');
    }

    openGamification() {
        console.log('🎮 Abriendo Sistema de Gamificación...');
        // Mostrar modal o panel de gamificación
        alert('🎮 Sistema de Gamificación - Próximamente disponible');
    }

    openSettings() {
        console.log('⚙️ Abriendo Configuración...');
        // Mostrar panel de configuración
        alert('⚙️ Panel de Configuración - Próximamente disponible');
    }

    openSecurity() {
        console.log('🛡️ Abriendo Centro de Seguridad...');
        // Mostrar panel de seguridad
        alert('🛡️ Centro de Seguridad - Próximamente disponible');
    }

    openReports() {
        console.log('📋 Abriendo Reportes Académicos...');
        window.open('./calificaciones.html', '_blank');
    }
}

// Inicializar automáticamente
if (typeof window !== 'undefined') {
    window.floatingToolbar = new FloatingToolbar();
}