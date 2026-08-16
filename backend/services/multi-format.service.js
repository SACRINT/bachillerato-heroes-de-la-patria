/**
 * 📚 MULTI-FORMAT SERVICE
 * Propósito: Gestión unificada de Documentos, Audio y Presentaciones (Fase 5 - Semana 39)
 */

const { executeQuery } = require('../config/database.js');

class MultiFormatService {

    // --- RETRIEVAL ---

    async getContent(type, id) {
        let table = '';
        switch (type) {
            case 'document': table = 'content_documents'; break;
            case 'audio': table = 'content_audio'; break;
            case 'presentation': table = 'content_presentations'; break;
            default: throw new Error('Invalid content type');
        }

        const res = await executeQuery(`SELECT * FROM ${table} WHERE id = $1`, [id]);
        return res[0];
    }

    async getList(type) {
        let table = '';
        switch (type) {
            case 'document': table = 'content_documents'; break;
            case 'audio': table = 'content_audio'; break;
            case 'presentation': table = 'content_presentations'; break;
            default: throw new Error('Invalid content type');
        }

        return await executeQuery(`SELECT * FROM ${table} ORDER BY created_at DESC`);
    }

    // --- PROGRESS TRACKING ---

    async updateProgress(userId, type, contentId, progressData, percentComplete) {
        const isCompleted = percentComplete >= 100;

        const query = `
            INSERT INTO multi_format_progress (user_id, content_type, content_id, progress_data, percent_complete, is_completed, last_accessed_at)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, content_type, content_id)
            DO UPDATE SET 
                progress_data = $4,
                percent_complete = GREATEST(multi_format_progress.percent_complete, $5),
                is_completed = multi_format_progress.is_completed OR $6,
                last_accessed_at = CURRENT_TIMESTAMP
            RETURNING *
        `;

        const res = await executeQuery(query, [userId, type, contentId, JSON.stringify(progressData), percentComplete, isCompleted]);
        return res[0];
    }

    async getProgress(userId, type, contentId) {
        const res = await executeQuery(
            'SELECT * FROM multi_format_progress WHERE user_id = $1 AND content_type = $2 AND content_id = $3',
            [userId, type, contentId]
        );
        return res[0];
    }
}

module.exports = new MultiFormatService();
