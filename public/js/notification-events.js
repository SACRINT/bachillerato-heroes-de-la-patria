/**
 * NOTIFICATION EVENTS - Sistema de Notificaciones Automáticas para Eventos
 * Bachillerato General Estatal "Héroes de la Patria"
 * Versión 1.0 - Septiembre 2025
 *
 * Sistema inteligente para detectar y notificar eventos importantes:
 * - Monitoreo de cambios en datos
 * - Notificaciones automáticas contextuales
 * - Programación de recordatorios
 * - Detección de eventos críticos
 */

class NotificationEvents {
    constructor() {
        this.notificationManager = window.heroesNotifications;
        this.lastChecked = new Date();
        this.monitoringIntervals = [];
        this.eventQueue = [];

        console.log('🎯 Notification Events system initializing...');

        this.init();
    }

    async init() {
        if (!this.notificationManager) {
            console.warn('⚠️ NotificationManager not available, retrying in 2 seconds...');
            setTimeout(() => this.init(), 2000);
            return;
        }

        await this.setupEventMonitoring();
        this.startPeriodicChecks();
        this.setupContentObservers();

        console.log('✅ Notification Events system ready');
    }

    // === CONFIGURACIÓN DE MONITOREO ===
    async setupEventMonitoring() {
        // Monitorear cambios en noticias
        this.setupNewsMonitoring();

        // Monitorear eventos del calendario
        this.setupCalendarMonitoring();

        // Monitorear cambios académicos
        this.setupAcademicMonitoring();

        // Monitorear comunicados de emergencia
        this.setupEmergencyMonitoring();

        // Monitorear avisos importantes
        this.setupAnnouncementMonitoring();
    }

    setupNewsMonitoring() {
        const checkNews = async () => {
            try {
                const response = await fetch('./data/noticias.json');
                const newsData = await response.json();

                if (newsData.noticias && Array.isArray(newsData.noticias)) {
                    await this.checkForNewNews(newsData.noticias);
                }
            } catch (error) {
                console.warn('⚠️ Failed to check news:', error);
            }
        };

        // Check every 15 minutes
        const interval = setInterval(checkNews, 15 * 60 * 1000);
        this.monitoringIntervals.push(interval);

        // Initial check
        checkNews();
    }

    setupCalendarMonitoring() {
        const checkEvents = async () => {
            try {
                const response = await fetch('./data/eventos.json');
                const eventsData = await response.json();

                if (eventsData.eventos && Array.isArray(eventsData.eventos)) {
                    await this.checkForUpcomingEvents(eventsData.eventos);
                }
            } catch (error) {
                console.warn('⚠️ Failed to check events:', error);
            }
        };

        // Check every 30 minutes
        const interval = setInterval(checkEvents, 30 * 60 * 1000);
        this.monitoringIntervals.push(interval);

        checkEvents();
    }

    setupAcademicMonitoring() {
        const checkAcademic = async () => {
            try {
                // Check for grade publications
                await this.checkGradeNotifications();

                // Check for important academic dates
                await this.checkAcademicDeadlines();

                // Check for schedule changes
                await this.checkScheduleChanges();

            } catch (error) {
                console.warn('⚠️ Failed to check academic updates:', error);
            }
        };

        // Check every hour
        const interval = setInterval(checkAcademic, 60 * 60 * 1000);
        this.monitoringIntervals.push(interval);

        checkAcademic();
    }

    setupEmergencyMonitoring() {
        const checkEmergencies = async () => {
            try {
                const response = await fetch('./data/avisos.json');
                const avisosData = await response.json();

                if (avisosData.avisos && Array.isArray(avisosData.avisos)) {
                    await this.checkForEmergencyNotices(avisosData.avisos);
                }
            } catch (error) {
                console.warn('⚠️ Failed to check emergency notices:', error);
            }
        };

        // Check every 5 minutes for emergencies
        const interval = setInterval(checkEmergencies, 5 * 60 * 1000);
        this.monitoringIntervals.push(interval);

        checkEmergencies();
    }

