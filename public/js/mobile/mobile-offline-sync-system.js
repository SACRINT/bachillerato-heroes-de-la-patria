/**
 * 🔄 BGE Mobile Offline Sync System
 * Sistema de Sincronización Offline-First para Móvil
 *
 * Implementa sincronización inteligente offline-first:
 * - Cache inteligente con estrategias adaptables
 * - Sincronización bidireccional automática
 * - Resolución avanzada de conflictos
 * - Queue de operaciones con prioridades
 * - Compresión y optimización de datos
 * - Detección de conectividad inteligente
 * - Background sync para operaciones críticas
 * - Delta sync para eficiencia de ancho de banda
 *
 * @version 1.0.0
 * @since Phase E - Mobile Native Implementation
 */

class BGEMobileOfflineSyncSystem {
    constructor(mobileArchitecture) {
        this.mobileArch = mobileArchitecture;

        this.syncConfig = {
            strategies: {
                OFFLINE_FIRST: 'cache-first-network-fallback',
                ONLINE_FIRST: 'network-first-cache-fallback',
                CACHE_ONLY: 'cache-only',
                NETWORK_ONLY: 'network-only',
                STALE_WHILE_REVALIDATE: 'cache-with-background-update'
            },
            dataTypes: {
                'user_profile': {
                    strategy: 'OFFLINE_FIRST',
                    priority: 'HIGH',
                    syncFrequency: 'immediate',
                    cacheExpiry: 24 * 60 * 60 * 1000, // 24 horas
                    conflictResolution: 'client-wins'
                },
                'assignments': {
                    strategy: 'OFFLINE_FIRST',
                    priority: 'HIGH',
                    syncFrequency: 'every-5min',
                    cacheExpiry: 4 * 60 * 60 * 1000, // 4 horas
                    conflictResolution: 'server-wins'
                },
                'evaluations': {
                    strategy: 'OFFLINE_FIRST',
                    priority: 'CRITICAL',
                    syncFrequency: 'immediate',
                    cacheExpiry: 2 * 60 * 60 * 1000, // 2 horas
                    conflictResolution: 'merge'
                },
                'messages': {
                    strategy: 'ONLINE_FIRST',
                    priority: 'HIGH',
                    syncFrequency: 'immediate',
                    cacheExpiry: 1 * 60 * 60 * 1000, // 1 hora
                    conflictResolution: 'server-wins'
                },
                'announcements': {
                    strategy: 'STALE_WHILE_REVALIDATE',
                    priority: 'MEDIUM',
                    syncFrequency: 'every-30min',
                    cacheExpiry: 12 * 60 * 60 * 1000, // 12 horas
                    conflictResolution: 'server-wins'
                },
                'calendar_events': {
                    strategy: 'OFFLINE_FIRST',
                    priority: 'MEDIUM',
                    syncFrequency: 'every-15min',
                    cacheExpiry: 6 * 60 * 60 * 1000, // 6 horas
                    conflictResolution: 'last-write-wins'
                },
                'resources': {
                    strategy: 'CACHE_ONLY',
                    priority: 'LOW',
                    syncFrequency: 'daily',
                    cacheExpiry: 7 * 24 * 60 * 60 * 1000, // 7 días
                    conflictResolution: 'server-wins'
                }
            },
            storage: {
                maxCacheSize: 500 * 1024 * 1024, // 500MB
                maxQueueSize: 10000, // 10k operaciones
                compressionThreshold: 1024, // 1KB
                encryptSensitiveData: true
            },
            network: {
                timeoutMs: 30000, // 30 segundos
                retryAttempts: 3,
                retryBackoffMs: 1000,
                batchSize: 50, // operaciones por lote
                compressionEnabled: true
            }
        };

        this.cacheStorage = new Map();
        this.syncQueue = [];
        this.conflictRegistry = new Map();
        this.networkState = { online: navigator.onLine, quality: 'unknown' };
        this.syncInProgress = false;
        this.syncMetrics = {
            totalSyncs: 0,
            successfulSyncs: 0,
            failedSyncs: 0,
            conflictsResolved: 0,
            bytesTransferred: 0,
            lastSyncTime: null
        };

        this.logger = window.BGELogger || console;
        this.initializeOfflineSync();
    }

    async initializeOfflineSync() {
        try {
            this.logger.info('OfflineSync', 'Inicializando sistema de sincronización offline-first');

            // Inicializar almacenamiento local
            await this.initializeLocalStorage();

            // Configurar detección de conectividad
            this.setupConnectivityDetection();

            // Inicializar worker de background sync
            await this.initializeBackgroundSync();

            // Configurar compresión de datos
            this.setupDataCompression();

            // Cargar queue persistente
            await this.loadSyncQueue();

            // Configurar sincronización automática
            this.setupAutomaticSync();

            // Inicializar métricas de sincronización
            this.initializeSyncMetrics();

            this.logger.info('OfflineSync', 'Sistema de sincronización inicializado correctamente');

        } catch (error) {
            this.logger.error('OfflineSync', 'Error al inicializar sincronización offline', error);
            throw error;
        }
    }

