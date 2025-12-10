/**
 * Validador de campos
 */
export class Validator {
    errors: any[];
    value: any;
    fieldName: string;
    /**
     * Iniciar validación de campo
     * @param {*} value - Valor a validar
     * @param {string} name - Nombre del campo
     * @returns {Validator} this
     */
    field(value: any, name: string): Validator;
    /**
     * Campo requerido
     * @param {string} message - Mensaje de error
     * @returns {Validator} this
     */
    required(message?: string): Validator;
    /**
     * Debe ser string
     * @returns {Validator} this
     */
    string(): Validator;
    /**
     * Debe ser número
     * @returns {Validator} this
     */
    number(): Validator;
    /**
     * Debe ser entero
     * @returns {Validator} this
     */
    integer(): Validator;
    /**
     * Debe ser boolean
     * @returns {Validator} this
     */
    boolean(): Validator;
    /**
     * Debe ser array
     * @returns {Validator} this
     */
    array(): Validator;
    /**
     * Longitud mínima
     * @param {number} min - Longitud mínima
     * @returns {Validator} this
     */
    minLength(min: number): Validator;
    /**
     * Longitud máxima
     * @param {number} max - Longitud máxima
     * @returns {Validator} this
     */
    maxLength(max: number): Validator;
    /**
     * Valor mínimo
     * @param {number} min - Valor mínimo
     * @returns {Validator} this
     */
    min(min: number): Validator;
    /**
     * Valor máximo
     * @param {number} max - Valor máximo
     * @returns {Validator} this
     */
    max(max: number): Validator;
    /**
     * Debe coincidir con patrón
     * @param {RegExp|string} pattern - Patrón o nombre de patrón
     * @param {string} message - Mensaje de error
     * @returns {Validator} this
     */
    matches(pattern: RegExp | string, message?: string): Validator;
    /**
     * Debe ser email válido
     * @returns {Validator} this
     */
    email(): Validator;
    /**
     * Debe ser URL válida
     * @returns {Validator} this
     */
    url(): Validator;
    /**
     * Debe ser fecha válida
     * @returns {Validator} this
     */
    date(): Validator;
    /**
     * Debe estar en lista de valores
     * @param {Array} values - Valores permitidos
     * @returns {Validator} this
     */
    oneOf(values: any[]): Validator;
    /**
     * Validación personalizada
     * @param {Function} fn - Función de validación
     * @param {string} message - Mensaje de error
     * @returns {Validator} this
     */
    custom(fn: Function, message: string): Validator;
    /**
     * Obtener errores
     * @returns {Array} Errores
     */
    getErrors(): any[];
    /**
     * Verificar si es válido
     * @returns {boolean} Es válido
     */
    isValid(): boolean;
    /**
     * Resetear errores
     * @returns {Validator} this
     */
    reset(): Validator;
}
/**
 * Crear middleware de validación
 * @param {Object} schema - Schema de validación
 * @returns {Function} Middleware
 */
export function validateRequest(schema: any): Function;
/**
 * Sanitizar string para prevenir XSS
 * @param {string} str - String a sanitizar
 * @returns {string} String sanitizado
 */
export function sanitizeString(str: string): string;
/**
 * Sanitizar objeto recursivamente
 * @param {Object} obj - Objeto a sanitizar
 * @returns {Object} Objeto sanitizado
 */
export function sanitizeObject(obj: any): any;
export namespace patterns {
    let email: RegExp;
    let phone: RegExp;
    let uuid: RegExp;
    let alphanumeric: RegExp;
    let alphanumericSpaces: RegExp;
    let url: RegExp;
    let date: RegExp;
    let time: RegExp;
    let password: RegExp;
    let matricula: RegExp;
    let curp: RegExp;
}
export namespace commonSchemas {
    namespace login {
        namespace body {
            export namespace email_1 {
                export let required: boolean;
                let email_2: boolean;
                export { email_2 as email };
            }
            export { email_1 as email };
            export namespace password_1 {
                let required_1: boolean;
                export { required_1 as required };
                export let minLength: number;
            }
            export { password_1 as password };
        }
    }
    namespace register {
        export namespace body_1 {
            export namespace nombre {
                let required_2: boolean;
                export { required_2 as required };
                export let string: boolean;
                let minLength_1: number;
                export { minLength_1 as minLength };
                export let maxLength: number;
            }
            export namespace email_3 {
                let required_3: boolean;
                export { required_3 as required };
                let email_4: boolean;
                export { email_4 as email };
            }
            export { email_3 as email };
            export namespace password_2 {
                let required_4: boolean;
                export { required_4 as required };
                let minLength_2: number;
                export { minLength_2 as minLength };
            }
            export { password_2 as password };
        }
        export { body_1 as body };
    }
    namespace pagination {
        namespace query {
            namespace page {
                let integer: boolean;
                let min: number;
            }
            namespace limit {
                let integer_1: boolean;
                export { integer_1 as integer };
                let min_1: number;
                export { min_1 as min };
                export let max: number;
            }
        }
    }
    namespace idParam {
        namespace params {
            namespace id {
                let required_5: boolean;
                export { required_5 as required };
                let integer_2: boolean;
                export { integer_2 as integer };
                let min_2: number;
                export { min_2 as min };
            }
        }
    }
}
//# sourceMappingURL=inputValidator.d.ts.map