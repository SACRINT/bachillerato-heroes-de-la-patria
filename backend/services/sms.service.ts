/**
 * 📱 SMS SERVICE - TypeScript Version
 * Servicio de notificaciones SMS (Twilio)
 * Migrado: 07 Diciembre 2025
 */

// ==================== INTERFACES ====================

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

// ==================== SMS SERVICE ====================

class SMSService {
    private config: SMSConfig;

    constructor() {
        this.config = {
            provider: 'mock',
            accountSid: process.env.TWILIO_ACCOUNT_SID,
            authToken: process.env.TWILIO_AUTH_TOKEN,
            fromNumber: process.env.TWILIO_PHONE_NUMBER
        };
    }

    /**
     * Enviar SMS
     */
    async sendSMS(to: string, message: string): Promise<SMSResult> {
        console.log(`[SMS] 📱 SMS a ${to}: ${message}`);

        // En producción, aquí iría la integración con Twilio
        if (this.config.provider === 'twilio' && this.config.accountSid) {
            // TODO: Implementar llamada real a Twilio
            // const twilio = require('twilio')(this.config.accountSid, this.config.authToken);
            // await twilio.messages.create({ to, from: this.config.fromNumber, body: message });
        }

        return {
            success: true,
            to,
            message,
            timestamp: new Date(),
            provider: this.config.provider
        };
    }

    /**
     * Enviar SMS de verificación
     */
    async sendVerificationCode(to: string, code: string): Promise<SMSResult> {
        const message = `Tu código de verificación es: ${code}. Este código expira en 10 minutos.`;
        return this.sendSMS(to, message);
    }

    /**
     * Enviar notificación de alerta
     */
    async sendAlert(to: string, alertType: string, details: string): Promise<SMSResult> {
        const message = `[ALERTA ${alertType}] ${details}`;
        return this.sendSMS(to, message);
    }

    /**
     * Enviar SMS masivo
     */
    async sendBulkSMS(recipients: string[], message: string): Promise<SMSResult[]> {
        console.log(`[SMS] 📱 Enviando SMS masivo a ${recipients.length} destinatarios`);

        const results: SMSResult[] = [];
        for (const to of recipients) {
            try {
                const result = await this.sendSMS(to, message);
                results.push(result);
            } catch (error: any) {
                results.push({
                    success: false,
                    to,
                    message: error.message,
                    timestamp: new Date(),
                    provider: this.config.provider
                });
            }
        }

        return results;
    }

    /**
     * Verificar configuración
     */
    isConfigured(): boolean {
        return !!(this.config.accountSid && this.config.authToken && this.config.fromNumber);
    }
}

// ==================== EXPORTS ====================

const smsService = new SMSService();

export default smsService;
export { SMSService, SMSResult, SMSConfig };