    setupAnnouncementMonitoring() {
        const checkAnnouncements = async () => {
            try {
                const response = await fetch('./data/comunicados.json');
                const comunicadosData = await response.json();

                if (comunicadosData.comunicados && Array.isArray(comunicadosData.comunicados)) {
                    await this.checkForNewAnnouncements(comunicadosData.comunicados);
                }
            } catch (error) {
                console.warn('⚠️ Failed to check announcements:', error);
            }
        };

        // Check every 20 minutes
        const interval = setInterval(checkAnnouncements, 20 * 60 * 1000);
        this.monitoringIntervals.push(interval);

        checkAnnouncements();
    }

    // === DETECTORES DE EVENTOS ===
    async checkForNewNews(noticias) {
        const lastNewsCheck = this.getLastEventCheck('news');
        const newNews = noticias.filter(noticia => {
            const publishDate = new Date(noticia.fecha);
            return publishDate > lastNewsCheck && this.isRecentNews(publishDate);
        });

        for (const noticia of newNews) {
            await this.sendNewsNotification(noticia);
        }

        if (newNews.length > 0) {
            this.updateLastEventCheck('news');
        }
    }

    async checkForUpcomingEvents(eventos) {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        for (const evento of eventos) {
            const eventDate = new Date(evento.fecha);

            // Notification 1 day before
            if (this.isSameDay(eventDate, tomorrow) && !this.hasNotifiedForEvent(evento.id, '1day')) {
                await this.sendEventReminder(evento, '1day');
                this.markEventNotified(evento.id, '1day');
            }

            // Notification 1 week before
            if (this.isSameDay(eventDate, nextWeek) && !this.hasNotifiedForEvent(evento.id, '1week')) {
                await this.sendEventReminder(evento, '1week');
                this.markEventNotified(evento.id, '1week');
            }

            // Notification 1 hour before (for today's events)
            if (this.isSameDay(eventDate, now)) {
                const hoursBefore = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                if (hoursBefore <= 1 && hoursBefore > 0 && !this.hasNotifiedForEvent(evento.id, '1hour')) {
                    await this.sendEventReminder(evento, '1hour');
                    this.markEventNotified(evento.id, '1hour');
                }
            }
        }
    }

    async checkGradeNotifications() {
        // Simulate grade publication check
        // In a real implementation, this would check for new grade postings
        const lastGradeCheck = this.getLastEventCheck('grades');
        const mockGradeUpdate = this.simulateGradeUpdate();

        if (mockGradeUpdate && mockGradeUpdate.timestamp > lastGradeCheck) {
            await this.sendGradeNotification(mockGradeUpdate);
            this.updateLastEventCheck('grades');
        }
    }

    async checkAcademicDeadlines() {
        const academicDates = this.getAcademicImportantDates();
        const now = new Date();

        for (const date of academicDates) {
            const deadline = new Date(date.fecha);
            const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            // Notify 3 days before deadline
            if (daysUntil === 3 && !this.hasNotifiedForEvent(date.id, 'deadline_3days')) {
                await this.sendDeadlineNotification(date, '3 días');
                this.markEventNotified(date.id, 'deadline_3days');
            }

            // Notify 1 day before deadline
            if (daysUntil === 1 && !this.hasNotifiedForEvent(date.id, 'deadline_1day')) {
                await this.sendDeadlineNotification(date, '1 día');
                this.markEventNotified(date.id, 'deadline_1day');
            }
        }
    }

    async checkScheduleChanges() {
        // This would integrate with a schedule management system
        const scheduleChanges = this.getRecentScheduleChanges();

        for (const change of scheduleChanges) {
            if (!this.hasNotifiedForEvent(change.id, 'schedule_change')) {
                await this.sendScheduleChangeNotification(change);
                this.markEventNotified(change.id, 'schedule_change');
            }
        }
    }

