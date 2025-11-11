/**
 * 🔒 SERVIDOR HTTPS - BGE HÉROES DE LA PATRIA
 * Servidor HTTPS opcional para producción con certificados SSL
 */

const express = require('express');
const devLogger = require('../utils/devLogger');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Importar SSL Manager
const { getSSLManager } = require('./config/ssl');

// Importar rutas (reutilizar las mismas del servidor HTTP)
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const gamificationRoutes = require('./routes/gamification');
const chatbotRoutes = require('./routes/chatbot');
const studentsRoutes = require('./routes/students');
const teachersRoutes = require('./routes/teachers');
const informationRoutes = require('./routes/information');
const analyticsRoutes = require('./routes/analytics');
const backupRoutes = require('./routes/backup');
const sslRoutes = require('./routes/ssl');
const maintenanceRoutes = require('./routes/maintenance');
const notificationsRoutes = require('./routes/notifications');

// Importar middlewares
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');

const app = express();
const HTTPS_PORT = process.env.HTTPS_PORT || 443;
const HTTP_PORT = process.env.PORT || 3000;

// ============================================
// CONFIGURACIÓN SSL/HTTPS
// ============================================

const sslManager = getSSLManager();

// ============================================
// MIDDLEWARES DE SEGURIDAD HTTPS
// ============================================

// Headers de seguridad SSL mejorados
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com"
            ],
            scriptSrc: [
                "'self'",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com"
            ],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            connectSrc: ["'self'"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Aplicar headers de seguridad SSL adicionales
app.use(sslManager.securityHeadersMiddleware);

// CORS configurado para HTTPS
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
            'https://localhost:3000',
            'https://127.0.0.1:3000',
            'https://heroespatria.edu.mx',
            'https://www.heroespatria.edu.mx'
        ];

        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Rate limiting más estricto para HTTPS
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 150, // Más permisivo para HTTPS
    message: {
        error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
        retryAfter: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', limiter);

// Compresión
app.use(compression());

// Logging con identificación HTTPS
app.use(morgan('combined'));
app.use((req, res, next) => {
    req.isHTTPS = true;
    req.protocol = 'https';
    next();
});
app.use(requestLogger);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// RUTAS DE LA API (IGUALES QUE HTTP)
// ============================================

// Ruta de salud específica para HTTPS
app.get('/health', async (req, res) => {
    let dbStatus = 'disconnected';
    let dbInfo = {};

    if (req.app.locals.dbAvailable) {
        try {
            const db = require('./config/database');
            const isConnected = await db.testConnection();

            if (isConnected) {
                dbStatus = 'connected';
                dbInfo = db.getPoolStats();
            }
        } catch (error) {
            dbStatus = 'error';
            dbInfo = { error: error.message };
        }
    }

    res.json({
        status: 'OK',
        protocol: 'HTTPS',
        secure: true,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        uptime: process.uptime(),
        database: {
            status: dbStatus,
            info: dbInfo
        },
        ssl: {
            enabled: true,
            certificateInfo: sslManager.getCertificateInfo()
        }
    });
});

// Rutas principales (reutilizar de servidor HTTP)
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/information', informationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/ssl', sslRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/notifications', notificationsRoutes);

// Documentación de API también disponible en HTTPS
if (process.env.NODE_ENV !== 'production') {
    const swaggerUi = require('swagger-ui-express');
    const swaggerSpec = require('./config/swagger');

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css'
    }));
}

// Ruta 404 para API
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint no encontrado',
        path: req.path,
        method: req.method,
        protocol: 'HTTPS',
        timestamp: new Date().toISOString()
    });
});

// Servir archivos estáticos con headers de seguridad
if (process.env.NODE_ENV === 'development') {
    app.use(express.static('../', {
        setHeaders: (res, path, stat) => {
            // Headers adicionales de seguridad para archivos estáticos
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
        }
    }));

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../index.html'));
    });
}

// ============================================
// MANEJO DE ERRORES
// ============================================
app.use(errorHandler);

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    devLogger.error('💥 [HTTPS] Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    devLogger.error('💥 [HTTPS] Unhandled Rejection:', error);
    process.exit(1);
});

// ============================================
// INICIO DEL SERVIDOR HTTPS
// ============================================

