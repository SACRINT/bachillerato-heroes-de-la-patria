"use strict";
/**
 * 📅 RUTAS DE CITAS - TypeScript
 * Sistema de gestión de citas con validaciones avanzadas
 * Migrado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const crypto_1 = __importDefault(require("crypto"));
const database_1 = __importDefault(require("../config/database"));
const verificationService_1 = __importDefault(require("../services/verificationService"));
// GDPR Logging
const debug_logger_1 = require("../utils/debug-logger");
const sanitized_errors_1 = require("../utils/sanitized-errors");
const router = express_1.default.Router();
// ============================================
// RATE LIMITING
// ============================================
const citaAttempts = new Map();
function checkRateLimit(ip, email) {
    const key = `${ip}-${email}`;
    const now = Date.now();
    if (!citaAttempts.has(key))
        citaAttempts.set(key, []);
    const attempts = citaAttempts.get(key);
    const oneHourAgo = now - (60 * 60 * 1000);
    const recentAttempts = attempts.filter(t => t > oneHourAgo);
    citaAttempts.set(key, recentAttempts);
    if (recentAttempts.length >= 5) {
        return { allowed: false, message: 'Demasiados intentos. Por favor intenta más tarde.' };
    }
    recentAttempts.push(now);
    return { allowed: true };
}
// ============================================
// VALIDATION FUNCTIONS
// ============================================
function validateFutureDateTime(dateString, timeString) {
    const now = new Date();
    const appointmentDate = new Date(`${dateString}T${timeString}:00`);
    if (appointmentDate <= now)
        return { valid: false, message: 'No puedes agendar citas en el pasado' };
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    if (appointmentDate > sixMonthsFromNow)
        return { valid: false, message: 'No puedes agendar citas con más de 6 meses de anticipación' };
    return { valid: true };
}
async function checkTimeSlotAvailability(fecha, hora) {
    const result = await database_1.default.executeQuery(`SELECT COUNT(*) as count FROM citas WHERE fecha_solicitada = $1 AND hora_solicitada = $2 AND estado NOT IN ('rechazada', 'cancelada') AND confirmada = true`, [fecha, hora]);
    const occupied = parseInt(result[0].count);
    if (occupied >= 3)
        return { available: false, message: 'Este horario no está disponible.', occupiedSlots: occupied };
    return { available: true, availableSlots: 3 - occupied };
}
async function checkDuplicateCita(email, fecha, hora) {
    const result = await database_1.default.executeQuery(`SELECT id FROM citas WHERE email = $1 AND fecha_solicitada = $2 AND hora_solicitada = $3 AND estado NOT IN ('rechazada', 'cancelada')`, [email, fecha, hora]);
    if (result.length > 0)
        return { exists: true, message: 'Ya tienes una cita programada para este día y hora' };
    return { exists: false };
}
async function checkCitasLimitPerDay(email) {
    const result = await database_1.default.executeQuery(`SELECT COUNT(*) as count FROM citas WHERE email = $1 AND fecha_solicitada = CURRENT_DATE AND estado NOT IN ('rechazada', 'cancelada')`, [email]);
    const citasHoy = parseInt(result[0].count);
    if (citasHoy >= 3)
        return { limited: true, message: 'Ya tienes el máximo de citas para hoy (3).', citasHoy };
    return { limited: false, citasHoy };
}
function generateCitaId(lastId) {
    return `CITA-${new Date().getFullYear()}-${String(lastId + 1).padStart(4, '0')}`;
}
function generateConfirmationToken() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
// ============================================
// ROUTES
// ============================================
/**
 * GET /api/citas
 */
