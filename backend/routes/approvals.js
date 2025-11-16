/**
 * ✅ API DE APROBACIONES ADMINISTRATIVAS - PostgreSQL
 * Sistema de moderación para formularios que requieren aprobación manual
 * Fecha: 17 Octubre 2025
 */

const express = require('express');

// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail, maskToken } = require('../utils/sanitized-errors');

const router = express.Router();
const { pool } = require('../config/database');
const verificationService = require('../services/verificationService');
const ApprovalService = require('../services/ApprovalService');

// =====================================================
// GET /api/approvals/pending - Listar solicitudes pendientes
// =====================================================
router.get('/pending', async (req, res) => {
    const { form_type, limit = 50, offset = 0 } = req.query;

    try {
        // ✅ REFACTORIZADO: Usar ApprovalService
        const filters = {
            form_type,
            limit: parseInt(limit),
            offset: parseInt(offset),
            status: 'pending'
        };

        const approvals = await ApprovalService.getPendingApprovals(filters);

        debugLog.log('APPROVALS', 'Pending approvals fetched', { count: approvals.length });

        // Paginación (servicio retorna array, HTTP maneja paginación)
        res.json({
            success: true,
            data: approvals,
            total: approvals.length, // TODO: Implementar count real en servicio
            limit: parseInt(limit),
            offset: parseInt(offset)
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
router.get('/stats', async (req, res) => {
    try {
        const query = `
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'pending') as pendientes,
                COUNT(*) FILTER (WHERE status = 'approved') as aprobadas,
                COUNT(*) FILTER (WHERE status = 'rejected') as rechazadas,
                COUNT(*) FILTER (WHERE email_verified = true) as emails_verificados,
                COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as hoy,
                COUNT(*) FILTER (WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days') as esta_semana
            FROM pending_approvals;
        `;

        const result = await pool.query(query);

        // Estadísticas por tipo de formulario
        const typeQuery = `
            SELECT form_type, status, COUNT(*) as cantidad
            FROM pending_approvals
            GROUP BY form_type, status
            ORDER BY cantidad DESC;
        `;

        const typeResult = await pool.query(typeQuery);

        const stats = {
            ...result.rows[0],
            byFormType: typeResult.rows
        };

        res.json({
            success: true,
            data: stats
        });

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
router.post('/approve/:id', async (req, res) => {
    const { id } = req.params;
    const { reviewed_by, review_notes } = req.body;

    try {
        // Obtener la solicitud pendiente
        const getQuery = 'SELECT * FROM pending_approvals WHERE id = $1 AND status = \'pending\'';
        const submission = await pool.query(getQuery, [id]);

        if (submission.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Solicitud no encontrada o ya fue procesada'
            });
        }

        const record = submission.rows[0];
        const formType = record.form_type;
        const data = record.submission_data;

        debugLog.log('APPROVALS', `📋 Aprobando solicitud ${id} de tipo: ${formType}`);

        // Según el tipo de formulario, guardar en la tabla correspondiente
        let savedToFinalTable = false;
        let finalTableId = null;

        if (formType === 'bolsa_trabajo') {
            // Guardar en la tabla bolsa_trabajo_cv
            try {
                const insertQuery = `
                    INSERT INTO bolsa_trabajo_cv (
                        nombre, email, telefono, puesto_deseado, cv_path,
                        nivel_experiencia, disponibilidad, comentarios_adicionales,
                        ip_address, user_agent
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    RETURNING id
                `;

                const result = await pool.query(insertQuery, [
                    data.name || data.nombre,
                    data.email,
                    data.phone || data.telefono || '',
                    data.position || data.puesto_deseado || 'No especificado',
                    data.cv || data.cv_path || '',
                    data.experience || data.nivel_experiencia || 'Sin experiencia',
                    data.availability || data.disponibilidad || 'Inmediata',
                    data.comments || data.comentarios_adicionales || '',
                    record.ip_address,
                    record.user_agent
                ]);

                finalTableId = result.rows[0].id;
                savedToFinalTable = true;
                debugLog.log('APPROVALS', `✅ Guardado en bolsa_trabajo_cv con ID: ${finalTableId}`);

            } catch (error) {
                debugLog.error('APPROVALS', '❌ Error al guardar en bolsa_trabajo_cv', sanitizeError(error, 'approvals'));
            }

        } else if (formType === 'egresados') {
            // Guardar en la tabla egresados
            try {
                const insertQuery = `
                    INSERT INTO egresados (
                        nombre_completo, email, telefono, generacion,
                        ocupacion_actual, empresa, ciudad, estado,
                        comentarios, ip_address, user_agent
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    RETURNING id
                `;

                const result = await pool.query(insertQuery, [
                    data.name || data.nombre_completo,
                    data.email,
                    data.phone || data.telefono || '',
                    data.graduationYear || data.generacion || new Date().getFullYear(),
                    data.currentJob || data.ocupacion_actual || 'No especificado',
                    data.company || data.empresa || '',
                    data.city || data.ciudad || '',
                    data.state || data.estado || '',
                    data.message || data.comentarios || '',
                    record.ip_address,
                    record.user_agent
                ]);

                finalTableId = result.rows[0].id;
                savedToFinalTable = true;
                debugLog.log('APPROVALS', `✅ Guardado en egresados con ID: ${finalTableId}`);

            } catch (error) {
                debugLog.error('APPROVALS', '❌ Error al guardar en egresados', sanitizeError(error, 'approvals'));
            }
        }

        // Actualizar estado en pending_approvals
        const updateQuery = `
            UPDATE pending_approvals
            SET
                status = 'approved',
                reviewed_by = $1,
                review_notes = $2,
                reviewed_at = NOW()
            WHERE id = $3
            RETURNING *
        `;

        const updateResult = await pool.query(updateQuery, [
            reviewed_by || 'Administrador',
            review_notes || `Aprobado y guardado en tabla ${formType}`,
            id
        ]);

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
            data: {
                id: updateResult.rows[0].id,
                form_type: formType,
                saved_to_final_table: savedToFinalTable,
                final_table_id: finalTableId
            }
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
router.post('/reject/:id', async (req, res) => {
    const { id } = req.params;
    const { reviewed_by, review_notes, rejection_reason } = req.body;

    try {
        // Obtener la solicitud pendiente
        const getQuery = 'SELECT * FROM pending_approvals WHERE id = $1 AND status = \'pending\'';
        const submission = await pool.query(getQuery, [id]);

        if (submission.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Solicitud no encontrada o ya fue procesada'
            });
        }

        const record = submission.rows[0];

        // Actualizar estado en pending_approvals
        const updateQuery = `
            UPDATE pending_approvals
            SET
                status = 'rejected',
                reviewed_by = $1,
                review_notes = $2,
                rejection_reason = $3,
                reviewed_at = NOW()
            WHERE id = $4
            RETURNING *
        `;

        const result = await pool.query(updateQuery, [
            reviewed_by || 'Administrador',
            review_notes || '',
            rejection_reason || 'Información incompleta o incorrecta',
            id
        ]);

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
router.get('/history', async (req, res) => {
    const { status, form_type, limit = 50, offset = 0 } = req.query;

    try {
        let query = 'SELECT * FROM pending_approvals WHERE status != \'pending\'';
        const params = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            query += ` AND status = $${paramCount}`;
            params.push(status);
        }

        if (form_type) {
            paramCount++;
            query += ` AND form_type = $${paramCount}`;
            params.push(form_type);
        }

        query += ` ORDER BY reviewed_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Contar total
        let countQuery = 'SELECT COUNT(*) FROM pending_approvals WHERE status != \'pending\'';
        const countParams = [];
        let countParamCount = 0;

        if (status) {
            countParamCount++;
            countQuery += ` AND status = $${countParamCount}`;
            countParams.push(status);
        }

        if (form_type) {
            countParamCount++;
            countQuery += ` AND form_type = $${countParamCount}`;
            countParams.push(form_type);
        }

        const countResult = await pool.query(countQuery, countParams);

        res.json({
            success: true,
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        debugLog.error('APPROVALS', '❌ Error al obtener historial', sanitizeError(error, 'approvals'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener historial'
        });
    }
});

module.exports = router;
