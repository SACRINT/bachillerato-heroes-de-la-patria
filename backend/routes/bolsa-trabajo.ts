/**
 * 💼 API CRUD PARA BOLSA DE TRABAJO - TypeScript
 * Gestión completa de CVs y candidatos
 * Migrado: 07 Diciembre 2025
 */

import express, { Request, Response, Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { body, validationResult, ValidationChain } from 'express-validator';
import { PoolClient } from 'pg';

import BolsaTrabajoDAO from '../data/bolsa-trabajo.dao';
import { pool } from '../config/database';

// GDPR Logging
import { debugLog } from '../utils/debug-logger';
import { sanitizeError } from '../utils/sanitized-errors';

const router: Router = express.Router();

// ============================================
// CONFIGURACIÓN EMAIL
// ============================================

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ============================================
// INTERFACES
// ============================================

interface PendingData {
    id: number;
    email_usuario: string;
    datos_json: any; // Se guarda como JSON en BD
    token_expires_at: string;
}

interface CvData {
    name: string;
    email: string;
    phone: string;
    graduationYear: string;
    subject: string;
    message: string;
    skills?: string;
    cvPath?: string | null;
}

interface ApprovalRequest {
    access_token?: string;
    action: 'approve' | 'reject';
    adminNotes?: string;
}

// Extend Request to support file from Multer (Express.Multer.File needs @types/multer usually, 
// if not available we define a minimal interface)
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer?: Buffer;
}

interface RequestWithFile extends Request {
    file?: MulterFile;
    user?: { id: number; role: string; email: string };
}

// ============================================
// MULTER CONFIG
// ============================================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../public/uploads/cvs');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'cv-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF'));
        }
    }
});

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/bolsa-trabajo/cv - Crear perfil de CV
 */
