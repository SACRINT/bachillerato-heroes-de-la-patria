/**
 * 🔐 SERVICIO DE VERIFICACIÓN PARA VERCEL SERVERLESS
 * Sistema de verificación por email + token
 * Máxima seguridad contra spam
 */

const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const devLogger = require('../utils/devLogger');
const { pool } = require('../config/database');
require('dotenv').config();

class VerificationService {
    constructor() {
        // ✅ AHORA USA PostgreSQL EN LUGAR DE Map() EN MEMORIA
        // Esto resuelve el problema de tokens perdidos en Vercel serverless

        // Control de re-envíos por email (sigue usando Map por ser temporal)
        this.emailCooldowns = new Map(); // { email: timestamp }
        this.COOLDOWN_TIME = 2 * 60 * 1000; // 2 minutos entre envíos

        // Configurar transporter
        this.transporter = this.createTransporter();
    }

    createTransporter() {
        // Verificar si tenemos credenciales reales de Gmail configuradas
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            devLogger.log('📧 [VERIFICATION SERVICE] Configurando transporter Gmail...');

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            transporter.verify((error, success) => {
                if (error) {
                    devLogger.error('❌ [VERIFICATION SERVICE] Error al conectar con Gmail:', error);
                } else {
                    devLogger.log('✅ [VERIFICATION SERVICE] Conexión con Gmail exitosa');
                }
            });
            return transporter;
        }

        devLogger.warn('⚠️ [VERIFICATION SERVICE] EMAIL_USER/EMAIL_PASS no configuradas');
        return null;
    }

    /**
     * Crear token de verificación y enviar email
     * ✅ AHORA USA POSTGRESQL PARA PERSISTENCIA
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
        const expiresAt = new Date(Date.now() + (30 * 60 * 1000)); // 30 minutos

        // ✅ GUARDAR EN POSTGRESQL (en lugar de Map)
        const query = `
            INSERT INTO verification_tokens (
                token, email, form_data, form_type, expires_at, ip_address, user_agent
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING token
        `;

        const values = [
            token,
            email,
            JSON.stringify(formData),
            formData.form_type || 'Contacto General',
            expiresAt,
            formData.ip_address || null,
            formData.user_agent || null
        ];

        try {
            await pool.query(query, values);
            devLogger.log(`✅ [VERIFICATION] Token ${token.substring(0, 8)}... guardado en DB`);
        } catch (error) {
            devLogger.error('❌ [VERIFICATION] Error guardando token en DB:', error);
            throw new Error('Error al crear verificación');
        }

        // Enviar email de confirmación
        await this.sendVerificationEmail(email, token, formData.form_type);

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
     * ✅ AHORA LEE DESDE POSTGRESQL
     */
    async verifyToken(token) {
        try {
            // Buscar token en base de datos
            const query = `
                SELECT *
                FROM verification_tokens
                WHERE token = $1
                AND used_at IS NULL
            `;

            const result = await pool.query(query, [token]);

            if (result.rows.length === 0) {
                return { success: false, error: 'Token inválido' };
            }

            const verification = result.rows[0];

            // Verificar si expiró
            if (new Date() > new Date(verification.expires_at)) {
                return { success: false, error: 'Token expirado' };
            }

            // Marcar token como usado
            const updateQuery = `
                UPDATE verification_tokens
                SET used_at = NOW()
                WHERE token = $1
            `;
            await pool.query(updateQuery, [token]);

            // Retornar datos del formulario
            const data = typeof verification.form_data === 'string'
                ? JSON.parse(verification.form_data)
                : verification.form_data;

            devLogger.log(`✅ [VERIFICATION] Token ${token.substring(0, 8)}... verificado exitosamente`);

            return { success: true, data };

        } catch (error) {
            devLogger.error('❌ [VERIFICATION] Error verificando token:', error);
            return { success: false, error: 'Error al verificar token' };
        }
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
     * ✅ AHORA LIMPIA DESDE POSTGRESQL
     */
    async cleanExpiredVerifications() {
        try {
            const query = `
                DELETE FROM verification_tokens
                WHERE expires_at < NOW()
                OR (used_at IS NOT NULL AND used_at < NOW() - INTERVAL '7 days')
            `;

            const result = await pool.query(query);
            devLogger.log(`🧹 [VERIFICATION] Limpieza: ${result.rowCount} tokens eliminados`);

            return result.rowCount;
        } catch (error) {
            devLogger.error('❌ [VERIFICATION] Error limpiando tokens:', error);
            return 0;
        }
    }

    /**
     * Obtener estadísticas del sistema
     * ✅ AHORA LEE DESDE POSTGRESQL
     */
    async getStats() {
        try {
            const query = `
                SELECT
                    COUNT(*) FILTER (WHERE used_at IS NULL AND expires_at > NOW()) as pending,
                    COUNT(*) FILTER (WHERE used_at IS NOT NULL) as used,
                    COUNT(*) FILTER (WHERE expires_at < NOW()) as expired
                FROM verification_tokens
            `;

            const result = await pool.query(query);
            const stats = result.rows[0];

            return {
                pendingVerifications: parseInt(stats.pending || 0),
                usedVerifications: parseInt(stats.used || 0),
                expiredVerifications: parseInt(stats.expired || 0),
                uptime: process.uptime()
            };
        } catch (error) {
            devLogger.error('❌ [VERIFICATION] Error obteniendo stats:', error);
            return {
                pendingVerifications: 0,
                usedVerifications: 0,
                expiredVerifications: 0,
                uptime: process.uptime(),
                error: error.message
            };
        }
    }
}

// Instancia singleton
const verificationService = new VerificationService();

// Limpiar verificaciones expiradas cada 10 minutos
setInterval(() => {
    verificationService.cleanExpiredVerifications();
}, 10 * 60 * 1000);

module.exports = verificationService;