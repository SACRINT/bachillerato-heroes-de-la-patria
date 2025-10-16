import { URL } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import nodemailer from 'nodemailer';

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
// HANDLER DE CONTACT/SEND
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

        console.log('📧 [API] Nuevo mensaje de contacto recibido:', {
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

        // ✅ Verificar que transporter esté configurado
        if (!transporter || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('⚠️ [API] Variables de entorno EMAIL_USER/EMAIL_PASS no configuradas');
            return res.status(503).json({
                success: false,
                message: 'El sistema de email no está configurado. Por favor contacta al administrador.',
                code: 'EMAIL_NOT_CONFIGURED'
            });
        }

        // Crear HTML para el email
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
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>🎓 BGE Héroes de la Patria</h2>
                        <p>${form_type || 'Nuevo Mensaje de Contacto'}</p>
                    </div>
                    <div class="content">
                        <div class="field">
                            <div class="label">👤 Nombre:</div>
                            <div class="value">${nombre}</div>
                        </div>
                        <div class="field">
                            <div class="label">📧 Email:</div>
                            <div class="value">${email}</div>
                        </div>
                        ${telefono ? `
                        <div class="field">
                            <div class="label">📞 Teléfono:</div>
                            <div class="value">${telefono}</div>
                        </div>
                        ` : ''}
                        <div class="field">
                            <div class="label">📋 Asunto:</div>
                            <div class="value">${asunto}</div>
                        </div>
                        <div class="field">
                            <div class="label">💬 Mensaje:</div>
                            <div class="value" style="white-space: pre-wrap;">${mensaje}</div>
                        </div>
                    </div>
                    <div class="footer">
                        <p>Enviado desde el sistema de contacto web - BGE Héroes de la Patria</p>
                        <p>Fecha: ${new Date().toLocaleString('es-MX')}</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Configurar email
        const mailOptions = {
            from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_TO || process.env.EMAIL_USER,
            replyTo: email,
            subject: `${form_type || 'Contacto'}: ${asunto}`,
            html: htmlContent,
            text: `
Nuevo mensaje de contacto - ${form_type}

Nombre: ${nombre}
Email: ${email}
${telefono ? `Teléfono: ${telefono}` : ''}
Asunto: ${asunto}

Mensaje:
${mensaje}

---
Enviado: ${new Date().toLocaleString('es-MX')}
            `.trim()
        };

        // Enviar email
        const info = await transporter.sendMail(mailOptions);

        console.log(`✅ [API] Email enviado exitosamente - MessageID: ${info.messageId}`);

        res.status(200).json({
            success: true,
            message: 'Tu mensaje ha sido enviado exitosamente. Nos pondremos en contacto contigo pronto.',
            messageId: info.messageId
        });

    } catch (error) {
        console.error('❌ [API] Error en handleContactSend:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar el mensaje. Por favor intenta nuevamente.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

        default:
            res.status(404).json({ success: false, error: `Ruta no encontrada: ${path}` });
    }
}
