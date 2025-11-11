/**
 * 🎫 SISTEMA DE TICKETS DE SOPORTE - API REST
 * Sistema completo de tickets con SLA tracking, asignación y resolución
 * Fase 3 - BGE 2025
 */

const express = require('express');
const devLogger = require('../utils/devLogger');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// ============================================
// CONFIGURACIÓN DE MULTER PARA ATTACHMENTS
// ============================================

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/tickets');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `ticket-${uniqueSuffix}-${sanitizedName}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png',
            'image/gif',
            'text/plain',
            'application/zip'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
        }
    }
});

// ============================================
// DEPARTAMENTOS
// ============================================

/**
 * GET /api/support-tickets/departments
 * Listar departamentos de soporte
 */
router.get('/departments', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query(`
            SELECT * FROM v_support_department_stats
            ORDER BY name
        `);

        res.json({
            success: true,
            departments: result.rows
        });
    } catch (error) {
        devLogger.error('Error al obtener departamentos:', error);
        res.status(500).json({ error: 'Error al obtener departamentos' });
    } finally {
        client.release();
    }
});

// ============================================
// CATEGORÍAS
// ============================================

/**
 * GET /api/support-tickets/categories
 * Listar categorías de tickets
 */
router.get('/categories', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { department_id } = req.query;

        let query = 'SELECT * FROM support_ticket_categories WHERE is_active = TRUE';
        const params = [];

        if (department_id) {
            params.push(department_id);
            query += ` AND department_id = $${params.length}`;
        }

        query += ' ORDER BY name';

        const result = await client.query(query, params);

        res.json({
            success: true,
            categories: result.rows
        });
    } catch (error) {
        devLogger.error('Error al obtener categorías:', error);
        res.status(500).json({ error: 'Error al obtener categorías' });
    } finally {
        client.release();
    }
});

// ============================================
// TICKETS - CRUD
// ============================================

/**
 * GET /api/support-tickets/tickets
 * Listar tickets con filtros y paginación
 */
router.get('/tickets', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            status,
            priority,
            category_id,
            department_id,
            assigned_to_me,
            created_by_me,
            watching,
            page = 1,
            limit = 20,
            sort_by = 'created_at',
            sort_order = 'DESC'
        } = req.query;

        const userId = req.user.id;
        const userRole = req.user.role;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM v_support_tickets_full WHERE 1=1';
        const params = [];
        let paramCount = 0;

        // Filtro por creador
        if (created_by_me === 'true') {
            paramCount++;
            query += ` AND requester_id = $${paramCount} AND requester_role = $${paramCount + 1}`;
            params.push(userId, userRole);
            paramCount++;
        }

        // Filtro por asignado
        if (assigned_to_me === 'true') {
            paramCount++;
            query += ` AND assigned_to_id = $${paramCount} AND assigned_to_role = $${paramCount + 1}`;
            params.push(userId, userRole);
            paramCount++;
        }

        // Filtro por estado
        if (status) {
            const statuses = status.split(',');
            paramCount++;
            query += ` AND status = ANY($${paramCount})`;
            params.push(statuses);
        }

        // Filtro por prioridad
        if (priority) {
            const priorities = priority.split(',');
            paramCount++;
            query += ` AND priority = ANY($${paramCount})`;
            params.push(priorities);
        }

        // Filtro por categoría
        if (category_id) {
            paramCount++;
            query += ` AND category_id = $${paramCount}`;
            params.push(category_id);
        }

        // Filtro por departamento
        if (department_id) {
            paramCount++;
            query += ` AND department_id = $${paramCount}`;
            params.push(department_id);
        }

        // Filtro por watching
        if (watching === 'true') {
            paramCount++;
            query += ` AND id IN (
                SELECT ticket_id FROM support_ticket_watchers
                WHERE user_id = $${paramCount} AND user_role = $${paramCount + 1}
            )`;
            params.push(userId, userRole);
            paramCount++;
        }

        // Ordenamiento
        const allowedSortFields = ['created_at', 'updated_at', 'priority', 'status', 'ticket_number'];
        const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
        const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // Orden especial para prioridad
        if (sortField === 'priority') {
            query += ` ORDER BY
                CASE priority
                    WHEN 'urgent' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    WHEN 'low' THEN 4
                END ${sortDirection}`;
        } else {
            query += ` ORDER BY ${sortField} ${sortDirection}`;
        }

        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(limit);

        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(offset);

        const result = await client.query(query, params);

        // Contar total
        let countQuery = 'SELECT COUNT(*) as total FROM support_tickets WHERE 1=1';
        const countParams = [];
        let countParamCount = 0;

        if (created_by_me === 'true') {
            countParamCount++;
            countQuery += ` AND requester_id = $${countParamCount} AND requester_role = $${countParamCount + 1}`;
            countParams.push(userId, userRole);
            countParamCount++;
        }

        if (assigned_to_me === 'true') {
            countParamCount++;
            countQuery += ` AND assigned_to_id = $${countParamCount} AND assigned_to_role = $${countParamCount + 1}`;
            countParams.push(userId, userRole);
            countParamCount++;
        }

        if (status) {
            const statuses = status.split(',');
            countParamCount++;
            countQuery += ` AND status = ANY($${countParamCount})`;
            countParams.push(statuses);
        }

        if (priority) {
            const priorities = priority.split(',');
            countParamCount++;
            countQuery += ` AND priority = ANY($${countParamCount})`;
            countParams.push(priorities);
        }

        if (category_id) {
            countParamCount++;
            countQuery += ` AND category_id = $${countParamCount}`;
            countParams.push(category_id);
        }

        if (department_id) {
            countParamCount++;
            countQuery += ` AND department_id = $${countParamCount}`;
            countParams.push(department_id);
        }

        if (watching === 'true') {
            countParamCount++;
            countQuery += ` AND id IN (
                SELECT ticket_id FROM support_ticket_watchers
                WHERE user_id = $${countParamCount} AND user_role = $${countParamCount + 1}
            )`;
            countParams.push(userId, userRole);
            countParamCount++;
        }

        const countResult = await client.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            tickets: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        devLogger.error('Error al obtener tickets:', error);
        res.status(500).json({ error: 'Error al obtener tickets' });
    } finally {
        client.release();
    }
});

