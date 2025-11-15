const crypto = require('crypto');
const nodemailer = require('nodemailer');
const devLogger = require('../utils/devLogger');

// 📧 Configurar transporter de Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'contacto.heroesdelapatria.sep@gmail.com',
        pass: process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || ''
    }
});

// 🔍 Verificar conexión del transporter al iniciar
transporter.verify((error, success) => {
    if (error) {
        devLogger.error(`[VERIFICATION] ❌ Error de configuración Gmail: ${error.message}`);
        devLogger.error(`[VERIFICATION] Usuario: ${process.env.EMAIL_USER}`);
        devLogger.error(`[VERIFICATION] Contraseña cargada: ${process.env.EMAIL_PASS ? '✅ Sí' : '❌ No'}`);
    } else {
        devLogger.log(`[VERIFICATION] ✅ Transporter Gmail verificado correctamente`);
        devLogger.log(`[VERIFICATION] Email configurado: ${process.env.EMAIL_USER}`);
    }
});

// 🔒 Almacenar tokens en memoria (en producción usar BD)
const verifications = new Map();

/**
 * Crear verificación y enviar email al usuario
 * @param {Object} formData - Datos del formulario
 * @returns {Promise<string>} Token de verificación
 */
async function createVerification(formData) {
    try {
        // 🔐 Generar token criptográfico
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 horas

        // 📝 Guardar verificación en memoria
        verifications.set(token, {
            data: formData,
            expiresAt,
            verified: false
        });

        devLogger.log(`[VERIFICATION] 📧 Token creado: ${token.substring(0, 10)}...`);

        // 🔍 Construir enlace de verificación
        const verificationLink = `${process.env.BASE_URL || 'http://localhost:3000'}/api/contact/verify/${token}`;

        devLogger.log(`[VERIFICATION] 🔗 Enlace generado: ${verificationLink}`);

        // 📧 Construir email HTML
        const emailHTML = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a3a52; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 20px; }
        .footer { background-color: #e0e0e0; padding: 10px; text-align: center; font-size: 12px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .info { background-color: #f0f8ff; padding: 10px; border-left: 4px solid #0066cc; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Verifica tu Mensaje</h2>
            <p>Bachillerato General Estatal "Héroes de la Patria"</p>
        </div>

        <div class="content">
            <p>Hola <strong>${formData.nombre || 'Usuario'}</strong>,</p>

            <p>Hemos recibido tu mensaje a través del formulario de contacto. Para completar el envío, por favor verifica tu dirección de correo electrónico haciendo clic en el botón de abajo:</p>

            <center>
                <a href="${verificationLink}" class="button">Verificar Email</a>
            </center>

            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="background-color: #f0f0f0; padding: 10px; overflow-wrap: break-word; word-break: break-all;">
                ${verificationLink}
            </p>

            <div class="info">
                <strong>ℹ️ Información del mensaje:</strong><br>
                <strong>Tipo:</strong> ${formData.tipo_consulta || formData.tipo || 'No especificado'}<br>
                <strong>Asunto:</strong> ${formData.asunto || 'No especificado'}<br>
                <strong>Recibido:</strong> ${new Date().toLocaleString('es-MX')}
            </div>

            <p><strong>⏰ Nota importante:</strong> Este enlace de verificación expirará en 24 horas.</p>

            <p>Si no realizaste esta solicitud, puedes ignorar este email de forma segura.</p>
        </div>

        <div class="footer">
            <p>&copy; 2025 Bachillerato General Estatal "Héroes de la Patria" - CCT: 21EBH0200X</p>
            <p>C. Manuel Ávila Camacho #7, Coronel Tito Hernández, Venustiano Carranza, Puebla</p>
        </div>
    </div>
</body>
</html>
        `;

        // 📬 Enviar email al usuario
        devLogger.log(`[VERIFICATION] 📨 Intentando enviar email a: ${formData.email}`);
        devLogger.log(`[VERIFICATION] 🔧 Transporter configurado con: ${process.env.EMAIL_USER}`);

        const userMailOptions = {
            from: process.env.EMAIL_USER || 'contacto.heroesdelapatria.sep@gmail.com',
            to: formData.email,
            subject: 'Verifica tu mensaje - Bachillerato Héroes de la Patria',
            html: emailHTML
        };

        devLogger.log(`[VERIFICATION] 📋 Opciones de email: from=${userMailOptions.from}, to=${userMailOptions.to}`);

        try {
            devLogger.log(`[VERIFICATION] ⏳ Enviando email con transporter.sendMail()...`);
            const userMailInfo = await transporter.sendMail(userMailOptions);
            devLogger.log(`[VERIFICATION] ✅ EMAIL ENVIADO EXITOSAMENTE AL USUARIO`);
            devLogger.log(`[VERIFICATION] Response: ${userMailInfo.response}`);
            devLogger.log(`[VERIFICATION] MessageID: ${userMailInfo.messageId}`);
        } catch (emailError) {
            devLogger.error(`[VERIFICATION] ❌ ERROR CRÍTICO ENVIANDO EMAIL AL USUARIO`);
            devLogger.error(`[VERIFICATION] Error message: ${emailError.message}`);
            devLogger.error(`[VERIFICATION] Error code: ${emailError.code}`);
            devLogger.error(`[VERIFICATION] Error response: ${emailError.response}`);
            devLogger.error(`[VERIFICATION] Stack: ${emailError.stack}`);
            throw emailError;
        }

        // 📬 Enviar copia al admin (opcional)
        if (process.env.EMAIL_ADMIN) {
            const adminEmailHTML = `
<h3>Nuevo mensaje de contacto pendiente de verificación</h3>
<p><strong>Usuario:</strong> ${formData.nombre}</p>
<p><strong>Email:</strong> ${formData.email}</p>
<p><strong>Tipo:</strong> ${formData.tipo_consulta || 'No especificado'}</p>
<p><strong>Asunto:</strong> ${formData.asunto}</p>
<p><strong>Mensaje:</strong></p>
<p>${formData.mensaje}</p>
<p><strong>Estado:</strong> Pendiente de verificación por el usuario</p>
            `;

            const adminMailOptions = {
                from: process.env.EMAIL_USER || 'contacto.heroesdelapatria.sep@gmail.com',
                to: process.env.EMAIL_ADMIN,
                subject: `[NUEVO] Contacto pendiente de verificación: ${formData.asunto}`,
                html: adminEmailHTML
            };

            try {
                const adminMailInfo = await transporter.sendMail(adminMailOptions);
                devLogger.log(`[VERIFICATION] ✅ Copia enviada al admin: ${process.env.EMAIL_ADMIN}`);
                devLogger.log(`[VERIFICATION] Admin email MessageID: ${adminMailInfo.messageId}`);
            } catch (adminEmailError) {
                devLogger.warn(`[VERIFICATION] ⚠️ Error enviando copia al admin (no crítico): ${adminEmailError.message}`);
            }
        }

        return token;

    } catch (error) {
        devLogger.error(`[VERIFICATION] ❌ Error creando verificación: ${error.message}`);
        devLogger.error(`[VERIFICATION] Stack: ${error.stack}`);

        // Lanzar el error para que contact.js lo capture
        throw new Error(`Error enviando email de verificación: ${error.message}`);
    }
}

/**
 * Verificar token y marcar como verificado
 * @param {string} token - Token a verificar
 * @returns {Object} {success: boolean, data: Object}
 */
function verifyToken(token) {
    try {
        if (!token) {
            return { success: false, error: 'Token no proporcionado' };
        }

        const verification = verifications.get(token);

        if (!verification) {
            devLogger.log(`[VERIFICATION] ❌ Token no encontrado: ${token.substring(0, 10)}...`);
            return { success: false, error: 'Token inválido' };
        }

        // Verificar expiración
        if (Date.now() > verification.expiresAt) {
            devLogger.log(`[VERIFICATION] ❌ Token expirado: ${token.substring(0, 10)}...`);
            verifications.delete(token);
            return { success: false, error: 'Token expirado' };
        }

        // Marcar como verificado
        verification.verified = true;
        devLogger.log(`[VERIFICATION] ✅ Token verificado exitosamente: ${token.substring(0, 10)}...`);

        return {
            success: true,
            data: verification.data,
            message: 'Email verificado exitosamente'
        };

    } catch (error) {
        devLogger.error(`[VERIFICATION] ❌ Error verificando token: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Obtener información de una verificación (sin eliminar)
 * @param {string} token - Token a buscar
 * @returns {Object} Datos de la verificación o null
 */
function getVerification(token) {
    return verifications.get(token) || null;
}

/**
 * Limpiar verificaciones expiradas (ejecutar periódicamente)
 */
function cleanupExpiredTokens() {
    let cleaned = 0;
    const now = Date.now();

    for (const [token, verification] of verifications.entries()) {
        if (now > verification.expiresAt) {
            verifications.delete(token);
            cleaned++;
        }
    }

    if (cleaned > 0) {
        devLogger.log(`[VERIFICATION] 🧹 Limpieza: ${cleaned} tokens expirados eliminados`);
    }
}

// 🕐 Ejecutar limpieza cada hora
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

// Ejecutar limpieza al iniciar
cleanupExpiredTokens();

module.exports = {
    createVerification,
    verifyToken,
    getVerification,
    cleanupExpiredTokens
};
