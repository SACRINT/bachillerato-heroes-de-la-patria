/**
 * 📧 PRUEBA AUTOMÁTICA DE CONFIGURACIÓN DE EMAIL
 * Script para validar la configuración SMTP sin intervención manual
 * Fecha: 19 de Octubre, 2025
 */

require('dotenv').config();
const emailService = require('../services/emailService');
const devLogger = require('../utils/devLogger');

async function testEmailAutomatic() {
    devLogger.log('\n📧 PRUEBA AUTOMÁTICA DE EMAIL SMTP\n');
    devLogger.log('============================================================');

    // Verificar variables de entorno
    devLogger.log('🔍 Verificando variables de entorno...');
    const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
    const missingVars = requiredVars.filter(v => !process.env[v]);

    if (missingVars.length > 0) {
        devLogger.error('❌ Variables de entorno faltantes:', missingVars.join(', '));
        process.exit(1);
    }

    devLogger.log('✅ SMTP_HOST:', process.env.SMTP_HOST);
    devLogger.log('✅ SMTP_PORT:', process.env.SMTP_PORT);
    devLogger.log('✅ SMTP_USER:', process.env.SMTP_USER);
    devLogger.log('✅ SMTP_PASS: ****** (configurado)');
    devLogger.log('\n============================================================\n');

    try {
        // Inicializar servicio de email
        devLogger.log('📬 Inicializando servicio de email...');
        await emailService.init();
        devLogger.log('✅ Servicio de email inicializado\n');

        // Email de prueba
        const testEmail = process.env.EMAIL_TO || process.env.SMTP_USER;

        devLogger.log('============================================================');
        devLogger.log(`📨 Enviando email de prueba a: ${testEmail}\n`);

        // Enviar email de prueba
        const result = await emailService.sendEmail({
            to: testEmail,
            subject: '🧪 Prueba de Configuración SMTP - BGE Heroes',
            template: 'test',
            data: {
                titulo: 'Configuración SMTP Exitosa',
                mensaje: 'Este es un email de prueba para validar la configuración SMTP del sistema BGE Héroes de la Patria.',
                fecha: new Date().toLocaleString('es-MX'),
                detalles: [
                    `Servidor SMTP: ${process.env.SMTP_HOST}`,
                    `Puerto: ${process.env.SMTP_PORT}`,
                    `Usuario: ${process.env.SMTP_USER}`,
                    `Versión: v2.6.0 - Ready for Production`
                ]
            }
        });

        devLogger.log('============================================================');
        devLogger.log('✅ EMAIL ENVIADO EXITOSAMENTE');
        devLogger.log('============================================================');
        devLogger.log('📋 Detalles del envío:');
        devLogger.log('  Message ID:', result.messageId);
        devLogger.log('  Destinatario:', testEmail);
        devLogger.log('  Estado: Aceptado por el servidor SMTP');

        if (process.env.NODE_ENV !== 'production') {
            devLogger.log('\n📧 Vista previa (desarrollo):', result.previewUrl);
        }

        devLogger.log('\n============================================================');
        devLogger.log('🎉 PRUEBA COMPLETADA CON ÉXITO');
        devLogger.log('============================================================\n');

        process.exit(0);

    } catch (error) {
        devLogger.error('\n============================================================');
        devLogger.error('❌ ERROR AL ENVIAR EMAIL');
        devLogger.error('============================================================');
        devLogger.error('Mensaje:', error.message);

        if (error.code) {
            devLogger.error('Código:', error.code);
        }

        devLogger.error('\n📝 Posibles soluciones:');
        devLogger.error('  1. Verifica que SMTP_USER y SMTP_PASS sean correctos');
        devLogger.error('  2. Para Gmail, usa una "Contraseña de Aplicación" (no tu contraseña normal)');
        devLogger.error('  3. Habilita "Acceso de apps menos seguras" en Gmail (si aplica)');
        devLogger.error('  4. Verifica que el puerto SMTP_PORT sea correcto (587 para TLS)');
        devLogger.error('  5. Revisa los logs del servidor SMTP');
        devLogger.error('\n');

        process.exit(1);
    }
}

// Ejecutar prueba
testEmailAutomatic();
