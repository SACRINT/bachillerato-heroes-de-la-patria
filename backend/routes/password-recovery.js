/**
 * 🔑 API PARA SOLICITUDES DE RECUPERACIÓN DE CONTRASEÑA - PostgreSQL
 * Gestión de solicitudes de recuperación de contraseña del portal de padres
 * Fecha: 17 Octubre 2025
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
const router = express.Router();
// ✅ FASE 3: Using DAO layer
const PasswordRecoveryDAO = require('../data/password-recovery.dao');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const verificationService = require('../services/verificationService');

// =====================================================
// POST /api/password-recovery - Crear solicitud de recuperación
// =====================================================
router.post('/', [
    body('email').isEmail().withMessage('Email inválido'),
    body('recoveryEmail').optional().isEmail().withMessage('Email inválido'),
    body('studentId').optional().trim(),
    body('recoveryStudentId').optional().trim()
], async (req, res) => {
    // Validar datos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    // Aceptar tanto 'email' como 'recoveryEmail'
    const email = req.body.email || req.body.recoveryEmail;
    const student_id = req.body.studentId || req.body.recoveryStudentId || null;

    if (!email) {
        return res.status(400).json({
            success: false,
            error: 'Email es requerido'
        });
    }

    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');

    try {
        // ✅ FASE 3: Using PasswordRecoveryDAO
        const request = await PasswordRecoveryDAO.create({ email, student_id, ip_address, user_agent });
        debugLog.log('PASSWORD_RECOVERY', '✅ Nueva solicitud de recuperación creada:', request.id);

        const recoveryToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await PasswordRecoveryDAO.updateToken(request.id, recoveryToken, tokenExpiration);

        const recoveryLink = `${process.env.BASE_URL || 'http://localhost:3000'}/reset-password.html?token=${recoveryToken}`;

        try {
            await verificationService.transporter.sendMail({
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: '🔑 Recuperación de Contraseña - Portal de Padres',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: #1976D2; color: white; padding: 20px; text-align: center; border-radius: 5px; }
                            .content { padding: 20px; background: #f9f9f9; border-radius: 5px; margin-top: 20px; }
                            .button { display: inline-block; padding: 12px 30px; background: #1976D2; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                            .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #888; }
                            .warning { background: #fff3cd; padding: 10px; border-left: 4px solid #f39c12; margin: 15px 0; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>🔑 Recuperación de Contraseña</h1>
                            </div>
                            <div class="content">
                                <p>Hola,</p>
                                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en el Portal de Padres del Bachillerato General Estatal "Héroes de la Patria".</p>

                                <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>

                                <div style="text-align: center;">
                                    <a href="${recoveryLink}" class="button">Restablecer Contraseña</a>
                                </div>

                                <p>O copia y pega este enlace en tu navegador:</p>
                                <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 3px; font-size: 12px;">
                                    ${recoveryLink}
                                </p>

                                <div class="warning">
                                    <strong>⏱️ Importante:</strong><br>
                                    Este enlace es válido por 24 horas. Después de este tiempo, tendrás que solicitar uno nuevo.
                                </div>

                                <p><strong>¿No solicitaste este cambio?</strong><br>
                                Si no fuiste tú quien solicitó restablecer la contraseña, ignora este mensaje. Tu cuenta está segura.</p>
                            </div>
                            <div class="footer">
                                <p>Bachillerato General Estatal "Héroes de la Patria"</p>
                                <p>📧 contacto.heroesdelapatria.sep@gmail.com</p>
                                <p>Puebla, México</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            });

            debugLog.log('PASSWORD_RECOVERY', `📧 Email de recuperación enviado a: ${email}`);

        } catch (emailError) {
            debugLog.error('PASSWORD_RECOVERY', '❌ Error al enviar email de recuperación:', emailError);
            // No fallar la solicitud si el email falla, el token está guardado en BD
        }

        res.status(201).json({
            success: true,
            message: 'Se han enviado las instrucciones de recuperación a tu correo electrónico.',
            data: { id: request.id, fecha: request.fecha_solicitud }
        });

    } catch (error) {
        debugLog.error('PASSWORD_RECOVERY', '❌ Error al crear solicitud de recuperación:', sanitizeError(error, 'password-recovery'));
        res.status(500).json({
            success: false,
            error: 'Error al procesar tu solicitud. Por favor intenta nuevamente.'
        });
    }
});

// =====================================================
// GET /api/password-recovery - Listar solicitudes (ADMIN)
// =====================================================
router.get('/', async (req, res) => {
    const { status, limit = 50, offset = 0 } = req.query;

    try {
        // ✅ FASE 3: Using PasswordRecoveryDAO
        const { data, total } = await PasswordRecoveryDAO.getAll({ status, limit, offset });
        res.json({ success: true, data, total, limit: parseInt(limit), offset: parseInt(offset) });

    } catch (error) {
        debugLog.error('PASSWORD_RECOVERY', '❌ Error al obtener solicitudes:', sanitizeError(error, 'password-recovery'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener los datos'
        });
    }
});

// =====================================================
// GET /api/password-recovery/stats - Estadísticas (ADMIN)
// =====================================================
router.get('/stats', async (req, res) => {
    try {
        // ✅ FASE 3: Using PasswordRecoveryDAO
        const stats = await PasswordRecoveryDAO.getStats();
        res.json({ success: true, data: stats });

    } catch (error) {
        debugLog.error('PASSWORD_RECOVERY', '❌ Error al obtener estadísticas:', sanitizeError(error, 'password-recovery'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

// =====================================================
// PUT /api/password-recovery/:id - Actualizar solicitud (ADMIN)
// =====================================================
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { status, notas_admin, procesado_por } = req.body;

    try {
        // ✅ FASE 3: Using PasswordRecoveryDAO
        const result = await PasswordRecoveryDAO.update(id, { status, notas_admin, procesado_por });
        if (!result) return res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
        res.json({ success: true, message: 'Solicitud actualizada correctamente', data: result });

    } catch (error) {
        debugLog.error('PASSWORD_RECOVERY', '❌ Error al actualizar solicitud:', sanitizeError(error, 'password-recovery'));
        res.status(500).json({
            success: false,
            error: 'Error al actualizar la solicitud'
        });
    }
});

module.exports = router;
