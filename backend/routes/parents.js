/**
 * API REST - PORTAL DE PADRES DE FAMILIA
 * BGE Héroes de la Patria
 * Fecha: 19 de Octubre, 2025
 *
 * Endpoints para gestión del portal de padres que incluye:
 * - Autenticación de padres
 * - Consulta de información de estudiantes (hijos)
 * - Visualización de calificaciones
 * - Seguimiento de asistencia
 * - Consulta de pagos
 * - Sistema de notificaciones
 * - Mensajería bidireccional
 */

const express = require('express');
const devLogger = require('../utils/devLogger');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ============================================
// ENDPOINTS ADMINISTRATIVOS (CRUD)
// ============================================

/**
 * GET /api/parents
 * Obtiene lista de todos los padres (admin only)
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    const client = await pool.connect();

    try {
        devLogger.log('👨‍👩‍👧 [PARENTS] Obteniendo lista de padres...');

        const query = `
            SELECT
                p.id,
                p.nombre,
                p.email,
                p.student_id,
                p.created_at,
                p.updated_at
            FROM parents p
            ORDER BY p.created_at DESC
        `;

        const result = await client.query(query);

        devLogger.log(`✅ [PARENTS] ${result.rows.length} padres encontrados`);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });

    } catch (error) {
        devLogger.error('❌ [PARENTS] Error obteniendo padres:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener padres',
            message: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * POST /api/parents
 * Crea un nuevo padre (admin only)
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    const client = await pool.connect();

    try {
        const { nombre, email, password, student_id } = req.body;

        devLogger.log('👨‍👩‍👧 [PARENTS] Creando nuevo padre...');

        // Validaciones
        if (!nombre || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, email y contraseña son requeridos'
            });
        }

        // Verificar si el email ya existe
        const emailCheck = await client.query(
            'SELECT id FROM parents WHERE email = $1',
            [email.toLowerCase()]
        );

        if (emailCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Hash de la contraseña
        const password_hash = await bcrypt.hash(password, 10);

        // Insertar padre
        const insertQuery = `
            INSERT INTO parents (nombre, email, password_hash, student_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            RETURNING id, nombre, email, student_id, created_at
        `;

        const result = await client.query(insertQuery, [
            nombre,
            email.toLowerCase(),
            password_hash,
            student_id || null
        ]);

        const parent = result.rows[0];

        devLogger.log(`✅ [PARENTS] Padre creado con ID: ${parent.id}`);

        res.status(201).json({
            success: true,
            message: 'Padre creado exitosamente',
            data: parent
        });

    } catch (error) {
        devLogger.error('❌ [PARENTS] Error creando padre:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear padre',
            error: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * PUT /api/parents/:id
 * Actualiza un padre existente (admin only)
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    const client = await pool.connect();

    try {
        const parentId = parseInt(req.params.id);
        const { nombre, email, password, student_id } = req.body;

        devLogger.log(`👨‍👩‍👧 [PARENTS] Actualizando padre ID: ${parentId}`);

        // Verificar que el padre existe
        const existsCheck = await client.query(
            'SELECT id FROM parents WHERE id = $1',
            [parentId]
        );

        if (existsCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Padre no encontrado'
            });
        }

        // Preparar campos a actualizar
        const updates = [];
        const values = [];
        let valueIndex = 1;

        if (nombre) {
            updates.push(`nombre = $${valueIndex++}`);
            values.push(nombre);
        }

        if (email) {
            // Verificar que el email no esté en uso por otro padre
            const emailCheck = await client.query(
                'SELECT id FROM parents WHERE email = $1 AND id != $2',
                [email.toLowerCase(), parentId]
            );

            if (emailCheck.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'El email ya está en uso'
                });
            }

            updates.push(`email = $${valueIndex++}`);
            values.push(email.toLowerCase());
        }

        if (password) {
            const password_hash = await bcrypt.hash(password, 10);
            updates.push(`password_hash = $${valueIndex++}`);
            values.push(password_hash);
        }

        if (student_id !== undefined) {
            updates.push(`student_id = $${valueIndex++}`);
            values.push(student_id || null);
        }

        updates.push(`updated_at = NOW()`);

        // Construir y ejecutar query
        values.push(parentId);
        const updateQuery = `
            UPDATE parents
            SET ${updates.join(', ')}
            WHERE id = $${valueIndex}
            RETURNING id, nombre, email, student_id, updated_at
        `;

        const result = await client.query(updateQuery, values);
        const parent = result.rows[0];

        devLogger.log(`✅ [PARENTS] Padre actualizado: ${parent.id}`);

        res.json({
            success: true,
            message: 'Padre actualizado exitosamente',
            data: parent
        });

    } catch (error) {
        devLogger.error('❌ [PARENTS] Error actualizando padre:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar padre',
            error: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * DELETE /api/parents/:id
 * Elimina un padre (admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    const client = await pool.connect();

    try {
        const parentId = parseInt(req.params.id);

        devLogger.log(`👨‍👩‍👧 [PARENTS] Eliminando padre ID: ${parentId}`);

        // Verificar que el padre existe
        const existsCheck = await client.query(
            'SELECT id FROM parents WHERE id = $1',
            [parentId]
        );

        if (existsCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Padre no encontrado'
            });
        }

        // Eliminar padre
        await client.query('DELETE FROM parents WHERE id = $1', [parentId]);

        devLogger.log(`✅ [PARENTS] Padre eliminado: ${parentId}`);

        res.json({
            success: true,
            message: 'Padre eliminado exitosamente'
        });

    } catch (error) {
        devLogger.error('❌ [PARENTS] Error eliminando padre:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar padre',
            error: error.message
        });
    } finally {
        client.release();
    }
});

// ============================================
// AUTENTICACIÓN DE PADRES
// ============================================

/**
 * POST /api/parents/auth/login
 * Autenticación de padres
 */
