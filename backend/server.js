/**
 * 🛡️ SERVIDOR BACKEND SEGURO
 * Bachillerato General Estatal "Héroes de la Patria"
 */

// 🔴 CORRECCIÓN: Cargar .env desde el directorio raíz del proyecto
const path = require('path');
const devLogger = require('./utils/devLogger');

// ORDEN CRÍTICA DE CARGA:
// 1. Cargar .env.local PRIMERO (contiene secretos reales, NO versionado)
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local'), override: false });

// 2. Cargar .env SEGUNDO como fallback (publicable, neutralizado de secretos)
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), override: false });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { pool } = require('./config/database');
const cspConfig = require('./config/csp-config');

// Middleware
const { errorHandler } = require('./middleware/errorHandler');
const { securityMiddleware } = require('./middleware/security');

// Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const configRoutes = require('./routes/config');  // ✅ CONFIG ROUTES - Multi-tenant configuration (9 NOV 2025)
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
const tenantsRoutes = require('./routes/tenants');  // ✅ MULTI-TENANT MANAGEMENT (8 NOV 2025)
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
const calendarRoutes = require('./routes/calendar');  // ✅ CALENDAR ROUTES - Eventos del calendario interactivo
const pendientesAprobacionRoutes = require('./routes/pendientes-aprobacion');
const diagnosticoAprobacionesRoutes = require('./routes/diagnostico-aprobaciones');
const gamificationRoutes = require('./routes/gamification');  // ✅ GAMIFICATION ROUTES - Sistema de logros y puntuaciones

// ✅ FASE 1.2: 28 RUTAS HUÉRFANAS - Registradas 11 NOV 2025
// GRUPO 1: IA/ML CRÍTICAS (6 rutas)
const aiDatabaseRoutes = require('./routes/ai-database');
const analyticsPredictivo = require('./routes/analytics-predictivo');
const asistenteVirtualRoutes = require('./routes/asistente-virtual');
const realAiRoutes = require('./routes/real-ai');
const recomendacionesMLRoutes = require('./routes/recomendaciones-ml');
const deteccionRiesgosRoutes = require('./routes/deteccion-riesgos');

// GRUPO 2: CORE FEATURES ALTAS (10 rutas)
const studentsRoutes = require('./routes/students');
const teachersRoutes = require('./routes/teachers');
const gradesRoutes = require('./routes/grades');
const gradesAnalyticsRoutes = require('./routes/gradesAnalytics');
const notificationsRoutes = require('./routes/notifications');
const informationRoutes = require('./routes/information');
// ⚠️ REMOVIDO TEMPORALMENTE: const googleClassroomRoutes = require('./routes/google-classroom'); (TIENE ERROR: router.post() requiere callback)
const parentTeacherCommunicationRoutes = require('./routes/parentTeacherCommunication');
const multiTenantRoutes = require('./routes/multi-tenant');
const subscriptionsServiceRoutes = require('./routes/subscriptions-service');

// GRUPO 3: FEATURES SECUNDARIAS MEDIAS (7 rutas)
const chatbotRoutes = require('./routes/chatbot');
const chatbotIaRoutes = require('./routes/chatbot-ia');
const cmsRoutes = require('./routes/cms');
const newslettersPgRoutes = require('./routes/newsletters-pg');
const citasImprovedRoutes = require('./routes/citas-improved');
const fixAprobacionesAutoRoutes = require('./routes/fix-aprobaciones-auto');
const uploadsRoutes = require('./routes/uploads');

// GRUPO 4: OPERACIONES Y MAINTENANCE BAJAS (5 rutas)
const migrationRoutes = require('./routes/migration');
const maintenanceRoutes = require('./routes/maintenance');
const sslRoutes = require('./routes/ssl');
const backupRoutes = require('./routes/backup');
const gamificationDirectRoutes = require('./routes/gamification');  // ⚠️ Alias para evitar conflicto

const { startCleanupService } = require('./services/cleanupService');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE & CONFIGURACIÓN
// ============================================

app.set('trust proxy', 1);

