/**
 * @fileoverview Floating Toolbar Component.
 * Migrated from public/js/floating-toolbar.js
 */

import { sanitizeHTML } from '../../core/utils/sanitizer';

export interface ToolbarButtonConfig {
    id: string;
    icon: string;
    title: string;
    color: string;
    action: () => void;
}

export class FloatingToolbar {
    private buttons: ToolbarButtonConfig[];

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

    private init(): void {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createToolbar());
        } else {
            this.createToolbar();
        }
    }

    private createToolbar(): void {
        if (document.getElementById('floating-toolbar')) return;

        console.log('🎨 Creating floating toolbar...');

        const toolbar = document.createElement('div');
        toolbar.id = 'floating-toolbar';
        toolbar.className = 'floating-toolbar';

        this.buttons.forEach((btn, index) => {
            const button = this.createButton(btn, index);
            toolbar.appendChild(button);
        });

        this.addStyles();
        document.body.appendChild(toolbar);

        console.log('✅ Floating toolbar created');
    }

    private createButton(config: ToolbarButtonConfig, index: number): HTMLButtonElement {
        const button = document.createElement('button');
        button.id = config.id;
        button.className = 'floating-toolbar-btn';

        button.innerHTML = sanitizeHTML(config.icon);
        button.title = config.title;
        button.style.setProperty('--btn-color', config.color);
        button.style.setProperty('--btn-index', String(index));

        button.addEventListener('click', config.action);

        return button;
    }

    private addStyles(): void {
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
                background: transparent;
                backdrop-filter: none;
                border-radius: 25px;
                border: none;
                box-shadow: none;
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

    private openDashboard(): void {
        console.log('📊 Opening Dashboard Analytics...');
        window.open('./admin-dashboard.html', '_blank');
    }

    private openVirtualLabs(): void {
        console.log('🧪 Opening Virtual Labs...');
        window.open('./ar-vr-lab.html', '_blank');
    }

    private openGamification(): void {
        console.log('🎮 Opening Gamification System...');
        alert('🎮 Sistema de Gamificación - Próximamente disponible');
    }

    private openSettings(): void {
        console.log('⚙️ Opening Settings...');
        alert('⚙️ Panel de Configuración - Próximamente disponible');
    }

    private openSecurity(): void {
        console.log('🛡️ Opening Security Center...');
        alert('🛡️ Centro de Seguridad - Próximamente disponible');
    }

    private openReports(): void {
        console.log('📋 Opening Academic Reports...');
        window.open('./calificaciones.html', '_blank');
    }
}

export const floatingToolbar = new FloatingToolbar();
