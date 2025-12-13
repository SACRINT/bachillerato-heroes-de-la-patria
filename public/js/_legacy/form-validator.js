/**
// Debug Logger - Logging condicional (GDPR compliant)
if (typeof debugLog === 'undefined') {
    // Fallback si debug-logger.js no está cargado
    var debugLog = {
        log: () => {},
        warn: () => {},
        error: () => {}
    };
}


 * FORM VALIDATOR - Sistema de Validaciones Mejoradas
 * Sistema centralizado de validación de formularios para BGE
 * Fecha: 19 de Octubre, 2025
 */

class FormValidator {
    constructor() {
        this.validationRules = {
            // Reglas de validación comunes
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^[0-9]{10}$/,
            curp: /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/,
            rfc: /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/,
            matricula: /^[A-Z0-9]{8,12}$/,
            nombre: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/,
            url: /^https?:\/\/.+/,
            onlyNumbers: /^[0-9]+$/,
            onlyLetters: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
            alphanumeric: /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/,
            noSpecialChars: /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,!?¡¿\-]+$/
        };

        this.errorMessages = {
            required: 'Este campo es obligatorio',
            email: 'Por favor ingresa un correo electrónico válido',
            phone: 'El teléfono debe tener 10 dígitos',
            curp: 'CURP inválida. Formato: AAAA######HMMMMMM##',
            rfc: 'RFC inválido. Formato: AAA######AAA o AAAA######AAA',
            matricula: 'Matrícula inválida (8-12 caracteres alfanuméricos)',
            nombre: 'Solo se permiten letras y espacios (2-50 caracteres)',
            url: 'URL inválida. Debe comenzar con http:// o https://',
            minLength: 'Debe tener al menos {min} caracteres',
            maxLength: 'No puede tener más de {max} caracteres',
            min: 'El valor mínimo es {min}',
            max: 'El valor máximo es {max}',
            match: 'Los campos no coinciden',
            onlyNumbers: 'Solo se permiten números',
            onlyLetters: 'Solo se permiten letras',
            alphanumeric: 'Solo se permiten letras y números',
            noSpecialChars: 'No se permiten caracteres especiales'
        };

