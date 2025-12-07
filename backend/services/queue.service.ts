/**
 * 📋 QUEUE SERVICE - TypeScript
 * Sistema de colas para tareas asíncronas
 *
 * Features:
 * - Cola en memoria (Bull/Redis en producción)
 * - Prioridades
 * - Reintentos automáticos
 * - Delayed jobs
 * - Event listeners
 *
 * Migración TypeScript: 07 Diciembre 2025
 */

import { EventEmitter } from 'events';
import devLogger from '../utils/devLogger';

// =====================================================
// INTERFACES
// =====================================================

export interface QueueOptions {
    concurrency?: number;
    retries?: number;
    delay?: number;
    [key: string]: any;
}

export interface JobOptions {
    retries?: number;
    priority?: number;
    delay?: number;
}

export interface Job {
    id: string;
    data: any;
    attempts: number;
    maxAttempts: number;
    priority: number;
    delay: number;
    createdAt: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string;
}

export interface Queue {
    name: string;
    jobs: Job[];
    processing: boolean;
    options: Required<QueueOptions>;
    processor: ((job: Job) => Promise<void>) | null;
    stats: QueueStats;
}

export interface QueueStats {
    completed: number;
    failed: number;
    pending: number;
}

export type JobProcessor = (job: Job) => Promise<void>;

// =====================================================
// QUEUE SERVICE CLASS
// =====================================================

class QueueService extends EventEmitter {
    private queues: Map<string, Queue>;
    private processingMap: Map<string, boolean>;

    constructor() {
        super();
        this.queues = new Map();
        this.processingMap = new Map();
    }

    /**
     * Crear una nueva cola
     */
    createQueue(name: string, options: QueueOptions = {}): Queue {
        if (this.queues.has(name)) {
            return this.queues.get(name)!;
        }

        const queue: Queue = {
            name,
            jobs: [],
            processing: false,
            options: {
                concurrency: options.concurrency || 1,
                retries: options.retries || 3,
                delay: options.delay || 0,
                ...options
            },
            processor: null,
            stats: { completed: 0, failed: 0, pending: 0 }
        };

        this.queues.set(name, queue);
        devLogger.log(`[QueueService] Cola "${name}" creada`);
        return queue;
    }

    /**
     * Agregar un job a la cola
     */
    async add(queueName: string, data: any, options: JobOptions = {}): Promise<Job> {
        const queue = this.queues.get(queueName);
        if (!queue) throw new Error(`Cola "${queueName}" no existe`);

        const job: Job = {
            id: Date.now() + Math.random().toString(36),
            data,
            attempts: 0,
            maxAttempts: options.retries || queue.options.retries,
            priority: options.priority || 0,
            delay: options.delay || 0,
            createdAt: Date.now(),
            status: 'pending'
        };

        // Insertar por prioridad
        const insertIndex = queue.jobs.findIndex(j => j.priority < job.priority);
        if (insertIndex === -1) {
            queue.jobs.push(job);
        } else {
            queue.jobs.splice(insertIndex, 0, job);
        }

        queue.stats.pending++;
        this.emit('job:added', { queue: queueName, job });

        // Procesar si hay processor
        if (queue.processor && !queue.processing) {
            this.processQueue(queueName);
        }

        return job;
    }

    /**
     * Registrar procesador para cola
     */
    process(queueName: string, processor: JobProcessor): void {
        const queue = this.queues.get(queueName);
        if (!queue) throw new Error(`Cola "${queueName}" no existe`);

        queue.processor = processor;
        this.processQueue(queueName);
    }

    /**
     * Procesar cola
     */
    private async processQueue(queueName: string): Promise<void> {
        const queue = this.queues.get(queueName);
        if (!queue || !queue.processor || queue.processing) return;

        queue.processing = true;

        while (queue.jobs.length > 0) {
            const job = queue.jobs.shift()!;
            queue.stats.pending--;

            // Verificar delay
            if (job.delay > 0 && Date.now() - job.createdAt < job.delay) {
                queue.jobs.unshift(job);
                queue.stats.pending++;
                await new Promise(r => setTimeout(r, 100));
                continue;
            }

            job.status = 'processing';
            job.attempts++;

            try {
                await queue.processor(job);
                job.status = 'completed';
                queue.stats.completed++;
                this.emit('job:completed', { queue: queueName, job });

            } catch (error: any) {
                if (job.attempts < job.maxAttempts) {
                    job.status = 'pending';
                    queue.jobs.push(job);
                    queue.stats.pending++;
                    devLogger.warn(`[QueueService] Job ${job.id} reintentando (${job.attempts}/${job.maxAttempts})`);
                } else {
                    job.status = 'failed';
                    job.error = error.message;
                    queue.stats.failed++;
                    this.emit('job:failed', { queue: queueName, job, error });
                    devLogger.error(`[QueueService] Job ${job.id} falló: ${error.message}`);
                }
            }
        }

        queue.processing = false;
    }

    /**
     * Obtener estadísticas
     */
    getStats(queueName?: string): QueueStats | Record<string, QueueStats> | null {
        if (queueName) {
            const queue = this.queues.get(queueName);
            return queue ? queue.stats : null;
        }

        const stats: Record<string, QueueStats> = {};
        for (const [name, queue] of this.queues) {
            stats[name] = queue.stats;
        }
        return stats;
    }

    /**
     * Limpiar cola
     */
    clear(queueName: string): void {
        const queue = this.queues.get(queueName);
        if (queue) {
            queue.jobs = [];
            queue.stats.pending = 0;
        }
    }
}

export default new QueueService();
module.exports = new QueueService();
