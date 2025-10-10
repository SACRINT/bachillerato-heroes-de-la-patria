/**
 * 🔔 SISTEMA DE NOTIFICACIONES PUSH EDUCATIVAS BGE
 * Bachillerato General Estatal "Héroes de la Patria"
 *
 * Sistema completo de notificaciones push para:
 * - Comunicados oficiales
 * - Recordatorios académicos
 * - Emergencias escolares
 * - Eventos y actividades
 * - Calificaciones y tareas
 */

class BGEPushNotificationSystem {
    constructor() {
        this.currentUser = null;
        this.isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
        this.permission = Notification.permission;
        this.subscription = null;
        this.swRegistration = null;
        this.notificationQueue = [];
        this.scheduledNotifications = [];
        this.preferences = this.getEducationalPreferences();

        console.log('🔔 Iniciando BGE Push Notification System');
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando sistema de notificaciones BGE...');

        if (!this.isSupported) {
            console.warn('⚠️ Push notifications no soportadas en este navegador');
            this.showUnsupportedNotice();
            return;
        }

        this.loadUserSession();
        this.loadUserPreferences();
        await this.setupServiceWorker();
        await this.checkExistingSubscription();
        this.createNotificationUI();
        this.setupEventListeners();
        await this.scheduleEducationalNotifications();

        console.log('✅ Sistema de notificaciones BGE inicializado correctamente');
    }

    async setupServiceWorker() {
        try {
            // Registrar service worker específico para notificaciones
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.register('/sw-notifications.js', {
                    scope: '/'
                });

                await navigator.serviceWorker.ready;
                this.swRegistration = registration;

                // Escuchar mensajes del service worker
                navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));

