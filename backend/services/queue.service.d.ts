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
declare class QueueService extends EventEmitter {
    private queues;
    private processingMap;
    constructor();
    /**
     * Crear una nueva cola
     */
    createQueue(name: string, options?: QueueOptions): Queue;
    /**
     * Agregar un job a la cola
     */
    add(queueName: string, data: any, options?: JobOptions): Promise<Job>;
    /**
     * Registrar procesador para cola
     */
    process(queueName: string, processor: JobProcessor): void;
    /**
     * Procesar cola
     */
    private processQueue;
    /**
     * Obtener estadísticas
     */
    getStats(queueName?: string): QueueStats | Record<string, QueueStats> | null;
    /**
     * Limpiar cola
     */
    clear(queueName: string): void;
}
declare const _default: QueueService;
export default _default;
//# sourceMappingURL=queue.service.d.ts.map