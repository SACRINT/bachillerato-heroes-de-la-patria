/**
 * 🔐 SERVICIO DE VERIFICACIÓN HÍBRIDO
 * Sistema de verificación por email + reCAPTCHA
 * Máxima seguridad contra spam
 */

const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
require('dotenv').config();

class VerificationService {
    constructor() {
        // Almacén temporal de verificaciones (en memoria)
        this.pendingVerifications = new Map();

        // Configurar transporter REAL de Gmail
        this.transporter = this.createTransporter();

        console.log('📧 [VERIFICATION SERVICE] Transporter de Gmail configurado');
        console.log('📧 Usuario de email:', process.env.EMAIL_USER);
    }

    createTransporter() {
        // Transporter REAL de Gmail usando nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Verificar la conexión al iniciar
        transporter.verify((error, success) => {
            if (error) {
                console.error('❌ [VERIFICATION SERVICE] Error al conectar con Gmail:', error);
            } else {
                console.log('✅ [VERIFICATION SERVICE] Conexión con Gmail exitosa');
            }
        });

        return transporter;
    }

    /**
     * Crear token de verificación
     */
    async createVerification(formData) {
        const token = uuidv4();
        const expirationTime = Date.now() + (30 * 60 * 1000); // 30 minutos

        this.pendingVerifications.set(token, {
            data: formData,
            email: formData.email,
            expires: expirationTime,
            created: Date.now()
        });

        return token;
    }

    /**
     * Verificar token
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

        const data = verification.data;
        this.pendingVerifications.delete(token);

        return { success: true, data };
    }

    /**
     * Limpiar verificaciones expiradas
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
     * Estadísticas
     */
    getStats() {
        return {
            pendingVerifications: this.pendingVerifications.size,
            uptime: process.uptime()
        };
    }
}

const verificationService = new VerificationService();

// Limpiar cada 10 minutos
setInterval(() => {
    verificationService.cleanExpiredVerifications();
}, 10 * 60 * 1000);

module.exports = verificationService;
