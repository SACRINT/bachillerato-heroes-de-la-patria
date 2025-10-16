/**
 * 🔐 SERVICIO DE VERIFICACIÓN PARA VERCEL SERVERLESS
 * Sistema de verificación por email + token
 * Máxima seguridad contra spam
 */

import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

class VerificationService {
    constructor() {
        // Almacén temporal de verificaciones (en producción usar Redis/DB)
        this.pendingVerifications = new Map();

        // Control de re-envíos por email
        this.emailCooldowns = new Map(); // { email: timestamp }
        this.COOLDOWN_TIME = 2 * 60 * 1000; // 2 minutos entre envíos

        // Configurar transporter
        this.transporter = this.createTransporter();
    }

    createTransporter() {
        // Verificar si tenemos credenciales reales de Gmail configuradas
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            console.log('📧 [VERIFICATION SERVICE] Configurando transporter Gmail...');

            return nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
        }

        console.warn('⚠️ [VERIFICATION SERVICE] EMAIL_USER/EMAIL_PASS no configuradas');
        return null;
    }

    /**
     * Crear token de verificación y enviar email
     */
    async createVerification(formData) {
        if (!this.transporter) {
            throw new Error('Email transporter no configurado');
        }

        const email = formData.email.toLowerCase();

        // Verificar cooldown de re-envíos
        const lastSent = this.emailCooldowns.get(email);
        if (lastSent) {
            const timeElapsed = Date.now() - lastSent;
            if (timeElapsed < this.COOLDOWN_TIME) {
                const remainingSeconds = Math.ceil((this.COOLDOWN_TIME - timeElapsed) / 1000);
                throw new Error(`Por favor espera ${remainingSeconds} segundos antes de solicitar otro código de verificación`);
            }
        }

        const token = uuidv4();
        const expirationTime = Date.now() + (30 * 60 * 1000); // 30 minutos

        // Guardar verificación pendiente
        this.pendingVerifications.set(token, {
            data: formData,
            email: formData.email,
            expires: expirationTime,
            created: Date.now()
        });

        // Enviar email de confirmación
        await this.sendVerificationEmail(formData.email, token, formData.form_type);

        // Registrar timestamp de envío para cooldown
        this.emailCooldowns.set(email, Date.now());

        // Limpiar cooldown después del tiempo establecido
        setTimeout(() => {
            this.emailCooldowns.delete(email);
        }, this.COOLDOWN_TIME);

        return token;
    }

    /**
     * Enviar email de verificación
     */
    async sendVerificationEmail(email, token, formType) {
        const verificationLink = `${process.env.BASE_URL || 'http://localhost:3000'}/api/contact/verify/${token}`;

        const mailOptions = {
            from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `✅ Confirma tu mensaje - ${formType || 'Contacto'}`,
            html: this.getVerificationEmailTemplate(verificationLink, formType)
        };

        await this.transporter.sendMail(mailOptions);
    }

    /**
     * Verificar token y procesar mensaje
     */
    verifyToken(token) {
        const verification = this.pendingVerifications.get(token);

        if (!verification) {
            return { success: false, error: 'Token inválido o expirado' };
        }

        if (Date.now() > verification.expires) {
            this.pendingVerifications.delete(token);
            return { success: false, error: 'Token expirado' };
        }

        // Token válido, obtener datos
        const data = verification.data;
        this.pendingVerifications.delete(token);

        return { success: true, data };
    }

    /**
     * Plantilla de email de verificación
     */
    getVerificationEmailTemplate(verificationLink, formType) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    background: #f8f9fa;
                }
                .container {
                    background: white;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .header {
                    background: linear-gradient(135deg, #2c3e50, #3498db);
                    color: white;
                    padding: 30px 20px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 300;
                }
                .content {
                    padding: 40px 30px;
                    text-align: center;
                }
                .content h2 {
                    color: #2c3e50;
                    margin-bottom: 20px;
                }
                .verify-btn {
                    display: inline-block;
                    background: linear-gradient(135deg, #27ae60, #2ecc71);
                    color: white;
                    text-decoration: none;
                    padding: 15px 30px;
                    border-radius: 50px;
                    font-weight: bold;
                    margin: 20px 0;
                    box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3);
                }
                .footer {
                    background: #ecf0f1;
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #7f8c8d;
                }
                .warning {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    color: #856404;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .icon {
                    font-size: 48px;
                    margin-bottom: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="icon">🎓</div>
                    <h1>Bachillerato General Estatal<br>"Héroes de la Patria"</h1>
                </div>

                <div class="content">
                    <h2>✉️ Confirma tu mensaje</h2>
                    <p>Hemos recibido tu mensaje sobre: <strong>${formType || 'Contacto General'}</strong></p>

                    <p>Para completar el envío y garantizar que eres una persona real, confirma haciendo clic en el botón:</p>

                    <a href="${verificationLink}" class="verify-btn">
                        ✅ CONFIRMAR MENSAJE
                    </a>

                    <div class="warning">
                        <strong>⏰ Importante:</strong> Este enlace expira en 30 minutos por seguridad.
                    </div>

                    <p style="font-size: 14px; color: #7f8c8d; margin-top: 30px;">
                        Si no enviaste este mensaje, puedes ignorar este email.
                    </p>
                </div>

                <div class="footer">
                    <p><strong>BGE Héroes de la Patria</strong><br>
                    Sistema de Contacto Seguro<br>
                    <em>Este es un email automático, no responder</em></p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Limpiar verificaciones expiradas (ejecutar periódicamente)
     */
    cleanExpiredVerifications() {
        const now = Date.now();
        for (const [token, verification] of this.pendingVerifications.entries()) {
            if (now > verification.expires) {
                this.pendingVerifications.delete(token);
            }
        }
    }

    /**
     * Obtener estadísticas del sistema
     */
    getStats() {
        return {
            pendingVerifications: this.pendingVerifications.size,
            uptime: process.uptime()
        };
    }
}

// Instancia singleton
const verificationService = new VerificationService();

// Limpiar verificaciones expiradas cada 10 minutos
setInterval(() => {
    verificationService.cleanExpiredVerifications();
}, 10 * 60 * 1000);

export default verificationService;
