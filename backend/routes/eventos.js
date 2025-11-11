/**
 * 📅 API CRUD PARA EVENTOS - PostgreSQL
 * Sistema de gestión de eventos del CMS
 * Fecha: 18 Octubre 2025
 */

const express = require('express');
const devLogger = require('../utils/devLogger');
const router = express.Router();
const { pool } = require('../config/database');
const { body, validationResult } = require('express-validator');
const { cacheMiddleware, TTL_CONFIG } = require('../middleware/cache');

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
// POST /api/eventos - Crear nuevo evento
// =====================================================
router.post('/', [
    body('titulo').trim().notEmpty().withMessage('Título requerido'),
    body('descripcion').trim().notEmpty().withMessage('Descripción requerida'),
    body('fecha_inicio').trim().notEmpty().withMessage('Fecha de inicio requerida')
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
        descripcion,
        imagen_url,
        fecha_inicio,
        fecha_fin,
        ubicacion,
        modalidad,
        link_virtual,
        categoria,
        tipo,
        etiquetas,
        estado,
        organizador,
        organizador_id,
        contacto_email,
        contacto_telefono,
        capacidad_maxima,
        inscripciones_abiertas,
        requiere_inscripcion,
        destacado
    } = req.body;

    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');

    try {
        // Generar slug único
        let slug = generateSlug(titulo);

        // Verificar si el slug ya existe
        const slugCheck = await pool.query('SELECT id FROM eventos WHERE slug = $1', [slug]);
        if (slugCheck.rows.length > 0) {
            slug = `${slug}-${Date.now()}`;
        }

        const query = `
            INSERT INTO eventos (
                titulo, descripcion, imagen_url,
                fecha_inicio, fecha_fin, ubicacion, modalidad, link_virtual,
                categoria, tipo, etiquetas, estado,
                organizador, organizador_id, contacto_email, contacto_telefono,
                capacidad_maxima, inscripciones_abiertas, requiere_inscripcion,
                slug, destacado, ip_address, user_agent
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
            RETURNING *;
        `;

        const result = await pool.query(query, [
            titulo,
            descripcion,
            imagen_url || null,
            fecha_inicio,
            fecha_fin || null,
            ubicacion || null,
            modalidad || 'presencial',
            link_virtual || null,
            categoria || 'General',
            tipo || null,
            etiquetas || [],
            estado || 'borrador',
            organizador || null,
            organizador_id || null,
            contacto_email || null,
            contacto_telefono || null,
            capacidad_maxima || null,
            inscripciones_abiertas !== undefined ? inscripciones_abiertas : true,
            requiere_inscripcion !== undefined ? requiere_inscripcion : false,
            slug,
            destacado || false,
            ip_address,
            user_agent
        ]);

        devLogger.log('✅ Nuevo evento creado:', result.rows[0].id);

        res.status(201).json({
            success: true,
            message: 'Evento creado exitosamente',
            data: result.rows[0]
        });

    } catch (error) {
        devLogger.error('❌ Error al crear evento:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear el evento'
        });
    }
});

