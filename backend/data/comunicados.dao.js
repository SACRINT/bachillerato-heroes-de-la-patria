"use strict";
/**
 * 📢 COMUNICADOS DAO - TypeScript
 * Capa de acceso a datos para comunicados.
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require('../config/database.js');
// =====================================================
// COMUNICADOS DAO CLASS
// =====================================================
class ComunicadosDAO {
    static async slugExists(slug) {
        const result = await (0, database_1.executeQuery)('SELECT id FROM comunicados WHERE slug = $1', [slug]);
        return result.length > 0;
    }
    static async create(data) {
        const { titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, autor, autor_id, slug, meta_descripcion, destacada, ip_address, user_agent } = data;
        const fecha_pub = estado === 'publicada' ? new Date() : null;
        const query = `
            INSERT INTO comunicados (
                titulo, contenido, resumen, imagen_url, categoria, etiquetas,
                estado, autor, autor_id, slug, meta_descripcion, destacada,
                ip_address, user_agent, fecha_publicacion
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *;
        `;
        const result = await (0, database_1.executeQuery)(query, [
            titulo, contenido, resumen || null, imagen_url || null,
            categoria || 'General', etiquetas || [], estado || 'borrador',
            autor, autor_id || null, slug,
            meta_descripcion || resumen || contenido.substring(0, 160),
            destacada || false, ip_address, user_agent, fecha_pub
        ]);
        return result[0];
    }
    static async getAll(filters) {
        const { estado, categoria, destacada, limit = 50, offset = 0 } = filters;
        let query = 'SELECT * FROM comunicados WHERE 1=1';
        const params = [];
        let paramCount = 0;
        if (estado) {
            paramCount++;
            query += ` AND estado = $${paramCount}`;
            params.push(estado);
        }
        if (categoria) {
            paramCount++;
            query += ` AND categoria = $${paramCount}`;
            params.push(categoria);
        }
        if (destacada !== undefined) {
            paramCount++;
            query += ` AND destacada = $${paramCount}`;
            params.push(destacada === 'true' || destacada === true);
        }
        query += ` ORDER BY fecha_creacion DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);
        const comunicados = await (0, database_1.executeQuery)(query, params);
        let countQuery = 'SELECT COUNT(*) FROM comunicados WHERE 1=1';
        const countParams = [];
        let cp = 0;
        if (estado) {
            cp++;
            countQuery += ` AND estado = $${cp}`;
            countParams.push(estado);
        }
        if (categoria) {
            cp++;
            countQuery += ` AND categoria = $${cp}`;
            countParams.push(categoria);
        }
        if (destacada !== undefined) {
            cp++;
            countQuery += ` AND destacada = $${cp}`;
            countParams.push(destacada === 'true' || destacada === true);
        }
        const countResult = await (0, database_1.executeQuery)(countQuery, countParams);
        return { comunicados, total: parseInt(countResult[0].count) };
    }
    static async getStats() {
        const query = `
            SELECT COUNT(*) as total,
                COUNT(*) FILTER (WHERE estado = 'publicada') as publicadas,
                COUNT(*) FILTER (WHERE estado = 'borrador') as borradores,
                COUNT(*) FILTER (WHERE destacada = true) as destacadas,
                SUM(vistas) as vistas_totales
            FROM comunicados;
        `;
        const result = await (0, database_1.executeQuery)(query, []);
        return result[0];
    }
    static async getById(id) {
        const result = await (0, database_1.executeQuery)('SELECT * FROM comunicados WHERE id = $1', [id]);
        return result[0] || null;
    }
    static async getBySlug(slug) {
        const result = await (0, database_1.executeQuery)('SELECT * FROM comunicados WHERE slug = $1', [slug]);
        return result[0] || null;
    }
    static async incrementViews(identifier, type = 'id') {
        const query = type === 'slug'
            ? 'UPDATE comunicados SET vistas = vistas + 1 WHERE slug = $1'
            : 'UPDATE comunicados SET vistas = vistas + 1 WHERE id = $1';
        await (0, database_1.executeQuery)(query, [identifier]);
    }
    static async update(id, data) {
        const { titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, meta_descripcion, destacada } = data;
        const query = `
            UPDATE comunicados SET
                titulo = COALESCE($1, titulo), contenido = COALESCE($2, contenido),
                resumen = COALESCE($3, resumen), imagen_url = COALESCE($4, imagen_url),
                categoria = COALESCE($5, categoria), etiquetas = COALESCE($6, etiquetas),
                estado = COALESCE($7, estado), meta_descripcion = COALESCE($8, meta_descripcion),
                destacada = COALESCE($9, destacada), fecha_modificacion = NOW(),
                fecha_publicacion = CASE WHEN $7 = 'publicada' AND fecha_publicacion IS NULL THEN NOW() ELSE fecha_publicacion END
            WHERE id = $10 RETURNING *;
        `;
        const result = await (0, database_1.executeQuery)(query, [titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, meta_descripcion, destacada, id]);
        return result[0] || null;
    }
    static async archive(id) {
        const query = `UPDATE comunicados SET estado = 'archivada', fecha_modificacion = NOW() WHERE id = $1 RETURNING id, titulo`;
        const result = await (0, database_1.executeQuery)(query, [id]);
        return result[0] || null;
    }
}
exports.default = ComunicadosDAO;
module.exports = ComunicadosDAO;
//# sourceMappingURL=comunicados.dao.js.map