                console.log('🔧 Service Worker de notificaciones registrado');
            }
        } catch (error) {
            console.error('❌ Error registrando Service Worker:', error);
        }
    }

    async checkExistingSubscription() {
        if (!this.swRegistration) return;

        try {
            const subscription = await this.swRegistration.pushManager.getSubscription();
            if (subscription) {
                this.subscription = subscription;
                console.log('✅ Suscripción existente encontrada');
            }
        } catch (error) {
            console.error('❌ Error verificando suscripción:', error);
        }
    }

    loadUserSession() {
        const savedUser = localStorage.getItem('bge_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    }

    loadUserPreferences() {
        if (!this.currentUser) return;

        const saved = localStorage.getItem(`bge_notifications_${this.currentUser.email}`);
        if (saved) {
            this.preferences = { ...this.preferences, ...JSON.parse(saved) };
        }
    }

    getEducationalPreferences() {
        return {
            // === NOTIFICACIONES ACADÉMICAS ===
            comunicadosOficiales: {
                enabled: true,
                priority: 'high',
                sound: true
            },
            recordatoriosExamen: {
                enabled: true,
                priority: 'high',
                anticipacion: 24 // horas antes
            },
            tareasVencimiento: {
                enabled: true,
                priority: 'normal',
                anticipacion: 2 // días antes
            },
            calificacionesNuevas: {
                enabled: true,
                priority: 'normal',
                sound: true
            },

            // === EVENTOS Y ACTIVIDADES ===
            eventosEscolares: {
                enabled: true,
                priority: 'normal',
                anticipacion: 24 // horas antes
            },
            actividadesExtracurriculares: {
                enabled: true,
                priority: 'low'
            },
            ceremoniasEspeciales: {
                enabled: true,
                priority: 'normal'
            },

            // === ADMINISTRATIVO ===
            inscripcionesAbiertas: {
                enabled: true,
                priority: 'high',
                sound: true
            },
            fechasLimiteAdministrativas: {
                enabled: true,
                priority: 'high',
                anticipacion: 48 // horas antes
            },
            documentosRequeridos: {
                enabled: true,
                priority: 'normal'
            },

            // === EMERGENCIAS Y SEGURIDAD ===
            emergenciasEscolares: {
                enabled: true,
                priority: 'urgent',
                sound: true,
                bypassQuietHours: true
            },
            alertasClimaticas: {
                enabled: true,
                priority: 'high',
                bypassQuietHours: true
            },
            suspensionClases: {
                enabled: true,
                priority: 'high',
                sound: true
            },

            // === CONFIGURACIÓN GENERAL ===
            quietHours: {
                enabled: true,
                start: 22, // 10 PM
                end: 7     // 7 AM
            },
            frequency: {
                tips: 'daily',      // daily, weekly, never
                reminders: 'daily',
                achievements: 'instant'
            }
        };
    }

    async registerServiceWorker() {
        // DESHABILITADO - Conflicto con Service Worker en index.html
        // Solo index.html debe registrar sw-stable.js para evitar ciclos infinitos
        /*
        if (!this.isSupported) return false;

        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('📱 Service Worker registrado:', registration);
            return registration;
        } catch (error) {
            console.error('❌ Error registrando Service Worker:', error);
            return false;
        }
        */
        return false; // Retornar false para mantener compatibilidad
    }

    async requestPermission() {
        if (!this.isSupported) {
            this.showFallbackNotification('Tu navegador no soporta notificaciones push');
            return false;
        }

        if (Notification.permission === 'granted') {
            this.permission = 'granted';
            return true;
        }

        if (Notification.permission === 'denied') {
            this.permission = 'denied';
            return false;
        }

        // Mostrar modal personalizado antes de pedir permiso
        this.showPermissionModal();
        return false;
    }

    showPermissionModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade show';
        modal.style.cssText = 'display: block; background: rgba(0,0,0,0.5); z-index: 2000;';
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 15px;">
                    <div class="modal-header border-0">
                        <h5 class="modal-title">🔔 Notificaciones BGE IA</h5>
                    </div>
                    <div class="modal-body">
                        <div class="text-center mb-3">
                            <div style="font-size: 3rem;">🎓</div>
                        </div>
                        <h6>¡Mejora tu experiencia educativa!</h6>
                        <p>Las notificaciones te ayudarán a:</p>
                        <ul class="list-unstyled">
                            <li>🏆 Recibir logros desbloqueados al instante</li>
                            <li>💡 Tips educativos personalizados</li>
                            <li>📚 Recordatorios de estudio inteligentes</li>
                            <li>🎮 Competencias y eventos BGE</li>
                        </ul>
                        <p class="small"><strong>Tu privacidad es importante:</strong> Solo recibirás notificaciones educativas relevantes.</p>
                    </div>
                    <div class="modal-footer border-0 justify-content-center">
                        <button class="btn btn-warning me-2" onclick="pushNotificationSystem.acceptNotifications()">
                            ✅ Activar Notificaciones
                        </button>
                        <button class="btn btn-outline-light" onclick="pushNotificationSystem.declineNotifications()">
                            ❌ Ahora No
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.permissionModal = modal;
    }

    async acceptNotifications() {
        const permission = await Notification.requestPermission();
        this.permission = permission;

        if (permission === 'granted') {
            this.showSuccessNotification();
            this.scheduleWelcomeNotification();
        }

        this.closePermissionModal();
    }

    declineNotifications() {
        this.permission = 'denied';
        this.closePermissionModal();
        this.showFallbackNotification('Puedes activar notificaciones desde configuración más tarde');
    }

    closePermissionModal() {
        if (this.permissionModal) {
            this.permissionModal.remove();
            this.permissionModal = null;
        }
    }

    showSuccessNotification() {
        if (this.permission === 'granted') {
            new Notification('🎉 ¡Notificaciones BGE Activadas!', {
                body: 'Ahora recibirás actualizaciones sobre tu progreso educativo',
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: 'bge-welcome'
            });
        }
    }

    scheduleWelcomeNotification() {
        // Notificación de bienvenida después de 5 minutos
        setTimeout(() => {
            this.sendNotification('achievement', {
                title: '🏆 ¡Primer Logro Desbloqueado!',
                body: 'Has activado las notificaciones BGE IA. +10 coins ganados.',
                data: { achievement: 'notifications_enabled', reward: 10 }
            });
        }, 5 * 60 * 1000);
    }

    scheduleEducationalNotifications() {
        if (!this.currentUser || this.permission !== 'granted') return;

        // Notificaciones diarias de estudio (solo días escolares)
        this.scheduleStudyReminders();

        // Tips educativos semanales
        this.scheduleTipsNotifications();

        // Recordatorios de racha
        this.scheduleStreakReminders();
    }

    scheduleStudyReminders() {
        if (!this.preferences.reminders) return;

        const studyTimes = this.getOptimalStudyTimes();

        studyTimes.forEach(time => {
            this.scheduleDaily(time, () => {
                this.sendNotification('reminder', {
                    title: '📚 Momento de Estudiar - BGE',
                    body: 'Es tu hora óptima de aprendizaje. ¡Desbloquea nuevos prompts IA!',
                    data: { type: 'study_reminder' }
                });
            });
        });
    }

    getOptimalStudyTimes() {
        const userRole = this.currentUser?.role || 'student';

        const times = {
            student: ['09:00', '15:00', '19:00'],
            teacher: ['08:00', '14:00'],
            parent: ['20:00'],
            admin: ['10:00']
        };

        return times[userRole] || times.student;
    }

    scheduleDaily(timeString, callback) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const now = new Date();
        const scheduledTime = new Date();

        scheduledTime.setHours(hours, minutes, 0, 0);

        // Si ya pasó la hora hoy, programar para mañana
        if (scheduledTime <= now) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        const timeUntil = scheduledTime.getTime() - now.getTime();

        setTimeout(() => {
            if (this.isActiveTime() && this.preferences.reminders) {
                callback();
                // Reprogramar para el día siguiente
                this.scheduleDaily(timeString, callback);
            }
        }, timeUntil);
    }

    isActiveTime() {
        if (!this.preferences.quietHours.enabled) return true;

        const now = new Date();
        const hour = now.getHours();
        const { start, end } = this.preferences.quietHours;

        if (start > end) {
            // Atraviesa medianoche (ej: 22:00 - 07:00)
            return !(hour >= start || hour < end);
        } else {
            // Mismo día (ej: 08:00 - 22:00)
            return hour >= end && hour < start;
        }
    }

    scheduleTipsNotifications() {
        if (!this.preferences.tips) return;

        // Tips educativos cada 3 días
        setInterval(() => {
            if (this.isActiveTime()) {
                this.sendEducationalTip();
            }
        }, 3 * 24 * 60 * 60 * 1000); // 3 días
    }

    sendEducationalTip() {
        const tips = this.getEducationalTips();
        const randomTip = tips[Math.floor(Math.random() * tips.length)];

        this.sendNotification('tip', {
            title: `💡 Tip BGE: ${randomTip.subject}`,
            body: randomTip.tip,
            data: { type: 'educational_tip', subject: randomTip.subject }
        });
    }

    getEducationalTips() {
        return [
            {
                subject: 'Matemáticas',
                tip: 'Resolver problemas paso a paso mejora la comprensión un 40%'
            },
            {
                subject: 'Física',
                tip: 'Visualizar fuerzas con diagramas simplifica los problemas complejos'
            },
            {
                subject: 'Química',
                tip: 'Practicar balanceo de ecuaciones 10 min diarios mejora la química general'
            },
            {
                subject: 'Biología',
                tip: 'Conectar teoría con ejemplos reales aumenta retención un 60%'
            },
            {
                subject: 'Estudio General',
                tip: 'Sesiones de 25 minutos con descansos de 5 optimizan el aprendizaje'
            }
        ];
    }

    scheduleStreakReminders() {
        // Recordatorio si no ha usado el sistema en 2 días
        setInterval(() => {
            this.checkStreakStatus();
        }, 24 * 60 * 60 * 1000); // Diario
    }

    checkStreakStatus() {
        if (!this.currentUser) return;

        const lastSession = localStorage.getItem(`bge_last_session_${this.currentUser.email}`);
        if (!lastSession) return;

        const daysSinceLastSession = Math.floor(
            (Date.now() - new Date(lastSession).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastSession >= 2) {
            this.sendNotification('streak', {
                title: '🔥 ¡Tu racha BGE te extraña!',
                body: `Han pasado ${daysSinceLastSession} días. ¡Vuelve para mantener tu progreso IA!`,
                data: { type: 'streak_reminder', days: daysSinceLastSession }
            });
        }
    }

    sendNotification(type, options) {
        if (this.permission !== 'granted') {
            this.showFallbackNotification(options.body);
            return;
        }

        if (!this.preferences[type]) return;

        const notification = new Notification(options.title, {
            body: options.body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: `bge-${type}-${Date.now()}`,
            data: options.data,
            requireInteraction: type === 'achievement',
            silent: type === 'tip'
        });

        notification.onclick = () => {
            window.focus();
            this.handleNotificationClick(type, options.data);
            notification.close();
        };

        // Auto-cerrar después de 8 segundos
        setTimeout(() => {
            notification.close();
        }, 8000);

        // Tracking
        if (window.analyticsSystem) {
            window.analyticsSystem.trackEvent('notification_sent', {
                type,
                title: options.title
            });
        }
    }

    handleNotificationClick(type, data) {
        switch (type) {
            case 'achievement':
                if (window.achievementSystem) {
                    window.achievementSystem.showAchievements();
                }
                break;
            case 'reminder':
                if (window.aiVaultModal) {
                    window.aiVaultModal.show();
                }
                break;
            case 'tip':
                // Mostrar tip específico
                break;
            case 'streak':
                // Abrir dashboard de progreso
                break;
        }
    }

    showFallbackNotification(message) {
        // Notificación in-app si no hay permisos push
        const notification = document.createElement('div');
        notification.className = 'alert alert-info alert-dismissible fade show position-fixed';
        notification.style.cssText = 'top: 100px; right: 20px; z-index: 1060; max-width: 350px;';
        notification.innerHTML = `
            <strong>🔔 BGE:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // API pública
    sendAchievementNotification(achievement) {
        this.sendNotification('achievement', {
            title: `🏆 ¡${achievement.title} Desbloqueado!`,
            body: `Has ganado ${achievement.reward.coins} coins y ${achievement.reward.xp} XP`,
            data: { achievement: achievement.id, reward: achievement.reward }
        });
    }

    sendCompetitionNotification(competition) {
        this.sendNotification('competitions', {
            title: `🎮 Nueva Competencia BGE`,
            body: competition.description,
            data: { competition: competition.id }
        });
    }

    sendNewPromptNotification(prompt) {
        this.sendNotification('newPrompts', {
            title: `🤖 Nuevo Prompt IA Desbloqueado`,
            body: `"${prompt.title}" ahora disponible en tu bóveda IA`,
            data: { prompt: prompt.id }
        });
    }

    updatePreferences(newPreferences) {
        this.preferences = { ...this.preferences, ...newPreferences };

        if (this.currentUser) {
            localStorage.setItem(
                `bge_notifications_${this.currentUser.email}`,
                JSON.stringify(this.preferences)
            );
        }
    }

    openSettings() {
        // Mostrar modal de configuración de notificaciones
        this.showSettingsModal();
    }

    showSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade show';
        modal.style.cssText = 'display: block; background: rgba(0,0,0,0.5); z-index: 2000;';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">🔔 Configuración de Notificaciones</h5>
                        <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
                    </div>
                    <div class="modal-body">
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" id="notif-achievements" ${this.preferences.achievements ? 'checked' : ''}>
                            <label class="form-check-label" for="notif-achievements">
                                🏆 Logros desbloqueados
                            </label>
                        </div>
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" id="notif-tips" ${this.preferences.tips ? 'checked' : ''}>
                            <label class="form-check-label" for="notif-tips">
                                💡 Tips educativos
                            </label>
                        </div>
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" id="notif-reminders" ${this.preferences.reminders ? 'checked' : ''}>
                            <label class="form-check-label" for="notif-reminders">
                                📚 Recordatorios de estudio
                            </label>
                        </div>
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" id="notif-competitions" ${this.preferences.competitions ? 'checked' : ''}>
                            <label class="form-check-label" for="notif-competitions">
                                🎮 Competencias y eventos
                            </label>
                        </div>
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" id="notif-quiet" ${this.preferences.quietHours.enabled ? 'checked' : ''}>
                            <label class="form-check-label" for="notif-quiet">
                                🌙 Horario silencioso (10 PM - 7 AM)
                            </label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" onclick="pushNotificationSystem.saveSettings(); this.closest('.modal').remove();">
                            Guardar Configuración
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    saveSettings() {
        this.updatePreferences({
            achievements: document.getElementById('notif-achievements').checked,
            tips: document.getElementById('notif-tips').checked,
            reminders: document.getElementById('notif-reminders').checked,
            competitions: document.getElementById('notif-competitions').checked,
            quietHours: {
                ...this.preferences.quietHours,
                enabled: document.getElementById('notif-quiet').checked
            }
        });

        this.showFallbackNotification('Configuración de notificaciones guardada');
    }
}

// Funciones globales
function openNotificationSettings() {
    if (window.pushNotificationSystem) {
        window.pushNotificationSystem.openSettings();
    }
}

// Inicializar sistema BGE
document.addEventListener('DOMContentLoaded', function() {
    window.bgeNotifications = new BGEPushNotificationSystem();

    // Mantener compatibilidad con código existente
    window.pushNotificationSystem = window.bgeNotifications;

    // Integrar con sistemas existentes
    setTimeout(() => {
        // Hook para achievement system
        if (window.achievementSystem) {
            const originalUnlock = window.achievementSystem.unlockAchievement;
            window.achievementSystem.unlockAchievement = function(achievement) {
                originalUnlock.call(this, achievement);
                if (window.bgeNotifications) {
                    window.bgeNotifications.sendAchievementNotification(achievement);
                }
            };
        }

        // Hook para sistema de calificaciones
        if (window.gradesSystem) {
            const originalUpdate = window.gradesSystem.updateGrades;
            window.gradesSystem.updateGrades = function(data) {
                originalUpdate.call(this, data);
                if (window.bgeNotifications && data.nuevasCalificaciones) {
                    window.bgeNotifications.sendCalificacionesDisponibles(data);
                }
            };
        }

        // Hook para sistema de eventos
        if (window.eventsManager) {
            const originalAdd = window.eventsManager.addEvent;
            window.eventsManager.addEvent = function(event) {
                originalAdd.call(this, event);
                if (window.bgeNotifications && event.notificar) {
                    window.bgeNotifications.sendEventoProximo(event);
                }
            };
        }
    }, 2000);
});