    async checkForEmergencyNotices(avisos) {
        const lastEmergencyCheck = this.getLastEventCheck('emergency');
        const emergencyNotices = avisos.filter(aviso => {
            const publishDate = new Date(aviso.fecha);
            return publishDate > lastEmergencyCheck && aviso.tipo === 'emergencia';
        });

        for (const aviso of emergencyNotices) {
            await this.sendEmergencyNotification(aviso);
        }

        if (emergencyNotices.length > 0) {
            this.updateLastEventCheck('emergency');
        }
    }

    async checkForNewAnnouncements(comunicados) {
        const lastAnnouncementCheck = this.getLastEventCheck('announcements');
        const newAnnouncements = comunicados.filter(comunicado => {
            const publishDate = new Date(comunicado.fecha);
            return publishDate > lastAnnouncementCheck && this.isRecentAnnouncement(publishDate);
        });

        for (const comunicado of newAnnouncements) {
            await this.sendAnnouncementNotification(comunicado);
        }

        if (newAnnouncements.length > 0) {
            this.updateLastEventCheck('announcements');
        }
    }

    // === ENVÍO DE NOTIFICACIONES ESPECÍFICAS ===
    async sendNewsNotification(noticia) {
        await this.notificationManager.sendNotification(
            'news',
            noticia.titulo,
            {
                body: noticia.resumen || noticia.contenido.substring(0, 100) + '...',
                url: `./index.html#noticia-${noticia.id}`,
                image: noticia.imagen,
                actions: [
                    { action: 'read', title: 'Leer noticia', icon: './images/icons/read.png' },
                    { action: 'share', title: 'Compartir', icon: './images/icons/share.png' }
                ]
            }
        );

        console.log('📰 News notification sent:', noticia.titulo);
    }

    async sendEventReminder(evento, timing) {
        const timingText = {
            '1week': 'la próxima semana',
            '1day': 'mañana',
            '1hour': 'en 1 hora'
        };

        await this.notificationManager.sendNotification(
            'events',
            `Recordatorio: ${evento.titulo}`,
            {
                body: `El evento "${evento.titulo}" será ${timingText[timing]}. ${evento.descripcion || ''}`,
                url: `./calendario.html#evento-${evento.id}`,
                requireInteraction: timing === '1hour',
                actions: [
                    { action: 'view', title: 'Ver evento', icon: './images/icons/calendar.png' },
                    { action: 'remind', title: 'Recordar después', icon: './images/icons/reminder.png' }
                ]
            }
        );

        console.log('📅 Event reminder sent:', evento.titulo, timing);
    }

    async sendGradeNotification(gradeUpdate) {
        await this.notificationManager.sendNotification(
            'academic',
            'Nuevas Calificaciones Disponibles',
            {
                body: `Se han publicado nuevas calificaciones para ${gradeUpdate.materia}. Revisa tu expediente académico.`,
                url: './calificaciones.html',
                requireInteraction: true,
                actions: [
                    { action: 'view', title: 'Ver calificaciones', icon: './images/icons/grades.png' },
                    { action: 'download', title: 'Descargar', icon: './images/icons/download.png' }
                ]
            }
        );

        console.log('🎓 Grade notification sent:', gradeUpdate.materia);
    }

    async sendDeadlineNotification(deadline, timeRemaining) {
        await this.notificationManager.sendNotification(
            'academic',
            `Fecha límite: ${deadline.titulo}`,
            {
                body: `Quedan ${timeRemaining} para ${deadline.descripcion}. No olvides completar tu proceso.`,
                url: deadline.url || './estudiantes.html',
                requireInteraction: timeRemaining === '1 día',
                actions: [
                    { action: 'open', title: 'Ir al proceso', icon: './images/icons/open.png' },
                    { action: 'remind', title: 'Recordar más tarde', icon: './images/icons/reminder.png' }
                ]
            }
        );

        console.log('⏰ Deadline notification sent:', deadline.titulo);
    }

