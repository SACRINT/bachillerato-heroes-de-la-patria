/**
 * 🛡️ SERVIDOR BACKEND SEGURO
 * Bachillerato General Estatal "Héroes de la Patria"
 */

// 🔴 CORRECCIÓN: Cargar .env desde el directorio raíz del proyecto
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), override: true });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { pool } = require('./config/database');

// Middleware
const { errorHandler } = require('./middleware/errorHandler');
const { securityMiddleware } = require('./middleware/security');

// Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const dashboardRoutes = require('./routes/dashboard');
const contactRoutes = require('./routes/contact');
const inscriptionsRoutes = require('./routes/inscriptions');
const studentsAuthRoutes = require('./routes/students-auth');
const subscriptionsRoutes = require('./routes/subscriptions');
const newslettersRoutes = require('./routes/newsletters');
const egresadosRoutes = require('./routes/egresados');
const analyticsDashboardRoutes = require('./routes/analytics-dashboard');
const bolsaTrabajoRoutes = require('./routes/bolsa-trabajo');
const suscriptoresRoutes = require('./routes/suscriptores');
const quejasRoutes = require('./routes/quejas');
const notificacionesRoutes = require('./routes/notificaciones');
const solicitudesRoutes = require('./routes/solicitudes');
const passwordRecoveryRoutes = require('./routes/password-recovery');
const approvalsRoutes = require('./routes/approvals');
const noticiasRoutes = require('./routes/noticias');
const eventosRoutes = require('./routes/eventos');
const avisosRoutes = require('./routes/avisos');
const comunicadosRoutes = require('./routes/comunicados');
const uploadRoutes = require('./routes/upload');
const healthRoutes = require('./routes/health');
const chartsDataRoutes = require('./routes/charts-data');
const searchRoutes = require('./routes/search');
const emailsRoutes = require('./routes/emails');
const pollsRoutes = require('./routes/polls');
const parentsRoutes = require('./routes/parents');
const installPollsRoutes = require('./routes/install-polls');
const teachersPortalRoutes = require('./routes/teachers-portal');
const messagingRoutes = require('./routes/messaging');
const digitalLibraryRoutes = require('./routes/digital-library');
const supportTicketsRoutes = require('./routes/support-tickets');
const installParentsRoutes = require('./routes/install-parents');
const financesRoutes = require('./routes/finances');
const citasRoutes = require('./routes/citas');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE & CONFIGURACIÓN
// ============================================

app.set('trust proxy', 1);

app.use(helmet({
    permissionsPolicy: {
        camera: ["'self'"],
    },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://unpkg.com", "https://www.googletagmanager.com", "https://www.google-analytics.com", "https://accounts.google.com", "https://www.googleapis.com", "https://cdn.tiny.cloud", "*.tiny.cloud", "blob:"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://unpkg.com", "https://fonts.googleapis.com", "https://cdn.tiny.cloud", "*.tiny.cloud"],
            connectSrc: ["'self'", "http://localhost:3000", "ws:", "wss:", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://unpkg.com", "https://fonts.googleapis.com", "https://www.google-analytics.com", "https://www.googletagmanager.com", "https://accounts.google.com", "https://www.googleapis.com", "https://cdn.tiny.cloud", "*.tiny.cloud", "https://sp.tinymce.com"],
            imgSrc: ["'self'", "data:", "blob:", "https:", "https://cdn.tiny.cloud", "*.tiny.cloud", "https://sp.tinymce.com"],
            fontSrc: ["'self'", "data:", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com", "https://cdn.tiny.cloud", "*.tiny.cloud"],
            frameSrc: ["'self'", "https://cdn.tiny.cloud", "*.tiny.cloud", "https://www.google.com", "https://maps.google.com", "https://forms.gle"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"]
        }
    }
}));

// CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.CORS_ORIGIN ?
            process.env.CORS_ORIGIN.split(',') :
            ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:3000'];

        // ✅ CORRECCIÓN: Permitir origin null (archivos HTML locales) y undefined
        if (!origin || origin === 'null') {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`🚫 CORS blocked origin: ${origin}`);
            // ⚠️ Solo advertir pero permitir en desarrollo
            if (process.env.NODE_ENV === 'production') {
                callback(new Error('CORS: Origin not allowed'));
            } else {
                console.warn(`⚠️  Permitiendo origin no autorizado en modo desarrollo: ${origin}`);
                callback(null, true);
            }
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate Limiting - Ajustado para dashboard con auto-refresh
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'production' ? 300 : 1000), // 1000 en dev, 300 en prod (aumentado de 100)
    message: {
        error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
        retryAfter: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Saltar rate limiting para localhost en desarrollo
        if (process.env.NODE_ENV !== 'production') {
            const ip = req.ip || req.connection.remoteAddress;
            return ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1';
        }
        return false;
    }
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

