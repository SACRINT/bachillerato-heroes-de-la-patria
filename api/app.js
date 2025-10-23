
import { URL } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import express from 'express';

// --- Helpers ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JWT_SECRET = process.env.JWT_SECRET || 'SUPER_SECRET_KEY_REPLACE_IN_PRODUCTION';

// Multer configuration for file uploads
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    }
});

// PostgreSQL Pool setup
const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

async function readJsonFile(fileName) {
    const jsonPath = path.join(__dirname, '..', 'data', fileName);
    try {
        const fileContent = await fs.readFile(jsonPath, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        // If file not found or other error, return null
        console.warn(`Warning: Could not read or parse ${fileName}. Returning null.`, error.message);
        return null;
    }
}


// --- Handlers para cada ruta ---

async function handleStudents(req, res) {
    try {
        const data = await readJsonFile('estudiantes.json');
        const students = data && data.estudiantes ? data.estudiantes : [];
        res.status(200).json({ success: true, data: { students: students } });
    } catch (error) {
        console.error('Error reading estudiantes.json:', error);
        res.status(200).json({ success: true, data: { students: [] } });
    }
}

async function handleStudentsAuth(req, res) {
    const subpath = req.path.replace('/api/students-auth', '') || '/';

    switch (subpath) {
        case '/login':
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Email and password are required.' });
            }
            try {
                const client = await pool.connect();
                const result = await client.query('SELECT id, nombre, email, password_hash FROM students WHERE email = $1', [email]);
                const student = result.rows[0];
                client.release();
                if (!student) {
                    return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
                }
                const passwordMatch = await bcrypt.compare(password, student.password_hash);
                if (!passwordMatch) {
                    return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
                }
                const token = jwt.sign({ id: student.id, name: student.nombre, role: 'student' }, JWT_SECRET, { expiresIn: '1h' });
                res.cookie('studentAuthToken', token, { httpOnly: true, secure: true, sameSite: 'Strict', path: '/' });
                return res.status(200).json({ success: true, student: { id: student.id, name: student.nombre, email: student.email } });
            } catch (error) {
                console.error('Error during student login:', error);
                return res.status(500).json({ success: false, error: 'Error interno del servidor.' });
            }
        case '/logout':
            res.clearCookie('studentAuthToken', { path: '/' });
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
            return res.status(404).json({ success: false, error: 'Sub-ruta de autenticación no encontrada.' });
    }
}

async function handleParentsAuth(req, res) {
    const subpath = req.path.replace('/api/parents-auth', '') || '/';
    
    switch (subpath) {
        case '/login':
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Email and password are required.' });
            }
            try {
                const client = await pool.connect();
                const result = await client.query('SELECT id, nombre, email, password_hash FROM parents WHERE email = $1', [email]);
                const parent = result.rows[0];
                client.release();
                if (!parent) {
                    return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
                }
                const passwordMatch = await bcrypt.compare(password, parent.password_hash);
                if (!passwordMatch) {
                    return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
                }
                const token = jwt.sign({ id: parent.id, name: parent.nombre, role: 'parent' }, JWT_SECRET, { expiresIn: '1h' });
                res.cookie('parentAuthToken', token, { httpOnly: true, secure: true, sameSite: 'Strict', path: '/' });
                return res.status(200).json({ success: true, parent: { id: parent.id, name: parent.nombre, email: parent.email } });
            } catch (error) {
                console.error('Error during parent login:', error);
                return res.status(500).json({ success: false, error: 'Error interno del servidor.' });
            }
        case '/logout':
            res.clearCookie('parentAuthToken', { path: '/' });
            return res.status(200).json({ success: true });
        case '/check':
            try {
                const token = req.cookies.parentAuthToken;
                if (!token) return res.status(200).json({ success: true, isAuthenticated: false });
                const decoded = jwt.verify(token, JWT_SECRET);
                return res.status(200).json({ success: true, isAuthenticated: true, parent: decoded });
            } catch (e) {
                return res.status(200).json({ success: true, isAuthenticated: false });
            }
        default:
            return res.status(404).json({ success: false, error: 'Sub-ruta de autenticación no encontrada.' });
    }
}

async function handleGrades(req, res) {
    const { studentId } = req.params;
    if (!studentId) {
        return res.status(400).json({ success: false, message: 'Student ID is required.' });
    }
    try {
        const client = await pool.connect();
        const result = await client.query(
            `SELECT g.id, g.period, g.partial_grade, g.continuous_assessment_grade, g.final_grade, g.status, s.nombre as subject_name, s.codigo as subject_code
             FROM grades g JOIN subjects s ON g.subject_id = s.id
             WHERE g.student_id = $1 ORDER BY g.period, s.nombre`,
            [studentId]
        );
        client.release();
        return res.status(200).json({ success: true, data: { grades: result.rows } });
    } catch (error) {
        console.error('Error fetching grades:', error);
        return res.status(500).json({ success: false, error: 'Error interno del servidor al obtener calificaciones.' });
    }
}