/**
 * GET /api/support-tickets/tickets/:id
 * Obtener ticket específico con detalles completos
 */
router.get('/tickets/:id', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const result = await client.query(`
            SELECT * FROM v_support_tickets_full WHERE id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        const ticket = result.rows[0];

        // Verificar si el usuario está watching
        const watchingCheck = await client.query(`
            SELECT id FROM support_ticket_watchers
            WHERE ticket_id = $1 AND user_id = $2 AND user_role = $3
        `, [id, userId, userRole]);

        ticket.is_watching = watchingCheck.rows.length > 0;

        // Obtener comentarios
        const comments = await client.query(`
            SELECT * FROM support_ticket_comments
            WHERE ticket_id = $1 AND parent_comment_id IS NULL
            ORDER BY created_at ASC
        `, [id]);

        // Obtener respuestas para cada comentario
        for (let comment of comments.rows) {
            const replies = await client.query(`
                SELECT * FROM support_ticket_comments
                WHERE parent_comment_id = $1
                ORDER BY created_at ASC
            `, [comment.id]);
            comment.replies = replies.rows;
        }

        ticket.comments = comments.rows;

        // Obtener attachments
        const attachments = await client.query(`
            SELECT * FROM support_ticket_attachments
            WHERE ticket_id = $1
            ORDER BY created_at DESC
        `, [id]);

        ticket.attachments = attachments.rows;

        // Obtener historial
        const history = await client.query(`
            SELECT * FROM support_ticket_history
            WHERE ticket_id = $1
            ORDER BY created_at DESC
            LIMIT 50
        `, [id]);

        ticket.history = history.rows;

        res.json({
            success: true,
            ticket: ticket
        });
    } catch (error) {
        devLogger.error('Error al obtener ticket:', error);
        res.status(500).json({ error: 'Error al obtener ticket' });
    } finally {
        client.release();
    }
});

/**
 * POST /api/support-tickets/tickets
 * Crear nuevo ticket
 */
router.post('/tickets', authenticateToken, upload.array('attachments', 5), async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            subject,
            description,
            category_id,
            department_id,
            priority = 'medium'
        } = req.body;

        if (!subject || !description) {
            return res.status(400).json({
                error: 'Asunto y descripción son requeridos'
            });
        }

        const userId = req.user.id;
        const userRole = req.user.role;
        const userName = req.user.name || req.user.email;
        const userEmail = req.user.email;

        await client.query('BEGIN');

        // Crear ticket
        const ticketResult = await client.query(`
            INSERT INTO support_tickets (
                requester_id, requester_role, requester_name, requester_email,
                subject, description, category_id, department_id, priority
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [
            userId, userRole, userName, userEmail,
            subject, description, category_id, department_id, priority
        ]);

        const ticket = ticketResult.rows[0];

        // Agregar attachments si hay
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                await client.query(`
                    INSERT INTO support_ticket_attachments (
                        ticket_id, uploaded_by_id, uploaded_by_role, uploaded_by_name,
                        file_name, file_path, file_size, mime_type
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [
                    ticket.id, userId, userRole, userName,
                    file.originalname, file.path, file.size, file.mimetype
                ]);
            }
        }

        // Agregar creador como watcher
        await client.query(`
            INSERT INTO support_ticket_watchers (
                ticket_id, user_id, user_role, user_name, user_email
            ) VALUES ($1, $2, $3, $4, $5)
        `, [ticket.id, userId, userRole, userName, userEmail]);

        // Registrar en historial
        await client.query(`
            INSERT INTO support_ticket_history (
                ticket_id, changed_by_id, changed_by_role, changed_by_name,
                action, new_value
            ) VALUES ($1, $2, $3, $4, 'created', $5)
        `, [ticket.id, userId, userRole, userName, ticket.ticket_number]);

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            ticket: ticket,
            message: `Ticket ${ticket.ticket_number} creado exitosamente`
        });
    } catch (error) {
        await client.query('ROLLBACK');
        devLogger.error('Error al crear ticket:', error);

        // Eliminar archivos subidos si hubo error
        if (req.files) {
            for (const file of req.files) {
                await fs.unlink(file.path).catch(console.error);
            }
        }

        res.status(500).json({ error: 'Error al crear ticket' });
    } finally {
        client.release();
    }
});

/**
 * PUT /api/support-tickets/tickets/:id
 * Actualizar ticket
 */
router.put('/tickets/:id', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const {
            subject,
            description,
            category_id,
            department_id,
            priority,
            status
        } = req.body;

        const userId = req.user.id;
        const userRole = req.user.role;
        const userName = req.user.name || req.user.email;

        const result = await client.query(`
            UPDATE support_tickets
            SET subject = COALESCE($1, subject),
                description = COALESCE($2, description),
                category_id = COALESCE($3, category_id),
                department_id = COALESCE($4, department_id),
                priority = COALESCE($5, priority),
                status = COALESCE($6, status)
            WHERE id = $7
            RETURNING *
        `, [subject, description, category_id, department_id, priority, status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        res.json({
            success: true,
            ticket: result.rows[0]
        });
    } catch (error) {
        devLogger.error('Error al actualizar ticket:', error);
        res.status(500).json({ error: 'Error al actualizar ticket' });
    } finally {
        client.release();
    }
});

// ============================================
// ASIGNACIÓN
// ============================================

/**
 * POST /api/support-tickets/tickets/:id/assign
 * Asignar ticket a un agente
 */
router.post('/tickets/:id/assign', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { agent_id, agent_role, agent_name } = req.body;

        const userId = req.user.id;
        const userRole = req.user.role;
        const userName = req.user.name || req.user.email;

        const result = await client.query(`
            UPDATE support_tickets
            SET assigned_to_id = $1,
                assigned_to_role = $2,
                assigned_to_name = $3,
                assigned_at = CURRENT_TIMESTAMP,
                status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END
            WHERE id = $4
            RETURNING *
        `, [agent_id, agent_role, agent_name, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        // Agregar agente como watcher si no lo es
        await client.query(`
            INSERT INTO support_ticket_watchers (
                ticket_id, user_id, user_role, user_name, user_email
            ) VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (ticket_id, user_id, user_role) DO NOTHING
        `, [id, agent_id, agent_role, agent_name, '']);

        res.json({
            success: true,
            ticket: result.rows[0],
            message: `Ticket asignado a ${agent_name}`
        });
    } catch (error) {
        devLogger.error('Error al asignar ticket:', error);
        res.status(500).json({ error: 'Error al asignar ticket' });
    } finally {
        client.release();
    }
});

// ============================================
// COMENTARIOS
// ============================================

/**
 * POST /api/support-tickets/tickets/:id/comments
 * Agregar comentario a ticket
 */
router.post('/tickets/:id/comments', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { comment, is_internal = false, parent_comment_id } = req.body;

        if (!comment || comment.trim().length === 0) {
            return res.status(400).json({ error: 'El comentario no puede estar vacío' });
        }

        const userId = req.user.id;
        const userRole = req.user.role;
        const userName = req.user.name || req.user.email;

        const result = await client.query(`
            INSERT INTO support_ticket_comments (
                ticket_id, author_id, author_role, author_name,
                comment, is_internal, parent_comment_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [id, userId, userRole, userName, comment.trim(), is_internal, parent_comment_id]);

        res.status(201).json({
            success: true,
            comment: result.rows[0]
        });
    } catch (error) {
        devLogger.error('Error al crear comentario:', error);
        res.status(500).json({ error: 'Error al crear comentario' });
    } finally {
        client.release();
    }
});

