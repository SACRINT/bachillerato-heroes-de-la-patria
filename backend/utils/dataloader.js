/**
 * 🚀 DATALOADER - N+1 QUERY OPTIMIZATION - SEMANA 3
 * Resuelve el problema N+1 queries mediante batching y caching
 *
 * Problema N+1:
 * - 1 query para obtener lista de estudiantes
 * - N queries para obtener calificaciones de cada estudiante
 * - Total: 1 + N queries (MUY LENTO para N > 100)
 *
 * Solución con DataLoader:
 * - 1 query para estudiantes
 * - 1 query BATCH para TODAS las calificaciones
 * - Total: 2 queries (RÁPIDO sin importar N)
 *
 * Inspirado en: https://github.com/graphql/dataloader
 */

/**
 * DataLoader genérico para batching y caching
 */
class DataLoader {
    constructor(batchLoadFn, options = {}) {
        this.batchLoadFn = batchLoadFn;
        this.cache = options.cache !== false;
        this.cacheMap = new Map();
        this.queue = [];
        this.batchScheduled = false;
        this.maxBatchSize = options.maxBatchSize || 100;
        this.batchScheduleFn = options.batchScheduleFn || (fn => process.nextTick(fn));
    }

    /**
     * Cargar un item (con batching automático)
     * @param {*} key - ID del item a cargar
     * @returns {Promise} Promesa que resuelve al item
     */
    load(key) {
        if (key === null || key === undefined) {
            return Promise.reject(new Error('DataLoader key cannot be null or undefined'));
        }

        // Verificar caché primero
        if (this.cache && this.cacheMap.has(key)) {
            return Promise.resolve(this.cacheMap.get(key));
        }

        // Agregar a queue de batching
        return new Promise((resolve, reject) => {
            this.queue.push({ key, resolve, reject });

            // Programar batch si no está programado
            if (!this.batchScheduled) {
                this.batchScheduled = true;
                this.batchScheduleFn(() => this.dispatchQueue());
            }
        });
    }

    /**
     * Cargar múltiples items (con batching)
     * @param {Array} keys - Array de IDs
     * @returns {Promise<Array>} Array de items
     */
    loadMany(keys) {
        return Promise.all(keys.map(key => this.load(key)));
    }

    /**
     * Despachar queue (ejecutar batch query)
     */
    async dispatchQueue() {
        this.batchScheduled = false;

        const queue = this.queue;
        this.queue = [];

        if (queue.length === 0) {
            return;
        }

        // Agrupar por tamaño de batch
        const batches = [];
        for (let i = 0; i < queue.length; i += this.maxBatchSize) {
            batches.push(queue.slice(i, i + this.maxBatchSize));
        }

        // Ejecutar cada batch
        for (const batch of batches) {
            const keys = batch.map(item => item.key);

            try {
                // Ejecutar batch load function
                const results = await this.batchLoadFn(keys);

                // Validar resultados
                if (!Array.isArray(results)) {
                    throw new Error('DataLoader batchLoadFn must return an Array');
                }

                if (results.length !== keys.length) {
                    throw new Error(
                        `DataLoader batchLoadFn returned ${results.length} results for ${keys.length} keys`
                    );
                }

                // Resolver promesas y cachear
                batch.forEach((item, index) => {
                    const value = results[index];

                    if (value instanceof Error) {
                        item.reject(value);
                    } else {
                        // Cachear resultado
                        if (this.cache) {
                            this.cacheMap.set(item.key, value);
                        }

                        item.resolve(value);
                    }
                });

            } catch (error) {
                // Rechazar todas las promesas del batch
                batch.forEach(item => item.reject(error));
            }
        }
    }

    /**
     * Limpiar caché
     */
    clear(key) {
        if (key === undefined) {
            this.cacheMap.clear();
        } else {
            this.cacheMap.delete(key);
        }
        return this;
    }

    /**
     * Pre-cargar valor en caché
     */
    prime(key, value) {
        if (this.cache) {
            this.cacheMap.set(key, value);
        }
        return this;
    }
}

module.exports = DataLoader;