router.get('/', async (req, res) => {
    try {
        const result = await database_1.default.executeQuery(`
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                   SUM(CASE WHEN estado = 'aprobada' THEN 1 ELSE 0 END) as aprobadas,
                   SUM(CASE WHEN estado = 'rechazada' THEN 1 ELSE 0 END) as rechazadas
            FROM citas
        `);
        res.json({
            success: true,
            status: 'Sistema de Citas Operacional',
            stats: {
                total: parseInt(result[0].total || '0'),
                pendientes: parseInt(result[0].pendientes || '0'),
                aprobadas: parseInt(result[0].aprobadas || '0'),
                rechazadas: parseInt(result[0].rechazadas || '0')
            }
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('CITAS', 'Error fetching citas stats', (0, sanitized_errors_1.sanitizeError)(error, 'citas'));
        res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
    }
});
/**
 * POST /api/citas/create
 */
router.post('/create', [
    (0, express_validator_1.body)('nombre_completo').trim().notEmpty().withMessage('Nombre completo requerido'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Email inválido'),
    (0, express_validator_1.body)('telefono').optional().trim(),
    (0, express_validator_1.body)('tipo_persona').isIn(['estudiante', 'padre', 'madre', 'tutor', 'docente', 'administrativo', 'externo']),
    (0, express_validator_1.body)('motivo').trim().notEmpty().withMessage('Motivo requerido'),
    (0, express_validator_1.body)('descripcion').optional().trim(),
    (0, express_validator_1.body)('fecha_solicitada').isDate().withMessage('Fecha inválida'),
    (0, express_validator_1.body)('hora_solicitada').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Hora inválida'),
    (0, express_validator_1.body)('departamento').trim().notEmpty().withMessage('Departamento requerido')
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
    }
    try {
        const { nombre_completo, email, telefono, tipo_persona, motivo, descripcion, fecha_solicitada, hora_solicitada, departamento } = req.body;
        const ip_address = req.ip || req.connection.remoteAddress;
        // Validations
        const rateLimitCheck = checkRateLimit(ip_address, email);
        if (!rateLimitCheck.allowed) {
            res.status(429).json({ success: false, message: rateLimitCheck.message });
            return;
        }
        const dateValidation = validateFutureDateTime(fecha_solicitada, hora_solicitada);
        if (!dateValidation.valid) {
            res.status(400).json({ success: false, message: dateValidation.message });
            return;
        }
        const availabilityCheck = await checkTimeSlotAvailability(fecha_solicitada, hora_solicitada);
        if (!availabilityCheck.available) {
            res.status(409).json({ success: false, message: availabilityCheck.message });
            return;
        }
        const duplicateCheck = await checkDuplicateCita(email, fecha_solicitada, hora_solicitada);
        if (duplicateCheck.exists) {
            res.status(409).json({ success: false, message: duplicateCheck.message });
            return;
        }
        const dayLimitCheck = await checkCitasLimitPerDay(email);
        if (dayLimitCheck.limited) {
            res.status(429).json({ success: false, message: dayLimitCheck.message });
            return;
        }
        // Create appointment
        const lastIdResult = await database_1.default.executeQuery(`SELECT cita_id FROM citas ORDER BY id DESC LIMIT 1`);
        let lastNumber = 0;
        if (lastIdResult.length > 0) {
            const match = lastIdResult[0].cita_id.match(/-(\d+)$/);
            if (match)
                lastNumber = parseInt(match[1]);
        }
        const newCitaId = generateCitaId(lastNumber);
        const confirmationToken = generateConfirmationToken();
        const result = await database_1.default.executeQuery(`INSERT INTO citas (cita_id, nombre_completo, email, telefono, tipo_persona, motivo, descripcion, fecha_solicitada, hora_solicitada, token_confirmacion, estado, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()) RETURNING *`, [newCitaId, nombre_completo, email, telefono || null, tipo_persona, motivo, descripcion || null, fecha_solicitada, hora_solicitada, confirmationToken, 'pendiente']);
        debug_logger_1.debugLog.log('CITAS', `✅ Nueva cita creada: ${newCitaId}`);
        // Send confirmation email
        try {
            const confirmationLink = `${process.env.BASE_URL || 'http://localhost:3000'}/api/citas/confirm/${confirmationToken}`;
            await verificationService_1.default.transporter.sendMail({
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: '✅ Solicitud de Cita Recibida',
                html: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto;"><h2 style="color: #667eea;">📅 Solicitud de Cita Recibida</h2><p>Hola <strong>${nombre_completo}</strong>,</p><p>Confirma tu cita haciendo clic:</p><a href="${confirmationLink}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Confirmar mi Cita</a></div>`
            });
            debug_logger_1.debugLog.log('CITAS', `📧 Email de confirmación enviado a ${(0, sanitized_errors_1.maskEmail)(email)}`);
        }
        catch (emailError) {
            debug_logger_1.debugLog.error('CITAS', '⚠️ Error enviando email', (0, sanitized_errors_1.sanitizeError)(emailError, 'citas'));
        }
        res.json({ success: true, message: 'Solicitud de cita creada. Por favor confirma tu email.', cita: { id: newCitaId, estado: 'pendiente', fecha: fecha_solicitada, hora: hora_solicitada } });
    }
    catch (error) {
        debug_logger_1.debugLog.error('CITAS', '❌ Error creando cita', (0, sanitized_errors_1.sanitizeError)(error, 'citas'));
        res.status(500).json({ success: false, message: 'Error al crear solicitud de cita' });
    }
});
/**
 * GET /api/citas/available-slots
 */
router.get('/available-slots', async (req, res) => {
    try {
        const { fecha, departamento } = req.query;
        if (!fecha || !departamento) {
            res.status(400).json({ success: false, message: 'Parámetros requeridos: fecha, departamento' });
            return;
        }
        const dateValidation = validateFutureDateTime(fecha, '00:00');
        if (!dateValidation.valid) {
            res.status(400).json({ success: false, message: dateValidation.message });
            return;
        }
        const result = await database_1.default.executeQuery(`
            SELECT hora_solicitada, COUNT(*) FILTER (WHERE estado NOT IN ('rechazada', 'cancelada') AND confirmada = true) as ocupados
            FROM citas WHERE fecha_solicitada = $1 GROUP BY hora_solicitada
        `, [fecha]);
        const horarios = [];
        for (let hour = 8; hour < 17; hour++) {
            const hora = `${String(hour).padStart(2, '0')}:00`;
            const existente = result.find(r => r.hora_solicitada === hora);
            const ocupados = existente ? parseInt(existente.ocupados) : 0;
            horarios.push({ hora, disponibles: 3 - ocupados, ocupados });
        }
        res.json({ success: true, fecha, departamento, horarios: horarios.filter(h => h.disponibles > 0) });
    }
    catch (error) {
        debug_logger_1.debugLog.error('CITAS', 'Error obteniendo horarios disponibles', (0, sanitized_errors_1.sanitizeError)(error, 'citas'));
        res.status(500).json({ success: false, message: 'Error al obtener horarios disponibles' });
    }
});
/**
 * GET /api/citas/confirm/:token
 */
router.get('/confirm/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const result = await database_1.default.executeQuery(`UPDATE citas SET confirmada = true, updated_at = NOW() WHERE token_confirmacion = $1 AND confirmada = false RETURNING *`, [token]);
        if (result.length === 0) {
            res.send(`<html><body style="font-family:Arial;text-align:center;padding:50px;"><h1 style="color:#dc3545;">❌ Token inválido o ya confirmado</h1></body></html>`);
            return;
        }
        const cita = result[0];
        debug_logger_1.debugLog.log('CITAS', `✅ Cita confirmada: ${cita.cita_id}`);
        res.send(`<html><body style="font-family:Arial;text-align:center;padding:50px;"><h1 style="color:#28a745;">✅ ¡Cita Confirmada!</h1><p>Gracias ${cita.nombre_completo}, tu cita ha sido confirmada.</p></body></html>`);
    }
    catch (error) {
        debug_logger_1.debugLog.error('CITAS', 'Error confirmando cita', (0, sanitized_errors_1.sanitizeError)(error, 'citas'));
        res.status(500).send('Error al confirmar cita');
    }
});
/**
 * GET /api/citas/list
 */
