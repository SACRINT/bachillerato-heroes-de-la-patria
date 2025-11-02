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
        const { rows } = await pool.query('SELECT * FROM estudiantes');
        res.status(200).json({ success: true, data: { students: rows } });
    } catch (error) {
        console.error('Error fetching students from DB:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
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
    const method = req.method;
    const parentId = req.params.id;

    switch (method) {
        case 'GET':
            try {
                const { rows } = await pool.query('SELECT id, nombre, email, student_id FROM parents ORDER BY nombre');
                return res.status(200).json({ success: true, data: rows });
            } catch (error) {
                console.error('Error fetching parents:', error);
                return res.status(500).json({ success: false, error: 'Error interno del servidor.' });
            }

        case 'POST':
            try {
                const { nombre, email, password, student_id } = req.body;
                if (!nombre || !email || !password) {
                    return res.status(400).json({ success: false, message: 'Nombre, email y contraseña son requeridos.' });
                }

                const hashedPassword = await bcrypt.hash(password, 10);
                const { rows } = await pool.query(
                    'INSERT INTO parents (nombre, email, password_hash, student_id) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, student_id',
                    [nombre, email, hashedPassword, student_id || null]
                );

                return res.status(201).json({ success: true, data: rows[0], message: 'Padre creado exitosamente.' });
            } catch (error) {
                console.error('Error creating parent:', error);
                if (error.code === '23505') {
                    return res.status(409).json({ success: false, message: 'El email ya está registrado.' });
                }
                return res.status(500).json({ success: false, error: 'Error interno del servidor.' });
            }

        case 'PUT':
            if (!parentId) {
                return res.status(400).json({ success: false, message: 'ID de padre requerido.' });
            }
            try {
                const { nombre, email, password, student_id } = req.body;
                if (!nombre || !email) {
                    return res.status(400).json({ success: false, message: 'Nombre y email son requeridos.' });
                }

                if (password) {
                    const hashedPassword = await bcrypt.hash(password, 10);
                    await pool.query(
                        'UPDATE parents SET nombre = $1, email = $2, password_hash = $3, student_id = $4 WHERE id = $5',
                        [nombre, email, hashedPassword, student_id || null, parentId]
                    );
                } else {
                    await pool.query(
                        'UPDATE parents SET nombre = $1, email = $2, student_id = $3 WHERE id = $4',
                        [nombre, email, student_id || null, parentId]
                    );
                }

                return res.status(200).json({ success: true, message: 'Padre actualizado exitosamente.' });
            } catch (error) {
                console.error('Error updating parent:', error);
                return res.status(500).json({ success: false, error: 'Error interno del servidor.' });
            }

        case 'DELETE':
            if (!parentId) {
                return res.status(400).json({ success: false, message: 'ID de padre requerido.' });
            }
            try {
                const result = await pool.query('DELETE FROM parents WHERE id = $1', [parentId]);
                if (result.rowCount === 0) {
                    return res.status(404).json({ success: false, message: 'Padre no encontrado.' });
                }
                return res.status(200).json({ success: true, message: 'Padre eliminado exitosamente.' });
            } catch (error) {
                console.error('Error deleting parent:', error);
                return res.status(500).json({ success: false, error: 'Error interno del servidor.' });
            }

        default:
            return res.status(405).json({ success: false, error: 'Método no permitido.' });
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
        const { rows } = await pool.query('SELECT * FROM docentes');
        // The frontend component expects an object with a 'docentes' property.
        res.status(200).json({ docentes: rows });
    } catch (error) {
        console.error('Error in handleTeachers:', error);
        res.status(500).json({ error: 'Internal Server Error' });
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

async function handleFinances(req, res) {
    try {
        const client = await pool.connect();

        // Fetch ingresos
        const ingresosResult = await client.query('SELECT * FROM ingresos');
        const ingresos = ingresosResult.rows;

        // Fetch gastos
        const gastosResult = await client.query('SELECT * FROM gastos');
        const gastos = gastosResult.rows;

        // Fetch pagos_pendientes
        const pagosPendientesResult = await client.query('SELECT * FROM pagos_pendientes');
        const pagosPendientes = pagosPendientesResult.rows;

        client.release();

        // Calculate resumen
        const totalIngresos = ingresos.reduce((sum, item) => sum + parseFloat(item.monto), 0);
        const totalGastos = gastos.reduce((sum, item) => sum + parseFloat(item.monto), 0);
        const totalPagosPendientes = pagosPendientes.reduce((sum, item) => sum + parseFloat(item.monto), 0);
        const utilidadMes = totalIngresos - totalGastos;
        const tasaCobro = totalIngresos > 0 ? ((totalIngresos / (totalIngresos + totalPagosPendientes)) * 100).toFixed(1) : 0;

        const resumen = {
            ingresosMes: totalIngresos,
            pagosPendientes: totalPagosPendientes,
            tasaCobro: parseFloat(tasaCobro),
            gastosMes: totalGastos,
            utilidadMes: utilidadMes,
            presupuestoAnual: 34170000, // Placeholder, ideally from DB config
            ingresoAcumulado: 25523250, // Placeholder
            porcentajePresupuesto: 74.7 // Placeholder
        };

        // Calculate estadisticas
        const estadisticas = {
            totalIngresosMes: totalIngresos,
            totalGastosMes: totalGastos,
            utilidadMes: utilidadMes,
            totalPagosPendientes: totalPagosPendientes,
            tasaCobroActual: parseFloat(tasaCobro),
            promedioIngresoDiario: totalIngresos / 30, // Simple average
            totalEstudiantesPagando: 190, // Placeholder
            totalEstudiantesMorosos: 12, // Placeholder
            porcentajeMorosidad: 5.9, // Placeholder
            ingresoProyectadoAnual: 34170000, // Placeholder
            avancePresupuestal: 74.7 // Placeholder
        };

        const categorias = {
            ingresos: ["Colegiaturas", "Inscripciones", "Servicios", "Trámites", "Eventos", "Otros"],
            gastos: ["Personal", "Servicios", "Materiales", "Mantenimiento", "Administrativos", "Otros"]
        };

        const configuracion = {
            monedaDefault: "MXN",
            simboloMoneda: "$",
            periodoFiscal: "2024",
            fechaCorte: new Date().toISOString().split('T')[0],
            ultimaActualizacion: new Date().toISOString(),
            version: "1.0",
            alertaVencimiento: 5,
            metaCobroMensual: 95.0,
            presupuestoAnual: 34170000
        };

        res.status(200).json({
            success: true,
            resumen,
            ingresos,
            gastos,
            pagosPendientes,
            estadisticas,
            categorias,
            configuracion
        });

    } catch (error) {
        console.error('Error fetching financial data:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error fetching financial data.', details: error.message });
    }
}

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
        // If the table does not exist, return 0 instead of a 500 error
        if (error.code === '42P01') { // 42P01 is the error code for "undefined_table"
            console.warn('Warning: Table public.avisos does not exist. Returning count 0.');
            return res.status(200).json({ success: true, stats: { count: 0 } });
        }
        console.error('Error fetching avisos stats:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener estadísticas de avisos.', details: error.message });
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
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener datos del gráfico de crecimiento de suscriptores.', details: error.message });
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
        const { rows } = await pool.query("SELECT id, form_type, submission_data, created_at FROM pending_approvals WHERE status = 'pending' ORDER BY created_at ASC");
        // The frontend expects an array directly.
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching pending approvals:', error);
        res.status(500).json([]);
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

async function handleGetSuscriptores(req, res) {
    try {
        const client = await pool.connect();
        // Query the correct table 'suscriptores_notificaciones' and alias columns to match frontend expectations
        const { rows } = await client.query(`
            SELECT 
                id, 
                email, 
                nombre, 
                estado, 
                verificado, 
                fecha_registro,
                0 as total_enviados, -- Fake data for now
                0 as total_abiertos, -- Fake data for now
                true as notif_todas -- Fake data for now
            FROM 
                public.suscriptores_notificaciones 
            ORDER BY 
                fecha_registro DESC;
        `);
        client.release();
        res.status(200).json({ success: true, suscriptores: rows, total: rows.length });
    } catch (error) {
        console.error('Error fetching suscriptores_notificaciones:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener suscriptores.' });
    }
}

