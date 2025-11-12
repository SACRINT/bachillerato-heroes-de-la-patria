/**
 * 📱 SISTEMA DE NOTIFICACIONES PUSH - FASE B CORE EDUCATIVO
 * Sistema completo de notificaciones push para calificaciones, eventos y comunicación
 * Compatible con Service Worker y gestión de permisos
 */

class PushNotificationManager {
    constructor() {
        this.swRegistration = null;
        this.subscription = null;
        this.currentUser = null;
        this.userRole = null;
        this.authToken = null;
        this.isSupported = false;
        this.permissionStatus = 'default';
        this.notificationQueue = [];

        this.config = {
            apiBase: '/api/notifications',
            vapidPublicKey: 'BEl62iUYgUivxIkv69yViEuiBIa6iMjyr38-QNg9QrOGY5K4LpNEJ39y6oH8R6oLQqYt7Ye3uZg3pCxtm7-u6NI', // Clave VAPID pública
            refreshInterval: 30000,
            maxRetries: 3,
            notificationTypes: [
                'grades_published',      // Calificaciones publicadas
                'new_message',           // Nuevo mensaje
                'appointment_scheduled', // Cita programada
                'event_reminder',        // Recordatorio de evento
                'homework_assigned',     // Tarea asignada
                'attendance_alert',      // Alerta de asistencia
                'general_announcement'   // Anuncio general
            ],
            defaultOptions: {
                icon: '/images/icons/icon-192x192.png',
                badge: '/images/icons/badge-72x72.png',
                vibrate: [200, 100, 200],
                requireInteraction: true,
                actions: [
                    {
                        action: 'view',
                        title: 'Ver',
                        icon: '/images/icons/view-24.png'
                    },
                    {
                        action: 'dismiss',
                        title: 'Descartar',
                        icon: '/images/icons/dismiss-24.png'
                    }
                ]
            }
        };

        this.init();
    }

    async init() {
        console.log('🚀 Inicializando Sistema de Notificaciones Push...');

        try {
            this.checkSupport();
            await this.loadUserAuth();
            await this.setupServiceWorker();
            await this.checkExistingSubscription();
            await this.setupUI();
            await this.bindEvents();
            await this.loadNotificationHistory();

            console.log('✅ Sistema de Notificaciones Push inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando Sistema de Notificaciones:', error);
            this.showError('Error al inicializar el sistema de notificaciones');
        }
    }

    checkSupport() {
        this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

        if (!this.isSupported) {
            console.warn('⚠️ Push notifications no son soportadas en este navegador');
            return false;
        }

        this.permissionStatus = Notification.permission;
        console.log('✅ Push notifications soportadas, estado:', this.permissionStatus);
        return true;
    }

    async loadUserAuth() {
        this.authToken = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');

        if (this.authToken && userData) {
            const user = JSON.parse(userData);
            this.currentUser = user;
            this.userRole = user.rol || user.role;
        } else {
            throw new Error('Usuario no autenticado');
        }
    }

    async setupServiceWorker() {
        if (!this.isSupported) return;

        try {
            // Registrar el service worker si no está registrado
            this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            console.log('✅ Service Worker registrado:', this.swRegistration.scope);

            // Verificar que el service worker esté activo
            if (this.swRegistration.installing) {
                console.log('Service Worker instalándose...');
            } else if (this.swRegistration.waiting) {
                console.log('Service Worker instalado, esperando activación...');
            } else if (this.swRegistration.active) {
                console.log('Service Worker activo');
            }

        } catch (error) {
            console.error('Error registrando Service Worker:', error);
            throw error;
        }
    }

    async checkExistingSubscription() {
        if (!this.swRegistration) return;

        try {
            this.subscription = await this.swRegistration.pushManager.getSubscription();

            if (this.subscription) {
                console.log('✅ Suscripción existente encontrada');
                await this.syncSubscriptionWithServer();
            } else {
                console.log('No hay suscripción existente');
            }
        } catch (error) {
            console.error('Error verificando suscripción:', error);
        }
    }

