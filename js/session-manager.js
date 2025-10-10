/**
 * 🔐 GESTOR DE SESIONES - BGE HÉROES DE LA PATRIA
 * Control avanzado de sesiones con roles y permisos
 */

class BGESessionManager {
    constructor() {
        this.authSystem = null;
        this.currentSessionId = null;
        this.sessionStartTime = null;
        this.lastActivity = null;
        this.activityTimeout = null;

        // Configuraciones
        this.inactivityTimeout = 30 * 60 * 1000; // 30 minutos
        this.warningTime = 5 * 60 * 1000; // Advertir 5 minutos antes
        this.maxConcurrentSessions = 3;

        // Callbacks para eventos de sesión
        this.sessionCallbacks = {
            sessionStart: [],
            sessionEnd: [],
            inactivityWarning: [],
            sessionTimeout: [],
            multipleSessionsDetected: []
        };

        this.init();
    }

    /**
     * Inicializar gestor de sesiones
     */
    async init() {
        console.log('📊 Inicializando gestor de sesiones BGE...');

        // Obtener instancia del sistema de auth
        this.authSystem = window.getBGEAuthSystem();

        // Configurar listeners
        this.setupEventListeners();

        // Configurar monitoreo de actividad
        this.setupActivityMonitoring();

        // Verificar sesiones existentes
        await this.checkExistingSessions();

        console.log('✅ Gestor de sesiones inicializado');
    }

    /**
     * Configurar listeners de eventos
     */
    setupEventListeners() {
        // Escuchar eventos del sistema de auth
        this.authSystem.on('login', (data) => {
            this.handleSessionStart(data);
        });

        this.authSystem.on('logout', () => {
            this.handleSessionEnd();
        });

        this.authSystem.on('sessionExpired', (reason) => {
            this.handleSessionTimeout(reason);
        });

        // Eventos de ventana
        window.addEventListener('beforeunload', () => {
            this.handlePageUnload();
        });

        window.addEventListener('focus', () => {
            this.handlePageFocus();
        });

        window.addEventListener('blur', () => {
            this.handlePageBlur();
        });
    }

    /**
     * Configurar monitoreo de actividad del usuario
     */
    setupActivityMonitoring() {
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

        const updateActivity = () => {
            this.updateLastActivity();
        };

        // Throttle para evitar demasiadas actualizaciones
        let throttleTimeout = null;
        const throttledUpdate = () => {
            if (!throttleTimeout) {
                throttleTimeout = setTimeout(() => {
                    updateActivity();
                    throttleTimeout = null;
                }, 1000);
            }
        };

        activityEvents.forEach(event => {
            document.addEventListener(event, throttledUpdate, true);
        });

        // Iniciar monitoreo de inactividad
        this.startInactivityMonitoring();
    }

    /**
     * Manejar inicio de sesión
     */
    handleSessionStart(data) {
        this.currentSessionId = this.generateSessionId();
        this.sessionStartTime = Date.now();
        this.lastActivity = Date.now();

        console.log(`📊 Sesión iniciada: ${data.user.email} (ID: ${this.currentSessionId})`);

        // Almacenar información de sesión
        this.storeSessionInfo({
            sessionId: this.currentSessionId,
            userId: data.user.id,
            email: data.user.email,
            role: data.user.role,
            startTime: this.sessionStartTime,
            userAgent: navigator.userAgent,
            ipAddress: 'unknown', // Se podría obtener del servidor
            deviceInfo: this.getDeviceInfo()
        });

        // Emitir evento
        this.emitSessionEvent('sessionStart', {
            sessionId: this.currentSessionId,
            user: data.user,
            startTime: this.sessionStartTime
        });

        // Reiniciar monitoreo de inactividad
        this.startInactivityMonitoring();
    }

    /**
     * Manejar fin de sesión
     */
    handleSessionEnd() {
        if (this.currentSessionId) {
            console.log(`📊 Sesión terminada: ${this.currentSessionId}`);

            // Calcular duración de sesión
            const duration = Date.now() - this.sessionStartTime;

            // Almacenar estadísticas de sesión
            this.updateSessionStats({
                sessionId: this.currentSessionId,
                endTime: Date.now(),
                duration: duration,
                endReason: 'user_logout'
            });

            // Emitir evento
            this.emitSessionEvent('sessionEnd', {
                sessionId: this.currentSessionId,
                duration: duration,
                reason: 'user_logout'
            });
        }

        // Limpiar datos de sesión
        this.clearSessionData();

        // Detener monitoreo
        this.stopInactivityMonitoring();
    }

    /**
     * Manejar timeout de sesión
     */
    handleSessionTimeout(reason) {
        if (this.currentSessionId) {
            console.log(`⏰ Sesión expirada: ${this.currentSessionId} - Razón: ${reason}`);

            const duration = Date.now() - this.sessionStartTime;

            // Actualizar estadísticas
            this.updateSessionStats({
                sessionId: this.currentSessionId,
                endTime: Date.now(),
                duration: duration,
                endReason: reason || 'timeout'
            });

            // Emitir evento
            this.emitSessionEvent('sessionTimeout', {
                sessionId: this.currentSessionId,
                reason: reason,
                duration: duration
            });
        }

        this.clearSessionData();
        this.stopInactivityMonitoring();
    }

