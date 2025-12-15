/**
 * 🛡️ SERVIDOR BACKEND SEGURO
 * Bachillerato General Estatal "Héroes de la Patria"
 */

// 🔴 CORRECCIÓN: Cargar .env desde el directorio raíz del proyecto
const path = require('path');
const devLogger = require('./utils/devLogger');

// ORDEN CRÍTICA DE CARGA:
// Solo cargar .env si NO estamos en producción (Vercel inyecta variables automáticamente)
if (process.env.NODE_ENV !== 'production') {
    try {
        // 1. Cargar .env.local PRIMERO (contiene secretos reales, NO versionado)
        require('dotenv').config({ path: path.resolve(__dirname, '../.env.local'), override: false });

        // 2. Cargar .env SEGUNDO como fallback (publicable, neutralizado de secretos)
        require('dotenv').config({ path: path.resolve(__dirname, '../.env'), override: false });
    } catch (e) {
        console.warn('[SERVER] Advertencia: No se pudieron cargar archivos .env locales (esperado en producción)');
    }
}

const express = require('express');
const http = require('http');  // ✅ HTTP Server para Socket.IO
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
const { tenantContext } = require('./middleware/tenant-context');  // ✅ MULTI-TENANCY MIDDLEWARE (17 NOV 2025)

// Helper to load routes handling both CommonJS and ES Module default exports
const loadRoute = (path) => {
    const route = require(path);
    return route.default || route;
};

// Routes
const authRoutes = loadRoute('./routes/auth');
const adminRoutes = loadRoute('./routes/admin');
const configRoutes = loadRoute('./routes/config');  // ✅ CONFIG ROUTES - Multi-tenant configuration (9 NOV 2025)
const dashboardRoutes = loadRoute('./routes/dashboard');
const contactRoutes = loadRoute('./routes/contact');
const inscriptionsRoutes = loadRoute('./routes/inscriptions');
const studentsAuthRoutes = loadRoute('./routes/students-auth');
const subscriptionsRoutes = loadRoute('./routes/subscriptions');
const newslettersRoutes = loadRoute('./routes/newsletters');
const egresadosRoutes = loadRoute('./routes/egresados');
const analyticsDashboardRoutes = loadRoute('./routes/analytics');
const reportsRoutes = loadRoute('./routes/reports');  // ✅ REPORTS - FASE 2
const bolsaTrabajoRoutes = loadRoute('./routes/bolsa-trabajo');
const suscriptoresRoutes = loadRoute('./routes/suscriptores');
const quejasRoutes = loadRoute('./routes/quejas');
const notificacionesRoutes = loadRoute('./routes/notificaciones');
const notificationsRealtimeRoutes = loadRoute('./routes/notifications-realtime');  // ✅ SOCKET.IO NOTIFICATIONS - SEMANA 5
const solicitudesRoutes = loadRoute('./routes/solicitudes');
const passwordRecoveryRoutes = loadRoute('./routes/password-recovery');
const approvalsRoutes = loadRoute('./routes/approvals');
const noticiasRoutes = loadRoute('./routes/noticias');
const eventosRoutes = loadRoute('./routes/eventos');
const avisosRoutes = loadRoute('./routes/avisos');
const tenantsRoutes = loadRoute('./routes/tenants');  // ✅ MULTI-TENANT MANAGEMENT (8 NOV 2025)
const comunicadosRoutes = loadRoute('./routes/comunicados');

