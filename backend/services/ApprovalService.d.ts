declare const _exports: ApprovalService;
export = _exports;
declare class ApprovalService {
    /**
     * Obtener solicitudes pendientes de aprobación
     * @param {Object} filters - Filtros (form_type, status, date_range, etc)
     * @returns {Promise<Array>} Lista de solicitudes pendientes
     */
    getPendingApprovals(filters?: any): Promise<any[]>;
    /**
     * Obtener detalles de una solicitud específica
     * @param {number} requestId - ID de la solicitud
     * @returns {Promise<Object>} Detalles de la solicitud
     */
    getApprovalById(requestId: number): Promise<any>;
    /**
     * Aprobar una solicitud
     * @param {number} requestId - ID de la solicitud
     * @param {string} approverNotes - Notas del aprobador
     * @param {number} approverId - ID del usuario que aprueba
     * @returns {Promise<Object>} Solicitud aprobada
     */
    approveRequest(requestId: number, approverNotes?: string, approverId?: number): Promise<any>;
    /**
     * Rechazar una solicitud
     * @param {number} requestId - ID de la solicitud
     * @param {string} rejectionReason - Razón del rechazo
     * @param {number} approverId - ID del usuario que rechaza
     * @returns {Promise<Object>} Solicitud rechazada
     */
    rejectRequest(requestId: number, rejectionReason: string, approverId?: number): Promise<any>;
    /**
     * Obtener estadísticas de aprobaciones
     * @returns {Promise<Object>} Estadísticas
     */
    getApprovalStatistics(): Promise<any>;
    /**
     * Enviar notificación de aprobación/rechazo
     * @private
     */
    private _sendApprovalNotification;
}
//# sourceMappingURL=ApprovalService.d.ts.map