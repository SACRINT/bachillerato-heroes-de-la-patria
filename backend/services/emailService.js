/**
 * 📧 EMAIL SERVICE - Sistema de Envío de Emails con Plantillas Handlebars
 * Gestión centralizada de emails transaccionales y newsletters
 * Fecha: 18 de Octubre, 2025
 */

const nodemailer = require('nodemailer');
const devLogger = require('../utils/devLogger');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

// GDPR Logging - Debug condicional y sanitización
const { sanitizeError, maskEmail, maskToken } = require('../utils/sanitized-errors');


class EmailService {
    /**
     * Constructor con soporte para inyección de dependencias (testing)
     * @param {Object} options - Opciones de configuración
     * @param {Object} options.nodemailerModule - Módulo nodemailer (para testing)
     * @param {Object} options.fsModule - Módulo fs.promises (para testing)
     * @param {Object} options.handlebarsModule - Módulo handlebars (para testing)
     */
    constructor(options = {}) {
        // Dependencias inyectables (para testing)
        this._nodemailer = options.nodemailerModule || nodemailer;
        this._fs = options.fsModule || fs;
        this._handlebars = options.handlebarsModule || handlebars;

        this.transporter = null;
        this.templatesCache = {};
        this.from = process.env.EMAIL_FROM || 'noreply@bachilleratoheroesdelapatria.edu.mx';
        this.initialized = false;
    }

    /**
     * Factory method para crear instancia testeable con mocks inyectados
     * @param {Object} mocks - Mocks de dependencias
     * @returns {EmailService} Nueva instancia con mocks
     */
    static createTestInstance(mocks = {}) {
        return new EmailService(mocks);
    }

