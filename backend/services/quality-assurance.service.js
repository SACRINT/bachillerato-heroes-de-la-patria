/**
 * 🛡️ QUALITY ASSURANCE SERVICE
 * Propósito: Gestión de reportes de errores y monitoreo de salud del sistema (Fase 5 - Semana 40)
 */

const { executeQuery } = require('../config/database');

class QualityAssuranceService {

    // --- USER REPORTING ---

    async createReport(userId, data) {
        const query = `
            INSERT INTO content_quality_reports (user_id, content_type, content_id, issue_type, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const res = await executeQuery(query, [userId, data.contentType, data.contentId, data.issueType, data.description]);
        return res[0];
    }

    async getReports(filters = {}) {
        let query = 'SELECT * FROM content_quality_reports WHERE 1=1';
        const params = [];
        let pIdx = 1;

        if (filters.status) {
            query += ` AND status = $${pIdx++}`;
            params.push(filters.status);
        }

        query += ' ORDER BY created_at DESC';
        return await executeQuery(query, params);
    }

    async resolveReport(reportId, resolverUserId, note) {
        const query = `
            UPDATE content_quality_reports 
            SET status = 'resolved', resolution_note = $1, resolved_by = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `;
        const res = await executeQuery(query, [note, resolverUserId, reportId]);
        return res[0];
    }

    // --- AUTOMATED HEALTH CHECKS ---

    async runHealthCheck(checkName) {
        // En producción, esto ejecutaría lógica compleja (crawl de links, validación de hashes de archivos).
        // Aquí simulamos un chequeo.

        let status = 'pass';
        let issues = 0;
        let details = {};

        if (checkName === 'link_validator') {
            // Mock check
            issues = 0;
            details = { checked_urls: 150, broken: [] };
        } else if (checkName === 'asset_integrity') {
            status = 'warning';
            issues = 2;
            details = { missing_thumbnails: [45, 92] };
        }

        const query = `
            INSERT INTO system_health_checks (check_name, status, issues_found, details_json)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;

        const res = await executeQuery(query, [checkName, status, issues, JSON.stringify(details)]);
        return res[0];
    }

    async getHealthStatus() {
        return await executeQuery('SELECT * FROM system_health_checks ORDER BY executed_at DESC LIMIT 10');
    }
}

module.exports = new QualityAssuranceService();
