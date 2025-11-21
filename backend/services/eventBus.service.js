/**
 * EVENT BUS SERVICE - Sistema Central de Eventos
 *
 * Propósito: Desacoplar comunicación entre módulos usando patrón Pub/Sub
 * Arquitectura: Event-Driven para eliminar dependencias directas
 *
 * Versión: 1.0.0
 * Fecha: 21 Noviembre 2025
 * Parte de: SEMANA 1 - Refactorización Admin Dashboard
 */

const EventEmitter = require('events');

class EventBusService extends EventEmitter {
    constructor() {
        super();
        this.eventHistory = [];
        this.maxHistorySize = 1000;
        this.subscribers = new Map();

        // Statistics
        this.stats = {
            totalEvents: 0,
            eventsByType: {},
            errors: 0
        };

        console.log('[EVENT-BUS] ✅ Event Bus Service inicializado');
    }

    /**
     * Emitir evento al bus
     * @param {string} eventType - Tipo de evento (ej: 'student.created')
     * @param {object} data - Datos del evento
     * @param {object} metadata - Metadata opcional (userId, timestamp, etc)
     */
    emit(eventType, data, metadata = {}) {
        try {
            const event = {
                type: eventType,
                data: data,
                metadata: {
                    ...metadata,
                    timestamp: Date.now(),
                    eventId: this.generateEventId()
                }
            };

            // Guardar en historial
            this.addToHistory(event);

            // Actualizar estadísticas
            this.updateStats(eventType);

            // Emitir evento
            super.emit(eventType, event);

            console.log(`[EVENT-BUS] 📤 Evento emitido: ${eventType}`);

            return event;
        } catch (error) {
            console.error(`[EVENT-BUS] ❌ Error emitiendo evento ${eventType}:`, error);
            this.stats.errors++;
            throw error;
        }
    }

    /**
     * Suscribirse a un evento
     * @param {string} eventType - Tipo de evento
     * @param {function} handler - Callback handler
     * @param {object} options - Opciones (priority, once, etc)
     */
    subscribe(eventType, handler, options = {}) {
        const { priority = 0, once = false } = options;

        const wrappedHandler = async (event) => {
            try {
                await handler(event);
            } catch (error) {
                console.error(`[EVENT-BUS] ❌ Error en handler de ${eventType}:`, error);
                this.stats.errors++;
                this.emit('error', { eventType, error, originalEvent: event });
            }
        };

        if (once) {
            this.once(eventType, wrappedHandler);
        } else {
            this.on(eventType, wrappedHandler);
        }

        // Registrar suscriptor
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, []);
        }
        this.subscribers.get(eventType).push({
            handler: wrappedHandler,
            priority,
            createdAt: Date.now()
        });

        console.log(`[EVENT-BUS] 🔔 Nuevo suscriptor para: ${eventType}`);

        return () => this.unsubscribe(eventType, wrappedHandler);
    }

    /**
     * Desuscribirse de un evento
     * @param {string} eventType - Tipo de evento
     * @param {function} handler - Handler a remover
     */
    unsubscribe(eventType, handler) {
        this.removeListener(eventType, handler);

        if (this.subscribers.has(eventType)) {
            const subscribers = this.subscribers.get(eventType);
            const index = subscribers.findIndex(s => s.handler === handler);
            if (index !== -1) {
                subscribers.splice(index, 1);
            }

            if (subscribers.length === 0) {
                this.subscribers.delete(eventType);
            }
        }

        console.log(`[EVENT-BUS] 🔕 Suscriptor removido de: ${eventType}`);
    }

    /**
     * Obtener historial de eventos
     * @param {string} eventType - Filtrar por tipo (opcional)
     * @param {number} limit - Límite de resultados
     */
    getHistory(eventType = null, limit = 100) {
        let history = this.eventHistory;

        if (eventType) {
            history = history.filter(e => e.type === eventType);
        }

        return history.slice(-limit);
    }

    /**
     * Replay de eventos (útil para debugging/recovery)
     * @param {string} eventType - Tipo de evento a replay
     * @param {number} fromTimestamp - Desde qué timestamp
     */
    replay(eventType, fromTimestamp = 0) {
        const events = this.eventHistory.filter(e =>
            e.type === eventType && e.metadata.timestamp >= fromTimestamp
        );

        console.log(`[EVENT-BUS] 🔄 Replaying ${events.length} eventos de tipo ${eventType}`);

        events.forEach(event => {
            super.emit(event.type, event);
        });

        return events.length;
    }

    /**
     * Obtener estadísticas del Event Bus
     */
    getStats() {
        return {
            ...this.stats,
            activeSubscribers: this.subscribers.size,
            subscribersByType: Object.fromEntries(
                Array.from(this.subscribers.entries()).map(([type, subs]) => [type, subs.length])
            ),
            historySize: this.eventHistory.length
        };
    }

    /**
     * Limpiar historial antiguo
     * @param {number} olderThanMs - Limpiar eventos más antiguos que X ms
     */
    cleanHistory(olderThanMs = 24 * 60 * 60 * 1000) { // 24 horas por defecto
        const cutoffTime = Date.now() - olderThanMs;
        const originalSize = this.eventHistory.length;

        this.eventHistory = this.eventHistory.filter(
            e => e.metadata.timestamp > cutoffTime
        );

        const cleaned = originalSize - this.eventHistory.length;
        console.log(`[EVENT-BUS] 🧹 Limpiados ${cleaned} eventos del historial`);

        return cleaned;
    }

    /**
     * Métodos privados
     */
    addToHistory(event) {
        this.eventHistory.push(event);

        // Mantener tamaño máximo del historial
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
    }

    updateStats(eventType) {
        this.stats.totalEvents++;

        if (!this.stats.eventsByType[eventType]) {
            this.stats.eventsByType[eventType] = 0;
        }
        this.stats.eventsByType[eventType]++;
    }

    generateEventId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Singleton pattern
let instance = null;

module.exports = {
    getInstance: () => {
        if (!instance) {
            instance = new EventBusService();
        }
        return instance;
    },
    EventBusService
};
