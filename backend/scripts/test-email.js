/**
 * 📧 TEST DE CONFIGURACIÓN DE EMAIL
 * Script para verificar que el servicio de email funciona correctamente
 * Fecha: 19 de Octubre, 2025
 */

const emailService = require('../services/emailService');
const devLogger = require('../utils/devLogger');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

async function testEmail() {
    devLogger.log('📧 VERIFICACIÓN DE CONFIGURACIÓN DE EMAIL\n');
    devLogger.log('='.repeat(60));

    try {
        // Verificar variables de entorno
        devLogger.log('🔍 Verificando variables de entorno...');

        if (!process.env.SMTP_HOST) {
            devLogger.log('⚠️  SMTP_HOST no configurado');
        } else {
            devLogger.log(`✅ SMTP_HOST: ${process.env.SMTP_HOST}`);
        }

        if (!process.env.SMTP_PORT) {
            devLogger.log('⚠️  SMTP_PORT no configurado');
        } else {
            devLogger.log(`✅ SMTP_PORT: ${process.env.SMTP_PORT}`);
        }

        if (!process.env.SMTP_USER) {
            devLogger.log('⚠️  SMTP_USER no configurado');
        } else {
            devLogger.log(`✅ SMTP_USER: ${process.env.SMTP_USER}`);
        }

        if (!process.env.SMTP_PASS) {
            devLogger.log('⚠️  SMTP_PASS no configurado');
        } else {
            devLogger.log(`✅ SMTP_PASS: ****** (configurado)`);
        }

        devLogger.log('\n' + '='.repeat(60));

        // Inicializar servicio de email
        devLogger.log('\n📬 Inicializando servicio de email...');
        await emailService.init();

        devLogger.log('✅ Servicio de email inicializado\n');
        devLogger.log('='.repeat(60));

        // Obtener email de prueba
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const testEmail = await new Promise(resolve => {
            readline.question('\n📩 Ingresa el email de prueba (o presiona Enter para usar el SMTP_USER): ', answer => {
                readline.close();
                resolve(answer.trim() || process.env.SMTP_USER);
            });
        });

        devLogger.log(`\n🚀 Enviando email de prueba a: ${testEmail}...\n`);

        // Enviar email de bienvenida de prueba
        const result = await emailService.sendWelcomeEmail({
            email: testEmail,
            nombre: 'Usuario de Prueba'
        });

        devLogger.log('='.repeat(60));
        devLogger.log('✅ EMAIL ENVIADO EXITOSAMENTE\n');
        devLogger.log(`📧 Destinatario: ${testEmail}`);
        devLogger.log(`📬 Message ID: ${result.messageId}`);

        if (result.previewUrl) {
            devLogger.log(`\n🔗 Vista Previa (Ethereal Email):`);
            devLogger.log(`   ${result.previewUrl}\n`);
            devLogger.log(`   Copia este link en tu navegador para ver el email`);
        } else {
            devLogger.log(`\n📫 Email enviado a tu bandeja de entrada`);
            devLogger.log(`   Revisa tu email (puede tardar unos segundos)\n`);
        }

        devLogger.log('='.repeat(60));

        devLogger.log('\n✅ CONFIGURACIÓN DE EMAIL CORRECTA\n');

        process.exit(0);

    } catch (error) {
        devLogger.error('\n' + '='.repeat(60));
        devLogger.error('❌ ERROR EN CONFIGURACIÓN DE EMAIL\n');
        devLogger.error('Detalles:', error.message);

        if (error.code === 'ECONNREFUSED') {
            devLogger.error('\n🔧 Posibles causas:');
            devLogger.error('  • SMTP_HOST incorrecto');
            devLogger.error('  • SMTP_PORT incorrecto');
            devLogger.error('  • Firewall bloqueando la conexión');
        } else if (error.message.includes('auth')) {
            devLogger.error('\n🔧 Posibles causas:');
            devLogger.error('  • SMTP_USER incorrecto');
            devLogger.error('  • SMTP_PASS incorrecto');
            devLogger.error('  • Autenticación de 2 factores activa (usa contraseña de aplicación)');
        }

        devLogger.error('\n📝 Verifica tu archivo .env:');
        devLogger.error('  SMTP_HOST=smtp.gmail.com');
        devLogger.error('  SMTP_PORT=587');
        devLogger.error('  SMTP_USER=tu_email@gmail.com');
        devLogger.error('  SMTP_PASS=tu_contraseña_de_aplicación');
        devLogger.error('='.repeat(60) + '\n');

        process.exit(1);
    }
}

// Ejecutar test
testEmail();