async function handleGetSuscriptoresStats(req, res) {
    try {
        const client = await pool.connect();
        const { rows } = await client.query("SELECT COUNT(*) AS total FROM public.suscriptores;");
        client.release();
        const count = rows[0] ? parseInt(rows[0].total, 10) : 0;
        res.status(200).json({ success: true, stats: { count: count } });
    } catch (error) {
        console.error('Error fetching suscriptores stats:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener estadísticas de suscriptores.' });
    }
}

async function handleGetBolsaTrabajo(req, res) {
    try {
        const client = await pool.connect();
        const { rows } = await client.query("SELECT id, nombre_completo, email, telefono, generacion, cv_url, habilidades, experiencia, estado, notas, fecha_registro FROM public.bolsa_trabajo ORDER BY fecha_registro DESC;");
        client.release();
        res.status(200).json({ success: true, candidatos: rows });
    } catch (error) {
        console.error('Error fetching bolsa_trabajo:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener candidatos.' });
    }
}

async function handleFinances(req, res) {
    try {
        const client = await pool.connect();

        // Fetch ingresos
        const ingresosResult = await client.query('SELECT * FROM ingresos');
        const ingresos = ingresosResult.rows;

        // Fetch gastos
        const gastosResult = await client.query('SELECT * FROM gastos');
        const gastos = gastosResult.rows;

        // Fetch pagos_pendientes
        const pagosPendientesResult = await client.query('SELECT * FROM pagos_pendientes');
        const pagosPendientes = pagosPendientesResult.rows;

        client.release();

        // Calculate resumen
        const totalIngresos = ingresos.reduce((sum, item) => sum + parseFloat(item.monto), 0);
        const totalGastos = gastos.reduce((sum, item) => sum + parseFloat(item.monto), 0);
        const totalPagosPendientes = pagosPendientes.reduce((sum, item) => sum + parseFloat(item.monto), 0);
        const utilidadMes = totalIngresos - totalGastos;
        const tasaCobro = totalIngresos > 0 ? ((totalIngresos / (totalIngresos + totalPagosPendientes)) * 100).toFixed(1) : 0;

        const resumen = {
            ingresosMes: totalIngresos,
            pagosPendientes: totalPagosPendientes,
            tasaCobro: parseFloat(tasaCobro),
            gastosMes: totalGastos,
            utilidadMes: utilidadMes,
            presupuestoAnual: 34170000, // Placeholder, ideally from DB config
            ingresoAcumulado: 25523250, // Placeholder
            porcentajePresupuesto: 74.7 // Placeholder
        };

        // Calculate estadisticas
        const estadisticas = {
            totalIngresosMes: totalIngresos,
            totalGastosMes: totalGastos,
            utilidadMes: utilidadMes,
            totalPagosPendientes: totalPagosPendientes,
            tasaCobroActual: parseFloat(tasaCobro),
            promedioIngresoDiario: totalIngresos / 30, // Simple average
            totalEstudiantesPagando: 190, // Placeholder
            totalEstudiantesMorosos: 12, // Placeholder
            porcentajeMorosidad: 5.9, // Placeholder
            ingresoProyectadoAnual: 34170000, // Placeholder
            avancePresupuestal: 74.7 // Placeholder
        };

        const categorias = {
            ingresos: ["Colegiaturas", "Inscripciones", "Servicios", "Trámites", "Eventos", "Otros"],
            gastos: ["Personal", "Servicios", "Materiales", "Mantenimiento", "Administrativos", "Otros"]
        };

        const configuracion = {
            monedaDefault: "MXN",
            simboloMoneda: "$",
            periodoFiscal: "2024",
            fechaCorte: new Date().toISOString().split('T')[0],
            ultimaActualizacion: new Date().toISOString(),
            version: "1.0",
            alertaVencimiento: 5,
            metaCobroMensual: 95.0,
            presupuestoAnual: 34170000
        };

        res.status(200).json({
            success: true,
            resumen,
            ingresos,
            gastos,
            pagosPendientes,
            estadisticas,
            categorias,
            configuracion
        });

    } catch (error) {
        console.error('Error fetching financial data:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error fetching financial data.', details: error.message });
    }
}


