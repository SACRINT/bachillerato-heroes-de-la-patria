/**
 * ✅ API DE APROBACIONES ADMINISTRATIVAS - PostgreSQL
 * Sistema de moderación para formularios que requieren aprobación manual
 * Migrado: 08 Diciembre 2025
 */

import express, { Request, Response } from 'express';
// @ts-ignore
import { debugLog } from '../utils/debug-logger';
// @ts-ignore
import { sanitizeError } from '../utils/sanitized-errors';

const router = express.Router();

// ✅ FASE 3: Using DAO layer
// @ts-ignore
import ApprovalsDAO from '../data/approvals.dao';
// @ts-ignore
import verificationService from '../services/verificationService';
// @ts-ignore
import ApprovalService from '../services/ApprovalService';

interface ApprovalFilter {
    form_type?: string;
    limit: number;
    offset: number;
    status: string;
}

// =====================================================
// GET /api/approvals/pending - Listar solicitudes pendientes
// =====================================================
router.get('/pending', async (req: Request, res: Response) => {
    const { form_type, limit = '50', offset = '0' } = req.query;

    try {
        // ✅ REFACTORIZADO: Usar ApprovalService
        const filters: ApprovalFilter = {
            form_type: form_type as string,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            status: 'pending'
        };

        const approvals = await ApprovalService.getPendingApprovals(filters);

        debugLog.log('APPROVALS', 'Pending approvals fetched', { count: approvals.length });

        res.json({
            success: true,
            data: approvals,
            total: approvals.length, // TODO: Implementar count real en servicio
            limit: parseInt(limit as string),
            offset: parseInt(offset as string)
        });

    } catch (error) {
        debugLog.error('APPROVALS', 'Error al obtener solicitudes pendientes', sanitizeError(error, 'getPendingRoute'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener solicitudes pendientes'
        });
    }
});