    async sendScheduleChangeNotification(change) {
        await this.notificationManager.sendNotification(
            'academic',
            'Cambio en Horario',
            {
                body: `${change.descripcion}. Revisa tu horario actualizado.`,
                url: './estudiantes.html#horarios',
                requireInteraction: true,
                actions: [
                    { action: 'view', title: 'Ver horario', icon: './images/icons/schedule.png' },
                    { action: 'download', title: 'Descargar PDF', icon: './images/icons/download.png' }
                ]
            }
        );

        console.log('📋 Schedule change notification sent:', change.descripcion);
    }

    async sendEmergencyNotification(aviso) {
        await this.notificationManager.sendNotification(
            'emergency',
            `🚨 EMERGENCIA: ${aviso.titulo}`,
            {
                body: aviso.contenido,
                url: `./index.html#aviso-${aviso.id}`,
                requireInteraction: true,
                emergency: true,
                actions: [
                    { action: 'acknowledge', title: 'Entendido', icon: './images/icons/check.png' },
                    { action: 'details', title: 'Ver detalles', icon: './images/icons/info.png' }
                ]
            }
        );

        console.log('🚨 Emergency notification sent:', aviso.titulo);
    }

    async sendAnnouncementNotification(comunicado) {
        await this.notificationManager.sendNotification(
            'announcements',
            comunicado.titulo,
            {
                body: comunicado.resumen || comunicado.contenido.substring(0, 100) + '...',
                url: `./index.html#comunicado-${comunicado.id}`,
                actions: [
                    { action: 'read', title: 'Leer comunicado', icon: './images/icons/read.png' },
                    { action: 'dismiss', title: 'Cerrar', icon: './images/icons/close.png' }
                ]
            }
        );

        console.log('📢 Announcement notification sent:', comunicado.titulo);
    }

    // === VERIFICACIONES Y UTILIDADES ===
    startPeriodicChecks() {
        // Check for immediate notifications every 5 minutes
        const immediateCheck = setInterval(() => {
            this.processEventQueue();
        }, 5 * 60 * 1000);

        this.monitoringIntervals.push(immediateCheck);

        // Daily maintenance at midnight
        const dailyMaintenance = setInterval(() => {
            const now = new Date();
            if (now.getHours() === 0 && now.getMinutes() < 5) {
                this.performDailyMaintenance();
            }
        }, 60 * 1000); // Check every minute

        this.monitoringIntervals.push(dailyMaintenance);
    }

