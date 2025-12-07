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

const devLogger = require('../utils/devLogger');

// ============================================
// INTERFACES
// ============================================

export interface JobOptions {
    enabled?: boolean;
    maxErrors?: number;
    [key: string]: any;
}

export interface Job {
    name: string;
    cron?: string;
    type?: 'cron' | 'timeout';
    handler: () => Promise<void> | void;
    enabled: boolean;
    lastRun: Date | null;
    nextRun: Date | null;
    runCount: number;
    errors: number;
    timer?: NodeJS.Timeout;
    options: JobOptions;
}

export interface JobInfo {
    name: string;
    cron?: string;
    enabled: boolean;
    lastRun: Date | null;
    nextRun: Date | null;
    runCount: number;
    errors: number;
}

export interface SchedulerStats {
    total: number;
    enabled: number;
    disabled: number;
    totalRuns: number;
    totalErrors: number;
}

// ============================================
// SCHEDULER SERVICE CLASS
// ============================================

class SchedulerService {
    private jobs: Map<string, Job>;
    private running: boolean;
    private checkInterval: NodeJS.Timeout | null;

    constructor() {
        this.jobs = new Map();
        this.running = false;
        this.checkInterval = null;
    }

    start(): void {
        if (this.running) return;

        this.running = true;
        this.checkInterval = setInterval(() => this.checkJobs(), 60000); // Cada minuto

        devLogger.log('[Scheduler] Servicio iniciado');
    }

    stop(): void {
        this.running = false;
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        devLogger.log('[Scheduler] Servicio detenido');
    }

    schedule(
        name: string,
        cronExpression: string,
        handler: () => Promise<void> | void,
        options: JobOptions = {}
    ): Job {
        const job: Job = {
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

    async checkJobs(): Promise<void> {
        const now = new Date();

        for (const [name, job] of this.jobs) {
            if (!job.enabled) continue;
            if (!job.nextRun || now < job.nextRun) continue;

            await this.runJob(name);
        }
    }

    async runJob(name: string): Promise<void> {
        const job = this.jobs.get(name);
        if (!job) return;

        devLogger.log(`[Scheduler] Ejecutando job "${name}"`);

        try {
            await job.handler();

            job.lastRun = new Date();
            job.runCount++;
            if (job.cron) {
                job.nextRun = this.getNextRun(job.cron);
            }

            devLogger.log(`[Scheduler] Job "${name}" completado`);

        } catch (error: any) {
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

    getNextRun(cronExpression: string): Date | null {
        // Parseo simple de cron (minuto hora dia mes diaSemana)
        const parts = cronExpression.split(' ');
        if (parts.length !== 5) return null;

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
    setTimeout(name: string, handler: () => Promise<void> | void, delayMs: number): string {
        const timer = setTimeout(async () => {
            try {
                await handler();
                devLogger.log(`[Scheduler] Timeout "${name}" ejecutado`);
            } catch (error: any) {
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
    scheduleAt(name: string, date: Date | string, handler: () => Promise<void> | void): string {
        const now = new Date();
        const targetDate = new Date(date);
        const delay = targetDate.getTime() - now.getTime();

        if (delay <= 0) {
            throw new Error('La fecha debe ser futura');
        }

        return this.setTimeout(name, handler, delay);
    }

    cancel(name: string): boolean {
        const job = this.jobs.get(name);
        if (!job) return false;

        if (job.timer) {
            clearTimeout(job.timer);
        }

        this.jobs.delete(name);
        devLogger.log(`[Scheduler] Job "${name}" cancelado`);

        return true;
    }

    enable(name: string): void {
        const job = this.jobs.get(name);
        if (job) {
            job.enabled = true;
            job.errors = 0;
        }
    }

    disable(name: string): void {
        const job = this.jobs.get(name);
        if (job) {
            job.enabled = false;
        }
    }

    list(): JobInfo[] {
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

    getStats(): SchedulerStats {
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

// ============================================
// EXPORTS
// ============================================

const schedulerService = new SchedulerService();

export { SchedulerService };
export default schedulerService;

// CommonJS compatibility
module.exports = schedulerService;
module.exports.SchedulerService = SchedulerService;
