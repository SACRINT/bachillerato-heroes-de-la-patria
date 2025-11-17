/**
 * 🔍 MÓDULO DE VALIDACIONES DE FORMULARIOS
 * Validadores reutilizables para formularios profesionales
 * Fecha: 17 Noviembre 2025
 */

// Patrones de validación comunes
export const VALIDATION_PATTERNS = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\d\s\-\+\(\)]{10,}$/,
    url: /^https?:\/\/.+/,
    postalCode: /^\d{5}$/
};

// Dominios de email comunes y válidos
export const COMMON_EMAIL_DOMAINS = [
    'gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com',
    'icloud.com', 'protonmail.com', 'live.com', 'msn.com',
    'aol.com', 'zoho.com'
];

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean}
 */
export function isValidEmailFormat(email) {
    if (!email || typeof email !== 'string') return false;
    return VALIDATION_PATTERNS.email.test(email.trim());
}

/**
 * Valida formato de teléfono
 * @param {string} phone - Teléfono a validar
 * @returns {boolean}
 */
export function isValidPhoneFormat(phone) {
    if (!phone || typeof phone !== 'string') return false;
    const cleaned = phone.replace(/\s/g, '');
    return VALIDATION_PATTERNS.phone.test(cleaned);
}

/**
 * Verifica si un email pertenece a un dominio común
 * @param {string} email - Email a verificar
 * @returns {boolean}
 */
export function isCommonEmailDomain(email) {
    if (!isValidEmailFormat(email)) return false;
    const domain = email.split('@')[1]?.toLowerCase();
    return COMMON_EMAIL_DOMAINS.includes(domain);
}

/**
 * Verifica si un email es de dominio educativo o gubernamental
 * @param {string} email - Email a verificar
 * @returns {boolean}
 */
export function isInstitutionalEmail(email) {
    if (!isValidEmailFormat(email)) return false;
    const domain = email.split('@')[1]?.toLowerCase();
    return domain?.includes('edu') || domain?.includes('gob');
}

/**
 * Valida un email y devuelve información de verificación
 * @param {string} email - Email a validar
 * @returns {Object} - { valid, reason, quality, warning }
 */
export function verifyEmailQuality(email) {
    // Verificación básica de formato
    if (!isValidEmailFormat(email)) {
        return { valid: false, reason: 'Formato de email inválido' };
    }

    // Verificar dominios comunes (mayoría válidos)
    if (isCommonEmailDomain(email)) {
        return {
            valid: true,
            reason: 'Dominio verificado',
            quality: 'high'
        };
    }

    // Verificar dominios educativos
    if (isInstitutionalEmail(email)) {
        return {
            valid: true,
            reason: 'Dominio institucional',
            quality: 'high'
        };
    }

    // Para otros dominios, asumir válidos pero con menor calidad
    return {
        valid: true,
        reason: 'Formato válido',
        quality: 'medium',
        warning: 'Por favor, verifica que tu email sea correcto'
    };
}

/**
 * Valida campos requeridos en un objeto de datos
 * @param {Object} data - Objeto con datos del formulario
 * @param {Array<string>} requiredFields - Array de campos requeridos
 * @returns {Object} - { valid, errors }
 */
