/**
 * 📧 CONTACT ROUTES - Sistema de contacto y comunicación
 * Manejo de formularios de contacto, quejas y sugerencias
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const nodemailer = require('nodemailer');
const router = express.Router();

// ============================================
// CONFIGURACIÓN DE NODEMAILER
// ============================================

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verificar conexión al iniciar
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Error configurando transporter de email:', error);
    } else {
        console.log('✅ [CONTACT] Transporter de Gmail configurado y listo');
    }
});

// ============================================
// RATE LIMITING PARA FORMULARIOS
// ============================================

const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // Aumentado de 5 a 10 para desarrollo/testing
    message: {
        success: false,
        message: 'Demasiados intentos de envío. Inténtalo nuevamente en 15 minutos.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// ============================================
// MIDDLEWARE DE VALIDACIÓN
// ============================================

const validateContactForm = (req, res, next) => {
    const { nombre, email, telefono, asunto, mensaje, form_type } = req.body;
    const errors = [];

    // Validar nombre
    if (!nombre || nombre.trim().length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
    }

    // Validar email
    if (!email || !validator.isEmail(email)) {
        errors.push('El email no es válido');
    }

    // Validar teléfono (opcional pero si se proporciona debe ser válido)
    if (telefono && !validator.isMobilePhone(telefono, 'es-MX')) {
        // Validación flexible para números mexicanos
        if (!/^[\d\-\s\+\(\)]{10,15}$/.test(telefono)) {
            errors.push('El teléfono no es válido');
        }
    }

    // Validar asunto
    if (!asunto || asunto.trim().length < 5) {
        errors.push('El asunto debe tener al menos 5 caracteres');
    }

    // Validar mensaje
    if (!mensaje || mensaje.trim().length < 10) {
        errors.push('El mensaje debe tener al menos 10 caracteres');
    }

    // Validar longitud máxima
    if (mensaje && mensaje.length > 2000) {
        errors.push('El mensaje no puede exceder 2000 caracteres');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Errores en el formulario',
            errors: errors
        });
    }

    // Sanitizar datos
    req.body = {
        nombre: validator.escape(nombre.trim()),
        email: validator.normalizeEmail(email.trim()),
        telefono: telefono ? validator.escape(telefono.trim()) : '',
        asunto: validator.escape(asunto.trim()),
        mensaje: validator.escape(mensaje.trim()),
        form_type: form_type ? validator.escape(form_type.trim()) : 'Contacto General'
    };

    next();
};

// ============================================
// FUNCIÓN DE ENVÍO DE EMAIL
// ============================================

const contactMessages = []; // Almacenamiento temporal

const sendContactEmail = async (messageData) => {
    const { nombre, email, telefono, asunto, mensaje, form_type } = messageData;

    // Crear HTML para el email
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
                .field { margin-bottom: 15px; }
                .label { font-weight: bold; color: #1e3a8a; }
                .value { color: #4b5563; margin-top: 5px; }
                .footer { background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>🎓 BGE Héroes de la Patria</h2>
                    <p>${form_type || 'Nuevo Mensaje de Contacto'}</p>
                </div>
                <div class="content">
                    <div class="field">
                        <div class="label">👤 Nombre:</div>
                        <div class="value">${nombre}</div>
                    </div>
                    <div class="field">
                        <div class="label">📧 Email:</div>
                        <div class="value">${email}</div>
                    </div>
                    ${telefono ? `
                    <div class="field">
                        <div class="label">📞 Teléfono:</div>
                        <div class="value">${telefono}</div>
                    </div>
                    ` : ''}
                    <div class="field">
                        <div class="label">📋 Asunto:</div>
                        <div class="value">${asunto}</div>
                    </div>
                    <div class="field">
                        <div class="label">💬 Mensaje:</div>
                        <div class="value" style="white-space: pre-wrap;">${mensaje}</div>
                    </div>
                </div>
                <div class="footer">
                    <p>Enviado desde el sistema de contacto web - BGE Héroes de la Patria</p>
                    <p>Fecha: ${new Date().toLocaleString('es-MX')}</p>
                </div>
            </div>
        </body>
        </html>
    `;

    // Configurar email
    const mailOptions = {
        from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_TO,
        replyTo: email,
        subject: `${form_type || 'Contacto'}: ${asunto}`,
        html: htmlContent,
        text: `
Nuevo mensaje de contacto - ${form_type}

Nombre: ${nombre}
Email: ${email}
${telefono ? `Teléfono: ${telefono}` : ''}
Asunto: ${asunto}

Mensaje:
${mensaje}

---
Enviado: ${new Date().toLocaleString('es-MX')}
        `.trim()
    };

    // Enviar email
    const info = await transporter.sendMail(mailOptions);

    // Guardar en almacenamiento temporal
    const message = {
        id: Date.now().toString(),
        ...messageData,
        timestamp: new Date(),
        status: 'sent',
        messageId: info.messageId
    };
    contactMessages.push(message);

    return { success: true, id: message.id, messageId: info.messageId };
};

// ============================================
// RUTAS
// ============================================

/**
 * POST /api/contact/send
 * ✅ NUEVO: Enviar mensaje CON VERIFICACIÓN DE EMAIL (anti-spam)
 */
