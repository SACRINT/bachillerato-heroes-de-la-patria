/**
 * @fileoverview Form Validation Utility System.
 * Migrated from public/js/form-validator.js
 */

import { sanitizeText } from './sanitizer';

export interface ValidationResult {
    valid: boolean;
    message: string;
}

export interface ValidationRules {
    required?: boolean;
    type?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    match?: string;
    custom?: (value: string, field: HTMLElement | { value: string }) => boolean | string;
    validator?: string;
}

export interface FormValidationResult {
    valid: boolean;
    errors: Record<string, string>;
    data?: Record<string, any>;
}

export class FormValidator {
    private validationRules: Record<string, RegExp> = {
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

    private errorMessages: Record<string, string> = {
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

    private customValidators: Record<string, Function> = {};

    public validateField(field: HTMLInputElement | { value: string; name?: string; id?: string }, rules: ValidationRules = {}): ValidationResult {
        const value = field.value.trim();

        if (rules.required && !value) {
            return { valid: false, message: this.errorMessages.required };
        }

        if (!value && !rules.required) {
            return { valid: true, message: '' };
        }

        if (rules.type) {
            const pattern = this.validationRules[rules.type];
            if (pattern && !pattern.test(value)) {
                return {
                    valid: false,
                    message: this.errorMessages[rules.type] || 'Formato inválido'
                };
            }
        }

        if (rules.minLength && value.length < rules.minLength) {
            return {
                valid: false,
                message: this.errorMessages.minLength.replace('{min}', String(rules.minLength))
            };
        }

        if (rules.maxLength && value.length > rules.maxLength) {
            return {
                valid: false,
                message: this.errorMessages.maxLength.replace('{max}', String(rules.maxLength))
            };
        }

        if (rules.min !== undefined && parseFloat(value) < rules.min) {
            return {
                valid: false,
                message: this.errorMessages.min.replace('{min}', String(rules.min))
            };
        }

        if (rules.max !== undefined && parseFloat(value) > rules.max) {
            return {
                valid: false,
                message: this.errorMessages.max.replace('{max}', String(rules.max))
            };
        }

        if (rules.match) {
            const matchField = document.getElementById(rules.match) as HTMLInputElement;
            if (matchField && value !== matchField.value) {
                return {
                    valid: false,
                    message: this.errorMessages.match
                };
            }
        }

        if (rules.custom && typeof rules.custom === 'function') {
            const customResult = rules.custom(value, field);
            if (customResult !== true) {
                return {
                    valid: false,
                    message: typeof customResult === 'string' ? customResult : 'Validación fallida'
                };
            }
        }

        if (rules.validator && this.customValidators[rules.validator]) {
            const validatorResult = this.customValidators[rules.validator](value, field);
            if (validatorResult !== true) {
                return {
                    valid: false,
                    message: typeof validatorResult === 'string' ? validatorResult : 'Validación fallida'
                };
            }
        }

        return { valid: true, message: '' };
    }

    public validateForm(form: HTMLFormElement | string, fieldRules: Record<string, ValidationRules> = {}): FormValidationResult {
        const formElement = typeof form === 'string' ? document.getElementById(form) as HTMLFormElement : form;

        if (!formElement) {
            console.error('ERROR: Formulario no encontrado');
            return { valid: false, errors: {} };
        }

        const errors: Record<string, string> = {};
        let isValid = true;

        Object.keys(fieldRules).forEach(fieldId => {
            const field = formElement.querySelector(`#${fieldId}`) as HTMLInputElement;
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

    public showFieldError(field: HTMLElement, message: string): void {
        this.clearFieldError(field);
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');

        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        errorDiv.setAttribute('data-validator-error', 'true');

        if (field.parentNode) {
            field.parentNode.insertBefore(errorDiv, field.nextSibling);
        }
    }

    public clearFieldError(field: HTMLElement): void {
        field.classList.remove('is-invalid');
        const errorDiv = field.parentNode?.querySelector('[data-validator-error]');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    public markFieldValid(field: HTMLElement): void {
        this.clearFieldError(field);
        field.classList.add('is-valid');
    }

    public clearFormErrors(form: HTMLFormElement | string): void {
        const formElement = typeof form === 'string' ? document.getElementById(form) as HTMLFormElement : form;
        if (!formElement) return;

        const invalidFields = formElement.querySelectorAll('.is-invalid');
        invalidFields.forEach(field => this.clearFieldError(field as HTMLElement));

        const validFields = formElement.querySelectorAll('.is-valid');
        validFields.forEach(field => field.classList.remove('is-valid'));
    }

    public enableRealTimeValidation(field: HTMLElement | string, rules: ValidationRules, debounceTime = 500): void {
        const fieldElement = typeof field === 'string' ? document.getElementById(field) : field;
        if (!fieldElement) return;

        let timeout: any;
        const inputElement = fieldElement as HTMLInputElement;

        const validate = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const result = this.validateField(inputElement, rules);
                if (result.valid) {
                    this.markFieldValid(inputElement);
                } else if (inputElement.value.trim()) {
                    this.showFieldError(inputElement, result.message);
                } else {
                    this.clearFieldError(inputElement);
                }
            }, debounceTime);
        };

        fieldElement.addEventListener('input', validate);
        fieldElement.addEventListener('blur', () => {
            clearTimeout(timeout);
            const result = this.validateField(inputElement, rules);
            if (!result.valid && inputElement.value.trim()) {
                this.showFieldError(inputElement, result.message);
            } else if (result.valid && inputElement.value.trim()) {
                this.markFieldValid(inputElement);
            }
        });
    }

    public registerValidator(name: string, validator: Function): void {
        this.customValidators[name] = validator;
    }

    public addValidationRule(name: string, pattern: RegExp, message: string): void {
        this.validationRules[name] = pattern;
        this.errorMessages[name] = message;
    }

    public sanitize(text: string): string {
        return sanitizeText(text);
    }

    public validateAndSanitize(data: FormData | Record<string, any>, rules: Record<string, ValidationRules>): FormValidationResult {
        const sanitizedData: Record<string, any> = {};
        const errors: Record<string, string> = {};
        let isValid = true;

        const dataObj: Record<string, any> = data instanceof FormData ? Object.fromEntries(data) : data;

        Object.keys(dataObj).forEach(key => {
            const value = dataObj[key];
            sanitizedData[key] = typeof value === 'string' ? this.sanitize(value.trim()) : value;

            if (rules[key]) {
                const mockField = { value: String(value), name: key, id: key };
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

export const formValidator = new FormValidator();
(window as any).formValidator = formValidator;
