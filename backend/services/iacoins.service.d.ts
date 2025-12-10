/**
 * 💰 IACOINS SERVICE - TypeScript Version
 * Sistema de moneda virtual completo
 * Migrado: 07 Diciembre 2025
 */
interface Transaction {
    id: string;
    userId: string | number;
    amount: number;
    type: 'earn' | 'spend';
    reason: string;
    timestamp: Date;
}
interface BalanceResult {
    userId: string | number;
    balance: number;
    lastUpdated: Date;
}
declare class IACoinsService {
    /**
     * Obtener balance de un usuario
     */
    getBalance(userId: string | number): Promise<number>;
    /**
     * Obtener información detallada del balance
     */
    getBalanceDetails(userId: string | number): Promise<BalanceResult>;
    /**
     * Ganar IACoins
     */
    earn(userId: string | number, amount: number, reason: string): Promise<Transaction>;
    /**
     * Gastar IACoins
     */
    spend(userId: string | number, amount: number, reason: string): Promise<Transaction>;
    /**
     * Transferir IACoins entre usuarios
     */
    transfer(fromUserId: string | number, toUserId: string | number, amount: number, reason?: string): Promise<{
        spend: Transaction;
        earn: Transaction;
    }>;
    /**
     * Obtener historial de transacciones
     */
    getTransactionHistory(userId: string | number, limit?: number): Promise<Transaction[]>;
}
declare const iacoinsService: IACoinsService;
export default iacoinsService;
export { IACoinsService, Transaction, BalanceResult };
//# sourceMappingURL=iacoins.service.d.ts.map