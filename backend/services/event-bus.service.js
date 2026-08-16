"use strict";
/**
 * 📡 EVENT BUS SERVICE - TypeScript Version
 * Sistema de eventos y mensajería
 *
 * Features:
 * - Pub/Sub pattern
 * - Event sourcing
 * - Message queuing
 * - Dead letter queue
 * - Event replay
 *
 * Refactorizado: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBusService = void 0;
const events_1 = require("events");
const devLogger = require('../utils/devLogger.js');
// ============================================
// EVENT BUS SERVICE CLASS
// ============================================
class EventBusService extends events_1.EventEmitter {
    constructor() {
        super();
        this.eventStore = [];
        this.deadLetterQueue = [];
        this.subscribers = new Map();
        this.maxStoreSize = 10000;
    }
    publish(eventType, payload, metadata = {}) {
        const event = {
            id: Date.now() + Math.random().toString(36),
            type: eventType,
            payload,
            metadata: {
                timestamp: new Date().toISOString(),
                ...metadata
            }
        };
        // Guardar en event store
        this.eventStore.push(event);
        if (this.eventStore.length > this.maxStoreSize) {
            this.eventStore.shift();
        }
        // Emitir evento
        this.emit(eventType, event);
        this.emit('*', event); // Wildcard para listeners globales
        devLogger.log(`[EVENT-BUS] Evento publicado: ${eventType}`);
        return event;
    }
    subscribe(eventType, handler, options = {}) {
        const subscription = {
            id: Date.now() + Math.random().toString(36),
            eventType,
            handler,
            options: {
                retries: options.retries || 3,
                async: options.async !== false
            }
        };
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, []);
        }
        this.subscribers.get(eventType).push(subscription);
        // Registrar listener
        const wrappedHandler = async (event) => {
            try {
                if (subscription.options.async) {
                    await handler(event);
                }
                else {
                    handler(event);
                }
            }
            catch (error) {
                await this.handleSubscriberError(subscription, event, error);
            }
        };
        this.on(eventType, wrappedHandler);
        devLogger.log(`[EVENT-BUS] Suscriptor registrado para: ${eventType}`);
        return subscription.id;
    }
    unsubscribe(subscriptionId) {
        for (const [eventType, subs] of this.subscribers) {
            const index = subs.findIndex(s => s.id === subscriptionId);
            if (index !== -1) {
                subs.splice(index, 1);
                devLogger.log(`[EVENT-BUS] Suscriptor removido: ${subscriptionId}`);
                return true;
            }
        }
        return false;
    }
    async handleSubscriberError(subscription, event, error) {
        devLogger.error(`[EVENT-BUS] Error en subscriber:`, error.message);
        // Agregar a dead letter queue
        this.deadLetterQueue.push({
            event,
            subscription: {
                id: subscription.id,
                eventType: subscription.eventType
            },
            error: error.message,
            timestamp: new Date().toISOString()
        });
        // Limitar tamaño de DLQ
        if (this.deadLetterQueue.length > 1000) {
            this.deadLetterQueue.shift();
        }
    }
    // Event Sourcing: Reconstruir estado desde eventos
    replay(eventType, fromTimestamp = null) {
        let events = this.eventStore.filter(e => e.type === eventType);
        if (fromTimestamp) {
            events = events.filter(e => new Date(e.metadata.timestamp) >= new Date(fromTimestamp));
        }
        devLogger.log(`[EVENT-BUS] Replaying ${events.length} eventos de ${eventType}`);
        return events;
    }
    replayAll(fromTimestamp = null) {
        let events = [...this.eventStore];
        if (fromTimestamp) {
            events = events.filter(e => new Date(e.metadata.timestamp) >= new Date(fromTimestamp));
        }
        return events;
    }
    // Obtener eventos por agregado (entity)
    getEventsByAggregate(aggregateType, aggregateId) {
        return this.eventStore.filter(e => e.metadata.aggregateType === aggregateType &&
            e.metadata.aggregateId === aggregateId);
    }
    getDeadLetterQueue() {
        return [...this.deadLetterQueue];
    }
    retryDeadLetter(index) {
        const item = this.deadLetterQueue[index];
        if (!item)
            return false;
        // Re-publicar evento
        this.publish(item.event.type, item.event.payload, item.event.metadata);
        // Remover de DLQ
        this.deadLetterQueue.splice(index, 1);
        devLogger.log(`[EVENT-BUS] Evento reintentado desde DLQ: ${item.event.type}`);
        return true;
    }
    clearDeadLetterQueue() {
        const count = this.deadLetterQueue.length;
        this.deadLetterQueue = [];
        return count;
    }
    getStats() {
        const eventCounts = {};
        for (const event of this.eventStore) {
            eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
        }
        return {
            totalEvents: this.eventStore.length,
            eventTypes: Object.keys(eventCounts).length,
            eventCounts,
            deadLetterCount: this.deadLetterQueue.length,
            subscriberCount: Array.from(this.subscribers.values())
                .reduce((sum, subs) => sum + subs.length, 0)
        };
    }
    clearEventStore() {
        const count = this.eventStore.length;
        this.eventStore = [];
        return count;
    }
}
exports.EventBusService = EventBusService;
// ============================================
// EXPORTS
// ============================================
const eventBusService = new EventBusService();
exports.default = eventBusService;
module.exports = eventBusService;
module.exports.EventBusService = EventBusService;
//# sourceMappingURL=event-bus.service.js.map