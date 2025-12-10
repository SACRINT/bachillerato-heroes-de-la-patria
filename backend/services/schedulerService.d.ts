declare const _exports: SchedulerService;
export = _exports;
declare class SchedulerService {
    jobs: Map<any, any>;
    running: boolean;
    checkInterval: NodeJS.Timeout;
    start(): void;
    stop(): void;
    schedule(name: any, cronExpression: any, handler: any, options?: {}): {
        name: any;
        cron: any;
        handler: any;
        enabled: boolean;
        lastRun: any;
        nextRun: Date;
        runCount: number;
        errors: number;
        options: {};
    };
    checkJobs(): Promise<void>;
    runJob(name: any): Promise<void>;
    getNextRun(cronExpression: any): Date;
    setTimeout(name: any, handler: any, delayMs: any): any;
    scheduleAt(name: any, date: any, handler: any): any;
    cancel(name: any): boolean;
    enable(name: any): void;
    disable(name: any): void;
    list(): {
        name: any;
        cron: any;
        enabled: any;
        lastRun: any;
        nextRun: any;
        runCount: any;
        errors: any;
    }[];
    getStats(): {
        total: number;
        enabled: number;
        disabled: number;
        totalRuns: any;
        totalErrors: any;
    };
}
//# sourceMappingURL=schedulerService.d.ts.map