async function handleParents(req, res) {
    const parentId = req.path.split('/').pop();

    switch (req.method) {
        case 'GET':
            try {
                const client = await pool.connect();
                const result = await client.query('SELECT id, nombre, email FROM parents');
                client.release();
                return res.status(200).json({ success: true, data: result.rows });
            } catch (error) {
                console.error('Error fetching parents:', error);
                return res.status(500).json({ success: false, error: 'Error interno del servidor al obtener padres.' });
            }
        case 'POST':
            const { nombre, email, password, student_id } = req.body;
            if (!nombre || !email || !password) {
                return res.status(400).json({ success: false, message: 'Nombre, email y contraseña son requeridos.' });
            }
            try {
                const hashedPassword = await bcrypt.hash(password, 10);
                const client = await pool.connect();
                const result = await client.query('INSERT INTO parents (nombre, email, password_hash) VALUES ($1, $2, $3) RETURNING id, nombre, email', [nombre, email, hashedPassword]);
                const newParent = result.rows[0];
                if (student_id) {
                    await client.query('INSERT INTO student_parents (parent_id, student_id) VALUES ($1, $2)', [newParent.id, student_id]);
                }
                client.release();
                return res.status(201).json({ success: true, data: newParent });
            } catch (error) {
                console.error('Error creating parent:', error);
                return res.status(500).json({ success: false, error: 'Error interno del servidor al crear padre.' });
            }
        // PUT and DELETE logic would go here, similar to the original file
        default:
            return res.status(405).json({ success: false, error: 'Method Not Allowed.' });
    }
}

async function handleNotificationsSubscription(req, res) {
    const { email, subject, name, message, acceptTerms } = req.body;
    if (!email || !name || !acceptTerms) {
        return res.status(400).json({ success: false, message: 'Email, nombre y aceptación de términos son requeridos.' });
    }
    try {
        const client = await pool.connect();
        const result = await client.query(
            `INSERT INTO notifications_subscriptions (email, category_of_interest, name, message, accept_terms) VALUES ($1, $2, $3, $4, $5) RETURNING id, email`,
            [email, subject, name, message, acceptTerms === 'on']
        );
        client.release();
        return res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error creating notification subscription:', error);
        return res.status(500).json({ success: false, error: 'Error interno del servidor al registrar suscripción.' });
    }
}

async function handleUpload(req, res) {
    // This uses a custom multer middleware instance
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    return res.status(200).json({
        success: true,
        message: 'File uploaded successfully.',
        filePath: `/uploads/${req.file.filename}`
    });
}

async function handleTeachers(req, res) {
    try {
        const data = await readJsonFile('docentes.json');
        const teachers = data && data.docentes ? data.docentes : [];
        res.status(200).json({ success: true, data: { teachers: teachers } });
    } catch (error) {
        console.error('Error reading docentes.json:', error);
        res.status(200).json({ success: true, data: { teachers: [] } });
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

async function handleEgresados(req, res) {
    try {
        const data = await readJsonFile('egresados.json');
        const egresados = data && data.egresados ? data.egresados : [];
        res.status(200).json({ success: true, data: egresados });
    } catch (error) {
        console.error('Error reading egresados.json:', error);
        res.status(200).json({ success: true, data: [] });
    }
}

// --- Debug Handlers ---
async function handleDebugHealth(req, res) {
    res.status(200).json({ success: true, message: 'API is healthy.' });
}
async function handleDebugEnv(req, res) {
    res.status(200).json({ success: true, envVars: { NODE_ENV: process.env.NODE_ENV } });
}
async function handleDebugSystem(req, res) {
    const os = await import('os');
    res.status(200).json({ success: true, platform: os.platform(), arch: os.arch() });
}
async function handleDebugFiles(req, res) {
    res.status(200).json({ success: true, message: "File debug not implemented in this refactor." });
}
async function handleDebugDb(req, res) {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        res.status(200).json({ success: true, message: 'Database connection successful.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Database connection failed.' });
    }
}

async function handleHealth(req, res) {
    res.status(200).json({ success: true, message: 'API is alive and healthy.' });
}

async function handleNotImplemented(req, res) {
    res.status(501).json({ success: false, error: 'Not Implemented' });
}

// --- Express App Setup ---
const app = express();

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
app.get('/api/health', handleHealth);
app.get('/api/students', handleStudents);
app.get('/api/teachers', handleTeachers);
app.get('/api/egresados', handleEgresados);
app.get('/api/analytics', handleAnalytics);
app.get('/api/admin/pending-registrations', handlePendingRegistrations);
app.get('/api/admin/students', handleStudents);
app.get('/api/admin/teachers', handleTeachers);
app.get('/api/grades/:studentId', handleGrades);

// Auth routes
app.all('/api/students-auth*', handleStudentsAuth);
app.all('/api/parents-auth*', handleParentsAuth);

// POST/PUT/DELETE routes
app.all('/api/parents*', handleParents);
app.post('/api/notificaciones', handleNotificationsSubscription);
app.post('/api/upload', upload.single('additionalDocument'), handleUpload);

// Debug routes
app.get('/api/debug-health', handleDebugHealth);
app.get('/api/debug-env', handleDebugEnv);
app.get('/api/debug-system', handleDebugSystem);
app.get('/api/debug-files', handleDebugFiles);
app.get('/api/debug-db', handleDebugDb);

// Not implemented routes
const notImplementedRoutes = [
    '/api/approvals/pending',
    '/api/eventos/calendar',
    '/api/charts/suscriptores-crecimiento',
    '/api/charts/eventos-por-categoria',
    '/api/charts/noticias-por-mes',
    '/api/charts/quejas-por-tipo',
    '/api/avisos/stats',
    '/api/comunicados/stats',
    '/api/noticias/stats',
    '/api/eventos/stats',
    '/api/gamification/profile/admin@bge.edu.mx',
    '/api/gamification/daily-challenges'
];
app.all(notImplementedRoutes, handleNotImplemented);

// --- Export the app for Vercel ---
export default app;
