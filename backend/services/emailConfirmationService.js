/**
 * 📧 EMAIL CONFIRMATION SERVICE - v2.0.0
 * Refactorizado: 04 Diciembre 2025
 */

const crypto = require('crypto');
const nodemailer = require('nodemailer');
const EmailConfirmationDAO = require('../data/email-confirmation.dao');
const devLogger = require('../utils/devLogger');

const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });

function generateConfirmationToken() { return crypto.randomBytes(16).toString('hex'); }

async function savePendingConfirmation(formData, ipAddress, userAgent) {
    const { name, email, phone, graduationYear, subject, message, skills } = formData;
    const confirmationToken = generateConfirmationToken();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    try {
        const record = await EmailConfirmationDAO.savePendingConfirmation(email, confirmationToken, tokenExpiresAt, { name, email, phone, graduationYear, subject, message, skills }, ipAddress, userAgent);
        devLogger.log(`📧 Registro pendiente de confirmación guardado para ${email}`);
        return { success: true, uuid: record.uuid, email: record.email, confirmationToken: record.confirmation_token, tokenExpiresAt };
    } catch (error) { devLogger.error('❌ Error al guardar registro pendiente:', error); throw error; }
}

async function sendConfirmationEmail(email, name, confirmationToken, confirmationUrl) {
    try {
        const confirmLink = `${confirmationUrl}?token=${confirmationToken}`;
        const htmlContent = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Confirma tu Email</title></head><body style="font-family: Arial, sans-serif; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #1976D2;">¡Bienvenido a la Bolsa de Trabajo!</h1></div><p>Hola <strong>${name}</strong>,</p><p>Gracias por registrar tu perfil. <strong>Para completar tu registro, confirma tu email:</strong></p><div style="text-align: center; margin: 30px 0;"><a href="${confirmLink}" style="display: inline-block; padding: 12px 30px; background-color: #1976D2; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">✓ Confirmar mi Email</a></div><p style="color: #666; font-size: 14px;"><strong>Nota:</strong> Este enlace vence en 24 horas.</p></div></body></html>`;
        await transporter.sendMail({ from: process.env.EMAIL_USER, to: email, subject: '✓ Confirma tu Email - Bolsa de Trabajo BGE', html: htmlContent, text: `Hola ${name}, Confirma tu email: ${confirmLink}` });
        devLogger.log(`✅ Email de confirmación enviado a ${email}`);
        return { success: true, message: `Email de confirmación enviado a ${email}` };
    } catch (error) { devLogger.error('❌ Error al enviar email:', error); throw error; }
}

async function confirmEmailWithToken(confirmationToken) {
    try {
        const record = await EmailConfirmationDAO.findByToken(confirmationToken);
        if (!record) return { success: false, error: 'Token de confirmación inválido o expirado' };
        if (record.confirmed_at !== null) return { success: false, error: 'Este email ya fue confirmado anteriormente' };
        if (new Date(record.token_expires_at) < new Date()) return { success: false, error: 'El token ha expirado. Por favor registra nuevamente.' };
        const confirmedRecord = await EmailConfirmationDAO.markConfirmed(record.id);
        const approval = await EmailConfirmationDAO.insertApprovalRecord(confirmedRecord.email, confirmedRecord.form_data);
        devLogger.log(`✅ Email confirmado para ${confirmedRecord.email}. Solicitud en aprobación (ID: ${approval.id})`);
        return { success: true, uuid: confirmedRecord.uuid, email: confirmedRecord.email, approvalId: approval.id, approvalUuid: approval.uuid, message: 'Email confirmado. Tu solicitud ha sido enviada a revisión.' };
    } catch (error) { devLogger.error('❌ Error al confirmar email:', error); throw error; }
}

async function getPendingConfirmations(limit = 50, offset = 0) {
    try {
        const { data, total } = await EmailConfirmationDAO.getPendingConfirmations(limit, offset);
        return { success: true, data, total, limit, offset };
    } catch (error) { devLogger.error('❌ Error al obtener registros pendientes:', error); throw error; }
}

async function cleanExpiredTokens() {
    try {
        const count = await EmailConfirmationDAO.cleanExpiredTokens();
        devLogger.log(`✅ ${count} registros con tokens expirados eliminados`);
        return count;
    } catch (error) { devLogger.error('❌ Error al limpiar tokens expirados:', error); throw error; }
}

module.exports = { generateConfirmationToken, savePendingConfirmation, sendConfirmationEmail, confirmEmailWithToken, getPendingConfirmations, cleanExpiredTokens };
