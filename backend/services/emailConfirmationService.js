/**
 * 📧 Servicio de Confirmación de Email
 * Gestiona tokens, envío de emails y verificación de confirmación
 * Fecha: 3 Noviembre 2025
 */

const crypto = require('crypto');
const devLogger = require('../utils/devLogger');
const nodemailer = require('nodemailer');
const { pool } = require('../config/database');

// =============================
// CONFIGURACIÓN DE EMAIL
// =============================

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS  // ✅ Usar EMAIL_PASS, no EMAIL_PASSWORD
    }
});

// =============================
// GENERAR TOKEN DE CONFIRMACIÓN
// =============================

/**
 * Genera un token aleatorio para confirmación de email
 * @returns {string} Token de 32 caracteres hexadecimales
 */
function generateConfirmationToken() {
    return crypto.randomBytes(16).toString('hex');
}

// =============================
// GUARDAR REGISTRO PENDIENTE DE CONFIRMACIÓN
// =============================

/**
 * Guarda un registro de CV en la tabla de confirmación pendiente
 * @param {object} formData - Datos del formulario
 * @param {string} ipAddress - Dirección IP del usuario
 * @param {string} userAgent - User Agent del navegador
 * @returns {object} {success, token, uuid, message}
 */
async function savePendingConfirmation(formData, ipAddress, userAgent) {
    const { name, email, phone, graduationYear, subject, message, skills } = formData;
    const confirmationToken = generateConfirmationToken();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    try {
        const query = `
            INSERT INTO bolsa_trabajo_pending_confirmation (
                email,
                confirmation_token,
                token_expires_at,
                form_data,
                ip_address,
                user_agent
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (email) DO UPDATE
            SET
                confirmation_token = EXCLUDED.confirmation_token,
                token_expires_at = EXCLUDED.token_expires_at,
                form_data = EXCLUDED.form_data,
                email_sent_count = bolsa_trabajo_pending_confirmation.email_sent_count + 1,
                last_email_sent_at = NOW(),
                confirmed_at = NULL
            RETURNING id, uuid, confirmation_token, email;
        `;

        const result = await pool.query(query, [
            email,
            confirmationToken,
            tokenExpiresAt,
            JSON.stringify({ name, email, phone, graduationYear, subject, message, skills }),
            ipAddress,
            userAgent
        ]);

        if (result.rows.length === 0) {
            throw new Error('No se pudo guardar el registro');
        }

        const record = result.rows[0];

        devLogger.log(`📧 Registro pendiente de confirmación guardado para ${email}`);

        return {
            success: true,
            uuid: record.uuid,
            email: record.email,
            confirmationToken: record.confirmation_token,
            tokenExpiresAt: tokenExpiresAt
        };

    } catch (error) {
        devLogger.error('❌ Error al guardar registro pendiente:', error);
        throw error;
    }
}

// =============================
// ENVIAR EMAIL DE CONFIRMACIÓN
// =============================

/**
 * Envía un email con el enlace de confirmación al usuario
 * @param {string} email - Email del usuario
 * @param {string} name - Nombre del usuario
 * @param {string} confirmationToken - Token de confirmación
 * @param {string} confirmationUrl - URL base para construir el enlace de confirmación
 * @returns {object} {success, message}
 */
async function sendConfirmationEmail(email, name, confirmationToken, confirmationUrl) {
    try {
        const confirmLink = `${confirmationUrl}?token=${confirmationToken}`;

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

                    <p><strong>Para completar tu registro, debes confirmar tu dirección de email.</strong> Esto es importante para verificar que el correo es válido y para poder contactarte cuando haya oportunidades laborales.</p>

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
                        ">
                            ✓ Confirmar mi Email
                        </a>
                    </div>

                    <p style="color: #666; font-size: 14px;">
                        O copia y pega este enlace en tu navegador:<br>
                        <code style="background: #f0f0f0; padding: 5px; border-radius: 3px;">${confirmLink}</code>
                    </p>

                    <p style="color: #666; font-size: 14px;">
                        <strong>Nota:</strong> Este enlace vence en 24 horas. Si no confirmas tu email en ese tiempo, tendrás que registrarte nuevamente.
                    </p>

                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

                    <p style="color: #666; font-size: 12px;">
                        Si no registraste tu perfil en la Bolsa de Trabajo, ignora este mensaje.<br>
                        <strong>Bachillerato General Estatal "Héroes de la Patria"</strong>
                    </p>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: '✓ Confirma tu Email - Bolsa de Trabajo BGE',
            html: htmlContent,
            text: `
Hola ${name},

Gracias por registrar tu perfil de CV en la Bolsa de Trabajo del Bachillerato General Estatal "Héroes de la Patria".

Para completar tu registro, debes confirmar tu dirección de email:

${confirmLink}

Este enlace vence en 24 horas.

Bachillerato General Estatal "Héroes de la Patria"
            `
        };

        await transporter.sendMail(mailOptions);

        devLogger.log(`✅ Email de confirmación enviado a ${email}`);

        return {
            success: true,
            message: `Email de confirmación enviado a ${email}`
        };

    } catch (error) {
        devLogger.error('❌ Error al enviar email:', error);
        throw error;
    }
}

