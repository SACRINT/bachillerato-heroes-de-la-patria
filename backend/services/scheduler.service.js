"use strict";
/**
 * ⏰ SCHEDULER SERVICE - TypeScript Version
 * Sistema de tareas programadas
 *
 * Features:
 * - Cron jobs
 * - One-time tasks
 * - Recurring tasks
 * - Task history
 * - Error handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const devLogger = require('../utils/devLogger');
// ============================================
// SCHEDULER SERVICE CLASS
// ============================================
class SchedulerService {
    constructor() {
        this.jobs = new Map();
        this.running = false;
        this.checkInterval = null;
    }
    start() {
        if (this.running)
            return;
        this.running = true;
        this.checkInterval = setInterval(() => this.checkJobs(), 60000); // Cada minuto
        devLogger.log('[Scheduler] Servicio iniciado');
    }
    stop() {
        this.running = false;
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        devLogger.log('[Scheduler] Servicio detenido');
    }
    schedule(name, cronExpression, handler, options = {}) {
        const job = {
            name,
            cron: cronExpression,
            type: 'cron',
            handler,
            enabled: options.enabled !== false,
            lastRun: null,
            nextRun: this.getNextRun(cronExpression),
            runCount: 0,
            errors: 0,
            options
        };
        this.jobs.set(name, job);
        devLogger.log(`[Scheduler] Job "${name}" programado: ${cronExpression}`);
        return job;
    }
    async checkJobs() {
        const now = new Date();
        for (const [name, job] of this.jobs) {
            if (!job.enabled)
                continue;
            if (!job.nextRun || now < job.nextRun)
                continue;
            await this.runJob(name);
        }
    }
    async runJob(name) {
        const job = this.jobs.get(name);
        if (!job)
            return;
        devLogger.log(`[Scheduler] Ejecutando job "${name}"`);
        try {
            await job.handler();
            job.lastRun = new Date();
            job.runCount++;
            if (job.cron) {
                job.nextRun = this.getNextRun(job.cron);
            }
            devLogger.log(`[Scheduler] Job "${name}" completado`);
        }
        catch (error) {
            job.errors++;
            devLogger.error(`[Scheduler] Error en job "${name}":`, error.message);
            // Disable after too many errors
            const maxErrors = job.options.maxErrors || 5;
            if (job.errors >= maxErrors) {
                job.enabled = false;
                devLogger.warn(`[Scheduler] Job "${name}" deshabilitado por errores`);
            }
        }
    }
    getNextRun(cronExpression) {
        // Parseo simple de cron (minuto hora dia mes diaSemana)
        const parts = cronExpression.split(' ');
        if (parts.length !== 5)
            return null;
        const now = new Date();
        const next = new Date(now);
        const [minute, hour] = parts;
        if (minute !== '*') {
            next.setMinutes(parseInt(minute));
        }
        if (hour !== '*') {
            next.setHours(parseInt(hour));
        }
        // Si ya pasó, programar para mañana
        if (next <= now) {
            next.setDate(next.getDate() + 1);
        }
        return next;
    }
    // Ejecutar una vez después de delay
    setTimeout(name, handler, delayMs) {
        const timer = setTimeout(async () => {
            try {
                await handler();
                devLogger.log(`[Scheduler] Timeout "${name}" ejecutado`);
            }
            catch (error) {
                devLogger.error(`[Scheduler] Error en timeout "${name}":`, error.message);
            }
            this.jobs.delete(name);
        }, delayMs);
        this.jobs.set(name, {
            name,
            type: 'timeout',
            timer,
            handler,
            enabled: true,
            lastRun: null,
            nextRun: null,
            runCount: 0,
            errors: 0,
            options: {}
        });
        return name;
    }
    // Ejecutar a una hora específica
    scheduleAt(name, date, handler) {
        const now = new Date();
        const targetDate = new Date(date);
        const delay = targetDate.getTime() - now.getTime();
        if (delay <= 0) {
            throw new Error('La fecha debe ser futura');
        }
        return this.setTimeout(name, handler, delay);
    }
    cancel(name) {
        const job = this.jobs.get(name);
        if (!job)
            return false;
        if (job.timer) {
            clearTimeout(job.timer);
        }
        this.jobs.delete(name);
        devLogger.log(`[Scheduler] Job "${name}" cancelado`);
        return true;
    }
    enable(name) {
        const job = this.jobs.get(name);
        if (job) {
            job.enabled = true;
            job.errors = 0;
        }
    }
    disable(name) {
        const job = this.jobs.get(name);
        if (job) {
            job.enabled = false;
        }
    }
    list() {
        return Array.from(this.jobs.values()).map(job => ({
            name: job.name,
            cron: job.cron,
            enabled: job.enabled,
            lastRun: job.lastRun,
            nextRun: job.nextRun,
            runCount: job.runCount,
            errors: job.errors
        }));
    }
    getStats() {
        const jobs = Array.from(this.jobs.values());
        return {
            total: jobs.length,
            enabled: jobs.filter(j => j.enabled).length,
            disabled: jobs.filter(j => !j.enabled).length,
            totalRuns: jobs.reduce((sum, j) => sum + (j.runCount || 0), 0),
            totalErrors: jobs.reduce((sum, j) => sum + (j.errors || 0), 0)
        };
    }
}
exports.SchedulerService = SchedulerService;
// ============================================
// EXPORTS
// ============================================
const schedulerService = new SchedulerService();
exports.default = schedulerService;
// CommonJS compatibility
module.exports = schedulerService;
module.exports.SchedulerService = SchedulerService;
//# sourceMappingURL=scheduler.service.js.map