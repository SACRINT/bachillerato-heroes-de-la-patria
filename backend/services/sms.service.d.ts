/**
 * 📱 SMS SERVICE - TypeScript Version
 * Servicio de notificaciones SMS (Twilio)
 * Migrado: 07 Diciembre 2025
 */
interface SMSResult {
    success: boolean;
    to: string;
    message: string;
    timestamp: Date;
    provider: string;
}
interface SMSConfig {
    provider: 'twilio' | 'mock';
    accountSid?: string;
    authToken?: string;
    fromNumber?: string;
}
declare class SMSService {
    private config;
    constructor();
    /**
     * Enviar SMS
     */
    sendSMS(to: string, message: string): Promise<SMSResult>;
    /**
     * Enviar SMS de verificación
     */
    sendVerificationCode(to: string, code: string): Promise<SMSResult>;
    /**
     * Enviar notificación de alerta
     */
    sendAlert(to: string, alertType: string, details: string): Promise<SMSResult>;
    /**
     * Enviar SMS masivo
     */
    sendBulkSMS(recipients: string[], message: string): Promise<SMSResult[]>;
    /**
     * Verificar configuración
     */
    isConfigured(): boolean;
}
declare const smsService: SMSService;
export default smsService;
export { SMSService, SMSResult, SMSConfig };
//# sourceMappingURL=sms.service.d.ts.map