declare const _exports: FormService;
export = _exports;
declare class FormService {
    /**
     * Enviar un formulario
     * @param {string} formType - Tipo de formulario (Contacto, CV, Cita, etc)
     * @param {Object} formData - Datos del formulario
     * @param {number} userId - ID del usuario que envía (opcional)
     * @returns {Promise<Object>} Formulario enviado
     */
    submitForm(formType: string, formData: any, userId?: number): Promise<any>;
    /**
     * Obtener formularios enviados
     * @param {Object} filters - Filtros (form_type, status, user_id, date_range)
     * @returns {Promise<Array>} Lista de formularios
     */
    getSubmissions(filters?: any): Promise<any[]>;
    /**
     * Obtener detalles de un formulario específico
     * @param {number} submissionId - ID del formulario
     * @returns {Promise<Object>} Detalles del formulario
     */
    getSubmissionById(submissionId: number): Promise<any>;
    /**
     * Validar datos de formulario según tipo
     * @param {string} formType - Tipo de formulario
     * @param {Object} data - Datos a validar
     * @throws {Error} Si la validación falla
     */
    validateFormData(formType: string, data: any): void;
    /**
     * Validar formulario de contacto
     * @private
     */
    private _validateContactForm;
    /**
     * Validar formulario de CV
     * @private
     */
    private _validateCVForm;
    /**
     * Validar formulario de cita
     * @private
     */
    private _validateAppointmentForm;
    /**
     * Validar formulario de egresado
     * @private
     */
    private _validateEgresadoForm;
    /**
     * Validar formulario de soporte
     * @private
     */
    private _validateSupportForm;
    /**
     * Validación genérica para formularios no específicos
     * @private
     */
    private _validateGenericForm;
    /**
     * Verificar campos requeridos
     * @private
     */
    private _checkRequiredFields;
    /**
     * Validar formato de email
     * @private
     */
    private _isValidEmail;
    /**
     * Validar formato de teléfono
     * @private
     */
    private _isValidPhone;
}
//# sourceMappingURL=FormService.d.ts.map