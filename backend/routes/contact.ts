/**
 * 📧 CONTACT ROUTES - Sistema de contacto - TypeScript
 * Manejo de formularios de contacto, quejas y sugerencias
 * Migrado: 07 Diciembre 2025
 */

import express, { Request, Response, NextFunction, Router } from 'express';
// @ts-ignore
import rateLimit from 'express-rate-limit';
import validator from 'validator';
import nodemailer from 'nodemailer';

import ContactDAO from '../data/contact.dao';
// @ts-ignore
import verificationService from '../services/verificationService';

// GDPR Logging
import { debugLog } from '../utils/debug-logger';
import { sanitizeError } from '../utils/sanitized-errors';

const router: Router = express.Router();

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

transporter.verify((error, success) => {
    if (error) {
        debugLog.error('CONTACT', '❌ Error configurando transporter', sanitizeError(error, 'contact'));
    } else {
        debugLog.log('CONTACT', '✅ [CONTACT] Transporter de Gmail listo');
    }
});

// ============================================
// INTERFACES
// ============================================

interface ContactFormBody {
    nombre?: string;
    name?: string;
    email: string;
    telefono?: string;
    phone?: string;
    tipo_consulta?: string;
    tipo?: string;
    body_tipo?: string; // para evitar conflicto de nombres
    asunto?: string;
    subject?: string;
    mensaje?: string;
    message?: string;
    form_type?: string;
}

interface SanitizedBody {
    nombre: string;
    email: string;
    telefono: string;
    tipo_consulta: string | null;
    asunto: string;
    mensaje: string;
    form_type: string;
}

interface MessageData extends SanitizedBody {
    ip_address: string | null;
    user_agent: string | null;
}

// ============================================
// RATE LIMITING
// ============================================

const contactLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 50,
    message: { success: false, message: 'Demasiados intentos. Inténtalo en 5 minutos.', code: 'RATE_LIMIT_EXCEEDED' },
    standardHeaders: true,
    legacyHeaders: false
});

// ============================================
// MIDDLEWARE DE VALIDACIÓN
// ============================================

const validateContactForm = (req: Request, res: Response, next: NextFunction): void => {
    const body = req.body as ContactFormBody;
    const nombre = body.nombre || body.name;
    const email = body.email;
    const telefono = body.telefono || body.phone;
    const tipo = body.tipo || body.tipo_consulta;
    const asunto = body.asunto || body.subject;
    const mensaje = body.mensaje || body.message;
    const form_type = body.form_type;

    const errors: string[] = [];

    if (!nombre || nombre.trim().length < 2) errors.push('El nombre debe tener al menos 2 caracteres');
    if (!email || !validator.isEmail(email)) errors.push('El email no es válido');
    if (telefono && !validator.isMobilePhone(telefono, 'es-MX') && !/^[\d\-\s\+\(\)]{10,15}$/.test(telefono)) {
        errors.push('El teléfono no es válido');
    }
    if (!asunto || asunto.trim().length < 5) errors.push('El asunto debe tener al menos 5 caracteres');
    if (!mensaje || mensaje.trim().length < 10) errors.push('El mensaje debe tener al menos 10 caracteres');
    if (mensaje && mensaje.length > 2000) errors.push('El mensaje no puede exceder 2000 caracteres');

    if (errors.length > 0) {
        res.status(400).json({ success: false, message: 'Errores en el formulario', errors });
        return;
    }

    req.body = {
        nombre: validator.escape((nombre || '').trim()),
        email: validator.normalizeEmail((email || '').trim()),
        telefono: telefono ? validator.escape(telefono.trim()) : '',
        tipo_consulta: tipo ? validator.escape(tipo.trim()) : null,
        asunto: validator.escape((asunto || '').trim()),
        mensaje: validator.escape((mensaje || '').trim()),
        form_type: form_type ? validator.escape(form_type.trim()) : 'Contacto General'
    };

    next();
};

// ============================================
// HELPER: ENVIAR EMAIL
// ============================================