    setupContentObservers() {
        // Observe changes in the DOM for real-time content updates
        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        this.handleContentChange(mutation);
                    }
                });
            });

            // Observe news and events containers
            const newsContainer = document.querySelector('.noticias-container');
            const eventsContainer = document.querySelector('.eventos-container');

            if (newsContainer) {
                observer.observe(newsContainer, { childList: true, subtree: true });
            }

            if (eventsContainer) {
                observer.observe(eventsContainer, { childList: true, subtree: true });
            }
        }
    }

    handleContentChange(mutation) {
        // React to real-time content changes
        if (mutation.addedNodes.length > 0) {
            console.log('📝 Content change detected, checking for new notifications...');

            // Debounce to avoid excessive checks
            clearTimeout(this.contentChangeTimeout);
            this.contentChangeTimeout = setTimeout(() => {
                this.checkAllSources();
            }, 5000);
        }
    }

    async checkAllSources() {
        // Trigger all monitoring functions
        try {
            const promises = [
                this.setupNewsMonitoring(),
                this.setupCalendarMonitoring(),
                this.setupAcademicMonitoring(),
                this.setupAnnouncementMonitoring()
            ];

            await Promise.all(promises);
            console.log('🔄 All sources checked for updates');
        } catch (error) {
            console.error('❌ Error checking sources:', error);
        }
    }

    // === GESTIÓN DE ESTADO ===
    getLastEventCheck(eventType) {
        const key = `heroesPatria_lastEventCheck_${eventType}`;
        const saved = localStorage.getItem(key);
        return saved ? new Date(saved) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24 hours ago
    }

    updateLastEventCheck(eventType) {
        const key = `heroesPatria_lastEventCheck_${eventType}`;
        localStorage.setItem(key, new Date().toISOString());
    }

    hasNotifiedForEvent(eventId, notificationType) {
        const key = `heroesPatria_notified_${eventId}_${notificationType}`;
        return localStorage.getItem(key) === 'true';
    }

    markEventNotified(eventId, notificationType) {
        const key = `heroesPatria_notified_${eventId}_${notificationType}`;
        localStorage.setItem(key, 'true');

        // Clean up old notifications (keep for 30 days)
        setTimeout(() => {
            localStorage.removeItem(key);
        }, 30 * 24 * 60 * 60 * 1000);
    }

    // === SIMULACIONES Y DATOS MOCK ===
    simulateGradeUpdate() {
        // In production, this would check against real grade system
        const random = Math.random();
        if (random < 0.1) { // 10% chance of grade update
            return {
                materia: 'Matemáticas',
                timestamp: new Date(),
                tipo: 'calificacion_parcial'
            };
        }
        return null;
    }

    getAcademicImportantDates() {
        // In production, load from academic calendar
        const now = new Date();
        return [
            {
                id: 'inscripciones_2025',
                titulo: 'Fecha límite de inscripciones',
                descripcion: 'el proceso de inscripciones para el próximo periodo',
                fecha: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
                url: './estudiantes.html#inscripciones'
            },
            {
                id: 'examenes_finales',
                titulo: 'Exámenes finales',
                descripcion: 'los exámenes finales del semestre',
                fecha: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
                url: './estudiantes.html#examenes'
            }
        ];
    }

    getRecentScheduleChanges() {
        // In production, this would integrate with schedule management system
        return []; // No schedule changes by default
    }

    // === UTILIDADES ===
    isRecentNews(date) {
        const now = new Date();
        const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
        return diffHours <= 24; // News from last 24 hours
    }

    isRecentAnnouncement(date) {
        const now = new Date();
        const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
        return diffHours <= 48; // Announcements from last 48 hours
    }

    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    processEventQueue() {
        // Process any queued events
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            this.handleQueuedEvent(event);
        }
    }

    handleQueuedEvent(event) {
        console.log('📋 Processing queued event:', event);
        // Process the event based on its type
    }

    performDailyMaintenance() {
        console.log('🧹 Performing daily maintenance...');

        // Clean up old notification flags
        const keys = Object.keys(localStorage);
        const notificationKeys = keys.filter(key => key.startsWith('heroesPatria_notified_'));

        notificationKeys.forEach(key => {
            // Remove notifications older than 30 days
            const timestamp = localStorage.getItem(key + '_timestamp');
            if (timestamp) {
                const age = Date.now() - parseInt(timestamp);
                if (age > 30 * 24 * 60 * 60 * 1000) {
                    localStorage.removeItem(key);
                    localStorage.removeItem(key + '_timestamp');
                }
            }
        });
    }

    // === CLEANUP ===
    destroy() {
        // Clear all intervals
        this.monitoringIntervals.forEach(interval => {
            clearInterval(interval);
        });

        this.monitoringIntervals = [];
        console.log('🗑️ Notification Events system destroyed');
    }
}

// === INICIALIZACIÓN ===
window.NotificationEvents = NotificationEvents;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.heroesNotificationEvents = new NotificationEvents();
    });
} else {
    window.heroesNotificationEvents = new NotificationEvents();
}

console.log('🎯 Notification Events system loaded successfully');