// Configurar store de sesiones con PostgreSQL
app.use(session({
    store: new pgSession({
        pool: pool,                     // Pool de conexiones PostgreSQL
        tableName: 'user_sessions',     // Tabla que creamos en PostgreSQL
        pruneSessionInterval: 60 * 15,  // Limpiar sesiones expiradas cada 15 minutos
        createTableIfMissing: false     // No crear tabla automáticamente (ya la creamos)
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true,                                // Prevent XSS
        maxAge: 30 * 24 * 60 * 60 * 1000               // 30 días (como recomendaste)
    }
}));

// Security Middleware - ✅ CONFIGURADO para no interferir con archivos estáticos
app.use(securityMiddleware);

// --- CORRECT & COMPLETE STATIC FILE SERVING ---
console.log('🌍 Configurando servidor de archivos estáticos...');
app.use(express.static(path.join(__dirname, '../public')));
app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/images', express.static(path.join(__dirname, '../images')));
app.use('/documents', express.static(path.join(__dirname, '../documents')));
app.use('/videos', express.static(path.join(__dirname, '../videos')));
app.use('/data', express.static(path.join(__dirname, '../data')));
app.use('/partials', express.static(path.join(__dirname, '../partials')));
app.use('/sw-offline-first.js', express.static(path.join(__dirname, '../sw-offline-first.js')));


// ============================================
// RUTAS DE API
// ============================================

// ✅ RATE LIMITER YA APLICADO EN LÍNEA 132 (1000 req/15min en dev, 300 en prod)
// ❌ ELIMINADO: apiLimiter duplicado que causaba error 429
// const apiLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 100,
//     message: { error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.' },
//     standardHeaders: true,
//     legacyHeaders: false,
// });
// app.use('/api/', apiLimiter);

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

// ============================================
// CONFIGURACIÓN PÚBLICA (API KEYS PARA FRONTEND)
// ============================================

/**
 * GET /api/config/public-keys
 * Endpoint para exponer configuraciones públicas de forma segura
 * No requiere autenticación (API keys públicas de CDNs)
 */
app.get('/api/config/public-keys', (req, res) => {
    res.json({
        success: true,
        keys: {
            tinymce: process.env.TINYMCE_API_KEY || 'no-api-key',
            google_oauth_client_id: process.env.GOOGLE_OAUTH_CLIENT_ID_PROD || ''
        }
    });
});

// ============================================
// FALLBACK & ERROR HANDLING
// ============================================

// SPA Fallback: Sirve index.html para rutas de navegación, ignorando archivos con extensiones.
app.get(/^(?!\/api|.*\.\w+$).*$/, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 Handler para rutas de API no encontradas
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Endpoint de API no encontrado' });
});

app.use(errorHandler);

// ============================================
// SERVER START
// ============================================

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor backend iniciado en http://localhost:${PORT}`);
        console.log('✅✅✅ ¡VERSIÓN CORRECTA DEL SERVIDOR EN EJECUCIÓN! ✅✅✅');
    });
}

module.exports = app;
