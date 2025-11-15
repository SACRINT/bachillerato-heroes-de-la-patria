/**
 * 📧 CONTACT ROUTES - Sistema de contacto y comunicación
 * Manejo de formularios de contacto, quejas y sugerencias
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const nodemailer = require('nodemailer');
const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger'); // 🔐 Logging seguro (GDPR compliant)
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
        devLogger.error('❌ Error configurando transporter de email:');
    } else {
        devLogger.log('✅ [CONTACT] Transporter de Gmail configurado y listo');
    }
});

// ============================================
// RATE LIMITING PARA FORMULARIOS
// ============================================

const contactLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos (reducido para testing)
    max: 50, // Aumentado a 50 para desarrollo/testing
    message: {
        success: false,
        message: 'Demasiados intentos de envío. Inténtalo nuevamente en 5 minutos.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// ============================================
// MIDDLEWARE DE VALIDACIÓN
// ============================================

const validateContactForm = (req, res, next) => {
    // Normalizar campos (aceptar tanto name/nombre, subject/asunto, message/mensaje)
    const nombre = req.body.nombre || req.body.name;
    const email = req.body.email;
    const telefono = req.body.telefono || req.body.phone;
    const tipo = req.body.tipo || req.body.tipo_consulta;
    const asunto = req.body.asunto || req.body.subject;
    const mensaje = req.body.mensaje || req.body.message;
    const form_type = req.body.form_type;

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

    // Sanitizar datos y normalizar nombres de campos
    req.body = {
        nombre: validator.escape(nombre.trim()),
        email: validator.normalizeEmail(email.trim()),
        telefono: telefono ? validator.escape(telefono.trim()) : '',
        tipo_consulta: tipo ? validator.escape(tipo.trim()) : null,
        asunto: validator.escape(asunto.trim()),
        mensaje: validator.escape(mensaje.trim()),
        form_type: form_type ? validator.escape(form_type.trim()) : 'Contacto General'
    };

    next();
};

// ============================================
// FUNCIÓN DE ENVÍO DE EMAIL Y GUARDADO EN BD
// ============================================

const sendContactEmail = async (messageData) => {
    const { nombre, email, telefono, tipo_consulta, asunto, mensaje, form_type, ip_address, user_agent } = messageData;

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

    // Guardar en PostgreSQL
    const query = `
        INSERT INTO contactos (
            nombre, email, telefono, tipo_consulta, asunto, mensaje,
            form_type, ip_address, user_agent, email_sent, verificado, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *;
    `;

    const result = await pool.query(query, [
        nombre,
        email,
        telefono || null,
        tipo_consulta || null,
        asunto,
        mensaje,
        form_type,
        ip_address || null,
        user_agent || null,
        true, // email_sent
        true, // verificado (email confirmado)
        'pendiente' // status
    ]);

    const savedMessage = result.rows[0];
    devLogger.log('✅ Mensaje guardado en BD con ID:', savedMessage.id);

    return {
        success: true,
        id: savedMessage.id,
        messageId: info.messageId,
        dbRecord: savedMessage
    };
};

// ============================================
// RUTAS
// ============================================

/**
 * @openapi
 * /api/contact/send:
 *   post:
 *     summary: Envía un formulario de contacto con verificación por email.
 *     description: Recibe los datos de un formulario, crea un token de verificación y envía un email al usuario para confirmar. Sistema anti-spam con rate limiting.
 *     tags:
 *       - Contacto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - email
 *               - asunto
 *               - mensaje
 *             properties:
 *               nombre:
 *                 type: string
 *                 minLength: 2
 *                 example: "Juan Pérez García"
 *                 description: Nombre completo del usuario (mínimo 2 caracteres)
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan.perez@example.com"
 *                 description: Email del usuario para enviar confirmación
 *               telefono:
 *                 type: string
 *                 example: "3331234567"
 *                 description: Teléfono del usuario (opcional, formato mexicano)
 *               tipo_consulta:
 *                 type: string
 *                 example: "Información General"
 *                 description: Tipo de consulta (opcional)
 *               asunto:
 *                 type: string
 *                 minLength: 5
 *                 example: "Información sobre inscripciones 2025"
 *                 description: Asunto del mensaje (mínimo 5 caracteres)
 *               mensaje:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *                 example: "Estoy interesado en inscribir a mi hijo para el ciclo escolar 2025. ¿Cuáles son los requisitos?"
 *                 description: Mensaje del usuario (entre 10 y 2000 caracteres)
 *               form_type:
 *                 type: string
 *                 example: "Contacto General"
 *                 description: Tipo de formulario (Contacto General, bolsa_trabajo, egresados)
 *     responses:
 *       '200':
 *         description: Email de verificación enviado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Se ha enviado un email de confirmación a tu correo. Revisa tu bandeja de entrada y haz clic en el enlace para completar el envío."
 *                 requiresVerification:
 *                   type: boolean
 *                   example: true
 *                 verificationSent:
 *                   type: boolean
 *                   example: true
 *       '400':
 *         description: Datos inválidos en la solicitud.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Errores en el formulario"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["El email no es válido", "El mensaje debe tener al menos 10 caracteres"]
 *       '429':
 *         description: Demasiadas solicitudes (rate limit excedido - máximo 50 en 5 minutos).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Demasiados intentos de envío. Inténtalo nuevamente en 5 minutos."
 *                 code:
 *                   type: string
 *                   example: "RATE_LIMIT_EXCEEDED"
 *       '500':
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error enviando email de verificación"
 *                 error:
 *                   type: string
 *                   example: "Connection timeout"
 */