export function validateRequiredFields(data, requiredFields) {
    const errors = [];

    for (const field of requiredFields) {
        const value = data[field];
        if (!value || (typeof value === 'string' && !value.trim())) {
            errors.push({
                field,
                message: `El campo "${field}" es requerido`
            });
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Valida longitud mínima de un campo de texto
 * @param {string} value - Valor a validar
 * @param {number} minLength - Longitud mínima
 * @param {string} fieldName - Nombre del campo (para mensaje de error)
 * @returns {Object} - { valid, message }
 */
export function validateMinLength(value, minLength, fieldName = 'El campo') {
    if (!value || typeof value !== 'string') {
        return { valid: false, message: `${fieldName} es requerido` };
    }

    if (value.trim().length < minLength) {
        return {
            valid: false,
            message: `${fieldName} debe tener al menos ${minLength} caracteres`
        };
    }

    return { valid: true };
}

/**
 * Valida longitud máxima de un campo de texto
 * @param {string} value - Valor a validar
 * @param {number} maxLength - Longitud máxima
 * @param {string} fieldName - Nombre del campo
 * @returns {Object} - { valid, message }
 */
export function validateMaxLength(value, maxLength, fieldName = 'El campo') {
    if (!value || typeof value !== 'string') {
        return { valid: true }; // Si no hay valor, no hay error de max length
    }

    if (value.trim().length > maxLength) {
        return {
            valid: false,
            message: `${fieldName} no puede tener más de ${maxLength} caracteres`
        };
    }

    return { valid: true };
}

/**
 * Valida formato de fecha YYYY-MM-DD
 * @param {string} dateStr - Fecha en formato string
 * @returns {boolean}
 */
export function isValidDateFormat(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return false;
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

/**
 * Valida formato de hora HH:MM
 * @param {string} timeStr - Hora en formato string
 * @returns {boolean}
 */
export function isValidTimeFormat(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return false;
    return /^\d{2}:\d{2}$/.test(timeStr);
}

/**
 * Valida que una fecha sea futura
 * @param {string} dateStr - Fecha en formato YYYY-MM-DD
 * @returns {boolean}
 */
export function isFutureDate(dateStr) {
    if (!isValidDateFormat(dateStr)) return false;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
}

/**
 * Sanitiza un string para evitar XSS básico
 * @param {string} str - String a sanitizar
 * @returns {string}
 */
export function sanitizeString(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .trim()
        .replace(/[<>]/g, '') // Eliminar < y >
        .substring(0, 1000); // Limitar longitud
}

/**
 * Valida formato de año (4 dígitos entre 1900 y año actual + 10)
 * @param {string} yearStr - Año como string
 * @returns {boolean}
 */
export function isValidYear(yearStr) {
    if (!yearStr) return false;
    const year = parseInt(yearStr);
    const currentYear = new Date().getFullYear();
    return year >= 1900 && year <= currentYear + 10;
}

/**
 * Valida un objeto completo de datos de formulario
 * Función de validación compuesta para múltiples reglas
 * @param {Object} data - Datos del formulario
 * @param {Object} rules - Reglas de validación
 * @returns {Object} - { valid, errors }
 *
 * Ejemplo de rules:
 * {
 *   email: { required: true, type: 'email' },
 *   nombre: { required: true, minLength: 3, maxLength: 100 },
 *   telefono: { required: false, type: 'phone' },
 *   mensaje: { required: true, minLength: 20 }
 * }
 */
export function validateForm(data, rules) {
    const errors = [];

    for (const [field, fieldRules] of Object.entries(rules)) {
        const value = data[field];

        // Validar requerido
        if (fieldRules.required && (!value || !value.trim())) {
            errors.push({
                field,
                message: `El campo "${field}" es requerido`
            });
            continue;
        }

        // Si el campo no es requerido y está vacío, skip otras validaciones
        if (!fieldRules.required && (!value || !value.trim())) {
            continue;
        }

        // Validar tipo
        if (fieldRules.type === 'email' && !isValidEmailFormat(value)) {
            errors.push({
                field,
                message: `El email no es válido`
            });
        }

        if (fieldRules.type === 'phone' && !isValidPhoneFormat(value)) {
            errors.push({
                field,
                message: `El teléfono no tiene un formato válido`
            });
        }

        // Validar longitud mínima
        if (fieldRules.minLength) {
            const result = validateMinLength(value, fieldRules.minLength, field);
            if (!result.valid) {
                errors.push({
                    field,
                    message: result.message
                });
            }
        }

        // Validar longitud máxima
        if (fieldRules.maxLength) {
            const result = validateMaxLength(value, fieldRules.maxLength, field);
            if (!result.valid) {
                errors.push({
                    field,
                    message: result.message
                });
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
