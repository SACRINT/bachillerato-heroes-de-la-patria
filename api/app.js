const { URL } = require('url');
const path = require('path');
const fs = require('fs/promises');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const express = require('express');
const os = require('os');

// --- Helpers ---
const JWT_SECRET = process.env.JWT_SECRET || 'SUPER_SECRET_KEY_REPLACE_IN_PRODUCTION';

// Multer configuration
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
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
    connectionString: process.env.DATABASE_URL,
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
        console.warn(`Warning: Could not read or parse ${fileName}.`, error.message);
        return null;
    }
}

// --- Handlers ---

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
            if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required.' });
            try {
                const { rows } = await pool.query('SELECT id, nombre, email, password_hash FROM students WHERE email = $1', [email]);
                const student = rows[0];
                if (!student || !await bcrypt.compare(password, student.password_hash)) {
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
            if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required.' });
            try {
                const { rows } = await pool.query('SELECT id, nombre, email, password_hash FROM parents WHERE email = $1', [email]);
                const parent = rows[0];
                if (!parent || !await bcrypt.compare(password, parent.password_hash)) {
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
    if (!studentId) return res.status(400).json({ success: false, message: 'Student ID is required.' });
    try {
        const { rows } = await pool.query(
            `SELECT g.id, g.period, g.partial_grade, g.continuous_assessment_grade, g.final_grade, g.status, s.nombre as subject_name, s.codigo as subject_code
             FROM grades g JOIN subjects s ON g.subject_id = s.id
             WHERE g.student_id = $1 ORDER BY g.period, s.nombre`,
            [studentId]
        );
        return res.status(200).json({ success: true, data: { grades: rows } });
    } catch (error) {
        console.error('Error fetching grades:', error);
        return res.status(500).json({ success: false, error: 'Error interno del servidor al obtener calificaciones.' });
    }
}

async function handleParents(req, res) {
    // This handler can be simplified further, but for now, we keep the logic
    // based on method, assuming it's attached to app.all('/api/parents*')
    switch (req.method) {
        case 'GET':
            try {
                const { rows } = await pool.query('SELECT id, nombre, email FROM parents');
                return res.status(200).json({ success: true, data: rows });
            } catch (error) {
                console.error('Error fetching parents:', error);
                return res.status(500).json({ success: false, error: 'Error interno del servidor.' });
            }
        // Other methods (POST, PUT, DELETE) would be here
        default:
            return res.status(405).json({ success: false, error: 'Method Not Allowed for this handler.' });
    }
}

async function handleNotificationsSubscription(req, res) {
    const { email, subject, name, message, acceptTerms } = req.body;
    if (!email || !name || !acceptTerms) return res.status(400).json({ success: false, message: 'Email, nombre y aceptación de términos son requeridos.' });
    try {
        const { rows } = await pool.query(
            `INSERT INTO notifications_subscriptions (email, category_of_interest, name, message, accept_terms) VALUES ($1, $2, $3, $4, $5) RETURNING id, email`,
            [email, subject, name, message, acceptTerms === 'on']
        );
        return res.status(201).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error creating notification subscription:', error);
        return res.status(500).json({ success: false, error: 'Error interno del servidor.' });
    }
}

function handleUpload(req, res) {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    return res.status(200).json({ success: true, message: 'File uploaded successfully.', filePath: `/uploads/${req.file.filename}` });
}

async function handleTeachers(req, res) {
    try {
        const data = await readJsonFile('docentes.json');
        res.status(200).json({ success: true, data: { teachers: data?.docentes || [] } });
    } catch (error) {
        res.status(200).json({ success: true, data: { teachers: [] } });
    }
}

async function handleAnalytics(req, res) {
    const analyticsData = { students: { total_estudiantes: 1247 }, teachers: { total_docentes: 68 }, academic: { promedio_general: 8.4 } };
    res.status(200).json({ success: true, data: analyticsData });
}

async function handlePendingRegistrations(req, res) {
    try {
        const client = await pool.connect();
        const { rows } = await client.query(
            `SELECT id, form_type, submission_data, created_at 
             FROM public.pending_submissions 
             WHERE status = 'pending' 
             ORDER BY created_at ASC;`
        );
        client.release();
        res.status(200).json({ success: true, count: rows.length, requests: rows });
    } catch (error) {
        console.error('Error fetching pending registrations:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener registros pendientes.' });
    }
}

async function handleEgresados(req, res) {
    try {
        const data = await readJsonFile('egresados.json');
        res.status(200).json({ success: true, data: data?.egresados || [] });
    } catch (error) {
        res.status(200).json({ success: true, data: [] });
    }
}

// --- Debug Handlers ---
function handleDebugHealth(req, res) { res.status(200).json({ success: true, message: 'API is healthy.' }); }
function handleDebugEnv(req, res) { res.status(200).json({ success: true, envVars: { NODE_ENV: process.env.NODE_ENV } }); }
function handleDebugSystem(req, res) { res.status(200).json({ success: true, platform: os.platform(), arch: os.arch() }); }
function handleDebugFiles(req, res) { res.status(200).json({ success: true, message: "File debug not implemented." }); }
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

function handleHealth(req, res) { res.status(200).json({ success: true, message: 'API is alive and healthy.' }); }
function handleNotImplemented(req, res) { res.status(501).json({ success: false, error: 'Not Implemented' }); }

async function handleNoticiasStats(req, res) {
    try {
        const client = await pool.connect();
        const { rows } = await client.query("SELECT COUNT(*) AS total FROM public.noticias;");
        client.release();
        const count = rows[0] ? parseInt(rows[0].total, 10) : 0;
        res.status(200).json({ success: true, stats: { count: count } });
    } catch (error) {
        console.error('Error fetching news stats:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener estadísticas de noticias.' });
    }
}

async function handleEventosStats(req, res) {
    try {
        const client = await pool.connect();
        const { rows } = await client.query("SELECT COUNT(*) AS total FROM public.eventos;");
        client.release();
        const count = rows[0] ? parseInt(rows[0].total, 10) : 0;
        res.status(200).json({ success: true, stats: { count: count } });
    } catch (error) {
        console.error('Error fetching events stats:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener estadísticas de eventos.' });
    }
}

