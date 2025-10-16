import { URL } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import nodemailer from 'nodemailer';
import verificationService from './verificationService.js';

// --- Helpers ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JWT_SECRET = process.env.JWT_SECRET || 'SUPER_SECRET_KEY_REPLACE_IN_PRODUCTION';

// ============================================
// CONFIGURACIÓN DE NODEMAILER
// ============================================
let transporter = null;
try {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    console.log('✅ [API] Nodemailer transporter configurado');
} catch (error) {
    console.error('❌ [API] Error configurando nodemailer:', error);
}

async function readJsonFile(fileName) {
    const jsonPath = path.join(__dirname, '..', 'data', fileName);
    const fileContent = await fs.readFile(jsonPath, 'utf8');
    return JSON.parse(fileContent);
}

// --- Handlers para cada ruta ---

async function handleStudents(req, res) {
    try {
        const data = await readJsonFile('estudiantes.json');
        res.status(200).json({ success: true, data: { students: data.estudiantes } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error interno del servidor.' });
    }
}

async function handleTeachers(req, res) {
    try {
        const data = await readJsonFile('docentes.json');
        res.status(200).json({ success: true, data: { teachers: data.docentes } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error interno del servidor.' });
    }
}

async function handleAnalytics(req, res) {
    const analyticsData = { students: { total_estudiantes: 1247 }, teachers: { total_docentes: 68 }, academic: { promedio_general: 8.4 } };
    res.status(200).json({ success: true, data: analyticsData });
}

async function handlePendingRegistrations(req, res) {
    try {
        const requests = await readJsonFile('pending-registrations.json');
        res.status(200).json({ success: true, count: requests.length, requests: requests });
    } catch (error) {
        res.status(200).json({ success: true, count: 0, requests: [] });
    }
}

async function handleStudentsAuth(req, res) {
    const subpath = req.url.replace('/api/students-auth', '') || '/';
    let body = {};
    if (req.method === 'POST') {
        try {
            const chunks = [];
            for await (const chunk of req) { chunks.push(chunk); }
            body = JSON.parse(Buffer.concat(chunks).toString());
        } catch (e) { return res.status(400).json({ success: false, error: 'Invalid JSON' }); }
    }

    switch (subpath) {
        case '/login':
            const { estudiantes } = await readJsonFile('estudiantes.json');
            const student = estudiantes.find(s => s.email === body.email && s.password === body.password);
            if (!student) return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
            
            const token = jwt.sign({ id: student.id, name: student.nombre, role: 'student' }, JWT_SECRET, { expiresIn: '1h' });
            res.setHeader('Set-Cookie', `studentAuthToken=${token}; HttpOnly; Path=/; Secure; SameSite=Strict`);
            return res.status(200).json({ success: true, student: { name: student.nombre } });

        case '/logout':
            res.setHeader('Set-Cookie', `studentAuthToken=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
            return res.status(200).json({ success: true });

        case '/check':
            try {
                const token = req.cookies.studentAuthToken;
                if (!token) return res.status(200).json({ success: true, isAuthenticated: false });
                const decoded = jwt.verify(token, JWT_SECRET);
                return res.status(200).json({ success: true, isAuthenticated: true, student: decoded });
            } catch (e) {
                return res.status(200).json({ success: true, isAuthenticated: false });
            }

        default:
            return res.status(404).json({ success: false, error: 'Sub-ruta de autenticación no encontrada' });
    }
}

async function handleHealth(req, res) {
    res.status(200).json({ success: true, status: 'API is healthy' });
}

// --- Handlers para cada ruta (Nuevos) ---

async function handleSubjects(req, res) {
    try {
        // Intenta leer de un archivo JSON si existe
        const data = await readJsonFile('subjects.json'); // Asegúrate de tener un data/subjects.json
        res.status(200).json({ success: true, data: { subjects: data.subjects } });
    } catch (error) {
        // Si el archivo no existe o hay un error, devuelve datos mockeados
        res.status(200).json({ success: true, data: { subjects: [
            { id: 'SUB001', name: 'Matemáticas', code: 'MAT101', description: 'Curso de matemáticas básicas' },
            { id: 'SUB002', name: 'Física', code: 'FIS201', description: 'Introducción a la física' },
            { id: 'SUB003', name: 'Química', code: 'QUI301', description: 'Fundamentos de química' }
        ]}});
    }
}

async function handleGamificationProfile(req, res, identifier) { // Añade 'identifier' como parámetro
        // Usa el 'identifier' para devolver datos específicos del perfil
        res.status(200).json({ success: true, data: {
            user: identifier || 'default', // Usa el identificador aquí
            level: 10,
            points: 1500,
            badges: ['first_login', 'early_adopter'],
            rank: 'Gold'
        }});
    }
async function handleGamificationDailyChallenges(req, res) {
    // Datos mockeados para desafíos diarios
    res.status(200).json({ success: true, data: {
        challenges: [
            { id: 'CHL001', name: 'Completar 3 tareas', points: 50, completed: false, deadline: '2025-10-16' },
            { id: 'CHL002', name: 'Iniciar sesión 3 días seguidos', points: 100, completed: true, deadline: '2025-10-15' },
            { id: 'CHL003', name: 'Participar en foro', points: 75, completed: false, deadline: '2025-10-17' }
        ]
    }});
}

async function handleCalendarEvents(req, res) {
    // Puedes leer de un archivo JSON o devolver datos mockeados
    try {
        const data = await readJsonFile('eventos.json'); // Asegúrate de tener un data/eventos.json
        res.status(200).json({ success: true, data: { events: data.events } });
    } catch (error) {
        res.status(200).json({ success: true, data: { events: [
            { id: 'EVT001', title: 'Reunión de Padres', date: '2025-10-20', time: '18:00', location: 'Zoom' },
            { id: 'EVT002', title: 'Examen Final Matemáticas', date: '2025-10-25', time: '09:00', subject: 'Matemáticas' },
            { id: 'EVT003', title: 'Festival de Otoño', date: '2025-11-05', time: '10:00', location: 'Patio Central' }
        ]}});
    }
}

// ============================================
// HANDLER DE CONTACT/SEND - CON VERIFICACIÓN
// ============================================
async function handleContactSend(req, res) {
    try {
        // Parse body desde request stream
        const chunks = [];
        for await (const chunk of req) {
            chunks.push(chunk);
        }
        const body = JSON.parse(Buffer.concat(chunks).toString());

        const { nombre, email, telefono, asunto, mensaje, form_type } = body;

        console.log('📧 [API] Nuevo mensaje de contacto recibido (requiere verificación):', {
            nombre: nombre?.substring(0, 20),
            email: email?.substring(0, 30),
            form_type
        });

        // Validaciones básicas
        if (!nombre || !email || !asunto || !mensaje) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: nombre, email, asunto, mensaje'
            });
        }

        // Validar email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'El email no es válido'
            });
        }

        // ✅ CREAR VERIFICACIÓN - NO ENVIAR DIRECTO A LA ESCUELA
        // Esto envía el email de confirmación al usuario con el botón "CONFIRMAR MENSAJE"
        const token = await verificationService.createVerification({
            nombre,
            name: nombre,
            email,
            telefono,
            phone: telefono,
            asunto,
            subject: asunto,
            mensaje,
            message: mensaje,
            form_type
        });

        console.log(`✅ [API] Email de verificación enviado a: ${email}`);
        console.log(`🔐 [API] Token generado: ${token.substring(0, 8)}...`);

        res.status(200).json({
            success: true,
            message: '📧 Se ha enviado un email de confirmación a tu correo. Por favor revisa tu bandeja de entrada y haz clic en el botón "CONFIRMAR MENSAJE" para completar el envío.',
            requiresVerification: true,
            verificationSent: true
        });

    } catch (error) {
        console.error('❌ [API] Error en handleContactSend:', error);

        // Si el error es de cooldown, enviar mensaje específico
        if (error.message && error.message.includes('espera')) {
            return res.status(429).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al enviar el mensaje. Por favor intenta nuevamente.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

// ============================================
// HANDLER DE CONTACT/VERIFY - CONFIRMACIÓN
// ============================================
async function handleContactVerify(req, res, token) {
    try {
        console.log(`🔍 [API] Verificando token: ${token.substring(0, 8)}...`);

        // Verificar el token
        const verification = verificationService.verifyToken(token);

        if (!verification.success) {
            console.warn(`⚠️ [API] Token inválido o expirado: ${token.substring(0, 8)}...`);

            // Responder con HTML de error
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(400).send(`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Error - Verificación</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
                        .container { background: white; border-radius: 15px; padding: 40px; max-width: 500px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); text-align: center; }
                        .icon { font-size: 64px; margin-bottom: 20px; }
                        h1 { color: #e74c3c; margin: 0 0 20px 0; }
                        p { color: #666; line-height: 1.6; margin-bottom: 30px; }
                        .btn { display: inline-block; background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; }
                        .btn:hover { background: #2980b9; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="icon">❌</div>
                        <h1>Token Inválido o Expirado</h1>
                        <p>${verification.error || 'El enlace de verificación ha expirado o es inválido.'}</p>
                        <p>Por favor envía tu mensaje nuevamente desde el formulario de contacto.</p>
                        <a href="/" class="btn">Volver al Inicio</a>
                    </div>
                </body>
                </html>
            `);
        }

        // ✅ Token válido - Ahora SÍ enviar el email a la escuela
        const formData = verification.data;
        console.log(`✅ [API] Token válido, enviando mensaje a la escuela desde: ${formData.email}`);

        // Verificar que transporter esté configurado
        if (!transporter || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error('Email transporter no configurado');
        }

        // Crear HTML para el email final a la escuela
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
                    .field { margin-bottom: 15px; }
                    .label { font-weight: bold; color: #1e3a8a; }
                    .value { color: #4b5563; margin-top: 5px; }
                    .footer { background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
                    .verified-badge { background: #10b981; color: white; padding: 5px 10px; border-radius: 5px; display: inline-block; margin-top: 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>🎓 BGE Héroes de la Patria</h2>
                        <p>${formData.form_type || 'Nuevo Mensaje de Contacto'}</p>
                        <div class="verified-badge">✅ Email Verificado</div>
                    </div>
                    <div class="content">
                        <div class="field">
                            <div class="label">👤 Nombre:</div>
                            <div class="value">${formData.nombre || formData.name}</div>
                        </div>
                        <div class="field">
                            <div class="label">📧 Email:</div>
                            <div class="value">${formData.email}</div>
                        </div>
                        ${formData.telefono || formData.phone ? `
                        <div class="field">
                            <div class="label">📞 Teléfono:</div>
                            <div class="value">${formData.telefono || formData.phone}</div>
                        </div>
                        ` : ''}
                        <div class="field">
                            <div class="label">📋 Asunto:</div>
                            <div class="value">${formData.asunto || formData.subject}</div>
                        </div>
                        <div class="field">
                            <div class="label">💬 Mensaje:</div>
                            <div class="value" style="white-space: pre-wrap;">${formData.mensaje || formData.message}</div>
                        </div>
                    </div>
                    <div class="footer">
                        <p><strong>BGE Héroes de la Patria</strong><br>
                        Sistema de Contacto Seguro con Verificación<br>
                        Fecha: ${new Date().toLocaleString('es-MX')}</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Configurar email final a la escuela
        const mailOptions = {
            from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_TO || '21ebh0200x.sep@gmail.com',
            replyTo: formData.email,
            subject: `✅ [VERIFICADO] ${formData.form_type || 'Contacto'}: ${formData.asunto || formData.subject}`,
            html: htmlContent,
            text: `
Nuevo mensaje de contacto VERIFICADO - ${formData.form_type}

Nombre: ${formData.nombre || formData.name}
Email: ${formData.email}
${formData.telefono || formData.phone ? `Teléfono: ${formData.telefono || formData.phone}` : ''}
Asunto: ${formData.asunto || formData.subject}

Mensaje:
${formData.mensaje || formData.message}

---
✅ Email verificado por el usuario
Enviado: ${new Date().toLocaleString('es-MX')}
            `.trim()
        };

        // Enviar email a la escuela
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [API] Email enviado a la escuela - MessageID: ${info.messageId}`);

        // Responder con HTML de éxito
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Mensaje Confirmado</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
                    .container { background: white; border-radius: 15px; padding: 40px; max-width: 500px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); text-align: center; animation: slideIn 0.5s ease-out; }
                    @keyframes slideIn { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                    .icon { font-size: 64px; margin-bottom: 20px; animation: bounce 1s ease-in-out; }
                    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
                    h1 { color: #27ae60; margin: 0 0 20px 0; }
                    p { color: #666; line-height: 1.6; margin-bottom: 30px; }
                    .info { background: #e8f5e9; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0; text-align: left; }
                    .timer { color: #999; font-size: 14px; margin-top: 20px; }
                </style>
                <script>
                    let countdown = 5;
                    setInterval(() => {
                        countdown--;
                        document.getElementById('countdown').textContent = countdown;
                        if (countdown === 0) {
                            window.close();
                        }
                    }, 1000);
                </script>
            </head>
            <body>
                <div class="container">
                    <div class="icon">✅</div>
                    <h1>¡Mensaje Confirmado!</h1>
                    <p>Tu mensaje ha sido verificado y enviado correctamente a BGE Héroes de la Patria.</p>
                    <div class="info">
                        <strong>📧 Respuesta:</strong> Nos pondremos en contacto contigo pronto al correo <strong>${formData.email}</strong>
                    </div>
                    <p class="timer">Esta ventana se cerrará automáticamente en <span id="countdown">5</span> segundos...</p>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('❌ [API] Error en handleContactVerify:', error);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(500).send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Error</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
                    .container { background: white; border-radius: 15px; padding: 40px; max-width: 500px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); text-align: center; }
                    .icon { font-size: 64px; margin-bottom: 20px; }
                    h1 { color: #e74c3c; margin: 0 0 20px 0; }
                    p { color: #666; line-height: 1.6; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">⚠️</div>
                    <h1>Error al Procesar</h1>
                    <p>Hubo un error al procesar tu verificación. Por favor intenta nuevamente o contacta al administrador.</p>
                </div>
            </body>
            </html>
        `);
    }
}

// ============================================
// HANDLER DE INSCRIPTIONS/REGISTER
// ============================================
async function handleInscriptionsRegister(req, res) {
    try {
        const chunks = [];
        for await (const chunk of req) {
            chunks.push(chunk);
        }
        const body = JSON.parse(Buffer.concat(chunks).toString());

        const { studentName, studentEmail, activityId, activityName, comments } = body;

        console.log('📝 [API] Nueva inscripción recibida:', {
            studentName,
            activityName
        });

        // Validaciones básicas
        if (!studentName || !studentEmail || !activityId) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos'
            });
        }

        // ✅ CREAR VERIFICACIÓN para inscripción
        const token = await verificationService.createVerification({
            nombre: studentName,
            name: studentName,
            email: studentEmail,
            asunto: `Inscripción a actividad: ${activityName}`,
            subject: `Inscripción a actividad: ${activityName}`,
            mensaje: `Solicitud de inscripción a la actividad "${activityName}". ${comments ? `Comentarios: ${comments}` : ''}`,
            message: `Solicitud de inscripción a la actividad "${activityName}". ${comments ? `Comentarios: ${comments}` : ''}`,
            form_type: 'Inscripción a Actividad',
            activityId,
            activityName,
            comments
        });

        console.log(`✅ [API] Email de verificación enviado para inscripción`);

        res.status(200).json({
            success: true,
            message: '📧 Se ha enviado un email de confirmación. Revisa tu bandeja de entrada y confirma tu inscripción.',
            requiresVerification: true
        });

    } catch (error) {
        console.error('❌ [API] Error en handleInscriptionsRegister:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar inscripción'
        });
    }
}

// ============================================
// HANDLER DE EGRESADOS
// ============================================
async function handleEgresados(req, res) {
    try {
        const chunks = [];
        for await (const chunk of req) {
            chunks.push(chunk);
        }
        const body = JSON.parse(Buffer.concat(chunks).toString());

        const { nombre, apellido, email, telefono, anioEgreso, carreraActual, empresa, puesto } = body;

        console.log('👨‍🎓 [API] Actualización de egresado recibida:', {
            nombre,
            apellido,
            email
        });

        // Validaciones básicas
        if (!nombre || !apellido || !email || !anioEgreso) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: nombre, apellido, email, año de egreso'
            });
        }

        // ✅ CREAR VERIFICACIÓN para actualización de egresado
        const token = await verificationService.createVerification({
            nombre: `${nombre} ${apellido}`,
            name: `${nombre} ${apellido}`,
            email,
            telefono,
            phone: telefono,
            asunto: `Actualización de datos de egresado: ${nombre} ${apellido}`,
            subject: `Actualización de datos de egresado: ${nombre} ${apellido}`,
            mensaje: `Año de egreso: ${anioEgreso}\n${carreraActual ? `Carrera actual: ${carreraActual}\n` : ''}${empresa ? `Empresa: ${empresa}\n` : ''}${puesto ? `Puesto: ${puesto}` : ''}`,
            message: `Año de egreso: ${anioEgreso}\n${carreraActual ? `Carrera actual: ${carreraActual}\n` : ''}${empresa ? `Empresa: ${empresa}\n` : ''}${puesto ? `Puesto: ${puesto}` : ''}`,
            form_type: 'Actualización de Egresado',
            anioEgreso,
            carreraActual,
            empresa,
            puesto
        });

        console.log(`✅ [API] Email de verificación enviado para actualización de egresado`);

        res.status(200).json({
            success: true,
            message: '📧 Se ha enviado un email de confirmación. Por favor verifica tu correo para completar la actualización.',
            requiresVerification: true
        });

    } catch (error) {
        console.error('❌ [API] Error en handleEgresados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar actualización de egresado'
        });
    }
}

// --- Router Principal ---

export default async function handler(req, res) {
    // Middleware de cookie-parser
    await new Promise(resolve => cookieParser()(req, res, resolve));

    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    // Rutas que requieren manejo de sub-rutas
    if (path.startsWith('/api/students-auth')) {
        return handleStudentsAuth(req, res);
    }
    // NUEVO: Manejar rutas de perfil de gamificación dinámicas
    if (path.startsWith('/api/gamification/profile/')) {
        const parts = path.split('/');
        const identifier = parts[parts.length - 1]; // Extrae "admin@bge.edu.mx"
        return handleGamificationProfile(req, res, identifier);
    }
    // ✅ NUEVO: Manejar verificación de tokens
    if (path.startsWith('/api/contact/verify/')) {
        const parts = path.split('/');
        const token = parts[parts.length - 1];
        return handleContactVerify(req, res, token);
    }

    // Rutas de coincidencia exacta
    switch (path) {
        case '/api/students':
            return handleStudents(req, res);
        case '/api/teachers':
            return handleTeachers(req, res);
        case '/api/analytics':
        case '/api/analytics/dashboard':
            return handleAnalytics(req, res);
        case '/api/admin/pending-registrations':
            return handlePendingRegistrations(req, res);
        case '/api/health':
            return handleHealth(req, res);
        case '/api/subjects':
            return handleSubjects(req, res);
        case '/api/gamification/daily-challenges':
            return handleGamificationDailyChallenges(req, res);
        case '/api/calendar/events':
            return handleCalendarEvents(req, res);
        case '/api/contact/send': // ✅ NUEVO: Formulario de contacto
            if (req.method === 'POST') {
                return handleContactSend(req, res);
            } else {
                return res.status(405).json({ success: false, error: 'Método no permitido. Usa POST.' });
            }

        case '/api/inscriptions/register': // ✅ NUEVO: Inscripciones a actividades
            if (req.method === 'POST') {
                return handleInscriptionsRegister(req, res);
            } else {
                return res.status(405).json({ success: false, error: 'Método no permitido. Usa POST.' });
            }

        case '/api/egresados': // ✅ NUEVO: Actualización de egresados
            if (req.method === 'POST') {
                return handleEgresados(req, res);
            } else {
                return res.status(405).json({ success: false, error: 'Método no permitido. Usa POST.' });
            }

        default:
            res.status(404).json({ success: false, error: `Ruta no encontrada: ${path}` });
    }
}