// =============================
// CONFIRMAR EMAIL CON TOKEN
// =============================

/**
 * Confirma el email del usuario usando el token
 * @param {string} confirmationToken - Token de confirmación
 * @returns {object} {success, uuid, email, message} o {success: false, error}
 */
async function confirmEmailWithToken(confirmationToken) {
    try {
        // 1. Buscar el registro con el token
        const findQuery = `
            SELECT id, uuid, email, form_data, token_expires_at, confirmed_at
            FROM bolsa_trabajo_pending_confirmation
            WHERE confirmation_token = $1
        `;

        const findResult = await pool.query(findQuery, [confirmationToken]);

        if (findResult.rows.length === 0) {
            return {
                success: false,
                error: 'Token de confirmación inválido o expirado'
            };
        }

        const record = findResult.rows[0];

        // 2. Verificar si ya fue confirmado
        if (record.confirmed_at !== null) {
            return {
                success: false,
                error: 'Este email ya fue confirmado anteriormente'
            };
        }

        // 3. Verificar si el token expiró
        if (new Date(record.token_expires_at) < new Date()) {
            return {
                success: false,
                error: 'El token de confirmación ha expirado. Por favor registra nuevamente.'
            };
        }

        // 4. Marcar como confirmado en tabla temporal
        const confirmQuery = `
            UPDATE bolsa_trabajo_pending_confirmation
            SET confirmed_at = NOW()
            WHERE id = $1
            RETURNING uuid, email, form_data;
        `;

        const confirmResult = await pool.query(confirmQuery, [record.id]);
        const confirmedRecord = confirmResult.rows[0];

        // 5. Guardar en tabla pendientes_aprobacion
        const formData = JSON.parse(confirmedRecord.form_data);
        const insertApprovalQuery = `
            INSERT INTO pendientes_aprobacion (
                tipo_solicitud,
                email_usuario,
                datos_json,
                estado,
                email_confirmado,
                fecha_solicitud
            )
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING id, uuid;
        `;

        const insertResult = await pool.query(insertApprovalQuery, [
            'bolsa_trabajo',
            confirmedRecord.email,
            confirmedRecord.form_data,
            'pendiente',
            true
        ]);

        devLogger.log(`✅ Email confirmado para ${confirmedRecord.email}. Solicitud movida a aprobación (ID: ${insertResult.rows[0].id})`);

        return {
            success: true,
            uuid: confirmedRecord.uuid,
            email: confirmedRecord.email,
            approvalId: insertResult.rows[0].id,
            approvalUuid: insertResult.rows[0].uuid,
            message: 'Email confirmado exitosamente. Tu solicitud ha sido enviada a revisión del administrador.'
        };

    } catch (error) {
        devLogger.error('❌ Error al confirmar email:', error);
        throw error;
    }
}

// =============================
// OBTENER REGISTROS PENDIENTES (ADMIN)
// =============================

/**
 * Obtiene registros pendientes de confirmación de email
 * @param {number} limit - Límite de registros
 * @param {number} offset - Offset para paginación
 * @returns {object} {success, data, total}
 */
async function getPendingConfirmations(limit = 50, offset = 0) {
    try {
        const query = `
            SELECT
                id,
                uuid,
                email,
                form_data,
                created_at,
                confirmed_at,
                email_sent_count,
                last_email_sent_at,
                token_expires_at,
                CASE
                    WHEN confirmed_at IS NOT NULL THEN 'confirmado'
                    WHEN token_expires_at < NOW() THEN 'expirado'
                    ELSE 'pendiente'
                END as status
            FROM bolsa_trabajo_pending_confirmation
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        `;

        const countQuery = `
            SELECT COUNT(*) as total FROM bolsa_trabajo_pending_confirmation
        `;

        const [dataResult, countResult] = await Promise.all([
            pool.query(query, [limit, offset]),
            pool.query(countQuery)
        ]);

        return {
            success: true,
            data: dataResult.rows,
            total: parseInt(countResult.rows[0].total),
            limit,
            offset
        };

    } catch (error) {
        devLogger.error('❌ Error al obtener registros pendientes:', error);
        throw error;
    }
}

// =============================
// LIMPIAR TOKENS EXPIRADOS
// =============================

/**
 * Elimina registros con tokens expirados y sin confirmar
 * @returns {number} Número de registros eliminados
 */
async function cleanExpiredTokens() {
    try {
        const query = `
            DELETE FROM bolsa_trabajo_pending_confirmation
            WHERE token_expires_at < NOW() AND confirmed_at IS NULL
            RETURNING id
        `;

        const result = await pool.query(query);

        devLogger.log(`✅ ${result.rows.length} registros con tokens expirados eliminados`);

        return result.rows.length;

    } catch (error) {
        devLogger.error('❌ Error al limpiar tokens expirados:', error);
        throw error;
    }
}

// =============================
// EXPORTAR FUNCIONES
// =============================

module.exports = {
    generateConfirmationToken,
    savePendingConfirmation,
    sendConfirmationEmail,
    confirmEmailWithToken,
    getPendingConfirmations,
    cleanExpiredTokens
};
