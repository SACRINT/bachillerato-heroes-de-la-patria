export class ServiceError extends Error {
    constructor(message: any, statusCode?: number);
    statusCode: number;
}
export namespace REQUEST_TYPES {
    let ACCESS: string;
    let PORTABILITY: string;
    let RECTIFICATION: string;
    let ERASURE: string;
    let RESTRICTION: string;
}
export namespace REQUEST_STATUS {
    let PENDING: string;
    let PROCESSING: string;
    let COMPLETED: string;
    let REJECTED: string;
    let EXPIRED: string;
}
export declare let exportDir: string;
export declare function initialize(): Promise<void>;
export declare function createRequest(options: any): Promise<any>;
export declare function processAccessRequest(requestId: any): Promise<{
    requestId: any;
    status: string;
    exportPath: string;
    dataCategories: string[];
    totalRecords: number;
}>;
export declare function processPortabilityRequest(requestId: any, format?: string): Promise<{
    requestId: any;
    status: string;
    downloadPath: any;
    format: string;
    expiresAt: string;
}>;
export declare function processErasureRequest(requestId: any): Promise<{
    tablesProcessed: any[];
    recordsDeleted: number;
    recordsAnonymized: number;
    requestId: any;
    status: string;
}>;
export declare function getRequestStatus(requestId: any): Promise<{
    id: any;
    type: any;
    status: any;
    createdAt: any;
    expiresAt: any;
    completedAt: any;
}>;
export declare function listUserRequests(userId: any): Promise<any>;
export declare function downloadExport(requestId: any): Promise<{
    path: any;
    filename: string;
}>;
export declare function generateConsentReport(tenantId?: any): Promise<{
    generatedAt: string;
    totalUsers: number;
    consents: any;
}>;
export declare function recordConsent(options: any): Promise<any>;
export declare function _generateRequestId(): string;
export declare function _getRequest(requestId: any): Promise<any>;
export declare function _collectUserData(userId: any): Promise<{
    usuario: any;
}>;
export declare function _sanitizeRecord(record: any): any;
export declare function _createExportFile(requestId: any, userData: any): Promise<string>;
export declare function _createJSONExport(requestId: any, userData: any): Promise<string>;
export declare function _createCSVExport(requestId: any, userData: any): Promise<string[]>;
export declare function _createZipArchive(requestId: any, files: any): Promise<any>;
export declare function _checkRetentionRequirements(userId: any): Promise<{
    mustRetain: boolean;
    reason: string;
    retainUntil: string;
} | {
    mustRetain: boolean;
    reason?: undefined;
    retainUntil?: undefined;
}>;
export declare function _countRecords(userData: any): number;
//# sourceMappingURL=GDPRDataExportService.d.ts.map