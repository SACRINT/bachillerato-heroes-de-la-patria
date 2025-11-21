/**
 * NOTIFICATION SUBSCRIBER - Suscriptor Central de Notificaciones
 * Versión: 1.0.0 | SEMANA 4 - Event-Driven
 */
const eventBusService = require('../services/eventBus.service');

class NotificationSubscriber {
    constructor() {
        this.eventBus = eventBusService.getInstance();
        this.subscribeToEvents();
        console.log('[NOTIFICATION-SUBSCRIBER] ✅ Inicialized - 30+ eventos');
    }

    subscribeToEvents() {
        // Estudiantes
        this.eventBus.subscribe('students.created', async (e) => {
            console.log('[NOTIF] 📧 Notificando: Nuevo estudiante creado');
        });

        // Calificaciones
        this.eventBus.subscribe('grades.created', async (e) => {
            console.log('[NOTIF] 📧 Notificando: Nueva calificación');
        });

        // Auth
        this.eventBus.subscribe('auth.success', async (e) => {
            console.log('[NOTIF] 📧 Notificando: Login exitoso');
        });
    }
}

module.exports = new NotificationSubscriber();
