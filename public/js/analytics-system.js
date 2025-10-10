/**
 * 📊 SISTEMA DE ANALYTICS BGE - MÉTRICAS EDUCATIVAS IA
 * Seguimiento completo del uso del sistema gamificado
 */

class AnalyticsSystem {
    constructor() {
        this.currentUser = null;
        this.sessionStart = new Date();
        this.events = [];
        this.metrics = {
            sessions: 0,
            promptsUsed: 0,
            achievementsUnlocked: 0,
            totalTimeSpent: 0,
            subjectFocus: {},
            peakUsageHours: {},
            streakDays: 0
        };
        this.init();
    }

    init() {
        this.loadUserSession();
        this.loadStoredMetrics();
        this.trackSession();
        this.setupPerformanceMonitoring();
    }

    loadUserSession() {
        const savedUser = localStorage.getItem('bge_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    }

    loadStoredMetrics() {
        if (!this.currentUser) return;

        const storedMetrics = localStorage.getItem(`bge_analytics_${this.currentUser.email}`);
        if (storedMetrics) {
            this.metrics = { ...this.metrics, ...JSON.parse(storedMetrics) };
        }
    }

    trackSession() {
        if (!this.currentUser) return;

        this.metrics.sessions++;
        this.trackEvent('session_start', {
            timestamp: this.sessionStart,
            userRole: this.currentUser.role,
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });

        // Actualizar racha de días
        this.updateStreakDays();

        // Guardar automáticamente cada 30 segundos
        setInterval(() => {
            this.saveMetrics();
        }, 30000);

        // Tracking al cerrar la ventana
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
        });
    }

    trackEvent(eventType, data = {}) {
        const event = {
            id: this.generateEventId(),
            type: eventType,
            timestamp: new Date().toISOString(),
            user: this.currentUser?.email || 'anonymous',
            userRole: this.currentUser?.role || 'unknown',
            data: data,
            sessionId: this.sessionStart.getTime()
        };

        this.events.push(event);

        // Mantener solo últimos 1000 eventos en memoria
        if (this.events.length > 1000) {
            this.events = this.events.slice(-1000);
        }

        // Procesar métricas específicas
        this.processEventMetrics(eventType, data);

        // Log para debug (solo en desarrollo)
        if (window.location.hostname === 'localhost') {
            console.log('📊 BGE Analytics:', eventType, data);
        }
    }

    processEventMetrics(eventType, data) {
        const hour = new Date().getHours();

        // Actualizar métricas de uso por hora
        this.metrics.peakUsageHours[hour] = (this.metrics.peakUsageHours[hour] || 0) + 1;

        switch (eventType) {
            case 'prompt_used':
                this.metrics.promptsUsed++;
                if (data.subject) {
                    this.metrics.subjectFocus[data.subject] =
                        (this.metrics.subjectFocus[data.subject] || 0) + 1;
                }
                break;

            case 'achievement_unlocked':
                this.metrics.achievementsUnlocked++;
                break;

            case 'tip_viewed':
                // Tracking de engagement con tips
                break;

            case 'ai_vault_opened':
                // Tracking de acceso a IA
                break;
        }
    }

    updateStreakDays() {
        const today = new Date().toDateString();
        const lastSession = localStorage.getItem(`bge_last_session_${this.currentUser.email}`);

        if (lastSession) {
            const lastDate = new Date(lastSession);
            const todayDate = new Date(today);
            const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

            if (daysDiff === 1) {
                // Día consecutivo
                this.metrics.streakDays++;
            } else if (daysDiff > 1) {
                // Se rompió la racha
                this.metrics.streakDays = 1;
            }
            // Si daysDiff === 0, es el mismo día, no cambiar racha
        } else {
            // Primera sesión
            this.metrics.streakDays = 1;
        }

        localStorage.setItem(`bge_last_session_${this.currentUser.email}`, today);
    }

    trackSessionEnd() {
        const sessionDuration = Date.now() - this.sessionStart.getTime();
        this.metrics.totalTimeSpent += sessionDuration;

        this.trackEvent('session_end', {
            duration: sessionDuration,
            eventsInSession: this.events.filter(e => e.sessionId === this.sessionStart.getTime()).length
        });

        this.saveMetrics();
    }

    setupPerformanceMonitoring() {
        // Monitoring de performance del sistema
        if ('performance' in window) {
            // Tiempo de carga inicial
            window.addEventListener('load', () => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    this.trackEvent('performance_load', {
                        loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.loadEventStart,
                        totalPageLoad: perfData.loadEventEnd - perfData.loadEventStart
                    });
                }
            });

