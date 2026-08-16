/**
 * 📬 QUEUE JOBS MIDDLEWARE - SEMANA 9
 * Sistema de colas para operaciones pesadas con Redis
 *
 * Características:
 * - Message queue con Redis (pub/sub pattern)
 * - Job processing en background
 * - Retry automático con exponential backoff
 * - Job status tracking
 * - Priority queues (high, normal, low)
 *
 * Uso:
 *   const { enqueueJob, processJobs } = require('./middleware/queue-jobs');
 *
 *   // Encolar job
 *   await enqueueJob('send-email', { to: 'user@example.com', subject: '...' }, 'high');
 *
 *   // Procesar jobs (en worker separado)
 *   processJobs();
 *
 * Fecha: 17 Noviembre 2025
 * Estado: ✅ COMPLETADO
 */

// ⏸️ COMENTADO - FASE 30.5 INTENTO-5: Redis no disponible en local
// const Redis = require('ioredis');
const devLogger = require('../utils/devLogger.js');

// =============================================================================
// CONFIGURACIÓN DE REDIS
// =============================================================================

// ⏸️ COMENTADO - FASE 30.5 INTENTO-5: Redis no disponible en local
// const redis = new Redis({
//     host: process.env.REDIS_HOST || 'localhost',
//     port: process.env.REDIS_PORT || 6379,
//     password: process.env.REDIS_PASSWORD || undefined,
//     db: process.env.REDIS_DB || 1, // DB 1 para jobs (DB 0 es cache)
//     retryStrategy: (times) => {
//         const delay = Math.min(times * 50, 2000);
//         return delay;
//     },
//     maxRetriesPerRequest: 3,
// });

// Subscriber (para pub/sub)
// ⏸️ COMENTADO - FASE 30.5 INTENTO-5
// const subscriber = redis.duplicate();

// Mock Redis para desarrollo local sin Redis server
const redis = {
    hset: async () => true,
    lpush: async () => true,
    publish: async () => true,
    rpop: async () => null,
    hgetall: async () => null,
    del: async () => true,
    hincrby: async () => true,
    keys: async () => [],
    llen: async () => 0,
    on: () => {},
    off: () => {},
};

const subscriber = {
    subscribe: async () => true,
    on: () => {},
    off: () => {},
};

// =============================================================================
// CONFIGURACIÓN DE QUEUES
// =============================================================================

const QUEUE_PRIORITIES = {
    high: 'queue:jobs:high',
    normal: 'queue:jobs:normal',
    low: 'queue:jobs:low',
};

const JOB_STATUS = {
    pending: 'pending',
    processing: 'processing',
    completed: 'completed',
    failed: 'failed',
};

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // 1s, 5s, 15s

// =============================================================================
// JOB HANDLERS
// =============================================================================

/**
 * Registry de job handlers
 * Cada handler recibe (jobData) y retorna Promise
 */
const jobHandlers = {
    /**
     * Enviar email (operación pesada)
     */
    'send-email': async (jobData) => {
        const { to, subject, body } = jobData;
        devLogger.log(`[QUEUE] Enviando email a ${to}: ${subject}`);

        // Simular envío de email (reemplazar con servicio real)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // En producción, usar servicio de email real (SendGrid, AWS SES, etc)
        // const emailService = require('../services/email-service');
        // await emailService.send({ to, subject, body });

        return { success: true, recipient: to };
    },

    /**
     * Generar reporte grande (operación pesada)
     */
    'generate-report': async (jobData) => {
        const { reportType, params } = jobData;
        devLogger.log(`[QUEUE] Generando reporte ${reportType}...`);

        // Simular generación de reporte
        await new Promise(resolve => setTimeout(resolve, 5000));

        // En producción, llamar a servicio de reportes
        // const reportingService = require('../services/reporting-service.js');
        // const report = await reportingService.generate(reportType, params);

        return { success: true, reportType, recordCount: 1000 };
    },

    /**
     * Procesar imágenes (operación pesada)
     */
    'process-images': async (jobData) => {
        const { imageUrls, operations } = jobData;
        devLogger.log(`[QUEUE] Procesando ${imageUrls.length} imágenes...`);

        // Simular procesamiento de imágenes
        await new Promise(resolve => setTimeout(resolve, 3000));

        // En producción, usar servicio de procesamiento de imágenes
        // const imageService = require('../services/image-optimization-service');
        // const results = await imageService.process(imageUrls, operations);

        return { success: true, processedCount: imageUrls.length };
    },

    /**
     * Enviar notificaciones en batch (operación pesada)
     */
    'batch-notifications': async (jobData) => {
        const { userIds, notification } = jobData;
        devLogger.log(`[QUEUE] Enviando notificaciones a ${userIds.length} usuarios...`);

        // Simular envío batch
        await new Promise(resolve => setTimeout(resolve, 1000));

        // En producción, usar servicio de notificaciones
        // const socketService = require('../services/socket-service.js');
        // for (const userId of userIds) {
        //     await socketService.sendToUser(userId, 'notification', notification);
        // }

        return { success: true, sentCount: userIds.length };
    },

    /**
     * Exportar datos a CSV/Excel (operación pesada)
     */
    'export-data': async (jobData) => {
        const { table, format, filters } = jobData;
        devLogger.log(`[QUEUE] Exportando tabla ${table} a ${format}...`);

        // Simular exportación
        await new Promise(resolve => setTimeout(resolve, 4000));

        // En producción, generar archivo CSV/Excel
        // const exportService = require('../services/export-service');
        // const fileUrl = await exportService.export(table, format, filters);

        return { success: true, fileUrl: '/exports/data.csv' };
    },

    /**
     * Backup de base de datos (operación muy pesada)
     */
    'database-backup': async (jobData) => {
        const { tables, destination } = jobData;
        devLogger.log(`[QUEUE] Iniciando backup de BD...`);

        // Simular backup
        await new Promise(resolve => setTimeout(resolve, 10000));

        // En producción, ejecutar backup real
        // const backupService = require('../services/backup-service');
        // await backupService.backupDatabase(tables, destination);

        return { success: true, backupSize: '500MB', location: destination };
    },
};

