import { URL } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import multer from 'multer'; // Import multer

// --- Helpers ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JWT_SECRET = process.env.JWT_SECRET || 'SUPER_SECRET_KEY_REPLACE_IN_PRODUCTION';

// Multer configuration for file uploads
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
// Ensure upload directory exists
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
        }
        else {
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
    const fileContent = await fs.readFile(jsonPath, 'utf8');
    return JSON.parse(fileContent);
}

// --- Handlers para cada ruta ---

async function handleStudents(req, res) {
    try {
        const data = await readJsonFile('estudiantes.json');
        const students = data && data.estudiantes ? data.estudiantes : [];
        res.status(200).json({ success: true, data: { students: students } });
    } catch (error) {
        console.error('Error reading estudiantes.json:', error);
        // Si hay un error al leer el archivo (ej. no encontrado o mal formado), devolver un array vacío
        res.status(200).json({ success: true, data: { students: [] } });
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
            const { email, password } = body;
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
                res.setHeader('Set-Cookie', `studentAuthToken=${token}; HttpOnly; Path=/; Secure; SameSite=Strict`);
                return res.status(200).json({ success: true, student: { id: student.id, name: student.nombre, email: student.email } });

            } catch (error) {
                console.error('Error during student login:', error);
                return res.status(500).json({ success: false, error: 'Error interno del servidor.' });
            }

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
            return res.status(404).json({ success: false, error: 'Sub-ruta de autenticación no encontrada.' });
    }
}

