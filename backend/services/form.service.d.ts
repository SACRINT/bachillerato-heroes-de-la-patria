/**
 * 📝 FORM SERVICE - TypeScript Version
 * Gestión de formularios con validación
 * GDPR Compliant
 * Refactorizado: 07 Diciembre 2025
 */
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
    date_range?: {
        start: Date;
        end: Date;
    };
}
export type FormType = 'Contacto' | 'CV' | 'Bolsa de Trabajo' | 'Cita' | 'Agendamiento de Cita' | 'Egresado' | 'Soporte';
declare class FormService {
    submitForm(formType: string, formData: Record<string, any>, userId?: number | null): Promise<FormSubmission>;
    getSubmissions(filters?: FormFilters): Promise<FormSubmission[]>;
    getSubmissionById(submissionId: number): Promise<FormSubmission>;
    validateFormData(formType: string, data: Record<string, any>): void;
    private _validateContactForm;
    private _validateCVForm;
    private _validateAppointmentForm;
    private _validateEgresadoForm;
    private _validateSupportForm;
    private _validateGenericForm;
    private _checkRequiredFields;
    private _isValidEmail;
    private _isValidPhone;
}
declare const formService: FormService;
export { FormService };
export default formService;
//# sourceMappingURL=form.service.d.ts.map