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
    max: 20, // máximo 20 mensajes por IP cada 15 min (aumentado para desarrollo/pruebas)
    message: {
        error: 'Demasiados mensajes enviados. Intenta de nuevo en 15 minutos.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false, // Contar todos los requests
    skipFailedRequests: true, // No contar requests fallidos
});

// ============================================
// CONFIGURACIÓN DE NODEMAILER
// ============================================
// Nota: Ya no necesitamos createTransporter aquí porque
// verificationService ya tiene un transporter configurado

// ============================================
// VALIDACIONES
// ============================================

const contactValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),

    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),

    body('subject')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('El asunto debe tener entre 5 y 200 caracteres'),

    body('message')
        .optional()
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
        case 'Registro Bolsa de Trabajo':
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
                            <span class="label">📱 Teléfono:</span> ${data.phone || data.telefono || 'No proporcionado'}
                        </div>
                        <div class="data-row">
                            <span class="label">💼 Experiencia:</span> ${data.experience || data.experiencia || data.message || 'No proporcionada'}
                        </div>
                        <div class="data-row">
                            <span class="label">🛠️ Habilidades:</span> ${data.skills || 'No proporcionadas'}
                        </div>
                        <div class="data-row">
                            <span class="label">🎓 Educación:</span> ${data.education || 'No proporcionada'}
                        </div>
                        <div class="data-row">
                            <span class="label">📅 Disponibilidad:</span> ${data.availability || 'No especificada'}
                        </div>
                        <div class="data-row">
                            <span class="label">💰 Expectativas:</span> ${data.expectations || 'No especificadas'}
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
        const { form_type, ...formData} = verification.data;

        // Si es una suscripción, guardar en base de datos
        if (form_type === 'Suscripción Newsletter' || form_type === 'Suscripción a Notificaciones') {
            try {
                // Importar las funciones de suscripción directamente (más eficiente que HTTP)
                const subscriptionService = require('./subscriptions-service');

                const categories = form_type === 'Suscripción a Notificaciones'
                    ? [formData.subject || 'all']
                    : ['all'];

                await subscriptionService.addSubscriber({
                    email: formData.email,
                    name: formData.name || 'Suscriptor',
                    categories: categories,
                    source: form_type === 'Suscripción Newsletter' ? 'newsletter' : 'notifications'
                });

                console.log(`✅ Suscriptor guardado: ${formData.email}`);
            } catch (error) {
                console.error('Error guardando suscriptor:', error.message);
                // No fallar el proceso si el guardado falla
            }
        }

        // Si es actualización de egresados, guardar en base de datos MySQL
        if (form_type === 'Actualización de Datos - Egresados') {
            try {
                const db = require('../config/database');

                // Preparar datos para insertar
                const egresadoData = {
                    nombre: formData.name || formData.nombre,
                    email: formData.email,
                    generacion: formData.generacion,
                    telefono: formData.telefono || null,
                    ciudad: formData.ciudad || null,
                    ocupacion_actual: formData.trabajo || null,
                    universidad: formData.universidad || null,
                    carrera: formData.carrera || null,
                    estatus_estudios: formData['estatus-estudios'] || null,
                    año_egreso: formData['año-egreso'] || null,
                    historia_exito: formData.message || null,
                    autoriza_publicar: formData['publicar-historia'] === 'on',
                    verificado: true,
                    ip_registro: req.ip || null
                };

                // Verificar si ya existe el email
                const [existing] = await db.query(
                    'SELECT id FROM egresados WHERE email = ?',
                    [egresadoData.email]
                );

                if (existing.length > 0) {
                    // Actualizar registro existente
                    await db.query(`
                        UPDATE egresados SET
                            nombre = ?,
                            generacion = ?,
                            telefono = ?,
                            ciudad = ?,
                            ocupacion_actual = ?,
                            universidad = ?,
                            carrera = ?,
                            estatus_estudios = ?,
                            año_egreso = ?,
                            historia_exito = ?,
                            autoriza_publicar = ?,
                            verificado = ?,
                            fecha_actualizacion = NOW(),
                            ip_registro = ?
                        WHERE email = ?
                    `, [
                        egresadoData.nombre,
                        egresadoData.generacion,
                        egresadoData.telefono,
                        egresadoData.ciudad,
                        egresadoData.ocupacion_actual,
                        egresadoData.universidad,
                        egresadoData.carrera,
                        egresadoData.estatus_estudios,
                        egresadoData.año_egreso,
                        egresadoData.historia_exito,
                        egresadoData.autoriza_publicar,
                        egresadoData.verificado,
                        egresadoData.ip_registro,
                        egresadoData.email
                    ]);

                    console.log(`✅ Egresado actualizado en BD: ${egresadoData.email}`);
                } else {
                    // Insertar nuevo egresado
                    await db.query(`
                        INSERT INTO egresados (
                            nombre, email, generacion, telefono, ciudad,
                            ocupacion_actual, universidad, carrera, estatus_estudios,
                            año_egreso, historia_exito, autoriza_publicar, verificado, ip_registro
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        egresadoData.nombre,
                        egresadoData.email,
                        egresadoData.generacion,
                        egresadoData.telefono,
                        egresadoData.ciudad,
                        egresadoData.ocupacion_actual,
                        egresadoData.universidad,
                        egresadoData.carrera,
                        egresadoData.estatus_estudios,
                        egresadoData.año_egreso,
                        egresadoData.historia_exito,
                        egresadoData.autoriza_publicar,
                        egresadoData.verificado,
                        egresadoData.ip_registro
                    ]);

                    console.log(`✅ Egresado guardado en BD: ${egresadoData.email}`);
                }
            } catch (error) {
                console.error('❌ Error guardando egresado en BD:', error.message);
                // No fallar el proceso si el guardado falla
            }
        }

        // Usar el transporter de verificationService
        const mailOptions = {
            from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_TO || process.env.EMAIL_USER,
            subject: `[BACHILLERATO - VERIFICADO] ${form_type || 'Nuevo Mensaje'}`,
            html: getEmailTemplate(form_type, formData),
            replyTo: formData.email
        };

        await verificationService.transporter.sendMail(mailOptions);

        // Página de confirmación que se cierra automáticamente
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Mensaje Confirmado</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                        text-align: center;
                        padding: 50px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        margin: 0;
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .success {
                        background: white;
                        padding: 40px;
                        border-radius: 15px;
                        display: inline-block;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                        max-width: 500px;
                        width: 90%;
                    }
                    .success h1 {
                        color: #27ae60;
                        margin-bottom: 20px;
                        font-size: 32px;
                    }
                    .success p {
                        font-size: 16px;
                        line-height: 1.6;
                        color: #555;
                        margin-bottom: 15px;
                    }
                    .countdown {
                        font-size: 18px;
                        font-weight: bold;
                        color: #3498db;
                        margin: 20px 0;
                    }
                    .back-btn {
                        background: #3498db;
                        color: white;
                        padding: 12px 25px;
                        text-decoration: none;
                        border-radius: 8px;
                        display: inline-block;
                        margin-top: 20px;
                        transition: background 0.3s;
                    }
                    .back-btn:hover {
                        background: #2980b9;
                    }
                    .icon {
                        font-size: 64px;
                        margin-bottom: 20px;
                    }
                </style>
                <script>
                    let countdown = 5;
                    function updateCountdown() {
                        const countdownEl = document.getElementById('countdown');
                        if (countdownEl) {
                            countdownEl.textContent = countdown;
                        }

                        if (countdown <= 0) {
                            window.close();
                            // Si no se puede cerrar la ventana, redirigir
                            setTimeout(() => {
                                window.location.href = '/';
                            }, 500);
                        } else {
                            countdown--;
                            setTimeout(updateCountdown, 1000);
                        }
                    }

                    window.onload = function() {
                        updateCountdown();

                        // Intentar notificar a la ventana padre si existe
                        try {
                            if (window.opener && !window.opener.closed) {
                                window.opener.postMessage({
                                    type: 'EMAIL_VERIFIED',
                                    success: true,
                                    message: 'Email verificado exitosamente'
                                }, '*');
                            }
                        } catch (e) {
                            console.log('No se pudo comunicar con la ventana padre');
                        }
                    };
                </script>
            </head>
            <body>
                <div class="success">
                    <div class="icon">✅</div>
                    <h1>¡Mensaje Confirmado!</h1>
                    <p>Tu mensaje ha sido enviado exitosamente al Bachillerato Héroes de la Patria.</p>
                    <p>Gracias por verificar tu email. Nos pondremos en contacto contigo pronto.</p>
                    <div class="countdown">
                        Esta ventana se cerrará en <span id="countdown">5</span> segundos...
                    </div>
                    <a href="/" class="back-btn" onclick="window.close(); return false;">Cerrar Ventana</a>
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