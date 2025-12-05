/**
 * 📱 SMS NOTIFICATION SERVICE - v2.0.0
 * Servicio de notificaciones por SMS para BGE
 *
 * Refactorizado: 04 Diciembre 2025
 * - Migrado a usar SMSNotificationDAO
 * - Sin SQL directo en el servicio
 */

const devLogger = require('../utils/devLogger');
const SMSNotificationDAO = require('../data/sms-notification.dao');

class ServiceError extends Error {
  constructor(message, statusCode = 500) { super(message); this.name = 'ServiceError'; this.statusCode = statusCode; }
}

const PROVIDERS = { TWILIO: 'twilio', VONAGE: 'vonage', AWS_SNS: 'aws_sns' };

const SMS_TEMPLATES = {
  GRADE_ALERT: { es: 'BGE: {{studentName}} obtuvo {{grade}} en {{subject}}. Promedio actual: {{average}}', en: 'BGE: {{studentName}} got {{grade}} in {{subject}}. Current average: {{average}}' },
  ATTENDANCE_ALERT: { es: 'BGE: {{studentName}} tiene {{absences}} faltas este mes. Por favor contacte a la escuela.', en: 'BGE: {{studentName}} has {{absences}} absences this month. Please contact the school.' },
  APPOINTMENT_REMINDER: { es: 'BGE: Recordatorio de cita mañana {{date}} a las {{time}}. Motivo: {{reason}}', en: 'BGE: Appointment reminder tomorrow {{date}} at {{time}}. Reason: {{reason}}' },
  APPOINTMENT_CONFIRMED: { es: 'BGE: Su cita del {{date}} ha sido confirmada. Hora: {{time}}', en: 'BGE: Your appointment on {{date}} has been confirmed. Time: {{time}}' },
  PAYMENT_DUE: { es: 'BGE: Recordatorio de pago pendiente por ${{amount}}. Fecha límite: {{dueDate}}', en: 'BGE: Payment reminder for ${{amount}} due. Deadline: {{dueDate}}' },
  EMERGENCY: { es: 'BGE URGENTE: {{message}}. Contacte inmediatamente al {{phone}}', en: 'BGE URGENT: {{message}}. Contact immediately at {{phone}}' },
  VERIFICATION: { es: 'BGE: Tu código de verificación es: {{code}}. Válido por 10 minutos.', en: 'BGE: Your verification code is: {{code}}. Valid for 10 minutes.' },
  CUSTOM: { es: '{{message}}', en: '{{message}}' }
};