const sendContactEmail = async (messageData: MessageData) => {
    const { nombre, email, telefono, tipo_consulta, asunto, mensaje, form_type, ip_address, user_agent } = messageData;

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
                <div class="header"><h2>🎓 BGE Héroes de la Patria</h2><p>${form_type || 'Nuevo Mensaje'}</p></div>
                <div class="content">
                    <div class="field"><div class="label">👤 Nombre:</div><div class="value">${nombre}</div></div>
                    <div class="field"><div class="label">📧 Email:</div><div class="value">${email}</div></div>
                    ${telefono ? `<div class="field"><div class="label">📞 Teléfono:</div><div class="value">${telefono}</div></div>` : ''}
                    <div class="field"><div class="label">📋 Asunto:</div><div class="value">${asunto}</div></div>
                    <div class="field"><div class="label">💬 Mensaje:</div><div class="value" style="white-space: pre-wrap;">${mensaje}</div></div>
                </div>
                <div class="footer"><p>Enviado el ${new Date().toLocaleString('es-MX')}</p></div>
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
        text: `Nuevo mensaje de ${nombre} (${email}) - ${asunto}\n\n${mensaje}`
    };

    const info = await transporter.sendMail(mailOptions);

    const savedMessage = await ContactDAO.create({
        nombre, email, telefono, tipo_consulta, asunto, mensaje, form_type, ip_address, user_agent,
        email_sent: true, verificado: true, status: 'pendiente'
    });

    return { success: true, id: savedMessage.id, messageId: info.messageId, dbRecord: savedMessage };
};

// ============================================
// RUTAS
// ============================================

/**
 * POST /api/contact/send
 */
router.post('/send', contactLimiter, validateContactForm, async (req: Request, res: Response): Promise<void> => {
    try {
        const { nombre, email, telefono, tipo_consulta, asunto, mensaje, form_type } = req.body;
        const clientIP = req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
        const userAgent = req.get('User-Agent') || 'unknown';

        debugLog.log('CONTACT', '📧 Solicitud de contacto recibida', { email });

        const formData = {
            name: nombre, nombre,
            email,
            phone: telefono, telefono,
            tipo: tipo_consulta, tipo_consulta,
            subject: asunto, asunto,
            message: mensaje, mensaje,
            form_type,
            ip_address: clientIP,
            user_agent: userAgent
        };

        const token = await verificationService.createVerification(formData);

        res.json({
            success: true,
            message: 'Email de confirmación enviado. Por favor verifica tu correo.',
            requiresVerification: true,
            verificationSent: true,
            token
        });

    } catch (error) {
        debugLog.error('CONTACT', '❌ Error enviando verificación', sanitizeError(error as Error, 'contact'));
        res.status(500).json({ success: false, message: 'Error enviando email de verificación' });
    }
});

/**
 * GET /api/contact/verify/:token
 */
router.get('/verify/:token', async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.params;
        const verification = await verificationService.verifyToken(token);

        if (!verification.success) {
            res.status(400).send(`<html><body><h1>Error de Verificación</h1><p>${verification.error}</p></body></html>`);
            return;
        }

        const { form_type, ip_address, user_agent, ...formData } = verification.data;
        const requiresApproval = ['bolsa_trabajo', 'egresados'].includes(form_type);

        if (requiresApproval) {
            const result = await ContactDAO.createPendingSubmission({ form_type, formData, token, email: formData.email, ip_address, user_agent });
            debugLog.log('CONTACT', `✅ [PENDING APPROVAL] Formulario ${form_type} ID: ${result.id}`);
            res.send(`<html><body><h1>Solicitud Recibida</h1><p>Tu solicitud será revisada por un administrador.</p></body></html>`);
        } else {
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
                res.send(`<html><body><h1>¡Mensaje Confirmado!</h1><p>Tu mensaje ha sido enviado exitosamente.</p></body></html>`);
            } else {
                throw new Error('Error enviando mensaje final');
            }
        }

    } catch (error) {
        debugLog.error('CONTACT', '❌ Error en verificación', sanitizeError(error as Error, 'contact'));
        res.status(500).send(`<html><body><h1>Error del Sistema</h1><p>Intenta nuevamente.</p></body></html>`);
    }
});

/**
 * GET /api/contact/messages (Admin)
 */
router.get('/messages', async (req: Request, res: Response): Promise<void> => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        const page = parseInt(req.query.page as string) || 1;
        const status = req.query.status as string;

        const { messages, total, page: currentPage, totalPages } = await ContactDAO.getMessages({ limit, page, status: status || null });

        res.json({ success: true, data: messages, total, page: currentPage, totalPages });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error obteniendo mensajes' });
    }
});

/**
 * GET /api/contact/stats
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
    try {
        const statsBase = await ContactDAO.getStats();
        const byType = await ContactDAO.getStatsByType();
        res.json({ success: true, data: { ...statsBase, byType } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error obteniendo estadísticas' });
    }
});

export default router;
