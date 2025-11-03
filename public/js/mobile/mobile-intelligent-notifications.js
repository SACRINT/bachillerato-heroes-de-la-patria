/**
 * 🔔 BGE Mobile Intelligent Notifications
 * Sistema de Notificaciones Push Inteligentes
 *
 * Implementa notificaciones avanzadas y personalizadas:
 * - Notificaciones push nativas (iOS/Android)
 * - Notificaciones web progresivas (PWA)
 * - Sistema de personalización por usuario
 * - Programación inteligente basada en comportamiento
 * - Categorización y priorización automática
 * - Analytics de engagement y efectividad
 * - Integración con calendario y eventos
 * - Modo no molestar y horarios personalizados
 *
 * @version 1.0.0
 * @since Phase E - Mobile Native Implementation
 */

class BGEMobileIntelligentNotifications {
    constructor(mobileArchitecture) {
        this.mobileArch = mobileArchitecture;

        this.notificationConfig = {
            categories: {
                ACADEMIC: {
                    id: 'academic',
                    name: 'Académico',
                    priority: 'HIGH',
                    sound: 'academic_bell.mp3',
                    vibration: [200, 100, 200],
                    led: '#FF6B6B',
                    actions: [
                        { id: 'view', title: 'Ver detalles', foreground: true },
                        { id: 'remind', title: 'Recordar después', foreground: false }
                    ]
                },
                ASSIGNMENT: {
                    id: 'assignment',
                    name: 'Tareas',
                    priority: 'HIGH',
                    sound: 'assignment_alert.mp3',
                    vibration: [300, 200, 300],
                    led: '#4ECDC4',
                    actions: [
                        { id: 'open', title: 'Abrir tarea', foreground: true },
                        { id: 'mark_done', title: 'Marcar como hecha', foreground: false }
                    ]
                },
                EVALUATION: {
                    id: 'evaluation',
                    name: 'Evaluaciones',
                    priority: 'CRITICAL',
                    sound: 'evaluation_urgent.mp3',
                    vibration: [500, 300, 500, 300, 500],
                    led: '#FF9F43',
                    actions: [
                        { id: 'prepare', title: 'Preparar evaluación', foreground: true },
                        { id: 'schedule', title: 'Programar estudio', foreground: true }
                    ]
                },
                SOCIAL: {
                    id: 'social',
                    name: 'Social',
                    priority: 'MEDIUM',
                    sound: 'social_ping.mp3',
                    vibration: [100, 50, 100],
                    led: '#A55EEA',
                    actions: [
                        { id: 'reply', title: 'Responder', foreground: true },
                        { id: 'mute', title: 'Silenciar', foreground: false }
                    ]
                },
                ANNOUNCEMENT: {
                    id: 'announcement',
                    name: 'Avisos',
                    priority: 'MEDIUM',
                    sound: 'announcement.mp3',
                    vibration: [200, 100, 200, 100, 200],
                    led: '#26D0CE',
                    actions: [
                        { id: 'read', title: 'Leer completo', foreground: true },
                        { id: 'save', title: 'Guardar', foreground: false }
                    ]
                },
                CALENDAR: {
                    id: 'calendar',
                    name: 'Calendario',
                    priority: 'MEDIUM',
                    sound: 'calendar_reminder.mp3',
                    vibration: [150, 100, 150],
                    led: '#FD79A8',
                    actions: [
                        { id: 'join', title: 'Unirse', foreground: true },
                        { id: 'reschedule', title: 'Reprogramar', foreground: true }
                    ]
                },
                SYSTEM: {
                    id: 'system',
                    name: 'Sistema',
                    priority: 'LOW',
                    sound: 'system_beep.mp3',
                    vibration: [100],
                    led: '#636e72',
                    actions: [
                        { id: 'settings', title: 'Configurar', foreground: true }
                    ]
                }
            },
            delivery: {
                immediate: 0,
                scheduled: 'custom',
                smart: 'ai-optimized'
            },
            personalization: {
                learningPeriod: 14, // días para aprender patrones
                adaptiveScheduling: true,
                contextAware: true,
                behaviorAnalysis: true
            },
            privacy: {
                dataMinimization: true,
                localProcessing: true,
                encryptedStorage: true,
                optOutAnytime: true
            }
        };

        this.userPreferences = new Map();
        this.notificationHistory = [];
        this.scheduledNotifications = new Map();
        this.behaviorAnalytics = new Map();
        this.engagementMetrics = {
            sent: 0,
            delivered: 0,
            opened: 0,
            acted: 0,
            dismissed: 0
        };

        this.intelligentScheduler = null;
        this.notificationPermissions = 'default';

        this.logger = window.BGELogger || console;
        this.initializeNotificationSystem();
    }

