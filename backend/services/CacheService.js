/**
 * Servicio de Caché en Memoria
 * BGE Héroes de la Patria
 * FASE 4 - Semana 25-26
 *
 * Sistema de caché para optimización de rendimiento
 */

class CacheService {
    constructor() {
        // Almacenamiento en memoria
        this.cache = new Map();

        // Configuración por defecto
        this.defaultTTL = 300; // 5 minutos
        this.maxSize = 1000; // Máximo de items

        // Estadísticas
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };

        // Limpieza automática cada minuto
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000);

        console.log('[CACHE] Servicio de caché inicializado');
    }

    /**
     * Obtener valor del caché
     */
    get(key) {
        const item = this.cache.get(key);

        if (!item) {
            this.stats.misses++;
            return null;
        }

        // Verificar expiración
        if (item.expiresAt && item.expiresAt < Date.now()) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }

        this.stats.hits++;
        item.accessCount++;
        item.lastAccessed = Date.now();

        return item.value;
    }

    /**
     * Guardar valor en caché
     */
    set(key, value, ttlSeconds = this.defaultTTL) {
        // Verificar tamaño máximo
        if (this.cache.size >= this.maxSize) {
            this.evictLRU();
        }

        const item = {
            value,
            createdAt: Date.now(),
            expiresAt: ttlSeconds > 0 ? Date.now() + (ttlSeconds * 1000) : null,
            accessCount: 0,
            lastAccessed: Date.now()
        };

        this.cache.set(key, item);
        this.stats.sets++;

        return true;
    }

    /**
     * Eliminar valor del caché
     */
    delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.stats.deletes++;
        }
        return deleted;
    }

    /**
     * Verificar si existe una clave
     */
    has(key) {
        const item = this.cache.get(key);
        if (!item) return false;

        if (item.expiresAt && item.expiresAt < Date.now()) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Obtener o establecer (cache-aside pattern)
     */
    async getOrSet(key, fetchFn, ttlSeconds = this.defaultTTL) {
        // Intentar obtener del caché
        const cached = this.get(key);
        if (cached !== null) {
            return cached;
        }

        // Obtener datos frescos
        const value = await fetchFn();

        // Guardar en caché
        if (value !== undefined && value !== null) {
            this.set(key, value, ttlSeconds);
        }

        return value;
    }

    /**
     * Invalidar por patrón
     */
    invalidatePattern(pattern) {
        let count = 0;
        const regex = new RegExp(pattern);

        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
                count++;
            }
        }

        this.stats.deletes += count;
        return count;
    }

    /**
     * Limpiar todo el caché
     */
    clear() {
        const size = this.cache.size;
        this.cache.clear();
        this.stats.deletes += size;
        return size;
    }

    /**
     * Limpiar items expirados
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, item] of this.cache.entries()) {
            if (item.expiresAt && item.expiresAt < now) {
                this.cache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`[CACHE] Limpiados ${cleaned} items expirados`);
        }

        return cleaned;
    }

    /**
     * Evictar el menos usado recientemente (LRU)
     */
    evictLRU() {
        let oldestKey = null;
        let oldestTime = Infinity;

        for (const [key, item] of this.cache.entries()) {
            if (item.lastAccessed < oldestTime) {
                oldestTime = item.lastAccessed;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
            console.log(`[CACHE] Evictado LRU: ${oldestKey}`);
        }
    }

    /**
     * Obtener estadísticas del caché
     */
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.stats.hits,
            misses: this.stats.misses,
            hitRate: `${hitRate}%`,
            sets: this.stats.sets,
            deletes: this.stats.deletes
        };
    }

    /**
     * Obtener claves por patrón
     */
    keys(pattern = null) {
        const allKeys = Array.from(this.cache.keys());

        if (!pattern) return allKeys;

        const regex = new RegExp(pattern);
        return allKeys.filter(key => regex.test(key));
    }

    /**
     * Cerrar el servicio
     */
    close() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.clear();
        console.log('[CACHE] Servicio de caché cerrado');
    }
}

// Instancia singleton
const cacheService = new CacheService();

// Helpers para claves comunes
const cacheKeys = {
    // Usuarios
    user: (id) => `user:${id}`,
    userProfile: (id) => `user:${id}:profile`,
    userLevel: (id) => `user:${id}:level`,

    // IACoins
    wallet: (userId) => `wallet:${userId}`,
    transactions: (userId) => `transactions:${userId}`,

    // Torneos
    tournament: (id) => `tournament:${id}`,
    tournamentLeaderboard: (id) => `tournament:${id}:leaderboard`,
    tournamentParticipants: (id) => `tournament:${id}:participants`,

    // Marketplace
    marketplaceItem: (id) => `marketplace:item:${id}`,
    marketplaceCategories: () => `marketplace:categories`,
    marketplaceFeatured: () => `marketplace:featured`,

    // Foros
    forumCategories: () => `forum:categories`,
    forumTopic: (id) => `forum:topic:${id}`,
    forumTrending: () => `forum:trending`,

    // Analíticas
    analyticsDaily: (date) => `analytics:daily:${date}`,
    analyticsDashboard: () => `analytics:dashboard`,

    // Configuración
    tenantConfig: (domain) => `tenant:${domain}:config`,
    publicConfig: () => `config:public`
};

module.exports = {
    cache: cacheService,
    cacheKeys
};