    /**
     * Inicializar servicio de email
     */
    async init() {
        if (this.initialized) {
            return;
        }

        try {
            // Configurar transporter
            // Prioridad 1: SMTP Configurado explícitamente (Producción o Dev con SMTP real)
            if (process.env.SMTP_HOST && process.env.SMTP_USER) {
                this.transporter = this._nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: parseInt(process.env.SMTP_PORT || '587'),
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                });
                devLogger.log(`📧 Email Service usando SMTP Real: ${process.env.SMTP_HOST}`);
            }
            // Prioridad 2: Fallback a Ethereal (solo si no hay SMTP)
            else {
                const testAccount = await this._nodemailer.createTestAccount();
                this.transporter = this._nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass
                    }
                });
                devLogger.log('📧 Email Service en modo desarrollo (Ethereal Email)');
                devLogger.log(`👤 Usuario: ${testAccount.user}`);
            }

            // Verificar conexión
            await this.transporter.verify();
            this.initialized = true;
            devLogger.log('✅ Email Service inicializado correctamente');

            // Registrar helpers de Handlebars
            this.registerHandlebarsHelpers();

        } catch (error) {
            devLogger.error('❌ Error al inicializar Email Service:', error);
            throw error;
        }
    }

    /**
     * Registrar helpers personalizados de Handlebars
     */
    registerHandlebarsHelpers() {
        // Helper para formatear fechas
        this._handlebars.registerHelper('formatDate', function (date) {
            if (!date) return '';
            const d = new Date(date);
            return d.toLocaleDateString('es-MX', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        });

        // Helper para formatear fecha y hora
        this._handlebars.registerHelper('formatDateTime', function (date) {
            if (!date) return '';
            const d = new Date(date);
            return d.toLocaleString('es-MX', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        });

        // Helper condicional
        this._handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
            return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
        });

        // Helper para URLs absolutas
        this._handlebars.registerHelper('absoluteUrl', function (path) {
            const baseUrl = process.env.APP_URL || 'http://localhost:3000';
            return `${baseUrl}${path}`;
        });

        devLogger.log('✅ Handlebars helpers registrados');
    }

    /**
     * Cargar y compilar plantilla de email
     */
    async loadTemplate(templateName) {
        // Verificar caché
        if (this.templatesCache[templateName]) {
            return this.templatesCache[templateName];
        }

        try {
            const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.hbs`);
            const templateContent = await this._fs.readFile(templatePath, 'utf-8');
            const compiledTemplate = this._handlebars.compile(templateContent);

            // Guardar en caché
            this.templatesCache[templateName] = compiledTemplate;

            return compiledTemplate;
        } catch (error) {
            devLogger.error(`❌ Error al cargar plantilla ${templateName}:`, error);
            throw new Error(`No se pudo cargar la plantilla de email: ${templateName}`);
        }
    }

    /**
     * Enviar email con plantilla
     */
    async sendEmail({ to, subject, template, data, attachments = [] }) {
        if (!this.initialized) {
            await this.init();
        }

        try {
            // Cargar y compilar plantilla
            const compiledTemplate = await this.loadTemplate(template);
            const html = compiledTemplate(data);

            // Preparar opciones de email
            const mailOptions = {
                from: this.from,
                to: to,
                subject: subject,
                html: html,
                attachments: attachments
            };

            // Enviar email
            const info = await this.transporter.sendMail(mailOptions);

            devLogger.log(`✅ Email enviado a ${to}: ${info.messageId}`);

            // En desarrollo, mostrar URL de previsualización
            if (process.env.NODE_ENV !== 'production') {
                devLogger.log(`🔗 Vista previa: ${this._nodemailer.getTestMessageUrl(info)}`);
            }

            return {
                success: true,
                messageId: info.messageId,
                previewUrl: this._nodemailer.getTestMessageUrl(info)
            };

        } catch (error) {
            devLogger.error(`❌ Error al enviar email a ${to}:`, error);
            throw error;
        }
    }

    /**
     * Enviar email de bienvenida
     */
    async sendWelcomeEmail(user) {
        return await this.sendEmail({
            to: user.email,
            subject: '¡Bienvenido al Bachillerato Héroes de la Patria!',
            template: 'welcome',
            data: {
                nombre: user.nombre,
                email: user.email,
                loginUrl: process.env.APP_URL || 'http://localhost:3000'
            }
        });
    }

    /**
     * Enviar notificación de evento
     */
    async sendEventNotification(user, event) {
        return await this.sendEmail({
            to: user.email,
            subject: `Nuevo Evento: ${event.titulo}`,
            template: 'event-notification',
            data: {
                nombre: user.nombre,
                evento: {
                    titulo: event.titulo,
                    descripcion: event.descripcion,
                    fecha_inicio: event.fecha_inicio,
                    fecha_fin: event.fecha_fin,
                    ubicacion: event.ubicacion,
                    modalidad: event.modalidad,
                    slug: event.slug
                }
            }
        });
    }

    /**
     * Enviar newsletter
     */
    async sendNewsletter(user, newsletter) {
        return await this.sendEmail({
            to: user.email,
            subject: newsletter.asunto,
            template: 'newsletter',
            data: {
                nombre: user.nombre,
                titulo: newsletter.titulo,
                contenido: newsletter.contenido,
                noticias: newsletter.noticias || [],
                eventos: newsletter.eventos || [],
                unsubscribeUrl: `${process.env.APP_URL}/unsubscribe/${user.id}`
            }
        });
    }

    /**
     * Enviar email de recuperación de contraseña
     */
    async sendPasswordRecovery(user, resetToken) {
        const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        return await this.sendEmail({
            to: user.email,
            subject: 'Recuperación de Contraseña - BGE Héroes de la Patria',
            template: 'password-recovery',
            data: {
                nombre: user.nombre,
                resetUrl: resetUrl,
                expiresIn: '1 hora'
            }
        });
    }

    /**
     * Enviar confirmación de inscripción
     */
    async sendInscriptionConfirmation(user, activity) {
        return await this.sendEmail({
            to: user.email,
            subject: `Confirmación de Inscripción: ${activity.nombre}`,
            template: 'inscription-confirmation',
            data: {
                nombre: user.nombre,
                actividad: {
                    nombre: activity.nombre,
                    descripcion: activity.descripcion,
                    fecha: activity.fecha,
                    ubicacion: activity.ubicacion,
                    instrucciones: activity.instrucciones
                }
            }
        });
    }

    /**
     * Enviar email de notificación de noticia
     */
    async sendNewsNotification(user, noticia) {
        return await this.sendEmail({
            to: user.email,
            subject: `Nueva Noticia: ${noticia.titulo}`,
            template: 'news-notification',
            data: {
                nombre: user.nombre,
                noticia: {
                    titulo: noticia.titulo,
                    resumen: noticia.resumen,
                    imagen_url: noticia.imagen_url,
                    slug: noticia.slug,
                    fecha_publicacion: noticia.fecha_publicacion
                }
            }
        });
    }

    /**
     * Enviar emails en lote (con rate limiting)
     */
    async sendBulkEmails(emails, delayMs = 100) {
        const results = [];

        for (const emailConfig of emails) {
            try {
                const result = await this.sendEmail(emailConfig);
                results.push({ success: true, to: emailConfig.to, result });
            } catch (error) {
                results.push({ success: false, to: emailConfig.to, error: error.message });
            }

            // Delay entre envíos para evitar rate limiting
            if (delayMs > 0) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        devLogger.log(`📊 Envío en lote completado: ${successful} exitosos, ${failed} fallidos`);

        return {
            total: emails.length,
            successful,
            failed,
            results
        };
    }

    /**
     * Limpiar caché de plantillas
     */
    clearTemplateCache() {
        this.templatesCache = {};
        devLogger.log('🗑️ Caché de plantillas limpiado');
    }
}
// Crear instancia singleton para producción
const emailServiceInstance = new EmailService();

// Exportar instancia única (singleton) y clase para testing
module.exports = emailServiceInstance;
module.exports.EmailService = EmailService;
