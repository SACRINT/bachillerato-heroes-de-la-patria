/**
 * 🔄 SYNC DAO - TypeScript
 * Data Access Object para sincronización cross-platform
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
export interface SyncLogEntry {
    id: number;
    user_id: number;
    entity: string;
    entity_id: string;
    action: string;
    data: Record<string, any>;
    updated_at: Date;
}
declare class SyncDAO {
    static getChangesSince(userId: number, timestamp: number | string): Promise<SyncLogEntry[]>;
    static applyChange(userId: number, entity: string, entityId: string, action: string, data: Record<string, any>, timestamp: number | string): Promise<void>;
}
export default SyncDAO;
//# sourceMappingURL=sync.dao.d.ts.map