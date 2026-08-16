/**
 * 🧪 VIRTUAL LABS SERVICE
 * Propósito: Gestión de experimentos, simulación y reporte de datos (Fase 5 - Semana 36)
 */

const { executeQuery } = require('../config/database.js');

class VirtualLabsService {

    // --- CATALOG ---

    async getLabs(subject = null) {
        let query = 'SELECT * FROM virtual_labs WHERE is_active = TRUE';
        let params = [];
        if (subject) {
            query += ' AND subject = $1';
            params.push(subject);
        }
        return await executeQuery(query + ' ORDER BY title ASC', params);
    }

    async getLabById(id) {
        const res = await executeQuery('SELECT * FROM virtual_labs WHERE id = $1', [id]);
        return res[0];
    }

    // --- SESSIONS ---

    async startSession(userId, labId) {
        const query = `
            INSERT INTO lab_sessions (user_id, lab_id, status, started_at)
            VALUES ($1, $2, 'in_progress', CURRENT_TIMESTAMP)
            RETURNING id, status, state_json
        `;
        const res = await executeQuery(query, [userId, labId]);
        return res[0];
    }

    async saveState(sessionId, userId, state) {
        // Verify ownership
        await this._verifySessionOwner(sessionId, userId);

        await executeQuery(
            'UPDATE lab_sessions SET state_json = $1 WHERE id = $2',
            [JSON.stringify(state), sessionId]
        );
    }

    async logMeasurement(sessionId, userId, data) {
        await this._verifySessionOwner(sessionId, userId);

        const query = `
            INSERT INTO lab_measurements (session_id, variable_name, value, timestamp_offset_ms)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const res = await executeQuery(query, [sessionId, data.variable, data.value, data.timestamp]);
        return res[0];
    }

    async submitReport(sessionId, userId, reportData) {
        await this._verifySessionOwner(sessionId, userId);

        // 1. Close session
        await executeQuery(
            "UPDATE lab_sessions SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = $1",
            [sessionId]
        );

        // 2. Save Report
        const query = `
            INSERT INTO lab_reports (session_id, hypothesis, observations, conclusion)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `;
        const res = await executeQuery(query, [sessionId, reportData.hypothesis, reportData.observations, reportData.conclusion]);
        return res[0];
    }

    // --- HELPERS ---

    async _verifySessionOwner(sessionId, userId) {
        const res = await executeQuery('SELECT user_id FROM lab_sessions WHERE id = $1', [sessionId]);
        if (res.length === 0) throw new Error('Session not found');
        if (res[0].user_id !== userId) throw new Error('Unauthorized');
    }
}

module.exports = new VirtualLabsService();