router.post('/send', contactLimiter, validateContactForm, async (req, res) => {
    try {
        const { nombre, email, telefono, asunto, mensaje, form_type } = req.body;
        const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

        console.log('📧 Nuevo mensaje de contacto recibido (verificación requerida):', {
            nombre: nombre.substring(0, 20),
            email: email.substring(0, 30),
            asunto: asunto.substring(0, 50),
            form_type
        });

        // Preparar datos del mensaje para verificación
        const formData = {
            name: nombre,
            nombre: nombre,
            email,
            telefono,
            phone: telefono,
            asunto,
            subject: asunto,
            mensaje,
            message: mensaje,
            form_type
        };

        // ✅ CREAR VERIFICACIÓN Y ENVIAR EMAIL AL USUARIO
        const verificationService = require('../services/verificationService');
        const token = await verificationService.createVerification(formData);

        console.log(`✅ Email de verificación enviado a: ${email} - Token: ${token.substring(0, 8)}...`);

        res.json({
            success: true,
            message: 'Se ha enviado un email de confirmación a tu correo. Revisa tu bandeja de entrada y haz clic en el enlace para completar el envío.',
            requiresVerification: true,
            verificationSent: true
        });

    } catch (error) {
        console.error('❌ Error enviando email de verificación:', error);

        res.status(500).json({
            success: false,
            message: 'Error enviando email de verificación',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/contact/verify/:token
 * ✅ VERIFICAR TOKEN Y ENVIAR MENSAJE FINAL A LA ESCUELA
 */
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Verificar token usando verificationService
        const verificationService = require('../services/verificationService');
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

        // Token válido - Enviar mensaje verificado a la escuela
        const { form_type, ...formData } = verification.data;

        // Enviar email final a la escuela
        const result = await sendContactEmail({
            nombre: formData.name || formData.nombre,
            email: formData.email,
            telefono: formData.phone || formData.telefono || '',
            asunto: formData.subject || formData.asunto,
            mensaje: formData.message || formData.mensaje,
            form_type
        });

        if (result.success) {
            console.log(`✅ [VERIFIED] Mensaje enviado a la escuela desde: ${formData.email}`);

            // Página de confirmación
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
        } else {
            throw new Error('Error al enviar mensaje verificado');
        }

    } catch (error) {
        console.error('❌ Error en verificación:', error);
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

/**
 * GET /api/contact/messages
 * Obtener mensajes de contacto (solo para admin)
 */
router.get('/messages', async (req, res) => {
    try {
        // En un sistema real aquí verificarías autenticación de admin
        const limit = parseInt(req.query.limit) || 50;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;

        const messages = contactMessages
            .slice(skip, skip + limit)
            .map(msg => ({
                id: msg.id,
                nombre: msg.nombre,
                email: msg.email,
                asunto: msg.asunto,
                mensaje: msg.mensaje.substring(0, 100) + '...',
                form_type: msg.form_type,
                timestamp: msg.timestamp,
                status: msg.status
            }));

        res.json({
            success: true,
            data: messages,
            total: contactMessages.length,
            page,
            totalPages: Math.ceil(contactMessages.length / limit)
        });

    } catch (error) {
        console.error('❌ Error obteniendo mensajes:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo mensajes'
        });
    }
});

/**
 * GET /api/contact/stats
 * Estadísticas de mensajes de contacto
 */
router.get('/stats', async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const stats = {
            total: contactMessages.length,
            today: contactMessages.filter(msg => new Date(msg.timestamp) >= today).length,
            thisWeek: contactMessages.filter(msg => new Date(msg.timestamp) >= thisWeek).length,
            thisMonth: contactMessages.filter(msg => new Date(msg.timestamp) >= thisMonth).length,
            byType: contactMessages.reduce((acc, msg) => {
                acc[msg.form_type] = (acc[msg.form_type] || 0) + 1;
                return acc;
            }, {}),
            pending: contactMessages.filter(msg => msg.status === 'pending').length
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo estadísticas'
        });
    }
});

module.exports = router;