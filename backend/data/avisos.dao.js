/**
 * 📰 AVISOS DAO (Data Access Object)
 * Capa de acceso a datos para avisos/noticias.
 * 
 * @author Gemini Code
 * @date 2025-12-05
 * @version 1.0.0
 */

const { executeQuery } = require('../config/database');
const devLogger = require('../utils/devLogger');

class AvisosDAO {

    /**
     * Verificar si un slug ya existe
     * @param {string} slug - Slug a verificar
     * @returns {Promise<boolean>}
     */
    static async slugExists(slug) {
        const query = 'SELECT id FROM avisos WHERE slug = $1';
        const result = await executeQuery(query, [slug]);
        return result.length > 0;
    }

    /**
     * Crear un nuevo aviso
     * @param {Object} avisoData - Datos del aviso
     * @returns {Promise<Object>} Aviso creado
     */
    static async create(avisoData) {
        const {
            titulo, contenido, resumen, imagen_url, categoria,
            etiquetas, estado, autor, autor_id, slug,
            meta_descripcion, destacada, ip_address, user_agent
        } = avisoData;

        const fecha_pub = estado === 'publicada' ? new Date() : null;

        const query = `
            INSERT INTO avisos (
                titulo, contenido, resumen, imagen_url, categoria,
                etiquetas, estado, autor, autor_id, slug,
                meta_descripcion, destacada, ip_address, user_agent,
                fecha_publicacion
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *;
        `;

        const result = await executeQuery(query, [
            titulo, contenido, resumen || null, imagen_url || null,
            categoria || 'General', etiquetas || [], estado || 'borrador',
            autor, autor_id || null, slug,
            meta_descripcion || resumen || contenido.substring(0, 160),
            destacada || false, ip_address, user_agent, fecha_pub
        ]);

        return result[0];
    }

    /**
     * Obtener avisos con filtros y paginación
     * @param {Object} options - Opciones de consulta
     * @returns {Promise<Object>} Avisos y total
     */
    static async getAll({ estado, categoria, destacada, limit = 50, offset = 0 }) {
        let query = 'SELECT * FROM avisos WHERE 1=1';
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
        params.push(parseInt(limit), parseInt(offset));

        const avisos = await executeQuery(query, params);

        // Contar total
        let countQuery = 'SELECT COUNT(*) FROM avisos WHERE 1=1';
        const countParams = [];
        let countParamCount = 0;

        if (estado) {
            countParamCount++;
            countQuery += ` AND estado = $${countParamCount}`;
            countParams.push(estado);
        }

        if (categoria) {
            countParamCount++;
            countQuery += ` AND categoria = $${countParamCount}`;
            countParams.push(categoria);
        }

        if (destacada !== undefined) {
            countParamCount++;
            countQuery += ` AND destacada = $${countParamCount}`;
            countParams.push(destacada === 'true' || destacada === true);
        }

        const countResult = await executeQuery(countQuery, countParams);
        const total = parseInt(countResult[0].count);

        return { avisos, total };
    }

    /**
     * Obtener estadísticas de avisos
     * @returns {Promise<Object>} Estadísticas
     */
    static async getStats() {
        const query = `
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE estado = 'publicada') as publicadas,
                COUNT(*) FILTER (WHERE estado = 'borrador') as borradores,
                COUNT(*) FILTER (WHERE destacada = true) as destacadas,
                COALESCE(SUM(vistas), 0) as vistas_totales
            FROM avisos;
        `;

        const result = await executeQuery(query, []);
        return result[0];
    }

    /**
     * Obtener un aviso por ID
     * @param {number} id - ID del aviso
     * @returns {Promise<Object|null>}
     */
    static async getById(id) {
        const query = 'SELECT * FROM avisos WHERE id = $1';
        const result = await executeQuery(query, [id]);
        return result[0] || null;
    }

    /**
     * Obtener un aviso por slug
     * @param {string} slug - Slug del aviso
     * @returns {Promise<Object|null>}
     */
    static async getBySlug(slug) {
        const query = 'SELECT * FROM avisos WHERE slug = $1';
        const result = await executeQuery(query, [slug]);
        return result[0] || null;
    }

    /**
     * Incrementar vistas
     * @param {number|string} identifier - ID o slug
     * @param {string} type - 'id' o 'slug'
     */
    static async incrementViews(identifier, type = 'id') {
        const query = type === 'slug'
            ? 'UPDATE avisos SET vistas = vistas + 1 WHERE slug = $1'
            : 'UPDATE avisos SET vistas = vistas + 1 WHERE id = $1';
        await executeQuery(query, [identifier]);
    }

    /**
     * Actualizar un aviso
     * @param {number} id - ID del aviso
     * @param {Object} updateData - Datos a actualizar
     * @returns {Promise<Object|null>}
     */
    static async update(id, updateData) {
        const {
            titulo, contenido, resumen, imagen_url, categoria,
            etiquetas, estado, meta_descripcion, destacada
        } = updateData;

        const query = `
            UPDATE avisos
            SET
                titulo = COALESCE($1, titulo),
                contenido = COALESCE($2, contenido),
                resumen = COALESCE($3, resumen),
                imagen_url = COALESCE($4, imagen_url),
                categoria = COALESCE($5, categoria),
                etiquetas = COALESCE($6, etiquetas),
                estado = COALESCE($7, estado),
                meta_descripcion = COALESCE($8, meta_descripcion),
                destacada = COALESCE($9, destacada),
                fecha_modificacion = NOW(),
                fecha_publicacion = CASE
                    WHEN $7 = 'publicada' AND fecha_publicacion IS NULL THEN NOW()
                    ELSE fecha_publicacion
                END
            WHERE id = $10
            RETURNING *;
        `;

        const result = await executeQuery(query, [
            titulo, contenido, resumen, imagen_url, categoria,
            etiquetas, estado, meta_descripcion, destacada, id
        ]);

        return result[0] || null;
    }
}

module.exports = AvisosDAO;
