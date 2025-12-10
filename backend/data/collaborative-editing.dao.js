"use strict";
/**
 * 📝 COLLABORATIVE EDITING DAO - TypeScript
 * Capa de acceso a datos para sistema de edición colaborativa con OT
 * Incluye: documentos, operaciones, actividad de usuarios
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
// =====================================================
// COLLABORATIVE EDITING DAO CLASS
// =====================================================
class CollaborativeEditingDAO {
    // ============================================
    // DOCUMENT QUERIES
    // ============================================
    static async createDocument(docData) {
        const { tenantId, creatorId, title, content = '', type = 'text', metadata = {} } = docData;
        const query = `
            INSERT INTO collaborative_documents (
                tenant_id, creator_id, title, content, type, metadata,
                version, locked, locked_by, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, 1, FALSE, NULL, NOW(), NOW())
            RETURNING *
        `;
        const result = await database_1.pool.query(query, [tenantId, creatorId, title, content, type, JSON.stringify(metadata)]);
        return result.rows[0];
    }
    static async getDocumentByIdAndTenant(documentId, tenantId) {
        const query = `SELECT * FROM collaborative_documents WHERE id = $1 AND tenant_id = $2`;
        const result = await database_1.pool.query(query, [documentId, tenantId]);
        return result.rows[0] || null;
    }
    static async getDocumentContentAndVersion(documentId, tenantId) {
        const query = 'SELECT content, version FROM collaborative_documents WHERE id = $1 AND tenant_id = $2';
        const result = await database_1.pool.query(query, [documentId, tenantId]);
        return result.rows[0] || null;
    }
    static async updateDocumentContent(documentId, tenantId, content) {
        const query = `
            UPDATE collaborative_documents
            SET content = $1, version = version + 1, updated_at = NOW()
            WHERE id = $2 AND tenant_id = $3
            RETURNING *
        `;
        const result = await database_1.pool.query(query, [content, documentId, tenantId]);
        return result.rows[0];
    }
    static async lockDocument(documentId, tenantId, userId) {
        const query = `
            UPDATE collaborative_documents
            SET locked = TRUE, locked_by = $1, updated_at = NOW()
            WHERE id = $2 AND tenant_id = $3 AND (locked = FALSE OR locked_by = $1)
            RETURNING *
        `;
        const result = await database_1.pool.query(query, [userId, documentId, tenantId]);
        return result.rows[0] || null;
    }
    static async unlockDocument(documentId, tenantId, userId) {
        const query = `
            UPDATE collaborative_documents
            SET locked = FALSE, locked_by = NULL, updated_at = NOW()
            WHERE id = $1 AND tenant_id = $2 AND locked_by = $3
            RETURNING *
        `;
        const result = await database_1.pool.query(query, [documentId, tenantId, userId]);
        return result.rows[0] || null;
    }
    static async listDocuments(tenantId, options = {}) {
        const { limit = 20, offset = 0, type = null } = options;
        let query = `
            SELECT
                d.*,
                u.username as creator_username,
                u.nombre as creator_name
            FROM collaborative_documents d
            LEFT JOIN usuarios u ON d.creator_id = u.id
            WHERE d.tenant_id = $1
        `;
        const params = [tenantId];
        if (type) {
            query += ` AND d.type = $${params.length + 1}`;
            params.push(type);
        }
        query += ` ORDER BY d.updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        const result = await database_1.pool.query(query, params);
        return result.rows;
    }
    static async deleteDocument(documentId, tenantId, userId) {
        const query = `
            DELETE FROM collaborative_documents
            WHERE id = $1 AND tenant_id = $2 AND creator_id = $3
            RETURNING id
        `;
        const result = await database_1.pool.query(query, [documentId, tenantId, userId]);
        return result.rows[0] || null;
    }
    // ============================================
    // ACTIVITY QUERIES
    // ============================================
    static async getActiveUsers(documentId) {
        const query = `
            SELECT DISTINCT user_id, last_activity
            FROM document_activity
            WHERE document_id = $1
              AND last_activity > NOW() - INTERVAL '5 minutes'
            ORDER BY last_activity DESC
        `;
        const result = await database_1.pool.query(query, [documentId]);
        return result.rows;
    }
    static async updateUserActivity(documentId, userId) {
        const query = `
            INSERT INTO document_activity (document_id, user_id, last_activity)
            VALUES ($1, $2, NOW())
            ON CONFLICT (document_id, user_id)
            DO UPDATE SET last_activity = NOW()
        `;
        try {
            await database_1.pool.query(query, [documentId, userId]);
        }
        catch (e) { }
    }
    // ============================================
    // OPERATION QUERIES
    // ============================================
    static async recordOperation(opData) {
        const { documentId, userId, type, position, content, versionBefore, versionAfter } = opData;
        const query = `
            INSERT INTO document_operations (
                document_id, user_id, operation_type, position, content,
                version_before, version_after, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `;
        await database_1.pool.query(query, [documentId, userId, type, position, content, versionBefore, versionAfter]);
    }
    static async getOperationHistory(documentId, limit = 50) {
        const query = `
            SELECT
                o.*,
                u.username,
                u.nombre
            FROM document_operations o
            LEFT JOIN usuarios u ON o.user_id = u.id
            WHERE o.document_id = $1
            ORDER BY o.created_at DESC
            LIMIT $2
        `;
        const result = await database_1.pool.query(query, [documentId, limit]);
        return result.rows;
    }
}
exports.default = CollaborativeEditingDAO;
module.exports = CollaborativeEditingDAO;
//# sourceMappingURL=collaborative-editing.dao.js.map