export function validateErasureRequest(userId: any): Promise<{
    canErase: boolean;
    reason: string;
    exception?: undefined;
} | {
    canErase: boolean;
    reason: string;
    exception: string;
} | {
    canErase: string;
    reason: string;
    exception: string;
}>;
export function executeRightToErasure(userId: any, requestedBy: any, reason?: string): Promise<{
    success: boolean;
    userId: any;
    pseudonym: string;
    erasureType: string;
    message: string;
}>;
export function restoreErasedUser(userId: any): Promise<{
    success: boolean;
    message: string;
    userId: any;
}>;
export function checkLegalRetention(userId: any): Promise<boolean>;
export function checkPublicContent(userId: any): Promise<boolean>;
export function checkActiveClaims(userId: any): Promise<boolean>;
//# sourceMappingURL=right-to-erasure-service.d.ts.map