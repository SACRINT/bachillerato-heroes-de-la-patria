/**
 * ✏️ COLLABORATIVE EDITING SERVICE
 * Sistema de edición colaborativa en tiempo real con Operational Transformation
 * Semana 15 - Real-Time Features Avanzado
 */

const pool = require('../config/database');
const logger = require('../utils/winston-logger');

// DAO Import - Capa de Acceso a Datos
const collabEditingDAO = require('../data/collaborative-editing.dao');

/**
 * Tipos de operación para Operational Transformation
 */
const OperationType = {
  INSERT: 'insert',
  DELETE: 'delete',
  RETAIN: 'retain',
};

class CollaborativeEditingService {
  /**
   * Crear un nuevo documento colaborativo
   */
  async createDocument(tenantId, creatorId, data) {
    try {
      const { title, content = '', type = 'text', metadata = {} } = data;

      const document = await collabEditingDAO.createDocument({
        tenantId, creatorId, title, content, type, metadata
      });

      logger.info('[COLLAB-EDIT] Documento creado', {
        documentId: document.id,
        tenantId,
        creatorId,
      });

      return document;
    } catch (error) {
      logger.error('[COLLAB-EDIT] Error al crear documento', {
        error: error.message,
        tenantId,
        creatorId,
      });
      throw error;
    }
  }

  /**
   * Obtener documento con información de colaboradores activos
   */
  async getDocument(documentId, tenantId) {
    try {
      const document = await collabEditingDAO.getDocumentByIdAndTenant(documentId, tenantId);

      if (!document) {
        throw new Error('Documento no encontrado');
      }

      // Obtener colaboradores activos (últimas 5 minutos)
      const activeUsers = await collabEditingDAO.getActiveUsers(documentId);

      return {
        ...document,
        activeUsers,
      };
    } catch (error) {
      logger.error('[COLLAB-EDIT] Error al obtener documento', {
        error: error.message,
        documentId,
      });
      throw error;
    }
  }

  /**
   * Aplicar operación de edición con Operational Transformation
   */
  async applyOperation(documentId, tenantId, userId, operation) {
    try {
      const { type, position, content, version } = operation;

      // Obtener documento actual
      const currentDoc = await collabEditingDAO.getDocumentContentAndVersion(documentId, tenantId);

      if (!currentDoc) {
        throw new Error('Documento no encontrado');
      }

      let newContent = currentDoc.content;
      const currentVersion = currentDoc.version;

      // Verificar versión (prevención de conflictos)
      if (version !== currentVersion) {
        logger.warn('[COLLAB-EDIT] Conflict de versión detectado', {
          documentId,
          clientVersion: version,
          serverVersion: currentVersion,
        });
        // Aquí se aplicaría Operational Transformation real
        // Por simplicidad, retornamos la versión actual del servidor
        return {
          documentId,
          content: newContent,
          version: currentVersion,
          conflict: true,
        };
      }

      // Aplicar operación según tipo
      switch (type) {
        case OperationType.INSERT:
          newContent =
            newContent.slice(0, position) + content + newContent.slice(position);
          break;

        case OperationType.DELETE:
          const deleteLength = content.length || 1;
          newContent =
            newContent.slice(0, position) + newContent.slice(position + deleteLength);
          break;

        case OperationType.RETAIN:
          // No modifica contenido, solo avanza cursor
          break;

        default:
          throw new Error(`Tipo de operación no soportado: ${type}`);
      }

      // Actualizar documento usando DAO
      const updatedDoc = await collabEditingDAO.updateDocumentContent(documentId, tenantId, newContent);

      // Registrar operación en historial usando DAO
      await collabEditingDAO.recordOperation({
        documentId, userId, type, position, content,
        versionBefore: currentVersion,
        versionAfter: updatedDoc.version
      });

      // Actualizar actividad del usuario
      await this.updateUserActivity(documentId, userId);

      logger.info('[COLLAB-EDIT] Operación aplicada', {
        documentId,
        userId,
        type,
        versionBefore: currentVersion,
        versionAfter: updatedDoc.version,
      });

      return {
        documentId,
        content: updatedDoc.content,
        version: updatedDoc.version,
        conflict: false,
      };
    } catch (error) {
      logger.error('[COLLAB-EDIT] Error al aplicar operación', {
        error: error.message,
        documentId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Actualizar actividad del usuario en documento
   */
  async updateUserActivity(documentId, userId) {
    try {
      await collabEditingDAO.updateUserActivity(documentId, userId);
    } catch (error) {
      logger.error('[COLLAB-EDIT] Error al actualizar actividad', {
        error: error.message,
        documentId,
        userId,
      });
    }
  }

  /**
   * Obtener historial de operaciones de un documento
   */
  async getOperationHistory(documentId, tenantId, limit = 50) {
    try {
      return await collabEditingDAO.getOperationHistory(documentId, limit);
    } catch (error) {
      logger.error('[COLLAB-EDIT] Error al obtener historial', {
        error: error.message,
        documentId,
      });
      throw error;
    }
  }

  /**
   * Bloquear documento (para edición exclusiva)
   */
  async lockDocument(documentId, tenantId, userId) {
    try {
      const result = await collabEditingDAO.lockDocument(documentId, tenantId, userId);

      if (!result) {
        throw new Error('Documento ya está bloqueado por otro usuario');
      }

      logger.info('[COLLAB-EDIT] Documento bloqueado', {
        documentId,
        userId,
      });

      return result;
    } catch (error) {
      logger.error('[COLLAB-EDIT] Error al bloquear documento', {
        error: error.message,
        documentId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Desbloquear documento
   */
  async unlockDocument(documentId, tenantId, userId) {
    try {
      const result = await collabEditingDAO.unlockDocument(documentId, tenantId, userId);

      if (!result) {
        throw new Error('Documento no estaba bloqueado por este usuario');
      }

      logger.info('[COLLAB-EDIT] Documento desbloqueado', {
        documentId,
        userId,
      });

      return result;
    } catch (error) {
      logger.error('[COLLAB-EDIT] Error al desbloquear documento', {
        error: error.message,
        documentId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Listar documentos del tenant
   */
  async listDocuments(tenantId, userId, options = {}) {
    try {
      return await collabEditingDAO.listDocuments(tenantId, options);
    } catch (error) {
      logger.error('[COLLAB-EDIT] Error al listar documentos', {
        error: error.message,
        tenantId,
      });
      throw error;
    }
  }

  /**
   * Eliminar documento
   */
  async deleteDocument(documentId, tenantId, userId) {
    try {
      // Verificar que el usuario es el creador o es admin
      const result = await collabEditingDAO.deleteDocument(documentId, tenantId, userId);

      if (!result) {
        throw new Error('Documento no encontrado o no tienes permisos');
      }

      logger.info('[COLLAB-EDIT] Documento eliminado', {
        documentId,
        userId,
      });

      return { deleted: true };
    } catch (error) {
      logger.error('[COLLAB-EDIT] Error al eliminar documento', {
        error: error.message,
        documentId,
        userId,
      });
      throw error;
    }
  }
}

module.exports = new CollaborativeEditingService();
module.exports.OperationType = OperationType;
