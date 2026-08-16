/**
 * Approval Service - Capa de servicios para gestión de aprobaciones
 * Maneja solicitudes pendientes, aprobaciones y rechazos
 * GDPR Compliant - Logging condicional
 */

const { debugLog } = require('../utils/debug-logger.js');
const { sanitizeError } = require('../utils/sanitized-errors.js');
const db = require('../data/database-access.js');
const emailService = require('./emailService.js');

class ApprovalService {
  /**
   * Obtener solicitudes pendientes de aprobación
   * @param {Object} filters - Filtros (form_type, status, date_range, etc)
   * @returns {Promise<Array>} Lista de solicitudes pendientes
   */
  async getPendingApprovals(filters = {}) {
    debugLog.log('APPROVAL', 'Fetching pending approvals', { filterCount: Object.keys(filters).length });

    try {
      const approvals = await db.getPendingApprovals(filters);
      debugLog.log('APPROVAL', 'Pending approvals fetched', { count: approvals.length });
      return approvals;
    } catch (error) {
      debugLog.error('APPROVAL', 'Error fetching pending approvals', sanitizeError(error, 'getPendingApprovals'));
      throw error;
    }
  }

  /**
   * Obtener detalles de una solicitud específica
   * @param {number} requestId - ID de la solicitud
   * @returns {Promise<Object>} Detalles de la solicitud
   */
  async getApprovalById(requestId) {
    debugLog.log('APPROVAL', 'Fetching approval details', { requestId });

    try {
      const approval = await db.getApprovalById(requestId);

      if (!approval) {
        debugLog.warn('APPROVAL', 'Approval not found', { requestId });
        throw new Error('Solicitud no encontrada');
      }

      return approval;
    } catch (error) {
      debugLog.error('APPROVAL', 'Error fetching approval', sanitizeError(error, 'getApprovalById'));
      throw error;
    }
  }

  /**
   * Aprobar una solicitud
   * @param {number} requestId - ID de la solicitud
   * @param {string} approverNotes - Notas del aprobador
   * @param {number} approverId - ID del usuario que aprueba
   * @returns {Promise<Object>} Solicitud aprobada
   */
  async approveRequest(requestId, approverNotes = '', approverId = null) {
    debugLog.log('APPROVAL', 'Approving request', { requestId, approverId });

    try {
      // Verificar que la solicitud existe y está pendiente
      const approval = await this.getApprovalById(requestId);

      if (approval.status !== 'pending' && approval.status !== 'pendiente') {
        throw new Error('La solicitud ya fue procesada');
      }

      // Actualizar estado a aprobado
      const result = await db.updateRequestStatus(requestId, 'approved', approverNotes, approverId);

      debugLog.log('APPROVAL', 'Request approved successfully', { requestId });

      // Enviar notificación por email (async, no bloqueante)
      this._sendApprovalNotification(approval, 'approved', approverNotes).catch(err => {
        debugLog.error('APPROVAL', 'Error sending approval email', sanitizeError(err, 'sendApprovalEmail'));
      });

      return result;
    } catch (error) {
      debugLog.error('APPROVAL', 'Error approving request', sanitizeError(error, 'approveRequest'));
      throw error;
    }
  }

  /**
   * Rechazar una solicitud
   * @param {number} requestId - ID de la solicitud
   * @param {string} rejectionReason - Razón del rechazo
   * @param {number} approverId - ID del usuario que rechaza
   * @returns {Promise<Object>} Solicitud rechazada
   */
  async rejectRequest(requestId, rejectionReason, approverId = null) {
    debugLog.log('APPROVAL', 'Rejecting request', { requestId, approverId });

    try {
      // Verificar que la solicitud existe y está pendiente
      const approval = await this.getApprovalById(requestId);

      if (approval.status !== 'pending' && approval.status !== 'pendiente') {
        throw new Error('La solicitud ya fue procesada');
      }

      if (!rejectionReason || rejectionReason.trim().length < 10) {
        throw new Error('La razón del rechazo debe tener al menos 10 caracteres');
      }

      // Actualizar estado a rechazado
      const result = await db.updateRequestStatus(requestId, 'rejected', rejectionReason, approverId);

      debugLog.log('APPROVAL', 'Request rejected successfully', { requestId });

      // Enviar notificación por email (async)
      this._sendApprovalNotification(approval, 'rejected', rejectionReason).catch(err => {
        debugLog.error('APPROVAL', 'Error sending rejection email', sanitizeError(err, 'sendRejectionEmail'));
      });

      return result;
    } catch (error) {
      debugLog.error('APPROVAL', 'Error rejecting request', sanitizeError(error, 'rejectRequest'));
      throw error;
    }
  }

  /**
   * Obtener estadísticas de aprobaciones
   * @returns {Promise<Object>} Estadísticas
   */
  async getApprovalStatistics() {
    debugLog.log('APPROVAL', 'Fetching approval statistics');

    try {
      const stats = await db.getApprovalStatistics();
      return stats;
    } catch (error) {
      debugLog.error('APPROVAL', 'Error fetching statistics', sanitizeError(error, 'getApprovalStatistics'));
      throw error;
    }
  }

  /**
   * Enviar notificación de aprobación/rechazo
   * @private
   */
  async _sendApprovalNotification(approval, status, notes) {
    try {
      const subject = status === 'approved'
        ? '✅ Solicitud Aprobada'
        : '❌ Solicitud Rechazada';

      const template = status === 'approved'
        ? 'emails/approval-approved'
        : 'emails/approval-rejected';

      await emailService.send({
        to: approval.email || approval.user_email,
        subject: subject,
        template: template,
        context: {
          formType: approval.form_type,
          notes: notes,
          approvalDate: new Date().toLocaleDateString('es-MX')
        }
      });

      debugLog.log('APPROVAL', 'Notification email sent', { status });
    } catch (error) {
      // No lanzar error, solo registrar (email no es crítico)
      debugLog.warn('APPROVAL', 'Failed to send email notification', sanitizeError(error, 'sendNotification'));
    }
  }
}

module.exports = new ApprovalService();
