/**
 * 🛒 STORE DAO - TypeScript
 * Data Access Object para tienda virtual con IACoins
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
import { PoolClient } from 'pg';
export interface StoreItem {
    id: number;
    name: string;
    description: string;
    category: string;
    price_iacoins: number;
    icon?: string;
    is_available: boolean;
    stock?: number;
    max_per_user?: number;
    metadata?: Record<string, any>;
    created_at: Date;
}
export interface UserPurchasedItem {
    purchase_id: number;
    purchased_at: Date;
    item_id: number;
    name: string;
    description: string;
    category: string;
    price_iacoins: number;
    icon?: string;
    metadata?: Record<string, any>;
}
export interface StoreItemCreateData {
    name: string;
    description: string;
    category: string;
    price_iacoins: number;
    icon?: string;
    stock?: number;
    max_per_user?: number;
    metadata?: Record<string, any>;
}
export interface StoreFilters {
    category?: string;
    is_available?: boolean | string;
}
declare class StoreDAO {
    static getItems(filters?: StoreFilters): Promise<StoreItem[]>;
    static getItemById(itemId: number): Promise<StoreItem | null>;
    static getUserPurchaseCount(userId: number, itemId: number): Promise<number>;
    static getUserItems(userId: number): Promise<UserPurchasedItem[]>;
    static createItem(itemData: StoreItemCreateData): Promise<StoreItem>;
    static getConnection(): Promise<PoolClient>;
}
export default StoreDAO;
//# sourceMappingURL=store.dao.d.ts.map