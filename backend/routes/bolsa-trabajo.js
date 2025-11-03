/**
 * 💼 API CRUD PARA BOLSA DE TRABAJO - PostgreSQL
 * Gestión completa de CVs y candidatos
 * Fecha: 17 Octubre 2025
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { body, validationResult } = require('express-validator');

// =====================================================
// POST /api/bolsa-trabajo/cv - Crear perfil de CV
// =====================================================
router.post('/cv', [
    body('name').trim().notEmpty().withMessage('Nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('phone').trim().notEmpty().withMessage('Teléfono es requerido'),
    body('graduationYear').notEmpty().withMessage('Año de egreso es requerido'),
    body('subject').trim().notEmpty().withMessage('Área de interés es requerida'),
    body('message').trim().isLength({ min: 50 }).withMessage('El resumen profesional debe tener al menos 50 caracteres')
], async (req, res) => {
    // Validar datos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { name, email, phone, graduationYear, subject, message, skills } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');

    try {
        // 📋 FLUJO MEJORADO: Insertar en tabla de pendientes de aprobación (no directamente en bolsa_trabajo)
        // Esto permite que el admin revise y apruebe la solicitud antes de que aparezca en la BD final

        // Preparar datos en formato JSON para almacenamiento flexible
        const datosJSON = {
            name,
            email,
            phone,
            graduationYear,
            subject,
            message,
            skills
        };

        // Insertar en pendientes_aprobacion
        const insertPendingQuery = `
            INSERT INTO pendientes_aprobacion (
                tipo_solicitud,
                email_usuario,
                datos_json,
                estado,
                fecha_solicitud
            )
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING id, uuid, fecha_solicitud;
        `;

        const result = await pool.query(insertPendingQuery, [
            'bolsa_trabajo',           // tipo_solicitud
            email,                     // email_usuario
            JSON.stringify(datosJSON), // datos_json
            'pendiente'                // estado
        ]);

        console.log('✅ Solicitud de Bolsa de Trabajo enviada a aprobación:', result.rows[0].id);

        res.status(201).json({
            success: true,
            message: '✅ Tu solicitud ha sido recibida. Nuestro equipo administrativo la revisará en breve. Te notificaremos por email cuando sea aprobada.',
            data: {
                solicitud_id: result.rows[0].id,
                uuid: result.rows[0].uuid,
                email: email,
                nombre: name,
                estado: 'pendiente_aprobacion',
                fecha_solicitud: result.rows[0].fecha_solicitud,
                nota: 'Tu perfil está pendiente de aprobación por el administrador. Una vez aprobado, aparecerá en la bolsa de trabajo.'
            }
        });

    } catch (error) {
        console.error('❌ Error al guardar solicitud de CV:', error);
        res.status(500).json({
            success: false,
            error: 'Error al procesar tu perfil. Por favor intenta nuevamente.',
            detalle: error.message
        });
    }
});

// =====================================================
// GET /api/bolsa-trabajo/cv - Listar todos los CVs
// =====================================================
router.get('/cv', async (req, res) => {
    const { status, limit = 50, offset = 0 } = req.query;

    try {
        let query = 'SELECT * FROM bolsa_trabajo';
        const params = [];

        if (status) {
            query += ' WHERE status = $1';
            params.push(status);
        }

        query += ` ORDER BY fecha_registro DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Contar total
        const countQuery = status ?
            'SELECT COUNT(*) FROM bolsa_trabajo WHERE status = $1' :
            'SELECT COUNT(*) FROM bolsa_trabajo';
        const countParams = status ? [status] : [];
        const countResult = await pool.query(countQuery, countParams);

        res.json({
            success: true,
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('❌ Error al obtener CVs:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los datos'
        });
    }
});

// =====================================================
// GET /api/bolsa-trabajo/cv/stats - Estadísticas
// =====================================================
router.get('/cv/stats', async (req, res) => {
    try {
        const query = `
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'activo') as activos,
                COUNT(*) FILTER (WHERE status = 'inactivo') as inactivos,
                COUNT(*) FILTER (WHERE status = 'contratado') as contratados,
                COUNT(*) FILTER (WHERE DATE(fecha_creacion) = CURRENT_DATE) as hoy,
                COUNT(*) FILTER (WHERE DATE(fecha_creacion) >= CURRENT_DATE - INTERVAL '7 days') as esta_semana,
                COUNT(*) FILTER (WHERE verificado = true) as verificados
            FROM bolsa_trabajo;
        `;

        const result = await pool.query(query);

        // Estadísticas por año de egreso
        const yearQuery = `
            SELECT anio_egreso, COUNT(*) as cantidad
            FROM bolsa_trabajo
            GROUP BY anio_egreso
            ORDER BY anio_egreso DESC;
        `;

        const yearResult = await pool.query(yearQuery);
        const byYear = yearResult.rows.reduce((acc, row) => {
            acc[row.anio_egreso] = parseInt(row.cantidad);
            return acc;
        }, {});

        // Estadísticas por área de interés
        const areaQuery = `
            SELECT area_interes, COUNT(*) as cantidad
            FROM bolsa_trabajo
            WHERE area_interes IS NOT NULL
            GROUP BY area_interes
            ORDER BY cantidad DESC
            LIMIT 10;
        `;

        const areaResult = await pool.query(areaQuery);
        const byArea = areaResult.rows.reduce((acc, row) => {
            acc[row.area_interes] = parseInt(row.cantidad);
            return acc;
        }, {});

        const stats = {
            ...result.rows[0],
            byYear,
            byArea
        };

        res.json({
            success: true,
            data: stats
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
// GET /api/bolsa-trabajo/cv/:id - Obtener un CV
// =====================================================
router.get('/cv/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM bolsa_trabajo WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'CV no encontrado'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error al obtener CV:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener el CV'
        });
    }
});

// =====================================================
// PUT /api/bolsa-trabajo/cv/:id - Actualizar CV (ADMIN)
// =====================================================
router.put('/cv/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, email, telefono, anio_egreso, area_interes, resumen_profesional, habilidades, status } = req.body;

    try {
        const query = `
            UPDATE bolsa_trabajo
            SET
                nombre = COALESCE($1, nombre),
                email = COALESCE($2, email),
                telefono = COALESCE($3, telefono),
                anio_egreso = COALESCE($4, anio_egreso),
                area_interes = COALESCE($5, area_interes),
                resumen_profesional = COALESCE($6, resumen_profesional),
                habilidades = COALESCE($7, habilidades),
                status = COALESCE($8, status),
                fecha_actualizacion = NOW()
            WHERE id = $9
            RETURNING *;
        `;

        const result = await pool.query(query, [
            nombre, email, telefono, anio_egreso, area_interes,
            resumen_profesional, habilidades, status, id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'CV no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'CV actualizado correctamente',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error al actualizar CV:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar el CV'
        });
    }
});

// =====================================================
// DELETE /api/bolsa-trabajo/cv/:id - Eliminar CV (ADMIN)
// =====================================================
router.delete('/cv/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM bolsa_trabajo WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'CV no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'CV eliminado correctamente'
        });

    } catch (error) {
        console.error('❌ Error al eliminar CV:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar el CV'
        });
    }
});

// =====================================================
// ALIAS PARA COMPATIBILIDAD CON FRONTEND
// =====================================================

/**
 * GET /api/bolsa-trabajo - Alias de /cv
 * Para compatibilidad con frontend que llama directamente a /api/bolsa-trabajo
 */