// =====================================================
// GET /api/approvals/stats - Estadísticas de aprobaciones
// =====================================================
router.get('/stats', async (req: Request, res: Response) => {
    try {
        // ✅ FASE 3: Using ApprovalsDAO
        const stats = await ApprovalsDAO.getStats();
        res.json({ success: true, data: stats });

    } catch (error) {
        debugLog.error('APPROVALS', '❌ Error al obtener estadísticas', sanitizeError(error, 'approvals'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

// =====================================================
// POST /api/approvals/approve/:id - Aprobar solicitud
// =====================================================
router.post('/approve/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reviewed_by, review_notes } = req.body;

    try {
        // ✅ FASE 3: Using ApprovalsDAO
        const record = await ApprovalsDAO.getById(id);
        if (!record) {
            res.status(404).json({ success: false, error: 'Solicitud no encontrada o ya fue procesada' });
            return;
        }

        const formType = record.form_type;
        const data = record.submission_data;
        debugLog.log('APPROVALS', `📋 Aprobando solicitud ${id} de tipo: ${formType}`);

        let savedToFinalTable = false;
        let finalTableId = null;

        if (formType === 'bolsa_trabajo') {
            try {
                finalTableId = await ApprovalsDAO.saveToBolsaTrabajo(data, record.ip_address, record.user_agent);
                savedToFinalTable = !!finalTableId;
                debugLog.log('APPROVALS', `✅ Guardado en bolsa_trabajo_cv con ID: ${finalTableId}`);
            } catch (error) {
                debugLog.error('APPROVALS', '❌ Error al guardar en bolsa_trabajo_cv', sanitizeError(error, 'approvals'));
            }
        } else if (formType === 'egresados') {
            try {
                finalTableId = await ApprovalsDAO.saveToEgresados(data, record.ip_address, record.user_agent);
                savedToFinalTable = !!finalTableId;
                debugLog.log('APPROVALS', `✅ Guardado en egresados con ID: ${finalTableId}`);
            } catch (error) {
                debugLog.error('APPROVALS', '❌ Error al guardar en egresados', sanitizeError(error, 'approvals'));
            }
        }

        const updateResult = await ApprovalsDAO.approve(id, reviewed_by, review_notes || `Aprobado y guardado en tabla ${formType}`);


        // Enviar email de notificación al usuario
        try {
            const emailOptions = {
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: record.verification_email,
                subject: '✅ Tu solicitud ha sido aprobada',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: #27ae60; color: white; padding: 20px; text-align: center; border-radius: 5px; }
                            .content { padding: 20px; background: #f9f9f9; border-radius: 5px; margin-top: 20px; }
                            .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #888; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>✅ ¡Solicitud Aprobada!</h1>
                            </div>
                            <div class="content">
                                <p>Estimado/a ${data.name || data.nombre || 'usuario'},</p>
                                <p>Tu solicitud ha sido <strong>aprobada</strong> por nuestro equipo administrativo.</p>
                                <p><strong>Tipo de solicitud:</strong> ${formType === 'bolsa_trabajo' ? 'Bolsa de Trabajo' : 'Actualización de Egresados'}</p>
                                ${review_notes ? `<p><strong>Notas:</strong> ${review_notes}</p>` : ''}
                                <p>Nos pondremos en contacto contigo pronto.</p>
                            </div>
                            <div class="footer">
                                <p>Bachillerato General Estatal "Héroes de la Patria"</p>
                                <p>Puebla, México</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

            await verificationService.transporter.sendMail(emailOptions);
            debugLog.log('APPROVALS', `📧 Email de aprobación enviado a: ${record.verification_email}`);

        } catch (emailError) {
            debugLog.error('APPROVALS', 'Error al enviar email de aprobación', sanitizeError(emailError, 'approveEmail'));
        }

        res.json({
            success: true,
            message: 'Solicitud aprobada exitosamente',
            data: { id: updateResult.id, form_type: formType, saved_to_final_table: savedToFinalTable, final_table_id: finalTableId }
        });

    } catch (error) {
        debugLog.error('APPROVALS', '❌ Error al aprobar solicitud', sanitizeError(error, 'approvals'));
        res.status(500).json({
            success: false,
            error: 'Error al aprobar solicitud'
        });
    }
});

// =====================================================
// POST /api/approvals/reject/:id - Rechazar solicitud
// =====================================================
router.post('/reject/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reviewed_by, review_notes, rejection_reason } = req.body;

    try {
        // ✅ FASE 3: Using ApprovalsDAO
        const record = await ApprovalsDAO.getById(id);
        if (!record) {
            res.status(404).json({ success: false, error: 'Solicitud no encontrada o ya fue procesada' });
            return;
        }

        const result = await ApprovalsDAO.reject(id, reviewed_by, review_notes, rejection_reason);
        debugLog.log('APPROVALS', `❌ Solicitud ${id} rechazada por: ${reviewed_by || 'Administrador'}`);

        // Enviar email de notificación al usuario
        try {
            const data = record.submission_data;

            const emailOptions = {
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: record.verification_email,
                subject: '❌ Actualización sobre tu solicitud',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: #e74c3c; color: white; padding: 20px; text-align: center; border-radius: 5px; }
                            .content { padding: 20px; background: #f9f9f9; border-radius: 5px; margin-top: 20px; }
                            .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #888; }
                            .reason { background: #fff3cd; padding: 15px; border-left: 4px solid #f39c12; margin: 15px 0; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>📋 Actualización de Solicitud</h1>
                            </div>
                            <div class="content">
                                <p>Estimado/a ${data.name || data.nombre || 'usuario'},</p>
                                <p>Lamentablemente, tu solicitud no ha podido ser aprobada en este momento.</p>
                                <div class="reason">
                                    <strong>Motivo:</strong><br>
                                    ${rejection_reason || 'Información incompleta o incorrecta'}
                                </div>
                                ${review_notes ? `<p><strong>Notas adicionales:</strong> ${review_notes}</p>` : ''}
                                <p>Si deseas, puedes enviar una nueva solicitud con la información correcta.</p>
                                <p>Para más información, contáctanos directamente.</p>
                            </div>
                            <div class="footer">
                                <p>Bachillerato General Estatal "Héroes de la Patria"</p>
                                <p>📧 contacto.heroesdelapatria.sep@gmail.com</p>
                                <p>Puebla, México</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

            await verificationService.transporter.sendMail(emailOptions);
            debugLog.log('APPROVALS', `📧 Email de rechazo enviado a: ${record.verification_email}`);

        } catch (emailError) {
            debugLog.error('APPROVALS', 'Error al enviar email de rechazo', sanitizeError(emailError, 'rejectEmail'));
        }

        res.json({
            success: true,
            message: 'Solicitud rechazada',
            data: result.rows[0]
        });

    } catch (error) {
        debugLog.error('APPROVALS', '❌ Error al rechazar solicitud', sanitizeError(error, 'approvals'));
        res.status(500).json({
            success: false,
            error: 'Error al rechazar solicitud'
        });
    }
});

// =====================================================
// GET /api/approvals/history - Historial de aprobaciones/rechazos
// =====================================================
router.get('/history', async (req: Request, res: Response) => {
    const { status, form_type, limit = '50', offset = '0' } = req.query;

    try {
        // ✅ FASE 3: Using ApprovalsDAO instead of direct pool.query
        const result = await ApprovalsDAO.getHistory({
            status: status as string,
            form_type: form_type as string,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string)
        });

        res.json({
            success: true,
            data: result.data,
            total: result.total,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string)
        });

    } catch (error) {
        debugLog.error('APPROVALS', '❌ Error al obtener historial', sanitizeError(error, 'approvals'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener historial'
        });
    }
});

export default router;