router.post('/auth/login', async (req, res) => {
    const client = await pool.connect();

    try {
        const { email, password } = req.body;

        // Validaciones
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email y contraseña son requeridos'
            });
        }

        // Buscar padre
        const parentQuery = `
            SELECT id, nombre_completo, email, password_hash, activo, email_verified
            FROM parents
            WHERE email = $1
        `;
        const result = await client.query(parentQuery, [email.toLowerCase()]);

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }

        const parent = result.rows[0];

        // Verificar estado
        if (!parent.activo) {
            return res.status(403).json({
                success: false,
                error: 'Cuenta desactivada. Contacte al administrador'
            });
        }

        if (!parent.email_verified) {
            return res.status(403).json({
                success: false,
                error: 'Email no verificado. Revise su correo electrónico'
            });
        }

        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, parent.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }

        // Actualizar último login
        await client.query(
            'UPDATE parents SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [parent.id]
        );

        // Generar JWT
        const token = jwt.sign(
            {
                id: parent.id,
                email: parent.email,
                role: 'parent'
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            data: {
                token,
                parent: {
                    id: parent.id,
                    nombre: parent.nombre_completo,
                    email: parent.email
                }
            }
        });

    } catch (error) {
        devLogger.error('Error en login de padres:', error);
        res.status(500).json({
            success: false,
            error: 'Error al procesar login'
        });
    } finally {
        client.release();
    }
});

/**
 * POST /api/parents/auth/register
 * Registro de nuevos padres
 */
router.post('/auth/register', async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            nombre,
            apellido_paterno,
            apellido_materno,
            email,
            password,
            telefono,
            parentesco
        } = req.body;

        // Validaciones
        if (!nombre || !apellido_paterno || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Datos incompletos'
            });
        }

        // Verificar si email ya existe
        const existsQuery = 'SELECT id FROM parents WHERE email = $1';
        const exists = await client.query(existsQuery, [email.toLowerCase()]);

        if (exists.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'El email ya está registrado'
            });
        }

        // Hash de contraseña
        const password_hash = await bcrypt.hash(password, 10);

        // Generar token de verificación
        const verification_token = require('crypto').randomBytes(32).toString('hex');

        // Insertar padre
        const insertQuery = `
            INSERT INTO parents (
                nombre, apellido_paterno, apellido_materno, email, password_hash,
                telefono, parentesco, verification_token
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, nombre_completo, email
        `;

        const result = await client.query(insertQuery, [
            nombre,
            apellido_paterno,
            apellido_materno || null,
            email.toLowerCase(),
            password_hash,
            telefono || null,
            parentesco || 'tutor',
            verification_token
        ]);

        const parent = result.rows[0];

        // TODO: Enviar email de verificación

        res.status(201).json({
            success: true,
            message: 'Registro exitoso. Revise su email para verificar su cuenta',
            data: {
                id: parent.id,
                nombre: parent.nombre_completo,
                email: parent.email
            }
        });

    } catch (error) {
        devLogger.error('Error en registro de padres:', error);
        res.status(500).json({
            success: false,
            error: 'Error al procesar registro'
        });
    } finally {
        client.release();
    }
});