    async setupUI() {
        const container = document.getElementById('push-notifications-container');
        if (!container) return;

        container.innerHTML = `
            <div class="push-notifications-system">
                <!-- Header del Sistema -->
                <div class="notifications-header bg-info text-white p-4 rounded-top">
                    <h2><i class="fas fa-bell me-2"></i>Notificaciones Push</h2>
                    <p class="mb-0">Gestión y configuración de notificaciones en tiempo real</p>
                </div>

                <!-- Estado del Sistema -->
                <div class="notification-status bg-light p-3 border-bottom">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <div class="d-flex align-items-center">
                                <div class="status-indicator me-3" id="statusIndicator">
                                    <i class="fas fa-circle text-secondary"></i>
                                </div>
                                <div>
                                    <strong id="statusText">Verificando estado...</strong>
                                    <br>
                                    <small class="text-muted" id="statusDetails">Cargando información del sistema</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6 text-end">
                            <button type="button" class="btn btn-primary" id="enableNotificationsBtn" disabled>
                                <i class="fas fa-bell me-1"></i>Habilitar Notificaciones
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Navegación -->
                <div class="notifications-nav bg-light p-3 border-bottom">
                    <div class="btn-group w-100" role="group">
                        <button type="button" class="btn btn-outline-primary active" data-view="settings">
                            <i class="fas fa-cog me-1"></i>Configuración
                        </button>
                        <button type="button" class="btn btn-outline-primary" data-view="history">
                            <i class="fas fa-history me-1"></i>Historial
                        </button>
                        <button type="button" class="btn btn-outline-primary" data-view="test">
                            <i class="fas fa-paper-plane me-1"></i>Enviar Prueba
                        </button>
                    </div>
                </div>

                <!-- Contenido -->
                <div class="notifications-content">
                    <!-- Vista de Configuración -->
                    <div id="settings-view" class="notification-view active">
                        <div class="row">
                            <!-- Panel de Configuración -->
                            <div class="col-lg-6">
                                <div class="card">
                                    <div class="card-header bg-secondary text-white">
                                        <h5 class="mb-0"><i class="fas fa-sliders-h me-2"></i>Preferencias de Notificación</h5>
                                    </div>
                                    <div class="card-body">
                                        <form id="notificationPreferencesForm">
                                            <div class="mb-4">
                                                <label class="form-label">
                                                    <strong>Tipos de Notificaciones</strong>
                                                </label>

                                                <div class="form-check mb-2">
                                                    <input class="form-check-input" type="checkbox" id="grades_published" checked>
                                                    <label class="form-check-label" for="grades_published">
                                                        <i class="fas fa-chart-line me-2 text-primary"></i>
                                                        Calificaciones publicadas
                                                    </label>
                                                </div>

                                                <div class="form-check mb-2">
                                                    <input class="form-check-input" type="checkbox" id="new_message" checked>
                                                    <label class="form-check-label" for="new_message">
                                                        <i class="fas fa-envelope me-2 text-info"></i>
                                                        Nuevos mensajes
                                                    </label>
                                                </div>

                                                <div class="form-check mb-2">
                                                    <input class="form-check-input" type="checkbox" id="appointment_scheduled" checked>
                                                    <label class="form-check-label" for="appointment_scheduled">
                                                        <i class="fas fa-calendar-check me-2 text-success"></i>
                                                        Citas programadas
                                                    </label>
                                                </div>

                                                <div class="form-check mb-2">
                                                    <input class="form-check-input" type="checkbox" id="event_reminder" checked>
                                                    <label class="form-check-label" for="event_reminder">
                                                        <i class="fas fa-calendar-alt me-2 text-warning"></i>
                                                        Recordatorios de eventos
                                                    </label>
                                                </div>

                                                <div class="form-check mb-2">
                                                    <input class="form-check-input" type="checkbox" id="homework_assigned">
                                                    <label class="form-check-label" for="homework_assigned">
                                                        <i class="fas fa-book me-2 text-secondary"></i>
                                                        Tareas asignadas
                                                    </label>
                                                </div>

                                                <div class="form-check mb-2">
                                                    <input class="form-check-input" type="checkbox" id="attendance_alert">
                                                    <label class="form-check-label" for="attendance_alert">
                                                        <i class="fas fa-user-clock me-2 text-danger"></i>
                                                        Alertas de asistencia
                                                    </label>
                                                </div>

                                                <div class="form-check mb-2">
                                                    <input class="form-check-input" type="checkbox" id="general_announcement" checked>
                                                    <label class="form-check-label" for="general_announcement">
                                                        <i class="fas fa-bullhorn me-2 text-dark"></i>
                                                        Anuncios generales
                                                    </label>
                                                </div>
                                            </div>

                                            <!-- Configuración de Horarios -->
                                            <div class="mb-4">
                                                <label class="form-label">
                                                    <strong>Horario de Notificaciones</strong>
                                                </label>
                                                <div class="row">
                                                    <div class="col-md-6">
                                                        <label class="form-label small">Desde:</label>
                                                        <input type="time" class="form-control" id="notifStartTime" value="07:00">
                                                    </div>
                                                    <div class="col-md-6">
                                                        <label class="form-label small">Hasta:</label>
                                                        <input type="time" class="form-control" id="notifEndTime" value="22:00">
                                                    </div>
                                                </div>
                                                <small class="text-muted">Las notificaciones solo se enviarán en este horario</small>
                                            </div>

                                            <!-- Días de la semana -->
                                            <div class="mb-4">
                                                <label class="form-label">
                                                    <strong>Días activos</strong>
                                                </label>
                                                <div class="d-flex gap-2 flex-wrap">
                                                    <input type="checkbox" class="btn-check" id="day_monday" checked>
                                                    <label class="btn btn-outline-primary btn-sm" for="day_monday">L</label>

                                                    <input type="checkbox" class="btn-check" id="day_tuesday" checked>
                                                    <label class="btn btn-outline-primary btn-sm" for="day_tuesday">M</label>

                                                    <input type="checkbox" class="btn-check" id="day_wednesday" checked>
                                                    <label class="btn btn-outline-primary btn-sm" for="day_wednesday">X</label>

                                                    <input type="checkbox" class="btn-check" id="day_thursday" checked>
                                                    <label class="btn btn-outline-primary btn-sm" for="day_thursday">J</label>

                                                    <input type="checkbox" class="btn-check" id="day_friday" checked>
                                                    <label class="btn btn-outline-primary btn-sm" for="day_friday">V</label>

                                                    <input type="checkbox" class="btn-check" id="day_saturday">
                                                    <label class="btn btn-outline-primary btn-sm" for="day_saturday">S</label>

                                                    <input type="checkbox" class="btn-check" id="day_sunday">
                                                    <label class="btn btn-outline-primary btn-sm" for="day_sunday">D</label>
                                                </div>
                                            </div>

                                            <!-- Botón Guardar -->
                                            <button type="submit" class="btn btn-success w-100">
                                                <i class="fas fa-save me-1"></i>Guardar Configuración
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>

                            <!-- Panel de Estado y Información -->
                            <div class="col-lg-6">
                                <div class="card">
                                    <div class="card-header bg-info text-white">
                                        <h5 class="mb-0"><i class="fas fa-info-circle me-2"></i>Estado del Sistema</h5>
                                    </div>
                                    <div class="card-body">
                                        <div id="systemStatusInfo">
                                            <div class="text-center">
                                                <div class="spinner-border text-primary" role="status">
                                                    <span class="visually-hidden">Cargando...</span>
                                                </div>
                                                <p class="mt-2">Verificando estado del sistema...</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Estadísticas -->
                                <div class="card mt-3">
                                    <div class="card-header">
                                        <h6 class="mb-0">Estadísticas</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row text-center">
                                            <div class="col-4">
                                                <h4 class="text-primary mb-1" id="totalNotifications">0</h4>
                                                <small class="text-muted">Total</small>
                                            </div>
                                            <div class="col-4">
                                                <h4 class="text-success mb-1" id="readNotifications">0</h4>
                                                <small class="text-muted">Leídas</small>
                                            </div>
                                            <div class="col-4">
                                                <h4 class="text-warning mb-1" id="unreadNotifications">0</h4>
                                                <small class="text-muted">Pendientes</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Vista de Historial -->
                    <div id="history-view" class="notification-view">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0"><i class="fas fa-history me-2"></i>Historial de Notificaciones</h5>
                                <button type="button" class="btn btn-sm btn-outline-danger" id="clearHistoryBtn">
                                    <i class="fas fa-trash me-1"></i>Limpiar Historial
                                </button>
                            </div>
                            <div class="card-body">
                                <div id="notificationHistory">
                                    <div class="text-center text-muted py-5">
                                        <i class="fas fa-bell-slash fa-3x mb-3"></i>
                                        <p>No hay notificaciones en el historial</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Vista de Prueba -->
                    <div id="test-view" class="notification-view">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0"><i class="fas fa-paper-plane me-2"></i>Enviar Notificación de Prueba</h5>
                            </div>
                            <div class="card-body">
                                <form id="testNotificationForm">
                                    <div class="mb-3">
                                        <label class="form-label">Tipo de Notificación</label>
                                        <select class="form-select" id="testNotificationType">
                                            <option value="general_announcement">Anuncio General</option>
                                            <option value="grades_published">Calificaciones Publicadas</option>
                                            <option value="new_message">Nuevo Mensaje</option>
                                            <option value="event_reminder">Recordatorio de Evento</option>
                                        </select>
                                    </div>

                                    <div class="mb-3">
                                        <label class="form-label">Título</label>
                                        <input type="text" class="form-control" id="testNotificationTitle"
                                               placeholder="Título de la notificación de prueba">
                                    </div>

                                    <div class="mb-3">
                                        <label class="form-label">Mensaje</label>
                                        <textarea class="form-control" rows="3" id="testNotificationMessage"
                                                  placeholder="Contenido del mensaje de prueba"></textarea>
                                    </div>

                                    <div class="mb-3">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="testRequireInteraction">
                                            <label class="form-check-label" for="testRequireInteraction">
                                                Requiere interacción del usuario
                                            </label>
                                        </div>
                                    </div>

                                    <button type="submit" class="btn btn-primary w-100" id="sendTestBtn">
                                        <i class="fas fa-paper-plane me-1"></i>Enviar Notificación de Prueba
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async bindEvents() {
        // Navegación entre vistas
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.closest('[data-view]').dataset.view;
                this.switchView(view);
            });
        });

        // Habilitar notificaciones
        document.getElementById('enableNotificationsBtn').addEventListener('click', () => {
            this.requestPermissionAndSubscribe();
        });

        // Guardar configuración
        document.getElementById('notificationPreferencesForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveNotificationPreferences();
        });

        // Enviar notificación de prueba
        document.getElementById('testNotificationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendTestNotification();
        });

        // Limpiar historial
        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            this.clearNotificationHistory();
        });

        // Escuchar mensajes del Service Worker
        if (navigator.serviceWorker) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                this.handleServiceWorkerMessage(event.data);
            });
        }
    }

    async requestPermissionAndSubscribe() {
        if (!this.isSupported) {
            this.showError('Las notificaciones push no son soportadas en este navegador');
            return;
        }

        try {
            // Solicitar permiso
            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
                this.showError('Permisos de notificación denegados');
                this.updateStatus('denied', 'Permisos denegados', 'Las notificaciones están deshabilitadas');
                return;
            }

            this.permissionStatus = permission;

            // Crear suscripción
            await this.createSubscription();

            this.showSuccess('¡Notificaciones habilitadas correctamente!');
            this.updateSystemStatus();

        } catch (error) {
            console.error('Error habilitando notificaciones:', error);
            this.showError('Error al habilitar notificaciones: ' + error.message);
        }
    }

    async createSubscription() {
        if (!this.swRegistration) {
            throw new Error('Service Worker no está disponible');
        }

        try {
            const subscription = await this.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.config.vapidPublicKey)
            });

            this.subscription = subscription;
            console.log('✅ Suscripción creada:', subscription.endpoint);

            // Enviar suscripción al servidor
            await this.syncSubscriptionWithServer();

        } catch (error) {
            console.error('Error creando suscripción:', error);
            throw error;
        }
    }

    async syncSubscriptionWithServer() {
        if (!this.subscription) return;

        try {
            const response = await fetch(`${this.config.apiBase}/subscribe`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subscription: this.subscription.toJSON(),
                    userId: this.currentUser.id,
                    userRole: this.userRole,
                    preferences: this.getNotificationPreferences()
                })
            });

            if (response.ok) {
                console.log('✅ Suscripción sincronizada con el servidor');
            } else {
                console.error('Error sincronizando suscripción');
            }
        } catch (error) {
            console.error('Error enviando suscripción al servidor:', error);
        }
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    switchView(view) {
        // Actualizar botones activos
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // Mostrar vista correspondiente
        document.querySelectorAll('.notification-view').forEach(viewEl => {
            viewEl.classList.remove('active');
        });
        document.getElementById(`${view}-view`).classList.add('active');

        // Cargar contenido específico
        switch (view) {
            case 'settings':
                this.loadNotificationPreferences();
                break;
            case 'history':
                this.displayNotificationHistory();
                break;
        }
    }

    async updateSystemStatus() {
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        const statusDetails = document.getElementById('statusDetails');
        const enableBtn = document.getElementById('enableNotificationsBtn');

        if (!this.isSupported) {
            this.updateStatus('not-supported', 'No Soportado', 'Este navegador no soporta notificaciones push');
            enableBtn.disabled = true;
            return;
        }

        switch (this.permissionStatus) {
            case 'granted':
                if (this.subscription) {
                    this.updateStatus('active', 'Activas', 'Las notificaciones están funcionando correctamente');
                    enableBtn.disabled = true;
                    enableBtn.innerHTML = '<i class="fas fa-check me-1"></i>Notificaciones Activas';
                } else {
                    this.updateStatus('granted-not-subscribed', 'Permisos Concedidos', 'Configurando suscripción...');
                    enableBtn.disabled = false;
                }
                break;

            case 'denied':
                this.updateStatus('denied', 'Denegadas', 'Los permisos han sido denegados');
                enableBtn.disabled = true;
                enableBtn.innerHTML = '<i class="fas fa-ban me-1"></i>Permisos Denegados';
                break;

            default:
                this.updateStatus('default', 'Pendientes', 'Haz clic para habilitar las notificaciones');
                enableBtn.disabled = false;
        }

        // Actualizar información del sistema
        this.updateSystemInfo();
    }

    updateStatus(status, text, details) {
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        const statusDetails = document.getElementById('statusDetails');

        const statusConfig = {
            'active': { icon: 'fa-circle text-success', class: 'text-success' },
            'granted-not-subscribed': { icon: 'fa-circle text-warning', class: 'text-warning' },
            'default': { icon: 'fa-circle text-secondary', class: 'text-secondary' },
            'denied': { icon: 'fa-circle text-danger', class: 'text-danger' },
            'not-supported': { icon: 'fa-circle text-muted', class: 'text-muted' }
        };

        const config = statusConfig[status] || statusConfig['default'];

        statusIndicator.innerHTML = `<i class="fas ${config.icon}"></i>`;
        statusText.textContent = text;
        statusText.className = config.class;
        statusDetails.textContent = details;
    }

    async updateSystemInfo() {
        const systemStatusInfo = document.getElementById('systemStatusInfo');

        const info = {
            navegador: this.getBrowserInfo(),
            soportado: this.isSupported ? 'Sí' : 'No',
            permisos: this.permissionStatus,
            suscrito: this.subscription ? 'Sí' : 'No',
            endpoint: this.subscription ? this.subscription.endpoint.substring(0, 50) + '...' : 'N/A',
            serviceWorker: this.swRegistration ? 'Activo' : 'Inactivo'
        };

        systemStatusInfo.innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm">
                    <tr>
                        <td><strong>Navegador:</strong></td>
                        <td>${info.navegador}</td>
                    </tr>
                    <tr>
                        <td><strong>Soporte Push:</strong></td>
                        <td>
                            <span class="badge bg-${info.soportado === 'Sí' ? 'success' : 'danger'}">
                                ${info.soportado}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td><strong>Permisos:</strong></td>
                        <td>
                            <span class="badge bg-${info.permisos === 'granted' ? 'success' : info.permisos === 'denied' ? 'danger' : 'secondary'}">
                                ${info.permisos}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td><strong>Suscrito:</strong></td>
                        <td>
                            <span class="badge bg-${info.suscrito === 'Sí' ? 'success' : 'secondary'}">
                                ${info.suscrito}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td><strong>Service Worker:</strong></td>
                        <td>
                            <span class="badge bg-${info.serviceWorker === 'Activo' ? 'success' : 'secondary'}">
                                ${info.serviceWorker}
                            </span>
                        </td>
                    </tr>
                </table>
            </div>
        `;

        // Actualizar estadísticas
        await this.updateStatistics();
    }

