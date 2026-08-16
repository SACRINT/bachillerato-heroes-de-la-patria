"use strict";
/**
 * ✏️ COLLABORATIVE EDITING SERVICE - TypeScript Version
 * Sistema de edición colaborativa con Operational Transformation
 * Migrado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationType = exports.CollaborativeEditingService = void 0;
const collaborative_editing_dao_1 = __importDefault(require('../data/collaborative-editing.dao.js'));
// ==================== OPERATION TYPES ====================
const OperationType = {
    INSERT: 'insert',
    DELETE: 'delete',
    RETAIN: 'retain'
};
exports.OperationType = OperationType;
// ==================== COLLABORATIVE EDITING SERVICE ====================
class CollaborativeEditingService {
    /**
     * Crear un nuevo documento colaborativo
     */
    async createDocument(tenantId, creatorId, data) {
        try {
            const { title, content = '', type = 'text', metadata = {} } = data;
            const document = await collaborative_editing_dao_1.default.createDocument({
                tenantId, creatorId, title, content, type, metadata
            });
            console.log(`[COLLAB-EDIT] Documento creado: ${document.id}`);
            return document;
        }
        catch (error) {
            console.error('[COLLAB-EDIT] Error al crear documento:', error.message);
            throw error;
        }
    }
    /**
     * Obtener documento con colaboradores activos
     */
    async getDocument(documentId, tenantId) {
        try {
            const document = await collaborative_editing_dao_1.default.getDocumentByIdAndTenant(documentId, tenantId);
            if (!document) {
                throw new Error('Documento no encontrado');
            }
            const activeUsers = await collaborative_editing_dao_1.default.getActiveUsers(documentId);
            return { ...document, activeUsers };
        }
        catch (error) {
            console.error('[COLLAB-EDIT] Error al obtener documento:', error.message);
            throw error;
        }
    }
    /**
     * Aplicar operación con Operational Transformation
     */
    async applyOperation(documentId, tenantId, userId, operation) {
        try {
            const { type, position, content = '', version } = operation;
            const currentDoc = await collaborative_editing_dao_1.default.getDocumentContentAndVersion(documentId, tenantId);
            if (!currentDoc) {
                throw new Error('Documento no encontrado');
            }
            let newContent = currentDoc.content;
            const currentVersion = currentDoc.version;
            // Verificar conflicto de versión
            if (version !== currentVersion) {
                console.warn(`[COLLAB-EDIT] Conflict de versión: client=${version}, server=${currentVersion}`);
                return { documentId, content: newContent, version: currentVersion, conflict: true };
            }
            // Aplicar operación
            switch (type) {
                case OperationType.INSERT:
                    newContent = newContent.slice(0, position) + content + newContent.slice(position);
                    break;
                case OperationType.DELETE:
                    const deleteLength = content.length || 1;
                    newContent = newContent.slice(0, position) + newContent.slice(position + deleteLength);
                    break;
                case OperationType.RETAIN:
                    break;
                default:
                    throw new Error(`Tipo de operación no soportado: ${type}`);
            }
            const updatedDoc = await collaborative_editing_dao_1.default.updateDocumentContent(documentId, tenantId, newContent);
            await collaborative_editing_dao_1.default.recordOperation({
                documentId, userId, type, position, content,
                versionBefore: currentVersion, versionAfter: updatedDoc.version
            });
            await this.updateUserActivity(documentId, userId);
            console.log(`[COLLAB-EDIT] Operación aplicada: ${type} en doc ${documentId}`);
            return { documentId, content: updatedDoc.content, version: updatedDoc.version, conflict: false };
        }
        catch (error) {
            console.error('[COLLAB-EDIT] Error al aplicar operación:', error.message);
            throw error;
        }
    }
    /**
     * Actualizar actividad del usuario
     */
    async updateUserActivity(documentId, userId) {
        try {
            await collaborative_editing_dao_1.default.updateUserActivity(documentId, userId);
        }
        catch (error) {
            console.error('[COLLAB-EDIT] Error al actualizar actividad:', error.message);
        }
    }
    /**
     * Obtener historial de operaciones
     */
    async getOperationHistory(documentId, tenantId, limit = 50) {
        try {
            return await collaborative_editing_dao_1.default.getOperationHistory(documentId, limit);
        }
        catch (error) {
            console.error('[COLLAB-EDIT] Error al obtener historial:', error.message);
            throw error;
        }
    }
    /**
     * Bloquear documento
     */
    async lockDocument(documentId, tenantId, userId) {
        try {
            const result = await collaborative_editing_dao_1.default.lockDocument(documentId, tenantId, userId);
            if (!result)
                throw new Error('Documento ya está bloqueado por otro usuario');
            console.log(`[COLLAB-EDIT] Documento ${documentId} bloqueado por ${userId}`);
            return result;
        }
        catch (error) {
            console.error('[COLLAB-EDIT] Error al bloquear documento:', error.message);
            throw error;
        }
    }
    /**
     * Desbloquear documento
     */
    async unlockDocument(documentId, tenantId, userId) {
        try {
            const result = await collaborative_editing_dao_1.default.unlockDocument(documentId, tenantId, userId);
            if (!result)
                throw new Error('Documento no estaba bloqueado por este usuario');
            console.log(`[COLLAB-EDIT] Documento ${documentId} desbloqueado`);
            return result;
        }
        catch (error) {
            console.error('[COLLAB-EDIT] Error al desbloquear documento:', error.message);
            throw error;
        }
    }
    /**
     * Listar documentos del tenant
     */
    async listDocuments(tenantId, userId, options = {}) {
        try {
            return await collaborative_editing_dao_1.default.listDocuments(tenantId, options);
        }
        catch (error) {
            console.error('[COLLAB-EDIT] Error al listar documentos:', error.message);
            throw error;
        }
    }
    /**
     * Eliminar documento
     */
    async deleteDocument(documentId, tenantId, userId) {
        try {
            const result = await collaborative_editing_dao_1.default.deleteDocument(documentId, tenantId, userId);
            if (!result)
                throw new Error('Documento no encontrado o no tienes permisos');
            console.log(`[COLLAB-EDIT] Documento ${documentId} eliminado`);
            return { deleted: true };
        }
        catch (error) {
            console.error('[COLLAB-EDIT] Error al eliminar documento:', error.message);
            throw error;
        }
    }
}
exports.CollaborativeEditingService = CollaborativeEditingService;
// ==================== EXPORTS ====================
const collaborativeEditingService = new CollaborativeEditingService();
exports.default = collaborativeEditingService;
//# sourceMappingURL=collaborative-editing.service.js.map