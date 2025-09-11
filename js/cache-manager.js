/**
 * 💾 GESTOR DE CACHÉ AVANZADO
 * Sistema inteligente de caché multinivel con TTL y limpieza automática
 */

class CacheManager {
    constructor() {
        this.memoryCache = new Map();
        this.localStoragePrefix = 'heroes_cache_';
        this.sessionStoragePrefix = 'heroes_session_';
        this.dbName = 'HeroesPatriaCache';
        this.dbVersion = 1;
        this.indexedDB = null;
        
        this.defaultTTL = {
            memory: 5 * 60 * 1000,        // 5 minutos
            localStorage: 24 * 60 * 60 * 1000,  // 24 horas
            sessionStorage: 30 * 60 * 1000,     // 30 minutos
            indexedDB: 7 * 24 * 60 * 60 * 1000  // 7 días
        };
        
        this.maxMemorySize = 50; // Máximo 50 elementos en memoria
        this.cleanupInterval = 10 * 60 * 1000; // Limpieza cada 10 minutos
        
        this.init();
    }

    async init() {
        await this.initIndexedDB();
        this.startCleanupScheduler();
        this.setupStorageListeners();
        console.log('💾 Cache Manager inicializado');
    }

    // ============================================
    // INDEXEDDB SETUP
    // ============================================

    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                console.warn('IndexedDB no soportado');
                resolve();
                return;
            }

            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.warn('Error inicializando IndexedDB:', request.error);
                resolve();
            };
            
            request.onsuccess = () => {
                this.indexedDB = request.result;
                console.log('✅ IndexedDB inicializado');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Store para caché general
                if (!db.objectStoreNames.contains('cache')) {
                    const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
                    cacheStore.createIndex('expiry', 'expiry', { unique: false });
                }
                
                // Store para datos API
                if (!db.objectStoreNames.contains('api_cache')) {
                    const apiStore = db.createObjectStore('api_cache', { keyPath: 'key' });
                    apiStore.createIndex('expiry', 'expiry', { unique: false });
                    apiStore.createIndex('endpoint', 'endpoint', { unique: false });
                }
                
                // Store para assets
                if (!db.objectStoreNames.contains('assets')) {
                    const assetsStore = db.createObjectStore('assets', { keyPath: 'key' });
                    assetsStore.createIndex('type', 'type', { unique: false });
                }
            };
        });
    }

    // ============================================
    // MÉTODOS PRINCIPALES DE CACHÉ
    // ============================================

    async set(key, data, options = {}) {
        const {
            storage = 'memory',
            ttl = this.defaultTTL[storage],
            compress = false,
            tags = []
        } = options;

        const cacheItem = {
            key,
            data: compress ? this.compress(data) : data,
            timestamp: Date.now(),
            expiry: Date.now() + ttl,
            compressed: compress,
            tags,
            size: this.calculateSize(data)
        };

        try {
            switch (storage) {
                case 'memory':
                    await this.setMemoryCache(key, cacheItem);
                    break;
                case 'localStorage':
                    await this.setLocalStorage(key, cacheItem);
                    break;
                case 'sessionStorage':
                    await this.setSessionStorage(key, cacheItem);
                    break;
                case 'indexedDB':
                    await this.setIndexedDBCache(key, cacheItem);
                    break;
                default:
                    throw new Error(`Tipo de storage no soportado: ${storage}`);
            }
            
            console.log(`💾 Cached: ${key} (${storage})`);
            return true;
        } catch (error) {
            console.warn(`Error caching ${key}:`, error);
            return false;
        }
    }

    async get(key, options = {}) {
        const { fallbackStorage = ['memory', 'localStorage', 'sessionStorage', 'indexedDB'] } = options;
        
        const storages = Array.isArray(fallbackStorage) ? fallbackStorage : [fallbackStorage];
        
        for (const storage of storages) {
            try {
                const item = await this.getFromStorage(key, storage);
                if (item && !this.isExpired(item)) {
                    const data = item.compressed ? this.decompress(item.data) : item.data;
                    console.log(`💾 Cache hit: ${key} (${storage})`);
                    return data;
                }
            } catch (error) {
                console.warn(`Error getting ${key} from ${storage}:`, error);
            }
        }
        
        console.log(`💾 Cache miss: ${key}`);
        return null;
    }

    async has(key, storage = 'memory') {
        try {
            const item = await this.getFromStorage(key, storage);
            return item && !this.isExpired(item);
        } catch (error) {
            return false;
        }
    }

    async delete(key, storage = null) {
        const storages = storage ? [storage] : ['memory', 'localStorage', 'sessionStorage', 'indexedDB'];
        
        for (const storageType of storages) {
            try {
                await this.deleteFromStorage(key, storageType);
            } catch (error) {
                console.warn(`Error deleting ${key} from ${storageType}:`, error);
            }
        }
    }

    // ============================================
    // MÉTODOS ESPECÍFICOS POR STORAGE
    // ============================================

    async setMemoryCache(key, item) {
        // Controlar tamaño de memoria cache
        if (this.memoryCache.size >= this.maxMemorySize) {
            this.evictOldestMemoryItem();
        }
        
        this.memoryCache.set(key, item);
    }

    async setLocalStorage(key, item) {
        const storageKey = this.localStoragePrefix + key;
        try {
            localStorage.setItem(storageKey, JSON.stringify(item));
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                await this.cleanupExpiredLocalStorage();
                localStorage.setItem(storageKey, JSON.stringify(item));
            } else {
                throw error;
            }
        }
    }

    async setSessionStorage(key, item) {
        const storageKey = this.sessionStoragePrefix + key;
        try {
            sessionStorage.setItem(storageKey, JSON.stringify(item));
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                await this.cleanupExpiredSessionStorage();
                sessionStorage.setItem(storageKey, JSON.stringify(item));
            } else {
                throw error;
            }
        }
    }

    async setIndexedDBCache(key, item) {
        if (!this.indexedDB) return false;
        
        return new Promise((resolve, reject) => {
            const transaction = this.indexedDB.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            const request = store.put(item);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async getFromStorage(key, storage) {
        switch (storage) {
            case 'memory':
                return this.memoryCache.get(key);
            case 'localStorage':
                const localItem = localStorage.getItem(this.localStoragePrefix + key);
                return localItem ? JSON.parse(localItem) : null;
            case 'sessionStorage':
                const sessionItem = sessionStorage.getItem(this.sessionStoragePrefix + key);
                return sessionItem ? JSON.parse(sessionItem) : null;
            case 'indexedDB':
                return await this.getFromIndexedDB(key);
            default:
                return null;
        }
    }

    async getFromIndexedDB(key) {
        if (!this.indexedDB) return null;
        
        return new Promise((resolve) => {
            const transaction = this.indexedDB.transaction(['cache'], 'readonly');
            const store = transaction.objectStore('cache');
            const request = store.get(key);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
        });
    }

    async deleteFromStorage(key, storage) {
        switch (storage) {
            case 'memory':
                this.memoryCache.delete(key);
                break;
            case 'localStorage':
                localStorage.removeItem(this.localStoragePrefix + key);
                break;
            case 'sessionStorage':
                sessionStorage.removeItem(this.sessionStoragePrefix + key);
                break;
            case 'indexedDB':
                await this.deleteFromIndexedDB(key);
                break;
        }
    }

    async deleteFromIndexedDB(key) {
        if (!this.indexedDB) return;
        
        return new Promise((resolve) => {
            const transaction = this.indexedDB.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            const request = store.delete(key);
            
            request.onsuccess = () => resolve();
            request.onerror = () => resolve();
        });
    }

    // ============================================
    // API CACHE ESPECIALIZADO
    // ============================================

    async cacheAPIResponse(endpoint, data, options = {}) {
        const key = `api_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
        return await this.set(key, {
            endpoint,
            data,
            cached_at: new Date().toISOString()
        }, {
            storage: 'indexedDB',
            ttl: options.ttl || this.defaultTTL.indexedDB,
            tags: ['api', ...(options.tags || [])]
        });
    }

    async getCachedAPIResponse(endpoint) {
        const key = `api_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
        return await this.get(key, { fallbackStorage: ['indexedDB', 'localStorage'] });
    }

    // ============================================
    // ASSET CACHE
    // ============================================

    async cacheAsset(url, blob, type = 'image') {
        const key = `asset_${btoa(url).replace(/[^a-zA-Z0-9]/g, '')}`;
        
        if (this.indexedDB) {
            return new Promise((resolve) => {
                const transaction = this.indexedDB.transaction(['assets'], 'readwrite');
                const store = transaction.objectStore('assets');
                const request = store.put({
                    key,
                    url,
                    blob,
                    type,
                    cached_at: Date.now(),
                    size: blob.size
                });
                
                request.onsuccess = () => resolve(true);
                request.onerror = () => resolve(false);
            });
        }
        
        return false;
    }

    async getCachedAsset(url) {
        if (!this.indexedDB) return null;
        
        const key = `asset_${btoa(url).replace(/[^a-zA-Z0-9]/g, '')}`;
        
        return new Promise((resolve) => {
            const transaction = this.indexedDB.transaction(['assets'], 'readonly');
            const store = transaction.objectStore('assets');
            const request = store.get(key);
            
            request.onsuccess = () => {
                const result = request.result;
                if (result) {
                    resolve(URL.createObjectURL(result.blob));
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => resolve(null);
        });
    }

    // ============================================
    // LIMPIEZA Y MANTENIMIENTO
    // ============================================

    startCleanupScheduler() {
        setInterval(() => {
            this.cleanup();
        }, this.cleanupInterval);
    }

    async cleanup() {
        console.log('🧹 Iniciando limpieza de caché...');
        
        await Promise.all([
            this.cleanupMemoryCache(),
            this.cleanupExpiredLocalStorage(),
            this.cleanupExpiredSessionStorage(),
            this.cleanupExpiredIndexedDB()
        ]);
        
        console.log('✅ Limpieza de caché completada');
    }

    cleanupMemoryCache() {
        const now = Date.now();
        for (const [key, item] of this.memoryCache.entries()) {
            if (this.isExpired(item)) {
                this.memoryCache.delete(key);
            }
        }
    }

    async cleanupExpiredLocalStorage() {
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.localStoragePrefix)) {
                try {
                    const item = JSON.parse(localStorage.getItem(key));
                    if (this.isExpired(item)) {
                        keysToRemove.push(key);
                    }
                } catch (error) {
                    keysToRemove.push(key); // Eliminar elementos corruptos
                }
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    async cleanupExpiredSessionStorage() {
        const keysToRemove = [];
        
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith(this.sessionStoragePrefix)) {
                try {
                    const item = JSON.parse(sessionStorage.getItem(key));
                    if (this.isExpired(item)) {
                        keysToRemove.push(key);
                    }
                } catch (error) {
                    keysToRemove.push(key);
                }
            }
        }
        
        keysToRemove.forEach(key => sessionStorage.removeItem(key));
    }

    async cleanupExpiredIndexedDB() {
        if (!this.indexedDB) return;
        
        return new Promise((resolve) => {
            const transaction = this.indexedDB.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            const index = store.index('expiry');
            const request = index.openCursor(IDBKeyRange.upperBound(Date.now()));
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            
            request.onerror = () => resolve();
        });
    }

    evictOldestMemoryItem() {
        let oldestKey = null;
        let oldestTime = Date.now();
        
        for (const [key, item] of this.memoryCache.entries()) {
            if (item.timestamp < oldestTime) {
                oldestTime = item.timestamp;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            this.memoryCache.delete(oldestKey);
        }
    }

    // ============================================
    // UTILIDADES
    // ============================================

    isExpired(item) {
        return Date.now() > item.expiry;
    }

    calculateSize(data) {
        return new Blob([JSON.stringify(data)]).size;
    }

    compress(data) {
        // Compresión simple - en producción usar LZ4 o similar
        return JSON.stringify(data);
    }

    decompress(data) {
        return JSON.parse(data);
    }

    setupStorageListeners() {
        // Listener para storage events (sincronización entre tabs)
        window.addEventListener('storage', (event) => {
            if (event.key && event.key.startsWith(this.localStoragePrefix)) {
                console.log('🔄 Storage sincronizado entre tabs');
            }
        });
        
        // Listener para page visibility (limpiar al ocultar página)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.cleanup();
            }
        });
    }

    // ============================================
    // API PÚBLICA
    // ============================================

    async clear(storage = null) {
        if (storage) {
            await this.clearStorage(storage);
        } else {
            await Promise.all([
                this.clearStorage('memory'),
                this.clearStorage('localStorage'),
                this.clearStorage('sessionStorage'),
                this.clearStorage('indexedDB')
            ]);
        }
        console.log('🗑️ Caché limpiado');
    }

    async clearStorage(storage) {
        switch (storage) {
            case 'memory':
                this.memoryCache.clear();
                break;
            case 'localStorage':
                Object.keys(localStorage)
                    .filter(key => key.startsWith(this.localStoragePrefix))
                    .forEach(key => localStorage.removeItem(key));
                break;
            case 'sessionStorage':
                Object.keys(sessionStorage)
                    .filter(key => key.startsWith(this.sessionStoragePrefix))
                    .forEach(key => sessionStorage.removeItem(key));
                break;
            case 'indexedDB':
                if (this.indexedDB) {
                    await new Promise(resolve => {
                        const transaction = this.indexedDB.transaction(['cache', 'assets'], 'readwrite');
                        transaction.objectStore('cache').clear();
                        transaction.objectStore('assets').clear();
                        transaction.oncomplete = () => resolve();
                    });
                }
                break;
        }
    }

    getStats() {
        const stats = {
            memory: this.memoryCache.size,
            localStorage: Object.keys(localStorage)
                .filter(key => key.startsWith(this.localStoragePrefix)).length,
            sessionStorage: Object.keys(sessionStorage)
                .filter(key => key.startsWith(this.sessionStoragePrefix)).length
        };
        
        console.table(stats);
        return stats;
    }
}

// Inicializar Cache Manager
document.addEventListener('DOMContentLoaded', () => {
    window.cacheManager = new CacheManager();
});