router.get('/', async (req, res) => {
    const { estado, limit = 50, offset = 0 } = req.query;

    try {
        console.log('💼 [BOLSA-TRABAJO] Obteniendo lista de candidatos...');

        let query = 'SELECT * FROM bolsa_trabajo';
        const params = [];

        if (estado) {
            query += ' WHERE estado = $1';
            params.push(estado);
        }

        query += ` ORDER BY fecha_registro DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Contar total
        const countQuery = estado ?
            'SELECT COUNT(*) FROM bolsa_trabajo WHERE estado = $1' :
            'SELECT COUNT(*) FROM bolsa_trabajo';
        const countParams = estado ? [estado] : [];
        const countResult = await pool.query(countQuery, countParams);

        console.log(`✅ [BOLSA-TRABAJO] ${result.rows.length} candidatos encontrados`);

        res.json({
            success: true,
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('❌ [BOLSA-TRABAJO] Error al obtener candidatos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los datos',
            message: error.message
        });
    }
});

/**
 * GET /api/bolsa-trabajo/stats/general - Alias de /cv/stats
 * Para compatibilidad con frontend que llama a /stats/general
 */
router.get('/stats/general', async (req, res) => {
    try {
        console.log('📊 [BOLSA-TRABAJO] Obteniendo estadísticas generales...');

        const query = `
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE estado = 'nuevo') as nuevos,
                COUNT(*) FILTER (WHERE estado = 'revisado') as revisados,
                COUNT(*) FILTER (WHERE estado = 'contactado') as contactados,
                COUNT(*) FILTER (WHERE DATE(fecha_registro) = CURRENT_DATE) as hoy,
                COUNT(*) FILTER (WHERE DATE(fecha_registro) >= CURRENT_DATE - INTERVAL '7 days') as esta_semana
            FROM bolsa_trabajo;
        `;

        const result = await pool.query(query);

        // Estadísticas por generación
        const yearQuery = `
            SELECT generacion, COUNT(*) as cantidad
            FROM bolsa_trabajo
            WHERE generacion IS NOT NULL
            GROUP BY generacion
            ORDER BY generacion DESC;
        `;

        const yearResult = await pool.query(yearQuery);
        const byYear = yearResult.rows.reduce((acc, row) => {
            acc[row.generacion] = parseInt(row.cantidad);
            return acc;
        }, {});

        // Estadísticas por experiencia
        const expQuery = `
            SELECT
                CASE
                    WHEN experiencia IS NULL OR experiencia = '' THEN 'Sin experiencia'
                    ELSE 'Con experiencia'
                END as tipo_experiencia,
                COUNT(*) as cantidad
            FROM bolsa_trabajo
            GROUP BY tipo_experiencia
            ORDER BY cantidad DESC;
        `;

        const expResult = await pool.query(expQuery);
        const byExperiencia = expResult.rows.reduce((acc, row) => {
            acc[row.tipo_experiencia] = parseInt(row.cantidad);
            return acc;
        }, {});

        const stats = {
            ...result.rows[0],
            byYear,
            byExperiencia
        };

        console.log('✅ [BOLSA-TRABAJO] Estadísticas obtenidas');

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('❌ [BOLSA-TRABAJO] Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas',
            message: error.message
        });
    }
});

module.exports = router;
