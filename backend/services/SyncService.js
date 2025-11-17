/**
 * 🔄 SYNC SERVICE - SEMANA 23
 * Sincronización cross-platform entre Web, iOS y Android
 *
 * Features:
 * - Real-time sync con WebSockets
 * - Conflict resolution (last-write-wins)
 * - Delta sync (solo cambios)
 * - Offline queue management
 *
 * Fecha: 17 Noviembre 2025
 */

const { pool } = require('../config/database');
const WebSocket = require('ws');

class SyncService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> WebSocket
  }

  /**
   * Inicializa WebSocket server para sync en tiempo real
   */
  initializeWebSocketServer(server) {
    this.wss = new WebSocket.Server({ server });

    this.wss.on('connection', (ws, req) => {
      console.log('[SYNC] New WebSocket connection');

      ws.on('message', (message) => {
        this.handleMessage(ws, message);
      });

      ws.on('close', () => {
        this.removeClient(ws);
      });
    });

    console.log('[SYNC] WebSocket server initialized');
  }

  /**
   * Maneja mensajes de clientes
   */
  handleMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      const { type, payload } = data;

      switch (type) {
        case 'AUTH':
          this.authenticateClient(ws, payload.userId, payload.token);
          break;

        case 'SYNC_REQUEST':
          this.handleSyncRequest(ws, payload);
          break;

        case 'DELTA_UPDATE':
          this.handleDeltaUpdate(ws, payload);
          break;

        default:
          console.warn('[SYNC] Unknown message type:', type);
      }

    } catch (error) {
      console.error('[SYNC] Message handling error:', error);
    }
  }

  /**
   * Autentica cliente y registra WebSocket
   */
  authenticateClient(ws, userId, token) {
    // TODO: Validar token JWT
    this.clients.set(userId, ws);
    ws.userId = userId;

    ws.send(JSON.stringify({
      type: 'AUTH_SUCCESS',
      userId
    }));

    console.log(`[SYNC] Client authenticated: ${userId}`);
  }

  /**
   * Maneja solicitud de sincronización completa
   */
  async handleSyncRequest(ws, payload) {
    try {
      const { userId, lastSyncTimestamp } = payload;

      // Obtener cambios desde última sincronización
      const changes = await this.getChangesSince(userId, lastSyncTimestamp);

      ws.send(JSON.stringify({
        type: 'SYNC_RESPONSE',
        changes,
        timestamp: Date.now()
      }));

    } catch (error) {
      console.error('[SYNC] Sync request error:', error);
    }
  }

  /**
   * Maneja actualización delta (cambios individuales)
   */
  async handleDeltaUpdate(ws, payload) {
    try {
      const { userId, entity, entityId, action, data } = payload;

      // Aplicar cambio en BD
      await this.applyChange(userId, entity, entityId, action, data);

      // Propagar a otros clientes del mismo usuario
      this.broadcastToUser(userId, {
        type: 'DELTA_UPDATE',
        entity,
        entityId,
        action,
        data,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('[SYNC] Delta update error:', error);
    }
  }

  /**
   * Obtiene cambios desde timestamp
   */
  async getChangesSince(userId, timestamp) {
    const query = `
      SELECT * FROM sync_log
      WHERE user_id = $1 AND updated_at > $2
      ORDER BY updated_at ASC
    `;

    const result = await pool.query(query, [userId, new Date(timestamp)]);
    return result.rows;
  }

  /**
   * Aplica cambio en base de datos
   */
  async applyChange(userId, entity, entityId, action, data) {
    // Conflict resolution: last-write-wins
    const timestamp = Date.now();

    const query = `
      INSERT INTO sync_log (user_id, entity, entity_id, action, data, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, entity, entity_id) DO UPDATE
      SET action = EXCLUDED.action,
          data = EXCLUDED.data,
          updated_at = EXCLUDED.updated_at
    `;

    await pool.query(query, [userId, entity, entityId, action, JSON.stringify(data), new Date(timestamp)]);
  }

  /**
   * Broadcast a todos los clientes de un usuario
   */
  broadcastToUser(userId, message) {
    this.clients.forEach((ws, clientUserId) => {
      if (clientUserId === userId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  /**
   * Elimina cliente desconectado
   */
  removeClient(ws) {
    if (ws.userId) {
      this.clients.delete(ws.userId);
      console.log(`[SYNC] Client disconnected: ${ws.userId}`);
    }
  }
}

module.exports = new SyncService();
