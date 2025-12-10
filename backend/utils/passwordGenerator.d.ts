export class PasswordGenerator {
    lowercase: string;
    uppercase: string;
    numbers: string;
    symbols: string;
    allChars: string;
    /**
     * Generar contraseña temporal aleatoria
     * @param {number} length - Longitud de la contraseña (default: 12)
     * @returns {string} Contraseña generada
     */
    generateTemporaryPassword(length?: number): string;
    /**
     * Generar contraseña memorable (formato: Palabra-Numero-Simbolo)
     * Ejemplo: "Tigre2024!"
     */
    generateMemorablePassword(): string;
    /**
     * Generar PIN numérico
     */
    generateNumericPin(length?: number): string;
    /**
     * Generar contraseña con prefijo institucional
     */
    generateInstitutionalPassword(prefix?: string): string;
    /**
     * Obtener carácter aleatorio de una cadena
     */
    getRandomChar(charSet: any): any;
    /**
     * Generar cadena aleatoria
     */
    generateRandomString(length: any): string;
    /**
     * Mezclar cadena aleatoriamente
     */
    shuffleString(str: any): any;
    /**
     * Validar que la contraseña cumple requisitos
     */
    validatePassword(password: any): boolean;
    /**
     * Generar múltiples contraseñas y devolver la más fuerte
     */
    generateStrongestPassword(length?: number, attempts?: number): string;
    /**
     * Calcular fortaleza de contraseña (0-100)
     */
    calculatePasswordStrength(password: any): number;
    /**
     * Generar contraseña con requerimientos específicos
     */
    generateWithRequirements(requirements?: {}): any;
}
export function getPasswordGenerator(): any;
//# sourceMappingURL=passwordGenerator.d.ts.map