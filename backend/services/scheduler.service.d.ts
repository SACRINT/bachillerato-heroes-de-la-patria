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
declare class SchedulerService {
    private jobs;
    private running;
    private checkInterval;
    constructor();
    start(): void;
    stop(): void;
    schedule(name: string, cronExpression: string, handler: () => Promise<void> | void, options?: JobOptions): Job;
    checkJobs(): Promise<void>;
    runJob(name: string): Promise<void>;
    getNextRun(cronExpression: string): Date | null;
    setTimeout(name: string, handler: () => Promise<void> | void, delayMs: number): string;
    scheduleAt(name: string, date: Date | string, handler: () => Promise<void> | void): string;
    cancel(name: string): boolean;
    enable(name: string): void;
    disable(name: string): void;
    list(): JobInfo[];
    getStats(): SchedulerStats;
}
declare const schedulerService: SchedulerService;
export { SchedulerService };
export default schedulerService;
//# sourceMappingURL=scheduler.service.d.ts.map