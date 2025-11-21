/**
 * SMS SERVICE - Twilio | SEMANA 4
 */
class SMSService {
    async sendSMS(to, message) {
        console.log(`[SMS] 📱 SMS a ${to}: ${message}`);
        // Twilio integration aquí
    }
}
module.exports = new SMSService();
