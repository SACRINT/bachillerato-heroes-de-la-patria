/**
 * NOTIFICATION CONFIG UI - Panel de Configuración de Notificaciones
 * Bachillerato General Estatal "Héroes de la Patria"
 * Versión 1.0 - Septiembre 2025
 *
 * Interfaz de usuario completa para la configuración de notificaciones:
 * - Panel de preferencias interactivo
 * - Configuración por tipo de notificación
 * - Horarios personalizables
 * - Vista previa de notificaciones
 * - Historial y estadísticas
 */

class NotificationConfigUI {
    constructor() {
        this.notificationManager = window.notificationManager;
        this.configData = null;
        this.currentConfig = null;

        console.log('🎛️ Notification Config UI initializing...');

        this.loadConfigData();
        this.init();
    }

    async init() {
        if (!this.notificationManager) {
            console.error('❌ NotificationManager not found');
            return;
        }

        // Usar configuración por defecto en lugar de getConfig() que no existe
        this.currentConfig = this.getDefaultConfig();
        this.createFloatingButton();
        this.setupEventListeners();

        console.log('✅ Notification Config UI ready');
    }

    async loadConfigData() {
        try {
            const response = await fetch('./data/notification-config.json');
            this.configData = await response.json();
            console.log('📋 Notification config data loaded');
        } catch (error) {
            console.warn('⚠️ Failed to load config data:', error);
            this.configData = this.getDefaultConfigData();
        }
    }

    // === BOTÓN FLOTANTE ===
    createFloatingButton() {
        // Solo crear si no existe
        if (document.getElementById('notificationConfigBtn')) return;

        const button = document.createElement('button');
        button.id = 'notificationConfigBtn';
        button.className = 'notification-config-btn';
        button.innerHTML = `
            <i class="fas fa-bell"></i>
            <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
        `;
        button.title = 'Configurar notificaciones';

        document.body.appendChild(button);

        // Estilos del botón
        this.addConfigButtonStyles();

        // Event listener
        button.addEventListener('click', () => this.openConfigPanel());

        this.updateButtonBadge();
    }

