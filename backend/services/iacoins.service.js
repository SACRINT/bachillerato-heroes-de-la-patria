/**
 * IACOINS SERVICE - SEMANA 11
 * Sistema de moneda virtual completo
 */
class IACoinsService {
    async getBalance(userId) {
        return 1000; // Balance de ejemplo
    }

    async earn(userId, amount, reason) {
        console.log(`[IACOINS] ➕ ${amount} IACoins ganados - ${reason}`);
    }

    async spend(userId, amount, reason) {
        console.log(`[IACOINS] ➖ ${amount} IACoins gastados - ${reason}`);
    }
}

module.exports = new IACoinsService();
