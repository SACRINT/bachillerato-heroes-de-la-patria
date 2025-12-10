declare const _exports: SubscriptionEmailService;
export = _exports;
declare class SubscriptionEmailService {
    transporter: nodemailer.Transporter<import("nodemailer/lib/smtp-transport").SentMessageInfo, import("nodemailer/lib/smtp-transport").Options>;
    baseUrl: string;
    /**
     * Crear transporter de Nodemailer con Gmail
     */
    createTransporter(): nodemailer.Transporter<import("nodemailer/lib/smtp-transport").SentMessageInfo, import("nodemailer/lib/smtp-transport").Options>;
    /**
     * Enviar email de verificación al nuevo suscriptor
     * @param {string} email - Email del suscriptor
     * @param {string} nombre - Nombre del suscriptor
     * @param {string} token - Token de verificación
     * @returns {Promise<boolean>} - True si se envió correctamente
     */
    sendVerificationEmail(email: string, nombre: string, token: string): Promise<boolean>;
    /**
     * Plantilla HTML del email de verificación
     */
    getVerificationEmailTemplate(nombre: any, verificationLink: any, unsubscribeLink: any): string;
    /**
     * Enviar email de bienvenida después de verificar
     * @param {string} email - Email del suscriptor
     * @param {string} nombre - Nombre del suscriptor
     * @param {string} token - Token para futuras cancelaciones
     */
    sendWelcomeEmail(email: string, nombre: string, token: string): Promise<boolean>;
    /**
     * Plantilla HTML del email de bienvenida
     */
    getWelcomeEmailTemplate(nombre: any, unsubscribeLink: any): string;
}
import nodemailer = require("nodemailer");
//# sourceMappingURL=subscriptionEmailService.d.ts.map