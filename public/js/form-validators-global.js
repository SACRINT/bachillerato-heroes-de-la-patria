/**
 * 🔍 VALIDADORES DE FORMULARIOS (GLOBAL)
 * Versión globalizada para compatibilidad con scripts tradicionales
 * Fecha: 17 Noviembre 2025
 */

(function(window) {
    'use strict';

    // Patrones de validación comunes
    const VALIDATION_PATTERNS = {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^[\d\s\-\+\(\)]{10,}$/,
        url: /^https?:\/\/.+/,
        postalCode: /^\d{5}$/
    };

    // Dominios de email comunes y válidos
    const COMMON_EMAIL_DOMAINS = [
        'gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com',
        'icloud.com', 'protonmail.com', 'live.com', 'msn.com',
        'aol.com', 'zoho.com'
    ];

    // Objeto global con todas las funciones de validación
    window.FormValidators = {
        /**
         * Valida formato de email
         */
        isValidEmailFormat(email) {
            if (!email || typeof email !== 'string') return false;
            return VALIDATION_PATTERNS.email.test(email.trim());
        },

        /**
         * Valida formato de teléfono
         */
        isValidPhoneFormat(phone) {
            if (!phone || typeof phone !== 'string') return false;
            const cleaned = phone.replace(/\s/g, '');
            return VALIDATION_PATTERNS.phone.test(cleaned);
        },

        /**
         * Verifica si un email pertenece a un dominio común
         */
        isCommonEmailDomain(email) {
            if (!this.isValidEmailFormat(email)) return false;
            const domain = email.split('@')[1]?.toLowerCase();
            return COMMON_EMAIL_DOMAINS.includes(domain);
        },

        /**
         * Verifica si un email es de dominio educativo o gubernamental
         */
        isInstitutionalEmail(email) {
            if (!this.isValidEmailFormat(email)) return false;
            const domain = email.split('@')[1]?.toLowerCase();
            return domain?.includes('edu') || domain?.includes('gob');
        },

        /**
         * Valida un email y devuelve información de verificación
         */
        verifyEmailQuality(email) {
            // Verificación básica de formato
            if (!this.isValidEmailFormat(email)) {
                return { valid: false, reason: 'Formato de email inválido' };
            }

            // Verificar dominios comunes
            if (this.isCommonEmailDomain(email)) {
                return {
                    valid: true,
                    reason: 'Dominio verificado',
                    quality: 'high'
                };
            }

            // Verificar dominios educativos
            if (this.isInstitutionalEmail(email)) {
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
        },

        /**
         * Valida campos requeridos en un objeto de datos
         */
        validateRequiredFields(data, requiredFields) {
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
        },

        /**
         * Valida longitud mínima de un campo de texto
         */
        validateMinLength(value, minLength, fieldName = 'El campo') {
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
        },

        /**
         * Valida longitud máxima de un campo de texto
         */
        validateMaxLength(value, maxLength, fieldName = 'El campo') {
            if (!value || typeof value !== 'string') {
                return { valid: true };
            }

            if (value.trim().length > maxLength) {
                return {
                    valid: false,
                    message: `${fieldName} no puede tener más de ${maxLength} caracteres`
                };
            }

            return { valid: true };
        },

        /**
         * Valida formato de fecha YYYY-MM-DD
         */
        isValidDateFormat(dateStr) {
            if (!dateStr || typeof dateStr !== 'string') return false;
            return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
        },

        /**
         * Valida formato de hora HH:MM
         */
        isValidTimeFormat(timeStr) {
            if (!timeStr || typeof timeStr !== 'string') return false;
            return /^\d{2}:\d{2}$/.test(timeStr);
        },

        /**
         * Valida que una fecha sea futura
         */
        isFutureDate(dateStr) {
            if (!this.isValidDateFormat(dateStr)) return false;
            const date = new Date(dateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date >= today;
        },

        /**
         * Sanitiza un string para evitar XSS básico
         */
        sanitizeString(str) {
            if (!str || typeof str !== 'string') return '';
            return str
                .trim()
                .replace(/[<>]/g, '')
                .substring(0, 1000);
        },

        /**
         * Valida formato de año (4 dígitos entre 1900 y año actual + 10)
         */
        isValidYear(yearStr) {
            if (!yearStr) return false;
            const year = parseInt(yearStr);
            const currentYear = new Date().getFullYear();
            return year >= 1900 && year <= currentYear + 10;
        },

        /**
         * Valida un objeto completo de datos de formulario
         */
        validateForm(data, rules) {
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
                if (fieldRules.type === 'email' && !this.isValidEmailFormat(value)) {
                    errors.push({
                        field,
                        message: `El email no es válido`
                    });
                }

                if (fieldRules.type === 'phone' && !this.isValidPhoneFormat(value)) {
                    errors.push({
                        field,
                        message: `El teléfono no tiene un formato válido`
                    });
                }

                // Validar longitud mínima
                if (fieldRules.minLength) {
                    const result = this.validateMinLength(value, fieldRules.minLength, field);
                    if (!result.valid) {
                        errors.push({
                            field,
                            message: result.message
                        });
                    }
                }

                // Validar longitud máxima
                if (fieldRules.maxLength) {
                    const result = this.validateMaxLength(value, fieldRules.maxLength, field);
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
        },

        // Exponer constantes también
        VALIDATION_PATTERNS,
        COMMON_EMAIL_DOMAINS
    };

    if (typeof debugLog !== 'undefined') {
        debugLog.log('VALIDATORS', '✅ FormValidators globalizados cargados');
    }

})(window);
