/**
 * 🎨 CONTENT STUDIO SERVICE
 * Propósito: Gestionar la creación de contenido interactivo (Fase 5 - Semana 33)
 */

const { executeQuery, executeTransaction } = require('../config/database.js');
const devLogger = require('../utils/devLogger.js');

class ContentStudioService {

    // --- TEMPLATES & ELEMENTS ---

    async getTemplates(category = null) {
        let query = 'SELECT * FROM studio_templates WHERE is_active = TRUE';
        const params = [];
        if (category) {
            query += ' AND category = $1';
            params.push(category);
        }
        query += ' ORDER BY created_at DESC';
        return await executeQuery(query, params);
    }

    async getElements() {
        return await executeQuery('SELECT * FROM studio_elements ORDER BY name ASC');
    }

    // --- CONTENT CRUD ---

    async createContent(userId, data) {
        const { title, description, thumbnail_url, content_json, status = 'draft' } = data;

        const query = `
            INSERT INTO studio_content (user_id, title, description, thumbnail_url, content_json, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

        const result = await executeQuery(query, [userId, title, description, thumbnail_url, content_json, status]);
        const newContent = result[0];

        // Crear la primera versión automáticamente
        await this.createVersion(newContent.id, userId, content_json, 'Initial version');

        // Log history
        await this.logEditAction(newContent.id, userId, 'created', 'Contenido interactivo creado');

        return newContent;
    }

    async getContentById(contentId) {
        const result = await executeQuery('SELECT * FROM studio_content WHERE id = $1', [contentId]);
        return result[0];
    }

    async updateContent(contentId, userId, data) {
        const { title, description, thumbnail_url, content_json, status } = data;

        // 1. Obtener contenido actual para ver si incrementamos versión
        const current = await this.getContentById(contentId);
        if (!current) throw new Error('Contenido no encontrado');

        const query = `
            UPDATE studio_content 
            SET title = COALESCE($1, title),
                description = COALESCE($2, description),
                thumbnail_url = COALESCE($3, thumbnail_url),
                content_json = COALESCE($4, content_json),
                status = COALESCE($5, status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $6
            RETURNING *
        `;

        const result = await executeQuery(query, [title, description, thumbnail_url, content_json, status, contentId]);

        // Si el JSON cambió, registramos una nueva versión
        if (content_json && JSON.stringify(content_json) !== JSON.stringify(current.content_json)) {
            const nextVersion = (current.current_version || 1) + 1;
            await this.createVersion(contentId, userId, content_json, `Update to version ${nextVersion}`);

            // Actualizar número de versión en tabla principal
            await executeQuery('UPDATE studio_content SET current_version = $1 WHERE id = $2', [nextVersion, contentId]);
        }

        await this.logEditAction(contentId, userId, 'updated', 'Contenido actualizado');

        return result[0];
    }

    // --- VERSION CONTROL ---

    async createVersion(contentId, userId, contentJson, changelog = '') {
        const lastVersionRes = await executeQuery(
            'SELECT MAX(version_number) as v FROM studio_content_versions WHERE content_id = $1',
            [contentId]
        );
        const nextVersion = (parseInt(lastVersionRes[0].v) || 0) + 1;

        const query = `
            INSERT INTO studio_content_versions (content_id, version_number, content_json, created_by, changelog)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        return await executeQuery(query, [contentId, nextVersion, contentJson, userId, changelog]);
    }

    async getVersions(contentId) {
        return await executeQuery(
            'SELECT * FROM studio_content_versions WHERE content_id = $1 ORDER BY version_number DESC',
            [contentId]
        );
    }

    // --- HISTORY & COLLABORATION ---

    async logEditAction(contentId, userId, action, details) {
        const query = `
            INSERT INTO studio_edit_history (content_id, user_id, action, details)
            VALUES ($1, $2, $3, $4)
        `;
        await executeQuery(query, [contentId, userId, action, details]);
    }

    async getEditHistory(contentId) {
        return await executeQuery(
            'SELECT h.*, u.nombre as user_name FROM studio_edit_history h JOIN usuarios u ON h.user_id = u.id WHERE h.content_id = $1 ORDER BY h.created_at DESC',
            [contentId]
        );
    }
}

module.exports = new ContentStudioService();