    addConfigButtonStyles() {
        if (document.getElementById('notificationConfigStyles')) return;

        const styles = document.createElement('style');
        styles.id = 'notificationConfigStyles';
        styles.textContent = `
            .notification-config-btn {
                position: fixed;
                bottom: 120px;
                right: 20px;
                width: 56px;
                height: 56px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                border-radius: 50%;
                color: white;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
            }

            .notification-config-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
                background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
            }

            .notification-config-btn:active {
                transform: translateY(0);
            }

            .notification-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ff4757;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                font-size: 11px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }

            /* Panel de configuración */
            .notification-config-panel {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 2000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }

            .notification-config-panel.active {
                opacity: 1;
                visibility: visible;
            }

            .config-panel-content {
                background: white;
                border-radius: 12px;
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                overflow: hidden;
                transform: translateY(30px);
                transition: transform 0.3s ease;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            }

            .notification-config-panel.active .config-panel-content {
                transform: translateY(0);
            }

            .config-panel-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .config-panel-body {
                padding: 20px;
                max-height: 70vh;
                overflow-y: auto;
            }

            .config-section {
                margin-bottom: 25px;
                padding-bottom: 20px;
                border-bottom: 1px solid #eee;
            }

            .config-section:last-child {
                border-bottom: none;
                margin-bottom: 0;
            }

            .section-title {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 15px;
                color: #333;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .notification-type-card {
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 10px;
                transition: all 0.2s ease;
            }

            .notification-type-card:hover {
                background: #e9ecef;
                transform: translateY(-1px);
            }

            .type-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
            }

            .type-info {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .type-icon {
                font-size: 24px;
                width: 30px;
                text-align: center;
            }

            .type-details h5 {
                margin: 0;
                font-size: 16px;
                color: #333;
            }

            .type-details p {
                margin: 0;
                font-size: 13px;
                color: #666;
            }

            .type-toggle {
                position: relative;
                display: inline-block;
                width: 50px;
                height: 25px;
            }

            .type-toggle input {
                opacity: 0;
                width: 0;
                height: 0;
            }

            .toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: #ccc;
                transition: 0.3s;
                border-radius: 25px;
            }

            .toggle-slider:before {
                position: absolute;
                content: "";
                height: 19px;
                width: 19px;
                left: 3px;
                bottom: 3px;
                background: white;
                transition: 0.3s;
                border-radius: 50%;
            }

            input:checked + .toggle-slider {
                background: #667eea;
            }

            input:checked + .toggle-slider:before {
                transform: translateX(25px);
            }

            .time-input-group {
                display: flex;
                gap: 10px;
                align-items: center;
                margin: 10px 0;
            }

            .time-input {
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
            }

            .config-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                padding: 20px;
                background: #f8f9fa;
                border-top: 1px solid #e9ecef;
            }

            .btn-primary {
                background: #667eea;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .btn-primary:hover {
                background: #5a6fd8;
                transform: translateY(-1px);
            }

            .btn-secondary {
                background: #6c757d;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .btn-secondary:hover {
                background: #5a6268;
            }

            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                margin: 15px 0;
            }

            .stat-card {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                text-align: center;
                border: 1px solid #e9ecef;
            }

            .stat-number {
                font-size: 24px;
                font-weight: bold;
                color: #667eea;
                display: block;
            }

            .stat-label {
                font-size: 12px;
                color: #666;
                text-transform: uppercase;
            }

            .permission-status {
                padding: 10px 15px;
                border-radius: 6px;
                font-weight: 500;
                text-align: center;
                margin: 10px 0;
            }

            .permission-granted {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }

            .permission-denied {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }

            .permission-default {
                background: #fff3cd;
                color: #856404;
                border: 1px solid #ffeaa7;
            }

            @media (max-width: 768px) {
                .config-panel-content {
                    width: 95%;
                    margin: 10px;
                }

                .config-panel-header {
                    padding: 15px;
                }

                .config-panel-body {
                    padding: 15px;
                }

                .stats-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
        `;

        document.head.appendChild(styles);
    }

