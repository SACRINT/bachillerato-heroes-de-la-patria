export class EventBusService extends EventEmitter<[never]> {
    constructor();
    eventHistory: any[];
    maxHistorySize: number;
    subscribers: Map<any, any>;
    stats: {
        totalEvents: number;
        eventsByType: {};
        errors: number;
    };
    /**
     * Emitir evento al bus
     * @param {string} eventType - Tipo de evento (ej: 'student.created')
     * @param {object} data - Datos del evento
     * @param {object} metadata - Metadata opcional (userId, timestamp, etc)
     */
    emit(eventType: string, data: object, metadata?: object): {
        type: string;
        data: any;
        metadata: any;
    };
    /**
     * Suscribirse a un evento
     * @param {string} eventType - Tipo de evento
     * @param {function} handler - Callback handler
     * @param {object} options - Opciones (priority, once, etc)
     */
    subscribe(eventType: string, handler: Function, options?: object): () => void;
    /**
     * Desuscribirse de un evento
     * @param {string} eventType - Tipo de evento
     * @param {function} handler - Handler a remover
     */
    unsubscribe(eventType: string, handler: Function): void;
    /**
     * Obtener historial de eventos
     * @param {string} eventType - Filtrar por tipo (opcional)
     * @param {number} limit - Límite de resultados
     */
    getHistory(eventType?: string, limit?: number): any[];
    /**
     * Replay de eventos (útil para debugging/recovery)
     * @param {string} eventType - Tipo de evento a replay
     * @param {number} fromTimestamp - Desde qué timestamp
     */
    replay(eventType: string, fromTimestamp?: number): number;
    /**
     * Obtener estadísticas del Event Bus
     */
    getStats(): {
        activeSubscribers: number;
        subscribersByType: any;
        historySize: number;
        totalEvents: number;
        eventsByType: {};
        errors: number;
    };
    /**
     * Limpiar historial antiguo
     * @param {number} olderThanMs - Limpiar eventos más antiguos que X ms
     */
    cleanHistory(olderThanMs?: number): number;
    /**
     * Métodos privados
     */
    addToHistory(event: any): void;
    updateStats(eventType: any): void;
    generateEventId(): string;
}
import EventEmitter = require("events");
export declare function getInstance(): any;
//# sourceMappingURL=eventBus.service.d.ts.map