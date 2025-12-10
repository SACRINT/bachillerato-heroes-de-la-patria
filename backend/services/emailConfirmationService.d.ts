export function generateConfirmationToken(): string;
export function savePendingConfirmation(formData: any, ipAddress: any, userAgent: any): Promise<{
    success: boolean;
    uuid: any;
    email: any;
    confirmationToken: any;
    tokenExpiresAt: Date;
}>;
export function sendConfirmationEmail(email: any, name: any, confirmationToken: any, confirmationUrl: any): Promise<{
    success: boolean;
    message: string;
}>;
export function confirmEmailWithToken(confirmationToken: any): Promise<{
    success: boolean;
    error: string;
    uuid?: undefined;
    email?: undefined;
    approvalId?: undefined;
    approvalUuid?: undefined;
    message?: undefined;
} | {
    success: boolean;
    uuid: any;
    email: any;
    approvalId: any;
    approvalUuid: any;
    message: string;
    error?: undefined;
}>;
export function getPendingConfirmations(limit?: number, offset?: number): Promise<{
    success: boolean;
    data: any;
    total: any;
    limit: number;
    offset: number;
}>;
export function cleanExpiredTokens(): Promise<any>;
//# sourceMappingURL=emailConfirmationService.d.ts.map