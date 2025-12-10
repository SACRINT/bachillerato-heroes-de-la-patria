export namespace OperationType {
    let INSERT: string;
    let DELETE: string;
    let RETAIN: string;
}
/**
 * Crear un nuevo documento colaborativo
 */
export declare function createDocument(tenantId: any, creatorId: any, data: any): Promise<any>;
/**
 * Obtener documento con información de colaboradores activos
 */
export declare function getDocument(documentId: any, tenantId: any): Promise<any>;
/**
 * Aplicar operación de edición con Operational Transformation
 */
export declare function applyOperation(documentId: any, tenantId: any, userId: any, operation: any): Promise<{
    documentId: any;
    content: any;
    version: any;
    conflict: boolean;
}>;
/**
 * Actualizar actividad del usuario en documento
 */
export declare function updateUserActivity(documentId: any, userId: any): Promise<void>;
/**
 * Obtener historial de operaciones de un documento
 */
export declare function getOperationHistory(documentId: any, tenantId: any, limit?: number): Promise<any>;
/**
 * Bloquear documento (para edición exclusiva)
 */
export declare function lockDocument(documentId: any, tenantId: any, userId: any): Promise<any>;
/**
 * Desbloquear documento
 */
export declare function unlockDocument(documentId: any, tenantId: any, userId: any): Promise<any>;
/**
 * Listar documentos del tenant
 */
export declare function listDocuments(tenantId: any, userId: any, options?: {}): Promise<any>;
/**
 * Eliminar documento
 */
export declare function deleteDocument(documentId: any, tenantId: any, userId: any): Promise<{
    deleted: boolean;
}>;
//# sourceMappingURL=collaborative-editing-service.d.ts.map