const webhooksRoutes = loadRoute('./routes/webhooks');  // ✅ WEBHOOKS - SEMANA 8
const superAdminDashboardRoutes = loadRoute('./routes/super-admin-dashboard');  // ✅ SUPER ADMIN - FASE 5 (7 DIC 2025)
const stripeWebhooksRoutes = loadRoute('./routes/stripe-webhooks');  // ✅ STRIPE WEBHOOKS - FASE 5.2 (7 DIC 2025)
const arExperiencesRoutes = loadRoute('./routes/ar-experiences');  // ✅ AR EXPERIENCES - FASE 5.3 (7 DIC 2025)
const pollsRoutes = loadRoute('./routes/polls');
// ✅ API VERSIONING MIDDLEWARE - SEMANA 8
const { apiVersioning, v1CompatibilityLayer, rateLimitByTier } = require('./middleware/api-versioning');
const attendanceRoutes = loadRoute('./routes/attendance');
const settingsRoutes = loadRoute('./routes/settings');
const healthRoutes = loadRoute('./routes/health');
const testEventsRoutes = loadRoute('./routes/test-events');  // ✅ TESTING ROUTES - Event Bus testing (FASE 2)
const chartsDataRoutes = loadRoute('./routes/charts-data');
const searchRoutes = loadRoute('./routes/search');
const emailsRoutes = loadRoute('./routes/emails');
const apiDocsRoutes = loadRoute('./routes/api-docs'); // ✅ SWAGGER UI - SEMANA 29
const aiTutorRoutes = loadRoute('./routes/ai-tutor'); // ✅ AI TUTOR SERVICE - SEMANAS 27-28
const installPollsRoutes = loadRoute('./routes/install-polls');
const teachersPortalRoutes = loadRoute('./routes/teachers-portal');
const messagingRoutes = loadRoute('./routes/messaging');
const digitalLibraryRoutes = loadRoute('./routes/digital-library');
const supportTicketsRoutes = loadRoute('./routes/support-tickets');
const installParentsRoutes = loadRoute('./routes/install-parents');
const parentsRoutes = loadRoute('./routes/parents');
const financesRoutes = loadRoute('./routes/finances');
const citasRoutes = loadRoute('./routes/citas');
const calendarRoutes = loadRoute('./routes/calendar');  // ✅ CALENDAR ROUTES - Eventos del calendario interactivo
const pendientesAprobacionRoutes = loadRoute('./routes/pendientes-aprobacion');
const diagnosticoAprobacionesRoutes = loadRoute('./routes/diagnostico-aprobaciones');
const gamificationRoutes = loadRoute('./routes/gamification');  // ✅ GAMIFICATION ROUTES - Sistema de logros y puntuaciones
const triviaGameRoutes = loadRoute('./routes/trivia-game');  // ✅ EDUCATIONAL GAMES - Trivia (7 DIC 2025)
const conceptBuilderRoutes = loadRoute('./routes/concept-builder');  // ✅ EDUCATIONAL GAMES - Mapas conceptuales (7 DIC 2025)

// ✅ SEMANA 2 - SERVICE LAYER ROUTES (20 NOV 2025)
const studentsServiceRoutes = loadRoute('./routes/students-service');  // Estudiantes con Service Layer
const gradesServiceRoutes = loadRoute('./routes/grades');  // Calificaciones con Service Layer

// ✅ FASE 30.5 TAREA 4 - POOL MANAGER (24 NOV 2025)
const poolManager = require('./middleware/pool-manager');  // Connection Pool monitoring

// ✅ FASE 30.5 TAREA 5 - REDIS CACHE (24 NOV 2025)
// const redisCache = require('./middleware/redis-cache');  // ⏸️ COMENTADO - Redis no disponible localmente (FASE 30.5)

// ✅ FASE 30.5 TAREA 3 - CIRCUIT BREAKER (26-27 NOV 2025)
// Patrón de tolerancia a fallos: rechaza requests cuando sistema está degradado
// Previene cascading failures cuando database es lento o memoria está saturada
const { CircuitBreaker, createCircuitBreakerMiddleware } = require('./middleware/circuit-breaker');

// ✅ FASE 1.2: 28 RUTAS HUÉRFANAS - Registradas 11 NOV 2025
// GRUPO 1: IA/ML CRÍTICAS (6 rutas)
const aiDatabaseRoutes = loadRoute('./routes/ai-database');
const analyticsPredictivo = loadRoute('./routes/analytics-predictivo');
const asistenteVirtualRoutes = loadRoute('./routes/asistente-virtual');
const realAiRoutes = loadRoute('./routes/real-ai');
const recomendacionesMLRoutes = loadRoute('./routes/recomendaciones-ml');
const deteccionRiesgosRoutes = loadRoute('./routes/deteccion-riesgos');

