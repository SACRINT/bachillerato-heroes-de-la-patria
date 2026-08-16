/**
 * EVENT BUS - Cliente Frontend (TypeScript)
 *
 * Propósito: Sistema de eventos para desacoplar módulos del dashboard
 * Patrón: Pub/Sub (Observer Pattern)
 *
 * Uso:
 *   eventBus.emit('student.created', { id: 1, name: 'Juan' });
 *   eventBus.on('student.created', (event) => );
 *
 * Migrado a TypeScript: 13 Diciembre 2025
 * Versión: 2.0.0
 */

// Interfaces
export interface EventPayload<T = any> {
    type: string;
    data: T;
    timestamp: number;
    eventId: string;
}

export interface EmitOptions {
    async?: boolean;
    broadcast?: boolean;
}

export interface SubscribeOptions {
    once?: boolean;
    priority?: number;
}

interface Listener<T = any> {
    callback: (event: EventPayload<T>) => void | Promise<void>;
    once: boolean;
    priority: number;
    id: string;
}

interface EventStats {
    totalEvents: number;
    eventsByType: Record<string, number>;
    errors: number;
}

type Unsubscribe = () => void;

export class EventBus {
    private listeners: Map<string, Listener[]>;
    private eventHistory: EventPayload[];
    private maxHistorySize: number;
    private stats: EventStats;
    private broadcastChannel: BroadcastChannel | null;

    constructor() {
        this.listeners = new Map();
        this.eventHistory = [];
        this.maxHistorySize = 500;

        this.stats = {
            totalEvents: 0,
            eventsByType: {},
            errors: 0
        };

        // Setup BroadcastChannel if available
        this.broadcastChannel = null;
        this.initBroadcastChannel();

        
    }