class SMSNotificationService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || PROVIDERS.TWILIO;
    this.client = null;
    this.initialized = false;
    this.rateLimitPerMinute = 30;
    this.sentThisMinute = 0;
    this.lastReset = Date.now();
  }

  async initialize() {
    if (this.initialized) return;
    try {
      switch (this.provider) {
        case PROVIDERS.TWILIO: await this._initTwilio(); break;
        case PROVIDERS.VONAGE: await this._initVonage(); break;
        case PROVIDERS.AWS_SNS: await this._initAWSSNS(); break;
        default: devLogger.warn(`[SMS] Proveedor no reconocido: ${this.provider}, usando modo simulación`); this.client = null;
      }
      this.initialized = true;
      devLogger.log(`[SMS] Servicio inicializado con proveedor: ${this.provider}`);
    } catch (error) {
      devLogger.error('[SMS] Error al inicializar:', error.message);
      throw new ServiceError('Error al inicializar servicio SMS', 500);
    }
  }

  async send(options) {
    const { to, template, params = {}, language = 'es', priority = 'normal' } = options;
    const cleanNumber = this._cleanPhoneNumber(to);
    if (!this._isValidPhone(cleanNumber)) throw new ServiceError(`Número de teléfono inválido: ${to}`, 400);
    await this._checkRateLimit();
    const message = this._buildMessage(template, params, language);
    if (message.length > 160) devLogger.warn(`[SMS] Mensaje excede 160 caracteres: ${message.length}`);

    try {
      const smsId = await SMSNotificationDAO.logSMS({ to: cleanNumber, message, template, status: 'pending', priority });
      let result = this.client ? await this._sendViaProvider(cleanNumber, message) : await this._simulateSend(cleanNumber, message);
      await SMSNotificationDAO.updateSMSStatus(smsId, 'sent', result.sid || result.messageId || null);
      devLogger.log(`[SMS] Enviado a ${cleanNumber}: ${message.substring(0, 50)}...`);
      return { success: true, smsId, to: cleanNumber, messageLength: message.length, provider: this.provider, providerId: result.sid || result.messageId };
    } catch (error) {
      devLogger.error('[SMS] Error al enviar:', error.message);
      throw new ServiceError(`Error al enviar SMS: ${error.message}`, 500);
    }
  }

  async sendBulk(recipients, template, params = {}) {
    devLogger.log(`[SMS] Enviando bulk a ${recipients.length} destinatarios`);
    const results = { success: [], failed: [], total: recipients.length };
    for (const recipient of recipients) {
      try {
        const result = await this.send({ to: recipient.phone, template, params: { ...params, ...recipient.params }, language: recipient.language || 'es' });
        results.success.push({ phone: recipient.phone, smsId: result.smsId });
      } catch (error) { results.failed.push({ phone: recipient.phone, error: error.message }); }
      await this._delay(100);
    }
    devLogger.log(`[SMS] Bulk completado: ${results.success.length} exitosos, ${results.failed.length} fallidos`);
    return results;
  }

  async sendGradeAlert(studentId, gradeData) {
    const parents = await SMSNotificationDAO.getStudentParents(studentId);
    if (parents.length === 0) { devLogger.warn(`[SMS] No hay padres con teléfono para estudiante ${studentId}`); return; }
    for (const row of parents) {
      await this.send({ to: row.parent_phone, template: 'GRADE_ALERT', params: { studentName: `${row.student_name} ${row.apellido_paterno}`, grade: gradeData.calificacion, subject: gradeData.materia, average: gradeData.promedio }, language: row.idioma_preferido || 'es' });
    }
  }

  async sendAppointmentReminder(appointmentId) {
    const cita = await SMSNotificationDAO.getAppointment(appointmentId);
    if (!cita) return;
    await this.send({ to: cita.telefono, template: 'APPOINTMENT_REMINDER', params: { date: this._formatDate(cita.fecha_solicitada), time: cita.hora_solicitada, reason: cita.motivo }, language: cita.idioma_preferido || 'es' });
  }

  async sendVerificationCode(phone) {
    const code = this._generateCode(6);
    await this.send({ to: phone, template: 'VERIFICATION', params: { code }, priority: 'high' });
    await SMSNotificationDAO.saveVerificationCode(phone, code);
    return code;
  }

  async verifyCode(phone, code) {
    const valid = await SMSNotificationDAO.getValidCode(phone, code);
    if (valid) { await SMSNotificationDAO.deleteCode(phone); return true; }
    return false;
  }

  async getHistory(options = {}) {
    const { page = 1, limit = 20, status, from, to } = options;
    const offset = (page - 1) * limit;
    let whereClause = '1=1'; const params = [];
    if (status) { params.push(status); whereClause += ` AND status = $${params.length}`; }
    if (from) { params.push(from); whereClause += ` AND created_at >= $${params.length}`; }
    if (to) { params.push(to); whereClause += ` AND created_at <= $${params.length}`; }

    const result = await SMSNotificationDAO.getHistory(whereClause, params, limit, offset);
    const total = await SMSNotificationDAO.getHistoryCount(whereClause, params.slice(0, -2));

    return { data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getStats() {
    const rows = await SMSNotificationDAO.getStats();
    return {
      daily: rows,
      summary: { total: rows.reduce((acc, r) => acc + parseInt(r.total), 0), sent: rows.reduce((acc, r) => acc + parseInt(r.sent), 0), failed: rows.reduce((acc, r) => acc + parseInt(r.failed), 0) }
    };
  }

  // ==================== MÉTODOS PRIVADOS ====================

  async _initTwilio() { devLogger.log('[SMS] Twilio configurado (modo simulación por ahora)'); }
  async _initVonage() { devLogger.log('[SMS] Vonage configurado (modo simulación por ahora)'); }
  async _initAWSSNS() { devLogger.log('[SMS] AWS SNS configurado (modo simulación por ahora)'); }

  async _sendViaProvider(to, message) { return this._simulateSend(to, message); }
  async _simulateSend(to, message) { await this._delay(500); return { sid: `SIM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, status: 'sent', to, body: message }; }

  _buildMessage(template, params, language) {
    const templateData = SMS_TEMPLATES[template];
    if (!templateData) throw new ServiceError(`Template no encontrado: ${template}`, 400);
    let message = templateData[language] || templateData.es;
    for (const [key, value] of Object.entries(params)) { message = message.replace(new RegExp(`{{${key}}}`, 'g'), value); }
    return message;
  }

  _cleanPhoneNumber(phone) {
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) { cleaned = cleaned.startsWith('52') ? '+' + cleaned : '+52' + cleaned; }
    return cleaned;
  }

  _isValidPhone(phone) { return /^\+[1-9]\d{10,14}$/.test(phone); }

  async _checkRateLimit() {
    const now = Date.now();
    if (now - this.lastReset > 60000) { this.sentThisMinute = 0; this.lastReset = now; }
    if (this.sentThisMinute >= this.rateLimitPerMinute) throw new ServiceError('Rate limit excedido. Intente en un minuto.', 429);
    this.sentThisMinute++;
  }

  _generateCode(length) { let code = ''; for (let i = 0; i < length; i++) code += Math.floor(Math.random() * 10); return code; }
  _formatDate(date) { return new Date(date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }); }
  _delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
}

module.exports = new SMSNotificationService();
module.exports.ServiceError = ServiceError;
module.exports.SMS_TEMPLATES = SMS_TEMPLATES;