/**
 * PUT /api/support-tickets/comments/:id
 * Actualizar comentario
 */
router.put('/comments/:id', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { comment } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (!comment || comment.trim().length === 0) {
            return res.status(400).json({ error: 'El comentario no puede estar vacío' });
        }

        const result = await client.query(`
            UPDATE support_ticket_comments
            SET comment = $1, is_edited = TRUE
            WHERE id = $2 AND author_id = $3 AND author_role = $4
            RETURNING *
        `, [comment.trim(), id, userId, userRole]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Comentario no encontrado o no autorizado' });
        }

        res.json({
            success: true,
            comment: result.rows[0]
        });
    } catch (error) {
        devLogger.error('Error al actualizar comentario:', error);
        res.status(500).json({ error: 'Error al actualizar comentario' });
    } finally {
        client.release();
    }
});

/**
 * DELETE /api/support-tickets/comments/:id
 * Eliminar comentario (soft delete)
 */
router.delete('/comments/:id', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const result = await client.query(`
            UPDATE support_ticket_comments
            SET is_deleted = TRUE
            WHERE id = $1 AND (author_id = $2 AND author_role = $3 OR $4 = 'admin')
            RETURNING *
        `, [id, userId, userRole, userRole]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Comentario no encontrado o no autorizado' });
        }

        res.json({
            success: true,
            message: 'Comentario eliminado'
        });
    } catch (error) {
        devLogger.error('Error al eliminar comentario:', error);
        res.status(500).json({ error: 'Error al eliminar comentario' });
    } finally {
        client.release();
    }
});