// ============================================
// ADMIN AUTHENTICATION HANDLERS
// ============================================

/**
 * POST /api/auth/login
 * Autenticación de administradores
 */
async function handleAuthLogin(req, res) {
    const { username, password, rememberMe = false } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            error: 'Credenciales requeridas',
            message: 'Nombre de usuario y contraseña son requeridos'
        });
    }

    try {
        // Buscar usuario en usuarios table
        const { rows } = await pool.query(
            'SELECT id, username, email, password_hash, nombre, apellido_paterno, apellido_materno, role, active FROM usuarios WHERE username = $1 OR email = $1',
            [username]
        );

        const user = rows[0];

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }

        // Verificar que esté activo
        if (!user.active) {
            return res.status(403).json({
                success: false,
                error: 'Cuenta desactivada'
            });
        }

        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }

        // Generar JWT token
        const expiresIn = rememberMe ? '7d' : '1h';
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                type: 'access'
            },
            JWT_SECRET,
            { expiresIn }
        );

        // Actualizar último login
        await pool.query(
            'UPDATE usuarios SET last_login = NOW() WHERE id = $1',
            [user.id]
        );

        console.log(`✅ Login exitoso: ${user.email} (${user.role})`);

        res.json({
            success: true,
            message: 'Autenticación exitosa',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                nombre: user.nombre,
                apellido_paterno: user.apellido_paterno,
                role: user.role
            },
            tokens: {
                accessToken: token,
                tokenType: 'Bearer'
            }
        });

    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
}