async function handleAvisosStats(req, res) {
    try {
        const client = await pool.connect();
        const { rows } = await client.query("SELECT COUNT(*) AS total FROM public.avisos;");
        client.release();
        const count = rows[0] ? parseInt(rows[0].total, 10) : 0;
        res.status(200).json({ success: true, stats: { count: count } });
    } catch (error) {
        console.error('Error fetching avisos stats:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener estadísticas de avisos.' });
    }
}

async function handleComunicadosStats(req, res) {
    try {
        const client = await pool.connect();
        const { rows } = await client.query("SELECT COUNT(*) AS total FROM public.comunicados;");
        client.release();
        const count = rows[0] ? parseInt(rows[0].total, 10) : 0;
        res.status(200).json({ success: true, stats: { count: count } });
    } catch (error) {
        console.error('Error fetching comunicados stats:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener estadísticas de comunicados.' });
    }
}

async function handleChartSuscriptoresCrecimiento(req, res) {
    try {
        // Dummy data for now, actual DB query for subscriber growth over time would go here
        const dummyData = {
            labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
            datasets: [{
                label: 'Nuevos Suscriptores',
                data: [100, 120, 150, 130, 180, 200],
                borderColor: '#4CAF50',
                fill: false
            }]
        };
        res.status(200).json({ success: true, chartData: dummyData });
    } catch (error) {
        console.error('Error fetching subscriber growth chart data:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener datos del gráfico de crecimiento de suscriptores.' });
    }
}

async function handleChartEventosPorCategoria(req, res) {
    try {
        // Dummy data for now, actual DB query for events by category would go here
        const dummyData = {
            labels: ['Académico', 'Deportivo', 'Cultural', 'Social', 'Otros'],
            datasets: [{
                label: 'Eventos por Categoría',
                data: [15, 10, 20, 12, 8],
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
            }]
        };
        res.status(200).json({ success: true, chartData: dummyData });
    } catch (error) {
        console.error('Error fetching events by category chart data:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener datos del gráfico de eventos por categoría.' });
    }
}

async function handleChartNoticiasPorMes(req, res) {
    try {
        // Dummy data for now, actual DB query for news by month would go here
        const dummyData = {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'Mayo', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            datasets: [{
                label: 'Noticias Publicadas',
                data: [5, 7, 10, 8, 12, 9, 11, 15, 13, 10, 8, 6],
                backgroundColor: '#007bff',
            }]
        };
        res.status(200).json({ success: true, chartData: dummyData });
    } catch (error) {
        console.error('Error fetching news by month chart data:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener datos del gráfico de noticias por mes.' });
    }
}

async function handleChartQuejasPorTipo(req, res) {
    try {
        // Dummy data for now, actual DB query for complaints by type would go here
        const dummyData = {
            labels: ['Académicas', 'Administrativas', 'Infraestructura', 'Convivencia', 'Otros'],
            datasets: [{
                label: 'Quejas por Tipo',
                data: [7, 5, 3, 6, 2],
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
            }]
        };
        res.status(200).json({ success: true, chartData: dummyData });
    } catch (error) {
        console.error('Error fetching complaints by type chart data:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener datos del gráfico de quejas por tipo.' });
    }
}

