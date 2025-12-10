/**
 * 📧 EMAIL SERVICE - TypeScript
 * Sistema de Envío de Emails con Plantillas Handlebars
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface EmailOptions {
    to: string;
    subject: string;
    template: string;
    data: any;
    attachments?: any[];
}
export interface EmailServiceOptions {
    nodemailerModule?: any;
    fsModule?: any;
    handlebarsModule?: any;
}
export declare class EmailService {
    private _nodemailer;
    private _fs;
    private _handlebars;
    private transporter;
    private templatesCache;
    private from;
    private initialized;
    /**
     * Constructor con soporte para inyección de dependencias (testing)
     */
    constructor(options?: EmailServiceOptions);
    /**
     * Factory method para crear instancia testeable con mocks inyectados
     */
    static createTestInstance(mocks?: EmailServiceOptions): EmailService;
    /**
     * Inicializar servicio de email
     */
    init(): Promise<void>;
    /**
     * Registrar helpers personalizados de Handlebars
     */
    registerHandlebarsHelpers(): void;
    /**
     * Cargar y compilar plantilla de email
     */
    loadTemplate(templateName: string): Promise<any>;
    /**
     * Enviar email con plantilla
     */
    sendEmail({ to, subject, template, data, attachments }: EmailOptions): Promise<any>;
    /**
     * Enviar email de bienvenida
     */
    sendWelcomeEmail(user: any): Promise<any>;
    /**
     * Enviar notificación de evento
     */
    sendEventNotification(user: any, event: any): Promise<any>;
    /**
     * Enviar newsletter
     */
    sendNewsletter(user: any, newsletter: any): Promise<any>;
    /**
     * Enviar email de recuperación de contraseña
     */
    sendPasswordRecovery(user: any, resetToken: string): Promise<any>;
    /**
     * Enviar confirmación de inscripción
     */
    sendInscriptionConfirmation(user: any, activity: any): Promise<any>;
    /**
     * Enviar email de notificación de noticia
     */
    sendNewsNotification(user: any, noticia: any): Promise<any>;
    /**
     * Enviar emails en lote (con rate limiting)
     */
    sendBulkEmails(emails: EmailOptions[], delayMs?: number): Promise<any>;
    /**
     * Limpiar caché de plantillas
     */
    clearTemplateCache(): void;
}
declare const emailServiceInstance: EmailService;
export default emailServiceInstance;
//# sourceMappingURL=email.service.d.ts.map