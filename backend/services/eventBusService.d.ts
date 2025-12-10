declare const _exports: EventBusService;
export = _exports;
declare class EventBusService extends EventEmitter<[never]> {
    constructor();
    eventStore: any[];
    deadLetterQueue: any[];
    subscribers: Map<any, any>;
    maxStoreSize: number;
    publish(eventType: any, payload: any, metadata?: {}): {
        id: string;
        type: any;
        payload: any;
        metadata: {
            timestamp: string;
        };
    };
    subscribe(eventType: any, handler: any, options?: {}): string;
    unsubscribe(subscriptionId: any): boolean;
    handleSubscriberError(subscription: any, event: any, error: any): Promise<void>;
    replay(eventType: any, fromTimestamp?: any): any[];
    replayAll(fromTimestamp?: any): any[];
    getEventsByAggregate(aggregateType: any, aggregateId: any): any[];
    getDeadLetterQueue(): any[];
    retryDeadLetter(index: any): boolean;
    clearDeadLetterQueue(): number;
    getStats(): {
        totalEvents: number;
        eventTypes: number;
        eventCounts: {};
        deadLetterCount: number;
        subscriberCount: any;
    };
    clearEventStore(): number;
}
import EventEmitter = require("events");
//# sourceMappingURL=eventBusService.d.ts.map