    async updateStatistics() {
        try {
            const response = await fetch(`${this.config.apiBase}/statistics`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const stats = await response.json();
                document.getElementById('totalNotifications').textContent = stats.total || 0;
                document.getElementById('readNotifications').textContent = stats.read || 0;
                document.getElementById('unreadNotifications').textContent = stats.unread || 0;
            }
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }

    getBrowserInfo() {
        const userAgent = navigator.userAgent;

        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';

        return 'Desconocido';
    }

    getNotificationPreferences() {
        const preferences = {
            types: {},
            schedule: {
                startTime: document.getElementById('notifStartTime')?.value || '07:00',
                endTime: document.getElementById('notifEndTime')?.value || '22:00',
                activeDays: {}
            }
        };

        // Tipos de notificación
        this.config.notificationTypes.forEach(type => {
            const checkbox = document.getElementById(type);
            preferences.types[type] = checkbox ? checkbox.checked : false;
        });

        // Días activos
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        days.forEach(day => {
            const checkbox = document.getElementById(`day_${day}`);
            preferences.schedule.activeDays[day] = checkbox ? checkbox.checked : false;
        });

        return preferences;
    }

    async saveNotificationPreferences() {
        const preferences = this.getNotificationPreferences();

        try {
            const response = await fetch(`${this.config.apiBase}/preferences`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    preferences: preferences
                })
            });

