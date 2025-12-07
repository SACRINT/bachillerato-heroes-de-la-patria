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

import { EventEmitter } from 'events';
const devLogger = require('../utils/devLogger');

// ============================================
// INTERFACES
// ============================================

export interface EventMetadata {
    timestamp: string;
    aggregateType?: string;
    aggregateId?: string | number;
    [key: string]: any;
}

export interface BusEvent {
    id: string;
    type: string;
    payload: any;
    metadata: EventMetadata;
}

export interface SubscriptionOptions {
    retries?: number;
    async?: boolean;
}

export interface Subscription {
    id: string;
    eventType: string;
    handler: (event: BusEvent) => void | Promise<void>;
    options: {
        retries: number;
        async: boolean;
    };
}

export interface DeadLetterItem {
    event: BusEvent;
    subscription: {
        id: string;
        eventType: string;
    };
    error: string;
    timestamp: string;
}

export interface EventBusStats {
    totalEvents: number;
    eventTypes: number;
    eventCounts: Record<string, number>;
    deadLetterCount: number;
    subscriberCount: number;
}

// ============================================
// EVENT BUS SERVICE CLASS
// ============================================

class EventBusService extends EventEmitter {
    private eventStore: BusEvent[];
    private deadLetterQueue: DeadLetterItem[];
    private subscribers: Map<string, Subscription[]>;
    private maxStoreSize: number;

    constructor() {
        super();
        this.eventStore = [];
        this.deadLetterQueue = [];
        this.subscribers = new Map();
        this.maxStoreSize = 10000;
    }

    publish(eventType: string, payload: any, metadata: Partial<EventMetadata> = {}): BusEvent {
        const event: BusEvent = {
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

    subscribe(
        eventType: string,
        handler: (event: BusEvent) => void | Promise<void>,
        options: SubscriptionOptions = {}
    ): string {
        const subscription: Subscription = {
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
        this.subscribers.get(eventType)!.push(subscription);

        // Registrar listener
        const wrappedHandler = async (event: BusEvent) => {
            try {
                if (subscription.options.async) {
                    await handler(event);
                } else {
                    handler(event);
                }
            } catch (error: any) {
                await this.handleSubscriberError(subscription, event, error);
            }
        };

        this.on(eventType, wrappedHandler);

        devLogger.log(`[EVENT-BUS] Suscriptor registrado para: ${eventType}`);

        return subscription.id;
    }

    unsubscribe(subscriptionId: string): boolean {
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

    private async handleSubscriberError(subscription: Subscription, event: BusEvent, error: Error): Promise<void> {
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
    replay(eventType: string, fromTimestamp: string | null = null): BusEvent[] {
        let events = this.eventStore.filter(e => e.type === eventType);

        if (fromTimestamp) {
            events = events.filter(e =>
                new Date(e.metadata.timestamp) >= new Date(fromTimestamp)
            );
        }

        devLogger.log(`[EVENT-BUS] Replaying ${events.length} eventos de ${eventType}`);

        return events;
    }

    replayAll(fromTimestamp: string | null = null): BusEvent[] {
        let events = [...this.eventStore];

        if (fromTimestamp) {
            events = events.filter(e =>
                new Date(e.metadata.timestamp) >= new Date(fromTimestamp)
            );
        }

        return events;
    }

    // Obtener eventos por agregado (entity)
    getEventsByAggregate(aggregateType: string, aggregateId: string | number): BusEvent[] {
        return this.eventStore.filter(e =>
            e.metadata.aggregateType === aggregateType &&
            e.metadata.aggregateId === aggregateId
        );
    }

    getDeadLetterQueue(): DeadLetterItem[] {
        return [...this.deadLetterQueue];
    }

    retryDeadLetter(index: number): boolean {
        const item = this.deadLetterQueue[index];
        if (!item) return false;

        // Re-publicar evento
        this.publish(item.event.type, item.event.payload, item.event.metadata);

        // Remover de DLQ
        this.deadLetterQueue.splice(index, 1);

        devLogger.log(`[EVENT-BUS] Evento reintentado desde DLQ: ${item.event.type}`);

        return true;
    }

    clearDeadLetterQueue(): number {
        const count = this.deadLetterQueue.length;
        this.deadLetterQueue = [];
        return count;
    }

    getStats(): EventBusStats {
        const eventCounts: Record<string, number> = {};
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

    clearEventStore(): number {
        const count = this.eventStore.length;
        this.eventStore = [];
        return count;
    }
}

// ============================================
// EXPORTS
// ============================================

const eventBusService = new EventBusService();

export { EventBusService };
export default eventBusService;

module.exports = eventBusService;
module.exports.EventBusService = EventBusService;
