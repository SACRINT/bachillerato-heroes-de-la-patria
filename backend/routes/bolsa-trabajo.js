/**
 * 💼 API CRUD PARA BOLSA DE TRABAJO - PostgreSQL
 * Gestión completa de CVs y candidatos
 * Fecha: 17 Octubre 2025
 * Actualizado: 3 Noviembre 2025 - Flujo de confirmación de email
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const devLog = require('../utils/devLogger'); // 🔐 Logging seguro (GDPR compliant)

// Configuración de email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// =====================================================
// POST /api/bolsa-trabajo/cv - Crear perfil de CV
// 🎯 FLUJO CORRECTO (6 NOVIEMBRE 2025):
// 1) Validar datos del formulario
// 2) Generar token de confirmación
// 3) Guardar TEMPORALMENTE en BD (tabla bolsa_trabajo_pending_confirmation)
// 4) Enviar email con link de confirmación
// 5) RESPONDER AL CLIENTE (sin guardar en pendientes_aprobacion aún)
//
// ✅ Usuario confirma email → ENTONCES se mueve a pendientes_aprobacion
// ✅ Si token expira → Cleanup service lo borra automáticamente cada 12 horas
// ✅ Sin conflictos de email duplicado (UPSERT logic)
// =====================================================
router.post('/cv', [
    body('name').trim().notEmpty().withMessage('Nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('phone').trim().notEmpty().withMessage('Teléfono es requerido'),
    body('graduationYear').notEmpty().withMessage('Año de egreso es requerido'),
    body('subject').trim().notEmpty().withMessage('Área de interés es requerida'),
    body('message').trim().isLength({ min: 20 }).withMessage('El resumen profesional debe tener al menos 20 caracteres')
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
    const client = await pool.connect();

    try {
        devLog.log('[BOLSA-TRABAJO CV v2] Recibiendo CV');

        // 🎯 PASO 1: Generar token de confirmación
        const confirmationToken = crypto.randomBytes(32).toString('hex');

        // 🎯 PASO 2: Preparar datos del formulario
        const formData = {
            name,
            email,
            phone,
            graduationYear,
            subject,
            message,
            skills
        };

        // 🎯 PASO 3: Guardar TEMPORALMENTE en BD con UPSERT (reemplaza si ya existe)
        const upsertQuery = `
            INSERT INTO bolsa_trabajo_pending_confirmation
            (email_usuario, datos_json, confirmation_token)
            VALUES ($1, $2, $3)
            ON CONFLICT (email_usuario) DO UPDATE SET
                datos_json = EXCLUDED.datos_json,
                confirmation_token = EXCLUDED.confirmation_token,
                token_expires_at = (now() + '24 hours'::interval),
                fecha_actualizacion = now()
            RETURNING confirmation_token;
        `;

        const result = await client.query(upsertQuery, [
            email,
            JSON.stringify(formData),
            confirmationToken
        ]);

        const finalToken = result.rows[0].confirmation_token;

        devLog.log('[BOLSA-TRABAJO CV v2] Datos guardados en BD temporal - Esperando confirmación');

        // 🎯 PASO 4: Enviar email de confirmación
        const confirmationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/bolsa-trabajo.html#confirm-email`;
        const confirmLink = `${confirmationUrl}?token=${finalToken}`;

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Confirma tu Email - Bolsa de Trabajo</title>
            </head>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1976D2;">¡Bienvenido a la Bolsa de Trabajo!</h1>
                    </div>

                    <p>Hola <strong>${name}</strong>,</p>

                    <p>Gracias por registrar tu perfil de CV en la Bolsa de Trabajo del Bachillerato General Estatal "Héroes de la Patria".</p>

                    <p><strong>Para completar tu registro, debes confirmar tu dirección de email.</strong></p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${confirmLink}" style="
                            display: inline-block;
                            padding: 12px 30px;
                            background-color: #1976D2;
                            color: white;
                            text-decoration: none;
                            border-radius: 5px;
                            font-weight: bold;
                            font-size: 16px;
                        ">Confirmar mi Email</a>
                    </div>

                    <p style="color: #999; font-size: 12px;">
                        Si no puedes hacer clic en el botón, copia y pega esta URL en tu navegador:<br>
                        <code>${confirmLink}</code>
                    </p>

                    <p style="color: #999; font-size: 12px;">
                        Este enlace expira en 24 horas.
                    </p>
                </div>
            </body>
            </html>
        `;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: '✅ Confirma tu Email - Bolsa de Trabajo BGE',
            html: htmlContent
        });

        devLog.log('[BOLSA-TRABAJO CV v2] Email de confirmación enviado');

        // 🎯 PASO 5: Responder al cliente (datos aún NO guardados en pendientes_aprobacion)
        res.status(201).json({
            success: true,
            message: '📧 ¡Solicitud recibida! Hemos enviado un email de confirmación. Por favor confirma tu email para completar el registro.',
            data: {
                email: email,
                nombre: name,
                estado: 'esperando_confirmacion',
                fecha_solicitud: new Date().toISOString(),
                nota: 'Revisa tu email (incluyendo spam) y haz clic en el enlace de confirmación. El enlace vence en 24 horas. Tu registro se guardará en la base de datos una vez que confirmes tu email.'
            }
        });

    } catch (error) {
        devLog.error('[BOLSA-TRABAJO CV v2] Error al procesar solicitud de CV', error);

        res.status(500).json({
            success: false,
            error: 'Error al procesar tu perfil. Por favor intenta nuevamente.',
            detalle: error.message
        });
    } finally {
        client.release();
    }
});

// =====================================================
// POST /api/bolsa-trabajo/confirm-email/:token - Confirmar email
// 🎯 FLUJO CORRECTO (6 NOVIEMBRE 2025):
// 1️⃣ Buscar datos temporales por token en BD
// 2️⃣ Verificar que el token no haya expirado
// 3️⃣ Usar TRANSACTION: mover a pendientes_aprobacion
// 4️⃣ Limpiar de bolsa_trabajo_pending_confirmation
// 5️⃣ Responder al cliente
// =====================================================
router.post('/confirm-email/:token', async (req, res) => {
    const { token } = req.params;
    const client = await pool.connect();

    if (!token) {
        client.release();
        return res.status(400).json({
            success: false,
            error: 'Token de confirmación es requerido'
        });
    }

    try {
        devLog.log('[BOLSA-TRABAJO CONFIRM v2] Confirmando email');

        // 1️⃣ PASO 1: Buscar datos temporales en BD
        const selectQuery = `
            SELECT id, email_usuario, datos_json, token_expires_at
            FROM bolsa_trabajo_pending_confirmation
            WHERE confirmation_token = $1;
        `;

        const pendingResult = await client.query(selectQuery, [token]);

        if (pendingResult.rows.length === 0) {
            client.release();
            return res.status(404).json({
                success: false,
                error: 'Token de confirmación inválido o no encontrado'
            });
        }

        const pendingData = pendingResult.rows[0];

        // 2️⃣ PASO 2: Verificar que el token no haya expirado
        if (new Date() > new Date(pendingData.token_expires_at)) {
            // Limpiar token expirado de la BD
            await client.query('DELETE FROM bolsa_trabajo_pending_confirmation WHERE id = $1', [pendingData.id]);
            client.release();
            return res.status(404).json({
                success: false,
                error: 'El token de confirmación ha expirado. Por favor intenta registrarte nuevamente.'
            });
        }

        const { email_usuario: email, datos_json: formDataJSON } = pendingData;
        const formData = formDataJSON;

        // 3️⃣ PASO 3: Iniciar TRANSACTION
        await client.query('BEGIN');

        try {
            // Verificar si ya existe un registro pendiente para este email
            const existingApproval = await client.query(
                `SELECT id FROM pendientes_aprobacion
                 WHERE email_usuario = $1 AND tipo_solicitud = $2`,
                [email, 'bolsa_trabajo']
            );

            if (existingApproval.rows.length > 0) {
                // UPDATE registro existente
                const existingId = existingApproval.rows[0].id;
                const updateQuery = `
                    UPDATE pendientes_aprobacion
                    SET datos_json = $1, fecha_solicitud = NOW(), email_confirmado = $2, estado = $3
                    WHERE id = $4
                    RETURNING id, uuid, email_usuario, estado;
                `;
                const updateResult = await client.query(updateQuery, [
                    JSON.stringify(formData),
                    true,
                    'pendiente',
                    existingId
                ]);

                const savedRecord = updateResult.rows[0];

                // Limpiar de tabla temporal
                await client.query('DELETE FROM bolsa_trabajo_pending_confirmation WHERE id = $1', [pendingData.id]);

                await client.query('COMMIT');

                devLog.log('[BOLSA-TRABAJO CONFIRM v2] Email confirmado y registro actualizado');

                res.status(200).json({
                    success: true,
                    message: '✅ ¡Email confirmado exitosamente! Tu solicitud ha sido enviada a revisión del administrador. Te notificaremos cuando sea revisada.',
                    data: {
                        uuid: savedRecord.uuid,
                        approvalId: savedRecord.id,
                        email: savedRecord.email_usuario,
                        status: savedRecord.estado,
                        mensaje: 'Tu perfil está pendiente de aprobación por el administrador.'
                    }
                });

            } else {
                // INSERT registro nuevo
                const insertQuery = `
                    INSERT INTO pendientes_aprobacion (
                        email_usuario,
                        tipo_solicitud,
                        datos_json,
                        estado,
                        email_confirmado,
                        fecha_solicitud
                    )
                    VALUES ($1, $2, $3, $4, $5, NOW())
                    RETURNING id, uuid, email_usuario, estado;
                `;

                const insertResult = await client.query(insertQuery, [
                    email,
                    'bolsa_trabajo',
                    JSON.stringify(formData),
                    'pendiente',
                    true
                ]);

                if (insertResult.rows.length === 0) {
                    throw new Error('Error al guardar registro en pendientes_aprobacion');
                }

                const savedRecord = insertResult.rows[0];

                // Limpiar de tabla temporal
                await client.query('DELETE FROM bolsa_trabajo_pending_confirmation WHERE id = $1', [pendingData.id]);

                await client.query('COMMIT');

                devLog.log('[BOLSA-TRABAJO CONFIRM v2] Email confirmado y registro guardado');

                res.status(200).json({
                    success: true,
                    message: '✅ ¡Email confirmado exitosamente! Tu solicitud ha sido enviada a revisión del administrador. Te notificaremos cuando sea revisada.',
                    data: {
                        uuid: savedRecord.uuid,
                        approvalId: savedRecord.id,
                        email: savedRecord.email_usuario,
                        status: savedRecord.estado,
                        mensaje: 'Tu perfil está pendiente de aprobación por el administrador.'
                    }
                });
            }

        } catch (innerError) {
            await client.query('ROLLBACK');
            throw innerError;
        }

    } catch (error) {
        devLog.error('[BOLSA-TRABAJO CONFIRM v2] Error al confirmar email', error);
        res.status(500).json({
            success: false,
            error: 'Error al confirmar email. Por favor intenta nuevamente.',
            detalle: error.message
        });
    } finally {
        client.release();
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
        devLog.error('Error al obtener CVs', error);
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
        devLog.error('Error al obtener estadísticas', error);
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
        devLog.error('Error al obtener CV', error);
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
        devLog.error('Error al actualizar CV', error);
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
        devLog.error('Error al eliminar CV', error);
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
        devLog.log('[BOLSA-TRABAJO] Obteniendo lista de candidatos');

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

        devLog.log('[BOLSA-TRABAJO] Candidatos encontrados');

        res.json({
            success: true,
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        devLog.error('[BOLSA-TRABAJO] Error al obtener candidatos', error);
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

// =====================================================
// GET /api/bolsa-trabajo/pending-approvals - Obtener solicitudes pendientes de aprobación
// (PARA ADMIN)
// =====================================================
router.get('/pending-approvals', async (req, res) => {
    const { status = 'pendiente', limit = 50, offset = 0, email_confirmado = true } = req.query;

    try {
        console.log(`📋 [BOLSA-TRABAJO] Obteniendo solicitudes pendientes de aprobación...`);

        let query = `
            SELECT
                id,
                uuid,
                tipo_solicitud,
                email_usuario,
                datos_json,
                estado,
                email_confirmado,
                fecha_solicitud,
                admin_id,
                admin_notas
            FROM pendientes_aprobacion
            WHERE tipo_solicitud = 'bolsa_trabajo'
        `;

        const params = [];
        let paramCount = 0;

        // Filtrar por estado
        if (status) {
            query += ` AND estado = $${++paramCount}`;
            params.push(status);
        }

        // Filtrar por email confirmado
        if (email_confirmado !== undefined && email_confirmado !== 'undefined') {
            query += ` AND email_confirmado = $${++paramCount}`;
            params.push(email_confirmado === 'true' || email_confirmado === true);
        }

        // Orden y paginación
        query += ` ORDER BY fecha_solicitud DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Contar total
        let countQuery = `
            SELECT COUNT(*) FROM pendientes_aprobacion
            WHERE tipo_solicitud = 'bolsa_trabajo'
        `;

        const countParams = [];
        let countParamIdx = 0;

        if (status) {
            countQuery += ` AND estado = $${++countParamIdx}`;
            countParams.push(status);
        }

        if (email_confirmado !== undefined && email_confirmado !== 'undefined') {
            countQuery += ` AND email_confirmado = $${++countParamIdx}`;
            countParams.push(email_confirmado === 'true' || email_confirmado === true);
        }

        const countResult = await pool.query(countQuery, countParams);

        console.log(`✅ [BOLSA-TRABAJO] ${result.rows.length} solicitudes encontradas`);

        res.json({
            success: true,
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('❌ [BOLSA-TRABAJO] Error al obtener solicitudes pendientes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener las solicitudes',
            message: error.message
        });
    }
});

// =====================================================
// POST /api/bolsa-trabajo/approve-solicitud/:id - Aprobar/Rechazar solicitud
// (PARA ADMIN)
// =====================================================
router.post('/approve-solicitud/:id', [
    body('action').isIn(['approve', 'reject']).withMessage('Acción debe ser "approve" o "reject"'),
    body('adminNotes').optional().trim()
], async (req, res) => {
    const { id } = req.params;
    const { action, adminNotes } = req.body;

    // Validar
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        console.log(`📋 [BOLSA-TRABAJO] Procesando solicitud ID ${id} con acción: ${action}`);

        // 1. Obtener la solicitud pendiente
        const getQuery = `
            SELECT id, uuid, email_usuario, datos_json, estado, tipo_solicitud
            FROM pendientes_aprobacion
            WHERE id = $1 AND tipo_solicitud = 'bolsa_trabajo'
        `;

        const getResult = await pool.query(getQuery, [id]);

        if (getResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Solicitud no encontrada'
            });
        }

        const solicitud = getResult.rows[0];

        // 2. Actualizar estado en pendientes_aprobacion
        const estado = action === 'approve' ? 'aprobada' : 'rechazada';
        const updateQuery = `
            UPDATE pendientes_aprobacion
            SET
                estado = $1,
                admin_notas = $2,
                admin_id = $3,
                fecha_procesado = NOW()
            WHERE id = $4
            RETURNING id, uuid, estado, email_usuario;
        `;

        const updateResult = await pool.query(updateQuery, [
            estado,
            adminNotes || null,
            req.user?.id || null, // ID del admin (si está autenticado)
            id
        ]);

        if (!updateResult.rows.length) {
            throw new Error('No se pudo actualizar la solicitud');
        }

        // 3. Si es aprobada, guardar en tabla bolsa_trabajo
        let boletinResult = null;
        if (action === 'approve') {
            const formData = JSON.parse(solicitud.datos_json);

            const insertQuery = `
                INSERT INTO bolsa_trabajo (
                    nombre,
                    email,
                    telefono,
                    anio_egreso,
                    area_interes,
                    resumen_profesional,
                    habilidades,
                    estado,
                    verificado,
                    fecha_creacion
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                RETURNING id, uuid;
            `;

            boletinResult = await pool.query(insertQuery, [
                formData.name,
                formData.email,
                formData.phone,
                formData.graduationYear,
                formData.subject,
                formData.message,
                formData.skills ? JSON.stringify(formData.skills) : null,
                'activo',
                true
            ]);

            console.log(`✅ [BOLSA-TRABAJO] Solicitud aprobada y guardada en bolsa_trabajo: ID ${boletinResult.rows[0].id}`);
        } else {
            console.log(`❌ [BOLSA-TRABAJO] Solicitud rechazada: ID ${solicitud.id}`);
        }

        res.status(200).json({
            success: true,
            message: action === 'approve'
                ? '✅ Solicitud aprobada exitosamente'
                : '❌ Solicitud rechazada',
            data: {
                solicitud_id: id,
                uuid: solicitud.uuid,
                email: solicitud.email_usuario,
                estado: estado,
                bolsa_trabajo_id: boletinResult?.rows[0]?.id || null,
                admin_notas: adminNotes || null
            }
        });

    } catch (error) {
        console.error('❌ [BOLSA-TRABAJO] Error al procesar solicitud:', error);
        res.status(500).json({
            success: false,
            error: 'Error al procesar la solicitud',
            message: error.message
        });
    }
});

module.exports = router;
