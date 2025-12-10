declare const _exports: GDPRService;
export = _exports;
declare class GDPRService {
    consentTypes: string[];
    recordConsent(userId: any, consents: any): Promise<{
        success: boolean;
        consentId: any;
    }>;
    getConsent(userId: any): Promise<{
        success: boolean;
        consent: any;
    }>;
    exportUserData(userId: any): Promise<{
        success: boolean;
        data: {
            usuario: any;
            estudiante: any;
            calificaciones: any;
            asistencias: any;
            notificaciones: any;
            actividad: any;
        };
        exportedAt: string;
        format: string;
    }>;
    deleteUserData(userId: any, options?: {}): Promise<{
        success: boolean;
        message: string;
        deletedAt: string;
    }>;
    logRequest(userId: any, type: any, status: any, details?: any): Promise<void>;
    getRequests(options?: {}): Promise<{
        success: boolean;
        requests: any;
    }>;
    applyRetentionPolicy(daysToKeep?: number): Promise<{
        success: boolean;
        deleted: any;
        appliedAt: string;
    }>;
}
//# sourceMappingURL=gdprService.d.ts.map