    /**
     * Actualizar última actividad
     */
    updateLastActivity() {
        this.lastActivity = Date.now();

        // Reiniciar temporizador de inactividad
        this.startInactivityMonitoring();

        // Actualizar en almacenamiento local
        if (this.currentSessionId) {
            const sessionInfo = this.getStoredSessionInfo();
            if (sessionInfo) {
                sessionInfo.lastActivity = this.lastActivity;
                this.storeSessionInfo(sessionInfo);
            }
        }
    }

    /**
     * Iniciar monitoreo de inactividad
     */
    startInactivityMonitoring() {
        this.stopInactivityMonitoring(); // Limpiar temporizador anterior

        if (!this.authSystem.isAuthenticated()) return;

        // Temporizador para advertencia de inactividad
        const warningTimeout = this.inactivityTimeout - this.warningTime;

        setTimeout(() => {
            if (this.authSystem.isAuthenticated()) {
                this.showInactivityWarning();
            }
        }, warningTimeout);

        // Temporizador principal de inactividad
        this.activityTimeout = setTimeout(() => {
            if (this.authSystem.isAuthenticated()) {
                console.log('⏰ Usuario inactivo - cerrando sesión automáticamente');
                this.authSystem.logout();
            }
        }, this.inactivityTimeout);
    }

    /**
     * Detener monitoreo de inactividad
     */
    stopInactivityMonitoring() {
        if (this.activityTimeout) {
            clearTimeout(this.activityTimeout);
            this.activityTimeout = null;
        }
    }

    /**
     * Mostrar advertencia de inactividad
     */
    showInactivityWarning() {
        const timeLeft = Math.ceil((this.lastActivity + this.inactivityTimeout - Date.now()) / 1000 / 60);

        if (timeLeft > 0) {
            console.log(`⚠️ Advertencia de inactividad: ${timeLeft} minutos restantes`);

            this.emitSessionEvent('inactivityWarning', {
                timeLeft: timeLeft,
                lastActivity: new Date(this.lastActivity)
            });

            // Mostrar notificación visual si está disponible
            this.showWarningNotification(timeLeft);
        }
    }

    /**
     * Mostrar notificación visual de advertencia
     */
    showWarningNotification(minutesLeft) {
        // Crear notificación toast
        const notification = document.createElement('div');
        notification.className = 'toast position-fixed top-0 end-0 m-3 bg-warning';
        notification.style.zIndex = '9999';

        notification.innerHTML = `
            <div class="toast-header bg-warning text-dark">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong class="me-auto">Sesión por expirar</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body text-dark">
                <p class="mb-2">Tu sesión expirará en <strong>${minutesLeft} minuto(s)</strong>.</p>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-primary" onclick="bgeSessionManager.extendSession()">
                        Extender Sesión
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="bgeSessionManager.dismissWarning(this)">
                        Entendido
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Mostrar toast
        const toast = new bootstrap.Toast(notification);
        toast.show();

        // Auto-remover después de 10 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }

    /**
     * Extender sesión (renovar token)
     */
    async extendSession() {
        try {
            await this.authSystem.refreshToken();
            this.updateLastActivity();
            console.log('✅ Sesión extendida exitosamente');

            // Mostrar confirmación
            this.showSuccessNotification('Sesión extendida exitosamente');
        } catch (error) {
            console.error('❌ Error extendiendo sesión:', error);
            this.showErrorNotification('No se pudo extender la sesión');
        }
    }

    /**
     * Descartar advertencia
     */
    dismissWarning(element) {
        const toast = element.closest('.toast');
        if (toast) {
            const bsToast = bootstrap.Toast.getInstance(toast);
            if (bsToast) {
                bsToast.hide();
            }
        }
    }

    /**
     * Mostrar notificación de éxito
     */
    showSuccessNotification(message) {
        const notification = this.createNotification('success', 'Éxito', message);
        document.body.appendChild(notification);
        const toast = new bootstrap.Toast(notification);
        toast.show();
    }

    /**
     * Mostrar notificación de error
     */
    showErrorNotification(message) {
        const notification = this.createNotification('danger', 'Error', message);
        document.body.appendChild(notification);
        const toast = new bootstrap.Toast(notification);
        toast.show();
    }

    /**
     * Crear elemento de notificación
     */
    createNotification(type, title, message) {
        const colors = {
            success: 'bg-success text-white',
            danger: 'bg-danger text-white',
            warning: 'bg-warning text-dark',
            info: 'bg-info text-white'
        };

        const notification = document.createElement('div');
        notification.className = 'toast position-fixed top-0 end-0 m-3';
        notification.style.zIndex = '9999';

        notification.innerHTML = `
            <div class="toast-header ${colors[type]}">
                <i class="fas fa-info-circle me-2"></i>
                <strong class="me-auto">${title}</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;

        return notification;
    }

