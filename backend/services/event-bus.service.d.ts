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
declare class EventBusService extends EventEmitter {
    private eventStore;
    private deadLetterQueue;
    private subscribers;
    private maxStoreSize;
    constructor();
    publish(eventType: string, payload: any, metadata?: Partial<EventMetadata>): BusEvent;
    subscribe(eventType: string, handler: (event: BusEvent) => void | Promise<void>, options?: SubscriptionOptions): string;
    unsubscribe(subscriptionId: string): boolean;
    private handleSubscriberError;
    replay(eventType: string, fromTimestamp?: string | null): BusEvent[];
    replayAll(fromTimestamp?: string | null): BusEvent[];
    getEventsByAggregate(aggregateType: string, aggregateId: string | number): BusEvent[];
    getDeadLetterQueue(): DeadLetterItem[];
    retryDeadLetter(index: number): boolean;
    clearDeadLetterQueue(): number;
    getStats(): EventBusStats;
    clearEventStore(): number;
}
declare const eventBusService: EventBusService;
export { EventBusService };
export default eventBusService;
//# sourceMappingURL=event-bus.service.d.ts.map