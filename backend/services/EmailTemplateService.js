/**
 * 📧 EMAIL TEMPLATE SERVICE - v1.0.0
 * Servicio de plantillas de email para BGE
 *
 * v5.1.0 Features
 * Fecha: 19 Noviembre 2025
 *
 * Features:
 * - Templates HTML responsivos
 * - Soporte multi-idioma
 * - Variables dinámicas
 * - Preview antes de enviar
 * - Historial de envíos
 */

const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger');
const nodemailer = require('nodemailer');

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

// Plantillas predefinidas
const EMAIL_TEMPLATES = {
  // Bienvenida
  WELCOME: {
    subject: {
      es: '¡Bienvenido a {{schoolName}}!',
      en: 'Welcome to {{schoolName}}!'
    },
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">¡Bienvenido!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Hola <strong>{{userName}}</strong>,</p>
          <p>Tu cuenta en {{schoolName}} ha sido creada exitosamente.</p>
          <p><strong>Credenciales de acceso:</strong></p>
          <ul>
            <li>Usuario: {{userEmail}}</li>
            <li>Rol: {{userRole}}</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{loginUrl}}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
              Iniciar Sesión
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">
            Si no solicitaste esta cuenta, ignora este correo.
          </p>
        </div>
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          © {{year}} {{schoolName}}. Todos los derechos reservados.
        </div>
      </div>
    `
  },

  // Alerta de calificación
  GRADE_ALERT: {
    subject: {
      es: 'Nueva calificación registrada - {{studentName}}',
      en: 'New grade recorded - {{studentName}}'
    },
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #28a745; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">📊 Calificación Registrada</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Estimado padre/tutor,</p>
          <p>Se ha registrado una nueva calificación para <strong>{{studentName}}</strong>:</p>
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #28a745;">
            <table style="width: 100%;">
              <tr>
                <td><strong>Materia:</strong></td>
                <td>{{subject}}</td>
              </tr>
              <tr>
                <td><strong>Calificación:</strong></td>
                <td style="font-size: 24px; color: {{gradeColor}};">{{grade}}</td>
              </tr>
              <tr>
                <td><strong>Periodo:</strong></td>
                <td>{{period}}</td>
              </tr>
              <tr>
                <td><strong>Promedio actual:</strong></td>
                <td>{{average}}</td>
              </tr>
            </table>
          </div>
          <div style="text-align: center;">
            <a href="{{dashboardUrl}}" style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
              Ver Historial Completo
            </a>
          </div>
        </div>
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          © {{year}} {{schoolName}}
        </div>
      </div>
    `
  },

  // Recordatorio de cita
  APPOINTMENT_REMINDER: {
    subject: {
      es: 'Recordatorio: Cita programada para mañana',
      en: 'Reminder: Appointment scheduled for tomorrow'
    },
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #17a2b8; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">📅 Recordatorio de Cita</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Estimado/a <strong>{{userName}}</strong>,</p>
          <p>Le recordamos que tiene una cita programada:</p>
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p><strong>📆 Fecha:</strong> {{appointmentDate}}</p>
            <p><strong>🕐 Hora:</strong> {{appointmentTime}}</p>
            <p><strong>📝 Motivo:</strong> {{appointmentReason}}</p>
            <p><strong>📍 Lugar:</strong> {{location}}</p>
          </div>
          <p style="color: #666;">
            Si necesita cancelar o reprogramar, por favor hágalo con al menos 24 horas de anticipación.
          </p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="{{cancelUrl}}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">
              Cancelar
            </a>
            <a href="{{rescheduleUrl}}" style="background: #17a2b8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Reprogramar
            </a>
          </div>
        </div>
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          © {{year}} {{schoolName}}
        </div>
      </div>
    `
  },

  // Recuperación de contraseña
  PASSWORD_RESET: {
    subject: {
      es: 'Restablece tu contraseña',
      en: 'Reset your password'
    },
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ffc107; padding: 20px; text-align: center;">
          <h1 style="color: #333; margin: 0;">🔐 Restablecer Contraseña</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Hola <strong>{{userName}}</strong>,</p>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{resetUrl}}" style="background: #ffc107; color: #333; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Restablecer Contraseña
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">
            Este enlace expirará en {{expirationTime}}.
          </p>
          <p style="color: #666; font-size: 12px;">
            Si no solicitaste este cambio, ignora este correo. Tu contraseña permanecerá sin cambios.
          </p>
        </div>
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          © {{year}} {{schoolName}}
        </div>
      </div>
    `
  },

  // Notificación de asistencia
  ATTENDANCE_ALERT: {
    subject: {
      es: 'Alerta de asistencia - {{studentName}}',
      en: 'Attendance alert - {{studentName}}'
    },
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc3545; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">⚠️ Alerta de Asistencia</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Estimado padre/tutor,</p>
          <p>Le informamos sobre la asistencia de <strong>{{studentName}}</strong>:</p>
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <p><strong>Faltas este mes:</strong> {{absences}}</p>
            <p><strong>Porcentaje de asistencia:</strong> {{attendancePercent}}%</p>
            <p><strong>Última falta:</strong> {{lastAbsence}}</p>
          </div>
          <p>
            La asistencia regular es fundamental para el éxito académico.
            Por favor comuníquese con nosotros si hay alguna situación especial.
          </p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="{{contactUrl}}" style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
              Contactar Escuela
            </a>
          </div>
        </div>
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          © {{year}} {{schoolName}}
        </div>
      </div>
    `
  },

  // Boletín informativo
  NEWSLETTER: {
    subject: {
      es: '📰 Boletín {{schoolName}} - {{month}} {{year}}',
      en: '📰 {{schoolName}} Newsletter - {{month}} {{year}}'
    },
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">📰 Boletín Informativo</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0;">{{month}} {{year}}</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          {{content}}
        </div>
        <div style="padding: 20px; background: #eee; text-align: center;">
          <p style="margin: 0 0 10px;">Síguenos en redes sociales</p>
          <a href="{{facebookUrl}}" style="margin: 0 5px;">Facebook</a>
          <a href="{{twitterUrl}}" style="margin: 0 5px;">Twitter</a>
          <a href="{{instagramUrl}}" style="margin: 0 5px;">Instagram</a>
        </div>
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>© {{year}} {{schoolName}}</p>
          <p><a href="{{unsubscribeUrl}}" style="color: #999;">Cancelar suscripción</a></p>
        </div>
      </div>
    `
  },

  // Confirmación de email
  EMAIL_VERIFICATION: {
    subject: {
      es: 'Confirma tu correo electrónico',
      en: 'Verify your email address'
    },
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #28a745; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">✉️ Confirma tu Email</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Hola <strong>{{userName}}</strong>,</p>
          <p>Gracias por registrarte. Por favor confirma tu correo electrónico haciendo clic en el siguiente botón:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{verificationUrl}}" style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
              Confirmar Email
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">
            Este enlace expirará en 24 horas.
          </p>
        </div>
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          © {{year}} {{schoolName}}
        </div>
      </div>
    `
  }
};

class EmailTemplateService {
  constructor() {
    this.transporter = null;
    this.defaultFrom = process.env.SMTP_FROM || 'noreply@bge.edu.mx';
    this.schoolName = process.env.SCHOOL_NAME || 'BGE Héroes de la Patria';
    this.baseUrl = process.env.APP_URL || 'https://bachillerato-heroes.vercel.app';
  }

  /**
   * Inicializar transporter de email
   */
  async initialize() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    devLogger.log('[EmailTemplate] Servicio inicializado');
  }

  /**
   * Enviar email usando template
   * @param {Object} options - Opciones de envío
   * @returns {Promise<Object>} Resultado del envío
   */
  async send(options) {
    const {
      to,
      template,
      variables = {},
      language = 'es',
      attachments = [],
      cc = null,
      bcc = null
    } = options;

    // Obtener template
    const templateData = EMAIL_TEMPLATES[template];
    if (!templateData) {
      throw new ServiceError(`Template no encontrado: ${template}`, 400);
    }

    // Compilar template
    const subject = this._compileTemplate(
      templateData.subject[language] || templateData.subject.es,
      { ...variables, schoolName: this.schoolName, year: new Date().getFullYear() }
    );

    const html = this._compileTemplate(
      templateData.body,
      {
        ...variables,
        schoolName: this.schoolName,
        year: new Date().getFullYear(),
        baseUrl: this.baseUrl
      }
    );

    // Enviar email
    try {
      const info = await this.transporter.sendMail({
        from: this.defaultFrom,
        to,
        cc,
        bcc,
        subject,
        html,
        attachments
      });

      // Registrar envío
      await this._logEmail({
        to,
        template,
        subject,
        status: 'sent',
        messageId: info.messageId
      });

      devLogger.log(`[EmailTemplate] Email enviado: ${template} a ${to}`);

      return {
        success: true,
        messageId: info.messageId,
        to,
        template
      };
    } catch (error) {
      await this._logEmail({
        to,
        template,
        subject,
        status: 'failed',
        error: error.message
      });

      throw new ServiceError(`Error al enviar email: ${error.message}`, 500);
    }
  }

  /**
   * Enviar email masivo
   * @param {Array} recipients - Lista de destinatarios
   * @param {string} template - Nombre del template
   * @param {Object} commonVariables - Variables comunes
   */
  async sendBulk(recipients, template, commonVariables = {}) {
    const results = {
      sent: [],
      failed: [],
      total: recipients.length
    };

    for (const recipient of recipients) {
      try {
        const result = await this.send({
          to: recipient.email,
          template,
          variables: { ...commonVariables, ...recipient.variables },
          language: recipient.language || 'es'
        });
        results.sent.push({ email: recipient.email, messageId: result.messageId });
      } catch (error) {
        results.failed.push({ email: recipient.email, error: error.message });
      }

      // Delay para evitar rate limiting
      await this._delay(200);
    }

    devLogger.log(`[EmailTemplate] Bulk completado: ${results.sent.length}/${results.total}`);

    return results;
  }

  /**
   * Previsualizar template
   * @param {string} template - Nombre del template
   * @param {Object} variables - Variables de prueba
   * @param {string} language - Idioma
   */
  preview(template, variables = {}, language = 'es') {
    const templateData = EMAIL_TEMPLATES[template];
    if (!templateData) {
      throw new ServiceError(`Template no encontrado: ${template}`, 400);
    }

    const testVariables = {
      userName: 'Usuario de Prueba',
      userEmail: 'usuario@test.com',
      userRole: 'Estudiante',
      studentName: 'Juan Pérez',
      subject: 'Matemáticas',
      grade: '9.5',
      gradeColor: '#28a745',
      period: 'Primer Parcial',
      average: '8.7',
      appointmentDate: '15 de Diciembre de 2025',
      appointmentTime: '10:00 AM',
      appointmentReason: 'Reunión de seguimiento',
      location: 'Oficina de Dirección',
      absences: '3',
      attendancePercent: '85',
      lastAbsence: '10 de Noviembre de 2025',
      expirationTime: '24 horas',
      month: 'Noviembre',
      content: '<p>Contenido del boletín...</p>',
      loginUrl: `${this.baseUrl}/login`,
      dashboardUrl: `${this.baseUrl}/dashboard`,
      resetUrl: `${this.baseUrl}/reset-password?token=xxx`,
      verificationUrl: `${this.baseUrl}/verify?token=xxx`,
      cancelUrl: `${this.baseUrl}/appointments/cancel`,
      rescheduleUrl: `${this.baseUrl}/appointments/reschedule`,
      contactUrl: `${this.baseUrl}/contact`,
      unsubscribeUrl: `${this.baseUrl}/unsubscribe`,
      facebookUrl: '#',
      twitterUrl: '#',
      instagramUrl: '#',
      schoolName: this.schoolName,
      year: new Date().getFullYear(),
      ...variables
    };

    const subject = this._compileTemplate(
      templateData.subject[language] || templateData.subject.es,
      testVariables
    );

    const html = this._compileTemplate(templateData.body, testVariables);

    return { subject, html };
  }

  /**
   * Obtener lista de templates disponibles
   */
  getAvailableTemplates() {
    return Object.keys(EMAIL_TEMPLATES).map(key => ({
      id: key,
      name: key.replace(/_/g, ' ').toLowerCase(),
      subjects: EMAIL_TEMPLATES[key].subject
    }));
  }

  /**
   * Obtener historial de envíos
   * @param {Object} options - Filtros
   */
  async getHistory(options = {}) {
    const { page = 1, limit = 50, template, status, startDate, endDate } = options;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM email_log WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (template) {
      query += ` AND template = $${paramIndex++}`;
      params.push(template);
    }

    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (startDate) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(endDate);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return {
      data: result.rows,
      pagination: { page, limit }
    };
  }

  /**
   * Obtener estadísticas de envíos
   */
  async getStats(days = 30) {
    const query = `
      SELECT
        template,
        status,
        COUNT(*) as count
      FROM email_log
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY template, status
      ORDER BY count DESC
    `;

    const result = await pool.query(query);

    const byTemplate = {};
    const byStatus = { sent: 0, failed: 0 };

    result.rows.forEach(row => {
      if (!byTemplate[row.template]) {
        byTemplate[row.template] = { sent: 0, failed: 0 };
      }
      byTemplate[row.template][row.status] += parseInt(row.count);
      byStatus[row.status] += parseInt(row.count);
    });

    return {
      period: `${days} días`,
      total: Object.values(byStatus).reduce((a, b) => a + b, 0),
      byTemplate,
      byStatus
    };
  }

  // ==================== MÉTODOS PRIVADOS ====================

  _compileTemplate(template, variables) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }

  async _logEmail(data) {
    try {
      await pool.query(`
        INSERT INTO email_log (recipient, template, subject, status, message_id, error, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [data.to, data.template, data.subject, data.status, data.messageId, data.error]);
    } catch (error) {
      devLogger.warn('[EmailTemplate] Error al registrar email:', error.message);
    }
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new EmailTemplateService();
module.exports.ServiceError = ServiceError;
module.exports.EMAIL_TEMPLATES = EMAIL_TEMPLATES;