        this.customValidators = {};
    }

    /**
     * Valida un campo individual
     * @param {HTMLElement} field - El campo a validar
     * @param {Object} rules - Reglas de validación
     * @returns {Object} - { valid: boolean, message: string }
     */
    validateField(field, rules = {}) {
        const value = field.value.trim();
        const fieldName = field.name || field.id;

        // Campo requerido
        if (rules.required && !value) {
            return {
                valid: false,
                message: this.errorMessages.required
            };
        }

        // Si está vacío y no es requerido, es válido
        if (!value && !rules.required) {
            return { valid: true, message: '' };
        }

        // Validación por tipo
        if (rules.type) {
            const pattern = this.validationRules[rules.type];
            if (pattern && !pattern.test(value)) {
                return {
                    valid: false,
                    message: this.errorMessages[rules.type] || 'Formato inválido'
                };
            }
        }

        // Validación de longitud mínima
        if (rules.minLength && value.length < rules.minLength) {
            return {
                valid: false,
                message: this.errorMessages.minLength.replace('{min}', rules.minLength)
            };
        }

        // Validación de longitud máxima
        if (rules.maxLength && value.length > rules.maxLength) {
            return {
                valid: false,
                message: this.errorMessages.maxLength.replace('{max}', rules.maxLength)
            };
        }

        // Validación de valor mínimo
        if (rules.min !== undefined && parseFloat(value) < rules.min) {
            return {
                valid: false,
                message: this.errorMessages.min.replace('{min}', rules.min)
            };
        }

        // Validación de valor máximo
        if (rules.max !== undefined && parseFloat(value) > rules.max) {
            return {
                valid: false,
                message: this.errorMessages.max.replace('{max}', rules.max)
            };
        }

        // Validación de coincidencia
        if (rules.match) {
            const matchField = document.getElementById(rules.match);
            if (matchField && value !== matchField.value) {
                return {
                    valid: false,
                    message: this.errorMessages.match
                };
            }
        }

        // Validación personalizada
        if (rules.custom && typeof rules.custom === 'function') {
            const customResult = rules.custom(value, field);
            if (customResult !== true) {
                return {
                    valid: false,
                    message: customResult || 'Validación fallida'
                };
            }
        }

        // Validador registrado
        if (rules.validator && this.customValidators[rules.validator]) {
            const validatorResult = this.customValidators[rules.validator](value, field);
            if (validatorResult !== true) {
                return {
                    valid: false,
                    message: validatorResult || 'Validación fallida'
                };
            }
        }

        return { valid: true, message: '' };
    }

    /**
     * Valida un formulario completo
     * @param {HTMLFormElement|string} form - El formulario o su ID
     * @param {Object} fieldRules - Reglas por campo { fieldId: rules }
     * @returns {Object} - { valid: boolean, errors: Object }
     */
    validateForm(form, fieldRules = {}) {
        if (typeof form === 'string') {
            form = document.getElementById(form);
        }

        if (!form) {
            debugLog.error('ERROR', 'Formulario no encontrado');
            return { valid: false, errors: {} };
        }

        const errors = {};
        let isValid = true;

        // Validar cada campo con reglas definidas
        Object.keys(fieldRules).forEach(fieldId => {
            const field = form.querySelector(`#${fieldId}`);
            if (field) {
                const result = this.validateField(field, fieldRules[fieldId]);
                if (!result.valid) {
                    errors[fieldId] = result.message;
                    isValid = false;
                    this.showFieldError(field, result.message);
                } else {
                    this.clearFieldError(field);
                }
            }
        });

        return { valid: isValid, errors };
    }

    /**
     * Muestra un error en un campo
     * @param {HTMLElement} field - El campo
     * @param {string} message - Mensaje de error
     */
    showFieldError(field, message) {
        // Quitar error anterior
        this.clearFieldError(field);

        // Marcar campo como inválido
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');

        // Crear elemento de error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        errorDiv.setAttribute('data-validator-error', sanitizeText('true'));

        // Insertar después del campo
        field.parentNode.insertBefore(errorDiv, field.nextSibling);
    }

    /**
     * Limpia el error de un campo
     * @param {HTMLElement} field - El campo
     */
    clearFieldError(field) {
        field.classList.remove('is-invalid');

        // Eliminar mensaje de error anterior
        const errorDiv = field.parentNode.querySelector('[data-validator-error]');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    /**
     * Marca un campo como válido
     * @param {HTMLElement} field - El campo
     */
    markFieldValid(field) {
        this.clearFieldError(field);
        field.classList.add('is-valid');
    }

    /**
     * Limpia todos los errores de un formulario
     * @param {HTMLFormElement|string} form - El formulario o su ID
     */
    clearFormErrors(form) {
        if (typeof form === 'string') {
            form = document.getElementById(form);
        }

        if (!form) return;

        const invalidFields = form.querySelectorAll('.is-invalid');
        invalidFields.forEach(field => this.clearFieldError(field));

        const validFields = form.querySelectorAll('.is-valid');
        validFields.forEach(field => field.classList.remove('is-valid'));
    }

    /**
     * Agrega validación en tiempo real a un campo
     * @param {HTMLElement|string} field - El campo o su ID
     * @param {Object} rules - Reglas de validación
     * @param {number} debounceTime - Tiempo de espera (ms)
     */
    enableRealTimeValidation(field, rules, debounceTime = 500) {
        if (typeof field === 'string') {
            field = document.getElementById(field);
        }

        if (!field) return;

        let timeout;

        const validate = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const result = this.validateField(field, rules);
                if (result.valid) {
                    this.markFieldValid(field);
                } else if (field.value.trim()) {
                    this.showFieldError(field, result.message);
                } else {
                    this.clearFieldError(field);
                }
            }, debounceTime);
        };

        field.addEventListener('input', validate);
        field.addEventListener('blur', () => {
            clearTimeout(timeout);
            const result = this.validateField(field, rules);
            if (!result.valid && field.value.trim()) {
                this.showFieldError(field, result.message);
            } else if (result.valid && field.value.trim()) {
                this.markFieldValid(field);
            }
        });
    }

    /**
     * Registra un validador personalizado
     * @param {string} name - Nombre del validador
     * @param {Function} validator - Función validadora
     */
    registerValidator(name, validator) {
        this.customValidators[name] = validator;
    }

    /**
     * Agrega una regla de validación personalizada
     * @param {string} name - Nombre de la regla
     * @param {RegExp} pattern - Patrón RegExp
     * @param {string} message - Mensaje de error
     */
    addValidationRule(name, pattern, message) {
        this.validationRules[name] = pattern;
        this.errorMessages[name] = message;
    }

    /**
     * Sanitiza una cadena de texto
     * @param {string} text - Texto a sanitizar
     * @returns {string} - Texto sanitizado
     */
    sanitize(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Valida y sanitiza datos de formulario
     * @param {FormData|Object} data - Datos del formulario
     * @param {Object} rules - Reglas de validación
     * @returns {Object} - { valid: boolean, data: Object, errors: Object }
     */
    validateAndSanitize(data, rules) {
        const sanitizedData = {};
        const errors = {};
        let isValid = true;

        const dataObj = data instanceof FormData ? Object.fromEntries(data) : data;

        Object.keys(dataObj).forEach(key => {
            const value = dataObj[key];

            // Sanitizar
            sanitizedData[key] = typeof value === 'string' ? this.sanitize(value.trim()) : value;

            // Validar si hay reglas
            if (rules[key]) {
                const mockField = { value, name: key, id: key };
                const result = this.validateField(mockField, rules[key]);

                if (!result.valid) {
                    errors[key] = result.message;
                    isValid = false;
                }
            }
        });

        return {
            valid: isValid,
            data: sanitizedData,
            errors
        };
    }
}

// Instancia global
if (typeof window !== 'undefined') {
    window.formValidator = new FormValidator();
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormValidator;
}
