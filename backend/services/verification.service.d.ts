/**
 * 🔐 VERIFICATION SERVICE - TypeScript Version
 * Servicio de verificación de email para formularios
 */
export interface FormData {
    nombre?: string;
    email: string;
    tipo_consulta?: string;
    tipo?: string;
    asunto?: string;
    mensaje?: string;
    [key: string]: any;
}
export interface VerificationRecord {
    data: FormData;
    expiresAt: number;
    verified: boolean;
}
export interface VerificationResult {
    success: boolean;
    data?: FormData;
    message?: string;
    error?: string;
}
/**
 * Crear verificación y enviar email al usuario
 */
declare function createVerification(formData: FormData): Promise<string>;
/**
 * Verificar token y marcar como verificado
 */
declare function verifyToken(token: string): VerificationResult;
/**
 * Obtener información de una verificación (sin eliminar)
 */
declare function getVerification(token: string): VerificationRecord | null;
/**
 * Limpiar verificaciones expiradas
 */
declare function cleanupExpiredTokens(): void;
export { createVerification, verifyToken, getVerification, cleanupExpiredTokens };
//# sourceMappingURL=verification.service.d.ts.map