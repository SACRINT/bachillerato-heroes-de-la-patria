/**
 * 📧 EMAIL TEMPLATE SERVICE - SEMANA 12
 * Sistema de plantillas de email
 *
 * Features:
 * - Templates HTML responsive
 * - Variables dinámicas
 * - Preview
 * - Multi-idioma
 * - Tracking
 *
 * Fecha: 20 Noviembre 2025
 */

const devLogger = require('../utils/devLogger');

class EmailTemplateService {
  constructor() {
    this.templates = {
      welcome: {
        subject: 'Bienvenido a BGE Héroes de la Patria',
        template: this.getWelcomeTemplate()
      },
      passwordReset: {
        subject: 'Restablecer contraseña',
        template: this.getPasswordResetTemplate()
      },
      gradeNotification: {
        subject: 'Nuevas calificaciones registradas',
        template: this.getGradeNotificationTemplate()
      },
      attendanceAlert: {
        subject: 'Alerta de asistencia',
        template: this.getAttendanceAlertTemplate()
      },
      newsletter: {
        subject: 'Noticias de BGE',
        template: this.getNewsletterTemplate()
      }
    };
  }

  render(templateName, data = {}) {
    const template = this.templates[templateName];
    if (!template) {
      throw new Error(`Template "${templateName}" no encontrado`);
    }

    let html = template.template;
    let subject = template.subject;

    // Reemplazar variables
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value || '');
      subject = subject.replace(regex, value || '');
    });

    return { subject, html };
  }

  getBaseTemplate(content) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BGE Héroes de la Patria</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: #fff; }
          .header { background: #1a365d; color: #fff; padding: 20px; text-align: center; }
          .content { padding: 30px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background: #3182ce; color: #fff; text-decoration: none; border-radius: 4px; }
          .alert { padding: 15px; border-radius: 4px; margin: 15px 0; }
          .alert-info { background: #ebf8ff; border: 1px solid #90cdf4; }
          .alert-warning { background: #fffaf0; border: 1px solid #fbd38d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>BGE Héroes de la Patria</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>Bachillerato General Estatal "Héroes de la Patria"</p>
            <p>Este es un mensaje automático, por favor no responda a este correo.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getWelcomeTemplate() {
    return this.getBaseTemplate(`
      <h2>¡Bienvenido, {{nombre}}!</h2>
      <p>Tu cuenta ha sido creada exitosamente en el sistema del Bachillerato General Estatal "Héroes de la Patria".</p>
      <div class="alert alert-info">
        <strong>Tus datos de acceso:</strong><br>
        Email: {{email}}<br>
        Rol: {{rol}}
      </div>
      <p>Para acceder al sistema, haz clic en el siguiente botón:</p>
      <p style="text-align: center;">
        <a href="{{loginUrl}}" class="button">Iniciar Sesión</a>
      </p>
    `);
  }

  getPasswordResetTemplate() {
    return this.getBaseTemplate(`
      <h2>Restablecer Contraseña</h2>
      <p>Hola {{nombre}},</p>
      <p>Recibimos una solicitud para restablecer tu contraseña. Si no realizaste esta solicitud, ignora este correo.</p>
      <p style="text-align: center;">
        <a href="{{resetUrl}}" class="button">Restablecer Contraseña</a>
      </p>
      <div class="alert alert-warning">
        <strong>Nota:</strong> Este enlace expirará en 24 horas.
      </div>
    `);
  }

  getGradeNotificationTemplate() {
    return this.getBaseTemplate(`
      <h2>Nuevas Calificaciones</h2>
      <p>Hola {{nombre}},</p>
      <p>Se han registrado nuevas calificaciones para el estudiante {{estudiante}}:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <tr style="background: #f8f9fa;">
          <th style="padding: 10px; border: 1px solid #ddd;">Materia</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Parcial</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Calificación</th>
        </tr>
        {{calificaciones}}
      </table>
      <p style="text-align: center;">
        <a href="{{dashboardUrl}}" class="button">Ver Detalles</a>
      </p>
    `);
  }

  getAttendanceAlertTemplate() {
    return this.getBaseTemplate(`
      <h2>Alerta de Asistencia</h2>
      <p>Hola {{nombre}},</p>
      <div class="alert alert-warning">
        <strong>Atención:</strong> El estudiante {{estudiante}} tiene un porcentaje de asistencia del {{porcentaje}}%, por debajo del mínimo requerido.
      </div>
      <p>Te recomendamos contactar a la institución para más información.</p>
      <p style="text-align: center;">
        <a href="{{contactUrl}}" class="button">Contactar</a>
      </p>
    `);
  }

  getNewsletterTemplate() {
    return this.getBaseTemplate(`
      <h2>{{titulo}}</h2>
      {{contenido}}
      <p style="text-align: center; margin-top: 30px;">
        <a href="{{unsubscribeUrl}}" style="color: #666; font-size: 12px;">Cancelar suscripción</a>
      </p>
    `);
  }

  listTemplates() {
    return Object.keys(this.templates).map(name => ({
      name,
      subject: this.templates[name].subject
    }));
  }

  preview(templateName, data = {}) {
    return this.render(templateName, data);
  }
}

module.exports = new EmailTemplateService();
