/**
 * 🚀 VERCEL SERVERLESS ENTRY POINT
 * Archivo de entrada para funciones serverless de Vercel
 * NO debe hacer .listen() - Vercel maneja la ejecución
 */

// Cargar variables de entorno PRIMERO
const dotenv = require('dotenv');
const path = require('path');

// Cargar .env desde raíz (Vercel inyecta automáticamente)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// CRÍTICO: Marcar NODE_ENV como producción para Vercel
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
}

// Importar directamente los componentes de server.js SIN ejecutar .listen()
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

// NO cargar database.js aqui - evita errores de pool initialization
// const { pool } = require('../backend/config/database');

// Middleware con lazy loading para evitar crashes al requerir
let errorHandler;
let securityMiddleware;
let tenantContext;

try {
    errorHandler = require('../backend/middleware/errorHandler').errorHandler;
} catch (e) {
    console.warn('[VERCEL] Error loading errorHandler:', e.message);
    errorHandler = (err, req, res, next) => {
        res.status(500).json({ error: 'Internal Server Error' });
    };
}

try {
    securityMiddleware = require('../backend/middleware/security').securityMiddleware;
} catch (e) {
    console.warn('[VERCEL] Error loading securityMiddleware:', e.message);
    securityMiddleware = (req, res, next) => next();
}

try {
    tenantContext = require('../backend/middleware/tenant-context').tenantContext;
} catch (e) {
    console.warn('[VERCEL] Error loading tenantContext:', e.message);
    tenantContext = (req, res, next) => next();
}

// Crear la app
const app = express();

// VERIFICACIÓN DE ENTORNO CRÍTICA
console.log('[VERCEL STARTUP]', {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
    DATABASE_URL_VALID: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('CHANGE_ME'),
    TIMESTAMP: new Date().toISOString()
});

// ============================================
// MIDDLEWARE BÁSICO
// ============================================
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            connectSrc: ["'self'", "https:", "ws:", "wss:"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
            frameSrc: ["'self'", "https://accounts.google.com"]
        }
    }
}));

app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Middleware personalizado
app.use(securityMiddleware);
app.use(tenantContext);

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
app.get('/health', (req, res) => {
    const healthStatus = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        database: {
            configured: !!process.env.DATABASE_URL,
            valid: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('CHANGE_ME')
        }
    };

    res.json(healthStatus);
});

// ============================================
// RUTAS
// ============================================

// ============================================
// RUTAS API (LAZY LOADED ON DEMAND)
// ============================================

// /api/config/tenant - Lazy loader para evitar inicializar pool en startup
app.get('/api/config/tenant', async (req, res) => {
    try {
        // Lazy load solo cuando sea necesario
        const { getTenantByDomain } = require('../backend/data/database-access');
        const hostname = req.headers.host || req.host || 'localhost';
        const tenant = await getTenantByDomain(hostname);

        const defaultConfig = {
            school_name: 'Bachillerato General Estatal "Héroes de la Patria"',
            school_short_name: 'BGE'
        };

        if (!tenant) {
            return res.json({
                success: true,
                isDefault: true,
                tenant: { id: 1, school_name: defaultConfig.school_name },
                config: defaultConfig
            });
        }

        res.json({
            success: true,
            tenant: tenant,
            config: tenant.config_json || defaultConfig
        });
    } catch (error) {
        console.error('[VERCEL] Error en /api/config/tenant:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener configuración',
            message: error.message
        });
    }
});

// /api/config/public-keys - Endpoint seguro que no requiere BD
app.get('/api/config/public-keys', (req, res) => {
    try {
        const isDevelopment = process.env.NODE_ENV === 'development';
        res.json({
            success: true,
            environment: isDevelopment ? 'development' : 'production',
            keys: {
                tinymce: process.env.TINYMCE_API_KEY || null,
                google_oauth_client_id: isDevelopment
                    ? (process.env.GOOGLE_OAUTH_CLIENT_ID_DEV || '')
                    : (process.env.GOOGLE_OAUTH_CLIENT_ID_PROD || '')
            }
        });
    } catch (error) {
        console.error('[VERCEL] Error en /api/config/public-keys:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener keys',
            message: error.message
        });
    }
});

// ============================================
// ERROR HANDLING
// ============================================
app.use(errorHandler);

// Catch-all para 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint no encontrado',
        path: req.path,
        method: req.method
    });
});

// ============================================
// EXPORTAR PARA VERCEL
// ============================================
module.exports = app;