// =====================================================
// GET /api/eventos - Listar todos los eventos
// =====================================================
router.get('/', async (req, res) => {
    const { estado, categoria, modalidad, destacado, limit = 50, offset = 0 } = req.query;

    try {
        let query = 'SELECT * FROM eventos WHERE 1=1';
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

        if (modalidad) {
            paramCount++;
            query += ` AND modalidad = $${paramCount}`;
            params.push(modalidad);
        }

        if (destacado !== undefined) {
            paramCount++;
            query += ` AND destacado = $${paramCount}`;
            params.push(destacado === 'true');
        }

        query += ` ORDER BY fecha_inicio DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Contar total
        let countQuery = 'SELECT COUNT(*) FROM eventos WHERE 1=1';
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

        if (modalidad) {
            countParamCount++;
            countQuery += ` AND modalidad = $${countParamCount}`;
            countParams.push(modalidad);
        }

        if (destacado !== undefined) {
            countParamCount++;
            countQuery += ` AND destacado = $${countParamCount}`;
            countParams.push(destacado === 'true');
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
        devLogger.error('❌ Error al obtener eventos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener eventos'
        });
    }
});

// =====================================================
// GET /api/eventos/stats - Estadísticas (con caché)
// =====================================================
router.get('/stats', cacheMiddleware({ ttl: TTL_CONFIG.stats }), async (req, res) => {
    try {
        const query = `
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE estado = 'publicado') as publicadas,
                COUNT(*) FILTER (WHERE estado = 'borrador') as borradores,
                COUNT(*) FILTER (WHERE estado = 'cancelado') as cancelados,
                COUNT(*) FILTER (WHERE estado = 'finalizado') as finalizados,
                COUNT(*) FILTER (WHERE destacado = true) as destacados,
                COUNT(*) FILTER (WHERE modalidad = 'presencial') as presenciales,
                COUNT(*) FILTER (WHERE modalidad = 'virtual') as virtuales,
                COUNT(*) FILTER (WHERE modalidad = 'híbrido') as hibridos
            FROM eventos;
        `;

        const result = await pool.query(query);

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        devLogger.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

// =====================================================
// GET /api/eventos/:id - Obtener un evento
// =====================================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM eventos WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Evento no encontrado'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        devLogger.error('❌ Error al obtener evento:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener el evento'
        });
    }
});

// =====================================================
// GET /api/eventos/slug/:slug - Obtener por slug
// =====================================================
router.get('/slug/:slug', async (req, res) => {
    const { slug } = req.params;

    try {
        const result = await pool.query('SELECT * FROM eventos WHERE slug = $1', [slug]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Evento no encontrado'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        devLogger.error('❌ Error al obtener evento:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener el evento'
        });
    }
});

// =====================================================
// PUT /api/eventos/:id - Actualizar evento
// =====================================================
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const {
        titulo,
        descripcion,
        imagen_url,
        fecha_inicio,
        fecha_fin,
        ubicacion,
        modalidad,
        link_virtual,
        categoria,
        tipo,
        etiquetas,
        estado,
        organizador,
        contacto_email,
        contacto_telefono,
        capacidad_maxima,
        inscripciones_abiertas,
        requiere_inscripcion,
        destacado
    } = req.body;

    try {
        let updateQuery = `
            UPDATE eventos
            SET
                titulo = COALESCE($1, titulo),
                descripcion = COALESCE($2, descripcion),
                imagen_url = COALESCE($3, imagen_url),
                fecha_inicio = COALESCE($4, fecha_inicio),
                fecha_fin = COALESCE($5, fecha_fin),
                ubicacion = COALESCE($6, ubicacion),
                modalidad = COALESCE($7, modalidad),
                link_virtual = COALESCE($8, link_virtual),
                categoria = COALESCE($9, categoria),
                tipo = COALESCE($10, tipo),
                etiquetas = COALESCE($11, etiquetas),
                estado = COALESCE($12, estado),
                organizador = COALESCE($13, organizador),
                contacto_email = COALESCE($14, contacto_email),
                contacto_telefono = COALESCE($15, contacto_telefono),
                capacidad_maxima = COALESCE($16, capacidad_maxima),
                inscripciones_abiertas = COALESCE($17, inscripciones_abiertas),
                requiere_inscripcion = COALESCE($18, requiere_inscripcion),
                destacado = COALESCE($19, destacado),
                fecha_modificacion = NOW()
            WHERE id = $20
            RETURNING *;
        `;

        const result = await pool.query(updateQuery, [
            titulo,
            descripcion,
            imagen_url,
            fecha_inicio,
            fecha_fin,
            ubicacion,
            modalidad,
            link_virtual,
            categoria,
            tipo,
            etiquetas,
            estado,
            organizador,
            contacto_email,
            contacto_telefono,
            capacidad_maxima,
            inscripciones_abiertas,
            requiere_inscripcion,
            destacado,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Evento no encontrado'
            });
        }

        devLogger.log(`✅ Evento ${id} actualizado`);

        res.json({
            success: true,
            message: 'Evento actualizado correctamente',
            data: result.rows[0]
        });

    } catch (error) {
        devLogger.error('❌ Error al actualizar evento:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar el evento'
        });
    }
});

// =====================================================
// DELETE /api/eventos/:id - Eliminar (cancelar) evento
// =====================================================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Cancelar en lugar de eliminar
        const result = await pool.query(`
            UPDATE eventos
            SET estado = 'cancelado', fecha_modificacion = NOW()
            WHERE id = $1
            RETURNING id, titulo
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Evento no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Evento cancelado correctamente'
        });

    } catch (error) {
        devLogger.error('❌ Error al cancelar evento:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cancelar el evento'
        });
    }
});

/**
 * GET /api/eventos/calendar
 * Obtener eventos en formato FullCalendar
 */
router.get('/calendar', async (req, res) => {
    try {
        const { start, end, categoria, modalidad } = req.query;

        let query = `
            SELECT
                id,
                slug,
                titulo as title,
                descripcion,
                fecha_inicio as start,
                fecha_fin as end,
                categoria,
                modalidad,
                ubicacion,
                cupo_maximo,
                inscripciones_actuales,
                destacado,
                color_hex
            FROM eventos
            WHERE estado = 'publicado'
        `;

        const params = [];
        let paramCount = 1;

        // Filtro por rango de fechas
        if (start) {
            query += ` AND fecha_inicio >= $${paramCount}`;
            params.push(start);
            paramCount++;
        }

        if (end) {
            query += ` AND fecha_fin <= $${paramCount}`;
            params.push(end);
            paramCount++;
        }

        // Filtro por categoría
        if (categoria && categoria !== 'todas') {
            query += ` AND categoria = $${paramCount}`;
            params.push(categoria);
            paramCount++;
        }

        // Filtro por modalidad
        if (modalidad && modalidad !== 'todas') {
            query += ` AND modalidad = $${paramCount}`;
            params.push(modalidad);
            paramCount++;
        }

        query += ` ORDER BY fecha_inicio ASC`;

        const result = await pool.query(query, params);

        // Formatear eventos para FullCalendar
        const events = result.rows.map(evento => ({
            id: evento.id,
            title: evento.title,
            start: evento.start,
            end: evento.end,
            description: evento.descripcion,
            extendedProps: {
                categoria: evento.categoria,
                modalidad: evento.modalidad,
                ubicacion: evento.ubicacion,
                cupoMaximo: evento.cupo_maximo,
                inscripciones: evento.inscripciones_actuales,
                destacado: evento.destacado,
                slug: evento.slug
            },
            backgroundColor: evento.color_hex || '#3788d8',
            borderColor: evento.color_hex || '#3788d8',
            textColor: '#ffffff'
        }));

        res.json({
            success: true,
            events
        });
    } catch (error) {
        devLogger.error('Error en /calendar:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener eventos para calendario'
        });
    }
});

module.exports = router;
