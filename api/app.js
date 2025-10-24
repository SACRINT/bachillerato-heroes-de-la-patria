
require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { pool } = require('../backend/config/database');
const path = require('path');

// Importa todas las rutas del backend
const authRoutes = require('../backend/routes/auth');
const adminRoutes = require('../backend/routes/admin');
const contactRoutes = require('../backend/routes/contact');
const inscriptionsRoutes = require('../backend/routes/inscriptions');
const studentsAuthRoutes = require('../backend/routes/students-auth');
const subscriptionsRoutes = require('../backend/routes/subscriptions');
const newslettersPgRoutes = require('../backend/routes/newsletters-pg');
const citasRoutes = require('../backend/routes/citas');
const egresadosRoutes = require('../backend/routes/egresados');
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
const searchRoutes =require('../backend/routes/search');
const emailsRoutes = require('../backend/routes/emails');
const pollsRoutes = require('../backend/routes/polls');
const parentsRoutes = require('../backend/routes/parents');
const teachersPortalRoutes = require('../backend/routes/teachers-portal');
const messagingRoutes = require('../backend/routes/messaging');
const digitalLibraryRoutes = require('../backend/routes/digital-library');
const supportTicketsRoutes = require('../backend/routes/support-tickets');

// Importa middlewares
const { errorHandler } = require('../backend/middleware/errorHandler');
const { securityMiddleware } = require('../backend/middleware/security');

const app = express();

// --- Configuración de Middlewares (espejo de backend/server.js) ---

app.set('trust proxy', 1);
app.use(helmet()); 
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:3000'];
        if (!origin || origin === 'null' || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            if (process.env.NODE_ENV !== 'production') {
                callback(null, true);
            } else {
                callback(new Error('CORS: Origin not allowed'));
            }
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}));

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100, 
	standardHeaders: true,
	legacyHeaders: false, 
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (process.env.SESSION_SECRET) {
    app.use(session({
        store: new pgSession({
            pool: pool,
            tableName: 'user_sessions',
        }),
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000 
        }
    }));
}

app.use(securityMiddleware);

// --- Montaje de Rutas ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students-auth', studentsAuthRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/inscriptions', inscriptionsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/newsletters', newslettersPgRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/egresados', egresadosRoutes);
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
app.use('/api/teachers-portal', teachersPortalRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/digital-library', digitalLibraryRoutes);
app.use('/api/support-tickets', supportTicketsRoutes);

// --- Manejo de Errores ---
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint no encontrado en la API unificada.',
        path: req.originalUrl,
        method: req.method
    });
});

app.use(errorHandler);

// --- Exportar la app para Vercel ---
module.exports = app;