async function handleParentsAuth(req, res) {
    const subpath = req.url.replace('/api/parents-auth', '') || '/';
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
            const { email, password } = body;
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
                res.setHeader('Set-Cookie', `parentAuthToken=${token}; HttpOnly; Path=/; Secure; SameSite=Strict`);
                return res.status(200).json({ success: true, parent: { id: parent.id, name: parent.nombre, email: parent.email } });

            } catch (error) {
                console.error('Error during parent login:', error);
                return res.status(500).json({ success: false, error: 'Error interno del servidor.' });
            }

        case '/logout':
            res.setHeader('Set-Cookie', `parentAuthToken=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
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
    const studentId = req.url.split('/').pop(); // Assuming URL is /api/grades/:studentId

    if (!studentId) {
        return res.status(400).json({ success: false, message: 'Student ID is required.' });
    }

    try {
        const client = await pool.connect();
        const result = await client.query(
            `SELECT
                g.id,
                g.period,
                g.partial_grade,
                g.continuous_assessment_grade,
                g.final_grade,
                g.status,
                s.nombre as subject_name,
                s.codigo as subject_code
            FROM grades g
            JOIN subjects s ON g.subject_id = s.id
            WHERE g.student_id = $1
            ORDER BY g.period, s.nombre`,
            [studentId]
        );
        const grades = result.rows;
        client.release();

        return res.status(200).json({ success: true, data: { grades: grades } });

    } catch (error) {
        console.error('Error fetching grades:', error);
        return res.status(500).json({ success: false, error: 'Error interno del servidor al obtener calificaciones.' });
    }
}

async function handleParents(req, res) {
    let body = {};
    if (req.method === 'POST' || req.method === 'PUT') {
        try {
            const chunks = [];
            for await (const chunk of req) { chunks.push(chunk); }
            body = JSON.parse(Buffer.concat(chunks).toString());
        } catch (e) { return res.status(400).json({ success: false, error: 'Invalid JSON' }); }
    }

    const parentId = req.url.split('/').pop(); // For PUT and DELETE

    switch (req.method) {
        case 'GET':
            try {
                const client = await pool.connect();
                const result = await client.query('SELECT id, nombre, email FROM parents');
                const parents = result.rows;
                client.release();
                return res.status(200).json({ success: true, data: parents });
            } catch (error) {
                console.error('Error fetching parents:', error);
                return res.status(500).json({ success: false, error: 'Error interno del servidor al obtener padres.' });
            }

        case 'POST':
            const { nombre, email, password, student_id } = body;
            if (!nombre || !email || !password) {
                return res.status(400).json({ success: false, message: 'Nombre, email y contraseña son requeridos.' });
            }
            try {
                const hashedPassword = await bcrypt.hash(password, 10);
                const client = await pool.connect();
                const result = await client.query(
                    'INSERT INTO parents (nombre, email, password_hash) VALUES ($1, $2, $3) RETURNING id, nombre, email',
                    [nombre, email, hashedPassword]
                );
                const newParent = result.rows[0];

                if (student_id) {
                    await client.query(
                        'INSERT INTO student_parents (parent_id, student_id) VALUES ($1, $2)',
                        [newParent.id, student_id]
                    );
                }
                client.release();
                return res.status(201).json({ success: true, data: newParent });
            } catch (error) {
                console.error('Error creating parent:', error);
                return res.status(500).json({ success: false, error: 'Error interno del servidor al crear padre.' });
            }

        case 'PUT':
            if (!parentId || isNaN(parentId)) {
                return res.status(400).json({ success: false, message: 'Parent ID is required for update.' });
            }
            const { nombre: updatedNombre, email: updatedEmail, password: updatedPassword, student_id: updatedStudentId } = body;
            if (!updatedNombre && !updatedEmail && !updatedPassword && !updatedStudentId) {
                return res.status(400).json({ success: false, message: 'No data provided for update.' });
            }
            try {
                const client = await pool.connect();
                let updateQuery = 'UPDATE parents SET';
                const updateValues = [];
                let paramCount = 1;

                if (updatedNombre) { updateQuery += ` nombre = $${paramCount++},`; updateValues.push(updatedNombre); }
                if (updatedEmail) { updateQuery += ` email = $${paramCount++},`; updateValues.push(updatedEmail); }
                if (updatedPassword) {
                    const hashedUpdatedPassword = await bcrypt.hash(updatedPassword, 10);
                    updateQuery += ` password_hash = $${paramCount++},`; updateValues.push(hashedUpdatedPassword);
                }

                updateQuery = updateQuery.slice(0, -1); // Remove trailing comma
                updateQuery += ` WHERE id = $${paramCount} RETURNING id, nombre, email`;
                updateValues.push(parentId);

                const result = await client.query(updateQuery, updateValues);
                const updatedParent = result.rows[0];

                if (updatedStudentId) {
                    // Check if association exists, if not, insert or update
                    const existingAssociation = await client.query(
                        'SELECT * FROM student_parents WHERE parent_id = $1 AND student_id = $2',
                        [parentId, updatedStudentId]
                    );
                    if (existingAssociation.rows.length === 0) {
                        await client.query(
                            'INSERT INTO student_parents (parent_id, student_id) VALUES ($1, $2)',
                            [parentId, updatedStudentId]
                        );
                    }
                }
                client.release();

                if (updatedParent) {
                    return res.status(200).json({ success: true, data: updatedParent });
                } else {
                    return res.status(404).json({ success: false, message: 'Parent not found.' });
                }
            } catch (error) {
                console.error('Error updating parent:', error);
                return res.status(500).json({ success: false, error: 'Error interno del servidor al actualizar padre.' });
            }

        case 'DELETE':
            if (!parentId || isNaN(parentId)) {
                return res.status(400).json({ success: false, message: 'Parent ID is required for deletion.' });
            }
            try {
                const client = await pool.connect();
                const result = await client.query('DELETE FROM parents WHERE id = $1 RETURNING id', [parentId]);
                client.release();
                if (result.rows.length > 0) {
                    return res.status(200).json({ success: true, message: 'Parent deleted successfully.' });
                } else {
                    return res.status(404).json({ success: false, message: 'Parent not found.' });
                }
            } catch (error) {
                console.error('Error deleting parent:', error);
                return res.status(500).json({ success: false, error: 'Error interno del servidor al eliminar padre.' });
            }

        default:
            return res.status(405).json({ success: false, error: 'Method Not Allowed.' });
    }
}




async function handleNotificationsSubscription(req, res) {
    let body = {};
    if (req.method === 'POST') {
        try {
            const chunks = [];
            for await (const chunk of req) { chunks.push(chunk); }
            body = JSON.parse(Buffer.concat(chunks).toString());
        } catch (e) { return res.status(400).json({ success: false, error: 'Invalid JSON' }); }
    }

    switch (req.method) {
        case 'POST':
            const {
                email,
                subject, // This maps to category_of_interest
                name,
                message,
                acceptTerms // This maps to accept_terms
            } = body;

            // Basic validation
            if (!email || !name || !acceptTerms) {
                return res.status(400).json({ success: false, message: 'Email, nombre y aceptación de términos son requeridos.' });
            }

            try {
                const client = await pool.connect();
                const result = await client.query(
                    `INSERT INTO notifications_subscriptions (
                        email, category_of_interest, name, message, accept_terms
                    ) VALUES ($1, $2, $3, $4, $5)
                    RETURNING id, email`,
                    [
                        email, subject, name, message, acceptTerms === 'on'
                    ]
                );
                const newSubscription = result.rows[0];
                client.release();
                return res.status(201).json({ success: true, data: newSubscription });
            } catch (error) {
                console.error('Error creating notification subscription:', error);
                return res.status(500).json({ success: false, error: 'Error interno del servidor al registrar suscripción.' });
            }

        default:
            return res.status(405).json({ success: false, error: 'Method Not Allowed.' });
    }
}



async function handleUpload(req, res) {
    upload.single('additionalDocument')(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            return res.status(500).json({ success: false, error: err.message });
        } else if (err) {
            // An unknown error occurred when uploading.
            return res.status(500).json({ success: false, error: err.message });
        }

        // No file uploaded or other form data
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }

        // File uploaded successfully
        return res.status(200).json({
            success: true,
            message: 'File uploaded successfully.',
            filePath: `/uploads/${req.file.filename}` // Path relative to public folder
        });
    });
}

async function handleTeachers(req, res) {
    try {
        const data = await readJsonFile('docentes.json');
        const teachers = data && data.docentes ? data.docentes : [];
        res.status(200).json({ success: true, data: { teachers: teachers } });
    } catch (error) {
        console.error('Error reading docentes.json:', error);
        // Si hay un error al leer el archivo (ej. no encontrado o mal formado), devolver un array vacío
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

// --- Debug Handlers ---

async function handleDebugHealth(req, res) {
    res.status(200).json({ success: true, message: 'API is healthy.' });
}

async function handleDebugEnv(req, res) {
    const envVars = {
        NODE_ENV: process.env.NODE_ENV || 'development',
        VERCEL_ENV: process.env.VERCEL_ENV || 'local',
        VERCEL_URL: process.env.VERCEL_URL || 'N/A',
        PGUSER: process.env.PGUSER ? 'SET' : 'NOT_SET',
        PGHOST: process.env.PGHOST ? 'SET' : 'NOT_SET',
        PGDATABASE: process.env.PGDATABASE ? 'SET' : 'NOT_SET',
        PGPORT: process.env.PGPORT ? 'SET' : 'NOT_SET',
        JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT_SET',
        // Add other critical environment variables you want to check
    };
    res.status(200).json({ success: true, envVars });
}

async function handleDebugSystem(req, res) {
    const os = await import('os'); // Import dynamically as it's not always available in Vercel Edge Functions
    res.status(200).json({
        success: true,
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalmem: os.totalmem(),
        freemem: os.freemem(),
        uptime: os.uptime(),
        nodeVersion: process.version,
    });
}

async function handleDebugFiles(req, res) {
    const baseDir = path.join(__dirname, '..');
    const backendDir = path.join(baseDir, 'backend');
    const apiDir = path.join(baseDir, 'api');

    const fileCount = async (dir) => {
        if (!await fs.stat(dir).catch(() => false)) return 0;
        let count = 0;
        const files = await fs.readdir(dir);
        for (const f of files) {
            const full = path.join(dir, f);
            const stat = await fs.stat(full);
            if (stat.isDirectory()) count += await fileCount(full);
            else count++;
        }
        return count;
    };

    try {
        const backendFilesCount = await fileCount(backendDir);
        const apiFilesCount = await fileCount(apiDir);
        res.status(200).json({ success: true, backendFilesCount, apiFilesCount });
    } catch (error) {
        console.error('Error counting files:', error);
        res.status(500).json({ success: false, error: 'Error counting files.' });
    }
}

async function handleDebugDb(req, res) {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1'); // Simple query to check connection
        client.release();
        res.status(200).json({ success: true, message: 'Database connection successful.' });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ success: false, error: 'Database connection failed.', details: error.message });
    }
}

async function handleHealth(req, res) {
    res.status(200).json({ success: true, message: 'API is alive and healthy.' });
}

async function handleNotImplemented(req, res) {
    res.status(501).json({ success: false, error: 'Not Implemented' });
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

    if (path.startsWith('/api/parents-auth')) {
        return handleParentsAuth(req, res);
    }

    if (path.startsWith('/api/grades/')) {
        return handleGrades(req, res);
    }

    if (path.startsWith('/api/parents')) {
        return handleParents(req, res);
    }

    if (path === '/api/egresados') {
        return handleEgresados(req, res);
    }

    if (path === '/api/notificaciones') {
        return handleNotificationsSubscription(req, res);
    }

    async function handleEgresados(req, res) {
        try {
            // This is a placeholder. In the future, this will read from a database.
            const data = await readJsonFile('egresados.json');
            const egresados = data && data.egresados ? data.egresados : [];
            res.status(200).json({ success: true, data: egresados });
        } catch (error) {
            console.error('Error reading egresados.json:', error);
            res.status(200).json({ success: true, data: [] });
        }
    }


    if (path === '/api/upload') {
        return handleUpload(req, res);
    }

    // Rutas de coincidencia exacta
    switch (path) {
        case '/api/students':
            return handleStudents(req, res);
        case '/api/teachers':
            return handleTeachers(req, res);
        case '/api/admin/students':
            return handleStudents(req, res);
        case '/api/admin/teachers':
            return handleTeachers(req, res);
        case '/api/analytics':
            return handleAnalytics(req, res);
        case '/api/admin/pending-registrations':
            return handlePendingRegistrations(req, res);
        case '/api/debug-health':
            return handleDebugHealth(req, res);
        case '/api/debug-env':
            return handleDebugEnv(req, res);
        case '/api/debug-system':
            return handleDebugSystem(req, res);
        case '/api/debug-files':
            return handleDebugFiles(req, res);
        case '/api/debug-db':
            return handleDebugDb(req, res);
        case '/api/health': // Nuevo endpoint para verificación de estado
            return handleHealth(req, res);
        case '/api/approvals/pending':
            return handleNotImplemented(req, res);
        case '/api/eventos/calendar':
            return handleNotImplemented(req, res);
        case '/api/charts/suscriptores-crecimiento':
            return handleNotImplemented(req, res);
        case '/api/charts/eventos-por-categoria':
            return handleNotImplemented(req, res);
        case '/api/charts/noticias-por-mes':
            return handleNotImplemented(req, res);
        case '/api/charts/quejas-por-tipo':
            return handleNotImplemented(req, res);
        case '/api/avisos/stats':
            return handleNotImplemented(req, res);
        case '/api/comunicados/stats':
            return handleNotImplemented(req, res);
        case '/api/noticias/stats':
            return handleNotImplemented(req, res);
        case '/api/eventos/stats':
            return handleNotImplemented(req, res);
        case '/api/gamification/profile/admin@bge.edu.mx':
            return handleNotImplemented(req, res);
        case '/api/gamification/daily-challenges':
            return handleNotImplemented(req, res);

        default:
            res.status(404).json({ success: false, error: `Ruta no encontrada: ${path}` });
    }
}