router.get('/list', async (req, res) => {
    try {
        const { estado, tipo_persona, fecha_desde, fecha_hasta } = req.query;
        let query = `SELECT id, cita_id, nombre_completo, email, telefono, tipo_persona, motivo, descripcion, fecha_solicitada, hora_solicitada, estado, confirmada, notas_admin, created_at, updated_at FROM citas WHERE 1=1`;
        const params = [];
        let paramIndex = 1;
        if (estado) {
            query += ` AND estado = $${paramIndex++}`;
            params.push(estado);
        }
        if (tipo_persona) {
            query += ` AND tipo_persona = $${paramIndex++}`;
            params.push(tipo_persona);
        }
        if (fecha_desde) {
            query += ` AND fecha_solicitada >= $${paramIndex++}`;
            params.push(fecha_desde);
        }
        if (fecha_hasta) {
            query += ` AND fecha_solicitada <= $${paramIndex++}`;
            params.push(fecha_hasta);
        }
        query += ` ORDER BY created_at DESC LIMIT 100`;
        const result = await database_1.default.executeQuery(query, params);
        res.json({ success: true, data: result, total: result.length });
    }
    catch (error) {
        debug_logger_1.debugLog.error('CITAS', 'Error listando citas', (0, sanitized_errors_1.sanitizeError)(error, 'citas'));
        res.status(500).json({ success: false, message: 'Error al obtener citas' });
    }
});
/**
 * GET /api/citas/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const result = await database_1.default.executeQuery(`
            SELECT
                COUNT(*) FILTER (WHERE estado = 'pendiente') AS pendientes,
                COUNT(*) FILTER (WHERE estado = 'aprobada') AS aprobadas,
                COUNT(*) FILTER (WHERE estado = 'rechazada') AS rechazadas,
                COUNT(*) FILTER (WHERE estado = 'completada') AS completadas,
                COUNT(*) FILTER (WHERE confirmada = false) AS no_confirmadas,
                COUNT(*) AS total
            FROM citas
        `);
        res.json({
            success: true,
            statistics: {
                pendientes: parseInt(String(result[0].pendientes)),
                aprobadas: parseInt(String(result[0].aprobadas)),
                rechazadas: parseInt(String(result[0].rechazadas)),
                completadas: parseInt(String(result[0].completadas)),
                noConfirmadas: parseInt(String(result[0].no_confirmadas)),
                total: parseInt(String(result[0].total))
            }
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('CITAS', 'Error obteniendo estadísticas', (0, sanitized_errors_1.sanitizeError)(error, 'citas'));
        res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
    }
});
/**
 * PUT /api/citas/:id/approve
 */
