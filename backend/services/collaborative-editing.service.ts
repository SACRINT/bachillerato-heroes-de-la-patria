/**
 * ✏️ COLLABORATIVE EDITING SERVICE - TypeScript Version
 * Sistema de edición colaborativa con Operational Transformation
 * Migrado: 07 Diciembre 2025
 */

import collabEditingDAO from '../data/collaborative-editing.dao';

// ==================== OPERATION TYPES ====================

const OperationType = {
    INSERT: 'insert',
    DELETE: 'delete',
    RETAIN: 'retain'
} as const;

type OperationTypeValue = typeof OperationType[keyof typeof OperationType];

// ==================== INTERFACES ====================

interface CreateDocumentData {
    title: string;
    content?: string;
    type?: string;
    metadata?: Record<string, any>;
}

interface Document {
    id: number;
    tenant_id: number;
    creator_id: number;
    title: string;
    content: string;
    type: string;
    version: number;
    metadata: Record<string, any>;
    locked_by?: number;
    created_at: Date;
    updated_at: Date;
}

interface Operation {
    type: OperationTypeValue;
    position: number;
    content?: string;
    version: number;
}

interface OperationResult {
    documentId: number;
    content: string;
    version: number;
    conflict: boolean;
}

interface ActiveUser {
    user_id: number;
    last_activity: Date;
}

// ==================== COLLABORATIVE EDITING SERVICE ====================

class CollaborativeEditingService {

    /**
     * Crear un nuevo documento colaborativo
     */
    async createDocument(tenantId: number, creatorId: number, data: CreateDocumentData): Promise<Document> {
        try {
            const { title, content = '', type = 'text', metadata = {} } = data;

            const document = await collabEditingDAO.createDocument({
                tenantId, creatorId, title, content, type, metadata
            });

            console.log(`[COLLAB-EDIT] Documento creado: ${document.id}`);
            return document;
        } catch (error: any) {
            console.error('[COLLAB-EDIT] Error al crear documento:', error.message);
            throw error;
        }
    }

    /**
     * Obtener documento con colaboradores activos
     */
    async getDocument(documentId: number, tenantId: number): Promise<Document & { activeUsers: ActiveUser[] }> {
        try {
            const document = await collabEditingDAO.getDocumentByIdAndTenant(documentId, tenantId);

            if (!document) {
                throw new Error('Documento no encontrado');
            }

            const activeUsers = await collabEditingDAO.getActiveUsers(documentId);

            return { ...document, activeUsers };
        } catch (error: any) {
            console.error('[COLLAB-EDIT] Error al obtener documento:', error.message);
            throw error;
        }
    }

    /**
     * Aplicar operación con Operational Transformation
     */
    async applyOperation(documentId: number, tenantId: number, userId: number, operation: Operation): Promise<OperationResult> {
        try {
            const { type, position, content = '', version } = operation;

            const currentDoc = await collabEditingDAO.getDocumentContentAndVersion(documentId, tenantId);

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

            const updatedDoc = await collabEditingDAO.updateDocumentContent(documentId, tenantId, newContent);

            await collabEditingDAO.recordOperation({
                documentId, userId, type, position, content,
                versionBefore: currentVersion, versionAfter: updatedDoc.version
            });

            await this.updateUserActivity(documentId, userId);

            console.log(`[COLLAB-EDIT] Operación aplicada: ${type} en doc ${documentId}`);

            return { documentId, content: updatedDoc.content, version: updatedDoc.version, conflict: false };
        } catch (error: any) {
            console.error('[COLLAB-EDIT] Error al aplicar operación:', error.message);
            throw error;
        }
    }

    /**
     * Actualizar actividad del usuario
     */
    async updateUserActivity(documentId: number, userId: number): Promise<void> {
        try {
            await collabEditingDAO.updateUserActivity(documentId, userId);
        } catch (error: any) {
            console.error('[COLLAB-EDIT] Error al actualizar actividad:', error.message);
        }
    }

    /**
     * Obtener historial de operaciones
     */
    async getOperationHistory(documentId: number, tenantId: number, limit: number = 50): Promise<any[]> {
        try {
            return await collabEditingDAO.getOperationHistory(documentId, limit);
        } catch (error: any) {
            console.error('[COLLAB-EDIT] Error al obtener historial:', error.message);
            throw error;
        }
    }

    /**
     * Bloquear documento
     */
    async lockDocument(documentId: number, tenantId: number, userId: number): Promise<any> {
        try {
            const result = await collabEditingDAO.lockDocument(documentId, tenantId, userId);
            if (!result) throw new Error('Documento ya está bloqueado por otro usuario');
            console.log(`[COLLAB-EDIT] Documento ${documentId} bloqueado por ${userId}`);
            return result;
        } catch (error: any) {
            console.error('[COLLAB-EDIT] Error al bloquear documento:', error.message);
            throw error;
        }
    }

    /**
     * Desbloquear documento
     */
    async unlockDocument(documentId: number, tenantId: number, userId: number): Promise<any> {
        try {
            const result = await collabEditingDAO.unlockDocument(documentId, tenantId, userId);
            if (!result) throw new Error('Documento no estaba bloqueado por este usuario');
            console.log(`[COLLAB-EDIT] Documento ${documentId} desbloqueado`);
            return result;
        } catch (error: any) {
            console.error('[COLLAB-EDIT] Error al desbloquear documento:', error.message);
            throw error;
        }
    }

    /**
     * Listar documentos del tenant
     */
    async listDocuments(tenantId: number, userId: number, options: Record<string, any> = {}): Promise<Document[]> {
        try {
            return await collabEditingDAO.listDocuments(tenantId, options);
        } catch (error: any) {
            console.error('[COLLAB-EDIT] Error al listar documentos:', error.message);
            throw error;
        }
    }

    /**
     * Eliminar documento
     */
    async deleteDocument(documentId: number, tenantId: number, userId: number): Promise<{ deleted: boolean }> {
        try {
            const result = await collabEditingDAO.deleteDocument(documentId, tenantId, userId);
            if (!result) throw new Error('Documento no encontrado o no tienes permisos');
            console.log(`[COLLAB-EDIT] Documento ${documentId} eliminado`);
            return { deleted: true };
        } catch (error: any) {
            console.error('[COLLAB-EDIT] Error al eliminar documento:', error.message);
            throw error;
        }
    }
}

// ==================== EXPORTS ====================

const collaborativeEditingService = new CollaborativeEditingService();

export default collaborativeEditingService;
export { CollaborativeEditingService, OperationType, Document, Operation };
