/**
 * 📝 FORM SERVICE - TypeScript Version
 * Gestión de formularios con validación
 * GDPR Compliant
 * Refactorizado: 07 Diciembre 2025
 */

const devLogger = require('../utils/devLogger');
const db = require('../data/database-access');

// ============================================
// INTERFACES
// ============================================

export interface FormSubmission {
    id?: number;
    form_type: string;
    user_id: number | null;
    form_data: Record<string, any>;
    status: 'pending' | 'processed' | 'rejected';
    created_at: Date;
    ip_address?: string | null;
    user_agent?: string | null;
}

export interface FormFilters {
    form_type?: string;
    status?: string;
    user_id?: number;
    date_range?: { start: Date; end: Date };
}

export type FormType = 'Contacto' | 'CV' | 'Bolsa de Trabajo' | 'Cita' | 'Agendamiento de Cita' | 'Egresado' | 'Soporte';

// ============================================
// FORM SERVICE CLASS
// ============================================

class FormService {

    async submitForm(formType: string, formData: Record<string, any>, userId: number | null = null): Promise<FormSubmission> {
        devLogger.log('FORM', `Submitting ${formType} form`, { userId });

        try {
            this.validateFormData(formType, formData);

            const submission = await db.createFormSubmission({
                form_type: formType,
                user_id: userId,
                form_data: formData,
                status: 'pending',
                created_at: new Date(),
                ip_address: formData._ipAddress || null,
                user_agent: formData._userAgent || null
            });

            devLogger.log('FORM', `Form ${formType} submitted successfully`, { submissionId: submission.id });
            return submission;
        } catch (error: any) {
            devLogger.error('FORM', `Error submitting ${formType} form`, error.message);
            throw error;
        }
    }

    async getSubmissions(filters: FormFilters = {}): Promise<FormSubmission[]> {
        devLogger.log('FORM', 'Fetching form submissions', { filterCount: Object.keys(filters).length });

        try {
            const submissions = await db.getFormSubmissions(filters);
            devLogger.log('FORM', 'Form submissions fetched', { count: submissions.length });
            return submissions;
        } catch (error: any) {
            devLogger.error('FORM', 'Error fetching submissions', error.message);
            throw error;
        }
    }

    async getSubmissionById(submissionId: number): Promise<FormSubmission> {
        devLogger.log('FORM', 'Fetching submission details', { submissionId });

        try {
            const submission = await db.getFormSubmissionById(submissionId);

            if (!submission) {
                throw new Error('Formulario no encontrado');
            }

            return submission;
        } catch (error: any) {
            devLogger.error('FORM', 'Error fetching submission', error.message);
            throw error;
        }
    }

    validateFormData(formType: string, data: Record<string, any>): void {
        devLogger.log('FORM', `Validating ${formType} form data`);

        if (!data || typeof data !== 'object') {
            throw new Error('Datos de formulario inválidos');
        }

        switch (formType) {
            case 'Contacto':
                this._validateContactForm(data);
                break;
            case 'CV':
            case 'Bolsa de Trabajo':
                this._validateCVForm(data);
                break;
            case 'Agendamiento de Cita':
            case 'Cita':
                this._validateAppointmentForm(data);
                break;
            case 'Egresado':
                this._validateEgresadoForm(data);
                break;
            case 'Soporte':
                this._validateSupportForm(data);
                break;
            default:
                this._validateGenericForm(data);
        }

        devLogger.log('FORM', `${formType} form validation passed`);
    }

    private _validateContactForm(data: Record<string, any>): void {
        const requiredFields = ['name', 'email', 'message'];
        this._checkRequiredFields(data, requiredFields);

        if (!this._isValidEmail(data.email)) {
            throw new Error('Email inválido');
        }

        if (data.message.length < 20) {
            throw new Error('El mensaje debe tener al menos 20 caracteres');
        }
    }

    private _validateCVForm(data: Record<string, any>): void {
        const requiredFields = ['name', 'email', 'phone'];
        this._checkRequiredFields(data, requiredFields);

        if (!this._isValidEmail(data.email)) {
            throw new Error('Email inválido');
        }

        if (!this._isValidPhone(data.phone)) {
            throw new Error('Teléfono inválido');
        }

        if (!data.file && !data.cv_url) {
            throw new Error('Debe adjuntar un archivo CV');
        }
    }

    private _validateAppointmentForm(data: Record<string, any>): void {
        const requiredFields = ['name', 'email', 'date', 'reason'];
        this._checkRequiredFields(data, requiredFields);

        if (!this._isValidEmail(data.email)) {
            throw new Error('Email inválido');
        }

        const appointmentDate = new Date(data.date);
        if (appointmentDate <= new Date()) {
            throw new Error('La fecha de la cita debe ser futura');
        }

        if (data.reason.length < 10) {
            throw new Error('La razón de la cita debe tener al menos 10 caracteres');
        }
    }

    private _validateEgresadoForm(data: Record<string, any>): void {
        const requiredFields = ['nombre', 'email', 'generacion'];
        this._checkRequiredFields(data, requiredFields);

        if (!this._isValidEmail(data.email)) {
            throw new Error('Email inválido');
        }

        const currentYear = new Date().getFullYear();
        if (data.generacion < 1990 || data.generacion > currentYear) {
            throw new Error('Generación inválida');
        }
    }

    private _validateSupportForm(data: Record<string, any>): void {
        const requiredFields = ['name', 'email', 'subject', 'description'];
        this._checkRequiredFields(data, requiredFields);

        if (!this._isValidEmail(data.email)) {
            throw new Error('Email inválido');
        }

        if (data.description.length < 30) {
            throw new Error('La descripción debe tener al menos 30 caracteres');
        }
    }

    private _validateGenericForm(data: Record<string, any>): void {
        if (!data.email || !this._isValidEmail(data.email)) {
            throw new Error('Email requerido y válido');
        }
    }

    private _checkRequiredFields(data: Record<string, any>, requiredFields: string[]): void {
        const missingFields = requiredFields.filter(field => !data[field] || data[field].toString().trim() === '');

        if (missingFields.length > 0) {
            throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
        }
    }

    private _isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private _isValidPhone(phone: string): boolean {
        const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
        return phoneRegex.test(phone);
    }
}

// ============================================
// EXPORTS
// ============================================

const formService = new FormService();

export { FormService };
export default formService;

module.exports = formService;
module.exports.FormService = FormService;