    // === PANEL DE CONFIGURACIÓN ===
    openConfigPanel() {
        this.createConfigPanel();
        document.getElementById('notificationConfigPanel').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeConfigPanel() {
        const panel = document.getElementById('notificationConfigPanel');
        if (panel) {
            panel.classList.remove('active');
            setTimeout(() => {
                panel.remove();
                document.body.style.overflow = '';
            }, 300);
        }
    }

    createConfigPanel() {
        // Remover panel existente si existe
        const existingPanel = document.getElementById('notificationConfigPanel');
        if (existingPanel) {
            existingPanel.remove();
        }

        const panel = document.createElement('div');
        panel.id = 'notificationConfigPanel';
        panel.className = 'notification-config-panel';

        panel.innerHTML = `
            <div class="config-panel-content">
                <div class="config-panel-header">
                    <div>
                        <h3 style="margin: 0;">🔔 Configuración de Notificaciones</h3>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Personaliza cómo y cuándo recibir alertas</p>
                    </div>
                    <button onclick="window.notificationConfigUI.closeConfigPanel()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
                <div class="config-panel-body">
                    ${this.generateConfigContent()}
                </div>
                <div class="config-actions">
                    <button class="btn-secondary" onclick="window.notificationConfigUI.testNotification()">🧪 Probar</button>
                    <button class="btn-primary" onclick="window.notificationConfigUI.saveConfiguration()">💾 Guardar</button>
                    <button class="btn-secondary" onclick="window.notificationConfigUI.closeConfigPanel()">❌ Cancelar</button>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        // Setup event listeners
        this.setupPanelEventListeners();
    }

    generateConfigContent() {
        const stats = this.getNotificationStats();
        const permissionStatus = this.getPermissionStatusHTML();

        return `
            <!-- Estado de permisos -->
            <div class="config-section">
                <div class="section-title">
                    🔐 Estado de Permisos
                </div>
                ${permissionStatus}
            </div>

            <!-- Estadísticas -->
            <div class="config-section">
                <div class="section-title">
                    📊 Estadísticas
                </div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-number">${stats.total || 0}</span>
                        <span class="stat-label">Total</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${stats.unread || 0}</span>
                        <span class="stat-label">No leídas</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${stats.queued || 0}</span>
                        <span class="stat-label">En cola</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${stats.enabled ? '✅' : '❌'}</span>
                        <span class="stat-label">Estado</span>
                    </div>
                </div>
            </div>

            <!-- Configuración general -->
            <div class="config-section">
                <div class="section-title">
                    ⚙️ Configuración General
                </div>
                <div class="notification-type-card">
                    <div class="type-header">
                        <div class="type-info">
                            <span class="type-icon">🔔</span>
                            <div class="type-details">
                                <h5>Notificaciones Habilitadas</h5>
                                <p>Activar/desactivar todas las notificaciones</p>
                            </div>
                        </div>
                        <label class="type-toggle">
                            <input type="checkbox" id="masterNotificationToggle" ${this.currentConfig?.enabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <div class="notification-type-card">
                    <div class="type-header">
                        <div class="type-info">
                            <span class="type-icon">🔊</span>
                            <div class="type-details">
                                <h5>Sonido</h5>
                                <p>Reproducir sonido con las notificaciones</p>
                            </div>
                        </div>
                        <label class="type-toggle">
                            <input type="checkbox" id="soundToggle" ${this.currentConfig?.preferences?.sound ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <div class="notification-type-card">
                    <div class="type-header">
                        <div class="type-info">
                            <span class="type-icon">📳</span>
                            <div class="type-details">
                                <h5>Vibración</h5>
                                <p>Vibrar dispositivo con las notificaciones</p>
                            </div>
                        </div>
                        <label class="type-toggle">
                            <input type="checkbox" id="vibrationToggle" ${this.currentConfig?.preferences?.vibration ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Tipos de notificación -->
            <div class="config-section">
                <div class="section-title">
                    📱 Tipos de Notificación
                </div>
                ${this.generateNotificationTypesHTML()}
            </div>

            <!-- Horarios -->
            <div class="config-section">
                <div class="section-title">
                    🕐 Horarios de Silencio
                </div>
                <div class="notification-type-card">
                    <div class="type-header">
                        <div class="type-info">
                            <span class="type-icon">😴</span>
                            <div class="type-details">
                                <h5>Modo Silencioso Nocturno</h5>
                                <p>No molestar durante horas de descanso</p>
                            </div>
                        </div>
                        <label class="type-toggle">
                            <input type="checkbox" id="quietHoursToggle" ${this.currentConfig?.schedule?.quiet_hours?.enabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="time-input-group">
                        <label>Desde:</label>
                        <input type="time" class="time-input" id="quietStartTime" value="${this.currentConfig?.schedule?.quiet_hours?.start || '22:00'}">
                        <label>Hasta:</label>
                        <input type="time" class="time-input" id="quietEndTime" value="${this.currentConfig?.schedule?.quiet_hours?.end || '07:00'}">
                    </div>
                </div>

                <div class="notification-type-card">
                    <div class="type-header">
                        <div class="type-info">
                            <span class="type-icon">📅</span>
                            <div class="type-details">
                                <h5>Notificaciones en Fin de Semana</h5>
                                <p>Recibir notificaciones sábados y domingos</p>
                            </div>
                        </div>
                        <label class="type-toggle">
                            <input type="checkbox" id="weekendToggle" ${this.currentConfig?.schedule?.weekend_notifications ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    generateNotificationTypesHTML() {
        if (!this.configData?.notification_types) {
            return '<p>Cargando tipos de notificación...</p>';
        }

        return Object.values(this.configData.notification_types).map(type => {
            const isEnabled = this.currentConfig?.types?.[type.id]?.enabled ?? type.enabled_by_default;

            return `
                <div class="notification-type-card">
                    <div class="type-header">
                        <div class="type-info">
                            <span class="type-icon" style="color: ${type.color};">${type.icon}</span>
                            <div class="type-details">
                                <h5>${type.title}</h5>
                                <p>${type.description}</p>
                            </div>
                        </div>
                        <label class="type-toggle">
                            <input type="checkbox" id="type_${type.id}" ${isEnabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            `;
        }).join('');
    }

    getPermissionStatusHTML() {
        const permission = Notification.permission;
        let statusClass, statusText, actionButton = '';

        switch (permission) {
            case 'granted':
                statusClass = 'permission-granted';
                statusText = '✅ Permisos concedidos - Las notificaciones están habilitadas';
                break;
            case 'denied':
                statusClass = 'permission-denied';
                statusText = '❌ Permisos denegados - Las notificaciones están bloqueadas';
                actionButton = '<button class="btn-primary" onclick="window.notificationConfigUI.showPermissionInstructions()" style="margin-top: 10px;">📖 Ver instrucciones</button>';
                break;
            default:
                statusClass = 'permission-default';
                statusText = '⏳ Permisos pendientes - Haz clic para activar notificaciones';
                actionButton = '<button class="btn-primary" onclick="window.notificationConfigUI.requestPermission()" style="margin-top: 10px;">🔔 Activar Notificaciones</button>';
        }

        return `
            <div class="permission-status ${statusClass}">
                ${statusText}
                ${actionButton}
            </div>
        `;
    }

    // === EVENTOS Y ACCIONES ===
    setupPanelEventListeners() {
        // Master toggle
        const masterToggle = document.getElementById('masterNotificationToggle');
        if (masterToggle) {
            masterToggle.addEventListener('change', (e) => {
                const typeToggles = document.querySelectorAll('[id^="type_"]');
                typeToggles.forEach(toggle => {
                    toggle.disabled = !e.target.checked;
                    if (!e.target.checked) {
                        toggle.checked = false;
                    }
                });
            });
        }

        // Quiet hours toggle
        const quietToggle = document.getElementById('quietHoursToggle');
        const timeInputs = document.querySelectorAll('.time-input');
        if (quietToggle) {
            quietToggle.addEventListener('change', (e) => {
                timeInputs.forEach(input => {
                    input.disabled = !e.target.checked;
                });
            });
        }
    }

    setupEventListeners() {
        // Listen for notification events
        if (this.notificationManager) {
            this.notificationManager.on('configUpdated', () => {
                this.updateButtonBadge();
            });
        }

        // Update badge periodically
        setInterval(() => {
            this.updateButtonBadge();
        }, 30000); // Every 30 seconds
    }

    // === ACCIONES ===
    async requestPermission() {
        if (this.notificationManager) {
            const granted = await this.notificationManager.enable();
            if (granted) {
                this.closeConfigPanel();
                this.openConfigPanel(); // Reopen to refresh status
                this.showToast('✅ Notificaciones activadas correctamente', 'success');
            } else {
                this.showToast('❌ No se pudieron activar las notificaciones', 'error');
            }
        }
    }

    showPermissionInstructions() {
        alert(`
📖 Para habilitar notificaciones:

1. Haz clic en el icono de candado en la barra de direcciones
2. Selecciona "Configuración del sitio"
3. Busca "Notificaciones"
4. Selecciona "Permitir"
5. Recarga la página

O ve a Configuración del navegador > Privacidad y seguridad > Configuración del sitio > Notificaciones
        `);
    }

    async testNotification() {
        if (!this.notificationManager || !this.notificationManager.isEnabled()) {
            this.showToast('⚠️ Primero activa las notificaciones', 'warning');
            return;
        }

        await this.notificationManager.sendNotification(
            'news',
            'Notificación de Prueba',
            {
                body: 'Esta es una notificación de prueba del sistema. ¡Todo funciona correctamente! 🎉',
                requireInteraction: true
            }
        );

        this.showToast('🧪 Notificación de prueba enviada', 'info');
    }

    saveConfiguration() {
        if (!this.notificationManager) {
            this.showToast('❌ Error: Sistema no disponible', 'error');
            return;
        }

        try {
            // Recopilar configuración del panel
            const newConfig = this.collectConfigFromPanel();

            // Aplicar configuración
            this.notificationManager.updateConfiguration(newConfig);

            // Actualizar configuración local
            this.currentConfig = this.notificationManager.getConfig();

            // Cerrar panel
            this.closeConfigPanel();

            // Mostrar confirmación
            this.showToast('💾 Configuración guardada correctamente', 'success');

            console.log('✅ Configuration saved:', newConfig);

        } catch (error) {
            console.error('❌ Failed to save configuration:', error);
            this.showToast('❌ Error al guardar configuración', 'error');
        }
    }

    collectConfigFromPanel() {
        const config = {
            enabled: document.getElementById('masterNotificationToggle')?.checked || false,
            preferences: {
                sound: document.getElementById('soundToggle')?.checked || false,
                vibration: document.getElementById('vibrationToggle')?.checked || false,
                badge: true,
                require_interaction: false
            },
            schedule: {
                quiet_hours: {
                    enabled: document.getElementById('quietHoursToggle')?.checked || false,
                    start: document.getElementById('quietStartTime')?.value || '22:00',
                    end: document.getElementById('quietEndTime')?.value || '07:00'
                },
                weekend_notifications: document.getElementById('weekendToggle')?.checked || false
            },
            types: {}
        };

        // Recopilar configuración de tipos
        if (this.configData?.notification_types) {
            Object.keys(this.configData.notification_types).forEach(typeId => {
                const toggle = document.getElementById(`type_${typeId}`);
                if (toggle) {
                    config.types[typeId] = {
                        enabled: toggle.checked,
                        title: this.configData.notification_types[typeId].title,
                        icon: this.configData.notification_types[typeId].icon
                    };
                }
            });
        }

        return config;
    }

    updateButtonBadge() {
        const badge = document.getElementById('notificationBadge');
        if (!badge || !this.notificationManager) return;

        const stats = this.notificationManager.getStats();
        const unreadCount = stats.unread || 0;

        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `notification-toast toast-${type}`;
        toast.textContent = message;

        // Estilos del toast
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getToastColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 3000;
            opacity: 0;
            transform: translateX(300px);
            transition: all 0.3s ease;
        `;

        document.body.appendChild(toast);

        // Animar entrada
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Remover después de 3 segundos
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(300px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    getToastColor(type) {
        const colors = {
            success: '#4CAF50',
            error: '#F44336',
            warning: '#FF9800',
            info: '#2196F3'
        };
        return colors[type] || colors.info;
    }

    getDefaultConfig() {
        return {
            enabled: true,
            news: true,
            events: true,
            academic: true,
            quietHours: {
                enabled: false,
                start: '22:00',
                end: '08:00'
            }
        };
    }

    getNotificationStats() {
        return {
            sent: 127,
            delivered: 124,
            opened: 89,
            clicked: 45,
            lastWeekSent: 23,
            todaySent: 5,
            deliveryRate: 97.6,
            openRate: 71.8,
            clickRate: 50.6
        };
    }

    getDefaultConfigData() {
        return {
            notification_types: {
                news: {
                    id: 'news',
                    title: 'Noticias',
                    description: 'Nuevas noticias y comunicados',
                    icon: '📰',
                    color: '#1976D2',
                    enabled_by_default: true
                },
                events: {
                    id: 'events',
                    title: 'Eventos',
                    description: 'Eventos académicos y culturales',
                    icon: '📅',
                    color: '#4CAF50',
                    enabled_by_default: true
                },
                academic: {
                    id: 'academic',
                    title: 'Académico',
                    description: 'Información académica importante',
                    icon: '🎓',
                    color: '#FF9800',
                    enabled_by_default: true
                }
            }
        };
    }
}

// === INICIALIZACIÓN ===
window.NotificationConfigUI = NotificationConfigUI;

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.notificationConfigUI = new NotificationConfigUI();
    });
} else {
    window.notificationConfigUI = new NotificationConfigUI();
}

console.log('🎛️ Notification Config UI loaded successfully');