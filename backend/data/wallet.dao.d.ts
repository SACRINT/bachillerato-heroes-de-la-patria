/**
 * 💰 WALLET DAO - TypeScript
 * Data Access Object para sistema de IACoins
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
import { PoolClient } from 'pg';
export interface WalletRow {
    user_id: number;
    balance: number;
    total_earned: number;
    total_spent: number;
    total_purchased: number;
    created_at: Date;
    updated_at: Date;
}
export interface WalletTransaction {
    id: number;
    user_id: number;
    transaction_type: 'earn' | 'spend' | 'purchase';
    amount: number;
    balance_after: number;
    description: string;
    metadata?: Record<string, any>;
    created_at: Date;
}
export interface WalletHistoryResult {
    transactions: WalletTransaction[];
    total: number;
}
export interface WalletHistoryOptions {
    type?: 'earn' | 'spend' | 'purchase';
    limit?: number;
    offset?: number;
}
declare class WalletDAO {
    static getByUserId(userId: number): Promise<WalletRow | null>;
    static create(userId: number, initialBalance?: number): Promise<WalletRow>;
    static getHistory(userId: number, options?: WalletHistoryOptions): Promise<WalletHistoryResult>;
    static getConnection(): Promise<PoolClient>;
}
export default WalletDAO;
//# sourceMappingURL=wallet.dao.d.ts.map