router.put('/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const { notas_admin } = req.body;
        const result = await database_1.default.executeQuery(`UPDATE citas SET estado = 'aprobada', notas_admin = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [notas_admin || null, id]);
        if (result.length === 0) {
            res.status(404).json({ success: false, message: 'Cita no encontrada' });
            return;
        }
        debug_logger_1.debugLog.log('CITAS', `✅ Cita ${id} aprobada`);
        res.json({ success: true, message: 'Cita aprobada exitosamente', cita: result[0] });
    }
    catch (error) {
        debug_logger_1.debugLog.error('CITAS', 'Error aprobando cita', (0, sanitized_errors_1.sanitizeError)(error, 'citas'));
        res.status(500).json({ success: false, message: 'Error al aprobar cita' });
    }
});
/**
 * PUT /api/citas/:id/reject
 */
router.put('/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo_rechazo } = req.body;
        if (!motivo_rechazo) {
            res.status(400).json({ success: false, message: 'Se requiere un motivo de rechazo' });
            return;
        }
        const result = await database_1.default.executeQuery(`UPDATE citas SET estado = 'rechazada', notas_admin = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [motivo_rechazo, id]);
        if (result.length === 0) {
            res.status(404).json({ success: false, message: 'Cita no encontrada' });
            return;
        }
        debug_logger_1.debugLog.log('CITAS', `❌ Cita ${id} rechazada`);
        res.json({ success: true, message: 'Cita rechazada exitosamente', cita: result[0] });
    }
    catch (error) {
        debug_logger_1.debugLog.error('CITAS', 'Error rechazando cita', (0, sanitized_errors_1.sanitizeError)(error, 'citas'));
        res.status(500).json({ success: false, message: 'Error al rechazar cita' });
    }
});
module.exports = router;
//# sourceMappingURL=citas.js.map