    async initializeNotificationSystem() {
        try {
            this.logger.info('IntelligentNotifications', 'Inicializando sistema de notificaciones inteligentes');

            // Verificar y solicitar permisos
            await this.requestNotificationPermissions();

            // Inicializar almacenamiento de preferencias
            await this.loadUserPreferences();

            // Configurar canales de notificación (Android)
            await this.setupNotificationChannels();

            // Inicializar programador inteligente
            this.initializeIntelligentScheduler();

            // Configurar handlers de eventos
            this.setupNotificationHandlers();

            // Cargar historial y métricas
            await this.loadNotificationHistory();

            // Inicializar analytics de comportamiento
            this.initializeBehaviorAnalytics();

            // Configurar push notifications
            await this.setupPushNotifications();

            this.logger.info('IntelligentNotifications', 'Sistema de notificaciones inicializado correctamente');

        } catch (error) {
            this.logger.error('IntelligentNotifications', 'Error al inicializar notificaciones', error);
            throw error;
        }
    }

    async requestNotificationPermissions() {
        // Solicitar permisos según la plataforma
        if (this.mobileArch.environment.isNative) {
            // Permisos nativos
            try {
                const result = await this.mobileArch.callNativeMethod('Notifications.requestPermissions', {
                    alert: true,
                    badge: true,
                    sound: true,
                    critical: true // Para notificaciones críticas
                });

                this.notificationPermissions = result.granted ? 'granted' : 'denied';
                this.logger.info('IntelligentNotifications', `Permisos nativos: ${this.notificationPermissions}`);

            } catch (error) {
                this.logger.error('IntelligentNotifications', 'Error al solicitar permisos nativos', error);
                this.notificationPermissions = 'denied';
            }
        } else {
            // Permisos web
            if ('Notification' in window) {
                if (Notification.permission === 'default') {
                    const permission = await Notification.requestPermission();
                    this.notificationPermissions = permission;
                } else {
                    this.notificationPermissions = Notification.permission;
                }

                this.logger.info('IntelligentNotifications', `Permisos web: ${this.notificationPermissions}`);
            } else {
                this.logger.warn('IntelligentNotifications', 'Notificaciones no soportadas en este navegador');
                this.notificationPermissions = 'denied';
            }
        }
    }

    async loadUserPreferences() {
        // Cargar preferencias de usuario desde almacenamiento seguro
        try {
            const savedPreferences = await this.mobileArch.secureStorage?.retrieve('notification_preferences');

            if (savedPreferences) {
                this.userPreferences.set('global', savedPreferences);
            } else {
                // Configurar preferencias por defecto
                const defaultPreferences = this.getDefaultPreferences();
                this.userPreferences.set('global', defaultPreferences);
                await this.saveUserPreferences();
            }

            this.logger.info('IntelligentNotifications', 'Preferencias de usuario cargadas');

        } catch (error) {
            this.logger.error('IntelligentNotifications', 'Error al cargar preferencias', error);
            // Usar preferencias por defecto
            this.userPreferences.set('global', this.getDefaultPreferences());
        }
    }

    getDefaultPreferences() {
        return {
            enabled: true,
            categories: {
                academic: { enabled: true, priority: 'HIGH', quiet_hours: false },
                assignment: { enabled: true, priority: 'HIGH', quiet_hours: false },
                evaluation: { enabled: true, priority: 'CRITICAL', quiet_hours: false },
                social: { enabled: true, priority: 'MEDIUM', quiet_hours: true },
                announcement: { enabled: true, priority: 'MEDIUM', quiet_hours: true },
                calendar: { enabled: true, priority: 'MEDIUM', quiet_hours: false },
                system: { enabled: false, priority: 'LOW', quiet_hours: true }
            },
            quietHours: {
                enabled: true,
                start: '22:00',
                end: '07:00',
                weekends: true
            },
            delivery: {
                immediate: ['evaluation', 'academic'],
                batched: ['social', 'announcement'],
                smart: true
            },
            personalization: {
                adaptiveScheduling: true,
                contextAware: true,
                learningEnabled: true
            },
            privacy: {
                shareAnalytics: false,
                localOnly: true
            }
        };
    }