async function startHTTPSServer() {
    try {
        // Verificar disponibilidad de SSL
        const sslOptions = sslManager.getSSLOptions();

        if (!sslOptions) {
            devLogger.log('❌ [HTTPS] No se pudieron cargar certificados SSL');
            devLogger.log('💡 [HTTPS] Ejecute: node generate-certs.js para generar certificados');
            process.exit(1);
        }

        // Crear servidor HTTPS
        const httpsServer = sslManager.createHTTPSServer(app, HTTPS_PORT);

        if (!httpsServer) {
            devLogger.log('❌ [HTTPS] No se pudo crear servidor HTTPS');
            process.exit(1);
        }

        httpsServer.listen(HTTPS_PORT, async () => {
            devLogger.log('🔒 ═══════════════════════════════════════════════════════════');
            devLogger.log('🔒 SERVIDOR HTTPS BGE HÉROES DE LA PATRIA');
            devLogger.log('🔒 ═══════════════════════════════════════════════════════════');
            devLogger.log(`🔒 Puerto HTTPS: ${HTTPS_PORT}`);
            devLogger.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            devLogger.log(`📡 API Base URL: https://localhost:${HTTPS_PORT}/api`);
            devLogger.log(`❤️  Health Check: https://localhost:${HTTPS_PORT}/health`);
            devLogger.log(`📚 API Docs: https://localhost:${HTTPS_PORT}/api-docs`);
            devLogger.log('🔒 ═══════════════════════════════════════════════════════════');

            // Inicializar servicios adicionales
            try {
                const { getBackupService } = require('./services/backupService');
                getBackupService();
                devLogger.log('💾 [HTTPS] Sistema de backup inicializado');
            } catch (error) {
                devLogger.log('⚠️  [HTTPS] Sistema de backup no disponible:', error.message);
            }

            try {
                const { getAdvancedLogger } = require('./services/advancedLogger');
                getAdvancedLogger();
                devLogger.log('📝 [HTTPS] Sistema de logs avanzado inicializado');
            } catch (error) {
                devLogger.log('⚠️  [HTTPS] Sistema de logs no disponible:', error.message);
            }

            try {
                const { getPushNotificationService } = require('./services/pushNotificationService');
                getPushNotificationService();
                devLogger.log('📱 [HTTPS] Sistema de notificaciones push inicializado');
            } catch (error) {
                devLogger.log('⚠️  [HTTPS] Sistema de notificaciones no disponible:', error.message);
            }

            // Test de conexión a base de datos
            try {
                const db = require('./config/database');
                const isConnected = await db.testConnection();

                if (isConnected) {
                    devLogger.log('✅ [HTTPS] Base de datos conectada');
                    app.locals.dbAvailable = true;
                } else {
                    devLogger.log('⚠️  [HTTPS] MySQL no disponible - Funcionando en modo degradado');
                    app.locals.dbAvailable = false;
                }
            } catch (error) {
                devLogger.log('⚠️  [HTTPS] MySQL no disponible - Funcionando en modo degradado');
                devLogger.log('🔧 [HTTPS] Error:', error.message);
                app.locals.dbAvailable = false;
            }

            // Información del certificado
            const certInfo = sslManager.getCertificateInfo();
            if (!certInfo.error) {
                devLogger.log('📜 [HTTPS] Certificado SSL cargado:');
                devLogger.log(`    Subject: ${certInfo.subject}`);
                devLogger.log(`    Válido hasta: ${certInfo.validTo}`);
                devLogger.log(`    Días restantes: ${certInfo.daysUntilExpiration}`);
                if (certInfo.selfSigned) {
                    devLogger.log('    ⚠️  Certificado auto-firmado (solo para desarrollo)');
                }
            }

            devLogger.log('🔒 ═══════════════════════════════════════════════════════════');
            devLogger.log('✅ [HTTPS] Servidor HTTPS completamente funcional');
            devLogger.log('🔒 ═══════════════════════════════════════════════════════════');
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            devLogger.log('🛑 [HTTPS] SIGTERM recibido, cerrando servidor...');
            httpsServer.close(() => {
                devLogger.log('✅ [HTTPS] Servidor HTTPS cerrado correctamente');
                process.exit(0);
            });
        });

        return httpsServer;

    } catch (error) {
        devLogger.error('❌ [HTTPS] Error iniciando servidor HTTPS:', error);
        process.exit(1);
    }
}

// ============================================
// SERVIDOR HTTP DE REDIRECCIÓN (OPCIONAL)
// ============================================

function startRedirectServer() {
    const redirectApp = express();

    // Middleware de redirección HTTP a HTTPS
    redirectApp.use('*', (req, res) => {
        const httpsUrl = `https://${req.get('host').replace(/:\d+$/, `:${HTTPS_PORT}`)}${req.originalUrl}`;
        devLogger.log(`🔄 [REDIRECT] ${req.originalUrl} -> ${httpsUrl}`);
        res.redirect(301, httpsUrl);
    });

    const redirectServer = redirectApp.listen(HTTP_PORT, () => {
        devLogger.log(`🔄 [REDIRECT] Servidor de redirección HTTP -> HTTPS en puerto ${HTTP_PORT}`);
    });

    return redirectServer;
}

// ============================================
// INICIO
// ============================================

if (require.main === module) {
    devLogger.log('🚀 [HTTPS] Iniciando servidor HTTPS BGE...');

    // Verificar argumentos de línea de comandos
    const args = process.argv.slice(2);
    const withRedirect = args.includes('--redirect');

    startHTTPSServer().then(httpsServer => {
        if (withRedirect && HTTP_PORT !== HTTPS_PORT) {
            devLogger.log('🔄 [HTTPS] Iniciando servidor de redirección HTTP...');
            startRedirectServer();
        }
    });
}

module.exports = {
    app,
    startHTTPSServer,
    startRedirectServer
};