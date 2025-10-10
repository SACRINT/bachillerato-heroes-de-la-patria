/**
 * 👨‍👩‍👧‍👦 RUTAS DE COMUNICACIÓN PADRES-DOCENTES
 * APIs para mensajería, citas y reportes académicos
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authenticateToken, requireAdmin, requireTeacher } = require('../middleware/auth');
const { logger } = require('../middleware/logger');
const router = express.Router();

// Obtener servicio de comunicación padres-docentes
function getParentTeacherService() {
    try {
        const { getParentTeacherCommunicationService } = require('../services/parentTeacherCommunicationService');
        return getParentTeacherCommunicationService();
    } catch (error) {
        console.error('❌ Error obteniendo servicio de comunicación:', error.message);
        return null;
    }
}

// ============================================
// GESTIÓN DE CONVERSACIONES
// ============================================

/**
 * @swagger
 * /api/parent-teacher/conversations:
 *   get:
 *     summary: Obtener conversaciones del usuario
 *     tags: [Comunicación Padres-Docentes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de conversaciones obtenida exitosamente
 */
router.get('/conversations', authenticateToken, async (req, res) => {
    try {
        const service = getParentTeacherService();
        if (!service) {
            return res.status(503).json({
                success: false,
                message: 'Servicio de comunicación no disponible'
            });
        }

        const conversations = await service.getConversations(req.user.userId, req.user.userType);

        res.json({
            success: true,
            message: 'Conversaciones obtenidas exitosamente',
            data: {
                conversations,
                total: conversations.length
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo conversaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo conversaciones',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/parent-teacher/conversations:
 *   post:
 *     summary: Crear nueva conversación
 *     tags: [Comunicación Padres-Docentes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - student_id
 *               - teacher_id
 *             properties:
 *               student_id:
 *                 type: string
 *               teacher_id:
 *                 type: string
 *               subject:
 *                 type: string
 *     responses:
 *       201:
 *         description: Conversación creada exitosamente
 */
router.post('/conversations', authenticateToken, [
    body('student_id').notEmpty().withMessage('ID de estudiante requerido'),
    body('teacher_id').notEmpty().withMessage('ID de profesor requerido'),
    body('subject').optional().isString().withMessage('Materia debe ser una cadena válida')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const service = getParentTeacherService();
        if (!service) {
            return res.status(503).json({
                success: false,
                message: 'Servicio de comunicación no disponible'
            });
        }

        const { student_id, teacher_id, subject } = req.body;

        // Obtener nombres de usuario (en sistema real vendría de base de datos)
        const userData = {
            student_id,
            student_name: 'Estudiante', // TODO: Obtener nombre real
            parent_id: req.user.userId,
            parent_name: req.user.name || 'Padre de Familia',
            teacher_id,
            teacher_name: 'Profesor', // TODO: Obtener nombre real
            subject: subject || 'General'
        };

        const conversation = await service.createConversation(userData);

        res.status(201).json({
            success: true,
            message: 'Conversación creada exitosamente',
            data: conversation
        });

    } catch (error) {
        console.error('❌ Error creando conversación:', error);
        res.status(500).json({
            success: false,
            message: 'Error creando conversación',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/parent-teacher/conversations/{conversationId}:
 *   get:
 *     summary: Obtener detalles de una conversación
 *     tags: [Comunicación Padres-Docentes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversación obtenida exitosamente
 */
router.get('/conversations/:conversationId', authenticateToken, async (req, res) => {
    try {
        const service = getParentTeacherService();
        if (!service) {
            return res.status(503).json({
                success: false,
                message: 'Servicio de comunicación no disponible'
            });
        }

        const { conversationId } = req.params;
        const conversation = await service.getConversationById(conversationId);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversación no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Conversación obtenida exitosamente',
            data: conversation
        });

    } catch (error) {
        console.error('❌ Error obteniendo conversación:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo conversación',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ============================================
// GESTIÓN DE MENSAJES
// ============================================

/**
 * @swagger
 * /api/parent-teacher/messages:
 *   post:
 *     summary: Enviar mensaje
 *     tags: [Comunicación Padres-Docentes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversation_id
 *               - content
 *               - recipient_id
 *               - recipient_type
 *             properties:
 *               conversation_id:
 *                 type: string
 *               content:
 *                 type: string
 *               recipient_id:
 *                 type: string
 *               recipient_type:
 *                 type: string
 *                 enum: [parent, teacher, student]
 *     responses:
 *       201:
 *         description: Mensaje enviado exitosamente
 */
router.post('/messages', authenticateToken, [
    body('conversation_id').notEmpty().withMessage('ID de conversación requerido'),
    body('content').notEmpty().withMessage('Contenido del mensaje requerido'),
    body('recipient_id').notEmpty().withMessage('ID del destinatario requerido'),
    body('recipient_type').isIn(['parent', 'teacher', 'student']).withMessage('Tipo de destinatario inválido')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const service = getParentTeacherService();
        if (!service) {
            return res.status(503).json({
                success: false,
                message: 'Servicio de comunicación no disponible'
            });
        }

        const messageData = {
            ...req.body,
            sender_id: req.user.userId,
            sender_type: req.user.userType,
            sender_name: req.user.name || 'Usuario'
        };

        const message = await service.sendMessage(messageData);

        // Enviar notificación en tiempo real si WebSocket está disponible
        try {
            const { getWebSocketService } = require('../services/webSocketService');
            const wsService = getWebSocketService();

            if (wsService) {
                wsService.sendToUser(req.body.recipient_id, {
                    type: 'new_message',
                    data: {
                        message_id: message.id,
                        conversation_id: message.conversation_id,
                        sender_name: message.sender_name,
                        content: message.content,
                        timestamp: message.timestamp
                    }
                });
            }
        } catch (wsError) {
            console.log('⚠️ WebSocket no disponible para notificación de mensaje');
        }

        res.status(201).json({
            success: true,
            message: 'Mensaje enviado exitosamente',
            data: message
        });

    } catch (error) {
        console.error('❌ Error enviando mensaje:', error);
        res.status(500).json({
            success: false,
            message: 'Error enviando mensaje',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/parent-teacher/conversations/{conversationId}/messages:
 *   get:
 *     summary: Obtener mensajes de una conversación
 *     tags: [Comunicación Padres-Docentes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *     responses:
 *       200:
 *         description: Mensajes obtenidos exitosamente
 */
router.get('/conversations/:conversationId/messages', authenticateToken, [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe ser entre 1 y 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset debe ser mayor o igual a 0')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const service = getParentTeacherService();
        if (!service) {
            return res.status(503).json({
                success: false,
                message: 'Servicio de comunicación no disponible'
            });
        }

        const { conversationId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const messages = await service.getMessages(conversationId, parseInt(limit), parseInt(offset));

        // Marcar mensajes como leídos
        await service.markConversationAsRead(conversationId, req.user.userId);

        res.json({
            success: true,
            message: 'Mensajes obtenidos exitosamente',
            data: {
                messages,
                total: messages.length,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo mensajes:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo mensajes',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ============================================
// GESTIÓN DE CITAS
// ============================================

/**
 * @swagger
 * /api/parent-teacher/appointments:
 *   get:
 *     summary: Obtener citas del usuario
 *     tags: [Comunicación Padres-Docentes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, completed, cancelled]
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Citas obtenidas exitosamente
 */
router.get('/appointments', authenticateToken, [
    query('status').optional().isIn(['scheduled', 'completed', 'cancelled']).withMessage('Estado inválido'),
    query('date_from').optional().isISO8601().withMessage('Fecha desde inválida'),
    query('date_to').optional().isISO8601().withMessage('Fecha hasta inválida')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const service = getParentTeacherService();
        if (!service) {
            return res.status(503).json({
                success: false,
                message: 'Servicio de comunicación no disponible'
            });
        }

        const filters = {};
        if (req.query.status) filters.status = req.query.status;
        if (req.query.date_from) filters.date_from = req.query.date_from;
        if (req.query.date_to) filters.date_to = req.query.date_to;

        const appointments = await service.getAppointments(req.user.userId, req.user.userType, filters);

        res.json({
            success: true,
            message: 'Citas obtenidas exitosamente',
            data: {
                appointments,
                total: appointments.length,
                filters_applied: filters
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo citas:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo citas',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/parent-teacher/appointments:
 *   post:
 *     summary: Programar nueva cita
 *     tags: [Comunicación Padres-Docentes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - student_id
 *               - teacher_id
 *               - appointment_date
 *             properties:
 *               student_id:
 *                 type: string
 *               teacher_id:
 *                 type: string
 *               appointment_date:
 *                 type: string
 *                 format: date-time
 *               duration_minutes:
 *                 type: integer
 *               meeting_type:
 *                 type: string
 *                 enum: [virtual, presencial]
 *               agenda:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cita programada exitosamente
 */
router.post('/appointments', authenticateToken, [
    body('student_id').notEmpty().withMessage('ID de estudiante requerido'),
    body('teacher_id').notEmpty().withMessage('ID de profesor requerido'),
    body('appointment_date').isISO8601().withMessage('Fecha de cita inválida'),
    body('duration_minutes').optional().isInt({ min: 15, max: 120 }).withMessage('Duración debe ser entre 15 y 120 minutos'),
    body('meeting_type').optional().isIn(['virtual', 'presencial']).withMessage('Tipo de reunión inválido'),
    body('agenda').optional().isString().withMessage('Agenda debe ser una cadena válida')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const service = getParentTeacherService();
        if (!service) {
            return res.status(503).json({
                success: false,
                message: 'Servicio de comunicación no disponible'
            });
        }

        // Verificar que la fecha sea futura
        const appointmentDate = new Date(req.body.appointment_date);
        if (appointmentDate <= new Date()) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de la cita debe ser futura'
            });
        }

        const appointmentData = {
            ...req.body,
            parent_id: req.user.userId,
            parent_name: req.user.name || 'Padre de Familia',
            student_name: 'Estudiante', // TODO: Obtener nombre real
            teacher_name: 'Profesor', // TODO: Obtener nombre real
            subject: req.body.subject || 'General'
        };

        // Generar link de reunión virtual si es necesario
        if (req.body.meeting_type === 'virtual') {
            appointmentData.meeting_link = `https://meet.google.com/${Math.random().toString(36).substring(7)}`;
        }

        const appointment = await service.scheduleAppointment(appointmentData);

        res.status(201).json({
            success: true,
            message: 'Cita programada exitosamente',
            data: appointment
        });

    } catch (error) {
        console.error('❌ Error programando cita:', error);
        res.status(500).json({
            success: false,
            message: 'Error programando cita',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/parent-teacher/appointments/{appointmentId}:
 *   put:
 *     summary: Actualizar cita
 *     tags: [Comunicación Padres-Docentes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cita actualizada exitosamente
 */
router.put('/appointments/:appointmentId', authenticateToken, async (req, res) => {
    try {
        const service = getParentTeacherService();
        if (!service) {
            return res.status(503).json({
                success: false,
                message: 'Servicio de comunicación no disponible'
            });
        }

        const { appointmentId } = req.params;
        const updates = req.body;

        const appointment = await service.updateAppointment(appointmentId, updates);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Cita actualizada exitosamente',
            data: appointment
        });

    } catch (error) {
        console.error('❌ Error actualizando cita:', error);
        res.status(500).json({
            success: false,
            message: 'Error actualizando cita',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/parent-teacher/appointments/{appointmentId}/cancel:
 *   post:
 *     summary: Cancelar cita
 *     tags: [Comunicación Padres-Docentes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cita cancelada exitosamente
 */
router.post('/appointments/:appointmentId/cancel', authenticateToken, async (req, res) => {
    try {
        const service = getParentTeacherService();
        if (!service) {
            return res.status(503).json({
                success: false,
                message: 'Servicio de comunicación no disponible'
            });
        }

        const { appointmentId } = req.params;
        const appointment = await service.cancelAppointment(appointmentId, req.user.userId);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Cita cancelada exitosamente',
            data: appointment
        });

    } catch (error) {
        console.error('❌ Error cancelando cita:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelando cita',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ============================================
// REPORTES ACADÉMICOS
// ============================================

/**
 * @swagger
 * /api/parent-teacher/reports:
 *   get:
 *     summary: Obtener reportes académicos
 *     tags: [Comunicación Padres-Docentes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *       - in: query
 *         name: report_type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reportes obtenidos exitosamente
 */
router.get('/reports', authenticateToken, async (req, res) => {
    try {
        const service = getParentTeacherService();
        if (!service) {
            return res.status(503).json({
                success: false,
                message: 'Servicio de comunicación no disponible'
            });
        }

        const filters = {};
        if (req.query.subject) filters.subject = req.query.subject;
        if (req.query.period) filters.period = req.query.period;
        if (req.query.report_type) filters.report_type = req.query.report_type;

        const reports = await service.getAcademicReports(req.user.userId, req.user.userType, filters);

        res.json({
            success: true,
            message: 'Reportes obtenidos exitosamente',
            data: {
                reports,
                total: reports.length,
                filters_applied: filters
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo reportes:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo reportes',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/parent-teacher/reports:
 *   post:
 *     summary: Crear reporte académico (solo profesores)
 *     tags: [Comunicación Padres-Docentes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Reporte creado exitosamente
 */
router.post('/reports', authenticateToken, requireTeacher, [
    body('student_id').notEmpty().withMessage('ID de estudiante requerido'),
    body('subject').notEmpty().withMessage('Materia requerida'),
    body('period').notEmpty().withMessage('Período requerido'),
    body('content').notEmpty().withMessage('Contenido del reporte requerido')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const service = getParentTeacherService();
        if (!service) {
            return res.status(503).json({
                success: false,
                message: 'Servicio de comunicación no disponible'
            });
        }

        const reportData = {
            ...req.body,
            teacher_id: req.user.userId,
            teacher_name: req.user.name || 'Profesor',
            student_name: 'Estudiante' // TODO: Obtener nombre real
        };

        const report = await service.createAcademicReport(reportData);

        res.status(201).json({
            success: true,
            message: 'Reporte académico creado exitosamente',
            data: report
        });

    } catch (error) {
        console.error('❌ Error creando reporte:', error);
        res.status(500).json({
            success: false,
            message: 'Error creando reporte',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ============================================
// ESTADÍSTICAS Y RESUMEN
// ============================================

/**
 * @swagger
 * /api/parent-teacher/stats:
 *   get:
 *     summary: Obtener estadísticas de comunicación
 *     tags: [Comunicación Padres-Docentes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 */
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const service = getParentTeacherService();
        if (!service) {
            return res.status(503).json({
                success: false,
                message: 'Servicio de comunicación no disponible'
            });
        }

        const stats = await service.getCommunicationStats(req.user.userId, req.user.userType);

        res.json({
            success: true,
            message: 'Estadísticas obtenidas exitosamente',
            data: stats
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo estadísticas',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/parent-teacher/upcoming-appointments:
 *   get:
 *     summary: Obtener próximas citas
 *     tags: [Comunicación Padres-Docentes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 30
 *     responses:
 *       200:
 *         description: Próximas citas obtenidas exitosamente
 */
router.get('/upcoming-appointments', authenticateToken, [
    query('days').optional().isInt({ min: 1, max: 30 }).withMessage('Días debe ser entre 1 y 30')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const service = getParentTeacherService();
        if (!service) {
            return res.status(503).json({
                success: false,
                message: 'Servicio de comunicación no disponible'
            });
        }

        const { days = 7 } = req.query;
        const appointments = await service.getUpcomingAppointments(req.user.userId, req.user.userType, parseInt(days));

        res.json({
            success: true,
            message: 'Próximas citas obtenidas exitosamente',
            data: {
                appointments,
                total: appointments.length,
                days_ahead: parseInt(days)
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo próximas citas:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo próximas citas',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ============================================
// MANEJO DE ERRORES
// ============================================

router.use((error, req, res, next) => {
    console.error('❌ Error en rutas de comunicación padres-docentes:', error);

    res.status(500).json({
        success: false,
        message: 'Error interno en el sistema de comunicación',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
});

module.exports = router;