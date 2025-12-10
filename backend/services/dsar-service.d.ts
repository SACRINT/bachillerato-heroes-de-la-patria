export function createDSARRequest(userId: any, requestType: any, email: any, metadata?: {}): Promise<any>;
export function verifyDSARRequest(token: any): Promise<any>;
export function processDSARRequest(requestId: any): Promise<void>;
export function collectUserData(userId: any): Promise<{
    profile: any;
    academic: any;
    activity: any;
    consents: any;
    communications: any;
    financial: any;
    files: any;
    processing_metadata: {
        data_controller: {
            name: string;
            email: string;
        };
        legal_basis: string[];
        purposes: string[];
        retention_periods: {
            profile_data: string;
            academic_records: string;
        };
    };
}>;
export function generateAccessExport(requestId: any, userData: any): Promise<string>;
export function generatePortabilityExport(requestId: any, userData: any): Promise<string>;
//# sourceMappingURL=dsar-service.d.ts.map