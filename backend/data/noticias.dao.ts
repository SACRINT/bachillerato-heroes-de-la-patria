/**
 * 📰 NOTICIAS DAO - TypeScript
 * Capa de acceso a datos para noticias.
 * 
 * Migración TypeScript: 06 Diciembre 2025
 */

import { executeQuery } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface NoticiaRow {
    id: number;
    titulo: string;
    contenido: string;
    resumen?: string;
    imagen_url?: string;
    categoria: string;
    etiquetas?: string[];
    estado: 'borrador' | 'publicada' | 'archivada';
    autor: string;
    autor_id?: number;
    slug: string;
    meta_descripcion?: string;
    destacada: boolean;
    ip_address?: string;
    user_agent?: string;
    vistas: number;
    fecha_publicacion?: Date;
    fecha_creacion: Date;
    fecha_modificacion?: Date;
}

export interface NoticiaCreateData {
    titulo: string;
    contenido: string;
    resumen?: string;
    imagen_url?: string;
    categoria?: string;
    etiquetas?: string[];
    estado?: string;
    autor: string;
    autor_id?: number;
    slug: string;
    meta_descripcion?: string;
    destacada?: boolean;
    ip_address?: string;
    user_agent?: string;
}

export interface NoticiaFilters {
    estado?: string;
    categoria?: string;
    destacada?: boolean | string;
    limit?: number;
    offset?: number;
}

export interface NoticiaStats {
    total: number;
    publicadas: number;
    borradores: number;
    destacadas: number;
    vistas_totales: number;
}

// =====================================================
// NOTICIAS DAO CLASS
// =====================================================

class NoticiasDAO {

    static async slugExists(slug: string): Promise<boolean> {
        const query = 'SELECT id FROM noticias WHERE slug = $1';
        const result = await executeQuery(query, [slug]);
        return result.length > 0;
    }

    static async create(noticiaData: NoticiaCreateData): Promise<NoticiaRow> {
        const {
            titulo, contenido, resumen, imagen_url, categoria,
            etiquetas, estado, autor, autor_id, slug,
            meta_descripcion, destacada, ip_address, user_agent
        } = noticiaData;

        const fecha_pub = estado === 'publicada' ? new Date() : null;

        const query = `
            INSERT INTO noticias (
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

    static async getAll(filters: NoticiaFilters): Promise<{ noticias: NoticiaRow[]; total: number }> {
        const { estado, categoria, destacada, limit = 50, offset = 0 } = filters;

        let query = 'SELECT * FROM noticias WHERE 1=1';
        const params: (string | number | boolean)[] = [];
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
        const noticias = await executeQuery(query, params);

        let countQuery = 'SELECT COUNT(*) FROM noticias WHERE 1=1';
        const countParams: (string | boolean)[] = [];
        let countParamCount = 0;
        if (estado) { countParamCount++; countQuery += ` AND estado = $${countParamCount}`; countParams.push(estado); }
        if (categoria) { countParamCount++; countQuery += ` AND categoria = $${countParamCount}`; countParams.push(categoria); }
        if (destacada !== undefined) { countParamCount++; countQuery += ` AND destacada = $${countParamCount}`; countParams.push(destacada === 'true' || destacada === true); }

        const countResult = await executeQuery(countQuery, countParams);
        return { noticias, total: parseInt(countResult[0].count) };
    }

    static async getStats(): Promise<NoticiaStats> {
        const query = `
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE estado = 'publicada') as publicadas,
                COUNT(*) FILTER (WHERE estado = 'borrador') as borradores,
                COUNT(*) FILTER (WHERE destacada = true) as destacadas,
                SUM(vistas) as vistas_totales
            FROM noticias;
        `;
        const result = await executeQuery(query, []);
        return result[0];
    }

    static async getById(id: number): Promise<NoticiaRow | null> {
        const result = await executeQuery('SELECT * FROM noticias WHERE id = $1', [id]);
        return result[0] || null;
    }

    static async getBySlug(slug: string): Promise<NoticiaRow | null> {
        const result = await executeQuery('SELECT * FROM noticias WHERE slug = $1', [slug]);
        return result[0] || null;
    }

    static async incrementViews(identifier: number | string, type: 'id' | 'slug' = 'id'): Promise<void> {
        const query = type === 'slug'
            ? 'UPDATE noticias SET vistas = vistas + 1 WHERE slug = $1'
            : 'UPDATE noticias SET vistas = vistas + 1 WHERE id = $1';
        await executeQuery(query, [identifier]);
    }

    static async update(id: number, updateData: Partial<NoticiaCreateData>): Promise<NoticiaRow | null> {
        const { titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, meta_descripcion, destacada } = updateData;

        const query = `
            UPDATE noticias SET
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
                fecha_publicacion = CASE WHEN $7 = 'publicada' AND fecha_publicacion IS NULL THEN NOW() ELSE fecha_publicacion END
            WHERE id = $10
            RETURNING *;
        `;

        const result = await executeQuery(query, [titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, meta_descripcion, destacada, id]);
        return result[0] || null;
    }
}

export default NoticiasDAO;
module.exports = NoticiasDAO;
