/**
 * 📱 SERVICIO DE NOTIFICACIONES PUSH - BGE HÉROES DE LA PATRIA
 * Sistema completo de notificaciones push para web y móvil
 */

const webpush = require('web-push');
const devLogger = require('../utils/devLogger.js');
const path = require('path');
const fs = require('fs').promises;
const cron = require('node-cron');

class PushNotificationService {
    constructor() {
        this.subscribers = new Map(); // In-memory storage (should be database in production)
        this.subscriptionsFile = path.join(__dirname, '../data/push-subscriptions.json');
        this.notificationQueue = [];
        this.isInitialized = false;
        this.config = {
            vapidKeys: {
                publicKey: process.env.VAPID_PUBLIC_KEY || this.generateVAPIDKeys().publicKey,
                privateKey: process.env.VAPID_PRIVATE_KEY || this.generateVAPIDKeys().privateKey
            },
            subject: process.env.VAPID_SUBJECT || 'mailto:admin@heroespatria.edu.mx',
            ttl: parseInt(process.env.PUSH_TTL) || 86400, // 24 hours
            urgency: process.env.PUSH_URGENCY || 'normal',
            batchSize: parseInt(process.env.PUSH_BATCH_SIZE) || 100,
            retryAttempts: parseInt(process.env.PUSH_RETRY_ATTEMPTS) || 3
        };

        this.notificationTypes = {
            ANNOUNCEMENT: 'announcement',
            GRADE: 'grade',
            ASSIGNMENT: 'assignment',
            EVENT: 'event',
            REMINDER: 'reminder',
            EMERGENCY: 'emergency',
            SYSTEM: 'system'
        };

        this.init();
    }

    async init() {
        try {
            devLogger.log('📱 [PUSH SERVICE] Inicializando servicio de notificaciones push...');

            // Configurar VAPID
            webpush.setVapidDetails(
                this.config.subject,
                this.config.vapidKeys.publicKey,
                this.config.vapidKeys.privateKey
            );

            // Cargar suscripciones existentes
            await this.loadSubscriptions();

            // Programar tareas automáticas
            this.scheduleAutomaticNotifications();

            // Inicializar procesamiento de cola
            this.startQueueProcessor();

            this.isInitialized = true;
            devLogger.log('✅ [PUSH SERVICE] Servicio de notificaciones push inicializado correctamente');

        } catch (error) {
            devLogger.error('❌ [PUSH SERVICE] Error inicializando:', error);
            throw error;
        }
    }

    generateVAPIDKeys() {
        // Generate VAPID keys (should be done once and stored securely)
        const vapidKeys = webpush.generateVAPIDKeys();
        devLogger.log('🔑 [PUSH SERVICE] VAPID Keys generadas:');
        devLogger.log('Public Key:', vapidKeys.publicKey);
        devLogger.log('Private Key:', vapidKeys.privateKey);
        devLogger.log('⚠️  [PUSH SERVICE] Guarde estas claves en variables de entorno');
        return vapidKeys;
    }

    async loadSubscriptions() {
        try {
            const data = await fs.readFile(this.subscriptionsFile, 'utf8');
            const subscriptions = JSON.parse(data);

            for (const sub of subscriptions) {
                this.subscribers.set(sub.id, sub);
            }

            devLogger.log(`📱 [PUSH SERVICE] ${subscriptions.length} suscripciones cargadas`);
        } catch (error) {
            devLogger.log('📱 [PUSH SERVICE] No hay suscripciones previas, iniciando desde cero');
            await this.saveSubscriptions(); // Create empty file
        }
    }

    async saveSubscriptions() {
        try {
            const subscriptions = Array.from(this.subscribers.values());
            await fs.writeFile(this.subscriptionsFile, JSON.stringify(subscriptions, null, 2));
        } catch (error) {
            devLogger.error('❌ [PUSH SERVICE] Error guardando suscripciones:', error);
        }
    }

    async subscribe(userId, subscription, metadata = {}) {
        try {
            const subscriptionData = {
                id: `${userId}_${Date.now()}`,
                userId: userId,
                subscription: subscription,
                metadata: {
                    userAgent: metadata.userAgent || 'Unknown',
                    platform: metadata.platform || 'web',
                    subscribedAt: new Date().toISOString(),
                    lastSeen: new Date().toISOString(),
                    ...metadata
                },
                active: true
            };

            this.subscribers.set(subscriptionData.id, subscriptionData);
            await this.saveSubscriptions();

            devLogger.log(`📱 [PUSH SERVICE] Nueva suscripción: Usuario ${userId}`);
            return subscriptionData.id;

        } catch (error) {
            devLogger.error('❌ [PUSH SERVICE] Error en suscripción:', error);
            throw error;
        }
    }

