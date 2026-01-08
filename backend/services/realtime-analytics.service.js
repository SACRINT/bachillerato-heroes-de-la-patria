/**
 * ⏱️ REAL-TIME ANALYTICS SERVICE
 * Propósito: Procesar heartbeats de usuarios y calcular métricas en vivo (Fase 6 - Semana 47)
 */

const { executeQuery } = require('../config/database');

class RealTimeAnalyticsService {

    async recordHeartbeat(userId, page, action, device) {
        // Upsert logic for session log (simplified to insert for proto)
        // In prod: update 'last_heartbeat_at' where user_id = $1
        const query = `
            INSERT INTO active_sessions_log (user_id, current_page, last_action_type, device_type, last_heartbeat_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        `;
        await executeQuery(query, [userId, page, action, device]);
        return { status: "recorded" };
    }

    async getLiveClassMetrics(classId) {
        // En un sistema real, leería de Redis o Websockets.
        // Aquí agregamos los logs de los últimos 5 minutos.

        const countRes = await executeQuery(`
            SELECT COUNT(DISTINCT user_id) as active_count 
            FROM active_sessions_log 
            WHERE last_heartbeat_at > NOW() - INTERVAL '5 minutes'
        `);

        return {
            classId: classId,
            timestamp: new Date(),
            activeStudents: parseInt(countRes[0].active_count),
            avgAttention: 85.5, // Mock calculated metric
            topCurrentPage: '/modulo-matematicas/video-1'
        };
    }
}

module.exports = new RealTimeAnalyticsService();