router.post('/cv', upload.single('additionalDocument'), [
    body('name').trim().notEmpty().withMessage('Nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('phone').trim().notEmpty().withMessage('Teléfono es requerido'),
    body('graduationYear').notEmpty().withMessage('Año de egreso es requerido'),
    body('subject').trim().notEmpty().withMessage('Área de interés es requerida'),
    body('message').optional().trim()
], async (req: RequestWithFile, res: Response): Promise<void> => {
    // Validar datos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        if (req.file) { fs.unlinkSync(req.file.path); }
        res.status(400).json({ success: false, errors: errors.array() });
        return;
    }

    const { name, email, phone, graduationYear, subject, skills } = req.body;
    const message = req.body.message && req.body.message.trim() ? req.body.message.trim() : `Perfil profesional de egresado en área de ${subject}`;
    const cvFile = req.file ? `/uploads/cvs/${req.file.filename}` : null;

    try {
        debugLog.log('BOLSA_TRABAJO', '[BOLSA-TRABAJO CV v2] Recibiendo CV');
        const confirmationToken = crypto.randomBytes(32).toString('hex');
        const formData: CvData = { name, email, phone, graduationYear, subject, message, skills, cvPath: cvFile };

        // 3. Guardar temporalmente
        const result = await BolsaTrabajoDAO.createPendingConfirmation(email, formData, confirmationToken);
        const finalToken = result.confirmation_token;
        debugLog.log('BOLSA_TRABAJO', '[BOLSA-TRABAJO CV v2] Datos guardados en BD temporal');

        // 4. Enviar email
        const confirmationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/bolsa-trabajo.html#confirm-email`;
        const confirmLink = `${confirmationUrl}?token=${finalToken}`;

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Confirma tu Email - Bolsa de Trabajo</title>
            </head>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1976D2;">¡Bienvenido a la Bolsa de Trabajo!</h1>
                    </div>
                    <p>Hola <strong>${name}</strong>,</p>
                    <p>Para completar tu registro, debes confirmar tu dirección de email.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${confirmLink}" style="display: inline-block; padding: 12px 30px; background-color: #1976D2; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Confirmar mi Email</a>
                    </div>
                    <p style="color: #999; font-size: 12px;">Enlace expira en 24 horas.</p>
                </div>
            </body>
            </html>
        `;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: '✅ Confirma tu Email - Bolsa de Trabajo BGE',
            html: htmlContent
        });

        debugLog.log('BOLSA_TRABAJO', '[BOLSA-TRABAJO CV v2] Email de confirmación enviado');

        // 5. Respuesta
        res.status(201).json({
            success: true,
            message: '📧 ¡Solicitud recibida! Hemos enviado un email de confirmación.',
            data: { email, nombre: name, estado: 'esperando_confirmacion' }
        });

    } catch (error) {
        debugLog.error('BOLSA_TRABAJO', '[BOLSA-TRABAJO CV v2] Error al procesar solicitud', sanitizeError(error as Error, 'bolsa-trabajo'));
        res.status(500).json({ success: false, error: 'Error al procesar tu perfil.', detalle: (error as Error).message });
    }
});

/**
 * POST /api/bolsa-trabajo/confirm-email/:token
 */
router.post('/confirm-email/:token', async (req: Request, res: Response): Promise<void> => {
    const { token } = req.params;
    const client: PoolClient = await pool.connect();

    if (!token) { res.status(400).json({ success: false, error: 'Token requerido' }); return; }

    try {
        debugLog.log('BOLSA_TRABAJO', '[BOLSA-TRABAJO CONFIRM] Confirmando email');

        // 1. Buscar datos
        const pendingResult = await client.query(
            `SELECT id, email_usuario, datos_json, token_expires_at FROM bolsa_trabajo_pending_confirmation WHERE confirmation_token = $1`,
            [token]
        );

        if (pendingResult.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Token inválido o no encontrado' }); return;
        }

        const pendingData: PendingData = pendingResult.rows[0];

        // 2. Verificar expiración
        if (new Date() > new Date(pendingData.token_expires_at)) {
            await client.query('DELETE FROM bolsa_trabajo_pending_confirmation WHERE id = $1', [pendingData.id]);
            res.status(404).json({ success: false, error: 'Token expirado' }); return;
        }

        // 3. Transaction
        await client.query('BEGIN');
        const { email_usuario: email, datos_json: formData } = pendingData;

        try {
            const existingApproval = await client.query(
                `SELECT id FROM pendientes_aprobacion WHERE email_usuario = $1 AND tipo_solicitud = $2`,
                [email, 'bolsa_trabajo']
            );

            let savedRecord;
            if (existingApproval.rows.length > 0) {
                // Update existing
                const updateRes = await client.query(
                    `UPDATE pendientes_aprobacion SET datos_json = $1, fecha_solicitud = NOW(), email_confirmado = $2, estado = $3 WHERE id = $4 RETURNING id, uuid, email_usuario, estado`,
                    [JSON.stringify(formData), true, 'pendiente', existingApproval.rows[0].id]
                );
                savedRecord = updateRes.rows[0];
            } else {
                // Insert new
                const insertRes = await client.query(
                    `INSERT INTO pendientes_aprobacion (email_usuario, tipo_solicitud, datos_json, estado, email_confirmado, fecha_solicitud) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, uuid, email_usuario, estado`,
                    [email, 'bolsa_trabajo', JSON.stringify(formData), 'pendiente', true]
                );
                savedRecord = insertRes.rows[0];
            }

            await client.query('DELETE FROM bolsa_trabajo_pending_confirmation WHERE id = $1', [pendingData.id]);
            await client.query('COMMIT');

            res.status(200).json({
                success: true,
                message: '✅ Email confirmado exitosamente',
                data: { uuid: savedRecord.uuid, status: savedRecord.estado }
            });
        } catch (innerErr) {
            await client.query('ROLLBACK');
            throw innerErr;
        }
    } catch (error) {
        debugLog.error('BOLSA_TRABAJO', 'Error confirmando email', sanitizeError(error as Error, 'bolsa-trabajo'));
        res.status(500).json({ success: false, error: 'Error al confirmar email' });
    } finally {
        client.release();
    }
});

/**
 * GET /api/bolsa-trabajo/cv (Alias /api/bolsa-trabajo)
 */
const getCvsHandler = async (req: Request, res: Response): Promise<void> => {
    const { status, limit = 50, offset = 0 } = req.query as { status?: string, limit?: string, offset?: string };
    try {
        // En .js original se llamaba getAll o getCvs dependiendo de la ruta, ambos parecen mapear a DAO methods.
        // Aquí unificamos.
        const { data, total } = await BolsaTrabajoDAO.getCvs({ status, limit: parseInt(limit as string), offset: parseInt(offset as string) });
        res.json({ success: true, data, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
    } catch (error) {
        debugLog.error('BOLSA_TRABAJO', 'Error obteniendo CVs', sanitizeError(error as Error, 'bolsa-trabajo'));
        res.status(500).json({ success: false, error: 'Error obteniendo datos' });
    }
};
router.get('/cv', getCvsHandler);
router.get('/', getCvsHandler); // Alias

/**
 * GET /api/bolsa-trabajo/cv/stats
 */
router.get('/cv/stats', async (req: Request, res: Response): Promise<void> => {
    try {
        const stats = await BolsaTrabajoDAO.getCvStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo estadísticas' });
    }
});
router.get('/stats/general', async (req: Request, res: Response): Promise<void> => { // Alias
    try {
        const stats = await BolsaTrabajoDAO.getGeneralStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo estadísticas' });
    }
});

/**
 * GET /api/bolsa-trabajo/cv/:id
 */
router.get('/cv/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const cv = await BolsaTrabajoDAO.getCvById(req.params.id);
        if (!cv) { res.status(404).json({ success: false, error: 'CV no encontrado' }); return; }
        res.json({ success: true, data: cv });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo CV' });
    }
});

/**
 * PUT /api/bolsa-trabajo/cv/:id
 */
router.put('/cv/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const updated = await BolsaTrabajoDAO.updateCv(req.params.id, req.body);
        if (!updated) { res.status(404).json({ success: false, error: 'CV no encontrado' }); return; }
        res.json({ success: true, message: 'CV actualizado', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error actualizando CV' });
    }
});

/**
 * DELETE /api/bolsa-trabajo/cv/:id
 */
router.delete('/cv/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const deleted = await BolsaTrabajoDAO.deleteCv(req.params.id);
        if (!deleted) { res.status(404).json({ success: false, error: 'CV no encontrado' }); return; }
        res.json({ success: true, message: 'CV eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error eliminando CV' });
    }
});

/**
 * GET /api/bolsa-trabajo/pending-approvals
 */
router.get('/pending-approvals', async (req: Request, res: Response): Promise<void> => {
    const { status = 'pendiente', limit = 50, offset = 0, email_confirmado = 'true' } = req.query as any;
    try {
        const { data, total } = await BolsaTrabajoDAO.getPendingApprovals({ status, email_confirmado: email_confirmado === 'true', limit: parseInt(limit), offset: parseInt(offset) });
        res.json({ success: true, data, total, limit, offset });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo solicitudes' });
    }
});

/**
 * POST /api/bolsa-trabajo/approve-solicitud/:id
 */
router.post('/approve-solicitud/:id', [
    body('action').isIn(['approve', 'reject']).withMessage('Acción inválida'),
    body('adminNotes').optional().trim()
], async (req: RequestWithFile, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return; }

    const { id } = req.params;
    const { action, adminNotes } = req.body as ApprovalRequest;

    try {
        const solicitud = await BolsaTrabajoDAO.getSolicitudById(String(id)); // DAO expects string/number? assuming string or int
        if (!solicitud) { res.status(404).json({ success: false, error: 'Solicitud no encontrada' }); return; }

        const estado = action === 'approve' ? 'aprobada' : 'rechazada';
        const updateResult = await BolsaTrabajoDAO.updateSolicitudStatus(String(id), estado, adminNotes, req.user?.id);

        if (!updateResult) { res.status(500).json({ success: false, error: 'No se pudo actualizar solicitud' }); return; }

        let boletinResult;
        if (action === 'approve') {
            const formData = JSON.parse(solicitud.datos_json);
            boletinResult = await BolsaTrabajoDAO.insertCvFromApproval(formData);
        }

        res.json({
            success: true,
            message: action === 'approve' ? '✅ Solicitud aprobada' : '❌ Solicitud rechazada',
            data: {
                solicitud_id: id,
                estado,
                bolsa_trabajo_id: boletinResult?.id
            }
        });

    } catch (error) {
        debugLog.error('BOLSA_TRABAJO', 'Error procesando solicitud', sanitizeError(error as Error, 'bolsa-trabajo'));
        res.status(500).json({ success: false, error: 'Error procesando solicitud' });
    }
});

export default router;