// ============================================
// DASHBOARD DE PADRES
// ============================================

/**
 * GET /api/parents/dashboard
 * Obtiene resumen del dashboard del padre
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const parentId = req.user.id;

        // Obtener hijos del padre
        const studentsQuery = `
            SELECT
                s.id,
                s.matricula,
                s.nombre_completo,
                s.grado,
                s.grupo,
                s.turno,
                s.especialidad,
                ps.tipo_relacion
            FROM students s
            INNER JOIN parents_students ps ON s.id = ps.student_id
            WHERE ps.parent_id = $1
            AND ps.activo = TRUE
            AND s.activo = TRUE
            ORDER BY s.grado DESC, s.nombre_completo
        `;
        const studentsResult = await client.query(studentsQuery, [parentId]);

        // Obtener notificaciones no leídas
        const notificationsQuery = `
            SELECT COUNT(*) as count
            FROM parent_notifications
            WHERE parent_id = $1
            AND leida = FALSE
            AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
        `;
        const notificationsResult = await client.query(notificationsQuery, [parentId]);

        // Obtener mensajes no leídos
        const messagesQuery = `
            SELECT COUNT(*) as count
            FROM parent_messages
            WHERE parent_id = $1
            AND leido = FALSE
            AND tipo = 'saliente'
        `;
        const messagesResult = await client.query(messagesQuery, [parentId]);

        // Obtener pagos pendientes
        const paymentsQuery = `
            SELECT COUNT(*) as count, SUM(monto) as total
            FROM payments
            WHERE student_id IN (
                SELECT student_id FROM parents_students
                WHERE parent_id = $1 AND activo = TRUE
            )
            AND estatus = 'pendiente'
        `;
        const paymentsResult = await client.query(paymentsQuery, [parentId]);

        res.json({
            success: true,
            data: {
                students: studentsResult.rows,
                summary: {
                    total_students: studentsResult.rows.length,
                    unread_notifications: parseInt(notificationsResult.rows[0].count),
                    unread_messages: parseInt(messagesResult.rows[0].count),
                    pending_payments: {
                        count: parseInt(paymentsResult.rows[0].count),
                        total: parseFloat(paymentsResult.rows[0].total || 0)
                    }
                }
            }
        });

    } catch (error) {
        devLogger.error('Error en dashboard de padres:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cargar dashboard'
        });
    } finally {
        client.release();
    }
});

// ============================================
// CALIFICACIONES
// ============================================

/**
 * GET /api/parents/students/:studentId/grades
 * Obtiene calificaciones de un estudiante
 */
router.get('/students/:studentId/grades', authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const parentId = req.user.id;
        const studentId = parseInt(req.params.studentId);
        const { periodo, ciclo_escolar } = req.query;

        // Verificar permisos
        const permissionQuery = `
            SELECT ver_calificaciones
            FROM parents_students
            WHERE parent_id = $1 AND student_id = $2 AND activo = TRUE
        `;
        const permission = await client.query(permissionQuery, [parentId, studentId]);

        if (permission.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: 'No tiene permisos para ver este estudiante'
            });
        }

        if (!permission.rows[0].ver_calificaciones) {
            return res.status(403).json({
                success: false,
                error: 'No tiene permisos para ver calificaciones'
            });
        }

        // Construir query de calificaciones
        let gradesQuery = `
            SELECT
                id,
                materia,
                profesor,
                periodo,
                ciclo_escolar,
                calificacion,
                calificacion_letra,
                faltas,
                retardos,
                observaciones,
                fecha_publicacion
            FROM grades
            WHERE student_id = $1
            AND visible_padres = TRUE
        `;

        const params = [studentId];
        let paramIndex = 2;

        if (periodo) {
            gradesQuery += ` AND periodo = $${paramIndex}`;
            params.push(periodo);
            paramIndex++;
        }

        if (ciclo_escolar) {
            gradesQuery += ` AND ciclo_escolar = $${paramIndex}`;
            params.push(ciclo_escolar);
            paramIndex++;
        }

        gradesQuery += ' ORDER BY materia, periodo';

        const gradesResult = await client.query(gradesQuery, params);

        // Calcular promedio general
        const promedioQuery = `
            SELECT
                AVG(calificacion) as promedio_general,
                COUNT(*) as total_materias
            FROM grades
            WHERE student_id = $1
            AND visible_padres = TRUE
            ${periodo ? 'AND periodo = $2' : ''}
            ${ciclo_escolar ? `AND ciclo_escolar = $${periodo ? '3' : '2'}` : ''}
        `;

        const promedioParams = [studentId];
        if (periodo) promedioParams.push(periodo);
        if (ciclo_escolar) promedioParams.push(ciclo_escolar);

        const promedioResult = await client.query(promedioQuery, promedioParams);

        res.json({
            success: true,
            data: {
                grades: gradesResult.rows,
                summary: {
                    promedio_general: parseFloat(promedioResult.rows[0].promedio_general || 0).toFixed(2),
                    total_materias: parseInt(promedioResult.rows[0].total_materias)
                }
            }
        });

    } catch (error) {
        devLogger.error('Error al obtener calificaciones:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cargar calificaciones'
        });
    } finally {
        client.release();
    }
});

