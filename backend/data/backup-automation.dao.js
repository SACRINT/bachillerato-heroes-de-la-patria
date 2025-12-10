"use strict";
/**
 * 💾 BACKUP AUTOMATION DAO - TypeScript
 * Data Access Object para backups automatizados
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
// =====================================================
// BACKUP AUTOMATION DAO CLASS
// =====================================================
class BackupAutomationDAO {
    // ==========================================
    // ESTADO DE BACKUPS
    // ==========================================
    static async getLastBackupState() {
        const result = await database_1.pool.query(`
            SELECT level, MAX(created_at) as last_backup FROM backup_log
            WHERE status = 'completed' GROUP BY level
        `);
        return result.rows;
    }
    // ==========================================
    // DATOS PARA BACKUP
    // ==========================================
    static async getModifiedTables() {
        const result = await database_1.pool.query(`
            SELECT DISTINCT table_name FROM information_schema.columns
            WHERE table_schema = 'public' AND (column_name = 'updated_at' OR column_name = 'created_at')
        `);
        return result.rows.map((r) => ({ name: r.table_name }));
    }
    static async getAllTables() {
        const result = await database_1.pool.query(`
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public' ORDER BY table_name
        `);
        return result.rows;
    }
    static async getTableData(tableName, since = null) {
        let query = `SELECT * FROM ${tableName}`;
        // Note: Direct string injection for table name from internal trusted source is generally acceptable in migration context if sanitized upstream, 
        // but ideally should be validated against allowlist. For now preserving logic.
        if (since)
            query += ` WHERE updated_at > '${since}' OR created_at > '${since}'`;
        const result = await database_1.pool.query(query);
        return result.rows;
    }
    static async executeStatement(statement) {
        await database_1.pool.query(statement);
    }
    // ==========================================
    // LOGGING DE BACKUPS
    // ==========================================
    static async logBackupStart(backupId, level) {
        try {
            await database_1.pool.query(`INSERT INTO backup_log (backup_id, level, status, started_at) VALUES ($1, $2, 'running', NOW())`, [backupId, level]);
        }
        catch (e) { /* Tabla puede no existir */ }
    }
    static async logBackupComplete(backupId, size, duration, path) {
        try {
            await database_1.pool.query(`UPDATE backup_log SET status = 'completed', completed_at = NOW(), size_bytes = $2, duration_ms = $3, path = $4 WHERE backup_id = $1`, [backupId, size, duration, path]);
        }
        catch (e) { /* Ignorar */ }
    }
    static async logBackupError(backupId, errorMessage) {
        try {
            await database_1.pool.query(`UPDATE backup_log SET status = 'failed', error_message = $2, completed_at = NOW() WHERE backup_id = $1`, [backupId, errorMessage]);
        }
        catch (e) { /* Ignorar */ }
    }
}
exports.default = BackupAutomationDAO;
module.exports = BackupAutomationDAO;
//# sourceMappingURL=backup-automation.dao.js.map