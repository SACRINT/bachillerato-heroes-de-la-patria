/**
 * 📋 QUEUE SERVICE - SEMANA 6
 * Sistema de colas para tareas asíncronas
 *
 * Features:
 * - Cola en memoria (Bull/Redis en producción)
 * - Prioridades
 * - Reintentos automáticos
 * - Delayed jobs
 * - Event listeners
 *
 * Fecha: 20 Noviembre 2025
 */

const EventEmitter = require('events');
const devLogger = require('../utils/devLogger');

class QueueService extends EventEmitter {
  constructor() {
    super();
    this.queues = new Map();
    this.processing = new Map();
  }

  createQueue(name, options = {}) {
    if (this.queues.has(name)) {
      return this.queues.get(name);
    }

    const queue = {
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
    devLogger.log(`[Queue] Cola "${name}" creada`);
    return queue;
  }

  async add(queueName, data, options = {}) {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Cola "${queueName}" no existe`);

    const job = {
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

  process(queueName, processor) {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Cola "${queueName}" no existe`);

    queue.processor = processor;
    this.processQueue(queueName);
  }

  async processQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue || !queue.processor || queue.processing) return;

    queue.processing = true;

    while (queue.jobs.length > 0) {
      const job = queue.jobs.shift();
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

      } catch (error) {
        if (job.attempts < job.maxAttempts) {
          job.status = 'pending';
          queue.jobs.push(job);
          queue.stats.pending++;
          devLogger.warn(`[Queue] Job ${job.id} reintentando (${job.attempts}/${job.maxAttempts})`);
        } else {
          job.status = 'failed';
          job.error = error.message;
          queue.stats.failed++;
          this.emit('job:failed', { queue: queueName, job, error });
          devLogger.error(`[Queue] Job ${job.id} falló:`, error.message);
        }
      }
    }

    queue.processing = false;
  }

  getStats(queueName) {
    if (queueName) {
      const queue = this.queues.get(queueName);
      return queue ? queue.stats : null;
    }

    const stats = {};
    for (const [name, queue] of this.queues) {
      stats[name] = queue.stats;
    }
    return stats;
  }

  clear(queueName) {
    const queue = this.queues.get(queueName);
    if (queue) {
      queue.jobs = [];
      queue.stats.pending = 0;
    }
  }
}

module.exports = new QueueService();
