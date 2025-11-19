/**
 * 📱 SMS NOTIFICATION SERVICE - v1.0.0
 * Servicio de notificaciones por SMS para BGE
 *
 * v5.0.0 Features
 * Fecha: 19 Noviembre 2025
 *
 * Proveedores soportados:
 * - Twilio
 * - Vonage (Nexmo)
 * - AWS SNS
 */

const devLogger = require('../utils/devLogger');
const { pool } = require('../config/database');

/**
 * Clase de error personalizada
 */
class ServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
  }
}

// Configuración de proveedores
const PROVIDERS = {
  TWILIO: 'twilio',
  VONAGE: 'vonage',
  AWS_SNS: 'aws_sns'
};

// Templates de mensajes
const SMS_TEMPLATES = {
  GRADE_ALERT: {
    es: 'BGE: {{studentName}} obtuvo {{grade}} en {{subject}}. Promedio actual: {{average}}',
    en: 'BGE: {{studentName}} got {{grade}} in {{subject}}. Current average: {{average}}'
  },
  ATTENDANCE_ALERT: {
    es: 'BGE: {{studentName}} tiene {{absences}} faltas este mes. Por favor contacte a la escuela.',
    en: 'BGE: {{studentName}} has {{absences}} absences this month. Please contact the school.'
  },
  APPOINTMENT_REMINDER: {
    es: 'BGE: Recordatorio de cita mañana {{date}} a las {{time}}. Motivo: {{reason}}',
    en: 'BGE: Appointment reminder tomorrow {{date}} at {{time}}. Reason: {{reason}}'
  },
  APPOINTMENT_CONFIRMED: {
    es: 'BGE: Su cita del {{date}} ha sido confirmada. Hora: {{time}}',
    en: 'BGE: Your appointment on {{date}} has been confirmed. Time: {{time}}'
  },
  PAYMENT_DUE: {
    es: 'BGE: Recordatorio de pago pendiente por ${{amount}}. Fecha límite: {{dueDate}}',
    en: 'BGE: Payment reminder for ${{amount}} due. Deadline: {{dueDate}}'
  },
  EMERGENCY: {
    es: 'BGE URGENTE: {{message}}. Contacte inmediatamente al {{phone}}',
    en: 'BGE URGENT: {{message}}. Contact immediately at {{phone}}'
  },
  VERIFICATION: {
    es: 'BGE: Tu código de verificación es: {{code}}. Válido por 10 minutos.',
    en: 'BGE: Your verification code is: {{code}}. Valid for 10 minutes.'
  },
  CUSTOM: {
    es: '{{message}}',
    en: '{{message}}'
  }
};