    async setupNotificationChannels() {
        // Configurar canales de notificación (principalmente Android)
        if (this.mobileArch.environment.isNative && this.mobileArch.environment.platform.os === 'Android') {
            try {
                for (const [categoryId, category] of Object.entries(this.notificationConfig.categories)) {
                    await this.mobileArch.callNativeMethod('Notifications.createChannel', {
                        id: category.id,
                        name: category.name,
                        description: `Notificaciones de ${category.name.toLowerCase()}`,
                        importance: this.mapPriorityToImportance(category.priority),
                        sound: category.sound,
                        vibration: category.vibration,
                        lights: true,
                        lightColor: category.led
                    });
                }

                this.logger.info('IntelligentNotifications', 'Canales de notificación configurados');

            } catch (error) {
                this.logger.error('IntelligentNotifications', 'Error al configurar canales', error);
            }
        }
    }

    mapPriorityToImportance(priority) {
        const mapping = {
            'CRITICAL': 'HIGH',
            'HIGH': 'DEFAULT',
            'MEDIUM': 'LOW',
            'LOW': 'MIN'
        };
        return mapping[priority] || 'DEFAULT';
    }

    initializeIntelligentScheduler() {
        // Programador inteligente de notificaciones
        this.intelligentScheduler = {
            // Análisis de patrones de uso
            analyzeUserPatterns: () => {
                const preferences = this.userPreferences.get('global');
                const history = this.notificationHistory.slice(-100); // Últimas 100 notificaciones

                return {
                    activeHours: this.extractActiveHours(history),
                    responsiveCategories: this.getResponsiveCategories(history),
                    preferredDeliveryTimes: this.calculateOptimalTimes(history),
                    engagementScore: this.calculateEngagementScore(history)
                };
            },

            // Optimizar momento de entrega
            optimizeDeliveryTime: (notification, userPatterns) => {
                const preferences = this.userPreferences.get('global');

                // Verificar horarios de silencio
                if (this.isQuietHour(new Date(), preferences.quietHours)) {
                    return this.calculateNextOptimalTime(userPatterns);
                }

                // Verificar si el usuario está activo
                if (userPatterns.activeHours.includes(new Date().getHours())) {
                    return Date.now(); // Enviar inmediatamente
                }

                // Programar para próxima ventana activa
                return this.getNextActiveWindow(userPatterns.activeHours);
            },

            // Personalizar contenido
            personalizeContent: (notification, userPatterns) => {
                const personalizedNotification = { ...notification };

                // Ajustar tono según engagement
                if (userPatterns.engagementScore < 0.3) {
                    personalizedNotification.title = `¡Importante! ${notification.title}`;
                    personalizedNotification.priority = 'HIGH';
                }

                // Agregar contexto personal
                if (notification.category === 'assignment') {
                    const pending = this.getPendingAssignments();
                    if (pending.length > 1) {
                        personalizedNotification.body += ` (${pending.length - 1} más pendientes)`;
                    }
                }

                return personalizedNotification;
            }
        };

        this.logger.info('IntelligentNotifications', 'Programador inteligente inicializado');
    }