/**
 * POST /api/auth/logout
 * Cerrar sesión
 */
async function handleAuthLogout(req, res) {
    // En una implementación simple, el cliente elimina el token
    // En producción, agregaríamos el token a una blacklist en Redis
    res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
    });
}

/**
 * GET /api/auth/profile
 * Obtener perfil del usuario autenticado
 */
async function handleAuthProfile(req, res) {
    try {
        // Extraer token del header
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Token requerido'
            });
        }

        const token = authHeader.substring(7);

        // Verificar token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return res.status(403).json({
                success: false,
                error: 'Token inválido o expirado'
            });
        }

        // Obtener información actualizada del usuario
        const { rows } = await pool.query(
            'SELECT id, username, email, nombre, apellido_paterno, apellido_materno, role, active, created_at, last_login FROM usuarios WHERE id = $1',
            [decoded.userId]
        );

        const user = rows[0];

        if (!user || !user.active) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no encontrado o inactivo'
            });
        }

        res.json({
            success: true,
            user: user
        });

    } catch (error) {
        console.error('❌ Error obteniendo perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
}

/**
 * POST /api/auth/refresh
 * Renovar token de acceso
 */
async function handleAuthRefresh(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            error: 'Refresh token requerido'
        });
    }

    try {
        // Verificar refresh token
        const decoded = jwt.verify(refreshToken, JWT_SECRET);

        // Generar nuevo access token
        const newToken = jwt.sign(
            {
                userId: decoded.userId,
                email: decoded.email,
                username: decoded.username,
                role: decoded.role,
                type: 'access'
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            success: true,
            tokens: {
                accessToken: newToken,
                tokenType: 'Bearer'
            }
        });

    } catch (error) {
        console.error('❌ Error renovando token:', error);
        res.status(403).json({
            success: false,
            error: 'Refresh token inválido'
        });
    }
}

