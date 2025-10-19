/**
 * 📧 PRUEBA AUTOMÁTICA DE CONFIGURACIÓN DE EMAIL
 * Script para validar la configuración SMTP sin intervención manual
 * Fecha: 19 de Octubre, 2025
 */

require('dotenv').config();
const emailService = require('../services/emailService');

async function testEmailAutomatic() {
    console.log('\n📧 PRUEBA AUTOMÁTICA DE EMAIL SMTP\n');
    console.log('============================================================');

    // Verificar variables de entorno
    console.log('🔍 Verificando variables de entorno...');
    const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
    const missingVars = requiredVars.filter(v => !process.env[v]);

    if (missingVars.length > 0) {
        console.error('❌ Variables de entorno faltantes:', missingVars.join(', '));
        process.exit(1);
    }

    console.log('✅ SMTP_HOST:', process.env.SMTP_HOST);
    console.log('✅ SMTP_PORT:', process.env.SMTP_PORT);
    console.log('✅ SMTP_USER:', process.env.SMTP_USER);
    console.log('✅ SMTP_PASS: ****** (configurado)');
    console.log('\n============================================================\n');

    try {
        // Inicializar servicio de email
        console.log('📬 Inicializando servicio de email...');
        await emailService.init();
        console.log('✅ Servicio de email inicializado\n');

        // Email de prueba
        const testEmail = process.env.EMAIL_TO || process.env.SMTP_USER;

        console.log('============================================================');
        console.log(`📨 Enviando email de prueba a: ${testEmail}\n`);

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

        console.log('============================================================');
        console.log('✅ EMAIL ENVIADO EXITOSAMENTE');
        console.log('============================================================');
        console.log('📋 Detalles del envío:');
        console.log('  Message ID:', result.messageId);
        console.log('  Destinatario:', testEmail);
        console.log('  Estado: Aceptado por el servidor SMTP');

        if (process.env.NODE_ENV !== 'production') {
            console.log('\n📧 Vista previa (desarrollo):', result.previewUrl);
        }

        console.log('\n============================================================');
        console.log('🎉 PRUEBA COMPLETADA CON ÉXITO');
        console.log('============================================================\n');

        process.exit(0);

    } catch (error) {
        console.error('\n============================================================');
        console.error('❌ ERROR AL ENVIAR EMAIL');
        console.error('============================================================');
        console.error('Mensaje:', error.message);

        if (error.code) {
            console.error('Código:', error.code);
        }

        console.error('\n📝 Posibles soluciones:');
        console.error('  1. Verifica que SMTP_USER y SMTP_PASS sean correctos');
        console.error('  2. Para Gmail, usa una "Contraseña de Aplicación" (no tu contraseña normal)');
        console.error('  3. Habilita "Acceso de apps menos seguras" en Gmail (si aplica)');
        console.error('  4. Verifica que el puerto SMTP_PORT sea correcto (587 para TLS)');
        console.error('  5. Revisa los logs del servidor SMTP');
        console.error('\n');

        process.exit(1);
    }
}

// Ejecutar prueba
testEmailAutomatic();