    setupNotificationHandlers() {
        // Configurar handlers para eventos de notificaciones
        if (this.mobileArch.environment.isNative) {
            // Handlers nativos
            document.addEventListener('notificationReceived', (event) => {
                this.handleNotificationReceived(event.detail);
            });

            document.addEventListener('notificationOpened', (event) => {
                this.handleNotificationOpened(event.detail);
            });

            document.addEventListener('notificationAction', (event) => {
                this.handleNotificationAction(event.detail);
            });

        } else {
            // Handlers web
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data.type === 'notification-interaction') {
                        this.handleNotificationInteraction(event.data);
                    }
                });
            }
        }

        this.logger.info('IntelligentNotifications', 'Handlers de notificaciones configurados');
    }

    async loadNotificationHistory() {
        // Cargar historial de notificaciones
        try {
            const savedHistory = await this.mobileArch.storage?.get('notification_history');
            if (savedHistory && Array.isArray(savedHistory)) {
                this.notificationHistory = savedHistory;
            }

            const savedMetrics = await this.mobileArch.storage?.get('engagement_metrics');
            if (savedMetrics) {
                this.engagementMetrics = { ...this.engagementMetrics, ...savedMetrics };
            }

            this.logger.info('IntelligentNotifications', `Historial cargado: ${this.notificationHistory.length} notificaciones`);

        } catch (error) {
            this.logger.error('IntelligentNotifications', 'Error al cargar historial', error);
        }
    }

    initializeBehaviorAnalytics() {
        // Analytics de comportamiento del usuario
        this.behaviorAnalytics = {
            trackInteraction: (notification, action, timestamp = Date.now()) => {
                const interaction = {
                    notificationId: notification.id,
                    category: notification.category,
                    action: action, // 'delivered', 'opened', 'dismissed', 'acted'
                    timestamp: timestamp,
                    responseTime: action === 'opened' ? timestamp - notification.deliveredAt : null
                };

                this.notificationHistory.push(interaction);

                // Mantener solo las últimas 1000 interacciones
                if (this.notificationHistory.length > 1000) {
                    this.notificationHistory.shift();
                }

                // Actualizar métricas
                this.updateEngagementMetrics(action);

                // Persistir datos
                this.persistAnalyticsData();
            },

            analyzePatterns: () => {
                const recent = this.notificationHistory.slice(-100);

                return {
                    responsePatterns: this.analyzeResponsePatterns(recent),
                    timePatterns: this.analyzeTimePatterns(recent),
                    categoryPreferences: this.analyzeCategoryPreferences(recent),
                    engagementTrends: this.analyzeEngagementTrends(recent)
                };
            }
        };

        this.logger.info('IntelligentNotifications', 'Analytics de comportamiento inicializados');
    }

    async setupPushNotifications() {
        // Configurar push notifications según la plataforma
        if (this.mobileArch.environment.isNative) {
            await this.setupNativePushNotifications();
        } else {
            await this.setupWebPushNotifications();
        }
    }

    async setupNativePushNotifications() {
        try {
            // Obtener token de dispositivo
            const deviceToken = await this.mobileArch.callNativeMethod('Notifications.getDeviceToken');

            if (deviceToken) {
                this.deviceToken = deviceToken;
                this.logger.info('IntelligentNotifications', 'Device token obtenido para push notifications');

                // Registrar token en servidor (simulado)
                await this.registerDeviceToken(deviceToken);
            }

        } catch (error) {
            this.logger.error('IntelligentNotifications', 'Error al configurar push notifications nativo', error);
        }
    }

    async setupWebPushNotifications() {
        try {
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                const registration = await navigator.serviceWorker.ready;

                // Verificar si ya tenemos suscripción
                let subscription = await registration.pushManager.getSubscription();

                if (!subscription) {
                    // Crear nueva suscripción
                    const applicationServerKey = this.getApplicationServerKey();

                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: applicationServerKey
                    });
                }

                if (subscription) {
                    this.pushSubscription = subscription;
                    this.logger.info('IntelligentNotifications', 'Suscripción web push configurada');

                    // Registrar suscripción en servidor
                    await this.registerPushSubscription(subscription);
                }
            }

        } catch (error) {
            this.logger.error('IntelligentNotifications', 'Error al configurar web push notifications', error);
        }
    }

    /**
     * Métodos principales de notificaciones
     */

    async sendNotification(notification) {
        try {
            // Validar permisos
            if (this.notificationPermissions !== 'granted') {
                throw new Error('Permisos de notificación no concedidos');
            }

            // Validar preferencias del usuario
            const preferences = this.userPreferences.get('global');
            if (!this.shouldSendNotification(notification, preferences)) {
                this.logger.debug('IntelligentNotifications', `Notificación filtrada por preferencias: ${notification.id}`);
                return false;
            }

            // Aplicar inteligencia para optimizar entrega
            const optimizedNotification = await this.applyIntelligentOptimizations(notification);

            // Enviar según el método de entrega
            if (optimizedNotification.deliveryTime <= Date.now()) {
                return await this.deliverImmediately(optimizedNotification);
            } else {
                return await this.scheduleNotification(optimizedNotification);
            }

        } catch (error) {
            this.logger.error('IntelligentNotifications', 'Error al enviar notificación', error);
            return false;
        }
    }

    async deliverImmediately(notification) {
        try {
            this.logger.info('IntelligentNotifications', `Enviando notificación inmediata: ${notification.id}`);

            let result;

            if (this.mobileArch.environment.isNative) {
                result = await this.sendNativeNotification(notification);
            } else {
                result = await this.sendWebNotification(notification);
            }

            if (result.success) {
                // Registrar entrega
                this.behaviorAnalytics.trackInteraction(notification, 'delivered');

                // Agregar a historial
                notification.deliveredAt = Date.now();
                notification.status = 'delivered';

                // Persistir
                await this.persistNotificationHistory();

                this.engagementMetrics.sent++;
                this.engagementMetrics.delivered++;
            }

            return result.success;

        } catch (error) {
            this.logger.error('IntelligentNotifications', 'Error al entregar notificación', error);
            return false;
        }
    }

    async sendNativeNotification(notification) {
        try {
            const category = this.notificationConfig.categories[notification.category];

            const nativeNotification = {
                id: notification.id,
                title: notification.title,
                body: notification.body,
                category: category.id,
                sound: category.sound,
                badge: notification.badge || 1,
                data: notification.data || {},
                actions: category.actions,
                priority: category.priority,
                vibration: category.vibration,
                lights: {
                    enabled: true,
                    color: category.led
                }
            };

            const result = await this.mobileArch.callNativeMethod('Notifications.send', nativeNotification);

            return {
                success: result.success,
                notificationId: result.notificationId
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async sendWebNotification(notification) {
        try {
            const category = this.notificationConfig.categories[notification.category];

            const webNotification = new Notification(notification.title, {
                body: notification.body,
                icon: notification.icon || '/images/notification-icon.png',
                badge: notification.badge || '/images/notification-badge.png',
                tag: notification.id,
                data: notification.data || {},
                actions: category.actions,
                vibrate: category.vibration,
                requireInteraction: category.priority === 'CRITICAL'
            });

            // Configurar event listeners
            webNotification.onclick = () => {
                this.handleNotificationOpened({
                    notificationId: notification.id,
                    action: 'default'
                });
            };

            webNotification.onclose = () => {
                this.handleNotificationDismissed(notification.id);
            };

            return {
                success: true,
                notificationId: notification.id
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async scheduleNotification(notification) {
        try {
            const deliveryTime = new Date(notification.deliveryTime);

            this.logger.info('IntelligentNotifications', `Programando notificación para: ${deliveryTime.toISOString()}`);

            // Almacenar notificación programada
            this.scheduledNotifications.set(notification.id, notification);

            if (this.mobileArch.environment.isNative) {
                // Programación nativa
                await this.mobileArch.callNativeMethod('Notifications.schedule', {
                    id: notification.id,
                    title: notification.title,
                    body: notification.body,
                    category: notification.category,
                    data: notification.data,
                    scheduledTime: notification.deliveryTime
                });
            } else {
                // Programación web usando setTimeout
                const delay = notification.deliveryTime - Date.now();

                if (delay > 0) {
                    setTimeout(() => {
                        this.deliverImmediately(notification);
                    }, delay);
                }
            }

            // Persistir notificaciones programadas
            await this.persistScheduledNotifications();

            return true;

        } catch (error) {
            this.logger.error('IntelligentNotifications', 'Error al programar notificación', error);
            return false;
        }
    }

    async applyIntelligentOptimizations(notification) {
        const optimized = { ...notification };

        // Generar ID único si no existe
        if (!optimized.id) {
            optimized.id = this.generateNotificationId();
        }

        // Analizar patrones del usuario
        const userPatterns = this.intelligentScheduler.analyzeUserPatterns();

        // Optimizar momento de entrega
        const preferences = this.userPreferences.get('global');
        if (preferences.delivery.smart && preferences.personalization.adaptiveScheduling) {
            optimized.deliveryTime = this.intelligentScheduler.optimizeDeliveryTime(optimized, userPatterns);
        } else {
            optimized.deliveryTime = Date.now(); // Entrega inmediata
        }

        // Personalizar contenido
        if (preferences.personalization.contextAware) {
            const personalizedNotification = this.intelligentScheduler.personalizeContent(optimized, userPatterns);
            Object.assign(optimized, personalizedNotification);
        }

        return optimized;
    }

    shouldSendNotification(notification, preferences) {
        // Verificar si está habilitado globalmente
        if (!preferences.enabled) {
            return false;
        }

        // Verificar configuración de categoría
        const categoryPref = preferences.categories[notification.category];
        if (!categoryPref || !categoryPref.enabled) {
            return false;
        }

        // Verificar horarios de silencio
        if (categoryPref.quiet_hours && this.isQuietHour(new Date(), preferences.quietHours)) {
            return false;
        }

        return true;
    }

    isQuietHour(date, quietHours) {
        if (!quietHours.enabled) {
            return false;
        }

        const hour = date.getHours();
        const minute = date.getMinutes();
        const currentTime = hour * 60 + minute;

        const [startHour, startMinute] = quietHours.start.split(':').map(Number);
        const [endHour, endMinute] = quietHours.end.split(':').map(Number);

        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;

        // Verificar fines de semana
        if (!quietHours.weekends && (date.getDay() === 0 || date.getDay() === 6)) {
            return false;
        }

        // Manejar horarios que cruzan medianoche
        if (startTime > endTime) {
            return currentTime >= startTime || currentTime <= endTime;
        } else {
            return currentTime >= startTime && currentTime <= endTime;
        }
    }

    /**
     * Handlers de eventos de notificaciones
     */

    handleNotificationReceived(data) {
        this.logger.debug('IntelligentNotifications', `Notificación recibida: ${data.notificationId}`);

        // Actualizar métricas
        this.engagementMetrics.delivered++;

        // Registrar interacción
        this.behaviorAnalytics.trackInteraction({
            id: data.notificationId,
            category: data.category
        }, 'delivered');
    }

    handleNotificationOpened(data) {
        this.logger.info('IntelligentNotifications', `Notificación abierta: ${data.notificationId}`);

        // Actualizar métricas
        this.engagementMetrics.opened++;

        // Registrar interacción
        this.behaviorAnalytics.trackInteraction({
            id: data.notificationId,
            category: data.category,
            deliveredAt: data.deliveredAt
        }, 'opened');

        // Navegar a contenido relevante
        this.navigateToNotificationContent(data);
    }

    handleNotificationAction(data) {
        this.logger.info('IntelligentNotifications', `Acción de notificación: ${data.action} en ${data.notificationId}`);

        // Actualizar métricas
        this.engagementMetrics.acted++;

        // Registrar interacción
        this.behaviorAnalytics.trackInteraction({
            id: data.notificationId,
            category: data.category
        }, 'acted');

        // Ejecutar acción específica
        this.executeNotificationAction(data);
    }

    handleNotificationDismissed(notificationId) {
        this.logger.debug('IntelligentNotifications', `Notificación descartada: ${notificationId}`);

        // Actualizar métricas
        this.engagementMetrics.dismissed++;

        // Registrar interacción
        this.behaviorAnalytics.trackInteraction({
            id: notificationId
        }, 'dismissed');
    }

    navigateToNotificationContent(data) {
        // Navegar al contenido relevante según la categoría
        const navigationMap = {
            academic: '/academic',
            assignment: '/assignments',
            evaluation: '/evaluations',
            social: '/messages',
            announcement: '/announcements',
            calendar: '/calendar',
            system: '/settings'
        };

        const route = navigationMap[data.category];
        if (route) {
            this.mobileArch.navigateTo(route, data.data);
        }
    }

    async executeNotificationAction(data) {
        switch (data.action) {
            case 'view':
                this.navigateToNotificationContent(data);
                break;

            case 'remind':
                await this.scheduleReminder(data.notificationId, 60 * 60 * 1000); // 1 hora
                break;

            case 'mark_done':
                await this.markAssignmentCompleted(data.data.assignmentId);
                break;

            case 'mute':
                await this.muteNotificationCategory(data.category, 24 * 60 * 60 * 1000); // 24 horas
                break;

            case 'settings':
                this.mobileArch.navigateTo('settings/notifications');
                break;

            default:
                this.logger.warn('IntelligentNotifications', `Acción no reconocida: ${data.action}`);
        }
    }

    /**
     * Métodos de análisis y personalización
     */

    extractActiveHours(history) {
        const hourCounts = new Array(24).fill(0);

        history.forEach(interaction => {
            if (interaction.action === 'opened') {
                const hour = new Date(interaction.timestamp).getHours();
                hourCounts[hour]++;
            }
        });

        // Retornar horas con actividad significativa (>10% del promedio)
        const average = hourCounts.reduce((sum, count) => sum + count, 0) / 24;
        const threshold = average * 0.1;

        return hourCounts
            .map((count, hour) => ({ hour, count }))
            .filter(item => item.count > threshold)
            .map(item => item.hour);
    }

    getResponsiveCategories(history) {
        const categoryEngagement = {};

        history.forEach(interaction => {
            if (!categoryEngagement[interaction.category]) {
                categoryEngagement[interaction.category] = { sent: 0, opened: 0 };
            }

            if (interaction.action === 'delivered') {
                categoryEngagement[interaction.category].sent++;
            } else if (interaction.action === 'opened') {
                categoryEngagement[interaction.category].opened++;
            }
        });

        // Calcular rates de engagement por categoría
        const engagement = {};
        Object.entries(categoryEngagement).forEach(([category, stats]) => {
            engagement[category] = stats.sent > 0 ? stats.opened / stats.sent : 0;
        });

        return engagement;
    }

    calculateOptimalTimes(history) {
        const responseTimes = history
            .filter(interaction => interaction.action === 'opened' && interaction.responseTime)
            .map(interaction => ({
                hour: new Date(interaction.timestamp).getHours(),
                responseTime: interaction.responseTime
            }));

        // Agrupar por hora y calcular tiempo de respuesta promedio
        const hourlyResponses = {};
        responseTimes.forEach(item => {
            if (!hourlyResponses[item.hour]) {
                hourlyResponses[item.hour] = [];
            }
            hourlyResponses[item.hour].push(item.responseTime);
        });

        const optimalTimes = [];
        Object.entries(hourlyResponses).forEach(([hour, times]) => {
            const avgResponse = times.reduce((sum, time) => sum + time, 0) / times.length;
            optimalTimes.push({ hour: parseInt(hour), avgResponse });
        });

        // Ordenar por mejor tiempo de respuesta
        return optimalTimes
            .sort((a, b) => a.avgResponse - b.avgResponse)
            .slice(0, 6) // Top 6 horas
            .map(item => item.hour);
    }

    calculateEngagementScore(history) {
        if (history.length === 0) return 0.5; // Score neutral

        const delivered = history.filter(i => i.action === 'delivered').length;
        const opened = history.filter(i => i.action === 'opened').length;
        const acted = history.filter(i => i.action === 'acted').length;

        if (delivered === 0) return 0.5;

        const openRate = opened / delivered;
        const actionRate = acted / delivered;

        // Score ponderado: 70% open rate, 30% action rate
        return (openRate * 0.7) + (actionRate * 0.3);
    }

    /**
     * API pública
     */

    // Métodos de envío convenientes
    async sendAcademicNotification(title, body, data = {}) {
        return await this.sendNotification({
            category: 'academic',
            title,
            body,
            data
        });
    }

    async sendAssignmentNotification(title, body, assignmentId, dueDate) {
        return await this.sendNotification({
            category: 'assignment',
            title,
            body,
            data: { assignmentId, dueDate }
        });
    }

    async sendEvaluationNotification(title, body, evaluationId, date) {
        return await this.sendNotification({
            category: 'evaluation',
            title,
            body,
            data: { evaluationId, date },
            priority: 'CRITICAL'
        });
    }

    async sendAnnouncementNotification(title, body, announcementId) {
        return await this.sendNotification({
            category: 'announcement',
            title,
            body,
            data: { announcementId }
        });
    }

    // Métodos de gestión
    async updateUserPreferences(newPreferences) {
        const current = this.userPreferences.get('global');
        const updated = { ...current, ...newPreferences };

        this.userPreferences.set('global', updated);
        await this.saveUserPreferences();

        this.logger.info('IntelligentNotifications', 'Preferencias de usuario actualizadas');
    }

    async saveUserPreferences() {
        try {
            const preferences = this.userPreferences.get('global');
            await this.mobileArch.secureStorage?.store('notification_preferences', preferences);
        } catch (error) {
            this.logger.error('IntelligentNotifications', 'Error al guardar preferencias', error);
        }
    }

    getNotificationMetrics() {
        return {
            engagement: this.engagementMetrics,
            totalNotifications: this.notificationHistory.length,
            scheduledCount: this.scheduledNotifications.size,
            permissions: this.notificationPermissions,
            patterns: this.behaviorAnalytics.analyzePatterns()
        };
    }

    async clearNotificationHistory() {
        this.notificationHistory = [];
        this.engagementMetrics = {
            sent: 0,
            delivered: 0,
            opened: 0,
            acted: 0,
            dismissed: 0
        };

        await this.persistNotificationHistory();
        this.logger.info('IntelligentNotifications', 'Historial de notificaciones limpiado');
    }

    // Métodos auxiliares
    generateNotificationId() {
        return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    updateEngagementMetrics(action) {
        switch (action) {
            case 'delivered':
                this.engagementMetrics.delivered++;
                break;
            case 'opened':
                this.engagementMetrics.opened++;
                break;
            case 'acted':
                this.engagementMetrics.acted++;
                break;
            case 'dismissed':
                this.engagementMetrics.dismissed++;
                break;
        }
    }

    async persistAnalyticsData() {
        try {
            await this.mobileArch.storage?.set('notification_history', this.notificationHistory);
            await this.mobileArch.storage?.set('engagement_metrics', this.engagementMetrics);
        } catch (error) {
            this.logger.error('IntelligentNotifications', 'Error al persistir analytics', error);
        }
    }

    async persistNotificationHistory() {
        try {
            await this.mobileArch.storage?.set('notification_history', this.notificationHistory);
        } catch (error) {
            this.logger.error('IntelligentNotifications', 'Error al persistir historial', error);
        }
    }

    async persistScheduledNotifications() {
        try {
            const scheduled = Array.from(this.scheduledNotifications.values());
            await this.mobileArch.storage?.set('scheduled_notifications', scheduled);
        } catch (error) {
            this.logger.error('IntelligentNotifications', 'Error al persistir notificaciones programadas', error);
        }
    }

    getApplicationServerKey() {
        // En producción, esto vendría de configuración del servidor
        return 'BKZJl3l7VJJHnSdoVhzI8h9vOBYjNZK9NzQ9wHq8LQ7Y9gGKYX...'; // Ejemplo
    }

    async registerDeviceToken(token) {
        // Simular registro de token en servidor
        this.logger.info('IntelligentNotifications', 'Device token registrado en servidor (simulado)');
    }

    async registerPushSubscription(subscription) {
        // Simular registro de suscripción web push
        this.logger.info('IntelligentNotifications', 'Suscripción web push registrada en servidor (simulado)');
    }

    getPendingAssignments() {
        // Simulación - en implementación real obtener de datos reales
        return [
            { id: 1, title: 'Ensayo de Historia' },
            { id: 2, title: 'Problemas de Matemáticas' },
            { id: 3, title: 'Reporte de Química' }
        ];
    }

    async scheduleReminder(notificationId, delay) {
        // Programar recordatorio
        setTimeout(() => {
            this.sendNotification({
                category: 'system',
                title: 'Recordatorio',
                body: 'Tienes una notificación pendiente de revisar',
                data: { originalNotificationId: notificationId }
            });
        }, delay);
    }

    async markAssignmentCompleted(assignmentId) {
        // Simular marcar tarea como completada
        this.logger.info('IntelligentNotifications', `Tarea marcada como completada: ${assignmentId}`);
    }

    async muteNotificationCategory(category, duration) {
        // Silenciar categoría temporalmente
        const preferences = this.userPreferences.get('global');
        preferences.categories[category].enabled = false;

        setTimeout(() => {
            preferences.categories[category].enabled = true;
            this.saveUserPreferences();
        }, duration);

        await this.saveUserPreferences();
        this.logger.info('IntelligentNotifications', `Categoría ${category} silenciada por ${duration}ms`);
    }

    getNextActiveWindow(activeHours) {
        const now = new Date();
        const currentHour = now.getHours();

        // Encontrar próxima hora activa
        let nextHour = activeHours.find(hour => hour > currentHour);

        if (!nextHour) {
            // Si no hay más horas hoy, usar primera hora del día siguiente
            nextHour = activeHours[0];
            now.setDate(now.getDate() + 1);
        }

        now.setHours(nextHour, 0, 0, 0);
        return now.getTime();
    }

    calculateNextOptimalTime(userPatterns) {
        const now = new Date();
        const preferences = this.userPreferences.get('global');

        // Si hay horas preferidas, usar la próxima
        if (userPatterns.preferredDeliveryTimes.length > 0) {
            return this.getNextActiveWindow(userPatterns.preferredDeliveryTimes);
        }

        // Sino, usar después del horario de silencio
        const quietEnd = preferences.quietHours.end;
        const [endHour, endMinute] = quietEnd.split(':').map(Number);

        const nextDay = new Date(now);
        nextDay.setHours(endHour, endMinute, 0, 0);

        if (nextDay <= now) {
            nextDay.setDate(nextDay.getDate() + 1);
        }

        return nextDay.getTime();
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BGEMobileIntelligentNotifications;
} else if (typeof window !== 'undefined') {
    window.BGEMobileIntelligentNotifications = BGEMobileIntelligentNotifications;
}