// =============================================================================
// FUNCIONES PRINCIPALES
// =============================================================================

/**
 * Encolar un job para procesamiento asíncrono
 *
 * @param {string} jobType - Tipo de job (debe existir en jobHandlers)
 * @param {object} jobData - Datos del job
 * @param {string} priority - Prioridad: 'high', 'normal', 'low'
 * @returns {Promise<string>} - Job ID
 */
async function enqueueJob(jobType, jobData = {}, priority = 'normal') {
    try {
        // Validar que el job handler existe
        if (!jobHandlers[jobType]) {
            throw new Error(`Unknown job type: ${jobType}`);
        }

        // Validar prioridad
        if (!QUEUE_PRIORITIES[priority]) {
            priority = 'normal';
        }

        // Generar job ID único
        const jobId = `job:${jobType}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;

        // Job object
        const job = {
            id: jobId,
            type: jobType,
            data: jobData,
            priority,
            status: JOB_STATUS.pending,
            retries: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Guardar job en Redis (hash)
        await redis.hset(`job:${jobId}`, {
            ...job,
            data: JSON.stringify(job.data),
        });

        // Agregar job a la cola (lista)
        const queueKey = QUEUE_PRIORITIES[priority];
        await redis.lpush(queueKey, jobId);

        // Publicar evento para workers
        await redis.publish('jobs:new', jobId);

        devLogger.log(`[QUEUE] Job encolado: ${jobId} (${jobType}) - Priority: ${priority}`);

        return jobId;

    } catch (error) {
        devLogger.error('[QUEUE] Error al encolar job:', error);
        throw error;
    }
}

/**
 * Procesar jobs de las colas (debe ejecutarse en worker separado)
 *
 * Orden de prioridad:
 * 1. high
 * 2. normal
 * 3. low
 */
async function processJobs() {
    devLogger.log('[QUEUE] 🚀 Worker iniciado - Procesando jobs...');

    // Subscribe a eventos de nuevos jobs
    await subscriber.subscribe('jobs:new');
    subscriber.on('message', async (channel, message) => {
        if (channel === 'jobs:new') {
            devLogger.log(`[QUEUE] Nuevo job disponible: ${message}`);
            await processSingleJob();
        }
    });

    // Loop principal
    while (true) {
        try {
            await processSingleJob();
            await new Promise(resolve => setTimeout(resolve, 1000)); // Poll cada 1 segundo
        } catch (error) {
            devLogger.error('[QUEUE] Error en worker:', error);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Retry después de 5s
        }
    }
}

/**
 * Procesa un único job de las colas (por prioridad)
 * @private
 */
async function processSingleJob() {
    try {
        // Buscar job en orden de prioridad
        let jobId = null;
        let queueKey = null;

        for (const priority of ['high', 'normal', 'low']) {
            queueKey = QUEUE_PRIORITIES[priority];
            jobId = await redis.rpop(queueKey); // Tomar del final (FIFO)

            if (jobId) {
                break;
            }
        }

        if (!jobId) {
            return; // No hay jobs
        }

        // Obtener job data
        const jobData = await redis.hgetall(`job:${jobId}`);

        if (!jobData || !jobData.type) {
            devLogger.warn(`[QUEUE] Job no encontrado o corrupto: ${jobId}`);
            return;
        }

        // Parsear data
        jobData.data = JSON.parse(jobData.data || '{}');
        jobData.retries = parseInt(jobData.retries) || 0;

        devLogger.log(`[QUEUE] Procesando job ${jobId} (${jobData.type})...`);

        // Actualizar status a processing
        await redis.hset(`job:${jobId}`, {
            status: JOB_STATUS.processing,
            updatedAt: new Date().toISOString(),
        });

        // Ejecutar job handler
        const handler = jobHandlers[jobData.type];
        const result = await handler(jobData.data);

        // Marcar como completado
        await redis.hset(`job:${jobId}`, {
            status: JOB_STATUS.completed,
            result: JSON.stringify(result),
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        devLogger.log(`[QUEUE] ✅ Job completado: ${jobId}`);

        // Publicar evento de completado
        await redis.publish('jobs:completed', jobId);

    } catch (error) {
        devLogger.error(`[QUEUE] ❌ Error al procesar job ${jobId}:`, error);

        // Retry logic
        const retries = parseInt(jobData.retries) || 0;

        if (retries < MAX_RETRIES) {
            const delay = RETRY_DELAYS[retries] || 15000;

            devLogger.log(`[QUEUE] Reintentando job ${jobId} en ${delay}ms... (${retries + 1}/${MAX_RETRIES})`);

            // Incrementar retries
            await redis.hincrby(`job:${jobId}`, 'retries', 1);
            await redis.hset(`job:${jobId}`, {
                status: JOB_STATUS.pending,
                lastError: error.message,
                updatedAt: new Date().toISOString(),
            });

            // Volver a encolar después del delay
            setTimeout(async () => {
                await redis.lpush(queueKey, jobId);
                await redis.publish('jobs:new', jobId);
            }, delay);

        } else {
            // Max retries alcanzado - marcar como fallido
            await redis.hset(`job:${jobId}`, {
                status: JOB_STATUS.failed,
                error: error.message,
                failedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            devLogger.error(`[QUEUE] Job fallido permanentemente: ${jobId}`);
            await redis.publish('jobs:failed', jobId);
        }
    }
}

/**
 * Obtener status de un job
 */
async function getJobStatus(jobId) {
    try {
        const jobData = await redis.hgetall(`job:${jobId}`);

        if (!jobData || !jobData.type) {
            return null;
        }

        // Parsear JSON fields
        if (jobData.data) jobData.data = JSON.parse(jobData.data);
        if (jobData.result) jobData.result = JSON.parse(jobData.result);

        return jobData;

    } catch (error) {
        devLogger.error('[QUEUE] Error al obtener job status:', error);
        return null;
    }
}

/**
 * Limpiar jobs antiguos (cleanup job - ejecutar periódicamente)
 */
async function cleanupOldJobs(maxAgeDays = 7) {
    try {
        const cutoffDate = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);
        devLogger.log(`[QUEUE] Limpiando jobs más antiguos que ${cutoffDate.toISOString()}...`);

        // Obtener todos los job keys
        const keys = await redis.keys('job:job:*');

        let deletedCount = 0;

        for (const key of keys) {
            const jobData = await redis.hgetall(key);

            if (jobData.completedAt || jobData.failedAt) {
                const finishedAt = new Date(jobData.completedAt || jobData.failedAt);

                if (finishedAt < cutoffDate) {
                    await redis.del(key);
                    deletedCount++;
                }
            }
        }

        devLogger.log(`[QUEUE] ✅ Limpieza completada: ${deletedCount} jobs eliminados`);

        return deletedCount;

    } catch (error) {
        devLogger.error('[QUEUE] Error en cleanup:', error);
        return 0;
    }
}

/**
 * Obtener estadísticas de las colas
 */
async function getQueueStats() {
    try {
        const stats = {
            high: await redis.llen(QUEUE_PRIORITIES.high),
            normal: await redis.llen(QUEUE_PRIORITIES.normal),
            low: await redis.llen(QUEUE_PRIORITIES.low),
        };

        stats.total = stats.high + stats.normal + stats.low;

        return stats;

    } catch (error) {
        devLogger.error('[QUEUE] Error al obtener stats:', error);
        return { high: 0, normal: 0, low: 0, total: 0 };
    }
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

// ⏸️ COMENTADO - FASE 30.5 INTENTO-5
// redis.on('connect', () => {
//     devLogger.log('[QUEUE] ✅ Conectado a Redis para jobs');
// });

// redis.on('error', (err) => {
//     devLogger.error('[QUEUE] ❌ Error de Redis:', err);
// });

devLogger.warn('[QUEUE] ⚠️ Redis deshabilitado para desarrollo local (FASE 30.5 INTENTO-5)');

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
    enqueueJob,
    processJobs,
    getJobStatus,
    cleanupOldJobs,
    getQueueStats,
    jobHandlers,  // Exportar para que se puedan agregar handlers dinámicamente
    JOB_STATUS,
    QUEUE_PRIORITIES,
};