// ============================================
// ASISTENCIA
// ============================================

/**
 * GET /api/parents/students/:studentId/attendance
 * Obtiene registro de asistencia de un estudiante
 */
router.get('/students/:studentId/attendance', authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const parentId = req.user.id;
        const studentId = parseInt(req.params.studentId);
        const { start_date, end_date, limit = 30 } = req.query;

        // Verificar permisos
        const permissionQuery = `
            SELECT ver_asistencia
            FROM parents_students
            WHERE parent_id = $1 AND student_id = $2 AND activo = TRUE
        `;
        const permission = await client.query(permissionQuery, [parentId, studentId]);

        if (permission.rows.length === 0 || !permission.rows[0].ver_asistencia) {
            return res.status(403).json({
                success: false,
                error: 'No tiene permisos para ver asistencia'
            });
        }

        // Query de asistencia
        let attendanceQuery = `
            SELECT
                id,
                fecha,
                tipo,
                materia,
                hora,
                justificada,
                motivo_justificacion
            FROM attendance
            WHERE student_id = $1
        `;

        const params = [studentId];
        let paramIndex = 2;

        if (start_date) {
            attendanceQuery += ` AND fecha >= $${paramIndex}`;
            params.push(start_date);
            paramIndex++;
        }

        if (end_date) {
            attendanceQuery += ` AND fecha <= $${paramIndex}`;
            params.push(end_date);
            paramIndex++;
        }

        attendanceQuery += ` ORDER BY fecha DESC, hora DESC LIMIT $${paramIndex}`;
        params.push(parseInt(limit));

        const attendanceResult = await client.query(attendanceQuery, params);

        // Estadísticas del mes actual
        const statsQuery = `
            SELECT
                COUNT(*) FILTER (WHERE tipo = 'asistencia') as asistencias,
                COUNT(*) FILTER (WHERE tipo = 'falta') as faltas,
                COUNT(*) FILTER (WHERE tipo = 'retardo') as retardos,
                COUNT(*) FILTER (WHERE tipo = 'justificada') as justificadas
            FROM attendance
            WHERE student_id = $1
            AND fecha >= DATE_TRUNC('month', CURRENT_DATE)
            AND fecha < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        `;
        const statsResult = await client.query(statsQuery, [studentId]);

        res.json({
            success: true,
            data: {
                attendance: attendanceResult.rows,
                stats_monthly: {
                    asistencias: parseInt(statsResult.rows[0].asistencias),
                    faltas: parseInt(statsResult.rows[0].faltas),
                    retardos: parseInt(statsResult.rows[0].retardos),
                    justificadas: parseInt(statsResult.rows[0].justificadas)
                }
            }
        });

    } catch (error) {
        devLogger.error('Error al obtener asistencia:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cargar asistencia'
        });
    } finally {
        client.release();
    }
});

// ============================================
// PAGOS
// ============================================

/**
 * GET /api/parents/students/:studentId/payments
 * Obtiene historial de pagos de un estudiante
 */
