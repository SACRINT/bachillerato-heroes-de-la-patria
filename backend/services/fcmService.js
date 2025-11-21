/**
 * FCM SERVICE - Firebase Push | SEMANA 4
 */
class FCMService {
    async sendPush(tokens, notification) {
        console.log(`[FCM] 🔔 Push a ${tokens.length} dispositivos`);
        // Firebase integration aquí
    }
}
module.exports = new FCMService();
