/**
 * 📧 SISTEMA DE CONTACTO PROFESIONAL
 * Rutas para manejo de formularios con Nodemailer
 * Sin branding de terceros, emails desde el dominio propio
 */

const express = require('express');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const verificationService = require('../services/verificationService');

const router = express.Router();

// ============================================
// CONFIGURACIÓN DE RATE LIMITING
// ============================================

const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 mensajes por IP cada 15 min
    message: {
        error: 'Demasiados mensajes enviados. Intenta de nuevo en 15 minutos.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// ============================================
// CONFIGURACIÓN DE NODEMAILER
// ============================================

const createTransporter = () => {
    return nodemailer.createTransporter({
        service: 'gmail', // Cambiar por tu proveedor
        auth: {
            user: process.env.EMAIL_USER, // Tu email
            pass: process.env.EMAIL_PASS  // Tu password de aplicación
        }
    });
};

// ============================================
// VALIDACIONES
// ============================================

const contactValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),

    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),

    body('subject')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('El asunto debe tener entre 5 y 200 caracteres'),

    body('message')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('El mensaje debe tener entre 10 y 2000 caracteres'),

    body('form_type')
        .optional()
        .trim()
        .escape()
];

// ============================================
// PLANTILLAS DE EMAIL
// ============================================

const getEmailTemplate = (formType, data) => {
    const baseStyle = `
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .footer { background: #34495e; color: white; padding: 15px; text-align: center; font-size: 12px; }
            .data-row { margin: 10px 0; padding: 10px; background: white; border-left: 4px solid #3498db; }
            .label { font-weight: bold; color: #2c3e50; }
        </style>
    `;

    switch(formType) {
        case 'Bolsa de Trabajo - CV':
            return `
                <!DOCTYPE html>
                <html>
                <head>${baseStyle}</head>
                <body>
                    <div class="header">
                        <h2>🎯 Nueva Aplicación - Bolsa de Trabajo</h2>
                        <p>Bachillerato General Estatal "Héroes de la Patria"</p>
                    </div>
                    <div class="content">
                        <div class="data-row">
                            <span class="label">👤 Nombre:</span> ${data.nombre_completo || data.name}
                        </div>
                        <div class="data-row">
                            <span class="label">📧 Email:</span> ${data.email}
                        </div>
                        <div class="data-row">
                            <span class="label">📱 Teléfono:</span> ${data.telefono || 'No proporcionado'}
                        </div>
                        <div class="data-row">
                            <span class="label">🎓 Experiencia:</span> ${data.experiencia || data.message || 'No proporcionada'}
                        </div>
                        <div class="data-row">
                            <span class="label">💼 Trabajo Actual:</span> ${data.trabajo_actual || 'No proporcionado'}
                        </div>
                        <div class="data-row">
                            <span class="label">🏠 Dirección:</span> ${data.direccion || 'No proporcionada'}
                        </div>
                    </div>
                    <div class="footer">
                        BGE Héroes de la Patria - Sistema de Gestión de Talento<br>
                        Enviado desde: bge-heroesdelapatria.vercel.app
                    </div>
                </body>
                </html>
            `;

        case 'Sistema de Citas':
            return `
                <!DOCTYPE html>
                <html>
                <head>${baseStyle}</head>
                <body>
                    <div class="header">
                        <h2>📅 Nueva Cita Solicitada</h2>
                        <p>Bachillerato General Estatal "Héroes de la Patria"</p>
                    </div>
                    <div class="content">
                        <div class="data-row">
                            <span class="label">👤 Nombre:</span> ${data.name}
                        </div>
                        <div class="data-row">
                            <span class="label">📧 Email:</span> ${data.email}
                        </div>
                        <div class="data-row">
                            <span class="label">📱 Teléfono:</span> ${data.phone || 'No proporcionado'}
                        </div>
                        <div class="data-row">
                            <span class="label">🏢 Departamento:</span> ${data.department || 'No especificado'}
                        </div>
                        <div class="data-row">
                            <span class="label">📝 Motivo:</span> ${data.reason || data.message || 'No especificado'}
                        </div>
                        <div class="data-row">
                            <span class="label">⏰ Fecha preferida:</span> ${data.preferred_date || 'No especificada'}
                        </div>
                    </div>
                    <div class="footer">
                        BGE Héroes de la Patria - Sistema de Citas<br>
                        Enviado desde: bge-heroesdelapatria.vercel.app
                    </div>
                </body>
                </html>
            `;

        default: // Contacto general y otros
            return `
                <!DOCTYPE html>
                <html>
                <head>${baseStyle}</head>
                <body>
                    <div class="header">
                        <h2>📬 Nuevo Mensaje de Contacto</h2>
                        <p>Bachillerato General Estatal "Héroes de la Patria"</p>
                    </div>
                    <div class="content">
                        <div class="data-row">
                            <span class="label">👤 Nombre:</span> ${data.name || data.nombre_completo}
                        </div>
                        <div class="data-row">
                            <span class="label">📧 Email:</span> ${data.email}
                        </div>
                        <div class="data-row">
                            <span class="label">📋 Asunto:</span> ${data.subject || formType || 'Consulta General'}
                        </div>
                        <div class="data-row">
                            <span class="label">💬 Mensaje:</span><br>
                            ${(data.message || '').replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    <div class="footer">
                        BGE Héroes de la Patria - Sistema de Contacto<br>
                        Enviado desde: bge-heroesdelapatria.vercel.app
                    </div>
                </body>
                </html>
            `;
    }
};

