declare const _exports: AuditService;
export = _exports;
declare class AuditService {
    actions: {
        CREATE: string;
        READ: string;
        UPDATE: string;
        DELETE: string;
        LOGIN: string;
        LOGOUT: string;
        EXPORT: string;
        IMPORT: string;
    };
    log(params: any): Promise<any>;
    getByUser(userId: any, options?: {}): Promise<{
        success: boolean;
        data: any;
        pagination: {
            page: any;
            limit: any;
        };
    }>;
    getByEntity(entity: any, entityId: any, options?: {}): Promise<{
        success: boolean;
        data: any;
    }>;
    getStats(options?: {}): Promise<{
        success: boolean;
        data: any;
    }>;
    cleanup(daysToKeep?: number): Promise<any>;
    middleware(): (req: any, res: any, next: any) => void;
    getActionFromMethod(method: any): any;
    getEntityFromPath(path: any): any;
}
//# sourceMappingURL=auditService.d.ts.map