// ============================================
// ATTACHMENTS
// ============================================

/**
 * POST /api/support-tickets/tickets/:id/attachments
 * Subir archivos adjuntos
 */
router.post('/tickets/:id/attachments', authenticateToken, upload.array('files', 5), async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { comment_id } = req.body;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron archivos' });
        }

        const userId = req.user.id;
        const userRole = req.user.role;
        const userName = req.user.name || req.user.email;

        const attachments = [];

        for (const file of req.files) {
            const result = await client.query(`
                INSERT INTO support_ticket_attachments (
                    ticket_id, comment_id, uploaded_by_id, uploaded_by_role, uploaded_by_name,
                    file_name, file_path, file_size, mime_type
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `, [
                id, comment_id, userId, userRole, userName,
                file.originalname, file.path, file.size, file.mimetype
            ]);

            attachments.push(result.rows[0]);
        }

        res.status(201).json({
            success: true,
            attachments: attachments
        });
    } catch (error) {
        devLogger.error('Error al subir attachments:', error);

        // Eliminar archivos subidos si hubo error
        if (req.files) {
            for (const file of req.files) {
                await fs.unlink(file.path).catch(console.error);
            }
        }

        res.status(500).json({ error: 'Error al subir archivos' });
    } finally {
        client.release();
    }
});

// ============================================
// ESTADOS Y RESOLUCIÓN
// ============================================

/**
 * POST /api/support-tickets/tickets/:id/resolve
 * Marcar ticket como resuelto
 */
