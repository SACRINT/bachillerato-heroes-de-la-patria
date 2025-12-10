"use strict";
/**
 * 📱 SMS SERVICE - TypeScript Version
 * Servicio de notificaciones SMS (Twilio)
 * Migrado: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SMSService = void 0;
// ==================== SMS SERVICE ====================
class SMSService {
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
    async sendSMS(to, message) {
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
    async sendVerificationCode(to, code) {
        const message = `Tu código de verificación es: ${code}. Este código expira en 10 minutos.`;
        return this.sendSMS(to, message);
    }
    /**
     * Enviar notificación de alerta
     */
    async sendAlert(to, alertType, details) {
        const message = `[ALERTA ${alertType}] ${details}`;
        return this.sendSMS(to, message);
    }
    /**
     * Enviar SMS masivo
     */
    async sendBulkSMS(recipients, message) {
        console.log(`[SMS] 📱 Enviando SMS masivo a ${recipients.length} destinatarios`);
        const results = [];
        for (const to of recipients) {
            try {
                const result = await this.sendSMS(to, message);
                results.push(result);
            }
            catch (error) {
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
    isConfigured() {
        return !!(this.config.accountSid && this.config.authToken && this.config.fromNumber);
    }
}
exports.SMSService = SMSService;
// ==================== EXPORTS ====================
const smsService = new SMSService();
exports.default = smsService;
//# sourceMappingURL=sms.service.js.map