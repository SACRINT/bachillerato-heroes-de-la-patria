import validator from 'validator';
import nodemailer from 'nodemailer';
import { URL } from 'url';
import path from 'path';

// Cargar variables de entorno
// Vercel ya carga las variables de entorno configuradas en el dashboard
// require('dotenv').config(); // No es necesario en Vercel

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

// Verificar conexión al iniciar (solo para logs, no bloquea el handler)
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Error configurando transporter de email:', error);
    } else {
        console.log('✅ [CONTACT] Transporter de Gmail configurado y listo');
    }
});

// ============================================
// MIDDLEWARE ADAPTADO PARA SERVERLESS
// ============================================

// Adaptación de validateContactForm
const validateContactForm = (body) => {
    const { nombre, email, telefono, asunto, mensaje, form_type } = body;
    const errors = [];

    if (!nombre || nombre.trim().length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
    }
    if (!email || !validator.isEmail(email)) {
        errors.push('El email no es válido');
    }
    if (telefono && !validator.isMobilePhone(telefono, 'es-MX')) {
        if (!/^[\d\-\s\+\(\)]{10,15}$/.test(telefono)) {
            errors.push('El teléfono no es válido');
        }
    }
    if (!asunto || asunto.trim().length < 5) {
        errors.push('El asunto debe tener al menos 5 caracteres');
    }
    if (!mensaje || mensaje.trim().length < 10) {
        errors.push('El mensaje debe tener al menos 10 caracteres');
    }
    if (mensaje && mensaje.length > 2000) {
        errors.push('El mensaje no puede exceder 2000 caracteres');
    }

    if (errors.length > 0) {
        return { success: false, message: 'Errores en el formulario', errors: errors };
    }

    // Sanitizar datos
    const sanitizedBody = {
        nombre: validator.escape(nombre.trim()),
        email: validator.normalizeEmail(email.trim()),
        telefono: telefono ? validator.escape(telefono.trim()) : '',
        asunto: validator.escape(asunto.trim()),
        mensaje: validator.escape(mensaje.trim()),
        form_type: form_type ? validator.escape(form_type.trim()) : 'Contacto General'
    };

    return { success: true, sanitizedBody };
};

// ============================================
// FUNCIÓN DE ENVÍO DE EMAIL
// ============================================

// ⚠️ ADVERTENCIA: contactMessages NO persistirá entre invocaciones serverless
// En un sistema real, esto debería guardarse en una base de datos.
const contactMessages = []; // Almacenamiento temporal (NO persistente en Serverless)

const sendContactEmail = async (messageData) => {
    const { nombre, email, telefono, asunto, mensaje, form_type } = messageData;

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

    const info = await transporter.sendMail(mailOptions);

    // En un entorno serverless, contactMessages no persistirá
    // Esto debería ser reemplazado por almacenamiento en base de datos
    const message = {
        id: Date.now().toString(),
        ...messageData,
        timestamp: new Date(),
        status: 'sent',
        messageId: info.messageId
    };
    // contactMessages.push(message); // No persistirá

    return { success: true, id: message.id, messageId: info.messageId };
};

// ============================================
// HANDLER PRINCIPAL PARA /api/contact
// ============================================

export default async function handler(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname.replace('/api/contact', '');

    try {
        // Validar variables de entorno para email
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.EMAIL_TO) {
            return res.status(500).json({
                success: false,
                error: 'Error de configuración del servidor',
                code: 'EMAIL_CONFIG_ERROR',
                message: 'Variables de entorno EMAIL_USER, EMAIL_PASS o EMAIL_TO no configuradas.'
            });
        }

        switch (path) {
            case '/send':
                if (req.method === 'POST') {
                    const validationResult = validateContactForm(req.body);
                    if (!validationResult.success) {
                        return res.status(400).json(validationResult);
                    }
                    const { sanitizedBody: formData } = validationResult;

                    // ✅ CREAR VERIFICACIÓN Y ENVIAR EMAIL AL USUARIO
                    // Adaptar la importación de verificationService
                    const verificationService = await import('../server/services/verificationService.js');
                    const token = await verificationService.default.createVerification(formData);

                    console.log(`✅ Email de verificación enviado a: ${formData.email} - Token: ${token.substring(0, 8)}...`);

                    return res.status(200).json({
                        success: true,
                        message: 'Se ha enviado un email de confirmación a tu correo. Revisa tu bandeja de entrada y haz clic en el enlace para completar el envío.',
                        requiresVerification: true,
                        verificationSent: true
                    });
                }
                break;

            case '/verify/:token': // Vercel no soporta :token directamente en el path del archivo
            case '/verify/' + req.query.token: // Adaptación para Vercel
                if (req.method === 'GET') {
                    const token = req.query.token || url.pathname.split('/').pop();

                    if (!token) {
                        return res.status(400).send(`
                            <!DOCTYPE html>
                            <html>
                            <head><title>Error de Verificación</title></head>
                            <body><div class="error"><h1>❌ Error de Verificación</h1><p>Token no proporcionado.</p><a href="/" class="back-btn">Volver al sitio</a></div></body>
                            </html>
                        `);
                    }

                    const verificationService = await import('../server/services/verificationService.js');
                    const verification = verificationService.default.verifyToken(token);

                    if (!verification.success) {
                        return res.status(400).send(`
                            <!DOCTYPE html>
                            <html>
                            <head><title>Error de Verificación</title></head>
                            <body><div class="error"><h1>❌ Error de Verificación</h1><p>${verification.error}</p><p>El enlace puede haber expirado o ya fue utilizado.</p><a href="/" class="back-btn">Volver al sitio</a></div></body>
                            </html>
                        `);
                    }

                    const { form_type, ...formData } = verification.data;

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
                        return res.status(200).send(`
                            <!DOCTYPE html>
                            <html>
                            <head><title>Mensaje Confirmado</title></head>
                            <body><div class="success"><h1>¡Mensaje Confirmado!</h1><p>Tu mensaje ha sido enviado exitosamente.</p><a href="/" class="back-btn">Cerrar Ventana</a></div></body>
                            </html>
                        `);
                    } else {
                        throw new Error('Error al enviar mensaje verificado');
                    }
                }
                break;

            case '/messages':
                if (req.method === 'GET') {
                    // ⚠️ ADVERTENCIA: contactMessages no persistirá en Serverless
                    // Esto debería ser reemplazado por una consulta a base de datos.
                    const limit = parseInt(params.limit) || 50;
                    const page = parseInt(params.page) || 1;
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

                    return res.status(200).json({
                        success: true,
                        data: messages,
                        total: contactMessages.length,
                        page,
                        totalPages: Math.ceil(contactMessages.length / limit)
                    });
                }
                break;

            case '/stats':
                if (req.method === 'GET') {
                    // ⚠️ ADVERTENCIA: contactMessages no persistirá en Serverless
                    // Esto debería ser reemplazado por una consulta a base de datos.
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

                    return res.status(200).json({
                        success: true,
                        data: stats
                    });
                }
                break;

            default:
                res.status(404).json({ error: 'Endpoint no encontrado', path: url.pathname });
                break;
        }
    } catch (error) {
        console.error('❌ Error en la función contact:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
}