router.post('/send', contactLimiter, validateContactForm, async (req, res) => {
    try {
        const { nombre, email, telefono, tipo_consulta, asunto, mensaje, form_type } = req.body;
        const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.get('User-Agent') || 'unknown';

        devLogger.log('📧 Nuevo mensaje de contacto recibido (verificación requerida):', {
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
            tipo_consulta,
            tipo: tipo_consulta,
            asunto,
            subject: asunto,
            mensaje,
            message: mensaje,
            form_type,
            ip_address: clientIP,
            user_agent: userAgent
        };

        // ✅ CREAR VERIFICACIÓN Y ENVIAR EMAIL AL USUARIO
        const verificationService = require('../services/verificationService');
        const token = await verificationService.createVerification(formData);

        devLogger.log('✅ Email de verificación enviado exitosamente');

        res.json({
            success: true,
            message: 'Se ha enviado un email de confirmación a tu correo. Revisa tu bandeja de entrada y haz clic en el enlace para completar el envío.',
            requiresVerification: true,
            verificationSent: true,
            token: token
        });

    } catch (error) {
        devLogger.error('❌ Error enviando email de verificación:');

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
        const verification = await verificationService.verifyToken(token);

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

        // Token válido - Determinar si requiere aprobación o envío directo
        const { form_type, ip_address, user_agent, ...formData } = verification.data;

        // Formularios que requieren aprobación administrativa
        const requiresApproval = ['bolsa_trabajo', 'egresados'].includes(form_type);

        if (requiresApproval) {
            // ========================================
            // FLUJO DE APROBACIÓN ADMINISTRATIVA
            // ========================================
            try {
                // Guardar en tabla pending_submissions
                const insertQuery = `
                    INSERT INTO pending_submissions (
                        form_type, submission_data, verification_token,
                        email_verified, verification_email, ip_address, user_agent, verified_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                    RETURNING id
                `;

                const result = await pool.query(insertQuery, [
                    form_type,
                    JSON.stringify(formData), // Guardar todos los datos del formulario
                    token,
                    true, // Email verificado
                    formData.email,
                    ip_address || null,
                    user_agent || null
                ]);

                devLogger.log('✅ [PENDING APPROVAL] Formulario ${form_type} guardado para aprobación. ID: ${result.rows[0].id}');

                // Página de confirmación - PENDIENTE DE APROBACIÓN
                res.send(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Solicitud Recibida</title>
                        <style>
                            body {
                                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                                text-align: center;
                                padding: 50px;
                                background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
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
                                color: #f39c12;
                                margin-bottom: 20px;
                                font-size: 32px;
                            }
                            .success p {
                                font-size: 16px;
                                line-height: 1.6;
                                color: #555;
                                margin-bottom: 15px;
                            }
                            .icon { font-size: 64px; margin-bottom: 20px; }
                            .alert { background: #fff3cd; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #f39c12; }
                            .back-btn {
                                background: #3498db;
                                color: white;
                                padding: 12px 25px;
                                text-decoration: none;
                                border-radius: 8px;
                                display: inline-block;
                                margin-top: 20px;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="success">
                            <div class="icon">⏳</div>
                            <h1>¡Solicitud Recibida!</h1>
                            <p>Tu email ha sido verificado correctamente.</p>
                            <div class="alert">
                                <strong>⏱️ Tu solicitud será revisada</strong><br>
                                Un administrador revisará tu información y te enviaremos un email cuando sea aprobada o rechazada.
                                <br><br>
                                <strong>📧 Guarda el email de confirmación como comprobante.</strong>
                            </div>
                            <p style="margin-top: 20px; color: #888; font-size: 14px;">
                                Tiempo estimado de revisión: 24-48 horas
                            </p>
                            <a href="/" class="back-btn" onclick="window.close(); return false;">Cerrar Ventana</a>
                        </div>
                    </body>
                    </html>
                `);

            } catch (error) {
                devLogger.error('❌ Error al guardar en pending_submissions:');
                throw error;
            }

        } else {
            // ========================================
            // FLUJO NORMAL - ENVÍO DIRECTO
            // ========================================
            // Enviar email final a la escuela y guardar en BD
            const result = await sendContactEmail({
                nombre: formData.name || formData.nombre,
                email: formData.email,
                telefono: formData.phone || formData.telefono || '',
                tipo_consulta: formData.tipo || formData.tipo_consulta || null,
                asunto: formData.subject || formData.asunto,
                mensaje: formData.message || formData.mensaje,
                form_type,
                ip_address: ip_address || null,
                user_agent: user_agent || null
            });

            if (result.success) {
                devLogger.log('✅ [VERIFIED] Mensaje enviado a la escuela desde: ${formData.email}');

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
        } // Fin del bloque else (FLUJO NORMAL)

    } catch (error) {
        devLogger.error('❌ Error en verificación:');
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
        const offset = (page - 1) * limit;
        const status = req.query.status;

        let query = 'SELECT * FROM contactos';
        const params = [];

        if (status) {
            query += ' WHERE status = $1';
            params.push(status);
        }

        query += ` ORDER BY fecha_creacion DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Contar total
        const countQuery = status ?
            'SELECT COUNT(*) FROM contactos WHERE status = $1' :
            'SELECT COUNT(*) FROM contactos';
        const countParams = status ? [status] : [];
        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            data: result.rows,
            total: total,
            page,
            totalPages: Math.ceil(total / limit)
        });

    } catch (error) {
        devLogger.error('❌ Error obteniendo mensajes:');
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
        const query = `
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'pendiente') as pendientes,
                COUNT(*) FILTER (WHERE status = 'en_revision') as en_revision,
                COUNT(*) FILTER (WHERE status = 'respondida') as respondidas,
                COUNT(*) FILTER (WHERE DATE(fecha_creacion) = CURRENT_DATE) as hoy,
                COUNT(*) FILTER (WHERE DATE(fecha_creacion) >= CURRENT_DATE - INTERVAL '7 days') as esta_semana,
                COUNT(*) FILTER (WHERE DATE(fecha_creacion) >= DATE_TRUNC('month', CURRENT_DATE)) as este_mes,
                COUNT(*) FILTER (WHERE verificado = true) as verificados,
                COUNT(*) FILTER (WHERE email_sent = true) as enviados
            FROM contactos;
        `;

        const result = await pool.query(query);

        // Estadísticas por tipo de consulta
        const typeQuery = `
            SELECT tipo_consulta, COUNT(*) as cantidad
            FROM contactos
            WHERE tipo_consulta IS NOT NULL
            GROUP BY tipo_consulta
            ORDER BY cantidad DESC;
        `;

        const typeResult = await pool.query(typeQuery);
        const byType = typeResult.rows.reduce((acc, row) => {
            acc[row.tipo_consulta] = parseInt(row.cantidad);
            return acc;
        }, {});

        const stats = {
            ...result.rows[0],
            byType
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        devLogger.error('❌ Error obteniendo estadísticas:');
        res.status(500).json({
            success: false,
            message: 'Error obteniendo estadísticas'
        });
    }
});

module.exports = router;