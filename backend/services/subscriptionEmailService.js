/**
 * 📧 SERVICIO DE EMAILS PARA SUSCRIPCIONES
 * Sistema de envío de emails de verificación para el sistema de newsletters
 */

const nodemailer = require('nodemailer');
const devLogger = require('../utils/devLogger');
require('dotenv').config();

class SubscriptionEmailService {
    constructor() {
        this.transporter = this.createTransporter();
        this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    }

    /**
     * Crear transporter de Nodemailer con Gmail
     */
    createTransporter() {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            devLogger.warn('⚠️ [SUBSCRIPTION EMAIL] EMAIL_USER/EMAIL_PASS no configuradas');
            return null;
        }

        devLogger.log('📧 [SUBSCRIPTION EMAIL] Configurando transporter Gmail...');

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Verificar conexión
        transporter.verify((error, success) => {
            if (error) {
                devLogger.error('❌ [SUBSCRIPTION EMAIL] Error al conectar con Gmail:', error);
            } else {
                devLogger.log('✅ [SUBSCRIPTION EMAIL] Conexión con Gmail exitosa');
            }
        });

        return transporter;
    }

    /**
     * Enviar email de verificación al nuevo suscriptor
     * @param {string} email - Email del suscriptor
     * @param {string} nombre - Nombre del suscriptor
     * @param {string} token - Token de verificación
     * @returns {Promise<boolean>} - True si se envió correctamente
     */
    async sendVerificationEmail(email, nombre, token) {
        if (!this.transporter) {
            devLogger.error('❌ [SUBSCRIPTION EMAIL] Transporter no configurado');
            return false;
        }

        try {
            const verificationLink = `${this.baseUrl}/api/subscriptions/verify/${token}`;
            const unsubscribeLink = `${this.baseUrl}/api/subscriptions/unsubscribe/${token}`;

            const mailOptions = {
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: '✅ Confirma tu suscripción a BGE Newsletter',
                html: this.getVerificationEmailTemplate(nombre, verificationLink, unsubscribeLink)
            };

            const info = await this.transporter.sendMail(mailOptions);
            devLogger.log(`✅ [SUBSCRIPTION EMAIL] Email de verificación enviado a ${email} (Message ID: ${info.messageId})`);
            return true;

        } catch (error) {
            devLogger.error(`❌ [SUBSCRIPTION EMAIL] Error al enviar email a ${email}:`, error);
            return false;
        }
    }

    /**
     * Plantilla HTML del email de verificación
     */
    getVerificationEmailTemplate(nombre, verificationLink, unsubscribeLink) {
        return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Confirma tu suscripción</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    background: #f8f9fa;
                    padding: 20px;
                }
                .container {
                    background: white;
                    border-radius: 10px;
                    padding: 40px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #007bff;
                    margin: 0;
                    font-size: 28px;
                }
                .logo {
                    font-size: 48px;
                    margin-bottom: 10px;
                }
                .content {
                    margin-bottom: 30px;
                }
                .button {
                    display: inline-block;
                    padding: 15px 40px;
                    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
                    color: white !important;
                    text-decoration: none;
                    border-radius: 50px;
                    font-weight: bold;
                    font-size: 16px;
                    text-align: center;
                    margin: 20px 0;
                    box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
                    transition: transform 0.2s;
                }
                .button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
                }
                .info-box {
                    background: #f0f8ff;
                    border-left: 4px solid #007bff;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 5px;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #e0e0e0;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                }
                .unsubscribe {
                    color: #999;
                    font-size: 11px;
                    margin-top: 15px;
                }
                .unsubscribe a {
                    color: #999;
                    text-decoration: underline;
                }
                .highlight {
                    color: #007bff;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">📧</div>
                    <h1>¡Bienvenido a BGE Newsletter!</h1>
                </div>

                <div class="content">
                    <p>Hola <strong>${nombre}</strong>,</p>

                    <p>Gracias por suscribirte al boletín de <span class="highlight">BGE Héroes de la Patria</span>.</p>

                    <p>Para completar tu suscripción y empezar a recibir nuestras notificaciones sobre convocatorias, becas, eventos y noticias, por favor confirma tu dirección de email haciendo clic en el botón de abajo:</p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" class="button">✅ Confirmar mi suscripción</a>
                    </div>

                    <div class="info-box">
                        <strong>📌 ¿Qué recibirás?</strong>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Convocatorias académicas importantes</li>
                            <li>Oportunidades de becas y financiamiento</li>
                            <li>Eventos y actividades escolares</li>
                            <li>Noticias relevantes de la institución</li>
                        </ul>
                    </div>

                    <p style="font-size: 13px; color: #666; margin-top: 20px;">
                        <strong>Nota:</strong> Si tú no solicitaste esta suscripción, puedes ignorar este correo de forma segura.
                    </p>
                </div>

                <div class="footer">
                    <p><strong>BGE Héroes de la Patria</strong></p>
                    <p>Educación de calidad para el futuro de México</p>

                    <div class="unsubscribe">
                        <p>¿No quieres recibir estos correos? <a href="${unsubscribeLink}">Cancelar suscripción</a></p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Enviar email de bienvenida después de verificar
     * @param {string} email - Email del suscriptor
     * @param {string} nombre - Nombre del suscriptor
     * @param {string} token - Token para futuras cancelaciones
     */
    async sendWelcomeEmail(email, nombre, token) {
        if (!this.transporter) {
            devLogger.error('❌ [SUBSCRIPTION EMAIL] Transporter no configurado');
            return false;
        }

        try {
            const unsubscribeLink = `${this.baseUrl}/api/subscriptions/unsubscribe/${token}`;

            const mailOptions = {
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: '🎉 ¡Suscripción confirmada! Bienvenido a BGE Newsletter',
                html: this.getWelcomeEmailTemplate(nombre, unsubscribeLink)
            };

            const info = await this.transporter.sendMail(mailOptions);
            devLogger.log(`✅ [SUBSCRIPTION EMAIL] Email de bienvenida enviado a ${email} (Message ID: ${info.messageId})`);
            return true;

        } catch (error) {
            devLogger.error(`❌ [SUBSCRIPTION EMAIL] Error al enviar email de bienvenida a ${email}:`, error);
            return false;
        }
    }

    /**
     * Plantilla HTML del email de bienvenida
     */
    getWelcomeEmailTemplate(nombre, unsubscribeLink) {
        return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>¡Bienvenido!</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    background: #f8f9fa;
                    padding: 20px;
                }
                .container {
                    background: white;
                    border-radius: 10px;
                    padding: 40px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #28a745;
                    margin: 10px 0;
                    font-size: 28px;
                }
                .logo {
                    font-size: 64px;
                    margin-bottom: 10px;
                }
                .content {
                    margin-bottom: 30px;
                }
                .highlight-box {
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                    text-align: center;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #e0e0e0;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                }
                .unsubscribe {
                    color: #999;
                    font-size: 11px;
                    margin-top: 15px;
                }
                .unsubscribe a {
                    color: #999;
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🎉</div>
                    <h1>¡Tu suscripción está activa!</h1>
                </div>

                <div class="content">
                    <p>Hola <strong>${nombre}</strong>,</p>

                    <p>Tu suscripción al boletín de <strong>BGE Héroes de la Patria</strong> ha sido confirmada exitosamente.</p>

                    <div class="highlight-box">
                        <h2 style="margin: 0; font-size: 20px;">✅ ¡Ya estás suscrito!</h2>
                        <p style="margin: 10px 0 0 0; font-size: 14px;">Recibirás nuestras notificaciones importantes directamente en tu email.</p>
                    </div>

                    <p>A partir de ahora recibirás información sobre:</p>
                    <ul style="margin: 15px 0; padding-left: 20px;">
                        <li>📢 Convocatorias académicas</li>
                        <li>🎓 Oportunidades de becas</li>
                        <li>📅 Eventos y actividades</li>
                        <li>📰 Noticias institucionales</li>
                    </ul>

                    <p style="margin-top: 20px;">Gracias por formar parte de nuestra comunidad educativa.</p>
                </div>

                <div class="footer">
                    <p><strong>BGE Héroes de la Patria</strong></p>
                    <p>Educación de calidad para el futuro de México</p>

                    <div class="unsubscribe">
                        <p>¿Cambió tu opinión? <a href="${unsubscribeLink}">Cancelar suscripción</a></p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;
    }
}

// Exportar instancia singleton
module.exports = new SubscriptionEmailService();
