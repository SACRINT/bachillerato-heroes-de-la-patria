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
        // Verificar si el email ya existe
        const checkQuery = 'SELECT id FROM bolsa_trabajo_cv WHERE email = $1';
        const existingResult = await pool.query(checkQuery, [email]);

        if (existingResult.rows.length > 0) {
            // Actualizar registro existente
            const updateQuery = `
                UPDATE bolsa_trabajo_cv
                SET
                    nombre = $1,
                    telefono = $2,
                    anio_egreso = $3,
                    area_interes = $4,
                    resumen_profesional = $5,
                    habilidades = $6,
                    fecha_actualizacion = NOW(),
                    ip_address = $7,
                    user_agent = $8
                WHERE email = $9
                RETURNING *;
            `;

            const result = await pool.query(updateQuery, [
                name,
                phone,
                graduationYear,
                subject,
                message,
                skills || null,
                ip_address,
                user_agent,
                email
            ]);

            console.log('✅ Perfil CV actualizado:', result.rows[0].id);

            return res.json({
                success: true,
                message: 'Tu perfil ha sido actualizado exitosamente',
                data: {
                    id: result.rows[0].id,
                    updated: true
                }
            });
        }

        // Insertar nuevo perfil
        const insertQuery = `
            INSERT INTO bolsa_trabajo_cv (
                nombre, email, telefono, anio_egreso, area_interes,
                resumen_profesional, habilidades, ip_address, user_agent
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `;

        const result = await pool.query(insertQuery, [
            name,
            email,
            phone,
            graduationYear,
            subject,
            message,
            skills || null,
            ip_address,
            user_agent
        ]);

        console.log('✅ Nuevo perfil CV creado:', result.rows[0].id);

        res.status(201).json({
            success: true,
            message: 'Tu perfil profesional ha sido registrado exitosamente. Te contactaremos pronto.',
            data: {
                id: result.rows[0].id,
                fecha: result.rows[0].fecha_creacion
            }
        });

    } catch (error) {
        console.error('❌ Error al guardar CV:', error);
        res.status(500).json({
            success: false,
            error: 'Error al procesar tu perfil. Por favor intenta nuevamente.'
        });
    }
});

// =====================================================
// GET /api/bolsa-trabajo/cv - Listar todos los CVs
// =====================================================
router.get('/cv', async (req, res) => {
    const { status, limit = 50, offset = 0 } = req.query;

    try {
        let query = 'SELECT * FROM bolsa_trabajo_cv';
        const params = [];

        if (status) {
            query += ' WHERE status = $1';
            params.push(status);
        }

        query += ` ORDER BY fecha_creacion DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Contar total
        const countQuery = status ?
            'SELECT COUNT(*) FROM bolsa_trabajo_cv WHERE status = $1' :
            'SELECT COUNT(*) FROM bolsa_trabajo_cv';
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
            FROM bolsa_trabajo_cv;
        `;

        const result = await pool.query(query);

        // Estadísticas por año de egreso
        const yearQuery = `
            SELECT anio_egreso, COUNT(*) as cantidad
            FROM bolsa_trabajo_cv
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
            FROM bolsa_trabajo_cv
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
        const result = await pool.query('SELECT * FROM bolsa_trabajo_cv WHERE id = $1', [id]);

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
            UPDATE bolsa_trabajo_cv
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
        const result = await pool.query('DELETE FROM bolsa_trabajo_cv WHERE id = $1 RETURNING id', [id]);

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

module.exports = router;
