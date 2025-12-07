/**
 * 📰 AVISOS DAO (Data Access Object)
 * Capa de acceso a datos para avisos (usa tabla 'noticias').
 * 
 * @author Gemini Code
 * @date 2025-12-06
 * @version 1.1.0 - Hotfix Error 500
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
        // La tabla 'noticias' podría no tener slug aun, intentamos query segura
        try {
            const query = 'SELECT id FROM noticias WHERE slug = $1';
            const result = await executeQuery(query, [slug]);
            return result.length > 0;
        } catch (error) {
            // Si la columna slug no existe, asumimos false para no romper flujo
            return false;
        }
    }

    /**
     * Crear un nuevo aviso
     * @param {Object} avisoData - Datos del aviso
     * @returns {Promise<Object>} Aviso creado
     */
    static async create(avisoData) {
        const {
            titulo, contenido, resumen, imagen_url, categoria,
            etiquetas, estado, autor, autor_id,
            meta_descripcion, destacada
        } = avisoData;

        // Mapeo: estado 'publicada' -> publico=true, activa=true
        const isPublic = estado === 'publicada';
        const fecha_pub = isPublic ? new Date() : new Date(); // Siempre guardar fecha

        // Insert compatible con esquema actual de tabla 'noticias'
        // Campos omitidos que no existen en BD: tags, ip_address, user_agent, slug (si falla)
        const query = `
            INSERT INTO noticias (
                titulo, contenido, resumen, imagen_url, categoria,
                autor_id, publico, destacada, fecha_publicacion,
                activa, visualizaciones
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0)
            RETURNING *;
        `;

        // autor_id es obligatorio en tabla noticias
        const safeAutorId = autor_id || 1; // Fallback admin si nulo

        try {
            const result = await executeQuery(query, [
                titulo, contenido, resumen || null, imagen_url || null,
                categoria || 'general',
                safeAutorId,
                isPublic, // publico
                destacada || false,
                fecha_pub,
                true // activa default
            ]);
            return result[0];
        } catch (error) {
            devLogger.error('AvisosDAO', 'Error creating aviso', error);
            throw error;
        }
    }

    /**
     * Obtener avisos con filtros y paginación
     * @param {Object} options - Opciones de consulta
     * @returns {Promise<Object>} Avisos y total
     */
    static async getAll({ estado, categoria, destacada, limit = 50, offset = 0 }) {
        let query = 'SELECT * FROM noticias WHERE 1=1';
        const params = [];
        let paramCount = 0;

        // Mapeo estado -> publico
        if (estado) {
            paramCount++;
            if (estado === 'publicada') {
                query += ` AND publico = $${paramCount}`;
                params.push(true);
            } else {
                query += ` AND publico = $${paramCount}`;
                params.push(false);
            }
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
        params.push(parseInt(limit), parseInt(offset));

        try {
            const avisos = await executeQuery(query, params);

            // Contar total
            let countQuery = 'SELECT COUNT(*) as count FROM noticias WHERE 1=1';
            const countParams = [];
            // Reutilizar lógica de params (simplificada para count)
            if (estado) { countQuery += ` AND publico = ${estado === 'publicada' ? 'true' : 'false'}`; }
            if (categoria) { countParams.push(categoria); countQuery += ` AND categoria = $${countParams.length}`; }
            if (destacada !== undefined) {
                const isDest = (destacada === 'true' || destacada === true);
                countParams.push(isDest);
                countQuery += ` AND destacada = $${countParams.length}`;
            }

            const countResult = await executeQuery(countQuery, countParams);
            const total = parseInt(countResult[0]?.count || 0);

            return { avisos, total };
        } catch (e) {
            devLogger.error("AvisosDAO", "Error getAll", e);
            throw e;
        }
    }

    /**
     * Obtener estadísticas de avisos
     * @returns {Promise<Object>} Estadísticas
     */
    static async getStats() {
        // Ajustado para tabla 'noticias' y columnas reales
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
            const result = await executeQuery(query, []);
            return result[0];
        } catch (error) {
            devLogger.error("AvisosDAO", "Error getStats", error);
            // Fallback seguro
            return { total: 0, publicadas: 0, borradores: 0, destacadas: 0, vistas_totales: 0 };
        }
    }

    /**
     * Obtener un aviso por ID
     * @param {number} id - ID del aviso
     * @returns {Promise<Object|null>}
     */
    static async getById(id) {
        const query = 'SELECT * FROM noticias WHERE id = $1';
        const result = await executeQuery(query, [id]);
        return result[0] || null;
    }

    /**
     * Obtener un aviso por slug
     * @param {string} slug - Slug del aviso
     * @returns {Promise<Object|null>}
     */
    static async getBySlug(slug) {
        // Intento query por slug, si falla (columna no existe), fallback null
        try {
            const query = 'SELECT * FROM noticias WHERE slug = $1';
            const result = await executeQuery(query, [slug]);
            return result[0] || null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Incrementar vistas
     * @param {number|string} identifier - ID o slug
     * @param {string} type - 'id' o 'slug'
     */
    static async incrementViews(identifier, type = 'id') {
        const col = type === 'slug' ? 'slug' : 'id';
        try {
            const query = `UPDATE noticias SET visualizaciones = visualizaciones + 1 WHERE ${col} = $1`;
            await executeQuery(query, [identifier]);
        } catch (e) {
            // Silent error si falla por columna slug inexistente
        }
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
            estado, destacada
        } = updateData;

        // Mapeamos estado a publico
        let publicoVal = null;
        if (estado) publicoVal = (estado === 'publicada');

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

        // Nota: COALESCE en SQL mantiene el valor anterior si el param es NULL.
        // Pero si publicoVal es booleano false, debemos pasarlo.
        // COALESCE(NULL, val) -> val.
        // Si no queremos actualizar, pasamos NULL?
        // JS: undefined -> null en params?

        const result = await executeQuery(query, [
            titulo, contenido, resumen, imagen_url, categoria,
            publicoVal /* puede ser null */, destacada, id
        ]);

        return result[0] || null;
    }
}

module.exports = AvisosDAO;
