/**
 * BGE PUSH NOTIFICATION SYSTEM - Sistema Avanzado de Notificaciones Push
 *
 * Sistema integral de notificaciones push para BGE
 * Incluye notificaciones educativas, administrativas y en tiempo real
 */

class BGEPushNotificationSystem {
    constructor() {
        this.apiBase = '/api/notifications';
        this.swRegistration = null;
        this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
        this.isSubscribed = false;
        this.subscriptionData = null;

        // Configuración del sistema
        this.config = {
            enabled: true,
            autoSubscribe: true,
            showPermissionPrompt: true,
            maxRetries: 3,
            retryDelay: 5000,
            offlineQueue: true,
            categories: {
                academic: { priority: 'high', sound: 'academic.mp3', vibrate: [200, 100, 200] },
                administrative: { priority: 'normal', sound: 'admin.mp3', vibrate: [100, 50, 100] },
                social: { priority: 'low', sound: 'social.mp3', vibrate: [50] },
                emergency: { priority: 'urgent', sound: 'emergency.mp3', vibrate: [300, 100, 300, 100, 300] },
                system: { priority: 'normal', sound: 'system.mp3', vibrate: [100] }
            }
        };

        // Cola de notificaciones offline
        this.offlineQueue = [];
        this.notificationHistory = [];
        this.maxHistorySize = 100;

        // Estadísticas del sistema
        this.stats = {
            sent: 0,
            delivered: 0,
            clicked: 0,
            dismissed: 0,
            failed: 0
        };

        this.init();
    }

    async init() {
        console.log('🔔 [BGE-NOTIFICATIONS] Inicializando sistema de notificaciones push');

        if (!this.isSupported) {
            console.warn('⚠️ [BGE-NOTIFICATIONS] Push notifications no soportadas en este navegador');
            this.showFallbackMessage();
            return;
        }

        try {
            // Registrar Service Worker
            await this.registerServiceWorker();

            // Verificar estado de suscripción
            await this.checkSubscriptionStatus();

            // Cargar configuración del usuario
            await this.loadUserConfiguration();

            // Inicializar listeners
            this.initializeEventListeners();

            // Mostrar prompt de permisos si es necesario
            if (this.config.showPermissionPrompt && !this.isSubscribed) {
                await this.showPermissionPrompt();
            }

            // Sincronizar notificaciones pendientes
            await this.syncPendingNotifications();

            console.log('✅ [BGE-NOTIFICATIONS] Sistema inicializado correctamente');

        } catch (error) {
            console.error('❌ [BGE-NOTIFICATIONS] Error inicializando sistema:', error);
            this.handleInitializationError(error);
        }
    }

    // =====================================================
    // SERVICE WORKER Y SUSCRIPCIÓN
    // =====================================================

    async registerServiceWorker() {
        try {
            this.swRegistration = await navigator.serviceWorker.register('/sw-notifications.js', {
                scope: '/'
            });

            console.log('📄 [BGE-NOTIFICATIONS] Service Worker registrado:', this.swRegistration.scope);

            // Escuchar actualizaciones del SW
            this.swRegistration.addEventListener('updatefound', () => {
                console.log('🔄 [BGE-NOTIFICATIONS] Actualización de Service Worker encontrada');
            });

            // Verificar si hay un SW esperando activación
            if (this.swRegistration.waiting) {
                this.showUpdateAvailable();
            }

        } catch (error) {
            console.error('❌ [BGE-NOTIFICATIONS] Error registrando Service Worker:', error);
            throw error;
        }
    }

    async checkSubscriptionStatus() {
        if (!this.swRegistration) return;

        try {
            this.subscriptionData = await this.swRegistration.pushManager.getSubscription();
            this.isSubscribed = !!this.subscriptionData;

            console.log(`📋 [BGE-NOTIFICATIONS] Estado de suscripción: ${this.isSubscribed ? 'Suscrito' : 'No suscrito'}`);

            if (this.isSubscribed) {
                await this.validateSubscription();
            }

        } catch (error) {
            console.error('❌ [BGE-NOTIFICATIONS] Error verificando suscripción:', error);
        }
    }