    /**
     * Initialize BroadcastChannel for cross-tab communication
     */
    private initBroadcastChannel(): void {
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                this.broadcastChannel = new BroadcastChannel('eventBus');
                this.broadcastChannel.onmessage = (msg: MessageEvent<EventPayload>) => {
                    const event = msg.data;
                    
                    // Re-emit locally without broadcast to avoid loops
                    this.emit(event.type, event.data, { broadcast: false });
                };
            } catch (error) {
                
            }
        }
    }

    /**
     * Emitir evento
     * @param eventType - Tipo de evento
     * @param data - Datos del evento
     * @param options - Opciones (broadcast, async, etc)
     */
    emit<T = any>(eventType: string, data: T, options: EmitOptions = {}): EventPayload<T> {
        const { async = false, broadcast = false } = options;

        const event: EventPayload<T> = {
            type: eventType,
            data: data,
            timestamp: Date.now(),
            eventId: this.generateEventId()
        };

        // Guardar en historial
        this.addToHistory(event);

        // Actualizar estadísticas
        this.updateStats(eventType);

        // Obtener listeners
        const listeners = this.listeners.get(eventType) || [];

        

        // Ejecutar listeners
        if (async) {
            this.executeListenersAsync(listeners, event);
        } else {
            this.executeListenersSync(listeners, event);
        }

        // Broadcast a otros tabs (si está habilitado)
        if (broadcast && this.broadcastChannel) {
            this.broadcastToOtherTabs(event);
        }

        return event;
    }

    /**
     * Suscribirse a un evento
     * @param eventType - Tipo de evento
     * @param callback - Callback a ejecutar
     * @param options - Opciones (once, priority)
     */
    on<T = any>(
        eventType: string,
        callback: (event: EventPayload<T>) => void | Promise<void>,
        options: SubscribeOptions = {}
    ): Unsubscribe {
        const { once = false, priority = 0 } = options;

        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }

        const listener: Listener<T> = {
            callback: callback as Listener['callback'],
            once: once,
            priority: priority,
            id: this.generateListenerId()
        };

        const listeners = this.listeners.get(eventType)!;
        listeners.push(listener);

        // Ordenar por prioridad (mayor prioridad primero)
        listeners.sort((a, b) => b.priority - a.priority);

        

        // Retornar función para desuscribirse
        return () => this.off(eventType, listener.id);
    }

    /**
     * Suscribirse a un evento solo una vez
     * @param eventType - Tipo de evento
     * @param callback - Callback a ejecutar
     */
    once<T = any>(
        eventType: string,
        callback: (event: EventPayload<T>) => void | Promise<void>
    ): Unsubscribe {
        return this.on(eventType, callback, { once: true });
    }

    /**
     * Desuscribirse de un evento
     * @param eventType - Tipo de evento
     * @param listenerId - ID del listener (opcional - si no se provee, elimina todos)
     */
    off(eventType: string, listenerId: string | null = null): void {
        if (!this.listeners.has(eventType)) {
            return;
        }

        const listeners = this.listeners.get(eventType)!;

        if (listenerId) {
            const index = listeners.findIndex(l => l.id === listenerId);
            if (index !== -1) {
                listeners.splice(index, 1);
                
            }
        } else {
            this.listeners.delete(eventType);
            
        }

        // Limpiar si no quedan listeners
        if (listeners && listeners.length === 0) {
            this.listeners.delete(eventType);
        }
    }

    /**
     * Obtener historial de eventos
     * @param eventType - Filtrar por tipo (opcional)
     * @param limit - Límite de resultados
     */
    getHistory(eventType: string | null = null, limit: number = 100): EventPayload[] {
        let history = this.eventHistory;

        if (eventType) {
            history = history.filter(e => e.type === eventType);
        }

        return history.slice(-limit);
    }

    /**
     * Obtener estadísticas
     */
    getStats(): EventStats & {
        activeListeners: number;
        listenersByType: Record<string, number>;
        historySize: number;
    } {
        return {
            ...this.stats,
            activeListeners: this.listeners.size,
            listenersByType: Object.fromEntries(
                Array.from(this.listeners.entries()).map(([type, listeners]) => [type, listeners.length])
            ),
            historySize: this.eventHistory.length
        };
    }

    /**
     * Limpiar todos los listeners
     */
    clear(): void {
        this.listeners.clear();
        
    }

    /**
     * Limpiar historial de eventos
     */
    clearHistory(): void {
        this.eventHistory = [];
        
    }

    /**
     * Destruir el event bus (limpiar recursos)
     */
    destroy(): void {
        this.clear();
        this.clearHistory();
        if (this.broadcastChannel) {
            this.broadcastChannel.close();
            this.broadcastChannel = null;
        }
        
    }

    // ============================================
    // Private methods
    // ============================================

    private executeListenersSync(listeners: Listener[], event: EventPayload): void {
        // Create a copy to iterate safely if listeners modify themselves
        const listenersCopy = [...listeners];

        listenersCopy.forEach(listener => {
            try {
                listener.callback(event);

                // Remover si es 'once'
                if (listener.once) {
                    this.off(event.type, listener.id);
                }
            } catch (error) {
                console.error(`[EVENT-BUS] ❌ Error ejecutando listener de ${event.type}:`, error);
                this.stats.errors++;
            }
        });
    }

    private async executeListenersAsync(listeners: Listener[], event: EventPayload): Promise<void> {
        const listenersCopy = [...listeners];

        const promises = listenersCopy.map(async (listener) => {
            try {
                await listener.callback(event);

                // Remover si es 'once'
                if (listener.once) {
                    this.off(event.type, listener.id);
                }
            } catch (error) {
                console.error(`[EVENT-BUS] ❌ Error ejecutando listener async de ${event.type}:`, error);
                this.stats.errors++;
            }
        });

        await Promise.all(promises);
    }

    private broadcastToOtherTabs(event: EventPayload): void {
        try {
            if (this.broadcastChannel) {
                this.broadcastChannel.postMessage(event);
            }
        } catch (error) {
            
        }
    }

    private addToHistory(event: EventPayload): void {
        this.eventHistory.push(event);

        // Mantener tamaño máximo
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
    }

    private updateStats(eventType: string): void {
        this.stats.totalEvents++;

        if (!this.stats.eventsByType[eventType]) {
            this.stats.eventsByType[eventType] = 0;
        }
        this.stats.eventsByType[eventType]++;
    }

    private generateEventId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

    private generateListenerId(): string {
        return `listener-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }
}

// Singleton instance
export const eventBus = new EventBus();

// Exponer globalmente para compatibilidad legacy
if (typeof window !== 'undefined') {
    (window as any).eventBus = eventBus;
}

export default eventBus;
