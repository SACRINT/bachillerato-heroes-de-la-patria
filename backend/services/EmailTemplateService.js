/**
 * 📧 EMAIL TEMPLATE SERVICE - v2.0.0
 * Servicio de plantillas de email para BGE
 *
 * Refactorizado: 04 Diciembre 2025
 * - Migrado a usar EmailTemplateDAO
 * - Sin SQL directo en el servicio
 */

const EmailTemplateDAO = require('../data/email-template.dao');
const devLogger = require('../utils/devLogger');
const nodemailer = require('nodemailer');

class ServiceError extends Error {
  constructor(message, statusCode = 500) { super(message); this.name = 'ServiceError'; this.statusCode = statusCode; }
}

const EMAIL_TEMPLATES = {
  WELCOME: { subject: { es: '¡Bienvenido a {{schoolName}}!', en: 'Welcome to {{schoolName}}!' }, body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;"><h1 style="color: white; margin: 0;">¡Bienvenido!</h1></div><div style="padding: 30px; background: #f9f9f9;"><p>Hola <strong>{{userName}}</strong>,</p><p>Tu cuenta en {{schoolName}} ha sido creada exitosamente.</p><p><strong>Credenciales de acceso:</strong></p><ul><li>Usuario: {{userEmail}}</li><li>Rol: {{userRole}}</li></ul><div style="text-align: center; margin: 30px 0;"><a href="{{loginUrl}}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Iniciar Sesión</a></div></div><div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">© {{year}} {{schoolName}}</div></div>` },
  GRADE_ALERT: { subject: { es: 'Nueva calificación registrada - {{studentName}}', en: 'New grade recorded - {{studentName}}' }, body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: #28a745; padding: 20px; text-align: center;"><h1 style="color: white; margin: 0;">📊 Calificación Registrada</h1></div><div style="padding: 30px; background: #f9f9f9;"><p>Estimado padre/tutor,</p><p>Se ha registrado una nueva calificación para <strong>{{studentName}}</strong>:</p><div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #28a745;"><p><strong>Materia:</strong> {{subject}}</p><p><strong>Calificación:</strong> <span style="font-size: 24px; color: {{gradeColor}};">{{grade}}</span></p><p><strong>Promedio:</strong> {{average}}</p></div></div><div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">© {{year}} {{schoolName}}</div></div>` },
  APPOINTMENT_REMINDER: { subject: { es: 'Recordatorio: Cita programada para mañana', en: 'Reminder: Appointment scheduled for tomorrow' }, body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: #17a2b8; padding: 20px; text-align: center;"><h1 style="color: white; margin: 0;">📅 Recordatorio de Cita</h1></div><div style="padding: 30px; background: #f9f9f9;"><p>Estimado/a <strong>{{userName}}</strong>,</p><p>Le recordamos que tiene una cita programada:</p><div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;"><p><strong>📆 Fecha:</strong> {{appointmentDate}}</p><p><strong>🕐 Hora:</strong> {{appointmentTime}}</p><p><strong>📝 Motivo:</strong> {{appointmentReason}}</p></div></div><div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">© {{year}} {{schoolName}}</div></div>` },
  PASSWORD_RESET: { subject: { es: 'Restablece tu contraseña', en: 'Reset your password' }, body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: #ffc107; padding: 20px; text-align: center;"><h1 style="color: #333; margin: 0;">🔐 Restablecer Contraseña</h1></div><div style="padding: 30px; background: #f9f9f9;"><p>Hola <strong>{{userName}}</strong>,</p><p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p><div style="text-align: center; margin: 30px 0;"><a href="{{resetUrl}}" style="background: #ffc107; color: #333; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Restablecer Contraseña</a></div><p style="color: #666; font-size: 12px;">Este enlace expirará en {{expirationTime}}.</p></div><div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">© {{year}} {{schoolName}}</div></div>` },
  ATTENDANCE_ALERT: { subject: { es: 'Alerta de asistencia - {{studentName}}', en: 'Attendance alert - {{studentName}}' }, body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: #dc3545; padding: 20px; text-align: center;"><h1 style="color: white; margin: 0;">⚠️ Alerta de Asistencia</h1></div><div style="padding: 30px; background: #f9f9f9;"><p>Estimado padre/tutor,</p><p>Le informamos sobre la asistencia de <strong>{{studentName}}</strong>:</p><div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #dc3545;"><p><strong>Faltas este mes:</strong> {{absences}}</p><p><strong>Porcentaje de asistencia:</strong> {{attendancePercent}}%</p></div></div><div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">© {{year}} {{schoolName}}</div></div>` },
  NEWSLETTER: { subject: { es: '📰 Boletín {{schoolName}} - {{month}} {{year}}', en: '📰 {{schoolName}} Newsletter - {{month}} {{year}}' }, body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;"><h1 style="color: white; margin: 0;">📰 Boletín Informativo</h1></div><div style="padding: 30px; background: #f9f9f9;">{{content}}</div><div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">© {{year}} {{schoolName}}</div></div>` },
  EMAIL_VERIFICATION: { subject: { es: 'Confirma tu correo electrónico', en: 'Verify your email address' }, body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: #28a745; padding: 20px; text-align: center;"><h1 style="color: white; margin: 0;">✉️ Confirma tu Email</h1></div><div style="padding: 30px; background: #f9f9f9;"><p>Hola <strong>{{userName}}</strong>,</p><p>Gracias por registrarte. Por favor confirma tu correo electrónico:</p><div style="text-align: center; margin: 30px 0;"><a href="{{verificationUrl}}" style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Confirmar Email</a></div></div><div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">© {{year}} {{schoolName}}</div></div>` }
};

class EmailTemplateService {
  constructor() {
    this.transporter = null;
    this.defaultFrom = process.env.SMTP_FROM || 'noreply@bge.edu.mx';
    this.schoolName = process.env.SCHOOL_NAME || 'BGE Héroes de la Patria';
    this.baseUrl = process.env.APP_URL || 'https://bachillerato-heroes.vercel.app';
  }

  async initialize() {
    this.transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: process.env.SMTP_PORT || 587, secure: process.env.SMTP_SECURE === 'true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    devLogger.log('[EmailTemplate] Servicio inicializado');
  }

  async send(options) {
    const { to, template, variables = {}, language = 'es', attachments = [], cc = null, bcc = null } = options;
    const templateData = EMAIL_TEMPLATES[template];
    if (!templateData) throw new ServiceError(`Template no encontrado: ${template}`, 400);

    const subject = this._compileTemplate(templateData.subject[language] || templateData.subject.es, { ...variables, schoolName: this.schoolName, year: new Date().getFullYear() });
    const html = this._compileTemplate(templateData.body, { ...variables, schoolName: this.schoolName, year: new Date().getFullYear(), baseUrl: this.baseUrl });

    try {
      const info = await this.transporter.sendMail({ from: this.defaultFrom, to, cc, bcc, subject, html, attachments });
      await EmailTemplateDAO.logEmail({ to, template, subject, status: 'sent', messageId: info.messageId });
      devLogger.log(`[EmailTemplate] Email enviado: ${template} a ${to}`);
      return { success: true, messageId: info.messageId, to, template };
    } catch (error) {
      await EmailTemplateDAO.logEmail({ to, template, subject, status: 'failed', error: error.message });
      throw new ServiceError(`Error al enviar email: ${error.message}`, 500);
    }
  }

  async sendBulk(recipients, template, commonVariables = {}) {
    const results = { sent: [], failed: [], total: recipients.length };
    for (const recipient of recipients) {
      try {
        const result = await this.send({ to: recipient.email, template, variables: { ...commonVariables, ...recipient.variables }, language: recipient.language || 'es' });
        results.sent.push({ email: recipient.email, messageId: result.messageId });
      } catch (error) { results.failed.push({ email: recipient.email, error: error.message }); }
      await this._delay(200);
    }
    devLogger.log(`[EmailTemplate] Bulk completado: ${results.sent.length}/${results.total}`);
    return results;
  }

  preview(template, variables = {}, language = 'es') {
    const templateData = EMAIL_TEMPLATES[template];
    if (!templateData) throw new ServiceError(`Template no encontrado: ${template}`, 400);
    const testVariables = { userName: 'Usuario de Prueba', userEmail: 'usuario@test.com', userRole: 'Estudiante', studentName: 'Juan Pérez', subject: 'Matemáticas', grade: '9.5', gradeColor: '#28a745', period: 'Primer Parcial', average: '8.7', appointmentDate: '15 de Diciembre de 2025', appointmentTime: '10:00 AM', appointmentReason: 'Reunión', absences: '3', attendancePercent: '85', expirationTime: '24 horas', month: 'Noviembre', content: '<p>Contenido del boletín...</p>', loginUrl: `${this.baseUrl}/login`, dashboardUrl: `${this.baseUrl}/dashboard`, resetUrl: `${this.baseUrl}/reset-password?token=xxx`, verificationUrl: `${this.baseUrl}/verify?token=xxx`, schoolName: this.schoolName, year: new Date().getFullYear(), ...variables };
    return { subject: this._compileTemplate(templateData.subject[language] || templateData.subject.es, testVariables), html: this._compileTemplate(templateData.body, testVariables) };
  }

  getAvailableTemplates() { return Object.keys(EMAIL_TEMPLATES).map(key => ({ id: key, name: key.replace(/_/g, ' ').toLowerCase(), subjects: EMAIL_TEMPLATES[key].subject })); }

  async getHistory(options = {}) {
    const { page = 1, limit = 50, template, status, startDate, endDate } = options;
    const offset = (page - 1) * limit;
    let whereClause = '1=1'; const params = [];
    if (template) { params.push(template); whereClause += ` AND template = $${params.length}`; }
    if (status) { params.push(status); whereClause += ` AND status = $${params.length}`; }
    if (startDate) { params.push(startDate); whereClause += ` AND created_at >= $${params.length}`; }
    if (endDate) { params.push(endDate); whereClause += ` AND created_at <= $${params.length}`; }
    const data = await EmailTemplateDAO.getHistory(whereClause, params, limit, offset);
    return { data, pagination: { page, limit } };
  }

  async getStats(days = 30) {
    const rows = await EmailTemplateDAO.getStats(days);
    const byTemplate = {}, byStatus = { sent: 0, failed: 0 };
    rows.forEach(row => { if (!byTemplate[row.template]) byTemplate[row.template] = { sent: 0, failed: 0 }; byTemplate[row.template][row.status] += parseInt(row.count); byStatus[row.status] += parseInt(row.count); });
    return { period: `${days} días`, total: Object.values(byStatus).reduce((a, b) => a + b, 0), byTemplate, byStatus };
  }

  _compileTemplate(template, variables) { return template.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] !== undefined ? variables[key] : match); }
  _delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
}

module.exports = new EmailTemplateService();
module.exports.ServiceError = ServiceError;
module.exports.EMAIL_TEMPLATES = EMAIL_TEMPLATES;
