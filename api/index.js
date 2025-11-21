// api/index.js - Entry point para Vercel con endpoints críticos inline
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware básico
app.use(cors());
app.use(express.json());

// Pool de PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';

// ============================================
// ENDPOINTS CRÍTICOS (sin dependencias backend)
// ============================================

// GET /api/config/tenant
app.get('/api/config/tenant', (req, res) => {
    const defaultConfig = {
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
    };
    res.json({
        success: true,
        isDefault: true,
        tenant: {
            id: 1,
            uuid: 'default-uuid',
            school_name: defaultConfig.school_name,
            schema_name: 'public',
            domain: req.headers.host || 'localhost',
            status: 'activo'
        },
        config: defaultConfig
    });
});

// GET /api/config/public-keys
app.get('/api/config/public-keys', (req, res) => {
    res.json({
        success: true,
        keys: {
            google_oauth_client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID_PROD || '',
            tinymce: process.env.TINYMCE_API_KEY || 'no-api-key',
        },
        timestamp: new Date().toISOString()
    });
});

// GET /api/config/google-client-id
app.get('/api/config/google-client-id', (req, res) => {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID_PROD
        || process.env.GOOGLE_OAUTH_CLIENT_ID
        || '';
    res.json({
        success: true,
        clientId: clientId,
        configured: !!clientId,
        environment: process.env.NODE_ENV || 'production'
    });
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email y contraseña son requeridos'
            });
        }

        const result = await pool.query(
            'SELECT id, uuid, email, password_hash, role, nombre, apellido_paterno, status FROM usuarios WHERE email = $1 LIMIT 1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }

        const user = result.rows[0];

        if (user.status !== 'activo') {
            return res.status(401).json({
                success: false,
                error: 'Cuenta no activa'
            });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                uuid: user.uuid,
                email: user.email,
                role: user.role,
                nombre: user.nombre
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
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

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// GET /api/health
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            success: true,
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({
            success: true,
            status: 'degraded',
            database: 'disconnected',
            timestamp: new Date().toISOString()
        });
    }
});

// GET /api/students
app.get('/api/students', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM estudiantes LIMIT 100');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.json({ success: true, data: [] });
    }
});

// GET /api/teachers
app.get('/api/teachers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM docentes LIMIT 100');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.json({ success: true, data: [] });
    }
});

// GET /api/pendientes-aprobacion
app.get('/api/pendientes-aprobacion', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM pending_approvals WHERE status = 'pending' LIMIT 100");
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.json({ success: true, data: [] });
    }
});

// Fallback para rutas no encontradas
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint no encontrado',
        path: req.path
    });
});

module.exports = app;
