/**
 * ✅ API DE APROBACIONES ADMINISTRATIVAS - PostgreSQL
 * Sistema de moderación para formularios que requieren aprobación manual
 * Fecha: 17 Octubre 2025
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const verificationService = require('../services/verificationService');

// =====================================================
// GET /api/approvals/pending - Listar solicitudes pendientes
// =====================================================
router.get('/pending', async (req, res) => {
    const { form_type, limit = 50, offset = 0 } = req.query;

    try {
        let query = `
            SELECT
                id,
                form_type,
                submission_data,
                status,
                email_verified,
                verification_email,
                created_at,
                verified_at
            FROM pending_submissions
            WHERE status = 'pending' AND email_verified = true
        `;

        const params = [];

        if (form_type) {
            query += ' AND form_type = $1';
            params.push(form_type);
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Contar total
        let countQuery = `
            SELECT COUNT(*)
            FROM pending_submissions
            WHERE status = 'pending' AND email_verified = true
        `;
        const countParams = [];

        if (form_type) {
            countQuery += ' AND form_type = $1';
            countParams.push(form_type);
        }

        const countResult = await pool.query(countQuery, countParams);

        // Parsear submission_data de cada fila
        const submissions = result.rows.map(row => ({
            id: row.id,
            form_type: row.form_type,
            data: row.submission_data,
            status: row.status,
            email_verified: row.email_verified,
            verification_email: row.verification_email,
            created_at: row.created_at,
            verified_at: row.verified_at
        }));

        res.json({
            success: true,
            data: submissions,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('❌ Error al obtener solicitudes pendientes:', error);
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
            FROM pending_submissions;
        `;

        const result = await pool.query(query);

        // Estadísticas por tipo de formulario
        const typeQuery = `
            SELECT form_type, status, COUNT(*) as cantidad
            FROM pending_submissions
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
        console.error('❌ Error al obtener estadísticas:', error);
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
        const getQuery = 'SELECT * FROM pending_submissions WHERE id = $1 AND status = \'pending\'';
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

        console.log(`📋 Aprobando solicitud ${id} de tipo: ${formType}`);

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
                console.log(`✅ Guardado en bolsa_trabajo_cv con ID: ${finalTableId}`);

            } catch (error) {
                console.error('❌ Error al guardar en bolsa_trabajo_cv:', error);
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
                console.log(`✅ Guardado en egresados con ID: ${finalTableId}`);

            } catch (error) {
                console.error('❌ Error al guardar en egresados:', error);
            }
        }

        // Actualizar estado en pending_submissions
        const updateQuery = `
            UPDATE pending_submissions
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
            console.log(`📧 Email de aprobación enviado a: ${record.verification_email}`);

        } catch (emailError) {
            console.error('❌ Error al enviar email de aprobación:', emailError);
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
        console.error('❌ Error al aprobar solicitud:', error);
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
        const getQuery = 'SELECT * FROM pending_submissions WHERE id = $1 AND status = \'pending\'';
        const submission = await pool.query(getQuery, [id]);

        if (submission.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Solicitud no encontrada o ya fue procesada'
            });
        }

        const record = submission.rows[0];

        // Actualizar estado en pending_submissions
        const updateQuery = `
            UPDATE pending_submissions
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

        console.log(`❌ Solicitud ${id} rechazada por: ${reviewed_by || 'Administrador'}`);

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
            console.log(`📧 Email de rechazo enviado a: ${record.verification_email}`);

        } catch (emailError) {
            console.error('❌ Error al enviar email de rechazo:', emailError);
        }

        res.json({
            success: true,
            message: 'Solicitud rechazada',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error al rechazar solicitud:', error);
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
        let query = 'SELECT * FROM pending_submissions WHERE status != \'pending\'';
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
        let countQuery = 'SELECT COUNT(*) FROM pending_submissions WHERE status != \'pending\'';
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
        console.error('❌ Error al obtener historial:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener historial'
        });
    }
});

module.exports = router;