/**
 * GET /api/bolsa-trabajo/stats/general
 * Obtener estadísticas de bolsa de trabajo
 */
async function handleGetBolsaTrabajoStats(req, res) {
    try {
        const { rows } = await pool.query('SELECT COUNT(*) as count FROM public.bolsa_trabajo');
        const count = rows[0] ? parseInt(rows[0].count, 10) : 0;
        res.status(200).json({ success: true, stats: { count: count } });
    } catch (error) {
        console.error('Error fetching bolsa_trabajo stats:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al obtener estadísticas.' });
    }
}

// ============================================
// CONTACT FORM HANDLER
// ============================================

/**
 * POST /api/contact
 * Procesar formulario de contacto
 */
async function handleContactPost(req, res) {
    const { nombre, name, email, telefono, phone, asunto, subject, mensaje, message, tipo_consulta, tipo } = req.body;

    // Normalizar campos
    const normalizedData = {
        nombre: nombre || name,
        email: email,
        telefono: telefono || phone || '',
        tipo_consulta: tipo_consulta || tipo || 'General',
        asunto: asunto || subject,
        mensaje: mensaje || message
    };

    // Validaciones básicas
    if (!normalizedData.nombre || normalizedData.nombre.trim().length < 2) {
        return res.status(400).json({
            success: false,
            message: 'El nombre debe tener al menos 2 caracteres'
        });
    }

    if (!normalizedData.email || !/\S+@\S+\.\S+/.test(normalizedData.email)) {
        return res.status(400).json({
            success: false,
            message: 'El email no es válido'
        });
    }

    if (!normalizedData.asunto || normalizedData.asunto.trim().length < 5) {
        return res.status(400).json({
            success: false,
            message: 'El asunto debe tener al menos 5 caracteres'
        });
    }

    if (!normalizedData.mensaje || normalizedData.mensaje.trim().length < 10) {
        return res.status(400).json({
            success: false,
            message: 'El mensaje debe tener al menos 10 caracteres'
        });
    }

    try {
        // Guardar en base de datos
        const insertQuery = `
            INSERT INTO contactos (nombre, email, telefono, tipo_consulta, asunto, mensaje, status, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, fecha_creacion
        `;

        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        const { rows } = await pool.query(insertQuery, [
            normalizedData.nombre.trim(),
            normalizedData.email.trim().toLowerCase(),
            normalizedData.telefono.trim(),
            normalizedData.tipo_consulta,
            normalizedData.asunto.trim(),
            normalizedData.mensaje.trim(),
            'pendiente',
            ipAddress,
            userAgent
        ]);

        const contactoId = rows[0].id;

        console.log(`✅ Mensaje de contacto guardado: ID ${contactoId} - ${normalizedData.nombre}`);

        res.status(201).json({
            success: true,
            message: '¡Gracias por contactarnos! Tu mensaje ha sido recibido y será respondido pronto.',
            data: {
                id: contactoId,
                fecha: rows[0].fecha_creacion
            }
        });

    } catch (error) {
        console.error('❌ Error procesando mensaje de contacto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar tu mensaje. Por favor intenta nuevamente.'
        });
    }
}

/**
 * GET /api/contact
 * Listar mensajes de contacto (admin)
 */
