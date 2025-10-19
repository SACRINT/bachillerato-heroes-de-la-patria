/**
 * 📰 API CRUD PARA NOTICIAS - PostgreSQL
 * Sistema de gestión de avisos del CMS
 * Fecha: 17 Octubre 2025
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { body, validationResult } = require('express-validator');

// Función para generar slug
function generateSlug(titulo) {
    return titulo
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
        .replace(/\s+/g, '-') // Reemplazar espacios con guiones
        .replace(/-+/g, '-') // Remover guiones múltiples
        .substring(0, 300); // Limitar longitud
}

// =====================================================
// POST /api/avisos - Crear nueva aviso
// =====================================================
router.post('/', [
    body('titulo').trim().notEmpty().withMessage('Título requerido'),
    body('contenido').trim().notEmpty().withMessage('Contenido requerido'),
    body('autor').trim().notEmpty().withMessage('Autor requerido')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const {
        titulo,
        contenido,
        resumen,
        imagen_url,
        categoria,
        etiquetas,
        estado,
        autor,
        autor_id,
        meta_descripcion,
        destacada
    } = req.body;

    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');

    try {
        // Generar slug único
        let slug = generateSlug(titulo);

        // Verificar si el slug ya existe
        const slugCheck = await pool.query('SELECT id FROM avisos WHERE slug = $1', [slug]);
        if (slugCheck.rows.length > 0) {
            slug = `${slug}-${Date.now()}`;
        }

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

        const fecha_pub = estado === 'publicada' ? new Date() : null;

        const result = await pool.query(query, [
            titulo,
            contenido,
            resumen || null,
            imagen_url || null,
            categoria || 'General',
            etiquetas || [],
            estado || 'borrador',
            autor,
            autor_id || null,
            slug,
            meta_descripcion || resumen || contenido.substring(0, 160),
            destacada || false,
            ip_address,
            user_agent,
            fecha_pub
        ]);

        console.log('✅ Nueva aviso creada:', result.rows[0].id);

        res.status(201).json({
            success: true,
            message: 'Aviso creada exitosamente',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error al crear aviso:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear la aviso'
        });
    }
});

// =====================================================
// GET /api/avisos - Listar todas las avisos
// =====================================================
router.get('/', async (req, res) => {
    const { estado, categoria, destacada, limit = 50, offset = 0 } = req.query;

    try {
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
            params.push(destacada === 'true');
        }

        query += ` ORDER BY fecha_creacion DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

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
            countParams.push(destacada === 'true');
        }

        const countResult = await pool.query(countQuery, countParams);

        res.json({
            success: true,
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('❌ Error al obtener avisos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener avisos'
        });
    }
});

// =====================================================
// GET /api/avisos/stats - Estadísticas
// =====================================================
router.get('/stats', async (req, res) => {
    try {
        const query = `
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE estado = 'publicada') as publicadas,
                COUNT(*) FILTER (WHERE estado = 'borrador') as borradores,
                COUNT(*) FILTER (WHERE destacada = true) as destacadas,
                SUM(vistas) as vistas_totales
            FROM avisos;
        `;

        const result = await pool.query(query);

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

// =====================================================
// GET /api/avisos/:id - Obtener una aviso
// =====================================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM avisos WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Aviso no encontrada'
            });
        }

        // Incrementar vistas
        await pool.query('UPDATE avisos SET vistas = vistas + 1 WHERE id = $1', [id]);

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error al obtener aviso:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener la aviso'
        });
    }
});

// =====================================================
// GET /api/avisos/slug/:slug - Obtener por slug
// =====================================================
router.get('/slug/:slug', async (req, res) => {
    const { slug } = req.params;

    try {
        const result = await pool.query('SELECT * FROM avisos WHERE slug = $1', [slug]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Aviso no encontrada'
            });
        }

        // Incrementar vistas
        await pool.query('UPDATE avisos SET vistas = vistas + 1 WHERE slug = $1', [slug]);

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error al obtener aviso:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener la aviso'
        });
    }
});

// =====================================================
// PUT /api/avisos/:id - Actualizar aviso
// =====================================================
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const {
        titulo,
        contenido,
        resumen,
        imagen_url,
        categoria,
        etiquetas,
        estado,
        meta_descripcion,
        destacada
    } = req.body;

    try {
        // Si cambia a publicada y no tenía fecha de publicación, establecerla
        let updateQuery = `
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

        const result = await pool.query(updateQuery, [
            titulo,
            contenido,
            resumen,
            imagen_url,
            categoria,
            etiquetas,
            estado,
            meta_descripcion,
            destacada,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Aviso no encontrada'
            });
        }

        console.log(`✅ Aviso ${id} actualizada`);

        res.json({
            success: true,
            message: 'Aviso actualizada correctamente',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error al actualizar aviso:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar la aviso'
        });
    }
});

// =====================================================
// DELETE /api/avisos/:id - Eliminar aviso
// =====================================================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Archivar en lugar de eliminar
        const result = await pool.query(`
            UPDATE avisos
            SET estado = 'archivada', fecha_modificacion = NOW()
            WHERE id = $1
            RETURNING id, titulo
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Aviso no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Aviso archivada correctamente'
        });

    } catch (error) {
        console.error('❌ Error al archivar aviso:', error);
        res.status(500).json({
            success: false,
            error: 'Error al archivar la aviso'
        });
    }
});

module.exports = router;