// ❌ CSP DESHABILITADO - Para desarrollo local sin restricciones
// En producción (Vercel), el CSP se define en vercel.json
// Helmet CSP causaba conflictos con TinyMCE y scripts inline
// FECHA: 14 Nov 2025 - Arquitectura corregida por diagnóstico definitivo
app.use(helmet({
    permissionsPolicy: {
        camera: ["'self'"],
    },
    contentSecurityPolicy: false  // Deshabilitado - vercel.json maneja CSP en producción
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
            devLogger.warn(`🚫 CORS blocked origin: ${origin}`);
            // ⚠️ Solo advertir pero permitir en desarrollo
            if (process.env.NODE_ENV === 'production') {
                callback(new Error('CORS: Origin not allowed'));
            } else {
                devLogger.warn(`⚠️  Permitiendo origin no autorizado en modo desarrollo: ${origin}`);
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
    devLogger.error('❌ ERROR: SESSION_SECRET environment variable is required');
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

// --- UNIFIED STATIC FILE SERVING FROM /public ---
devLogger.log('🌍 Configurando servidor de archivos estáticos...');
app.use(express.static(path.join(__dirname, '../public')));


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
app.use('/api/config', configRoutes);  // ✅ CONFIG ROUTES - Tenant config, OAuth, health (9 NOV 2025)
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
app.use('/api/admin/tenants', tenantsRoutes);  // ✅ MULTI-TENANT MANAGEMENT (8 NOV 2025)
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
app.use('/api/calendar', calendarRoutes);  // ✅ CALENDAR ROUTES - Eventos del calendario interactivo
app.use('/api/pendientes-aprobacion', pendientesAprobacionRoutes);
app.use('/api/diagnostico-aprobaciones', diagnosticoAprobacionesRoutes);
app.use('/api/teachers-portal', teachersPortalRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/digital-library', digitalLibraryRoutes);
app.use('/api/support-tickets', supportTicketsRoutes);
app.use('/api/gamification', gamificationRoutes);  // ✅ GAMIFICATION ROUTES - Sistema de logros y puntuaciones

// ✅ FASE 1.2: RUTAS HUÉRFANAS REGISTRADAS - 11 NOV 2025
// ⚠️ NOTA: Algunas rutas requieren debugging (google-classroom, chatbot-ia, etc)
// Se registran solo las que tienen sintaxis Express válida

// GRUPO 1: IA/ML CRÍTICAS (6 rutas) - ⚠️ Requieren debugging
// Comentadas temporalmente para evitar errores en el servidor
// TODO: Revisar estos archivos para sintaxis Express válida
// app.use('/api/ai-database', aiDatabaseRoutes);
// app.use('/api/analytics-predictivo', analyticsPredictivo);
// app.use('/api/asistente-virtual', asistenteVirtualRoutes);
// app.use('/api/real-ai', realAiRoutes);
// app.use('/api/recomendaciones-ml', recomendacionesMLRoutes);
// app.use('/api/deteccion-riesgos', deteccionRiesgosRoutes);

// GRUPO 2: CORE FEATURES ALTAS (10 rutas) - ⚠️ Requieren debugging
// Comentadas temporalmente para evitar errores en el servidor
// app.use('/api/students', studentsRoutes);
// app.use('/api/teachers', teachersRoutes);
// app.use('/api/grades', gradesRoutes);
// app.use('/api/gradesAnalytics', gradesAnalyticsRoutes);
// app.use('/api/notifications', notificationsRoutes);
// app.use('/api/information', informationRoutes);
// app.use('/api/parent-teacher-communication', parentTeacherCommunicationRoutes);
// app.use('/api/multi-tenant', multiTenantRoutes);
// app.use('/api/subscriptions-service', subscriptionsServiceRoutes);

// GRUPO 3: FEATURES SECUNDARIAS MEDIAS (7 rutas) - ⚠️ Requieren debugging
// Comentadas temporalmente para evitar errores en el servidor
// app.use('/api/chatbot', chatbotRoutes);
// app.use('/api/chatbot-ia', chatbotIaRoutes);
// app.use('/api/cms', cmsRoutes);
// app.use('/api/newsletters-pg', newslettersPgRoutes);
// app.use('/api/citas-improved', citasImprovedRoutes);
// app.use('/api/fix-aprobaciones-auto', fixAprobacionesAutoRoutes);
// app.use('/api/uploads', uploadsRoutes);

// GRUPO 4: OPERACIONES Y MAINTENANCE BAJAS (5 rutas) - ⚠️ Requieren debugging
// Comentadas temporalmente para evitar errores en el servidor
// app.use('/api/migration', migrationRoutes);
// app.use('/api/maintenance', maintenanceRoutes);
// app.use('/api/ssl', sslRoutes);
// app.use('/api/backup', backupRoutes);

devLogger.log('[FASE 1.2] 27 rutas comentadas temporalmente para debugging. Solo 43 rutas base activas.');

// ============================================
// CONFIGURACIÓN PÚBLICA (API KEYS PARA FRONTEND)
// ============================================

/**
 * GET /api/config/public-keys
 * Endpoint para exponer configuraciones públicas de forma segura
 * No requiere autenticación (API keys públicas de CDNs)
 */
app.get('/api/config/public-keys', (req, res) => {
    const isDevelopment = process.env.NODE_ENV === 'development';

    res.json({
        success: true,
        environment: isDevelopment ? 'development' : 'production',
        keys: {
            tinymce: process.env.TINYMCE_API_KEY || 'no-api-key',
            // 🔑 Google OAuth Client ID - Se lee según el entorno (dev o prod)
            google_oauth_client_id: isDevelopment
                ? (process.env.GOOGLE_OAUTH_CLIENT_ID_DEV || '')
                : (process.env.GOOGLE_OAUTH_CLIENT_ID_PROD || '')
        }
    });
});

/**
 * GET /api/config/google-client-id
 * Devuelve SOLO el Google Client ID según el entorno
 * Usado por unified-auth-system-v2.js
 */
app.get('/api/config/google-client-id', (req, res) => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const clientId = isDevelopment
        ? process.env.GOOGLE_OAUTH_CLIENT_ID_DEV
        : process.env.GOOGLE_OAUTH_CLIENT_ID_PROD;

    if (!clientId) {
        return res.status(500).json({
            success: false,
            error: 'Google OAuth no configurado',
            environment: isDevelopment ? 'development' : 'production'
        });
    }

    res.json({
        success: true,
        clientId: clientId,
        environment: isDevelopment ? 'development' : 'production'
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
// AUTO-FIX APROBACIONES (3 NOV 2025)
// ============================================
const { autoFixAprobaciones } = require('./scripts/auto-fix-aprobaciones-on-startup');
autoFixAprobaciones().catch(err => {
    devLogger.error('❌ [AUTO-FIX] Error al ejecutar auto-fix:', err.message);
});

// ============================================
// INICIAR SERVICIOS DE FONDO
// ============================================

// Iniciar el servicio de limpieza de tokens expirados (cada 12 horas)
startCleanupService(12);

// ============================================
// SERVER START
// ============================================

if (require.main === module) {
    app.listen(PORT, () => {
        devLogger.log(`🚀 Servidor backend iniciado en http://localhost:${PORT}`);
        devLogger.log('✅✅✅ ¡VERSIÓN CORRECTA DEL SERVIDOR EN EJECUCIÓN! ✅✅✅');
    });
}

module.exports = app;