// GRUPO 2: CORE FEATURES ALTAS (10 rutas)
const studentsRoutes = loadRoute('./routes/students');
const teachersRoutes = loadRoute('./routes/teachers');
const gradesRoutes = loadRoute('./routes/grades');
const gradesAnalyticsRoutes = loadRoute('./routes/gradesAnalytics');
const notificationsRoutes = loadRoute('./routes/notifications');
const informationRoutes = loadRoute('./routes/information');
// ⚠️ REMOVIDO TEMPORALMENTE: const googleClassroomRoutes = loadRoute('./routes/google-classroom'); (TIENE ERROR: router.post() requiere callback)
const parentTeacherCommunicationRoutes = loadRoute('./routes/parentTeacherCommunication');
const multiTenantRoutes = loadRoute('./routes/multi-tenant');
const subscriptionsServiceRoutes = loadRoute('./routes/subscriptions-service');

// GRUPO 3: FEATURES SECUNDARIAS MEDIAS (7 rutas)
const chatbotRoutes = loadRoute('./routes/chatbot');
const chatbotIaRoutes = loadRoute('./routes/chatbot-ia');
const cmsRoutes = loadRoute('./routes/cms');
const newslettersPgRoutes = loadRoute('./routes/newsletters-pg');
const citasImprovedRoutes = loadRoute('./routes/citas-improved');
const fixAprobacionesAutoRoutes = loadRoute('./routes/fix-aprobaciones-auto');
const uploadsRoutes = loadRoute('./routes/uploads');

// GRUPO 4: OPERACIONES Y MAINTENANCE BAJAS (5 rutas)
// ⚠️ COMENTADO: migration.js requiere mysql2 (no instalado)
// const migrationRoutes = loadRoute('./routes/migration');
const maintenanceRoutes = loadRoute('./routes/maintenance');
const sslRoutes = loadRoute('./routes/ssl');
const backupRoutes = loadRoute('./routes/backup');
const gamificationDirectRoutes = loadRoute('./routes/gamification');  // ⚠️ Alias para evitar conflicto

// GRUPO 5: SISTEMA DE GAMIFICACIÓN IACOINS (4 rutas) - 15 NOV 2025
const walletRoutes = loadRoute('./routes/wallet');  // 💰 Wallet management (5 endpoints)
const iacoinsRoutes = loadRoute('./routes/iacoins');  // 🪙 IACoins Dashboard (8 endpoints) - 14 DIC 2025
const challengesRoutes = loadRoute('./routes/challenges');  // 🏆 Challenges system (4 endpoints)
const storeRoutes = loadRoute('./routes/store');  // 🛒 Virtual store (5 endpoints)

const { startCleanupService } = require('./services/cleanupService');
const SocketService = require('./services/socket-service');  // ✅ SOCKET.IO SERVICE - SEMANA 5 (17 NOV 2025)
const schedulerService = require('./services/schedulerService'); // Tareas programadas (GDPR)
const dataRetentionService = require('./services/dataRetentionService'); // Lógica de retención de datos (GDPR)

// ✨ NUEVA ARQUITECTURA - Event-Driven Services (SEMANAS 1-12 REFACTORIZACIÓN)
const eventBusService = require('./services/eventBus.service');
const NotificationSubscriber = require('./subscribers/notification-subscriber');
const AnalyticsSubscriber = require('./subscribers/analytics-subscriber');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE & CONFIGURACIÓN
// ============================================

app.set('trust proxy', 1);

// ✅ SECURITY MIDDLEWARE PRIMERO - ANTES DE HELMET (16 NOV 2025)
// Registrar seguridad ANTES de helmet para asegurar que los headers CSP no sean overridden
app.use(securityMiddleware);