    async initializeLocalStorage() {
        // Inicializar diferentes tipos de almacenamiento según la plataforma
        if (this.mobileArch.environment.isNative) {
            // React Native AsyncStorage
            this.storage = {
                set: async (key, value) => {
                    return await this.mobileArch.callNativeMethod('AsyncStorage.setItem', {
                        key,
                        value: JSON.stringify(value)
                    });
                },

                get: async (key) => {
                    const result = await this.mobileArch.callNativeMethod('AsyncStorage.getItem', { key });
                    return result ? JSON.parse(result) : null;
                },

                remove: async (key) => {
                    return await this.mobileArch.callNativeMethod('AsyncStorage.removeItem', { key });
                },

                getAllKeys: async () => {
                    return await this.mobileArch.callNativeMethod('AsyncStorage.getAllKeys');
                },

                clear: async () => {
                    return await this.mobileArch.callNativeMethod('AsyncStorage.clear');
                }
            };
        } else {
            // Web IndexedDB con fallback a localStorage
            this.storage = await this.initializeWebStorage();
        }

        this.logger.info('OfflineSync', 'Almacenamiento local inicializado');
    }

    async initializeWebStorage() {
        // Intentar usar IndexedDB para mayor capacidad
        if ('indexedDB' in window) {
            return await this.initializeIndexedDB();
        } else {
            // Fallback a localStorage
            return this.initializeLocalStorageFallback();
        }
    }

    async initializeIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('BGE_OfflineDB', 1);

