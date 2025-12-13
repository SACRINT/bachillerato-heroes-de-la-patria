"use strict";
/**
 * 📰 AVISOS DAO - TypeScript
 * Capa de acceso a datos para avisos (usa tabla 'noticias').
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
// =====================================================
// AVISOS DAO CLASS
// =====================================================
class AvisosDAO {
    static async slugExists(slug) {
        try {
            const query = 'SELECT id FROM noticias WHERE slug = $1';
            const result = await (0, database_1.executeQuery)(query, [slug]);
            return result.length > 0;
        }
        catch {
            return false;
        }
    }
    static async create(avisoData) {
        const { titulo, contenido, resumen, imagen_url, categoria, estado, autor_id, destacada, slug } = avisoData;
        const isPublic = estado === 'publicada';
        const fecha_pub = new Date();
        const safeAutorId = autor_id || 1;
        const query = `
            INSERT INTO noticias (
                titulo, contenido, resumen, imagen_url, categoria,
                autor_id, publico, destacada, fecha_publicacion,
                activa, visualizaciones, slug
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, $11)
            RETURNING *;
        `;
        const result = await (0, database_1.executeQuery)(query, [
            titulo, contenido, resumen || null, imagen_url || null,
            categoria || 'general',
            safeAutorId,
            isPublic,
            destacada || false,
            fecha_pub,
            true,
            slug || titulo.toLowerCase().replace(/ /g, '-') // Fallback simple slug
        ]);
        return result[0];
    }
    static async getAll(filters) {
        const { estado, categoria, destacada, limit = 50, offset = 0 } = filters;
        let query = 'SELECT * FROM noticias WHERE 1=1';
        const params = [];
        let paramCount = 0;
        if (estado) {
            paramCount++;
            query += ` AND publico = $${paramCount}`;
            params.push(estado === 'publicada');
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
        query += ` ORDER BY fecha_publicacion DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);
        const avisos = await (0, database_1.executeQuery)(query, params);
        let countQuery = 'SELECT COUNT(*) as count FROM noticias WHERE 1=1';
        const countParams = [];
        if (estado) {
            countQuery += ` AND publico = ${estado === 'publicada' ? 'true' : 'false'}`;
        }
        if (categoria) {
            countParams.push(categoria);
            countQuery += ` AND categoria = $${countParams.length}`;
        }
        if (destacada !== undefined) {
            const isDest = (destacada === 'true' || destacada === true);
            countParams.push(isDest);
            countQuery += ` AND destacada = $${countParams.length}`;
        }
        const countResult = await (0, database_1.executeQuery)(countQuery, countParams);
        const total = parseInt(countResult[0]?.count || '0');
        return { avisos, total };
    }
    static async getStats() {
        const query = `
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE publico = true) as publicadas,
                COUNT(*) FILTER (WHERE publico = false) as borradores,
                COUNT(*) FILTER (WHERE destacada = true) as destacadas,
                COALESCE(SUM(visualizaciones), 0) as vistas_totales
            FROM noticias;
        `;
        try {
            const result = await (0, database_1.executeQuery)(query, []);
            if (!result || !result.length) {
                return { total: 0, publicadas: 0, borradores: 0, destacadas: 0, vistas_totales: 0 };
            }
            const row = result[0];
            return {
                total: Number(row.total || 0),
                publicadas: Number(row.publicadas || 0),
                borradores: Number(row.borradores || 0),
                destacadas: Number(row.destacadas || 0),
                vistas_totales: Number(row.vistas_totales || 0)
            };
        }
        catch (error) {
            console.error('[AVISOS DAO] Error getting stats:', error);
            return { total: 0, publicadas: 0, borradores: 0, destacadas: 0, vistas_totales: 0 };
        }
    }
    static async getById(id) {
        const query = 'SELECT * FROM noticias WHERE id = $1';
        const result = await (0, database_1.executeQuery)(query, [id]);
        return result[0] || null;
    }
    static async getBySlug(slug) {
        try {
            const query = 'SELECT * FROM noticias WHERE slug = $1';
            const result = await (0, database_1.executeQuery)(query, [slug]);
            return result[0] || null;
        }
        catch {
            return null;
        }
    }
    static async incrementViews(identifier, type = 'id') {
        const col = type === 'slug' ? 'slug' : 'id';
        try {
            const query = `UPDATE noticias SET visualizaciones = visualizaciones + 1 WHERE ${col} = $1`;
            await (0, database_1.executeQuery)(query, [identifier]);
        }
        catch {
            // Silent error
        }
    }
    static async update(id, updateData) {
        const { titulo, contenido, resumen, imagen_url, categoria, estado, destacada } = updateData;
        let publicoVal = null;
        if (estado)
            publicoVal = (estado === 'publicada');
        const query = `
            UPDATE noticias
            SET
                titulo = COALESCE($1, titulo),
                contenido = COALESCE($2, contenido),
                resumen = COALESCE($3, resumen),
                imagen_url = COALESCE($4, imagen_url),
                categoria = COALESCE($5, categoria),
                publico = COALESCE($6, publico),
                destacada = COALESCE($7, destacada),
                fecha_actualizacion = NOW()
            WHERE id = $8
            RETURNING *;
        `;
        const result = await (0, database_1.executeQuery)(query, [
            titulo, contenido, resumen, imagen_url, categoria,
            publicoVal, destacada, id
        ]);
        return result[0] || null;
    }
}
exports.default = AvisosDAO;
module.exports = AvisosDAO;
//# sourceMappingURL=avisos.dao.js.map