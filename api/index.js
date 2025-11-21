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
            // Usar body ya parseado al inicio del handler
            console.log('[LOGIN] Using parsed body:', JSON.stringify(body));

            const email = body.email;
            const password = body.password;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email y contraseña son requeridos',
                    debug: {
                        reqBodyType: typeof req.body,
                        reqBodyKeys: req.body ? Object.keys(req.body) : [],
                        parsedBodyKeys: Object.keys(body),
                        parsedBody: JSON.stringify(body).substring(0, 100),
                        hasEmail: !!email,
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