    async validateSubscription() {
        try {
            const response = await fetch(`${this.apiBase}/validate-subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    subscription: this.subscriptionData.toJSON(),
                    userAgent: navigator.userAgent,
                    timestamp: Date.now()
                })
            });

            const result = await response.json();

            if (!result.success) {
                console.warn('⚠️ [BGE-NOTIFICATIONS] Suscripción no válida, renovando...');
                await this.renewSubscription();
            }

        } catch (error) {
            console.error('❌ [BGE-NOTIFICATIONS] Error validando suscripción:', error);
        }
    }

    async subscribe() {
        if (!this.swRegistration) {
            throw new Error('Service Worker no registrado');
        }

        try {
            console.log('📝 [BGE-NOTIFICATIONS] Solicitando suscripción...');

            // Solicitar permisos
            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
                throw new Error('Permisos de notificación denegados');
            }

            // Obtener clave pública VAPID del servidor
            const vapidKey = await this.getVAPIDKey();

            // Crear suscripción
            this.subscriptionData = await this.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(vapidKey)
            });

            // Enviar suscripción al servidor
            await this.sendSubscriptionToServer();

            this.isSubscribed = true;
            console.log('✅ [BGE-NOTIFICATIONS] Suscripción exitosa');

            // Mostrar notificación de bienvenida
            await this.showWelcomeNotification();

        } catch (error) {
            console.error('❌ [BGE-NOTIFICATIONS] Error en suscripción:', error);
            this.handleSubscriptionError(error);
            throw error;
        }
    }

    async unsubscribe() {
        if (!this.subscriptionData) return;

        try {
            console.log('🗑️ [BGE-NOTIFICATIONS] Cancelando suscripción...');

            // Cancelar en el servidor
            await fetch(`${this.apiBase}/unsubscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    subscription: this.subscriptionData.toJSON()
                })
            });

            // Cancelar en el navegador
            await this.subscriptionData.unsubscribe();

            this.subscriptionData = null;
            this.isSubscribed = false;

            console.log('✅ [BGE-NOTIFICATIONS] Suscripción cancelada');

        } catch (error) {
            console.error('❌ [BGE-NOTIFICATIONS] Error cancelando suscripción:', error);
            throw error;
        }
    }

    async renewSubscription() {
        try {
            if (this.subscriptionData) {
                await this.unsubscribe();
            }
            await this.subscribe();
        } catch (error) {
            console.error('❌ [BGE-NOTIFICATIONS] Error renovando suscripción:', error);
        }
    }

    // =====================================================
    // ENVÍO DE NOTIFICACIONES
    // =====================================================

    async sendNotification(notification) {
        try {
            console.log('📤 [BGE-NOTIFICATIONS] Enviando notificación:', notification.title);

            const notificationData = this.prepareNotificationData(notification);

            const response = await fetch(`${this.apiBase}/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(notificationData)
            });

            const result = await response.json();

            if (result.success) {
                this.stats.sent++;
                this.addToHistory(notificationData);
                console.log('✅ [BGE-NOTIFICATIONS] Notificación enviada exitosamente');
                return result;
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error('❌ [BGE-NOTIFICATIONS] Error enviando notificación:', error);

            // Agregar a cola offline si está habilitada
            if (this.config.offlineQueue) {
                this.offlineQueue.push(notification);
                console.log('💾 [BGE-NOTIFICATIONS] Notificación agregada a cola offline');
            }

            this.stats.failed++;
            throw error;
        }
    }

    async sendBulkNotifications(notifications, options = {}) {
        const { batchSize = 10, delay = 100 } = options;

        console.log(`📦 [BGE-NOTIFICATIONS] Enviando ${notifications.length} notificaciones en lotes`);

        const results = [];

        for (let i = 0; i < notifications.length; i += batchSize) {
            const batch = notifications.slice(i, i + batchSize);

            try {
                const batchPromises = batch.map(notification =>
                    this.sendNotification(notification).catch(error => ({ error, notification }))
                );

                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);

                // Delay entre lotes para no sobrecargar
                if (i + batchSize < notifications.length) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

            } catch (error) {
                console.error(`❌ [BGE-NOTIFICATIONS] Error en lote ${Math.floor(i / batchSize)}:`, error);
            }
        }

        const successful = results.filter(r => !r.error).length;
        const failed = results.filter(r => r.error).length;

        console.log(`📊 [BGE-NOTIFICATIONS] Lote completado: ${successful} exitosas, ${failed} fallidas`);

        return { successful, failed, results };
    }

    prepareNotificationData(notification) {
        const category = notification.category || 'system';
        const config = this.config.categories[category] || this.config.categories.system;

        return {
            title: notification.title,
            body: notification.body || '',
            icon: notification.icon || '/images/icons/notification-icon.png',
            badge: notification.badge || '/images/icons/notification-badge.png',
            image: notification.image,
            data: {
                ...notification.data,
                category,
                timestamp: Date.now(),
                id: this.generateNotificationId()
            },
            actions: notification.actions || [],
            tag: notification.tag || `bge-${category}-${Date.now()}`,
            requireInteraction: config.priority === 'urgent',
            silent: config.priority === 'low',
            vibrate: config.vibrate,
            sound: config.sound,
            dir: 'auto',
            lang: 'es',
            renotify: false,
            sticky: config.priority === 'urgent'
        };
    }

    // =====================================================
    // NOTIFICACIONES ESPECÍFICAS BGE
    // =====================================================

    async sendAcademicNotification(type, data) {
        const notifications = {
            new_grade: {
                title: '📊 Nueva Calificación Disponible',
                body: `Tu calificación para ${data.subject} ha sido publicada`,
                category: 'academic',
                data: { type: 'grade', subjectId: data.subjectId, grade: data.grade }
            },
            assignment_due: {
                title: '📝 Tarea Por Vencer',
                body: `La tarea "${data.title}" vence ${data.dueDate}`,
                category: 'academic',
                data: { type: 'assignment', assignmentId: data.id, dueDate: data.dueDate }
            },
            class_cancelled: {
                title: '🚫 Clase Cancelada',
                body: `La clase de ${data.subject} ha sido cancelada`,
                category: 'academic',
                data: { type: 'class_cancel', subjectId: data.subjectId }
            },
            new_material: {
                title: '📚 Nuevo Material Disponible',
                body: `Nuevo material subido para ${data.subject}`,
                category: 'academic',
                data: { type: 'material', subjectId: data.subjectId, materialId: data.materialId }
            }
        };

        const notification = notifications[type];
        if (!notification) {
            throw new Error(`Tipo de notificación académica no válido: ${type}`);
        }

        return await this.sendNotification(notification);
    }

    async sendAdministrativeNotification(type, data) {
        const notifications = {
            payment_reminder: {
                title: '💰 Recordatorio de Pago',
                body: `Tienes un pago pendiente de $${data.amount}`,
                category: 'administrative',
                data: { type: 'payment', amount: data.amount, dueDate: data.dueDate }
            },
            document_ready: {
                title: '📄 Documento Listo',
                body: `Tu ${data.documentType} está listo para recoger`,
                category: 'administrative',
                data: { type: 'document', documentId: data.id, documentType: data.documentType }
            },
            meeting_reminder: {
                title: '👥 Recordatorio de Cita',
                body: `Tienes una cita programada para ${data.date}`,
                category: 'administrative',
                data: { type: 'meeting', meetingId: data.id, date: data.date }
            },
            system_maintenance: {
                title: '🔧 Mantenimiento Programado',
                body: `El sistema estará en mantenimiento ${data.schedule}`,
                category: 'system',
                data: { type: 'maintenance', start: data.start, end: data.end }
            }
        };

        const notification = notifications[type];
        if (!notification) {
            throw new Error(`Tipo de notificación administrativa no válido: ${type}`);
        }

        return await this.sendNotification(notification);
    }

    async sendEmergencyNotification(data) {
        const notification = {
            title: '🚨 ALERTA DE EMERGENCIA',
            body: data.message,
            category: 'emergency',
            tag: 'emergency-alert',
            requireInteraction: true,
            actions: [
                {
                    action: 'acknowledge',
                    title: 'Entendido',
                    icon: '/images/icons/check.png'
                },
                {
                    action: 'more_info',
                    title: 'Más información',
                    icon: '/images/icons/info.png'
                }
            ],
            data: {
                type: 'emergency',
                emergencyId: data.id,
                level: data.level,
                instructions: data.instructions
            }
        };

        return await this.sendNotification(notification);
    }

    async sendWelcomeNotification() {
        const notification = {
            title: '🎓 ¡Bienvenido a BGE!',
            body: 'Las notificaciones están activadas. Mantente al día con todo lo académico.',
            category: 'system',
            icon: '/images/bge-logo.png',
            data: { type: 'welcome', timestamp: Date.now() }
        };

        return await this.sendNotification(notification);
    }

    // =====================================================
    // GESTIÓN DE NOTIFICACIONES PROGRAMADAS
    // =====================================================

    async scheduleNotification(notification, scheduleTime) {
        const delay = scheduleTime - Date.now();

        if (delay <= 0) {
            return await this.sendNotification(notification);
        }

        const scheduledId = this.generateNotificationId();

        // Programar notificación
        const timeoutId = setTimeout(async () => {
            try {
                await this.sendNotification(notification);
                this.removeScheduledNotification(scheduledId);
            } catch (error) {
                console.error('❌ [BGE-NOTIFICATIONS] Error en notificación programada:', error);
            }
        }, delay);

        // Guardar referencia para poder cancelar
        this.saveScheduledNotification(scheduledId, {
            notification,
            scheduleTime,
            timeoutId
        });

        console.log(`⏰ [BGE-NOTIFICATIONS] Notificación programada para ${new Date(scheduleTime).toLocaleString()}`);

        return { scheduledId, scheduleTime };
    }

    async cancelScheduledNotification(scheduledId) {
        const scheduled = this.getScheduledNotification(scheduledId);

        if (scheduled) {
            clearTimeout(scheduled.timeoutId);
            this.removeScheduledNotification(scheduledId);
            console.log(`❌ [BGE-NOTIFICATIONS] Notificación programada cancelada: ${scheduledId}`);
            return true;
        }

        return false;
    }

    async getScheduledNotifications() {
        const stored = localStorage.getItem('bge_scheduled_notifications');
        return stored ? JSON.parse(stored) : {};
    }

    // =====================================================
    // CONFIGURACIÓN Y PREFERENCIAS
    // =====================================================

    async loadUserConfiguration() {
        try {
            const response = await fetch(`${this.apiBase}/config`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (response.ok) {
                const config = await response.json();
                Object.assign(this.config, config.data);
                console.log('⚙️ [BGE-NOTIFICATIONS] Configuración de usuario cargada');
            }
        } catch (error) {
            console.warn('⚠️ [BGE-NOTIFICATIONS] Error cargando configuración, usando defaults');
        }
    }

    async updateUserConfiguration(newConfig) {
        try {
            Object.assign(this.config, newConfig);

            const response = await fetch(`${this.apiBase}/config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(newConfig)
            });

            if (response.ok) {
                console.log('✅ [BGE-NOTIFICATIONS] Configuración actualizada');
                return true;
            }
        } catch (error) {
            console.error('❌ [BGE-NOTIFICATIONS] Error actualizando configuración:', error);
        }
        return false;
    }

    // =====================================================
    // INTERFAZ DE USUARIO
    // =====================================================

    showPermissionPrompt() {
        return new Promise((resolve) => {
            const promptHTML = `
                <div id="notification-permission-prompt" class="notification-prompt">
                    <div class="prompt-content">
                        <div class="prompt-icon">🔔</div>
                        <h3>Activar Notificaciones</h3>
                        <p>Mantente informado sobre calificaciones, tareas, eventos y avisos importantes.</p>
                        <div class="prompt-actions">
                            <button id="enable-notifications" class="btn-primary">Activar</button>
                            <button id="skip-notifications" class="btn-secondary">Omitir</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', promptHTML);

            const enableBtn = document.getElementById('enable-notifications');
            const skipBtn = document.getElementById('skip-notifications');
            const prompt = document.getElementById('notification-permission-prompt');

            enableBtn.addEventListener('click', async () => {
                try {
                    await this.subscribe();
                    prompt.remove();
                    resolve(true);
                } catch (error) {
                    this.showError('Error activando notificaciones: ' + error.message);
                    resolve(false);
                }
            });

            skipBtn.addEventListener('click', () => {
                prompt.remove();
                resolve(false);
            });

            // Auto-cerrar después de 30 segundos
            setTimeout(() => {
                if (document.getElementById('notification-permission-prompt')) {
                    prompt.remove();
                    resolve(false);
                }
            }, 30000);
        });
    }

    createNotificationSettingsPanel() {
        const panelHTML = `
            <div id="notification-settings-panel" class="settings-panel">
                <div class="panel-header">
                    <h3>🔔 Configuración de Notificaciones</h3>
                    <button id="close-settings" class="close-btn">&times;</button>
                </div>
                <div class="panel-content">
                    <div class="setting-group">
                        <label class="setting-label">
                            <input type="checkbox" id="notifications-enabled" ${this.config.enabled ? 'checked' : ''}>
                            Activar notificaciones
                        </label>
                    </div>

                    <div class="setting-group">
                        <h4>Categorías</h4>
                        <div class="category-settings">
                            <label class="setting-label">
                                <input type="checkbox" data-category="academic" checked>
                                📚 Académicas (calificaciones, tareas)
                            </label>
                            <label class="setting-label">
                                <input type="checkbox" data-category="administrative" checked>
                                📋 Administrativas (pagos, documentos)
                            </label>
                            <label class="setting-label">
                                <input type="checkbox" data-category="social" checked>
                                👥 Sociales (eventos, comunidad)
                            </label>
                            <label class="setting-label">
                                <input type="checkbox" data-category="emergency" checked>
                                🚨 Emergencias (siempre activadas)
                            </label>
                        </div>
                    </div>

                    <div class="setting-group">
                        <h4>Horarios</h4>
                        <div class="time-settings">
                            <label>Desde: <input type="time" id="quiet-hours-start" value="22:00"></label>
                            <label>Hasta: <input type="time" id="quiet-hours-end" value="07:00"></label>
                        </div>
                    </div>

                    <div class="setting-actions">
                        <button id="save-settings" class="btn-primary">Guardar</button>
                        <button id="test-notification" class="btn-secondary">Probar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', panelHTML);
        this.initializeSettingsPanel();
    }

    initializeSettingsPanel() {
        const panel = document.getElementById('notification-settings-panel');

        // Cerrar panel
        document.getElementById('close-settings').addEventListener('click', () => {
            panel.remove();
        });

        // Guardar configuración
        document.getElementById('save-settings').addEventListener('click', async () => {
            const newConfig = this.getConfigFromPanel();
            const saved = await this.updateUserConfiguration(newConfig);

            if (saved) {
                this.showSuccess('Configuración guardada');
                panel.remove();
            } else {
                this.showError('Error guardando configuración');
            }
        });

        // Probar notificación
        document.getElementById('test-notification').addEventListener('click', () => {
            this.sendTestNotification();
        });
    }

    async sendTestNotification() {
        const testNotification = {
            title: '🧪 Notificación de Prueba',
            body: 'Si ves esto, las notificaciones están funcionando correctamente',
            category: 'system',
            data: { type: 'test', timestamp: Date.now() }
        };

        try {
            await this.sendNotification(testNotification);
            console.log('✅ [BGE-NOTIFICATIONS] Notificación de prueba enviada');
        } catch (error) {
            this.showError('Error enviando notificación de prueba: ' + error.message);
        }
    }

    // =====================================================
    // GESTIÓN DE EVENTOS
    // =====================================================

    initializeEventListeners() {
        // Listener para mensajes del Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                this.handleServiceWorkerMessage(event);
            });
        }

        // Listener para cambios de conexión
        window.addEventListener('online', () => {
            console.log('🌐 [BGE-NOTIFICATIONS] Conexión restaurada');
            this.syncOfflineQueue();
        });

        window.addEventListener('offline', () => {
            console.log('📡 [BGE-NOTIFICATIONS] Sin conexión - modo offline activado');
        });

        // Listener para visibilidad de la página
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.syncPendingNotifications();
            }
        });
    }

    handleServiceWorkerMessage(event) {
        const { type, data } = event.data;

        switch (type) {
            case 'notification-clicked':
                this.handleNotificationClick(data);
                break;
            case 'notification-closed':
                this.handleNotificationClose(data);
                break;
            case 'notification-delivered':
                this.stats.delivered++;
                break;
            default:
                console.log('📨 [BGE-NOTIFICATIONS] Mensaje del SW:', type, data);
        }
    }

    handleNotificationClick(data) {
        this.stats.clicked++;
        console.log('👆 [BGE-NOTIFICATIONS] Notificación clickeada:', data);

        // Manejar acciones específicas basadas en el tipo
        switch (data.type) {
            case 'grade':
                window.focus();
                window.location.href = `/calificaciones?subject=${data.subjectId}`;
                break;
            case 'assignment':
                window.focus();
                window.location.href = `/assignments/${data.assignmentId}`;
                break;
            case 'meeting':
                window.focus();
                window.location.href = `/citas?meeting=${data.meetingId}`;
                break;
            case 'emergency':
                this.handleEmergencyClick(data);
                break;
            default:
                window.focus();
        }
    }

    handleNotificationClose(data) {
        this.stats.dismissed++;
        console.log('❌ [BGE-NOTIFICATIONS] Notificación cerrada:', data);
    }

    handleEmergencyClick(data) {
        // Abrir modal de emergencia con información detallada
        const modalHTML = `
            <div id="emergency-modal" class="emergency-modal">
                <div class="modal-content">
                    <h2>🚨 ALERTA DE EMERGENCIA</h2>
                    <p><strong>Nivel:</strong> ${data.level.toUpperCase()}</p>
                    <div class="emergency-instructions">
                        ${data.instructions || 'Mantente atento a las indicaciones oficiales.'}
                    </div>
                    <div class="modal-actions">
                        <button id="acknowledge-emergency" class="btn-primary">Entendido</button>
                        <button id="call-emergency" class="btn-danger">Llamar a Emergencias</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Manejar acciones del modal
        document.getElementById('acknowledge-emergency').addEventListener('click', () => {
            document.getElementById('emergency-modal').remove();
            this.acknowledgeEmergency(data.emergencyId);
        });

        document.getElementById('call-emergency').addEventListener('click', () => {
            window.open('tel:911', '_self');
        });

        window.focus();
    }

    // =====================================================
    // SINCRONIZACIÓN Y ESTADO
    // =====================================================

    async syncOfflineQueue() {
        if (this.offlineQueue.length === 0) return;

        console.log(`🔄 [BGE-NOTIFICATIONS] Sincronizando ${this.offlineQueue.length} notificaciones offline`);

        const queueToProcess = [...this.offlineQueue];
        this.offlineQueue = [];

        try {
            const results = await this.sendBulkNotifications(queueToProcess);

            // Re-encolar las que fallaron
            const failed = results.results.filter(r => r.error).map(r => r.notification);
            this.offlineQueue.push(...failed);

            console.log(`✅ [BGE-NOTIFICATIONS] Sincronización completada: ${results.successful} exitosas`);

        } catch (error) {
            // Restaurar cola si falla completamente
            this.offlineQueue = queueToProcess.concat(this.offlineQueue);
            console.error('❌ [BGE-NOTIFICATIONS] Error en sincronización offline:', error);
        }
    }

    async syncPendingNotifications() {
        try {
            const response = await fetch(`${this.apiBase}/pending`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (response.ok) {
                const result = await response.json();

                if (result.data.length > 0) {
                    console.log(`📥 [BGE-NOTIFICATIONS] ${result.data.length} notificaciones pendientes encontradas`);

                    // Mostrar notificaciones pendientes
                    for (const notification of result.data) {
                        await this.showLocalNotification(notification);
                    }
                }
            }
        } catch (error) {
            console.error('❌ [BGE-NOTIFICATIONS] Error sincronizando pendientes:', error);
        }
    }

    async showLocalNotification(notificationData) {
        if (!this.isSupported || Notification.permission !== 'granted') return;

        try {
            const notification = new Notification(notificationData.title, {
                body: notificationData.body,
                icon: notificationData.icon,
                badge: notificationData.badge,
                image: notificationData.image,
                data: notificationData.data,
                tag: notificationData.tag,
                renotify: notificationData.renotify,
                requireInteraction: notificationData.requireInteraction,
                actions: notificationData.actions,
                silent: notificationData.silent,
                vibrate: notificationData.vibrate
            });

            notification.addEventListener('click', () => {
                this.handleNotificationClick(notificationData.data);
                notification.close();
            });

            notification.addEventListener('close', () => {
                this.handleNotificationClose(notificationData.data);
            });

            // Auto-cerrar después de 10 segundos si no requiere interacción
            if (!notificationData.requireInteraction) {
                setTimeout(() => {
                    if (notification) {
                        notification.close();
                    }
                }, 10000);
            }

        } catch (error) {
            console.error('❌ [BGE-NOTIFICATIONS] Error mostrando notificación local:', error);
        }
    }

    // =====================================================
    // UTILIDADES Y HELPERS
    // =====================================================

    async getVAPIDKey() {
        try {
            const response = await fetch(`${this.apiBase}/vapid-key`);
            const result = await response.json();
            return result.data.publicKey;
        } catch (error) {
            console.error('❌ [BGE-NOTIFICATIONS] Error obteniendo clave VAPID:', error);
            throw error;
        }
    }

    async sendSubscriptionToServer() {
        const response = await fetch(`${this.apiBase}/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify({
                subscription: this.subscriptionData.toJSON(),
                userAgent: navigator.userAgent,
                timestamp: Date.now(),
                preferences: this.config.categories
            })
        });

        if (!response.ok) {
            throw new Error('Error enviando suscripción al servidor');
        }

        return await response.json();
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    generateNotificationId() {
        return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    addToHistory(notification) {
        this.notificationHistory.unshift({
            ...notification,
            timestamp: Date.now()
        });

        // Mantener tamaño máximo del historial
        if (this.notificationHistory.length > this.maxHistorySize) {
            this.notificationHistory = this.notificationHistory.slice(0, this.maxHistorySize);
        }

        // Guardar en localStorage
        localStorage.setItem('bge_notification_history', JSON.stringify(this.notificationHistory));
    }

    getNotificationHistory() {
        return [...this.notificationHistory];
    }

    clearNotificationHistory() {
        this.notificationHistory = [];
        localStorage.removeItem('bge_notification_history');
    }

    getAuthToken() {
        return localStorage.getItem('bge_auth_token') || '';
    }

    saveScheduledNotification(id, data) {
        const scheduled = JSON.parse(localStorage.getItem('bge_scheduled_notifications') || '{}');
        scheduled[id] = { ...data, timeoutId: null }; // No guardamos el timeout
        localStorage.setItem('bge_scheduled_notifications', JSON.stringify(scheduled));
    }

    getScheduledNotification(id) {
        const scheduled = JSON.parse(localStorage.getItem('bge_scheduled_notifications') || '{}');
        return scheduled[id];
    }

    removeScheduledNotification(id) {
        const scheduled = JSON.parse(localStorage.getItem('bge_scheduled_notifications') || '{}');
        delete scheduled[id];
        localStorage.setItem('bge_scheduled_notifications', JSON.stringify(scheduled));
    }

    getConfigFromPanel() {
        const enabled = document.getElementById('notifications-enabled').checked;
        const categories = {};

        document.querySelectorAll('[data-category]').forEach(checkbox => {
            categories[checkbox.dataset.category] = checkbox.checked;
        });

        return {
            enabled,
            categories,
            quietHours: {
                start: document.getElementById('quiet-hours-start').value,
                end: document.getElementById('quiet-hours-end').value
            }
        };
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    showFallbackMessage() {
        console.warn('📱 [BGE-NOTIFICATIONS] Usando modo fallback - notificaciones no soportadas');

        // Mostrar mensaje informativo al usuario
        const fallbackHTML = `
            <div id="notification-fallback" class="notification-fallback">
                <p>ℹ️ Tu navegador no soporta notificaciones push. Revisa periódicamente el sitio para estar al día.</p>
                <button onclick="this.parentElement.remove()">Entendido</button>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', fallbackHTML);
    }

    showUpdateAvailable() {
        const updateHTML = `
            <div id="sw-update-prompt" class="update-prompt">
                <p>🔄 Hay una actualización disponible</p>
                <button id="update-sw">Actualizar</button>
                <button id="dismiss-update">Más tarde</button>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', updateHTML);

        document.getElementById('update-sw').addEventListener('click', () => {
            if (this.swRegistration.waiting) {
                this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            window.location.reload();
        });

        document.getElementById('dismiss-update').addEventListener('click', () => {
            document.getElementById('sw-update-prompt').remove();
        });
    }

    handleInitializationError(error) {
        console.error('💥 [BGE-NOTIFICATIONS] Error crítico en inicialización:', error);
        this.showError('Error inicializando notificaciones. Algunas funciones pueden no estar disponibles.');
    }

    handleSubscriptionError(error) {
        if (error.message.includes('denied')) {
            this.showError('Permisos de notificación denegados. Puedes activarlos desde la configuración del navegador.');
        } else if (error.message.includes('not supported')) {
            this.showError('Las notificaciones push no están soportadas en este navegador.');
        } else {
            this.showError('Error configurando notificaciones. Inténtalo de nuevo.');
        }
    }

    async acknowledgeEmergency(emergencyId) {
        try {
            await fetch(`${this.apiBase}/emergency/${emergencyId}/acknowledge`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            console.log('✅ [BGE-NOTIFICATIONS] Emergencia reconocida:', emergencyId);
        } catch (error) {
            console.error('❌ [BGE-NOTIFICATIONS] Error reconociendo emergencia:', error);
        }
    }

    // =====================================================
    // API PÚBLICA
    // =====================================================

    getStats() {
        return { ...this.stats };
    }

    isEnabled() {
        return this.config.enabled && this.isSubscribed;
    }

    getConfiguration() {
        return { ...this.config };
    }

    openSettings() {
        if (!document.getElementById('notification-settings-panel')) {
            this.createNotificationSettingsPanel();
        }
    }

    async requestPermission() {
        if (!this.isSubscribed) {
            return await this.subscribe();
        }
        return true;
    }

    // Método para uso externo - enviar notificación personalizada
    async notify(title, options = {}) {
        const notification = {
            title,
            body: options.body || '',
            category: options.category || 'system',
            icon: options.icon,
            data: options.data || {}
        };

        return await this.sendNotification(notification);
    }
}

// =====================================================
// INICIALIZACIÓN GLOBAL
// =====================================================

// Auto-inicializar el sistema cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    if (!window.bgeNotifications) {
        window.bgeNotifications = new BGEPushNotificationSystem();

        // Hacer disponible globalmente
        window.notify = (title, options) => window.bgeNotifications.notify(title, options);

        console.log('🔔 [BGE-NOTIFICATIONS] Sistema disponible globalmente');
    }
});

export default BGEPushNotificationSystem;