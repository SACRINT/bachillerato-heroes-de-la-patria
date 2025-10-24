require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { authenticateToken, requireAdmin } = require('../backend/middleware/auth');
const { errorHandler } = require('../backend/middleware/errorHandler');

// Import Routers
const adminRoutes = require('../backend/routes/admin');
const analyticsRoutes = require('../backend/routes/analytics');
const approvalsRoutes = require('../backend/routes/approvals');
const authRoutes = require('../backend/routes/auth');
const avisosRoutes = require('../backend/routes/avisos');
const bolsaTrabajoRoutes = require('../backend/routes/bolsa-trabajo');
const chartsDataRoutes = require('../backend/routes/charts-data');
const citasRoutes = require('../backend/routes/citas');
const comunicadosRoutes = require('../backend/routes/comunicados');
const contactRoutes = require('../backend/routes/contact');
const digitalLibraryRoutes = require('../backend/routes/digital-library');
const egresadosRoutes = require('../backend/routes/egresados');
const emailsRoutes = require('../backend/routes/emails');
const eventosRoutes = require('../backend/routes/eventos');
const healthRoutes = require('../backend/routes/health');
const inscriptionsRoutes = require('../backend/routes/inscriptions');
const messagingRoutes = require('../backend/routes/messaging');
const newslettersPgRoutes = require('../backend/routes/newsletters-pg');
const noticiasRoutes = require('../backend/routes/noticias');
const notificacionesRoutes = require('../backend/routes/notificaciones');
const parentsRoutes = require('../backend/routes/parents');
const passwordRecoveryRoutes = require('../backend/routes/password-recovery');
const pollsRoutes = require('../backend/routes/polls');
const quejasRoutes = require('../backend/routes/quejas');
const searchRoutes = require('../backend/routes/search');
const solicitudesRoutes = require('../backend/routes/solicitudes');
const studentsAuthRoutes = require('../backend/routes/students-auth');
const subscriptionsRoutes = require('../backend/routes/subscriptions');
const suscriptoresRoutes = require('../backend/routes/suscriptores');
const supportTicketsRoutes = require('../backend/routes/support-tickets');
const teachersPortalRoutes = require('../backend/routes/teachers-portal');
const uploadRoutes = require('../backend/routes/upload');

const app = express();

// --- Middleware ---
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// --- API Routes ---

// Public Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/students-auth', studentsAuthRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/inscriptions', inscriptionsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/password-recovery', passwordRecoveryRoutes);

// Admin & Protected Routes (require authentication)
app.use('/api/admin', authenticateToken, requireAdmin, adminRoutes);
app.use('/api/analytics', authenticateToken, requireAdmin, analyticsRoutes);
app.use('/api/approvals', authenticateToken, requireAdmin, approvalsRoutes);
app.use('/api/avisos', authenticateToken, requireAdmin, avisosRoutes);
app.use('/api/bolsa-trabajo', authenticateToken, requireAdmin, bolsaTrabajoRoutes);
app.use('/api/charts', authenticateToken, requireAdmin, chartsDataRoutes);
app.use('/api/citas', authenticateToken, requireAdmin, citasRoutes);
app.use('/api/comunicados', authenticateToken, requireAdmin, comunicadosRoutes);
app.use('/api/digital-library', authenticateToken, requireAdmin, digitalLibraryRoutes);
app.use('/api/egresados', authenticateToken, requireAdmin, egresadosRoutes);
app.use('/api/emails', authenticateToken, requireAdmin, emailsRoutes);
app.use('/api/eventos', authenticateToken, requireAdmin, eventosRoutes);
app.use('/api/messaging', authenticateToken, requireAdmin, messagingRoutes);
app.use('/api/newsletters', authenticateToken, requireAdmin, newslettersPgRoutes);
app.use('/api/noticias', authenticateToken, requireAdmin, noticiasRoutes);
app.use('/api/notificaciones', authenticateToken, requireAdmin, notificacionesRoutes);
app.use('/api/parents', authenticateToken, requireAdmin, parentsRoutes);
app.use('/api/polls', authenticateToken, requireAdmin, pollsRoutes);
app.use('/api/quejas', authenticateToken, requireAdmin, quejasRoutes);
app.use('/api/search', authenticateToken, requireAdmin, searchRoutes);
app.use('/api/solicitudes', authenticateToken, requireAdmin, solicitudesRoutes);
app.use('/api/suscriptores', authenticateToken, requireAdmin, suscriptoresRoutes);
app.use('/api/support-tickets', authenticateToken, requireAdmin, supportTicketsRoutes);
app.use('/api/teachers-portal', authenticateToken, requireAdmin, teachersPortalRoutes);
app.use('/api/upload', authenticateToken, requireAdmin, uploadRoutes);


// --- Error Handling ---
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint no encontrado en la API unificada.',
        path: req.originalUrl,
        method: req.method
    });
});

app.use(errorHandler);

// --- Export for Vercel ---
module.exports = app;