router.post('/tickets/:id/resolve', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { resolution_notes } = req.body;

        const userId = req.user.id;
        const userRole = req.user.role;
        const userName = req.user.name || req.user.email;

        const result = await client.query(`
            UPDATE support_tickets
            SET status = 'resolved',
                resolved_at = CURRENT_TIMESTAMP,
                resolved_by_id = $1,
                resolved_by_name = $2,
                resolution_notes = $3
            WHERE id = $4
            RETURNING *
        `, [userId, userName, resolution_notes, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        res.json({
            success: true,
            ticket: result.rows[0],
            message: 'Ticket marcado como resuelto'
        });
    } catch (error) {
        devLogger.error('Error al resolver ticket:', error);
        res.status(500).json({ error: 'Error al resolver ticket' });
    } finally {
        client.release();
    }
});

/**
 * POST /api/support-tickets/tickets/:id/close
 * Cerrar ticket
 */
router.post('/tickets/:id/close', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userName = req.user.name || req.user.email;

        const result = await client.query(`
            UPDATE support_tickets
            SET status = 'closed',
                closed_at = CURRENT_TIMESTAMP,
                closed_by_id = $1,
                closed_by_name = $2
            WHERE id = $3
            RETURNING *
        `, [userId, userName, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        res.json({
            success: true,
            ticket: result.rows[0],
            message: 'Ticket cerrado'
        });
    } catch (error) {
        devLogger.error('Error al cerrar ticket:', error);
        res.status(500).json({ error: 'Error al cerrar ticket' });
    } finally {
        client.release();
    }
});

/**
 * POST /api/support-tickets/tickets/:id/reopen
 * Reabrir ticket
 */
