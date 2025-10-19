/**
 * 📧 TEST DE CONFIGURACIÓN DE EMAIL
 * Script para verificar que el servicio de email funciona correctamente
 * Fecha: 19 de Octubre, 2025
 */

const emailService = require('../services/emailService');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

async function testEmail() {
    console.log('📧 VERIFICACIÓN DE CONFIGURACIÓN DE EMAIL\n');
    console.log('='.repeat(60));

    try {
        // Verificar variables de entorno
        console.log('🔍 Verificando variables de entorno...');

        if (!process.env.SMTP_HOST) {
            console.log('⚠️  SMTP_HOST no configurado');
        } else {
            console.log(`✅ SMTP_HOST: ${process.env.SMTP_HOST}`);
        }

        if (!process.env.SMTP_PORT) {
            console.log('⚠️  SMTP_PORT no configurado');
        } else {
            console.log(`✅ SMTP_PORT: ${process.env.SMTP_PORT}`);
        }

        if (!process.env.SMTP_USER) {
            console.log('⚠️  SMTP_USER no configurado');
        } else {
            console.log(`✅ SMTP_USER: ${process.env.SMTP_USER}`);
        }

        if (!process.env.SMTP_PASS) {
            console.log('⚠️  SMTP_PASS no configurado');
        } else {
            console.log(`✅ SMTP_PASS: ****** (configurado)`);
        }

        console.log('\n' + '='.repeat(60));

        // Inicializar servicio de email
        console.log('\n📬 Inicializando servicio de email...');
        await emailService.init();

        console.log('✅ Servicio de email inicializado\n');
        console.log('='.repeat(60));

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

        console.log(`\n🚀 Enviando email de prueba a: ${testEmail}...\n`);

        // Enviar email de bienvenida de prueba
        const result = await emailService.sendWelcomeEmail({
            email: testEmail,
            nombre: 'Usuario de Prueba'
        });

        console.log('='.repeat(60));
        console.log('✅ EMAIL ENVIADO EXITOSAMENTE\n');
        console.log(`📧 Destinatario: ${testEmail}`);
        console.log(`📬 Message ID: ${result.messageId}`);

        if (result.previewUrl) {
            console.log(`\n🔗 Vista Previa (Ethereal Email):`);
            console.log(`   ${result.previewUrl}\n`);
            console.log(`   Copia este link en tu navegador para ver el email`);
        } else {
            console.log(`\n📫 Email enviado a tu bandeja de entrada`);
            console.log(`   Revisa tu email (puede tardar unos segundos)\n`);
        }

        console.log('='.repeat(60));

        console.log('\n✅ CONFIGURACIÓN DE EMAIL CORRECTA\n');

        process.exit(0);

    } catch (error) {
        console.error('\n' + '='.repeat(60));
        console.error('❌ ERROR EN CONFIGURACIÓN DE EMAIL\n');
        console.error('Detalles:', error.message);

        if (error.code === 'ECONNREFUSED') {
            console.error('\n🔧 Posibles causas:');
            console.error('  • SMTP_HOST incorrecto');
            console.error('  • SMTP_PORT incorrecto');
            console.error('  • Firewall bloqueando la conexión');
        } else if (error.message.includes('auth')) {
            console.error('\n🔧 Posibles causas:');
            console.error('  • SMTP_USER incorrecto');
            console.error('  • SMTP_PASS incorrecto');
            console.error('  • Autenticación de 2 factores activa (usa contraseña de aplicación)');
        }

        console.error('\n📝 Verifica tu archivo .env:');
        console.error('  SMTP_HOST=smtp.gmail.com');
        console.error('  SMTP_PORT=587');
        console.error('  SMTP_USER=tu_email@gmail.com');
        console.error('  SMTP_PASS=tu_contraseña_de_aplicación');
        console.error('='.repeat(60) + '\n');

        process.exit(1);
    }
}

// Ejecutar test
testEmail();