    async unsubscribe(subscriptionId) {
        try {
            if (this.subscribers.has(subscriptionId)) {
                this.subscribers.delete(subscriptionId);
                await this.saveSubscriptions();
                devLogger.log(`📱 [PUSH SERVICE] Suscripción eliminada: ${subscriptionId}`);
                return true;
            }
            return false;
        } catch (error) {
            devLogger.error('❌ [PUSH SERVICE] Error eliminando suscripción:', error);
            throw error;
        }
    }

    async sendNotification(notification) {
        try {
            const {
                userIds = [],
                title,
                body,
                icon = '/images/notification-icon.png',
                badge = '/images/notification-badge.png',
                image,
                url,
                type = this.notificationTypes.SYSTEM,
                priority = 'normal',
                requireInteraction = false,
                actions = [],
                data = {},
                scheduled = false,
                scheduledAt = null
            } = notification;

            const notificationPayload = {
                title,
                body,
                icon,
                badge,
                image,
                url,
                tag: `${type}_${Date.now()}`,
                requireInteraction,
                actions,
                data: {
                    type,
                    timestamp: new Date().toISOString(),
                    ...data
                }
            };

            if (scheduled && scheduledAt) {
                return this.scheduleNotification(notificationPayload, userIds, scheduledAt);
            }

            return await this.sendImmediateNotification(notificationPayload, userIds, priority);

        } catch (error) {
            devLogger.error('❌ [PUSH SERVICE] Error enviando notificación:', error);
            throw error;
        }
    }

    async sendImmediateNotification(payload, userIds, priority = 'normal') {
        const results = {
            sent: 0,
            failed: 0,
            errors: []
        };

        // Obtener suscripciones de usuarios específicos
        const targetSubscriptions = this.getSubscriptionsForUsers(userIds);

        devLogger.log(`📱 [PUSH SERVICE] Enviando a ${targetSubscriptions.length} suscripciones`);

        // Procesar en lotes para mejor rendimiento
        const batches = this.chunkArray(targetSubscriptions, this.config.batchSize);

        for (const batch of batches) {
            const batchPromises = batch.map(async (subscriptionData) => {
                try {
                    await this.sendToSubscription(subscriptionData, payload, priority);
                    results.sent++;
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        subscriptionId: subscriptionData.id,
                        error: error.message
                    });

                    // Eliminar suscripciones inválidas
                    if (error.statusCode === 410) {
                        await this.unsubscribe(subscriptionData.id);
                    }
                }
            });

