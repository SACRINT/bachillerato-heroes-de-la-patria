export function cleanupTable(tableName: any): Promise<{
    table: any;
    cleaned: any;
}>;
export function runAllCleanups(): Promise<[{
    table: any;
    cleaned: any;
}, {
    table: any;
    cleaned: any;
}]>;
export function startCleanupService(intervalHours?: number): void;
//# sourceMappingURL=cleanupService.d.ts.map