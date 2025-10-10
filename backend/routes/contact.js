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
 * Enviar mensaje de contacto
 */
router.post('/send', contactLimiter, validateContactForm, async (req, res) => {
    try {
        const { nombre, email, telefono, asunto, mensaje, form_type } = req.body;
        const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

        console.log('📧 Nuevo mensaje de contacto recibido:', {
            nombre: nombre.substring(0, 20),
            email: email.substring(0, 30),
            asunto: asunto.substring(0, 50),
            form_type
        });

        // Preparar datos del mensaje
        const messageData = {
            nombre,
            email,
            telefono,
            asunto,
            mensaje,
            form_type,
            ip: clientIP
        };

        // ✅ ENVÍO REAL DE EMAIL
        const result = await sendContactEmail(messageData);

        if (result.success) {
            console.log(`✅ Email enviado exitosamente - ID: ${result.messageId}`);
            res.json({
                success: true,
                message: '¡Mensaje enviado correctamente! Te responderemos pronto.',
                data: {
                    id: result.id,
                    timestamp: new Date(),
                    status: 'sent'
                }
            });
        } else {
            throw new Error('Error al enviar el mensaje');
        }

    } catch (error) {
        console.error('❌ Error procesando mensaje de contacto:', error);

        res.status(500).json({
            success: false,
            message: 'Error interno del servidor. Por favor, inténtalo más tarde.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
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