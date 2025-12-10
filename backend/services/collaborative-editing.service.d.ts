/**
 * ✏️ COLLABORATIVE EDITING SERVICE - TypeScript Version
 * Sistema de edición colaborativa con Operational Transformation
 * Migrado: 07 Diciembre 2025
 */
declare const OperationType: {
    readonly INSERT: "insert";
    readonly DELETE: "delete";
    readonly RETAIN: "retain";
};
type OperationTypeValue = typeof OperationType[keyof typeof OperationType];
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
declare class CollaborativeEditingService {
    /**
     * Crear un nuevo documento colaborativo
     */
    createDocument(tenantId: number, creatorId: number, data: CreateDocumentData): Promise<Document>;
    /**
     * Obtener documento con colaboradores activos
     */
    getDocument(documentId: number, tenantId: number): Promise<Document & {
        activeUsers: ActiveUser[];
    }>;
    /**
     * Aplicar operación con Operational Transformation
     */
    applyOperation(documentId: number, tenantId: number, userId: number, operation: Operation): Promise<OperationResult>;
    /**
     * Actualizar actividad del usuario
     */
    updateUserActivity(documentId: number, userId: number): Promise<void>;
    /**
     * Obtener historial de operaciones
     */
    getOperationHistory(documentId: number, tenantId: number, limit?: number): Promise<any[]>;
    /**
     * Bloquear documento
     */
    lockDocument(documentId: number, tenantId: number, userId: number): Promise<any>;
    /**
     * Desbloquear documento
     */
    unlockDocument(documentId: number, tenantId: number, userId: number): Promise<any>;
    /**
     * Listar documentos del tenant
     */
    listDocuments(tenantId: number, userId: number, options?: Record<string, any>): Promise<Document[]>;
    /**
     * Eliminar documento
     */
    deleteDocument(documentId: number, tenantId: number, userId: number): Promise<{
        deleted: boolean;
    }>;
}
declare const collaborativeEditingService: CollaborativeEditingService;
export default collaborativeEditingService;
export { CollaborativeEditingService, OperationType, Document, Operation };
//# sourceMappingURL=collaborative-editing.service.d.ts.map