async function handleContactGet(req, res) {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        let query = 'SELECT * FROM contactos';
        const params = [];

        if (status) {
            query += ' WHERE status = $1';
            params.push(status);
        }

        query += ` ORDER BY fecha_creacion DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const { rows } = await pool.query(query, params);

        // Contar total
        const countQuery = status ?
            'SELECT COUNT(*) FROM contactos WHERE status = $1' :
            'SELECT COUNT(*) FROM contactos';
        const countParams = status ? [status] : [];
        const countResult = await pool.query(countQuery, countParams);

        res.json({
            success: true,
            data: rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('❌ Error obteniendo mensajes de contacto:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los mensajes'
        });
    }
}

// --- Express App Setup ---
const app = express();

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static(path.join(__dirname, '../images')));

// CSP Middleware for TinyMCE
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy',
        "default-src 'self';" +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com https://www.googletagmanager.com https://www.google-analytics.com https://accounts.google.com https://www.googleapis.com https://cdn.tiny.cloud;" +
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com https://fonts.googleapis.com https://cdn.tiny.cloud;" +
        "connect-src 'self' http://localhost:3000 http://localhost:3001 http://localhost:3002 http://localhost:3003 http://localhost:3004 http://localhost:3005 http://localhost:8000 http://127.0.0.1:8080 https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com https://fonts.googleapis.com https://www.google-analytics.com https://www.googletagmanager.com https://accounts.google.com https://www.googleapis.com https://cdn.tiny.cloud https://sp.tinymce.com;" +
        "img-src 'self' data: https://cdn.tiny.cloud https://*.tiny.cloud https://sp.tinymce.com;" + // Added img-src for TinyMCE images
        "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com https://cdn.tiny.cloud;" + // Added font-src for TinyMCE fonts
        "frame-src 'self' https://cdn.tiny.cloud https://www.google.com https://maps.google.com https://forms.gle;" // Added frame-src for TinyMCE iframes, Google Maps, and Google Forms
    );
    next();
});

// --- API Routes ---
app.get('/api/health', handleHealth);
app.get('/api/students', handleStudents);
app.get('/api/teachers', handleTeachers);
// REMOVED: Conflictaba con egresadosRoutes module (app.use('/api/egresados', egresadosRoutes))
// app.get('/api/egresados', handleEgresados);
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
app.get('/api/calendar/events', handleEventosCalendar);
app.get('/api/gamification/profile/admin@bge.edu.mx', handleGamificationProfile);
app.get('/api/gamification/daily-challenges', handleGamificationDailyChallenges);

// REMOVED: Conflictaba con suscriptoresRoutes module (app.use('/api/suscriptores', suscriptoresRoutes))
// Suscriptores routes
// app.get('/api/suscriptores', handleGetSuscriptores);
// app.get('/api/suscriptores/stats/general', handleGetSuscriptoresStats);

// REMOVED: Conflictaba con bolsaTrabajoRoutes module (app.use('/api/bolsa-trabajo', bolsaTrabajoRoutes))
// Bolsa de Trabajo routes
// app.get('/api/bolsa-trabajo', handleGetBolsaTrabajo);
// app.get('/api/bolsa-trabajo/stats/general', handleGetBolsaTrabajoStats);
app.get('/api/finances', handleFinances);

// NOTE: The following routes are now handled by the imported route modules:
// - /api/auth/* (authRoutes)
// - /api/students-auth/* (studentsAuthRoutes)
// - /api/contact/* (contactRoutes)
// - /api/parents/* (parentsRoutes)
// - /api/notificaciones/* (notificacionesRoutes)
// - /api/upload/* (uploadRoutes)
//
// These legacy handlers below are kept for backward compatibility only
// and will be overridden by the route modules above

// Legacy handlers for backward compatibility (these are overridden by route modules)
// app.all('/api/students-auth*', handleStudentsAuth);
// app.all('/api/parents*', handleParents);
// app.post('/api/notificaciones', handleNotificationsSubscription);
// app.post('/api/upload', upload.single('additionalDocument'), handleUpload);

// Debug routes
app.get('/api/debug-health', handleDebugHealth);
app.get('/api/debug-env', handleDebugEnv);
app.get('/api/debug-system', handleDebugSystem);
app.get('/api/debug-files', handleDebugFiles);
app.get('/api/debug-db', handleDebugDb);

// --- Import and Register All Backend Routes ---
const authRoutes = require('../backend/routes/auth');
const adminRoutes = require('../backend/routes/admin');
const dashboardRoutes = require('../backend/routes/dashboard');
const contactRoutes = require('../backend/routes/contact');
const inscriptionsRoutes = require('../backend/routes/inscriptions');
const studentsAuthRoutes = require('../backend/routes/students-auth');
const subscriptionsRoutes = require('../backend/routes/subscriptions');
const newslettersRoutes = require('../backend/routes/newsletters');
const egresadosRoutes = require('../backend/routes/egresados');
const analyticsDashboardRoutes = require('../backend/routes/analytics-dashboard');
const bolsaTrabajoRoutes = require('../backend/routes/bolsa-trabajo');
const suscriptoresRoutes = require('../backend/routes/suscriptores');
const quejasRoutes = require('../backend/routes/quejas');
const notificacionesRoutes = require('../backend/routes/notificaciones');
const solicitudesRoutes = require('../backend/routes/solicitudes');
const passwordRecoveryRoutes = require('../backend/routes/password-recovery');
const approvalsRoutes = require('../backend/routes/approvals');
const noticiasRoutes = require('../backend/routes/noticias');
const eventosRoutes = require('../backend/routes/eventos');
const avisosRoutes = require('../backend/routes/avisos');
const comunicadosRoutes = require('../backend/routes/comunicados');
const uploadRoutes = require('../backend/routes/upload');
const healthRoutes = require('../backend/routes/health');
const chartsDataRoutes = require('../backend/routes/charts-data');
const searchRoutes = require('../backend/routes/search');
const emailsRoutes = require('../backend/routes/emails');
const pollsRoutes = require('../backend/routes/polls');
const parentsRoutes = require('../backend/routes/parents');
const installPollsRoutes = require('../backend/routes/install-polls');
const installParentsRoutes = require('../backend/routes/install-parents');
const teachersPortalRoutes = require('../backend/routes/teachers-portal');
const messagingRoutes = require('../backend/routes/messaging');
const digitalLibraryRoutes = require('../backend/routes/digital-library');
const supportTicketsRoutes = require('../backend/routes/support-tickets');
const financesRoutes = require('../backend/routes/finances');
const citasRoutes = require('../backend/routes/citas');

// ✅ 28 RUTAS FALTANTES AGREGADAS (2 NOV 2025)
// Debug: Primer grupo de 10 rutas
const aiDatabaseRoutes = require('../backend/routes/ai-database');
const analyticsPredictiveRoutes = require('../backend/routes/analytics-predictivo');
const analyticsRoutes = require('../backend/routes/analytics');
const asistenteVirtualRoutes = require('../backend/routes/asistente-virtual');
const backupRoutes = require('../backend/routes/backup');
const calendarRoutes = require('../backend/routes/calendar');
const chatbotIaRoutes = require('../backend/routes/chatbot-ia');
const chatbotRoutes = require('../backend/routes/chatbot');
const cmsRoutes = require('../backend/routes/cms');
const deteccionRiesgosRoutes = require('../backend/routes/deteccion-riesgos');
// Mitad A del segundo grupo (9 rutas)
const gamificationRoutes = require('../backend/routes/gamification');
// const googleClassroomRoutes = require('../backend/routes/google-classroom');  // Has executeQuery
const gradesRoutes = require('../backend/routes/grades');
// const gradesAnalyticsRoutes = require('../backend/routes/gradesAnalytics');  // Has logger import
// const informationRoutes = require('../backend/routes/information');  // Has logger import
// const maintenanceRoutes = require('../backend/routes/maintenance');  // Has logger import
const migrationRoutes = require('../backend/routes/migration');
const multiTenantRoutes = require('../backend/routes/multi-tenant');
const newslettersPgRoutes = require('../backend/routes/newsletters-pg');
// Mitad B del segundo grupo (9 rutas)
// const notificationsRoutes = require('../backend/routes/notifications');  // Has logger import
// const parentTeacherCommunicationRoutes = require('../backend/routes/parentTeacherCommunication');  // Has logger import
// const realAiRoutes = require('../backend/routes/real-ai');
// const recomendacionesMlRoutes = require('../backend/routes/recomendaciones-ml');
// const sslRoutes = require('../backend/routes/ssl');  // Has logger import
// const studentsRoutes = require('../backend/routes/students');  // Has logger import
// const subscriptionsServiceRoutes = require('../backend/routes/subscriptions-service');
// const teachersRoutes = require('../backend/routes/teachers');  // Has logger import
// const uploadsRoutes = require('../backend/routes/uploads');

// Register all route modules
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/inscriptions', inscriptionsRoutes);
app.use('/api/students-auth', studentsAuthRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/newsletters', newslettersRoutes);
app.use('/api/egresados', egresadosRoutes);
app.use('/api/analytics', analyticsDashboardRoutes);
app.use('/api/bolsa-trabajo', bolsaTrabajoRoutes);
app.use('/api/suscriptores', suscriptoresRoutes);
app.use('/api/quejas', quejasRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/password-recovery', passwordRecoveryRoutes);
app.use('/api/approvals', approvalsRoutes);
app.use('/api/noticias', noticiasRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/avisos', avisosRoutes);
app.use('/api/comunicados', comunicadosRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/charts', chartsDataRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/emails', emailsRoutes);
app.use('/api/polls', pollsRoutes);
app.use('/api/parents', parentsRoutes);
app.use('/api/install-polls', installPollsRoutes);
app.use('/api/install-parents', installParentsRoutes);
app.use('/api/finances', financesRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/teachers-portal', teachersPortalRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/digital-library', digitalLibraryRoutes);
app.use('/api/support-tickets', supportTicketsRoutes);

// ✅ 28 RUTAS FALTANTES REGISTRADAS (2 NOV 2025)
// Debug: Primer grupo de 10 rutas
app.use('/api/ai-database', aiDatabaseRoutes);
app.use('/api/analytics-predictivo', analyticsPredictiveRoutes);
app.use('/api/analytics-direct', analyticsRoutes);  // analytics (para evitar conflicto con analytics-dashboard)
app.use('/api/asistente-virtual', asistenteVirtualRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/calendar-direct', calendarRoutes);  // calendar (para evitar conflicto si necesario)
app.use('/api/chatbot-ia', chatbotIaRoutes);
app.use('/api/chatbot-direct', chatbotRoutes);  // chatbot (para evitar conflicto)
app.use('/api/cms', cmsRoutes);
app.use('/api/deteccion-riesgos', deteccionRiesgosRoutes);
// Mitad A - Activadas (18 de 28 rutas nuevas)
app.use('/api/gamification-direct', gamificationRoutes);  // gamification (para evitar conflicto)
app.use('/api/grades-direct', gradesRoutes);  // grades (para evitar conflicto)
app.use('/api/migration', migrationRoutes);
app.use('/api/multi-tenant', multiTenantRoutes);
app.use('/api/newsletters-pg', newslettersPgRoutes);

// Mitad B - Activadas (adicionales)
// DESHABILITADAS TEMPORALMENTE (requieren reparación de logger imports):
// Rutas con logger import que causa "Route.post() requires callback":
// - google-classroom (executeQuery issue)
// - gradesAnalytics
// - information
// - maintenance
// - notifications
// - parentTeacherCommunication
// - ssl
// - students
// - teachers

// Not implemented routes
const notImplementedRoutes = [
];
app.all(notImplementedRoutes, handleNotImplemented);

// --- Export the app for Vercel ---
module.exports = app;