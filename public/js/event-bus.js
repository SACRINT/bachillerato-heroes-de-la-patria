/**
 * EVENT BUS - Cliente Frontend
 *
 * Propósito: Sistema de eventos para desacoplar módulos del dashboard
 * Patrón: Pub/Sub (Observer Pattern)
 *
 * Uso:
 *   eventBus.emit('student.created', { id: 1, name: 'Juan' });
 *   eventBus.on('student.created', (event) => void 0);
 *
 * Versión: 1.0.0
 * Fecha: 21 Noviembre 2025
 * Parte de: SEMANA 1 - Refactorización Admin Dashboard
 */

(function(window) {
    'use strict';

    class EventBus {
        constructor() {
            this.listeners = new Map();
            this.eventHistory = [];
            this.maxHistorySize = 500;

            // Statistics
            this.stats = {
                totalEvents: 0,
                eventsByType: {},
                errors: 0
            };
        }

        /**
         * Emitir evento
         * @param {string} eventType - Tipo de evento
         * @param {any} data - Datos del evento
         * @param {object} options - Opciones (broadcast, async, etc)
         */
        emit(eventType, data, options = {}) {
            const { async = false, broadcast = false } = options;

            const event = {
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
            if (broadcast && typeof BroadcastChannel !== 'undefined') {
                this.broadcastToOtherTabs(event);
            }

            return event;
        }

        /**
         * Suscribirse a un evento
         * @param {string} eventType - Tipo de evento
         * @param {function} callback - Callback a ejecutar
         * @param {object} options - Opciones (once, priority)
         */
        on(eventType, callback, options = {}) {
            const { once = false, priority = 0 } = options;

            if (!this.listeners.has(eventType)) {
                this.listeners.set(eventType, []);
            }

            const listener = {
                callback: callback,
                once: once,
                priority: priority,
                id: this.generateListenerId()
            };

            const listeners = this.listeners.get(eventType);
            listeners.push(listener);

            // Ordenar por prioridad (mayor prioridad primero)
            listeners.sort((a, b) => b.priority - a.priority);

            // Retornar función para desuscribirse
            return () => this.off(eventType, listener.id);
        }

        /**
         * Suscribirse a un evento solo una vez
         * @param {string} eventType - Tipo de evento
         * @param {function} callback - Callback a ejecutar
         */
        once(eventType, callback) {
            return this.on(eventType, callback, { once: true });
        }

        /**
         * Desuscribirse de un evento
         * @param {string} eventType - Tipo de evento
         * @param {string} listenerId - ID del listener (opcional)
         */
        off(eventType, listenerId = null) {
            if (!this.listeners.has(eventType)) {
                return;
            }

            const listeners = this.listeners.get(eventType);

            if (listenerId) {
                const index = listeners.findIndex(l => l.id === listenerId);
                if (index !== -1) {
                    listeners.splice(index, 1);
                    void 0;
                }
            } else {
                this.listeners.delete(eventType);
                void 0;
            }

            // Limpiar si no quedan listeners
            if (listeners.length === 0) {
                this.listeners.delete(eventType);
            }
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
         * Obtener estadísticas
         */
        getStats() {
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
        clear() {
            this.listeners.clear();
            void 0;
        }

        /**
         * Métodos privados
         */
        executeListenersSync(listeners, event) {
            listeners.forEach(listener => {
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

        async executeListenersAsync(listeners, event) {
            const promises = listeners.map(async (listener) => {
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

        broadcastToOtherTabs(event) {
            try {
                const channel = new BroadcastChannel('eventBus');
                channel.postMessage(event);
                channel.close();
            } catch (error) {
                void 0;
            }
        }

        addToHistory(event) {
            this.eventHistory.push(event);

            // Mantener tamaño máximo
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

        generateListenerId() {
            return `listener-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
    }

    // Crear instancia global
    window.eventBus = new EventBus();

    // Listener para eventos de otros tabs (si BroadcastChannel está disponible)
    if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('eventBus');
        channel.onmessage = (msg) => {
            const event = msg.data;
            void 0;
            window.eventBus.emit(event.type, event.data);
        };
    }

})(window);