            await Promise.allSettled(batchPromises);
        }

        devLogger.log(`📱 [PUSH SERVICE] Enviadas: ${results.sent}, Fallidas: ${results.failed}`);
        return results;
    }

    async sendToSubscription(subscriptionData, payload, priority) {
        const options = {
            TTL: this.config.ttl,
            urgency: priority === 'high' ? 'high' : this.config.urgency,
            vapidDetails: {
                subject: this.config.subject,
                publicKey: this.config.vapidKeys.publicKey,
                privateKey: this.config.vapidKeys.privateKey
            }
        };

        const payloadString = JSON.stringify(payload);

        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                await webpush.sendNotification(subscriptionData.subscription, payloadString, options);

                // Actualizar última actividad
                subscriptionData.metadata.lastSeen = new Date().toISOString();
                return;

            } catch (error) {
                devLogger.log(`📱 [PUSH SERVICE] Intento ${attempt}/${this.config.retryAttempts} falló para ${subscriptionData.id}`);

                if (attempt === this.config.retryAttempts) {
                    throw error;
                }

                // Esperar antes del siguiente intento
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }

    getSubscriptionsForUsers(userIds) {
        if (userIds.length === 0) {
            // Si no se especifican usuarios, enviar a todos
            return Array.from(this.subscribers.values()).filter(sub => sub.active);
        }

        return Array.from(this.subscribers.values())
            .filter(sub => sub.active && userIds.includes(sub.userId));
    }

    async scheduleNotification(payload, userIds, scheduledAt) {
        const scheduledNotification = {
            id: `scheduled_${Date.now()}`,
            payload,
            userIds,
            scheduledAt: new Date(scheduledAt),
            created: new Date().toISOString(),
            status: 'pending'
        };

        this.notificationQueue.push(scheduledNotification);
        devLogger.log(`📅 [PUSH SERVICE] Notificación programada para ${scheduledAt}`);

        return scheduledNotification.id;
    }

    startQueueProcessor() {
        // Procesar cola cada minuto
        cron.schedule('* * * * *', () => {
            this.processNotificationQueue();
        });
    }

    async processNotificationQueue() {
        const now = new Date();
        const pendingNotifications = this.notificationQueue.filter(
            notif => notif.status === 'pending' && notif.scheduledAt <= now
        );

        for (const notification of pendingNotifications) {
            try {
                await this.sendImmediateNotification(
                    notification.payload,
                    notification.userIds
                );

                notification.status = 'sent';
                notification.sentAt = new Date().toISOString();

            } catch (error) {
                notification.status = 'failed';
                notification.error = error.message;
                devLogger.error(`❌ [PUSH SERVICE] Error procesando notificación programada:`, error);
            }
        }

        // Limpiar notificaciones procesadas (más de 7 días)
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        this.notificationQueue = this.notificationQueue.filter(
            notif => new Date(notif.created) > cutoff
        );
    }

    scheduleAutomaticNotifications() {
        // Notificación diaria de recordatorios (8:00 AM)
        cron.schedule('0 8 * * *', () => {
            this.sendDailyReminders();
        });

        // Notificación semanal de eventos (Lunes 9:00 AM)
        cron.schedule('0 9 * * 1', () => {
            this.sendWeeklyEvents();
        });
    }

    async sendDailyReminders() {
        try {
            const notification = {
                title: '📚 BGE Héroes de la Patria',
                body: 'Buenos días. Revisa tus tareas y actividades programadas para hoy.',
                type: this.notificationTypes.REMINDER,
                url: '/calendario.html'
            };

            await this.sendNotification(notification);
            devLogger.log('📱 [PUSH SERVICE] Recordatorios diarios enviados');
        } catch (error) {
            devLogger.error('❌ [PUSH SERVICE] Error enviando recordatorios diarios:', error);
        }
    }

    async sendWeeklyEvents() {
        try {
            const notification = {
                title: '📅 Eventos de la Semana',
                body: 'Revisa los eventos y actividades programados para esta semana.',
                type: this.notificationTypes.EVENT,
                url: '/calendario.html'
            };

            await this.sendNotification(notification);
            devLogger.log('📱 [PUSH SERVICE] Eventos semanales enviados');
        } catch (error) {
            devLogger.error('❌ [PUSH SERVICE] Error enviando eventos semanales:', error);
        }
    }

    async sendEmergencyNotification(title, body, userIds = []) {
        return await this.sendNotification({
            userIds,
            title: `🚨 ${title}`,
            body,
            type: this.notificationTypes.EMERGENCY,
            priority: 'high',
            requireInteraction: true,
            url: '/index.html'
        });
    }

    async sendGradeNotification(userId, subject, grade) {
        return await this.sendNotification({
            userIds: [userId],
            title: '📊 Nueva Calificación',
            body: `${subject}: ${grade}`,
            type: this.notificationTypes.GRADE,
            url: '/calificaciones.html'
        });
    }

    async getSubscriptionStats() {
        const subscriptions = Array.from(this.subscribers.values());
        const active = subscriptions.filter(sub => sub.active);

        const platforms = {};
        active.forEach(sub => {
            const platform = sub.metadata.platform || 'unknown';
            platforms[platform] = (platforms[platform] || 0) + 1;
        });

        return {
            total: subscriptions.length,
            active: active.length,
            inactive: subscriptions.length - active.length,
            platforms,
            queueSize: this.notificationQueue.length,
            pendingScheduled: this.notificationQueue.filter(n => n.status === 'pending').length
        };
    }

    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    getVAPIDPublicKey() {
        return this.config.vapidKeys.publicKey;
    }

    async cleanupInactiveSubscriptions(daysInactive = 30) {
        const cutoff = new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000);
        let removed = 0;

        for (const [id, subscription] of this.subscribers.entries()) {
            const lastSeen = new Date(subscription.metadata.lastSeen);
            if (lastSeen < cutoff) {
                this.subscribers.delete(id);
                removed++;
            }
        }

        if (removed > 0) {
            await this.saveSubscriptions();
            devLogger.log(`📱 [PUSH SERVICE] ${removed} suscripciones inactivas eliminadas`);
        }

        return removed;
    }
}

// Singleton instance
let pushNotificationServiceInstance = null;

function getPushNotificationService() {
    if (!pushNotificationServiceInstance) {
        pushNotificationServiceInstance = new PushNotificationService();
    }
    return pushNotificationServiceInstance;
}

module.exports = {
    getPushNotificationService,
    PushNotificationService
};