            if (response.ok) {
                this.showSuccess('Configuración guardada correctamente');
                localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
            } else {
                throw new Error('Error guardando configuración');
            }
        } catch (error) {
            console.error('Error guardando preferencias:', error);
            this.showError('Error al guardar la configuración');
        }
    }

    loadNotificationPreferences() {
        const saved = localStorage.getItem('notificationPreferences');
        if (!saved) return;

        try {
            const preferences = JSON.parse(saved);

            // Cargar tipos de notificación
            Object.entries(preferences.types).forEach(([type, enabled]) => {
                const checkbox = document.getElementById(type);
                if (checkbox) checkbox.checked = enabled;
            });

            // Cargar horarios
            if (preferences.schedule) {
                const startTime = document.getElementById('notifStartTime');
                const endTime = document.getElementById('notifEndTime');

                if (startTime && preferences.schedule.startTime) {
                    startTime.value = preferences.schedule.startTime;
                }
                if (endTime && preferences.schedule.endTime) {
                    endTime.value = preferences.schedule.endTime;
                }

                // Cargar días activos
                if (preferences.schedule.activeDays) {
                    Object.entries(preferences.schedule.activeDays).forEach(([day, active]) => {
                        const checkbox = document.getElementById(`day_${day}`);
                        if (checkbox) checkbox.checked = active;
                    });
                }
            }
        } catch (error) {
            console.error('Error cargando preferencias:', error);
        }
    }

    async sendTestNotification() {
        if (!this.subscription) {
            this.showError('Primero debes habilitar las notificaciones');
            return;
        }

        const type = document.getElementById('testNotificationType').value;
        const title = document.getElementById('testNotificationTitle').value || 'Notificación de Prueba';
        const message = document.getElementById('testNotificationMessage').value || 'Esta es una notificación de prueba del sistema BGE.';
        const requireInteraction = document.getElementById('testRequireInteraction').checked;

        try {
            const response = await fetch(`${this.config.apiBase}/send-test`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    type: type,
                    title: title,
                    message: message,
                    options: {
                        ...this.config.defaultOptions,
                        requireInteraction: requireInteraction
                    }
                })
            });

            if (response.ok) {
                this.showSuccess('Notificación de prueba enviada');
                // Limpiar formulario
                document.getElementById('testNotificationTitle').value = '';
                document.getElementById('testNotificationMessage').value = '';
            } else {
                throw new Error('Error enviando notificación de prueba');
            }
        } catch (error) {
            console.error('Error enviando notificación de prueba:', error);
            this.showError('Error al enviar la notificación de prueba');
        }
    }

    async loadNotificationHistory() {
        try {
            const response = await fetch(`${this.config.apiBase}/history?userId=${this.currentUser.id}`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const history = await response.json();
                this.notificationQueue = history;
            }
        } catch (error) {
            console.error('Error cargando historial:', error);
        }
    }

    displayNotificationHistory() {
        const historyContainer = document.getElementById('notificationHistory');

        if (this.notificationQueue.length === 0) {
            historyContainer.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="fas fa-bell-slash fa-3x mb-3"></i>
                    <p>No hay notificaciones en el historial</p>
                </div>
            `;
            return;
        }

        const html = this.notificationQueue.map(notification => {
            const typeIcons = {
                'grades_published': 'fa-chart-line text-primary',
                'new_message': 'fa-envelope text-info',
                'appointment_scheduled': 'fa-calendar-check text-success',
                'event_reminder': 'fa-calendar-alt text-warning',
                'homework_assigned': 'fa-book text-secondary',
                'attendance_alert': 'fa-user-clock text-danger',
                'general_announcement': 'fa-bullhorn text-dark'
            };

            const icon = typeIcons[notification.type] || 'fa-bell text-muted';

            return `
                <div class="notification-item border rounded p-3 mb-3 ${notification.read ? 'bg-light' : 'bg-white border-primary'}">
                    <div class="d-flex align-items-start">
                        <div class="notification-icon me-3">
                            <i class="fas ${icon} fa-lg"></i>
                        </div>
                        <div class="flex-grow-1">
                            <h6 class="mb-1">${notification.title}</h6>
                            <p class="mb-2 text-muted">${notification.message}</p>
                            <small class="text-muted">
                                <i class="fas fa-clock me-1"></i>
                                ${new Date(notification.createdAt).toLocaleString()}
                            </small>
                            ${!notification.read ? '<span class="badge bg-primary ms-2">Nueva</span>' : ''}
                        </div>
                        <div class="notification-actions">
                            <button type="button" class="btn btn-sm btn-outline-secondary"
                                    onclick="pushNotifications.markAsRead('${notification.id}')">
                                <i class="fas fa-check"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        historyContainer.innerHTML = html;
    }

    async markAsRead(notificationId) {
        try {
            const response = await fetch(`${this.config.apiBase}/mark-read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    notificationId: notificationId,
                    userId: this.currentUser.id
                })
            });

            if (response.ok) {
                // Actualizar en memoria
                const notification = this.notificationQueue.find(n => n.id === notificationId);
                if (notification) {
                    notification.read = true;
                }

                // Refrescar vista
                this.displayNotificationHistory();
                this.updateStatistics();
            }
        } catch (error) {
            console.error('Error marcando como leída:', error);
        }
    }

    clearNotificationHistory() {
        if (confirm('¿Estás seguro de que quieres limpiar todo el historial de notificaciones?')) {
            this.notificationQueue = [];
            localStorage.removeItem('notificationHistory');
            this.displayNotificationHistory();
            this.updateStatistics();
            this.showSuccess('Historial limpiado correctamente');
        }
    }

    handleServiceWorkerMessage(data) {
        console.log('Mensaje del Service Worker:', data);

        if (data.type === 'notification-clicked') {
            // Manejar clic en notificación
            this.handleNotificationClick(data.notification);
        } else if (data.type === 'notification-received') {
            // Nueva notificación recibida
            this.handleNotificationReceived(data.notification);
        }
    }

    handleNotificationClick(notification) {
        console.log('Notificación clickeada:', notification);

        // Redirigir según el tipo de notificación
        switch (notification.type) {
            case 'grades_published':
                window.location.href = '/calificaciones.html';
                break;
            case 'new_message':
                window.location.href = '/comunicacion-padres-docentes.html';
                break;
            case 'appointment_scheduled':
                window.location.href = '/citas.html';
                break;
            case 'event_reminder':
                window.location.href = '/calendario.html';
                break;
            default:
                console.log('Tipo de notificación no manejado:', notification.type);
        }
    }

    handleNotificationReceived(notification) {
        // Agregar al historial local
        this.notificationQueue.unshift({
            ...notification,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            read: false
        });

        // Actualizar estadísticas
        this.updateStatistics();

        // Si está en la vista de historial, actualizar
        if (document.getElementById('history-view').classList.contains('active')) {
            this.displayNotificationHistory();
        }
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        // Crear toast notification
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 9999;
            max-width: 300px;
            opacity: 1;
            transition: opacity 0.3s ease;
        `;

        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
            ${message}
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 5000);
    }

    destroy() {
        console.log('🧹 Limpiando Sistema de Notificaciones Push...');

        if (this.subscription) {
            // Optionally unsubscribe
        }
    }
}

// Inicializar automáticamente si el contenedor existe
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('push-notifications-container')) {
        window.pushNotifications = new PushNotificationManager();
    }
});

// Exportar para uso global
window.PushNotificationManager = PushNotificationManager;