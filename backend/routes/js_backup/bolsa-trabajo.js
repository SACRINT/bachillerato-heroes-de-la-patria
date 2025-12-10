/**
 * 💼 API CRUD PARA BOLSA DE TRABAJO - PostgreSQL
 * Gestión completa de CVs y candidatos
 * Fecha: 17 Octubre 2025
 * Actualizado: 3 Noviembre 2025 - Flujo de confirmación de email
 */

const express = require('express');
const router = express.Router();
// ✅ FASE 3: Using DAO layer
const BolsaTrabajoDAO = require('../data/bolsa-trabajo.dao');
const { pool } = require('../config/database'); // Needed for transactions in CV
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail, maskToken } = require('../utils/sanitized-errors');

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
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar Multer para CVs
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../public/uploads/cvs');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'cv-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF'));
        }
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
router.post('/cv', upload.single('additionalDocument'), [
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
        // Si hay error, borrar archivo subido si existe
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { name, email, phone, graduationYear, subject, message, skills } = req.body;
    const cvFile = req.file ? `/uploads/cvs/${req.file.filename}` : null;

    const client = await pool.connect();

    try {
        debugLog.log('BOLSA_TRABAJO', '[BOLSA-TRABAJO CV v2] Recibiendo CV');
        const confirmationToken = crypto.randomBytes(32).toString('hex');
        const formData = { name, email, phone, graduationYear, subject, message, skills, cvPath: cvFile };

        // ✅ FASE 3: Using BolsaTrabajoDAO
        const result = await BolsaTrabajoDAO.createPendingConfirmation(email, formData, confirmationToken);
        const finalToken = result.confirmation_token;
        debugLog.log('BOLSA_TRABAJO', '[BOLSA-TRABAJO CV v2] Datos guardados en BD temporal');

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

        debugLog.log('BOLSA_TRABAJO', '[BOLSA-TRABAJO CV v2] Email de confirmación enviado');

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
        debugLog.error('BOLSA_TRABAJO', '[BOLSA-TRABAJO CV v2] Error al procesar solicitud de CV', sanitizeError(error, 'bolsa-trabajo'));
        res.status(500).json({ success: false, error: 'Error al procesar tu perfil.', detalle: error.message });
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
        debugLog.log('BOLSA_TRABAJO', '[BOLSA-TRABAJO CONFIRM v2] Confirmando email');

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

                debugLog.log('BOLSA_TRABAJO', '[BOLSA-TRABAJO CONFIRM v2] Email confirmado y registro actualizado');

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

                debugLog.log('BOLSA_TRABAJO', '[BOLSA-TRABAJO CONFIRM v2] Email confirmado y registro guardado');

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
        debugLog.error('BOLSA_TRABAJO', '[BOLSA-TRABAJO CONFIRM v2] Error al confirmar email', sanitizeError(error, 'bolsa-trabajo'));
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
        // ✅ FASE 3: Using BolsaTrabajoDAO
        const { data, total } = await BolsaTrabajoDAO.getCvs({ status, limit: parseInt(limit), offset: parseInt(offset) });

        res.json({
            success: true,
            data,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        debugLog.error('BOLSA_TRABAJO', 'Error al obtener CVs', sanitizeError(error, 'bolsa-trabajo'));
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
        // ✅ FASE 3: Using BolsaTrabajoDAO
        const stats = await BolsaTrabajoDAO.getCvStats();

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        debugLog.error('BOLSA_TRABAJO', 'Error al obtener estadísticas', sanitizeError(error, 'bolsa-trabajo'));
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
        // ✅ FASE 3: Using BolsaTrabajoDAO
        const cv = await BolsaTrabajoDAO.getCvById(id);

        if (!cv) {
            return res.status(404).json({
                success: false,
                error: 'CV no encontrado'
            });
        }

        res.json({
            success: true,
            data: cv
        });

    } catch (error) {
        debugLog.error('BOLSA_TRABAJO', 'Error al obtener CV', sanitizeError(error, 'bolsa-trabajo'));
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
        // ✅ FASE 3: Using BolsaTrabajoDAO
        const updated = await BolsaTrabajoDAO.updateCv(id, {
            nombre, email, telefono, anio_egreso, area_interes, resumen_profesional, habilidades, status
        });

        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'CV no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'CV actualizado correctamente',
            data: updated
        });

    } catch (error) {
        debugLog.error('BOLSA_TRABAJO', 'Error al actualizar CV', sanitizeError(error, 'bolsa-trabajo'));
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
        // ✅ FASE 3: Using BolsaTrabajoDAO
        const deleted = await BolsaTrabajoDAO.deleteCv(id);

        if (!deleted) {
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
        debugLog.error('BOLSA_TRABAJO', 'Error al eliminar CV', sanitizeError(error, 'bolsa-trabajo'));
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
        debugLog.log('BOLSA_TRABAJO', '[BOLSA-TRABAJO] Obteniendo lista de candidatos');

        // ✅ FASE 3: Using BolsaTrabajoDAO
        const { data, total } = await BolsaTrabajoDAO.getAll({ estado, limit: parseInt(limit), offset: parseInt(offset) });

        debugLog.log('BOLSA_TRABAJO', '[BOLSA-TRABAJO] Candidatos encontrados');

        res.json({
            success: true,
            data,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        debugLog.error('BOLSA_TRABAJO', '[BOLSA-TRABAJO] Error al obtener candidatos', sanitizeError(error, 'bolsa-trabajo'));
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
        debugLog.log('BOLSA_TRABAJO', '📊 [BOLSA-TRABAJO] Obteniendo estadísticas generales...');

        // ✅ FASE 3: Using BolsaTrabajoDAO
        const stats = await BolsaTrabajoDAO.getGeneralStats();

        debugLog.log('BOLSA_TRABAJO', '✅ [BOLSA-TRABAJO] Estadísticas obtenidas');

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        debugLog.error('BOLSA_TRABAJO', '❌ [BOLSA-TRABAJO] Error al obtener estadísticas:', sanitizeError(error, 'bolsa-trabajo'));
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
        debugLog.log('BOLSA_TRABAJO', `📋 [BOLSA-TRABAJO] Obteniendo solicitudes pendientes de aprobación...`);

        // ✅ FASE 3: Using BolsaTrabajoDAO
        const { data, total } = await BolsaTrabajoDAO.getPendingApprovals({ status, email_confirmado, limit: parseInt(limit), offset: parseInt(offset) });

        debugLog.log('BOLSA_TRABAJO', `✅ [BOLSA-TRABAJO] ${data.length} solicitudes encontradas`);

        res.json({
            success: true,
            data,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        debugLog.error('BOLSA_TRABAJO', '❌ [BOLSA-TRABAJO] Error al obtener solicitudes pendientes:', sanitizeError(error, 'bolsa-trabajo'));
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
        debugLog.log('BOLSA_TRABAJO', `📋 [BOLSA-TRABAJO] Procesando solicitud ID ${id} con acción: ${action}`);

        // ✅ FASE 3: Using BolsaTrabajoDAO
        // 1. Obtener la solicitud pendiente
        const solicitud = await BolsaTrabajoDAO.getSolicitudById(id);

        if (!solicitud) {
            return res.status(404).json({
                success: false,
                error: 'Solicitud no encontrada'
            });
        }

        // 2. Actualizar estado en pendientes_aprobacion
        const estado = action === 'approve' ? 'aprobada' : 'rechazada';
        const updateResult = await BolsaTrabajoDAO.updateSolicitudStatus(id, estado, adminNotes, req.user?.id);

        if (!updateResult) {
            throw new Error('No se pudo actualizar la solicitud');
        }

        // 3. Si es aprobada, guardar en tabla bolsa_trabajo
        let boletinResult = null;
        if (action === 'approve') {
            const formData = JSON.parse(solicitud.datos_json);
            boletinResult = await BolsaTrabajoDAO.insertCvFromApproval(formData);
            debugLog.log('BOLSA_TRABAJO', `✅ [BOLSA-TRABAJO] Solicitud aprobada y guardada en bolsa_trabajo: ID ${boletinResult.id}`);
        } else {
            debugLog.log('BOLSA_TRABAJO', `❌ [BOLSA-TRABAJO] Solicitud rechazada: ID ${solicitud.id}`);
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
                bolsa_trabajo_id: boletinResult?.id || null,
                admin_notas: adminNotes || null
            }
        });

    } catch (error) {
        debugLog.error('BOLSA_TRABAJO', '❌ [BOLSA-TRABAJO] Error al procesar solicitud:', sanitizeError(error, 'bolsa-trabajo'));
        res.status(500).json({
            success: false,
            error: 'Error al procesar la solicitud',
            message: error.message
        });
    }
});

module.exports = router;
