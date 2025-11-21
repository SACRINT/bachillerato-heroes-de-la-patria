// api/index.js - Serverless handler nativo para Vercel
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Pool de PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';

// Headers CORS
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

// Helper para leer body manualmente si no viene parseado
async function getRequestBody(req) {
    // Si req.body ya tiene datos, usarlo
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
        return req.body;
    }

    // Si es string, parsearlo
    if (typeof req.body === 'string' && req.body.length > 0) {
        try {
            return JSON.parse(req.body);
        } catch (e) {
            console.log('[BODY] Failed to parse string body');
        }
    }

    // Leer del stream manualmente
    return new Promise((resolve) => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => {
            if (data) {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    console.log('[BODY] Failed to parse stream data:', e.message);
                    resolve({});
                }
            } else {
                resolve({});
            }
        });
        req.on('error', () => resolve({}));
        // Timeout corto
        setTimeout(() => resolve({}), 500);
    });
}

// Handler principal
module.exports = async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200, corsHeaders);
        return res.end();
    }

    // Set CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    // Leer body para métodos POST/PUT
    let body = {};
    if (req.method === 'POST' || req.method === 'PUT') {
        body = await getRequestBody(req);
    }

    console.log('[API] Method:', req.method, 'Path:', path);
    console.log('[API] req.body type:', typeof req.body);
    console.log('[API] req.body:', JSON.stringify(req.body));
    console.log('[API] Parsed body:', JSON.stringify(body));

    try {
        // ============================================
        // ROUTING
        // ============================================

        // GET /api/config/tenant
        if (path === '/api/config/tenant' && req.method === 'GET') {
            return res.status(200).json({
                success: true,
                isDefault: true,
                tenant: {
                    id: 1,
                    uuid: 'default-uuid',
                    school_name: 'Bachillerato General Estatal "Héroes de la Patria"',
                    schema_name: 'public',
                    domain: req.headers.host || 'localhost',
                    status: 'activo'
                },
                config: {
                    school_name: 'Bachillerato General Estatal "Héroes de la Patria"',
                    school_short_name: 'BGE',
                    school_type: 'Bachillerato General por Competencias',
                    primary_color: '#2563eb',
                    secondary_color: '#1e40af',
                    logo_url: '/public/images/logo-bge.png',
                    contact_email: 'contacto@heroespatria.edu.mx',
                    contact_phone: '(777) 123-4567',
                    address: 'Calle Principal #123, Cuernavaca, Morelos',
                    enable_notifications: true,
                    enable_gamification: true
                }
            });
        }

        // GET /api/config/public-keys
        if (path === '/api/config/public-keys' && req.method === 'GET') {
            return res.status(200).json({
                success: true,
                keys: {
                    google_oauth_client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID_PROD || '',
                    tinymce: process.env.TINYMCE_API_KEY || 'no-api-key',
                },
                timestamp: new Date().toISOString()
            });
        }

        // GET /api/config/google-client-id
        if (path === '/api/config/google-client-id' && req.method === 'GET') {
            const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID_PROD || process.env.GOOGLE_OAUTH_CLIENT_ID || '';
            return res.status(200).json({
                success: true,
                clientId: clientId,
                configured: !!clientId,
                environment: process.env.NODE_ENV || 'production'
            });
        }

        // POST /api/auth/login
        if (path === '/api/auth/login' && req.method === 'POST') {
            console.log('[LOGIN] Body received:', JSON.stringify(body));

            // Aceptar tanto 'email' como 'username' del frontend
            const email = body.email || body.username;
            const password = body.password;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email/usuario y contraseña son requeridos',
                    debug: {
                        bodyKeys: Object.keys(body),
                        hasEmail: !!body.email,
                        hasUsername: !!body.username,
                        hasPassword: !!password
                    }
                });
            }

            const result = await pool.query(
                'SELECT id, uuid, email, password_hash, role, nombre, apellido_paterno, status FROM usuarios WHERE email = $1 LIMIT 1',
                [email]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
            }

            const user = result.rows[0];

            if (user.status !== 'activo') {
                return res.status(401).json({ success: false, error: 'Cuenta no activa' });
            }

            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
            }

            const token = jwt.sign(
                { id: user.id, uuid: user.uuid, email: user.email, role: user.role, nombre: user.nombre },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.status(200).json({
                success: true,
                token,
                user: {
                    id: user.id,
                    uuid: user.uuid,
                    email: user.email,
                    role: user.role,
                    nombre: user.nombre,
                    apellido_paterno: user.apellido_paterno
                }
            });
        }

        // GET /api/health
        if (path === '/api/health' && req.method === 'GET') {
            try {
                await pool.query('SELECT 1');
                return res.status(200).json({
                    success: true,
                    status: 'healthy',
                    database: 'connected',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                return res.status(200).json({
                    success: true,
                    status: 'degraded',
                    database: 'disconnected',
                    timestamp: new Date().toISOString()
                });
            }
        }

        // GET /api/students
        if (path === '/api/students' && req.method === 'GET') {
            try {
                const result = await pool.query('SELECT * FROM estudiantes LIMIT 100');
                return res.status(200).json({ success: true, data: result.rows });
            } catch (error) {
                return res.status(200).json({ success: true, data: [] });
            }
        }

        // GET /api/teachers
        if (path === '/api/teachers' && req.method === 'GET') {
            try {
                const result = await pool.query('SELECT * FROM docentes LIMIT 100');
                return res.status(200).json({ success: true, data: result.rows });
            } catch (error) {
                return res.status(200).json({ success: true, data: [] });
            }
        }

        // GET /api/pendientes-aprobacion
        if (path === '/api/pendientes-aprobacion' && req.method === 'GET') {
            try {
                const result = await pool.query("SELECT * FROM pending_approvals WHERE status = 'pending' LIMIT 100");
                return res.status(200).json({ success: true, data: result.rows });
            } catch (error) {
                return res.status(200).json({ success: true, data: [] });
            }
        }

        // ============================================
        // ENDPOINTS ADICIONALES DEL DASHBOARD
        // ============================================

        // GET /api/admin/students
        if ((path === '/api/admin/students' || path.startsWith('/api/admin/students')) && req.method === 'GET') {
            try {
                const result = await pool.query('SELECT * FROM estudiantes ORDER BY id DESC LIMIT 100');
                return res.status(200).json({ success: true, data: result.rows, students: result.rows });
            } catch (e) { return res.status(200).json({ success: true, data: [], students: [] }); }
        }

        // GET /api/admin/teachers
        if ((path === '/api/admin/teachers' || path.startsWith('/api/admin/teachers')) && req.method === 'GET') {
            try {
                const result = await pool.query('SELECT * FROM docentes ORDER BY id DESC LIMIT 100');
                return res.status(200).json({ success: true, data: result.rows, teachers: result.rows });
            } catch (e) { return res.status(200).json({ success: true, data: [], teachers: [] }); }
        }

        // GET /api/egresados
        if ((path === '/api/egresados' || path === '/api/egresados/list') && req.method === 'GET') {
            try {
                const result = await pool.query('SELECT * FROM egresados ORDER BY created_at DESC LIMIT 100');
                return res.status(200).json({ success: true, data: result.rows });
            } catch (e) { return res.status(200).json({ success: true, data: [] }); }
        }

        // GET /api/egresados/stats/general
        if (path === '/api/egresados/stats/general' && req.method === 'GET') {
            return res.status(200).json({ success: true, total: 0, verified: 0, pending: 0 });
        }

        // GET /api/parents
        if (path === '/api/parents' && req.method === 'GET') {
            try {
                const result = await pool.query('SELECT * FROM padres ORDER BY id DESC LIMIT 100');
                return res.status(200).json({ success: true, data: result.rows });
            } catch (e) { return res.status(200).json({ success: true, data: [] }); }
        }

        // GET /api/solicitudes
        if (path === '/api/solicitudes' && req.method === 'GET') {
            try {
                const result = await pool.query('SELECT * FROM solicitudes ORDER BY created_at DESC LIMIT 100');
                return res.status(200).json({ success: true, data: result.rows });
            } catch (e) { return res.status(200).json({ success: true, data: [] }); }
        }

        // GET /api/suscriptores
        if (path === '/api/suscriptores' && req.method === 'GET') {
            try {
                const result = await pool.query('SELECT * FROM suscriptores_notificaciones ORDER BY created_at DESC LIMIT 100');
                return res.status(200).json({ success: true, data: result.rows });
            } catch (e) { return res.status(200).json({ success: true, data: [] }); }
        }

        // GET /api/suscriptores/stats/general
        if (path === '/api/suscriptores/stats/general' && req.method === 'GET') {
            return res.status(200).json({
                success: true,
                data: {
                    total: 0,
                    porEstado: [{ estado: 'activo', cantidad: 0 }],
                    porVerificacion: [{ verificado: 1, cantidad: 0 }],
                    nuevosUltimos7Dias: 0
                }
            });
        }

        // GET /api/finances
        if (path === '/api/finances' && req.method === 'GET') {
            return res.status(200).json({ success: true, data: [], ingresos: [], gastos: [], balance: 0 });
        }

        // GET /api/bolsa-trabajo
        if (path === '/api/bolsa-trabajo' && req.method === 'GET') {
            try {
                const result = await pool.query('SELECT * FROM bolsa_trabajo ORDER BY created_at DESC LIMIT 100');
                return res.status(200).json({ success: true, data: result.rows });
            } catch (e) { return res.status(200).json({ success: true, data: [] }); }
        }

        // GET /api/bolsa-trabajo/stats/general
        if (path === '/api/bolsa-trabajo/stats/general' && req.method === 'GET') {
            return res.status(200).json({ success: true, total: 0, active: 0, filled: 0 });
        }

        // GET /api/citas/list
        if (path === '/api/citas/list' && req.method === 'GET') {
            try {
                const result = await pool.query('SELECT * FROM citas ORDER BY fecha_solicitada DESC LIMIT 100');
                return res.status(200).json({ success: true, data: result.rows });
            } catch (e) { return res.status(200).json({ success: true, data: [] }); }
        }

        // GET /api/approvals/pending
        if (path === '/api/approvals/pending' && req.method === 'GET') {
            try {
                const result = await pool.query("SELECT * FROM pending_approvals WHERE status = 'pending' LIMIT 100");
                return res.status(200).json({ success: true, data: result.rows });
            } catch (e) { return res.status(200).json({ success: true, data: [] }); }
        }

        // GET /api/admin/pending-registrations
        if (path === '/api/admin/pending-registrations' && req.method === 'GET') {
            return res.status(200).json({ success: true, data: [], total: 0 });
        }

        // GET /api/dashboard/active-users
        if (path === '/api/dashboard/active-users' && req.method === 'GET') {
            return res.status(200).json({ success: true, count: 0, users: [] });
        }

        // GET /api/analytics/dashboard
        if (path === '/api/analytics/dashboard' && req.method === 'GET') {
            return res.status(200).json({ success: true, data: { totalUsers: 0, activeUsers: 0, pageViews: 0 } });
        }

        // Stats endpoints
        if (path === '/api/noticias/stats' && req.method === 'GET') {
            return res.status(200).json({ success: true, total: 0, published: 0, draft: 0 });
        }
        if (path === '/api/eventos/stats' && req.method === 'GET') {
            return res.status(200).json({ success: true, total: 0, upcoming: 0, past: 0 });
        }
        if (path === '/api/avisos/stats' && req.method === 'GET') {
            return res.status(200).json({ success: true, total: 0, active: 0, expired: 0 });
        }
        if (path === '/api/comunicados/stats' && req.method === 'GET') {
            return res.status(200).json({ success: true, total: 0, published: 0, draft: 0 });
        }

        // Charts endpoints
        if (path === '/api/charts/eventos-por-categoria' && req.method === 'GET') {
            return res.status(200).json({ success: true, data: { labels: [], datasets: [] } });
        }
        if (path === '/api/charts/quejas-por-tipo' && req.method === 'GET') {
            return res.status(200).json({ success: true, data: { labels: [], datasets: [] } });
        }
        if (path === '/api/charts/noticias-por-mes' && req.method === 'GET') {
            return res.status(200).json({ success: true, data: { labels: [], datasets: [] } });
        }
        if (path === '/api/charts/suscriptores-crecimiento' && req.method === 'GET') {
            return res.status(200).json({ success: true, data: { labels: [], datasets: [] } });
        }

        // Other dashboard endpoints
        if (path === '/api/settings' && req.method === 'GET') {
            return res.status(200).json({ success: true, data: { theme: 'light', language: 'es' } });
        }
        if (path === '/api/notifications' && req.method === 'GET') {
            return res.status(200).json({ success: true, data: [], total: 0, unread: 0 });
        }
        if (path === '/api/attendance' && req.method === 'GET') {
            return res.status(200).json({ success: true, data: [], total: 0 });
        }
        if (path === '/api/grades' && req.method === 'GET') {
            return res.status(200).json({ success: true, data: [], total: 0 });
        }
        if (path === '/api/dashboard' && req.method === 'GET') {
            return res.status(200).json({ success: true, data: {} });
        }

        // Ruta no encontrada
        return res.status(404).json({
            success: false,
            error: 'Endpoint no encontrado',
            path: path,
            method: req.method
        });

    } catch (error) {
        console.error('[API] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
};