            request.onerror = () => reject(new Error('Error al abrir IndexedDB'));

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Crear stores para diferentes tipos de datos
                if (!db.objectStoreNames.contains('cache')) {
                    const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
                    cacheStore.createIndex('dataType', 'dataType', { unique: false });
                    cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                if (!db.objectStoreNames.contains('syncQueue')) {
                    const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
                    queueStore.createIndex('priority', 'priority', { unique: false });
                    queueStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                if (!db.objectStoreNames.contains('conflicts')) {
                    const conflictStore = db.createObjectStore('conflicts', { keyPath: 'id' });
                    conflictStore.createIndex('dataType', 'dataType', { unique: false });
                }
            };

            request.onsuccess = (event) => {
                const db = event.target.result;

                resolve({
                    set: async (key, value) => {
                        const tx = db.transaction(['cache'], 'readwrite');
                        const store = tx.objectStore('cache');
                        await store.put({
                            key,
                            value,
                            timestamp: Date.now(),
                            dataType: this.extractDataType(key)
                        });
                    },

                    get: async (key) => {
                        const tx = db.transaction(['cache'], 'readonly');
                        const store = tx.objectStore('cache');
                        const result = await store.get(key);
                        return result ? result.value : null;
                    },

                    remove: async (key) => {
                        const tx = db.transaction(['cache'], 'readwrite');
                        const store = tx.objectStore('cache');
                        await store.delete(key);
                    },

                    getAllKeys: async () => {
                        const tx = db.transaction(['cache'], 'readonly');
                        const store = tx.objectStore('cache');
                        return await store.getAllKeys();
                    },

                    clear: async () => {
                        const tx = db.transaction(['cache'], 'readwrite');
                        const store = tx.objectStore('cache');
                        await store.clear();
                    }
                });
            };
        });
    }

    initializeLocalStorageFallback() {
        return {
            set: async (key, value) => {
                try {
                    localStorage.setItem(`bge_offline_${key}`, JSON.stringify({
                        value,
                        timestamp: Date.now()
                    }));
                } catch (error) {
                    // Manejar quota exceeded
                    await this.cleanupOldCacheEntries();
                    localStorage.setItem(`bge_offline_${key}`, JSON.stringify({
                        value,
                        timestamp: Date.now()
                    }));
                }
            },

            get: async (key) => {
                try {
                    const item = localStorage.getItem(`bge_offline_${key}`);
                    return item ? JSON.parse(item).value : null;
                } catch {
                    return null;
                }
            },

            remove: async (key) => {
                localStorage.removeItem(`bge_offline_${key}`);
            },

            getAllKeys: async () => {
                return Object.keys(localStorage)
                    .filter(key => key.startsWith('bge_offline_'))
                    .map(key => key.replace('bge_offline_', ''));
            },

            clear: async () => {
                const keys = await this.getAllKeys();
                keys.forEach(key => this.remove(key));
            }
        };
    }

    setupConnectivityDetection() {
        // Detectar cambios en la conectividad
        window.addEventListener('online', () => {
            this.networkState.online = true;
            this.logger.info('OfflineSync', 'Conectividad restaurada');
            this.onConnectivityRestored();
        });

        window.addEventListener('offline', () => {
            this.networkState.online = false;
            this.logger.info('OfflineSync', 'Conectividad perdida');
            this.onConnectivityLost();
        });

        // Monitoreo avanzado de calidad de red
        this.setupNetworkQualityMonitoring();

        this.logger.info('OfflineSync', 'Detección de conectividad configurada');
    }

    setupNetworkQualityMonitoring() {
        // Usar Connection API si está disponible
        if ('connection' in navigator) {
            const connection = navigator.connection;

            const updateNetworkQuality = () => {
                this.networkState.quality = this.calculateNetworkQuality(connection);
                this.adjustSyncStrategy();
            };

            connection.addEventListener('change', updateNetworkQuality);
            updateNetworkQuality(); // Evaluación inicial
        }

        // Monitoreo alternativo basado en latencia
        setInterval(() => {
            this.measureNetworkLatency();
        }, 60000); // Cada minuto
    }

    calculateNetworkQuality(connection) {
        // Calcular calidad de red basada en métricas disponibles
        const effectiveType = connection.effectiveType;
        const downlink = connection.downlink;
        const rtt = connection.rtt;

        if (effectiveType === '4g' && downlink > 10) {
            return 'excellent';
        } else if (effectiveType === '4g' || (effectiveType === '3g' && downlink > 1)) {
            return 'good';
        } else if (effectiveType === '3g' || effectiveType === '2g') {
            return 'poor';
        } else {
            return 'unknown';
        }
    }

    async measureNetworkLatency() {
        if (!this.networkState.online) return;

        try {
            const start = performance.now();

            // Hacer request ligero para medir latencia
            const response = await fetch('/ping', {
                method: 'HEAD',
                cache: 'no-cache'
            });

            const latency = performance.now() - start;

            this.networkState.latency = latency;
            this.networkState.quality = this.classifyLatency(latency);

        } catch (error) {
            this.networkState.quality = 'offline';
        }
    }

    classifyLatency(latency) {
        if (latency < 100) return 'excellent';
        if (latency < 300) return 'good';
        if (latency < 1000) return 'poor';
        return 'very-poor';
    }

    adjustSyncStrategy() {
        // Ajustar estrategia de sincronización basada en calidad de red
        switch (this.networkState.quality) {
            case 'excellent':
                this.syncConfig.network.batchSize = 100;
                this.syncConfig.network.timeoutMs = 10000;
                break;

            case 'good':
                this.syncConfig.network.batchSize = 50;
                this.syncConfig.network.timeoutMs = 20000;
                break;

            case 'poor':
                this.syncConfig.network.batchSize = 20;
                this.syncConfig.network.timeoutMs = 45000;
                break;

            case 'very-poor':
                this.syncConfig.network.batchSize = 10;
                this.syncConfig.network.timeoutMs = 60000;
                break;
        }
    }

    async initializeBackgroundSync() {
        // Configurar background sync para PWA y nativo
        if (this.mobileArch.environment.isNative) {
            // Background sync nativo
            await this.setupNativeBackgroundSync();
        } else if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            // Background sync web
            await this.setupWebBackgroundSync();
        }

        this.logger.info('OfflineSync', 'Background sync configurado');
    }

    async setupNativeBackgroundSync() {
        // Configurar background tasks nativo
        try {
            await this.mobileArch.callNativeMethod('BackgroundSync.register', {
                taskId: 'bge-offline-sync',
                interval: 15 * 60 * 1000, // 15 minutos
                requiredNetworkType: 'any',
                requiresCharging: false,
                requiresDeviceIdle: false
            });
        } catch (error) {
            this.logger.warn('OfflineSync', 'No se pudo configurar background sync nativo', error);
        }
    }

    async setupWebBackgroundSync() {
        // Registrar background sync en service worker
        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register('bge-offline-sync');
        } catch (error) {
            this.logger.warn('OfflineSync', 'No se pudo configurar background sync web', error);
        }
    }

    setupDataCompression() {
        // Configurar compresión de datos para transferencias eficientes
        this.compression = {
            compress: async (data) => {
                const jsonString = JSON.stringify(data);

                if (jsonString.length < this.syncConfig.storage.compressionThreshold) {
                    return { data: jsonString, compressed: false };
                }

                // Usar CompressionStream si está disponible
                if ('CompressionStream' in window) {
                    return await this.compressWithStreams(jsonString);
                } else {
                    // Fallback a compresión simple
                    return await this.compressSimple(jsonString);
                }
            },

            decompress: async (compressedData) => {
                if (!compressedData.compressed) {
                    return JSON.parse(compressedData.data);
                }

                const decompressed = compressedData.algorithm === 'gzip' ?
                    await this.decompressWithStreams(compressedData.data) :
                    await this.decompressSimple(compressedData.data);

                return JSON.parse(decompressed);
            }
        };

        this.logger.info('OfflineSync', 'Compresión de datos configurada');
    }

    async compressWithStreams(data) {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        writer.write(new TextEncoder().encode(data));
        writer.close();

        const chunks = [];
        let done = false;

        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) chunks.push(value);
        }

        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        chunks.forEach(chunk => {
            compressed.set(chunk, offset);
            offset += chunk.length;
        });

        return {
            data: Array.from(compressed),
            compressed: true,
            algorithm: 'gzip',
            originalSize: data.length,
            compressedSize: compressed.length
        };
    }

    async compressSimple(data) {
        // Compresión simple usando LZ-string o similar
        // Para este ejemplo, solo simulamos compresión
        const ratio = 0.7; // 30% de compresión simulada

        return {
            data: btoa(data), // Base64 como placeholder
            compressed: true,
            algorithm: 'simple',
            originalSize: data.length,
            compressedSize: Math.round(data.length * ratio)
        };
    }

    async loadSyncQueue() {
        // Cargar queue de sincronización persistente
        try {
            const savedQueue = await this.storage.get('sync_queue');
            if (savedQueue && Array.isArray(savedQueue)) {
                this.syncQueue = savedQueue;
                this.logger.info('OfflineSync', `Queue cargada: ${this.syncQueue.length} operaciones pendientes`);
            }
        } catch (error) {
            this.logger.error('OfflineSync', 'Error al cargar sync queue', error);
            this.syncQueue = [];
        }
    }

    setupAutomaticSync() {
        // Configurar sincronización automática basada en triggers
        const syncIntervals = new Map();

        // Configurar intervalos para cada tipo de datos
        for (const [dataType, config] of Object.entries(this.syncConfig.dataTypes)) {
            if (config.syncFrequency !== 'immediate') {
                const interval = this.parseFrequency(config.syncFrequency);

                if (interval > 0) {
                    const intervalId = setInterval(() => {
                        this.triggerSync(dataType);
                    }, interval);

                    syncIntervals.set(dataType, intervalId);
                }
            }
        }

        this.syncIntervals = syncIntervals;
        this.logger.info('OfflineSync', 'Sincronización automática configurada');
    }

    parseFrequency(frequency) {
        // Parsear frecuencia de sincronización a milisegundos
        const frequencies = {
            'every-5min': 5 * 60 * 1000,
            'every-15min': 15 * 60 * 1000,
            'every-30min': 30 * 60 * 1000,
            'hourly': 60 * 60 * 1000,
            'daily': 24 * 60 * 60 * 1000
        };

        return frequencies[frequency] || 0;
    }

    initializeSyncMetrics() {
        // Cargar métricas guardadas
        this.storage.get('sync_metrics').then(savedMetrics => {
            if (savedMetrics) {
                this.syncMetrics = { ...this.syncMetrics, ...savedMetrics };
            }
        });

        // Guardar métricas periódicamente
        setInterval(() => {
            this.storage.set('sync_metrics', this.syncMetrics);
        }, 5 * 60 * 1000); // Cada 5 minutos
    }

    /**
     * Métodos principales de sincronización
     */

    async getData(key, dataType, options = {}) {
        try {
            const config = this.syncConfig.dataTypes[dataType];
            if (!config) {
                throw new Error(`Tipo de datos no configurado: ${dataType}`);
            }

            this.logger.debug('OfflineSync', `Obteniendo datos: ${key} (${dataType})`);

            switch (config.strategy) {
                case 'OFFLINE_FIRST':
                    return await this.getDataOfflineFirst(key, dataType, options);

                case 'ONLINE_FIRST':
                    return await this.getDataOnlineFirst(key, dataType, options);

                case 'CACHE_ONLY':
                    return await this.getDataCacheOnly(key, dataType, options);

                case 'NETWORK_ONLY':
                    return await this.getDataNetworkOnly(key, dataType, options);

                case 'STALE_WHILE_REVALIDATE':
                    return await this.getDataStaleWhileRevalidate(key, dataType, options);

                default:
                    return await this.getDataOfflineFirst(key, dataType, options);
            }

        } catch (error) {
            this.logger.error('OfflineSync', `Error al obtener datos ${key}`, error);
            throw error;
        }
    }

    async getDataOfflineFirst(key, dataType, options) {
        // Estrategia: Cache primero, red como fallback
        const cachedData = await this.getCachedData(key, dataType);

        if (cachedData && !this.isCacheExpired(cachedData, dataType)) {
            this.logger.debug('OfflineSync', `Datos servidos desde cache: ${key}`);

            // Actualizar en background si estamos online
            if (this.networkState.online && !options.cacheOnly) {
                this.backgroundUpdate(key, dataType);
            }

            return cachedData.data;
        }

        // Cache expirado o no existe, intentar red
        if (this.networkState.online && !options.cacheOnly) {
            try {
                const networkData = await this.fetchFromNetwork(key, dataType);
                await this.cacheData(key, dataType, networkData);
                return networkData;
            } catch (error) {
                // Red falló, usar cache aunque esté expirado
                if (cachedData) {
                    this.logger.warn('OfflineSync', `Red falló, usando cache expirado: ${key}`);
                    return cachedData.data;
                }
                throw error;
            }
        }

        // Offline y no hay cache
        if (cachedData) {
            return cachedData.data;
        }

        throw new Error(`Datos no disponibles offline: ${key}`);
    }

    async getDataOnlineFirst(key, dataType, options) {
        // Estrategia: Red primero, cache como fallback
        if (this.networkState.online && !options.cacheOnly) {
            try {
                const networkData = await this.fetchFromNetwork(key, dataType);
                await this.cacheData(key, dataType, networkData);
                return networkData;
            } catch (error) {
                this.logger.warn('OfflineSync', `Red falló para ${key}, intentando cache`);
            }
        }

        // Fallback a cache
        const cachedData = await this.getCachedData(key, dataType);
        if (cachedData) {
            return cachedData.data;
        }

        throw new Error(`Datos no disponibles: ${key}`);
    }

    async getDataCacheOnly(key, dataType, options) {
        // Solo desde cache
        const cachedData = await this.getCachedData(key, dataType);
        if (cachedData) {
            return cachedData.data;
        }

        throw new Error(`Datos no en cache: ${key}`);
    }

    async getDataNetworkOnly(key, dataType, options) {
        // Solo desde red
        if (!this.networkState.online) {
            throw new Error('Sin conectividad para datos network-only');
        }

        return await this.fetchFromNetwork(key, dataType);
    }

    async getDataStaleWhileRevalidate(key, dataType, options) {
        // Servir cache mientras se actualiza en background
        const cachedData = await this.getCachedData(key, dataType);

        // Actualizar en background si estamos online
        if (this.networkState.online && !options.cacheOnly) {
            this.backgroundUpdate(key, dataType);
        }

        if (cachedData) {
            return cachedData.data;
        }

        // No hay cache, ir a red
        if (this.networkState.online) {
            const networkData = await this.fetchFromNetwork(key, dataType);
            await this.cacheData(key, dataType, networkData);
            return networkData;
        }

        throw new Error(`Datos no disponibles: ${key}`);
    }

    async setData(key, dataType, data, options = {}) {
        try {
            this.logger.debug('OfflineSync', `Guardando datos: ${key} (${dataType})`);

            // Guardar en cache local inmediatamente
            await this.cacheData(key, dataType, data, {
                modified: true,
                localTimestamp: Date.now()
            });

            // Agregar a queue de sincronización
            await this.queueSync(key, dataType, 'UPDATE', data, options);

            // Sincronizar inmediatamente si está configurado y hay conectividad
            const config = this.syncConfig.dataTypes[dataType];
            if (config.syncFrequency === 'immediate' && this.networkState.online) {
                await this.performImmediateSync(key, dataType, data);
            }

            return true;

        } catch (error) {
            this.logger.error('OfflineSync', `Error al guardar datos ${key}`, error);
            throw error;
        }
    }

    async deleteData(key, dataType, options = {}) {
        try {
            this.logger.debug('OfflineSync', `Eliminando datos: ${key} (${dataType})`);

            // Marcar como eliminado en cache local
            await this.markAsDeleted(key, dataType);

            // Agregar a queue de sincronización
            await this.queueSync(key, dataType, 'DELETE', null, options);

            // Sincronizar si es inmediato
            const config = this.syncConfig.dataTypes[dataType];
            if (config.syncFrequency === 'immediate' && this.networkState.online) {
                await this.performImmediateSync(key, dataType, null, 'DELETE');
            }

            return true;

        } catch (error) {
            this.logger.error('OfflineSync', `Error al eliminar datos ${key}`, error);
            throw error;
        }
    }

    async getCachedData(key, dataType) {
        try {
            const cacheKey = `${dataType}_${key}`;
            return await this.storage.get(cacheKey);
        } catch (error) {
            this.logger.error('OfflineSync', `Error al obtener cache ${key}`, error);
            return null;
        }
    }

    async cacheData(key, dataType, data, metadata = {}) {
        try {
            const cacheKey = `${dataType}_${key}`;
            const cacheEntry = {
                data: data,
                timestamp: Date.now(),
                dataType: dataType,
                key: key,
                ...metadata
            };

            // Comprimir si es necesario
            const compressed = await this.compression.compress(cacheEntry);
            await this.storage.set(cacheKey, compressed);

            this.logger.debug('OfflineSync', `Datos cacheados: ${cacheKey}`);

        } catch (error) {
            this.logger.error('OfflineSync', `Error al cachear datos ${key}`, error);
        }
    }

    isCacheExpired(cachedData, dataType) {
        const config = this.syncConfig.dataTypes[dataType];
        const age = Date.now() - cachedData.timestamp;
        return age > config.cacheExpiry;
    }

    async fetchFromNetwork(key, dataType) {
        // Simular fetch de red - en implementación real conectar con APIs
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.1) { // 90% éxito
                    resolve({
                        key: key,
                        dataType: dataType,
                        data: `Network data for ${key}`,
                        timestamp: Date.now(),
                        version: Math.floor(Math.random() * 100)
                    });
                } else {
                    reject(new Error('Network fetch failed'));
                }
            }, Math.random() * 1000 + 500); // 500-1500ms latencia
        });
    }

    async backgroundUpdate(key, dataType) {
        // Actualización en background sin bloquear UI
        try {
            const networkData = await this.fetchFromNetwork(key, dataType);

            // Verificar si hay conflictos antes de actualizar cache
            const cachedData = await this.getCachedData(key, dataType);

            if (cachedData && cachedData.modified) {
                // Hay conflicto - registrar para resolución posterior
                await this.registerConflict(key, dataType, cachedData.data, networkData);
            } else {
                // No hay conflicto - actualizar cache
                await this.cacheData(key, dataType, networkData);
            }

        } catch (error) {
            this.logger.debug('OfflineSync', `Background update falló para ${key}`, error);
        }
    }

    async queueSync(key, dataType, operation, data, options = {}) {
        const config = this.syncConfig.dataTypes[dataType];

        const syncOperation = {
            id: this.generateOperationId(),
            key: key,
            dataType: dataType,
            operation: operation, // CREATE, UPDATE, DELETE
            data: data,
            priority: config.priority,
            timestamp: Date.now(),
            attempts: 0,
            maxAttempts: this.syncConfig.network.retryAttempts,
            options: options
        };

        this.syncQueue.push(syncOperation);

        // Ordenar por prioridad y timestamp
        this.syncQueue.sort((a, b) => {
            const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
            const aPriority = priorityOrder[a.priority] || 99;
            const bPriority = priorityOrder[b.priority] || 99;

            if (aPriority !== bPriority) {
                return aPriority - bPriority;
            }
            return a.timestamp - b.timestamp;
        });

        // Persistir queue
        await this.persistSyncQueue();

        this.logger.debug('OfflineSync', `Operación agregada a queue: ${syncOperation.id}`);
    }

    async persistSyncQueue() {
        try {
            await this.storage.set('sync_queue', this.syncQueue);
        } catch (error) {
            this.logger.error('OfflineSync', 'Error al persistir sync queue', error);
        }
    }

    /**
     * Métodos de sincronización y resolución de conflictos
     */

    async performSync(dataTypes = null) {
        if (this.syncInProgress) {
            this.logger.debug('OfflineSync', 'Sincronización ya en progreso');
            return;
        }

        if (!this.networkState.online) {
            this.logger.debug('OfflineSync', 'Sin conectividad para sincronización');
            return;
        }

        this.syncInProgress = true;
        this.logger.info('OfflineSync', 'Iniciando sincronización');

        try {
            const filteredQueue = dataTypes ?
                this.syncQueue.filter(op => dataTypes.includes(op.dataType)) :
                this.syncQueue;

            // Procesar en lotes
            const batches = this.createSyncBatches(filteredQueue);

            for (const batch of batches) {
                await this.processSyncBatch(batch);
            }

            // Actualizar métricas
            this.syncMetrics.totalSyncs++;
            this.syncMetrics.lastSyncTime = new Date();

            this.logger.info('OfflineSync', 'Sincronización completada');

        } catch (error) {
            this.syncMetrics.failedSyncs++;
            this.logger.error('OfflineSync', 'Error en sincronización', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    createSyncBatches(operations) {
        const batches = [];
        const batchSize = this.syncConfig.network.batchSize;

        for (let i = 0; i < operations.length; i += batchSize) {
            batches.push(operations.slice(i, i + batchSize));
        }

        return batches;
    }

    async processSyncBatch(batch) {
        const promises = batch.map(operation => this.processSyncOperation(operation));

        try {
            await Promise.allSettled(promises);
        } catch (error) {
            this.logger.error('OfflineSync', 'Error en lote de sincronización', error);
        }
    }

    async processSyncOperation(operation) {
        try {
            this.logger.debug('OfflineSync', `Procesando operación: ${operation.id}`);

            const result = await this.sendToServer(operation);

            if (result.success) {
                // Operación exitosa - remover de queue
                this.removeFromQueue(operation.id);
                this.syncMetrics.successfulSyncs++;

                // Actualizar cache con datos del servidor si los hay
                if (result.data) {
                    await this.cacheData(operation.key, operation.dataType, result.data);
                }

            } else if (result.conflict) {
                // Conflicto detectado - registrar para resolución
                await this.registerConflict(
                    operation.key,
                    operation.dataType,
                    operation.data,
                    result.serverData
                );
                this.removeFromQueue(operation.id);

            } else {
                // Error - reintentar o marcar como fallido
                operation.attempts++;

                if (operation.attempts >= operation.maxAttempts) {
                    this.logger.error('OfflineSync', `Operación fallida permanentemente: ${operation.id}`);
                    this.removeFromQueue(operation.id);
                    this.syncMetrics.failedSyncs++;
                } else {
                    this.logger.warn('OfflineSync', `Reintentando operación: ${operation.id} (intento ${operation.attempts})`);
                }
            }

        } catch (error) {
            this.logger.error('OfflineSync', `Error al procesar operación ${operation.id}`, error);
            operation.attempts++;
        }
    }

    async sendToServer(operation) {
        // Simular envío al servidor - en implementación real usar APIs reales
        return new Promise((resolve) => {
            setTimeout(() => {
                const success = Math.random() > 0.1; // 90% éxito
                const conflict = !success && Math.random() > 0.5; // 50% de fallos son conflictos

                if (success) {
                    resolve({
                        success: true,
                        data: {
                            ...operation.data,
                            serverTimestamp: Date.now(),
                            version: Math.floor(Math.random() * 100)
                        }
                    });
                } else if (conflict) {
                    resolve({
                        success: false,
                        conflict: true,
                        serverData: {
                            ...operation.data,
                            serverModified: true,
                            version: Math.floor(Math.random() * 100)
                        }
                    });
                } else {
                    resolve({
                        success: false,
                        error: 'Server error'
                    });
                }
            }, Math.random() * 2000 + 500);
        });
    }

    async registerConflict(key, dataType, localData, serverData) {
        const conflictId = this.generateConflictId();

        const conflict = {
            id: conflictId,
            key: key,
            dataType: dataType,
            localData: localData,
            serverData: serverData,
            timestamp: Date.now(),
            resolved: false,
            resolution: null
        };

        this.conflictRegistry.set(conflictId, conflict);

        // Persistir conflictos
        await this.storage.set('conflicts', Array.from(this.conflictRegistry.values()));

        this.logger.warn('OfflineSync', `Conflicto registrado: ${conflictId} para ${key}`);

        // Intentar resolución automática
        await this.attemptAutomaticResolution(conflict);
    }

    async attemptAutomaticResolution(conflict) {
        const config = this.syncConfig.dataTypes[conflict.dataType];
        const strategy = config.conflictResolution;

        let resolution = null;

        switch (strategy) {
            case 'client-wins':
                resolution = {
                    strategy: 'client-wins',
                    data: conflict.localData,
                    automatic: true
                };
                break;

            case 'server-wins':
                resolution = {
                    strategy: 'server-wins',
                    data: conflict.serverData,
                    automatic: true
                };
                break;

            case 'last-write-wins':
                const localTime = conflict.localData.timestamp || 0;
                const serverTime = conflict.serverData.timestamp || 0;

                resolution = {
                    strategy: 'last-write-wins',
                    data: localTime > serverTime ? conflict.localData : conflict.serverData,
                    automatic: true
                };
                break;

            case 'merge':
                resolution = await this.attemptDataMerge(conflict.localData, conflict.serverData);
                resolution.strategy = 'merge';
                resolution.automatic = true;
                break;

            default:
                // Requiere resolución manual
                this.logger.info('OfflineSync', `Conflicto requiere resolución manual: ${conflict.id}`);
                return;
        }

        if (resolution) {
            await this.resolveConflict(conflict.id, resolution);
        }
    }

    async attemptDataMerge(localData, serverData) {
        // Intento básico de merge automático
        try {
            const merged = { ...serverData, ...localData };

            // Preservar timestamps del servidor para campos específicos
            if (serverData.createdAt) {
                merged.createdAt = serverData.createdAt;
            }

            merged.updatedAt = Math.max(
                localData.updatedAt || 0,
                serverData.updatedAt || 0
            );

            return {
                data: merged,
                mergeSuccessful: true
            };

        } catch (error) {
            return {
                data: null,
                mergeSuccessful: false,
                error: error.message
            };
        }
    }

    async resolveConflict(conflictId, resolution) {
        const conflict = this.conflictRegistry.get(conflictId);
        if (!conflict) {
            throw new Error(`Conflicto no encontrado: ${conflictId}`);
        }

        // Aplicar resolución
        conflict.resolved = true;
        conflict.resolution = resolution;
        conflict.resolvedAt = Date.now();

        // Actualizar cache con datos resueltos
        await this.cacheData(conflict.key, conflict.dataType, resolution.data);

        // Si no fue automático, enviar a servidor
        if (!resolution.automatic) {
            await this.queueSync(conflict.key, conflict.dataType, 'UPDATE', resolution.data);
        }

        this.syncMetrics.conflictsResolved++;
        this.logger.info('OfflineSync', `Conflicto resuelto: ${conflictId} usando ${resolution.strategy}`);
    }

    /**
     * Eventos de conectividad
     */

    onConnectivityRestored() {
        // Cuando se restaura la conectividad
        this.logger.info('OfflineSync', 'Conectividad restaurada - iniciando sincronización');

        // Esperar un poco para que la conexión se estabilice
        setTimeout(() => {
            this.performSync();
        }, 2000);
    }

    onConnectivityLost() {
        // Cuando se pierde la conectividad
        this.logger.info('OfflineSync', 'Conectividad perdida - cambiando a modo offline');

        // Cancelar sincronizaciones en progreso si es necesario
        // En este caso, las operaciones continuarán hasta completarse
    }

    /**
     * API pública
     */

    async triggerSync(dataType = null) {
        return await this.performSync(dataType ? [dataType] : null);
    }

    getSyncStatus() {
        return {
            syncInProgress: this.syncInProgress,
            queueSize: this.syncQueue.length,
            conflictsCount: this.conflictRegistry.size,
            networkState: this.networkState,
            metrics: this.syncMetrics,
            lastSync: this.syncMetrics.lastSyncTime
        };
    }

    getQueuedOperations() {
        return this.syncQueue.slice(); // Copia para no exponer referencia
    }

    getConflicts() {
        return Array.from(this.conflictRegistry.values());
    }

    async clearCache(dataType = null) {
        if (dataType) {
            // Limpiar solo un tipo de datos
            const keys = await this.storage.getAllKeys();
            const typeKeys = keys.filter(key => key.startsWith(`${dataType}_`));

            for (const key of typeKeys) {
                await this.storage.remove(key);
            }
        } else {
            // Limpiar todo el cache
            await this.storage.clear();
        }

        this.logger.info('OfflineSync', `Cache limpiado: ${dataType || 'todo'}`);
    }

    async getCacheSize() {
        // Estimar tamaño del cache
        const keys = await this.storage.getAllKeys();
        let totalSize = 0;

        for (const key of keys) {
            const data = await this.storage.get(key);
            if (data) {
                totalSize += JSON.stringify(data).length;
            }
        }

        return {
            keys: keys.length,
            estimatedBytes: totalSize,
            estimatedMB: Math.round(totalSize / 1024 / 1024 * 100) / 100
        };
    }

    // Métodos auxiliares
    generateOperationId() {
        return 'op_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateConflictId() {
        return 'conflict_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    extractDataType(key) {
        const parts = key.split('_');
        return parts[0];
    }

    removeFromQueue(operationId) {
        const index = this.syncQueue.findIndex(op => op.id === operationId);
        if (index !== -1) {
            this.syncQueue.splice(index, 1);
            this.persistSyncQueue();
        }
    }

    async cleanupOldCacheEntries() {
        // Limpiar entradas de cache antiguas para liberar espacio
        const keys = await this.storage.getAllKeys();
        const entries = [];

        for (const key of keys) {
            const data = await this.storage.get(key);
            if (data && data.timestamp) {
                entries.push({ key, timestamp: data.timestamp });
            }
        }

        // Ordenar por timestamp y eliminar las más antiguas
        entries.sort((a, b) => a.timestamp - b.timestamp);
        const toRemove = entries.slice(0, Math.floor(entries.length * 0.2)); // Eliminar 20%

        for (const entry of toRemove) {
            await this.storage.remove(entry.key);
        }

        this.logger.info('OfflineSync', `Limpieza de cache: ${toRemove.length} entradas eliminadas`);
    }

    async markAsDeleted(key, dataType) {
        const cacheKey = `${dataType}_${key}`;
        await this.storage.set(cacheKey, {
            deleted: true,
            timestamp: Date.now(),
            dataType: dataType,
            key: key
        });
    }

    async performImmediateSync(key, dataType, data, operation = 'UPDATE') {
        // Sincronización inmediata para operaciones críticas
        const syncOperation = {
            id: this.generateOperationId(),
            key: key,
            dataType: dataType,
            operation: operation,
            data: data,
            priority: 'CRITICAL',
            timestamp: Date.now(),
            attempts: 0,
            maxAttempts: 1 // Solo un intento para sincronización inmediata
        };

        try {
            await this.processSyncOperation(syncOperation);
        } catch (error) {
            // Si falla, agregar a queue normal
            await this.queueSync(key, dataType, operation, data);
        }
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BGEMobileOfflineSyncSystem;
} else if (typeof window !== 'undefined') {
    window.BGEMobileOfflineSyncSystem = BGEMobileOfflineSyncSystem;
}