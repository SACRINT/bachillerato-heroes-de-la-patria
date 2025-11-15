/**
 * Form Service - Capa de servicios para gestión de formularios
 * Maneja validación, envío y procesamiento de formularios
 * GDPR Compliant - Logging condicional
 */

const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
const db = require('../data/database-access');

class FormService {
  /**
   * Enviar un formulario
   * @param {string} formType - Tipo de formulario (Contacto, CV, Cita, etc)
   * @param {Object} formData - Datos del formulario
   * @param {number} userId - ID del usuario que envía (opcional)
   * @returns {Promise<Object>} Formulario enviado
   */
  async submitForm(formType, formData, userId = null) {
    debugLog.log('FORM', `Submitting ${formType} form`, { userId });

    try {
      // Validar datos del formulario
      this.validateFormData(formType, formData);

      // Crear registro en base de datos
      const submission = await db.createFormSubmission({
        form_type: formType,
        user_id: userId,
        form_data: formData,
        status: 'pending',
        created_at: new Date(),
        ip_address: formData._ipAddress || null, // Si se captura IP
        user_agent: formData._userAgent || null  // Si se captura user agent
      });

      debugLog.log('FORM', `Form ${formType} submitted successfully`, { submissionId: submission.id });

      return submission;
    } catch (error) {
      debugLog.error('FORM', `Error submitting ${formType} form`, sanitizeError(error, 'submitForm'));
      throw error;
    }
  }

  /**
   * Obtener formularios enviados
   * @param {Object} filters - Filtros (form_type, status, user_id, date_range)
   * @returns {Promise<Array>} Lista de formularios
   */
  async getSubmissions(filters = {}) {
    debugLog.log('FORM', 'Fetching form submissions', { filterCount: Object.keys(filters).length });

    try {
      const submissions = await db.getFormSubmissions(filters);
      debugLog.log('FORM', 'Form submissions fetched', { count: submissions.length });
      return submissions;
    } catch (error) {
      debugLog.error('FORM', 'Error fetching submissions', sanitizeError(error, 'getSubmissions'));
      throw error;
    }
  }

  /**
   * Obtener detalles de un formulario específico
   * @param {number} submissionId - ID del formulario
   * @returns {Promise<Object>} Detalles del formulario
   */
  async getSubmissionById(submissionId) {
    debugLog.log('FORM', 'Fetching submission details', { submissionId });

    try {
      const submission = await db.getFormSubmissionById(submissionId);

      if (!submission) {
        throw new Error('Formulario no encontrado');
      }

      return submission;
    } catch (error) {
      debugLog.error('FORM', 'Error fetching submission', sanitizeError(error, 'getSubmissionById'));
      throw error;
    }
  }

  /**
   * Validar datos de formulario según tipo
   * @param {string} formType - Tipo de formulario
   * @param {Object} data - Datos a validar
   * @throws {Error} Si la validación falla
   */
  validateFormData(formType, data) {
    debugLog.log('FORM', `Validating ${formType} form data`);

    // Validaciones comunes
    if (!data || typeof data !== 'object') {
      throw new Error('Datos de formulario inválidos');
    }

    // Validaciones específicas por tipo
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
        // Validación genérica mínima
        this._validateGenericForm(data);
    }

    debugLog.log('FORM', `${formType} form validation passed`);
  }

  /**
   * Validar formulario de contacto
   * @private
   */
  _validateContactForm(data) {
    const requiredFields = ['name', 'email', 'message'];
    this._checkRequiredFields(data, requiredFields);

    if (!this._isValidEmail(data.email)) {
      throw new Error('Email inválido');
    }

    if (data.message.length < 20) {
      throw new Error('El mensaje debe tener al menos 20 caracteres');
    }
  }

  /**
   * Validar formulario de CV
   * @private
   */
  _validateCVForm(data) {
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

  /**
   * Validar formulario de cita
   * @private
   */
  _validateAppointmentForm(data) {
    const requiredFields = ['name', 'email', 'date', 'reason'];
    this._checkRequiredFields(data, requiredFields);

    if (!this._isValidEmail(data.email)) {
      throw new Error('Email inválido');
    }

    // Validar que la fecha sea futura
    const appointmentDate = new Date(data.date);
    if (appointmentDate <= new Date()) {
      throw new Error('La fecha de la cita debe ser futura');
    }

    if (data.reason.length < 10) {
      throw new Error('La razón de la cita debe tener al menos 10 caracteres');
    }
  }

  /**
   * Validar formulario de egresado
   * @private
   */
  _validateEgresadoForm(data) {
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

  /**
   * Validar formulario de soporte
   * @private
   */
  _validateSupportForm(data) {
    const requiredFields = ['name', 'email', 'subject', 'description'];
    this._checkRequiredFields(data, requiredFields);

    if (!this._isValidEmail(data.email)) {
      throw new Error('Email inválido');
    }

    if (data.description.length < 30) {
      throw new Error('La descripción debe tener al menos 30 caracteres');
    }
  }

  /**
   * Validación genérica para formularios no específicos
   * @private
   */
  _validateGenericForm(data) {
    if (!data.email || !this._isValidEmail(data.email)) {
      throw new Error('Email requerido y válido');
    }
  }

  /**
   * Verificar campos requeridos
   * @private
   */
  _checkRequiredFields(data, requiredFields) {
    const missingFields = requiredFields.filter(field => !data[field] || data[field].toString().trim() === '');

    if (missingFields.length > 0) {
      throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Validar formato de email
   * @private
   */
  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validar formato de teléfono
   * @private
   */
  _isValidPhone(phone) {
    // Acepta formatos: 1234567890, +52 123 456 7890, (123) 456-7890, etc
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }
}

module.exports = new FormService();
