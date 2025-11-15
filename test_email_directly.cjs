/**
 * Script de prueba para verificar si Nodemailer puede enviar emails
 */
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 TEST DE EMAIL DIRECTO CON NODEMAILER');
console.log('═══════════════════════════════════════════');

const testEmail = 'samuelci6377@gmail.com';
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

console.log(`\n📧 Configuración:
  Email: ${emailUser}
  Password presente: ${emailPass ? '✅ SÍ' : '❌ NO'}
  Test destination: ${testEmail}`);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: emailUser,
        pass: emailPass
    }
});

console.log('\n🔄 Verificando conexión con transporter.verify()...');

transporter.verify((error, success) => {
    if (error) {
        console.log('❌ Error en transporter.verify():');
        console.log(error);
        process.exit(1);
    } else {
        console.log('✅ Transporter verificado correctamente\n');
        console.log('🚀 Enviando email de prueba...\n');

        const mailOptions = {
            from: emailUser,
            to: testEmail,
            subject: '🧪 TEST: Email de Prueba - BGE Sistema',
            html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1a3a52; color: white; padding: 20px; border-radius: 5px; }
        .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
        .success { color: #27ae60; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🧪 TEST: Sistema de Email</h2>
            <p>Bachillerato General Estatal "Héroes de la Patria"</p>
        </div>
        <div class="content">
            <p class="success">✅ ¡El sistema de email FUNCIONA!</p>
            <p>Este email fue enviado exitosamente desde el servidor BGE.</p>
            <p><strong>Detalles:</strong></p>
            <ul>
                <li>Timestamp: ${new Date().toLocaleString('es-MX')}</li>
                <li>Servicio: Nodemailer + Gmail SMTP</li>
                <li>Destinatario: ${testEmail}</li>
                <li>Estado: ✅ ENVIADO</li>
            </ul>
        </div>
    </div>
</body>
</html>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('❌ ERROR ENVIANDO EMAIL:');
                console.log('Message:', error.message);
                console.log('Code:', error.code);
                console.log('Response:', error.response);
                process.exit(1);
            } else {
                console.log('✅ EMAIL ENVIADO EXITOSAMENTE');
                console.log('Response:', info.response);
                console.log('MessageID:', info.messageId);
                console.log('\n📬 Verifica tu inbox en: ' + testEmail);
                process.exit(0);
            }
        });
    }
});