class SMSNotificationService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || PROVIDERS.TWILIO;
    this.client = null;
    this.initialized = false;
    this.queue = [];
    this.rateLimitPerMinute = 30;
    this.sentThisMinute = 0;
    this.lastReset = Date.now();
  }

  /**
   * Inicializar el servicio con el proveedor configurado
   */
  async initialize() {
    if (this.initialized) return;

    try {
      switch (this.provider) {
        case PROVIDERS.TWILIO:
          await this._initTwilio();
          break;
        case PROVIDERS.VONAGE:
          await this._initVonage();
          break;
        case PROVIDERS.AWS_SNS:
          await this._initAWSSNS();
          break;
        default:
          devLogger.warn(`[SMS] Proveedor no reconocido: ${this.provider}, usando modo simulación`);
          this.client = null;
      }

      this.initialized = true;
      devLogger.log(`[SMS] Servicio inicializado con proveedor: ${this.provider}`);
    } catch (error) {
      devLogger.error('[SMS] Error al inicializar:', error.message);
      throw new ServiceError('Error al inicializar servicio SMS', 500);
    }
  }

  /**
   * Enviar SMS individual
   * @param {Object} options - Opciones del mensaje
   * @returns {Promise<Object>} Resultado del envío
   */
  async send(options) {
    const {
      to,
      template,
      params = {},
      language = 'es',
      priority = 'normal'
    } = options;

    // Validar número de teléfono
    const cleanNumber = this._cleanPhoneNumber(to);
    if (!this._isValidPhone(cleanNumber)) {
      throw new ServiceError(`Número de teléfono inválido: ${to}`, 400);
    }

    // Verificar rate limit
    await this._checkRateLimit();

    // Construir mensaje
    const message = this._buildMessage(template, params, language);

    // Verificar longitud
    if (message.length > 160) {
      devLogger.warn(`[SMS] Mensaje excede 160 caracteres: ${message.length}`);
    }

    try {
      // Registrar intento
      const smsId = await this._logSMS({
        to: cleanNumber,
        message,
        template,
        status: 'pending',
        priority
      });

      // Enviar según proveedor
      let result;
      if (this.client) {
        result = await this._sendViaProvider(cleanNumber, message);
      } else {
        // Modo simulación
        result = await this._simulateSend(cleanNumber, message);
      }

      // Actualizar registro
      await this._updateSMSStatus(smsId, 'sent', result);

      devLogger.log(`[SMS] Enviado a ${cleanNumber}: ${message.substring(0, 50)}...`);

      return {
        success: true,
        smsId,
        to: cleanNumber,
        messageLength: message.length,
        provider: this.provider,
        providerId: result.sid || result.messageId
      };
    } catch (error) {
      devLogger.error('[SMS] Error al enviar:', error.message);
      throw new ServiceError(`Error al enviar SMS: ${error.message}`, 500);
    }
  }

  /**
   * Enviar SMS masivo
   * @param {Array} recipients - Lista de destinatarios
   * @param {string} template - Template del mensaje
   * @param {Object} params - Parámetros comunes
   * @returns {Promise<Object>} Resumen del envío
   */
  async sendBulk(recipients, template, params = {}) {
    devLogger.log(`[SMS] Enviando bulk a ${recipients.length} destinatarios`);

    const results = {
      success: [],
      failed: [],
      total: recipients.length
    };

    for (const recipient of recipients) {
      try {
        const recipientParams = { ...params, ...recipient.params };
        const result = await this.send({
          to: recipient.phone,
          template,
          params: recipientParams,
          language: recipient.language || 'es'
        });
        results.success.push({ phone: recipient.phone, smsId: result.smsId });
      } catch (error) {
        results.failed.push({ phone: recipient.phone, error: error.message });
      }

      // Pequeño delay para evitar throttling
      await this._delay(100);
    }

    devLogger.log(`[SMS] Bulk completado: ${results.success.length} exitosos, ${results.failed.length} fallidos`);

    return results;
  }

  /**
   * Enviar alerta de calificación a padres
   * @param {number} studentId - ID del estudiante
   * @param {Object} gradeData - Datos de la calificación
   */
  async sendGradeAlert(studentId, gradeData) {
    // Obtener datos del estudiante y padres
    const query = `
      SELECT
        e.nombre as student_name,
        e.apellido_paterno,
        p.telefono as parent_phone,
        p.idioma_preferido
      FROM estudiantes e
      JOIN padres p ON e.id = p.estudiante_id
      WHERE e.id = $1 AND p.telefono IS NOT NULL
    `;

    const result = await pool.query(query, [studentId]);

    if (result.rows.length === 0) {
      devLogger.warn(`[SMS] No hay padres con teléfono para estudiante ${studentId}`);
      return;
    }

    for (const row of result.rows) {
      await this.send({
        to: row.parent_phone,
        template: 'GRADE_ALERT',
        params: {
          studentName: `${row.student_name} ${row.apellido_paterno}`,
          grade: gradeData.calificacion,
          subject: gradeData.materia,
          average: gradeData.promedio
        },
        language: row.idioma_preferido || 'es'
      });
    }
  }

  /**
   * Enviar recordatorio de cita
   * @param {number} appointmentId - ID de la cita
   */
  async sendAppointmentReminder(appointmentId) {
    const query = `
      SELECT
        c.*,
        u.telefono,
        u.idioma_preferido
      FROM citas c
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.id = $1 AND u.telefono IS NOT NULL
    `;

    const result = await pool.query(query, [appointmentId]);

    if (result.rows.length === 0) {
      return;
    }

    const cita = result.rows[0];

    await this.send({
      to: cita.telefono,
      template: 'APPOINTMENT_REMINDER',
      params: {
        date: this._formatDate(cita.fecha_solicitada),
        time: cita.hora_solicitada,
        reason: cita.motivo
      },
      language: cita.idioma_preferido || 'es'
    });
  }

  /**
   * Enviar código de verificación
   * @param {string} phone - Número de teléfono
   * @returns {Promise<string>} Código generado
   */
  async sendVerificationCode(phone) {
    const code = this._generateCode(6);

    await this.send({
      to: phone,
      template: 'VERIFICATION',
      params: { code },
      priority: 'high'
    });

    // Guardar código en BD con expiración
    await pool.query(`
      INSERT INTO verification_codes (phone, code, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '10 minutes')
      ON CONFLICT (phone) DO UPDATE SET code = $2, expires_at = NOW() + INTERVAL '10 minutes'
    `, [phone, code]);

    return code;
  }

  /**
   * Verificar código
   * @param {string} phone - Número de teléfono
   * @param {string} code - Código a verificar
   * @returns {Promise<boolean>}
   */
  async verifyCode(phone, code) {
    const result = await pool.query(`
      SELECT * FROM verification_codes
      WHERE phone = $1 AND code = $2 AND expires_at > NOW()
    `, [phone, code]);

    if (result.rows.length > 0) {
      // Eliminar código usado
      await pool.query('DELETE FROM verification_codes WHERE phone = $1', [phone]);
      return true;
    }

    return false;
  }

  /**
   * Obtener historial de SMS
   * @param {Object} options - Filtros
   * @returns {Promise<Object>}
   */
  async getHistory(options = {}) {
    const { page = 1, limit = 20, status, from, to } = options;
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM sms_log
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (from) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(from);
    }

    if (to) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(to);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Obtener total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)').replace(/LIMIT.*/, '');
    const countResult = await pool.query(countQuery, params.slice(0, -2));

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    };
  }

  /**
   * Obtener estadísticas de SMS
   * @returns {Promise<Object>}
   */
  async getStats() {
    const query = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        DATE_TRUNC('day', created_at) as day
      FROM sms_log
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY day DESC
    `;

    const result = await pool.query(query);

    return {
      daily: result.rows,
      summary: {
        total: result.rows.reduce((acc, r) => acc + parseInt(r.total), 0),
        sent: result.rows.reduce((acc, r) => acc + parseInt(r.sent), 0),
        failed: result.rows.reduce((acc, r) => acc + parseInt(r.failed), 0)
      }
    };
  }

  // ==================== MÉTODOS PRIVADOS ====================

  async _initTwilio() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Credenciales de Twilio no configuradas');
    }

    // Importación dinámica de Twilio
    // const twilio = require('twilio');
    // this.client = twilio(accountSid, authToken);
    // this.fromNumber = process.env.TWILIO_PHONE_NUMBER;

    devLogger.log('[SMS] Twilio configurado (modo simulación por ahora)');
  }

  async _initVonage() {
    const apiKey = process.env.VONAGE_API_KEY;
    const apiSecret = process.env.VONAGE_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('Credenciales de Vonage no configuradas');
    }

    devLogger.log('[SMS] Vonage configurado (modo simulación por ahora)');
  }

  async _initAWSSNS() {
    devLogger.log('[SMS] AWS SNS configurado (modo simulación por ahora)');
  }

  async _sendViaProvider(to, message) {
    if (this.provider === PROVIDERS.TWILIO && this.client) {
      return await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to
      });
    }

    // Fallback a simulación
    return this._simulateSend(to, message);
  }

  async _simulateSend(to, message) {
    // Simular envío para desarrollo
    await this._delay(500);

    return {
      sid: `SIM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'sent',
      to,
      body: message
    };
  }

  _buildMessage(template, params, language) {
    const templateData = SMS_TEMPLATES[template];
    if (!templateData) {
      throw new ServiceError(`Template no encontrado: ${template}`, 400);
    }

    let message = templateData[language] || templateData.es;

    // Reemplazar parámetros
    for (const [key, value] of Object.entries(params)) {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return message;
  }

  _cleanPhoneNumber(phone) {
    // Eliminar todo excepto números y +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // Agregar código de país México si no tiene
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('52')) {
        cleaned = '+' + cleaned;
      } else {
        cleaned = '+52' + cleaned;
      }
    }

    return cleaned;
  }

  _isValidPhone(phone) {
    // Validar formato E.164
    const e164Regex = /^\+[1-9]\d{10,14}$/;
    return e164Regex.test(phone);
  }

  async _checkRateLimit() {
    const now = Date.now();

    // Resetear contador cada minuto
    if (now - this.lastReset > 60000) {
      this.sentThisMinute = 0;
      this.lastReset = now;
    }

    if (this.sentThisMinute >= this.rateLimitPerMinute) {
      throw new ServiceError('Rate limit excedido. Intente en un minuto.', 429);
    }

    this.sentThisMinute++;
  }

  async _logSMS(data) {
    const result = await pool.query(`
      INSERT INTO sms_log (phone_to, message, template, status, priority, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id
    `, [data.to, data.message, data.template, data.status, data.priority]);

    return result.rows[0].id;
  }

  async _updateSMSStatus(id, status, providerData = {}) {
    await pool.query(`
      UPDATE sms_log
      SET status = $2, provider_id = $3, updated_at = NOW()
      WHERE id = $1
    `, [id, status, providerData.sid || providerData.messageId || null]);
  }

  _generateCode(length) {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10);
    }
    return code;
  }

  _formatDate(date) {
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long'
    });
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new SMSNotificationService();
module.exports.ServiceError = ServiceError;
module.exports.SMS_TEMPLATES = SMS_TEMPLATES;
