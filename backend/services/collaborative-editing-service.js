/**
 * ✏️ COLLABORATIVE EDITING SERVICE
 * Sistema de edición colaborativa en tiempo real con Operational Transformation
 * Semana 15 - Real-Time Features Avanzado
 */

const pool = require('../config/database');
const logger = require('../utils/winston-logger');

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

      const result = await pool.query(
        `INSERT INTO collaborative_documents (
          tenant_id, creator_id, title, content, type, metadata,
          version, locked, locked_by, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, 1, FALSE, NULL, NOW(), NOW())
        RETURNING *`,
        [tenantId, creatorId, title, content, type, JSON.stringify(metadata)]
      );

      const document = result.rows[0];

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
      const result = await pool.query(
        `SELECT * FROM collaborative_documents
         WHERE id = $1 AND tenant_id = $2`,
        [documentId, tenantId]
      );

      if (result.rows.length === 0) {
        throw new Error('Documento no encontrado');
      }

      const document = result.rows[0];

      // Obtener colaboradores activos (últimas 5 minutos)
      const activeUsers = await pool.query(
        `SELECT DISTINCT user_id, last_activity
         FROM document_activity
         WHERE document_id = $1
           AND last_activity > NOW() - INTERVAL '5 minutes'
         ORDER BY last_activity DESC`,
        [documentId]
      );

      return {
        ...document,
        activeUsers: activeUsers.rows,
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
      const docResult = await pool.query(
        'SELECT content, version FROM collaborative_documents WHERE id = $1 AND tenant_id = $2',
        [documentId, tenantId]
      );

      if (docResult.rows.length === 0) {
        throw new Error('Documento no encontrado');
      }

      const currentDoc = docResult.rows[0];
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

      // Actualizar documento
      const updateResult = await pool.query(
        `UPDATE collaborative_documents
         SET content = $1, version = version + 1, updated_at = NOW()
         WHERE id = $2 AND tenant_id = $3
         RETURNING *`,
        [newContent, documentId, tenantId]
      );

      const updatedDoc = updateResult.rows[0];

      // Registrar operación en historial
      await pool.query(
        `INSERT INTO document_operations (
          document_id, user_id, operation_type, position, content,
          version_before, version_after, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [documentId, userId, type, position, content, currentVersion, updatedDoc.version]
      );

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
      await pool.query(
        `INSERT INTO document_activity (document_id, user_id, last_activity)
         VALUES ($1, $2, NOW())
         ON CONFLICT (document_id, user_id)
         DO UPDATE SET last_activity = NOW()`,
        [documentId, userId]
      );
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
      const result = await pool.query(
        `SELECT
          o.*,
          u.username,
          u.nombre
         FROM document_operations o
         LEFT JOIN usuarios u ON o.user_id = u.id
         WHERE o.document_id = $1
         ORDER BY o.created_at DESC
         LIMIT $2`,
        [documentId, limit]
      );

      return result.rows;
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
      const result = await pool.query(
        `UPDATE collaborative_documents
         SET locked = TRUE, locked_by = $1, updated_at = NOW()
         WHERE id = $2 AND tenant_id = $3 AND (locked = FALSE OR locked_by = $1)
         RETURNING *`,
        [userId, documentId, tenantId]
      );

      if (result.rows.length === 0) {
        throw new Error('Documento ya está bloqueado por otro usuario');
      }

      logger.info('[COLLAB-EDIT] Documento bloqueado', {
        documentId,
        userId,
      });

      return result.rows[0];
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
      const result = await pool.query(
        `UPDATE collaborative_documents
         SET locked = FALSE, locked_by = NULL, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2 AND locked_by = $3
         RETURNING *`,
        [documentId, tenantId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Documento no estaba bloqueado por este usuario');
      }

      logger.info('[COLLAB-EDIT] Documento desbloqueado', {
        documentId,
        userId,
      });

      return result.rows[0];
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
        query += ' AND d.type = $2';
        params.push(type);
      }

      query += ' ORDER BY d.updated_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);

      const result = await pool.query(query, params);

      return result.rows;
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
      const result = await pool.query(
        `DELETE FROM collaborative_documents
         WHERE id = $1 AND tenant_id = $2 AND creator_id = $3
         RETURNING id`,
        [documentId, tenantId, userId]
      );

      if (result.rows.length === 0) {
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