// ✅ CSP CONDICIONAL - Solo en desarrollo local
// En producción Vercel, el CSP se define en vercel.json para evitar sobrescritura
// FECHA: 18 Nov 2025 - Fix definitivo Google OAuth CSP
// FIX: Vercel automáticamente setea NODE_ENV=production en deployments
const isProduction = process.env.NODE_ENV === 'production';
console.log(`🔍 [SERVER] Detección de entorno: NODE_ENV=${process.env.NODE_ENV}, isProduction=${isProduction}`);
const helmetConfig = {
    permissionsPolicy: {
        camera: ["'self'"],
    }
};

// Solo aplicar CSP en desarrollo local, NO en Vercel
if (!isProduction) {
    helmetConfig.contentSecurityPolicy = {
        directives: {
            ...cspConfig.directives,
            styleSrcElem: cspConfig.directives.styleSrcElem || cspConfig.directives.styleSrc,
            scriptSrcElem: cspConfig.directives.scriptSrcElem || cspConfig.directives.scriptSrc
        },
        reportOnly: cspConfig.reportOnly
    };
} else {
    // En producción (Vercel), desactivar CSP de helmet
    // El CSP viene de vercel.json (línea 41)
    helmetConfig.contentSecurityPolicy = false;
}

app.use(helmet(helmetConfig));

// CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.CORS_ORIGIN ?
            process.env.CORS_ORIGIN.split(',') :
            [
                'http://localhost:8080',
                'http://127.0.0.1:8080',
                'http://localhost:3000',
                'https://bge-heroesdelapatria.vercel.app', // 🌍 PRODUCCIÓN
                'https://bge-heroesdelapatria.vercel.app/' // Variación con slash
            ];

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

// ✅ CIRCUIT BREAKER MIDDLEWARE (FASE 30.5 TAREA 3)
// Patrón de tolerancia a fallos: rechaza requests cuando memoria está saturada o database es lento
// Evita cascading failures y permite al sistema recuperarse
const circuitBreakerConfig = createCircuitBreakerMiddleware({
    failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD) || 50,  // % de fallos
    successThreshold: parseInt(process.env.CIRCUIT_BREAKER_SUCCESS_THRESHOLD) || 5,   // Intentos éxito en HALF_OPEN
    timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT) || 30000  // 30 segundos en OPEN
});

// Aplicar circuit breaker solo a API routes críticas
app.use('/api/', circuitBreakerConfig.middleware);

// Endpoint para métricas del circuit breaker (debugging y monitoring)
app.get('/api/circuit-breaker/metrics', circuitBreakerConfig.metricsEndpoint);

// Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session Configuration - SESSION_SECRET con fallback para Vercel
let SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
    devLogger.warn('⚠️ WARNING: SESSION_SECRET no configurada. Usando fallback temporal para Vercel.');
    // Generar fallback seguro para development/Vercel
    SESSION_SECRET = process.env.JWT_SECRET ||
                     'fallback-session-secret-' + Date.now() + '-change-in-production';
}