async function handleApprovalsPending(req, res) {
    try {
        // Dummy data for now, actual DB query for pending approvals would go here
        const dummyData = [
            { id: 1, type: 'Solicitud de Beca', applicant: 'Juan Pérez', status: 'pending', date: '2025-10-20' },
            { id: 2, type: 'Permiso Especial', applicant: 'María García', status: 'pending', date: '2025-10-21' }
        ];
        res.status(200).json({ success: true, approvals: dummyData });
    } catch (error) {
        console.error('Error fetching pending approvals:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener aprobaciones pendientes.' });
    }
}

async function handleEventosCalendar(req, res) {
    try {
        // Dummy data for now, actual DB query for calendar events would go here
        const dummyData = [
            { id: 1, title: 'Examen Final Matemáticas', start: '2025-11-15T10:00:00', end: '2025-11-15T12:00:00', category: 'Académico' },
            { id: 2, title: 'Partido de Baloncesto', start: '2025-11-20T16:00:00', end: '2025-11-20T18:00:00', category: 'Deportivo' }
        ];
        res.status(200).json({ success: true, events: dummyData });
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener eventos del calendario.' });
    }
}

async function handleGamificationProfile(req, res) {
    try {
        // Dummy data for now, actual DB query for gamification profile would go here
        const dummyData = {
            user: 'admin@bge.edu.mx',
            level: 10,
            xp: 1250,
            badges: ['Innovador', 'Líder', 'Estratega'],
            iacoins: 500
        };
        res.status(200).json({ success: true, profile: dummyData });
    } catch (error) {
        console.error('Error fetching gamification profile:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener el perfil de gamificación.' });
    }
}

async function handleGamificationDailyChallenges(req, res) {
    try {
        // Dummy data for now, actual DB query for daily challenges would go here
        const dummyData = [
            { id: 1, title: 'Completa 3 tareas académicas', xp_reward: 50, iacoins_reward: 5, completed: false },
            { id: 2, title: 'Participa en un foro de discusión', xp_reward: 30, iacoins_reward: 3, completed: false },
            { id: 3, title: 'Ayuda a un compañero en el laboratorio', xp_reward: 70, iacoins_reward: 7, completed: true }
        ];
        res.status(200).json({ success: true, challenges: dummyData });
    } catch (error) {
        console.error('Error fetching daily gamification challenges:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener los desafíos diarios de gamificación.' });
    }
}

// --- Express App Setup ---
const app = express();

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CSP Middleware for TinyMCE
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy',
        "default-src 'self';" +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com https://www.googletagmanager.com https://www.google-analytics.com https://accounts.google.com https://www.googleapis.com https://cdn.tiny.cloud;" +
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com https://fonts.googleapis.com https://cdn.tiny.cloud;" +
        "connect-src 'self' http://localhost:3000 http://localhost:3001 http://localhost:3002 http://localhost:3003 http://localhost:3004 http://localhost:3005 http://localhost:8000 http://127.0.0.1:8080 https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com https://fonts.googleapis.com https://www.google-analytics.com https://www.googletagmanager.com https://accounts.google.com https://www.googleapis.com https://cdn.tiny.cloud https://sp.tinymce.com;" +
        "img-src 'self' data: https://cdn.tiny.cloud;" + // Added img-src for TinyMCE images
        "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com https://cdn.tiny.cloud;" + // Added font-src for TinyMCE fonts
        "frame-src 'self' https://cdn.tiny.cloud;" // Added frame-src for TinyMCE iframes
    );
    next();
});

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
app.get('/api/noticias/stats', handleNoticiasStats);
app.get('/api/eventos/stats', handleEventosStats);
app.get('/api/avisos/stats', handleAvisosStats);
app.get('/api/comunicados/stats', handleComunicadosStats);
app.get('/api/charts/suscriptores-crecimiento', handleChartSuscriptoresCrecimiento);
app.get('/api/charts/eventos-por-categoria', handleChartEventosPorCategoria);
app.get('/api/charts/noticias-por-mes', handleChartNoticiasPorMes);
app.get('/api/charts/quejas-por-tipo', handleChartQuejasPorTipo);
app.get('/api/approvals/pending', handleApprovalsPending);
app.get('/api/eventos/calendar', handleEventosCalendar);
app.get('/api/gamification/profile/admin@bge.edu.mx', handleGamificationProfile);
app.get('/api/gamification/daily-challenges', handleGamificationDailyChallenges);

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
];
app.all(notImplementedRoutes, handleNotImplemented);

// --- Export the app for Vercel ---
module.exports = app;