// ============================================
// RUTAS
// ============================================

// Endpoint para envío con verificación
router.post('/send', contactLimiter, contactValidation, async (req, res) => {
    try {
        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const formData = req.body;

        // Crear verificación y enviar email de confirmación
        const token = await verificationService.createVerification(formData);

        res.json({
            success: true,
            message: 'Se ha enviado un email de confirmación a tu correo. Revisa tu bandeja de entrada y haz clic en el enlace para completar el envío.',
            requiresVerification: true,
            verificationSent: true
        });

    } catch (error) {
        console.error('Error sending verification email:', error);
        res.status(500).json({
            success: false,
            message: 'Error enviando email de verificación',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
        });
    }
});

// Endpoint para verificar token y enviar mensaje final
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Verificar token
        const verification = verificationService.verifyToken(token);

        if (!verification.success) {
            return res.status(400).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Error de Verificación</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f8f9fa; }
                        .error { background: white; padding: 40px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                        .error h1 { color: #e74c3c; margin-bottom: 20px; }
                        .back-btn { background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <div class="error">
                        <h1>❌ Error de Verificación</h1>
                        <p>${verification.error}</p>
                        <p>El enlace puede haber expirado o ya fue utilizado.</p>
                        <a href="/" class="back-btn">Volver al sitio</a>
                    </div>
                </body>
                </html>
            `);
        }

        // Enviar mensaje verificado
        const { form_type, ...formData } = verification.data;

        const transporter = createTransporter();
        const mailOptions = {
            from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_TO || process.env.EMAIL_USER,
            subject: `[BACHILLERATO - VERIFICADO] ${form_type || 'Nuevo Mensaje'}`,
            html: getEmailTemplate(form_type, formData),
            replyTo: formData.email
        };

        await transporter.sendMail(mailOptions);

        // Página de confirmación
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Mensaje Confirmado</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f8f9fa; }
                    .success { background: white; padding: 40px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .success h1 { color: #27ae60; margin-bottom: 20px; }
                    .back-btn { background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="success">
                    <h1>✅ Mensaje Confirmado</h1>
                    <p>Tu mensaje ha sido enviado exitosamente al Bachillerato Héroes de la Patria.</p>
                    <p>Gracias por verificar tu email. Nos pondremos en contacto contigo pronto.</p>
                    <a href="/" class="back-btn">Volver al sitio</a>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Error del Sistema</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f8f9fa; }
                    .error { background: white; padding: 40px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .error h1 { color: #e74c3c; margin-bottom: 20px; }
                    .back-btn { background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="error">
                    <h1>⚠️ Error del Sistema</h1>
                    <p>Ocurrió un error procesando tu verificación.</p>
                    <p>Por favor intenta enviar tu mensaje nuevamente.</p>
                    <a href="/" class="back-btn">Volver al sitio</a>
                </div>
            </body>
            </html>
        `);
    }
});

// Ruta de verificación
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Sistema de contacto funcionando',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;