    /**
     * Generar ID único de sesión
     */
    generateSessionId() {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2);
        return `bge_${timestamp}_${randomStr}`;
    }

    /**
     * Obtener información del dispositivo
     */
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screen: {
                width: screen.width,
                height: screen.height
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            timestamp: Date.now()
        };
    }

    /**
     * Almacenar información de sesión
     */
    storeSessionInfo(sessionInfo) {
        const sessions = this.getStoredSessions();
        sessions[sessionInfo.sessionId] = sessionInfo;

        // Mantener solo las últimas 10 sesiones
        const sessionIds = Object.keys(sessions);
        if (sessionIds.length > 10) {
            const oldestSessions = sessionIds
                .sort((a, b) => sessions[a].startTime - sessions[b].startTime)
                .slice(0, sessionIds.length - 10);

            oldestSessions.forEach(id => delete sessions[id]);
        }

        localStorage.setItem('bge_sessions', JSON.stringify(sessions));
    }

    /**
     * Obtener información de sesión almacenada
     */
    getStoredSessionInfo() {
        if (!this.currentSessionId) return null;
        const sessions = this.getStoredSessions();
        return sessions[this.currentSessionId] || null;
    }

    /**
     * Obtener todas las sesiones almacenadas
     */
    getStoredSessions() {
        try {
            const stored = localStorage.getItem('bge_sessions');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            return {};
        }
    }

    /**
     * Actualizar estadísticas de sesión
     */
    updateSessionStats(stats) {
        const sessionInfo = this.getStoredSessionInfo();
        if (sessionInfo) {
            Object.assign(sessionInfo, stats);
            this.storeSessionInfo(sessionInfo);
        }
    }

    /**
     * Limpiar datos de sesión
     */
    clearSessionData() {
        this.currentSessionId = null;
        this.sessionStartTime = null;
        this.lastActivity = null;
    }

    /**
     * Verificar sesiones existentes
     */
    async checkExistingSessions() {
        // Esta función podría verificar con el servidor si hay otras sesiones activas
        // Por ahora solo verifica localmente
        const sessions = this.getStoredSessions();
        const activeSessions = Object.values(sessions).filter(session =>
            !session.endTime && (Date.now() - session.startTime) < (24 * 60 * 60 * 1000) // 24 horas
        );

        if (activeSessions.length > this.maxConcurrentSessions) {
            console.warn('⚠️ Múltiples sesiones detectadas');
            this.emitSessionEvent('multipleSessionsDetected', activeSessions);
        }
    }

    /**
     * Manejar eventos de página
     */
    handlePageUnload() {
        if (this.currentSessionId) {
            // Actualizar información antes de cerrar
            const sessionInfo = this.getStoredSessionInfo();
            if (sessionInfo) {
                sessionInfo.lastActivity = Date.now();
                this.storeSessionInfo(sessionInfo);
            }
        }
    }

    handlePageFocus() {
        if (this.authSystem.isAuthenticated()) {
            this.updateLastActivity();
        }
    }

    handlePageBlur() {
        // Opcional: pausar ciertos procesos cuando la página no está visible
    }

    /**
     * Obtener estadísticas de la sesión actual
     */
    getCurrentSessionStats() {
        if (!this.currentSessionId) return null;

        const sessionInfo = this.getStoredSessionInfo();
        const now = Date.now();

        return {
            sessionId: this.currentSessionId,
            duration: now - this.sessionStartTime,
            lastActivity: new Date(this.lastActivity),
            timeSinceLastActivity: now - this.lastActivity,
            timeUntilTimeout: Math.max(0, this.lastActivity + this.inactivityTimeout - now),
            user: this.authSystem.getCurrentUser(),
            ...sessionInfo
        };
    }

    /**
     * Registrar callback para eventos de sesión
     */
    on(event, callback) {
        if (this.sessionCallbacks[event]) {
            this.sessionCallbacks[event].push(callback);
        }
    }

    /**
     * Desregistrar callback de evento de sesión
     */
    off(event, callback) {
        if (this.sessionCallbacks[event]) {
            const index = this.sessionCallbacks[event].indexOf(callback);
            if (index > -1) {
                this.sessionCallbacks[event].splice(index, 1);
            }
        }
    }

    /**
     * Emitir evento de sesión
     */
    emitSessionEvent(event, data) {
        if (this.sessionCallbacks[event]) {
            this.sessionCallbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Error en callback de evento de sesión ${event}:`, error);
                }
            });
        }
    }
}

// Instancia global
let bgeSessionManager = null;

/**
 * Obtener instancia del gestor de sesiones
 */
function getBGESessionManager() {
    if (!bgeSessionManager) {
        bgeSessionManager = new BGESessionManager();
    }
    return bgeSessionManager;
}

// Exponer globalmente
window.BGESessionManager = BGESessionManager;
window.getBGESessionManager = getBGESessionManager;

// Auto-inicializar
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Auto-inicializando BGE Session Manager...');
    window.bgeSessionManager = getBGESessionManager();
});

export { BGESessionManager, getBGESessionManager };