// Configurar store de sesiones con PostgreSQL
const sessionMiddleware = session({
    store: new pgSession({
        pool: pool,
        tableName: 'user_sessions',
        pruneSessionInterval: 60 * 15,
        createTableIfMissing: false
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000
    }
});

// ✅ FIX 500 ERROR: Excluir session middleware de rutas de health y config pública
// Si la BD falla, pgSession revienta. Estas rutas deben funcionar SIN BD.
app.use((req, res, next) => {
    if (req.path === '/health' ||
        req.path.startsWith('/api/health') ||
        req.path.startsWith('/api/config')) {
        return next();
    }
    return sessionMiddleware(req, res, next);
});

// --- UNIFIED STATIC FILE SERVING FROM /public ---
if (process.env.NODE_ENV !== 'production') {
    devLogger.log('🌍 Configurando servidor de archivos estáticos (Dev Mode)...');
    // OBFUSCATION: Break static analysis for public folder
    const p = 'pub' + 'lic';
    app.use(express.static(path.join(__dirname, '..', p)));
}

// ============================================
// 🏢 MULTI-TENANCY MIDDLEWARE (17 NOV 2025)
// ============================================
// IMPORTANTE: Registrar ANTES de todas las rutas API
// Detecta tenant desde: subdomain, header X-Tenant-ID, JWT, query param
// Agrega req.tenant con configuración del tenant
devLogger.log('🏢 Configurando multi-tenancy middleware...');
app.use(tenantContext);

// ============================================
// 🔀 API VERSIONING MIDDLEWARE (17 NOV 2025 - SEMANA 8)
// ============================================
// IMPORTANTE: Aplicar ANTES de todas las rutas API
// Detecta versión desde: header Accept-Version, URL path (/api/v1/, /api/v2/), query param
// Aplica backward compatibility v1 → v2
// Rate limiting por tier (starter, pro, enterprise)
devLogger.log('🔀 Configurando API versioning middleware...');
app.use('/api', apiVersioning);           // Detección de versión
app.use('/api', v1CompatibilityLayer);    // Compatibilidad v1 → v2
app.use('/api', rateLimitByTier);         // Rate limiting por plan del tenant

// ============================================
// 🔌 CONNECTION POOL MANAGER (FASE 30.5 TAREA 4)
// ============================================
// Monitorear utilización de pool en tiempo real
devLogger.log('🔌 Configurando Connection Pool Manager...');
app.use('/api', poolManager.middleware);  // Registrar métricas de pool

// ============================================
// 🔴 REDIS CACHE MIDDLEWARE (FASE 30.5 TAREA 5)
// ============================================
// Cache de respuestas para reducir carga de BD
devLogger.log('🔴 Configurando Redis Cache...');
// app.use('/api', redisCache.middleware);  // ⏸️ COMENTADO: redisCache.middleware undefined (Redis no disponible)
// Usando cacheService.js (en memoria) como fallback - ya inicializado arriba

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
app.use('/api/reports', reportsRoutes);  // ✅ REPORTS - SEMANA 7
app.use('/api/bolsa-trabajo', bolsaTrabajoRoutes);
app.use('/api/suscriptores', suscriptoresRoutes);
app.use('/api/quejas', quejasRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/notifications-realtime', notificationsRealtimeRoutes);  // ✅ SOCKET.IO REALTIME NOTIFICATIONS - SEMANA 5
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/password-recovery', passwordRecoveryRoutes);
app.use('/api/approvals', approvalsRoutes);
app.use('/api/noticias', noticiasRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/avisos', avisosRoutes);
app.use('/api/admin/tenants', tenantsRoutes);  // ✅ MULTI-TENANT MANAGEMENT (8 NOV 2025)
app.use('/api/comunicados', comunicadosRoutes);
app.use('/api/upload', uploadsRoutes);
app.use('/api/health', healthRoutes);
app.use('/health', healthRoutes); // ✅ ALIAS: Soporte para frontend legacy que llama a /health raíz
// ⏸️ app.use('/api/attendance', attendanceRoutes); // ✅ ATTENDANCE ROUTES - COMENTADO: archivo no existe
// ⏸️ app.use('/api/settings', settingsRoutes); // ✅ SETTINGS ROUTES - COMENTADO: archivo no existe

// ✅ FASE 30.5 TAREA 5 - REDIS CACHE STATS ENDPOINTS
// app.get('/api/health/cache/stats', redisCache.getStatsEndpoint);  // ⏸️ COMENTADO - Redis no disponible localmente (FASE 30.5)

app.use('/api/test-events', testEventsRoutes);  // ✅ TESTING - Event Bus testing endpoints (FASE 2)
app.use('/api/charts', chartsDataRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/emails', emailsRoutes);
app.use('/api/webhooks', webhooksRoutes);  // ✅ WEBHOOKS - SEMANA 8 (17 NOV 2025)
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
app.use('/api/wallet', walletRoutes);  // ✅ WALLET ROUTES - Gestión de IACoins (15 NOV 2025)
app.use('/api/iacoins', iacoinsRoutes);  // ✅ IACOINS ROUTES - IACoins Dashboard (14 DIC 2025)
app.use('/api/challenges', challengesRoutes);  // ✅ CHALLENGES ROUTES - Sistema de retos (15 NOV 2025)
app.use('/api/store', storeRoutes);  // ✅ STORE ROUTES - Tienda virtual (15 NOV 2025)
app.use('/api/docs', apiDocsRoutes); // ✅ SWAGGER UI - SEMANA 29
app.use('/api/tutor', aiTutorRoutes); // ✅ AI TUTOR SERVICE - SEMANAS 27-28
app.use('/api/super-admin', superAdminDashboardRoutes); // ✅ SUPER ADMIN DASHBOARD - FASE 5 (7 DIC 2025)
app.use('/api/stripe-webhooks', stripeWebhooksRoutes); // ✅ STRIPE WEBHOOKS - FASE 5.2 (7 DIC 2025)
app.use('/api/ar', arExperiencesRoutes); // ✅ AR EXPERIENCES - FASE 5.3 (7 DIC 2025)
app.use('/api/games/trivia', triviaGameRoutes); // ✅ EDUCATIONAL GAMES - Trivia (7 DIC 2025)
app.use('/api/games/concepts', conceptBuilderRoutes); // ✅ EDUCATIONAL GAMES - Mapas conceptuales (7 DIC 2025)

// ✅ SEMANA 2 - SERVICE LAYER ROUTES (20 NOV 2025)
// Estas rutas usan el patrón Service Layer para separar lógica de negocio
app.use('/api/students-v2', studentsServiceRoutes);  // Estudiantes con Service Layer
app.use('/api/grades', gradesServiceRoutes);  // Calificaciones con GradesService

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

// GRUPO 2: CORE FEATURES ALTAS (8 rutas activas + 1 comentada) - ✅ DESCOMENTADAS PARA FASE 3
// Rutas críticas para funcionalidad básica del sistema
app.use('/api/students', studentsRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/api/gradesAnalytics', gradesAnalyticsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/information', informationRoutes);
app.use('/api/parent-teacher-communication', parentTeacherCommunicationRoutes);
app.use('/api/multi-tenant', multiTenantRoutes);
// app.use('/api/subscriptions-service', subscriptionsServiceRoutes); // ⚠️ Comentada: exporta Object en vez de Router

// GRUPO 3: FEATURES SECUNDARIAS (7 rutas) - ✅ DESCOMENTADAS PARA FASE 3.2
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/chatbot-ia', chatbotIaRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/newsletters-pg', newslettersPgRoutes);
app.use('/api/citas-improved', citasImprovedRoutes);
app.use('/api/fix-aprobaciones-auto', fixAprobacionesAutoRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/reports', reportsRoutes); // ✅ REPORTS - FASE 2

// GRUPO 4: OPERACIONES Y MAINTENANCE (3 rutas activas, 1 comentada) - ✅ DESCOMENTADAS PARA FASE 3.2
// app.use('/api/migration', migrationRoutes); // ⚠️ Requiere mysql2 (no instalado)
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/ssl', sslRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/polls', pollsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/settings', settingsRoutes);

devLogger.log('[FASE 3.2] 18 rutas adicionales descomentadas (GRUPO 3 + GRUPO 4). Migration comentada (requiere mysql2). 61 rutas activas.');

// ============================================
// CONFIGURACIÓN PÚBLICA (API KEYS PARA FRONTEND)
// ============================================
// ✅ NOTA: Las rutas de configuración (/api/config/*) están registradas en
//    app.use('/api/config', configRoutes) línea 393 desde config.js
// ============================================

// ============================================
// FALLBACK & ERROR HANDLING
// ============================================

// SPA Fallback: Sirve index.html para rutas de navegación, ignorando archivos con extensiones.
// SPA Fallback: Sirve index.html para rutas de navegación.
// En producción (Vercel), esto es manejado por vercel.json rewrites, 
// así evitamos que NFT empaquete toda la carpeta 'public' (260MB+).
// SPA Fallback: Sirve index.html para rutas de navegación.
// En producción (Vercel), esto es manejado por vercel.json rewrites, 
// así evitamos que NFT empaquete toda la carpeta 'public' (260MB+).
app.get(/^(?!\/api|.*\.\w+$).*$/, (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        // En Vercel, este endpoint no debería ser alcanzado si vercel.json está bien configurado.
        res.status(404).json({ error: 'SPA route not handled by backend in production' });
    } else {
        // En desarrollo local, servimos el archivo normalmente
        // OBFUSCATION: "pub"+"lic" to avoid static analysis wrapping the folder
        const p = 'pub' + 'lic';
        const i = 'ind' + 'ex.html';
        const publicPath = path.resolve(__dirname, '..', p, i);
        res.sendFile(publicPath);
    }
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
// INICIAR SERVICIOS DE FONDO (SOLO EN DEVELOPMENT, NO EN VERCEL)
// ============================================
const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;

if (!isServerless) {
    // Iniciar el servicio de limpieza de tokens expirados (cada 12 horas)
    startCleanupService(12);

    // ============================================
    // TAREAS PROGRAMADAS (CRON JOBS) - SEMANA 27 GDPR
    // ============================================
    devLogger.log('[Scheduler] Configurando tarea de limpieza de logs (GDPR)...');
    schedulerService.schedule(
        'cleanup-system-logs',
        '0 3 * * *', // Se ejecuta todos los días a las 3:00 AM
        async () => {
            devLogger.log('[Scheduler] Iniciando tarea programada: Limpieza de Logs del Sistema.');
            await dataRetentionService.cleanupSystemLogs();
        }
    );

    // Iniciar el servicio principal del programador de tareas
    schedulerService.start();
} else {
    devLogger.warn('[SERVER] ⚠️ Entorno Serverless detectado (Vercel). Skipping background services.');
}

// ✨ NUEVA ARQUITECTURA - Inicializar Event Bus (SEMANAS 1-12 REFACTORIZACIÓN)
devLogger.log('[SERVER] 🚀 Inicializando Event Bus y subscribers...');

// Inicializar Event Bus
const eventBus = eventBusService.getInstance();
devLogger.log('[SERVER] ✅ Event Bus inicializado');

// Registrar Notification Subscriber
const notifSubscriber = new NotificationSubscriber(eventBus);
// ✅ subscribeToEvents() ya se llama en constructor - no duplicar
devLogger.log('[SERVER] ✅ Notification Subscriber registrado (40+ event handlers)');

// Registrar Analytics Subscriber
const analyticsSubscriberInstance = new AnalyticsSubscriber(eventBus);
// ✅ subscribeToEvents() ya se llama en constructor - no duplicar
devLogger.log('[SERVER] ✅ Analytics Subscriber registrado (40+ event handlers)');

// Hacer eventBus disponible globalmente para las rutas
app.eventBus = eventBus;

// ============================================
// SERVER START CON SOCKET.IO
// ============================================

// Crear HTTP Server para Socket.IO
const httpServer = http.createServer(app);

// Inicializar Socket.IO Service
let socketService = null;
try {
    socketService = new SocketService(httpServer);
    devLogger.log('[SOCKET.IO] ✅ Servicio de notificaciones en tiempo real inicializado');

    // Hacer socketService disponible para las rutas
    app.socketService = socketService;
} catch (error) {
    devLogger.error('[SOCKET.IO] ❌ Error al inicializar:', error.message);
    // Continuar sin Socket.IO si falla
}

if (require.main === module) {
    const server = httpServer.listen(PORT, () => {
        devLogger.log(`🚀 Servidor backend iniciado en http://localhost:${PORT}`);
        devLogger.log('✅✅✅ ¡VERSIÓN CORRECTA DEL SERVIDOR EN EJECUCIÓN! ✅✅✅');

        if (socketService) {
            devLogger.log(`📡 Socket.IO escuchando en http://localhost:${PORT}`);
        }
    });

    server.on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
            devLogger.error(`❌ Puerto ${PORT} ocupado. Intentando cerrar proceso anterior...`);
            process.exit(1); // Salir para que nodemon reinicie o el usuario cierre el proceso
        }
    });
}

module.exports = app;