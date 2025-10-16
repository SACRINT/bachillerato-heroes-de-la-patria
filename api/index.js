import { URL } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

// --- Helpers ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JWT_SECRET = process.env.JWT_SECRET || 'SUPER_SECRET_KEY_REPLACE_IN_PRODUCTION';

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
        // Agrega aquí los otros endpoints que son de coincidencia exacta
        // ej. /api/egresados, /api/contact, etc.

        default:
            res.status(404).json({ success: false, error: `Ruta no encontrada: ${path}` });
    }
}