            // Errores JavaScript
            window.addEventListener('error', (e) => {
                this.trackEvent('javascript_error', {
                    message: e.message,
                    source: e.filename,
                    line: e.lineno,
                    column: e.colno
                });
            });
        }
    }

    generateEventId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    saveMetrics() {
        if (!this.currentUser) return;

        localStorage.setItem(
            `bge_analytics_${this.currentUser.email}`,
            JSON.stringify(this.metrics)
        );

        // También guardar eventos recientes
        localStorage.setItem(
            `bge_events_${this.currentUser.email}`,
            JSON.stringify(this.events.slice(-100)) // Últimos 100 eventos
        );
    }

    getMetricsReport() {
        if (!this.currentUser) return null;

        const averageSessionTime = this.metrics.sessions > 0 ?
            this.metrics.totalTimeSpent / this.metrics.sessions : 0;

        const topSubject = Object.keys(this.metrics.subjectFocus).reduce((a, b) =>
            this.metrics.subjectFocus[a] > this.metrics.subjectFocus[b] ? a : b, ''
        );

        const peakHour = Object.keys(this.metrics.peakUsageHours).reduce((a, b) =>
            this.metrics.peakUsageHours[a] > this.metrics.peakUsageHours[b] ? a : b, '0'
        );

        return {
            user: {
                email: this.currentUser.email,
                role: this.currentUser.role,
                name: this.currentUser.name
            },
            usage: {
                totalSessions: this.metrics.sessions,
                totalTimeSpent: this.formatDuration(this.metrics.totalTimeSpent),
                averageSessionTime: this.formatDuration(averageSessionTime),
                streakDays: this.metrics.streakDays,
                promptsUsed: this.metrics.promptsUsed,
                achievementsUnlocked: this.metrics.achievementsUnlocked
            },
            patterns: {
                topSubject: topSubject || 'No determinado',
                peakUsageHour: `${peakHour}:00`,
                subjectDistribution: this.metrics.subjectFocus,
                hourlyUsage: this.metrics.peakUsageHours
            },
            engagement: {
                engagementScore: this.calculateEngagementScore(),
                userLevel: this.getUserLevel(),
                progressRate: this.calculateProgressRate()
            }
        };
    }

    calculateEngagementScore() {
        // Algoritmo de engagement basado en múltiples factores
        let score = 0;

        // Racha de días (40% del score)
        score += Math.min(this.metrics.streakDays * 2, 40);

        // Uso de prompts (30% del score)
        score += Math.min(this.metrics.promptsUsed * 0.5, 30);

        // Logros desbloqueados (20% del score)
        score += Math.min(this.metrics.achievementsUnlocked * 5, 20);

        // Sesiones totales (10% del score)
        score += Math.min(this.metrics.sessions * 0.2, 10);

        return Math.round(score);
    }

    getUserLevel() {
        // Obtener nivel del sistema de progreso
        if (!this.currentUser) return 1;

        const progress = localStorage.getItem(`bge_progress_${this.currentUser.email}`);
        if (progress) {
            return JSON.parse(progress).level || 1;
        }
        return 1;
    }

    calculateProgressRate() {
        // Calcular tasa de progreso basada en tiempo vs logros
        if (this.metrics.sessions === 0) return 0;

        const progressPoints = this.metrics.promptsUsed + (this.metrics.achievementsUnlocked * 5);
        return Math.round((progressPoints / this.metrics.sessions) * 100) / 100;
    }

    formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        return `${minutes}m`;
    }

    // API pública para otros sistemas
    trackPromptUsage(promptId, subject = null) {
        this.trackEvent('prompt_used', { promptId, subject });
    }

    trackAchievementUnlock(achievementId) {
        this.trackEvent('achievement_unlocked', { achievementId });
    }

    trackTipViewed(tipId, category) {
        this.trackEvent('tip_viewed', { tipId, category });
    }

    trackAIVaultAccess() {
        this.trackEvent('ai_vault_opened');
    }

    trackProfileView() {
        this.trackEvent('profile_viewed');
    }

    // Método para exportar datos (para directivos)
    exportAnalyticsData() {
        const report = this.getMetricsReport();
        const exportData = {
            generatedAt: new Date().toISOString(),
            user: report.user,
            metrics: report,
            rawEvents: this.events.slice(-500) // Últimos 500 eventos
        };

        return JSON.stringify(exportData, null, 2);
    }
}

// Funciones globales para tracking
function trackEvent(eventType, data) {
    if (window.analyticsSystem) {
        window.analyticsSystem.trackEvent(eventType, data);
    }
}

function getAnalyticsReport() {
    if (window.analyticsSystem) {
        return window.analyticsSystem.getMetricsReport();
    }
    return null;
}

// Inicializar sistema
document.addEventListener('DOMContentLoaded', function() {
    window.analyticsSystem = new AnalyticsSystem();

    // Integrar con sistemas existentes
    setTimeout(() => {
        // Hook para achievement system
        if (window.achievementSystem) {
            const originalUnlock = window.achievementSystem.unlockAchievement;
            window.achievementSystem.unlockAchievement = function(achievement) {
                originalUnlock.call(this, achievement);
                trackEvent('achievement_unlocked', { achievementId: achievement.id });
            };
        }

        // Hook para AI vault
        if (window.aiVaultModal) {
            const originalShow = window.aiVaultModal.show;
            window.aiVaultModal.show = function() {
                originalShow.call(this);
                trackEvent('ai_vault_opened');
            };
        }
    }, 2000);
});