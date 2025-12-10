/**
 * Crear verificación y enviar email al usuario
 * @param {Object} formData - Datos del formulario
 * @returns {Promise<string>} Token de verificación
 */
export function createVerification(formData: any): Promise<string>;
/**
 * Verificar token y marcar como verificado
 * @param {string} token - Token a verificar
 * @returns {Object} {success: boolean, data: Object}
 */
export function verifyToken(token: string): any;
/**
 * Obtener información de una verificación (sin eliminar)
 * @param {string} token - Token a buscar
 * @returns {Object} Datos de la verificación o null
 */
export function getVerification(token: string): any;
/**
 * Limpiar verificaciones expiradas (ejecutar periódicamente)
 */
export function cleanupExpiredTokens(): void;
//# sourceMappingURL=verificationService.d.ts.map