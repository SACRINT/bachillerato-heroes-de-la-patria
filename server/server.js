/**
 * 🛡️ SERVIDOR BACKEND SEGURO
 * Bachillerato General Estatal "Héroes de la Patria"
 * 
 * CARACTERÍSTICAS DE SEGURIDAD:
 * ✅ JWT Authentication
 * ✅ bcrypt Password Hashing  
 * ✅ Rate Limiting
 * ✅ CORS Protection
 * ✅ Security Headers (Helmet)
 * ✅ Input Validation & Sanitization
 * ✅ CSRF Protection
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');

// Routes
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');

// Middleware
const { errorHandler } = require('./middleware/errorHandler');
const { securityMiddleware } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// CONFIGURACIÓN DE SEGURIDAD
// ============================================

// Helmet - Security Headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "https://accounts.google.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://www.googletagmanager.com", "https://www.google-analytics.com", "https://accounts.google.com", "https://www.googleapis.com"],
            scriptSrcAttr: ["'self'", "'unsafe-inline'", "'unsafe-hashes'"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://www.google-analytics.com", "https://www.googletagmanager.com", "https://accounts.google.com", "https://www.googleapis.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'", "https://www.google.com", "https://maps.google.com", "https://www.openstreetmap.org", "https://accounts.google.com"]
        }
    },
    hsts: {
        maxAge: parseInt(process.env.SECURITY_HSTS_MAX_AGE) || 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.CORS_ORIGIN ? 
            process.env.CORS_ORIGIN.split(',') : 
            ['http://localhost:8080', 'http://127.0.0.1:8080'];
        
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`🚫 CORS blocked origin: ${origin}`);
            callback(new Error('CORS: Origin not allowed'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
        retryAfter: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session Configuration - Obligatoria SESSION_SECRET
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
    console.error('❌ ERROR: SESSION_SECRET environment variable is required');
    process.exit(1);
}

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true, // Prevent XSS
        maxAge: 30 * 60 * 1000 // 30 minutes
    }
}));

// Security Middleware
app.use(securityMiddleware);

// ============================================
// RUTAS DE API
// ============================================

// Health Check (con ambas rutas para compatibilidad)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// Health Check alternativo (compatibilidad con el frontend)
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// Endpoints de información para compatibilidad con el frontend
app.get('/api/information/categories', (req, res) => {
    res.json({
        categories: [
            {
                id: 'general',
                name: 'Información General',
                description: 'Información básica sobre el bachillerato'
            },
            {
                id: 'academic',
                name: 'Académico',
                description: 'Programas académicos y especialidades'
            },
            {
                id: 'services',
                name: 'Servicios',
                description: 'Servicios estudiantiles disponibles'
            },
            {
                id: 'admissions',
                name: 'Admisiones',
                description: 'Proceso de admisión y requisitos'
            }
        ],
        timestamp: new Date().toISOString()
    });
});

// Endpoints para analytics (mock responses)
app.get('/api/analytics/custom', (req, res) => {
    res.json({
        message: 'Analytics endpoint - implementar según necesidades',
        timestamp: new Date().toISOString()
    });
});

app.post('/api/analytics/custom', (req, res) => {
    res.json({
        message: 'Analytics data received',
        data: req.body,
        timestamp: new Date().toISOString()
    });
});

// Analytics tracking endpoint
app.post('/api/analytics/track', (req, res) => {
    console.log('📊 Analytics track:', req.body);
    res.json({
        success: true,
        message: 'Analytics tracking data received',
        timestamp: new Date().toISOString()
    });
});

// Analytics heartbeat endpoint
app.post('/api/analytics/heartbeat', (req, res) => {
    res.json({
        success: true,
        message: 'Heartbeat received',
        timestamp: new Date().toISOString()
    });
});

// Social share analytics endpoint
app.post('/api/analytics/social-share', (req, res) => {
    console.log('📱 Social share:', req.body);
    res.json({
        success: true,
        message: 'Social share analytics received',
        timestamp: new Date().toISOString()
    });
});

// Session analytics endpoint
app.post('/api/analytics/session', (req, res) => {
    console.log('📊 Session analytics:', req.body);
    res.json({
        success: true,
        message: 'Session analytics received',
        timestamp: new Date().toISOString()
    });
});

// Authentication Routes
app.use('/api/auth', authRoutes);

// Contact Routes
app.use('/api/contact', contactRoutes);

// Static Files (Development & Production)
console.log('🌍 Configurando servidor de archivos estáticos...');
app.use(express.static(path.join(__dirname, '../')));

// Serve index.html for any non-API routes (SPA support)
app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Serve static files
    const filePath = path.join(__dirname, '../', req.path);
    
    // Check if file exists
    require('fs').access(filePath, require('fs').constants.F_OK, (err) => {
        if (err) {
            // File doesn't exist, serve index.html for SPA routing
            res.sendFile(path.join(__dirname, '../index.html'));
        } else {
            // File exists, let express.static handle it
            res.sendFile(filePath);
        }
    });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint no encontrado',
        path: req.originalUrl,
        method: req.method
    });
});

// Global Error Handler
app.use(errorHandler);

// ============================================
// SERVER START
// ============================================

const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor backend iniciado:`);
    console.log(`   📡 Puerto: ${PORT}`);
    console.log(`   🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   🔒 Seguridad: Helmet + CORS + Rate Limiting`);
    console.log(`   🛡️  JWT: Habilitado`);
    console.log(`   ⏰ Iniciado: ${new Date().toLocaleString()}`);
    console.log(`   🌐 URL: http://localhost:${PORT}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('💤 Apagando servidor gracefully...');
    server.close(() => {
        console.log('✅ Servidor cerrado.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('💤 Apagando servidor gracefully...');
    server.close(() => {
        console.log('✅ Servidor cerrado.');
        process.exit(0);
    });
});

module.exports = app;