router.post('/tickets/:id/reopen', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        const result = await client.query(`
            UPDATE support_tickets
            SET status = 'reopened',
                reopened_count = reopened_count + 1,
                resolved_at = NULL,
                closed_at = NULL
            WHERE id = $1
            RETURNING *
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        res.json({
            success: true,
            ticket: result.rows[0],
            message: 'Ticket reabierto'
        });
    } catch (error) {
        devLogger.error('Error al reabrir ticket:', error);
        res.status(500).json({ error: 'Error al reabrir ticket' });
    } finally {
        client.release();
    }
});

// ============================================
// WATCHERS
// ============================================

/**
 * POST /api/support-tickets/tickets/:id/watch
 * Seguir ticket
 */
router.post('/tickets/:id/watch', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;
        const userName = req.user.name || req.user.email;
        const userEmail = req.user.email;

        await client.query(`
            INSERT INTO support_ticket_watchers (
                ticket_id, user_id, user_role, user_name, user_email
            ) VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (ticket_id, user_id, user_role) DO NOTHING
        `, [id, userId, userRole, userName, userEmail]);

        res.json({
            success: true,
            message: 'Ahora estás siguiendo este ticket'
        });
    } catch (error) {
        devLogger.error('Error al seguir ticket:', error);
        res.status(500).json({ error: 'Error al seguir ticket' });
    } finally {
        client.release();
    }
});

/**
 * DELETE /api/support-tickets/tickets/:id/watch
 * Dejar de seguir ticket
 */
router.delete('/tickets/:id/watch', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        await client.query(`
            DELETE FROM support_ticket_watchers
            WHERE ticket_id = $1 AND user_id = $2 AND user_role = $3
        `, [id, userId, userRole]);

        res.json({
            success: true,
            message: 'Has dejado de seguir este ticket'
        });
    } catch (error) {
        devLogger.error('Error al dejar de seguir ticket:', error);
        res.status(500).json({ error: 'Error al dejar de seguir ticket' });
    } finally {
        client.release();
    }
});

// ============================================
// BÚSQUEDA
// ============================================

/**
 * GET /api/support-tickets/search
 * Búsqueda full-text de tickets
 */
router.get('/search', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { q, page = 1, limit = 20 } = req.query;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({ error: 'Se requiere un término de búsqueda' });
        }

        const offset = (page - 1) * limit;

        const result = await client.query(`
            SELECT *,
                   ts_rank(to_tsvector('spanish', subject || ' ' || description),
                          plainto_tsquery('spanish', $1)) as rank
            FROM v_support_tickets_full
            WHERE to_tsvector('spanish', subject || ' ' || description)
                  @@ plainto_tsquery('spanish', $1)
            ORDER BY rank DESC, created_at DESC
            LIMIT $2 OFFSET $3
        `, [q.trim(), limit, offset]);

        const countResult = await client.query(`
            SELECT COUNT(*) as total
            FROM support_tickets
            WHERE to_tsvector('spanish', subject || ' ' || description)
                  @@ plainto_tsquery('spanish', $1)
        `, [q.trim()]);

        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            query: q,
            tickets: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        devLogger.error('Error en búsqueda:', error);
        res.status(500).json({ error: 'Error en búsqueda' });
    } finally {
        client.release();
    }
});

// ============================================
// ESTADÍSTICAS
// ============================================

/**
 * GET /api/support-tickets/stats
 * Estadísticas generales del sistema
 */
router.get('/stats', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const stats = {};

        // Estadísticas por estado
        const statusStats = await client.query(`
            SELECT status, COUNT(*) as count
            FROM support_tickets
            GROUP BY status
        `);
        stats.by_status = statusStats.rows;

        // Estadísticas por prioridad
        const priorityStats = await client.query(`
            SELECT priority, COUNT(*) as count
            FROM support_tickets
            GROUP BY priority
        `);
        stats.by_priority = priorityStats.rows;

        // Tickets vencidos SLA
        const slaOverdue = await client.query(`
            SELECT COUNT(*) as count
            FROM v_support_tickets_full
            WHERE response_sla_overdue = TRUE OR resolution_sla_overdue = TRUE
        `);
        stats.sla_overdue = parseInt(slaOverdue.rows[0].count);

        // Promedios
        const averages = await client.query(`
            SELECT
                AVG(hours_to_resolution) as avg_resolution_hours,
                AVG(hours_to_first_response) as avg_response_hours,
                AVG(satisfaction_rating) as avg_satisfaction
            FROM v_support_tickets_full
            WHERE resolved_at IS NOT NULL
        `);
        stats.averages = averages.rows[0];

        // Tickets por departamento
        const deptStats = await client.query(`
            SELECT * FROM v_support_department_stats
            ORDER BY total_tickets DESC
        `);
        stats.by_department = deptStats.rows;

        res.json({
            success: true,
            stats: stats
        });
    } catch (error) {
        devLogger.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    } finally {
        client.release();
    }
});

/**
 * GET /api/support-tickets/my-stats
 * Estadísticas del usuario actual
 */
router.get('/my-stats', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        const stats = {};

        // Tickets creados
        const created = await client.query(`
            SELECT COUNT(*) as count
            FROM support_tickets
            WHERE requester_id = $1 AND requester_role = $2
        `, [userId, userRole]);
        stats.created = parseInt(created.rows[0].count);

        // Tickets asignados
        const assigned = await client.query(`
            SELECT COUNT(*) as count
            FROM support_tickets
            WHERE assigned_to_id = $1 AND assigned_to_role = $2
            AND status NOT IN ('closed', 'resolved')
        `, [userId, userRole]);
        stats.assigned = parseInt(assigned.rows[0].count);

        // Tickets watching
        const watching = await client.query(`
            SELECT COUNT(*) as count
            FROM support_ticket_watchers
            WHERE user_id = $1 AND user_role = $2
        `, [userId, userRole]);
        stats.watching = parseInt(watching.rows[0].count);

        res.json({
            success: true,
            stats: stats
        });
    } catch (error) {
        devLogger.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    } finally {
        client.release();
    }
});

// ============================================
// CALIFICACIÓN DE SATISFACCIÓN
// ============================================

/**
 * POST /api/support-tickets/tickets/:id/rate
 * Calificar ticket resuelto
 */
router.post('/tickets/:id/rate', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'La calificación debe estar entre 1 y 5' });
        }

        // Verificar que el usuario es el requester
        const ticketCheck = await client.query(`
            SELECT requester_id, requester_role
            FROM support_tickets
            WHERE id = $1
        `, [id]);

        if (ticketCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        const ticket = ticketCheck.rows[0];

        if (ticket.requester_id !== userId || ticket.requester_role !== userRole) {
            return res.status(403).json({ error: 'Solo el creador del ticket puede calificarlo' });
        }

        const result = await client.query(`
            UPDATE support_tickets
            SET satisfaction_rating = $1,
                satisfaction_comment = $2
            WHERE id = $3
            RETURNING *
        `, [rating, comment, id]);

        res.json({
            success: true,
            ticket: result.rows[0],
            message: 'Calificación registrada'
        });
    } catch (error) {
        devLogger.error('Error al calificar ticket:', error);
        res.status(500).json({ error: 'Error al calificar ticket' });
    } finally {
        client.release();
    }
});

module.exports = router;
