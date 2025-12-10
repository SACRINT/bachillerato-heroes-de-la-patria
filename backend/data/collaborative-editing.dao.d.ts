/**
 * 📝 COLLABORATIVE EDITING DAO - TypeScript
 * Capa de acceso a datos para sistema de edición colaborativa con OT
 * Incluye: documentos, operaciones, actividad de usuarios
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface CollaborativeDocument {
    id: number;
    tenant_id: number;
    creator_id: number;
    title: string;
    content: string;
    type: string;
    metadata: any;
    version: number;
    locked: boolean;
    locked_by?: number;
    created_at: Date;
    updated_at: Date;
    creator_username?: string;
    creator_name?: string;
}
export interface DocumentOperation {
    id: number;
    document_id: number;
    user_id: number;
    operation_type: string;
    position: number;
    content: string;
    version_before: number;
    version_after: number;
    created_at: Date;
    username?: string;
    nombre?: string;
}
export interface ActiveUser {
    user_id: number;
    last_activity: Date;
}
export interface CreateDocumentInput {
    tenantId: number;
    creatorId: number;
    title: string;
    content?: string;
    type?: string;
    metadata?: any;
}
export interface OperationInput {
    documentId: number;
    userId: number;
    type: string;
    position: number;
    content: string;
    versionBefore: number;
    versionAfter: number;
}
export interface ListDocumentsOptions {
    limit?: number;
    offset?: number;
    type?: string;
}
declare class CollaborativeEditingDAO {
    static createDocument(docData: CreateDocumentInput): Promise<CollaborativeDocument>;
    static getDocumentByIdAndTenant(documentId: number, tenantId: number): Promise<CollaborativeDocument | null>;
    static getDocumentContentAndVersion(documentId: number, tenantId: number): Promise<{
        content: string;
        version: number;
    } | null>;
    static updateDocumentContent(documentId: number, tenantId: number, content: string): Promise<CollaborativeDocument>;
    static lockDocument(documentId: number, tenantId: number, userId: number): Promise<CollaborativeDocument | null>;
    static unlockDocument(documentId: number, tenantId: number, userId: number): Promise<CollaborativeDocument | null>;
    static listDocuments(tenantId: number, options?: ListDocumentsOptions): Promise<CollaborativeDocument[]>;
    static deleteDocument(documentId: number, tenantId: number, userId: number): Promise<{
        id: number;
    } | null>;
    static getActiveUsers(documentId: number): Promise<ActiveUser[]>;
    static updateUserActivity(documentId: number, userId: number): Promise<void>;
    static recordOperation(opData: OperationInput): Promise<void>;
    static getOperationHistory(documentId: number, limit?: number): Promise<DocumentOperation[]>;
}
export default CollaborativeEditingDAO;
//# sourceMappingURL=collaborative-editing.dao.d.ts.map