router.get('/students/:studentId/payments', authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const parentId = req.user.id;
        const studentId = parseInt(req.params.studentId);
        const { estatus, ciclo_escolar } = req.query;

        // Verificar permisos
        const permissionQuery = `
            SELECT ver_pagos
            FROM parents_students
            WHERE parent_id = $1 AND student_id = $2 AND activo = TRUE
        `;
        const permission = await client.query(permissionQuery, [parentId, studentId]);

        if (permission.rows.length === 0 || !permission.rows[0].ver_pagos) {
            return res.status(403).json({
                success: false,
                error: 'No tiene permisos para ver pagos'
            });
        }

        // Query de pagos
        let paymentsQuery = `
            SELECT
                id,
                concepto,
                descripcion,
                monto,
                estatus,
                fecha_limite,
                fecha_pago,
                metodo_pago,
                referencia,
                ciclo_escolar,
                created_at
            FROM payments
            WHERE student_id = $1
        `;

        const params = [studentId];
        let paramIndex = 2;

        if (estatus) {
            paymentsQuery += ` AND estatus = $${paramIndex}`;
            params.push(estatus);
            paramIndex++;
        }

        if (ciclo_escolar) {
            paymentsQuery += ` AND ciclo_escolar = $${paramIndex}`;
            params.push(ciclo_escolar);
            paramIndex++;
        }

        paymentsQuery += ' ORDER BY fecha_limite DESC';

        const paymentsResult = await client.query(paymentsQuery, params);

        // Resumen de pagos
        const summaryQuery = `
            SELECT
                COUNT(*) FILTER (WHERE estatus = 'pendiente') as pendientes,
                SUM(monto) FILTER (WHERE estatus = 'pendiente') as total_pendiente,
                COUNT(*) FILTER (WHERE estatus = 'pagado') as pagados,
                SUM(monto) FILTER (WHERE estatus = 'pagado') as total_pagado,
                COUNT(*) FILTER (WHERE estatus = 'vencido') as vencidos
            FROM payments
            WHERE student_id = $1
            ${ciclo_escolar ? `AND ciclo_escolar = $2` : ''}
        `;

        const summaryParams = ciclo_escolar ? [studentId, ciclo_escolar] : [studentId];
        const summaryResult = await client.query(summaryQuery, summaryParams);

        res.json({
            success: true,
            data: {
                payments: paymentsResult.rows,
                summary: {
                    pendientes: parseInt(summaryResult.rows[0].pendientes),
                    total_pendiente: parseFloat(summaryResult.rows[0].total_pendiente || 0),
                    pagados: parseInt(summaryResult.rows[0].pagados),
                    total_pagado: parseFloat(summaryResult.rows[0].total_pagado || 0),
                    vencidos: parseInt(summaryResult.rows[0].vencidos)
                }
            }
        });

    } catch (error) {
        devLogger.error('Error al obtener pagos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cargar pagos'
        });
    } finally {
        client.release();
    }
});

// ============================================
// NOTIFICACIONES
// ============================================

/**
 * GET /api/parents/notifications
 * Obtiene notificaciones del padre
 */
router.get('/notifications', authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const parentId = req.user.id;
        const { unread_only, limit = 20 } = req.query;

        let query = `
            SELECT
                n.id,
                n.tipo,
                n.titulo,
                n.mensaje,
                n.prioridad,
                n.leida,
                n.fecha_lectura,
                n.created_at,
                s.matricula as student_matricula,
                s.nombre_completo as student_name
            FROM parent_notifications n
            LEFT JOIN students s ON n.student_id = s.id
            WHERE n.parent_id = $1
            AND (n.expires_at IS NULL OR n.expires_at > CURRENT_TIMESTAMP)
        `;

        const params = [parentId];
        let paramIndex = 2;

        if (unread_only === 'true') {
            query += ` AND n.leida = FALSE`;
        }

        query += ` ORDER BY n.created_at DESC LIMIT $${paramIndex}`;
        params.push(parseInt(limit));

        const result = await client.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        devLogger.error('Error al obtener notificaciones:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cargar notificaciones'
        });
    } finally {
        client.release();
    }
});

/**
 * PUT /api/parents/notifications/:id/read
 * Marcar notificación como leída
 */
router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const parentId = req.user.id;
        const notificationId = parseInt(req.params.id);

        const query = `
            UPDATE parent_notifications
            SET leida = TRUE, fecha_lectura = CURRENT_TIMESTAMP
            WHERE id = $1 AND parent_id = $2
            RETURNING id
        `;

        const result = await client.query(query, [notificationId, parentId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Notificación no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Notificación marcada como leída'
        });

    } catch (error) {
        devLogger.error('Error al marcar notificación:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar notificación'
        });
    } finally {
        client.release();
    }
});

module.exports = router;
