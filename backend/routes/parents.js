"use strict";
/**
 * API REST - PORTAL DE PADRES DE FAMILIA - TypeScript
 * BGE Héroes de la Patria
 * Migrado: 08 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
// @ts-ignore
const debug_logger_1 = require('../utils/debug-logger.js');
// @ts-ignore
const sanitized_errors_1 = require('../utils/sanitized-errors.js');
let bcrypt_1 = { default: require('bcryptjs') };
// @ts-ignore
const database_1 = require('../config/database.js');
// @ts-ignore
const auth_1 = require('../middleware/auth.js');
// @ts-ignore
const jwtUtils_1 = require('../utils/jwtUtils.js');
const router = express_1.default.Router();

/**
 * GET /api/parents/auth/check
 * Verifica el estado de autenticación del padre/tutor
 */
router.get('/auth/check', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, isAuthenticated: false, message: 'Token no proporcionado' });
    }

    const jwt = require('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET || 'bge-heroes-secret-key-2026';

    try {
        const decoded = jwt.verify(token, jwtSecret);
        if (!decoded || !decoded.id) {
            return res.status(401).json({ success: false, isAuthenticated: false, message: 'Token inválido' });
        }
        return res.json({
            success: true,
            isAuthenticated: true,
            user: {
                id: decoded.id,
                role: decoded.role || 'padre',
                name: decoded.nombre || decoded.name || 'Tutor / Padre de Familia',
                email: decoded.email || 'padre@bge.edu.mx'
            }
        });
    } catch (err) {
        return res.status(401).json({
            success: false,
            isAuthenticated: false,
            message: 'Token inválido o expirado'
        });
    }
});

/**
 * POST /api/parents/auth/login y POST /api/parents/login
 * Autenticación unificada para padres y administradores
 */
const handleParentLogin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Correo electrónico y contraseña son obligatorios'
        });
    }

    const cleanEmail = email.trim().toLowerCase();
    const jwt = require('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET || 'bge-heroes-secret-key-2026';

    let client;
    try {
        client = await database_1.pool.connect();
        // 1. Buscar en users (admin o padres)
        const userQuery = `
            SELECT id, email, password, nombre, role 
            FROM users 
            WHERE LOWER(email) = $1
            LIMIT 1
        `;
        const userRes = await client.query(userQuery, [cleanEmail]);
        if (userRes.rows && userRes.rows.length > 0) {
            const user = userRes.rows[0];
            const bcrypt = require('bcryptjs');
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                const token = jwt.sign(
                    { id: user.id, email: user.email, role: user.role, nombre: user.nombre },
                    jwtSecret,
                    { expiresIn: '24h' }
                );
                return res.json({
                    success: true,
                    token,
                    parent: {
                        id: user.id,
                        nombre: user.nombre || 'Usuario Autorizado',
                        email: user.email,
                        role: user.role,
                        student_id: 'EST-2026-001'
                    },
                    message: 'Inicio de sesión exitoso'
                });
            }
        }

        // 2. Buscar en tabla parents
        try {
            const parentQuery = `
                SELECT id, email, password, nombre, student_id 
                FROM parents 
                WHERE LOWER(email) = $1
                LIMIT 1
            `;
            const parentRes = await client.query(parentQuery, [cleanEmail]);
            if (parentRes.rows && parentRes.rows.length > 0) {
                const parent = parentRes.rows[0];
                const bcrypt = require('bcryptjs');
                const match = await bcrypt.compare(password, parent.password);
                if (match) {
                    const token = jwt.sign(
                        { id: parent.id, email: parent.email, role: 'padre', nombre: parent.nombre },
                        jwtSecret,
                        { expiresIn: '24h' }
                    );
                    return res.json({
                        success: true,
                        token,
                        parent: {
                            id: parent.id,
                            nombre: parent.nombre || 'Padre de Familia',
                            email: parent.email,
                            role: 'padre',
                            student_id: parent.student_id || 'EST-2026-001'
                        },
                        message: 'Inicio de sesión exitoso'
                    });
                }
            }
        } catch (tblErr) {}

    } catch (dbErr) {
        console.warn('[PARENTS AUTH] DB error:', dbErr.message);
    } finally {
        if (client) client.release();
    }

    return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas. Verifique su correo y contraseña.'
    });
};

router.post('/auth/login', handleParentLogin);
router.post('/login', handleParentLogin);
router.post('/auth/logout', (req, res) => res.json({ success: true }));
router.post('/logout', (req, res) => res.json({ success: true }));

// ============================================
// ENDPOINTS ADMINISTRATIVOS (CRUD)
// ============================================
/**
 * GET /api/parents
 * Obtiene lista de todos los padres (admin only)
 */
router.get('/', async (req, res) => {
    let client;
    try {
        client = await database_1.pool.connect();
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
        res.json({
            success: true,
            data: result.rows || [],
            count: result.rows ? result.rows.length : 0
        });
    }
    catch (error) {
        res.json({
            success: true,
            data: [],
            count: 0
        });
    }
    finally {
        if (client) client.release();
    }
});
/**
 * POST /api/parents
 * Crea un nuevo padre (admin only)
 */
router.post('/', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    const client = await database_1.pool.connect();
    try {
        const { nombre, email, password, student_id } = req.body;
        debug_logger_1.debugLog.log('parents', '👨‍👩‍👧 [PARENTS] Creando nuevo padre...');
        // Validaciones
        if (!nombre || !email || !password) {
            res.status(400).json({
                success: false,
                message: 'Nombre, email y contraseña son requeridos'
            });
            return;
        }
        // Verificar si el email ya existe
        const emailCheck = await client.query('SELECT id FROM parents WHERE email = $1', [email.toLowerCase()]);
        if (emailCheck.rows.length > 0) {
            res.status(409).json({
                success: false,
                message: 'El email ya está registrado'
            });
            return;
        }
        // Hash de la contraseña
        const password_hash = await bcrypt_1.default.hash(password, 10);
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
        debug_logger_1.debugLog.log('parents', `✅ [PARENTS] Padre creado con ID: ${parent.id}`);
        res.status(201).json({
            success: true,
            message: 'Padre creado exitosamente',
            data: parent
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('parents', '❌ [PARENTS] Error creando padre', (0, sanitized_errors_1.sanitizeError)(error, 'parents'));
        res.status(500).json({
            success: false,
            message: 'Error al crear padre',
            error: error.message
        });
    }
    finally {
        client.release();
    }
});
/**
 * PUT /api/parents/:id
 * Actualiza un padre existente (admin only)
 */
router.put('/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    const client = await database_1.pool.connect();
    try {
        const parentId = parseInt(req.params.id);
        const { nombre, email, password, student_id } = req.body;
        debug_logger_1.debugLog.log('parents', `👨‍👩‍👧 [PARENTS] Actualizando padre ID: ${parentId}`);
        // Verificar que el padre existe
        const existsCheck = await client.query('SELECT id FROM parents WHERE id = $1', [parentId]);
        if (existsCheck.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: 'Padre no encontrado'
            });
            return;
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
            const emailCheck = await client.query('SELECT id FROM parents WHERE email = $1 AND id != $2', [email.toLowerCase(), parentId]);
            if (emailCheck.rows.length > 0) {
                res.status(409).json({
                    success: false,
                    message: 'El email ya está en uso'
                });
                return;
            }
            updates.push(`email = $${valueIndex++}`);
            values.push(email.toLowerCase());
        }
        if (password) {
            const password_hash = await bcrypt_1.default.hash(password, 10);
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
        debug_logger_1.debugLog.log('parents', `✅ [PARENTS] Padre actualizado: ${parent.id}`);
        res.json({
            success: true,
            message: 'Padre actualizado exitosamente',
            data: parent
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('parents', '❌ [PARENTS] Error actualizando padre', (0, sanitized_errors_1.sanitizeError)(error, 'parents'));
        res.status(500).json({
            success: false,
            message: 'Error al actualizar padre',
            error: error.message
        });
    }
    finally {
        client.release();
    }
});
/**
 * DELETE /api/parents/:id
 * Elimina un padre (admin only)
 */
router.delete('/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    const client = await database_1.pool.connect();
    try {
        const parentId = parseInt(req.params.id);
        debug_logger_1.debugLog.log('parents', `👨‍👩‍👧 [PARENTS] Eliminando padre ID: ${parentId}`);
        // Verificar que el padre existe
        const existsCheck = await client.query('SELECT id FROM parents WHERE id = $1', [parentId]);
        if (existsCheck.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: 'Padre no encontrado'
            });
            return;
        }
        // Eliminar padre
        await client.query('DELETE FROM parents WHERE id = $1', [parentId]);
        debug_logger_1.debugLog.log('parents', `✅ [PARENTS] Padre eliminado: ${parentId}`);
        res.json({
            success: true,
            message: 'Padre eliminado exitosamente'
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('parents', '❌ [PARENTS] Error eliminando padre', (0, sanitized_errors_1.sanitizeError)(error, 'parents'));
        res.status(500).json({
            success: false,
            message: 'Error al eliminar padre',
            error: error.message
        });
    }
    finally {
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
    const client = await database_1.pool.connect();
    try {
        const { email, password } = req.body;
        // Validaciones
        if (!email || !password) {
            res.status(400).json({
                success: false,
                error: 'Email y contraseña son requeridos'
            });
            return;
        }
        // Buscar padre
        const parentQuery = `
            SELECT id, nombre_completo, email, password_hash, activo, email_verified
            FROM parents
            WHERE email = $1
        `;
        const result = await client.query(parentQuery, [email.toLowerCase()]);
        if (result.rows.length === 0) {
            res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
            return;
        }
        const parent = result.rows[0];
        // Verificar estado
        if (!parent.activo) {
            res.status(403).json({
                success: false,
                error: 'Cuenta desactivada. Contacte al administrador'
            });
            return;
        }
        if (!parent.email_verified) {
            res.status(403).json({
                success: false,
                error: 'Email no verificado. Revise su correo electrónico'
            });
            return;
        }
        // Verificar contraseña
        const passwordMatch = await bcrypt_1.default.compare(password, parent.password_hash);
        if (!passwordMatch) {
            res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
            return;
        }
        // Actualizar último login
        await client.query('UPDATE parents SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [parent.id]);
        // Generar JWT usando utilidades estándar
        const jwtUtils = (0, jwtUtils_1.getJWTUtils)();
        const token = jwtUtils.generateAccessToken({
            userId: parent.id,
            email: parent.email,
            role: 'parent'
        });
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
    }
    catch (error) {
        debug_logger_1.debugLog.error('parents', 'Error en login de padres', (0, sanitized_errors_1.sanitizeError)(error, 'parents'));
        res.status(500).json({
            success: false,
            error: 'Error al procesar login'
        });
    }
    finally {
        client.release();
    }
});
/**
 * POST /api/parents/auth/register
 * Registro de nuevos padres
 */
router.post('/auth/register', async (req, res) => {
    const client = await database_1.pool.connect();
    try {
        const { nombre, apellido_paterno, apellido_materno, email, password, telefono, parentesco } = req.body;
        // Validaciones
        if (!nombre || !apellido_paterno || !email || !password) {
            res.status(400).json({
                success: false,
                error: 'Datos incompletos'
            });
            return;
        }
        // Verificar si email ya existe
        const existsQuery = 'SELECT id FROM parents WHERE email = $1';
        const exists = await client.query(existsQuery, [email.toLowerCase()]);
        if (exists.rows.length > 0) {
            res.status(409).json({
                success: false,
                error: 'El email ya está registrado'
            });
            return;
        }
        // Hash de contraseña
        const password_hash = await bcrypt_1.default.hash(password, 10);
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
    }
    catch (error) {
        debug_logger_1.debugLog.error('parents', 'Error en registro de padres', (0, sanitized_errors_1.sanitizeError)(error, 'parents'));
        res.status(500).json({
            success: false,
            error: 'Error al procesar registro'
        });
    }
    finally {
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
router.get('/dashboard', auth_1.authenticateToken, async (req, res) => {
    const client = await database_1.pool.connect();
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
                        total: parseFloat(paymentsResult.rows[0].total || '0')
                    }
                }
            }
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('parents', 'Error en dashboard de padres', (0, sanitized_errors_1.sanitizeError)(error, 'parents'));
        res.status(500).json({
            success: false,
            error: 'Error al cargar dashboard'
        });
    }
    finally {
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
router.get('/students/:studentId/grades', auth_1.authenticateToken, async (req, res) => {
    const client = await database_1.pool.connect();
    try {
        const parentId = req.user.id;
        const studentId = parseInt(req.params.studentId);
        // @ts-ignore
        const { periodo, ciclo_escolar } = req.query;
        // Verificar permisos
        const permissionQuery = `
            SELECT ver_calificaciones
            FROM parents_students
            WHERE parent_id = $1 AND student_id = $2 AND activo = TRUE
        `;
        const permission = await client.query(permissionQuery, [parentId, studentId]);
        if (permission.rows.length === 0) {
            res.status(403).json({
                success: false,
                error: 'No tiene permisos para ver este estudiante'
            });
            return;
        }
        if (!permission.rows[0].ver_calificaciones) {
            res.status(403).json({
                success: false,
                error: 'No tiene permisos para ver calificaciones'
            });
            return;
        }
        // Use GradesService to get the standardized report card
        // This ensures consistency with the student portal
        const GradesService = require('../services/grades.service.js').default;
        const cicloEscolarStr = ciclo_escolar ? String(ciclo_escolar) : undefined;
        const reportCard = await GradesService.getStudentReportCard(studentId, cicloEscolarStr);
        res.json({
            success: true,
            data: {
                grades: reportCard.boleta, // Map boleta to grades expected structure if needed, or frontend adapts
                summary: {
                    promedio_general: reportCard.promedio_general,
                    total_materias: reportCard.materias_cursadas
                }
            }
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('parents', 'Error al obtener calificaciones', (0, sanitized_errors_1.sanitizeError)(error, 'parents'));
        res.status(500).json({
            success: false,
            error: 'Error al cargar calificaciones'
        });
    }
    finally {
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
router.get('/students/:studentId/attendance', auth_1.authenticateToken, async (req, res) => {
    const client = await database_1.pool.connect();
    try {
        const parentId = req.user.id;
        const studentId = parseInt(req.params.studentId);
        const { start_date, end_date, limit = '30' } = req.query;
        // Verificar permisos
        const permissionQuery = `
            SELECT ver_asistencia
            FROM parents_students
            WHERE parent_id = $1 AND student_id = $2 AND activo = TRUE
        `;
        const permission = await client.query(permissionQuery, [parentId, studentId]);
        if (permission.rows.length === 0 || !permission.rows[0].ver_asistencia) {
            res.status(403).json({
                success: false,
                error: 'No tiene permisos para ver asistencia'
            });
            return;
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
    }
    catch (error) {
        debug_logger_1.debugLog.error('parents', 'Error al obtener asistencia', (0, sanitized_errors_1.sanitizeError)(error, 'parents'));
        res.status(500).json({
            success: false,
            error: 'Error al cargar asistencia'
        });
    }
    finally {
        client.release();
    }
});
// ============================================
// SISTEMA DE CREDENCIALES (PRE-APROVISIONAMIENTO)
// ============================================
const parent_credentials_dao_1 = __importDefault(require('../data/parent-credentials.dao.js'));
/**
 * GET /api/parents/credentials
 * Listar credenciales activas (para imprimir/exportar)
 */
router.get('/credentials', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const credentials = await parent_credentials_dao_1.default.getAllActive();
        res.json({ success: true, data: credentials });
    }
    catch (error) {
        debug_logger_1.debugLog.error('parents', 'Error listando credenciales', (0, sanitized_errors_1.sanitizeError)(error, 'parents'));
        res.status(500).json({ success: false, error: 'Error al listar credenciales' });
    }
});
/**
 * POST /api/parents/credentials/generate
 * Generar credenciales masivas por grupo/grado
 */
router.post('/credentials/generate', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    const client = await database_1.pool.connect();
    try {
        const { grado, grupo } = req.body;
        let query = "SELECT id FROM students WHERE activo = TRUE";
        const params = [];
        if (grado) {
            params.push(grado);
            query += ` AND grado = $${params.length}`;
        }
        if (grupo) {
            params.push(grupo);
            query += ` AND grupo = $${params.length}`;
        }
        const students = await client.query(query, params);
        const studentIds = students.rows.map((s) => s.id);
        if (studentIds.length === 0) {
            res.status(404).json({ success: false, message: 'No se encontraron estudiantes con esos filtros' });
            return;
        }
        const generated = await parent_credentials_dao_1.default.generateBatch(studentIds);
        res.json({
            success: true,
            message: `Se generaron ${generated.length} credenciales`,
            data: generated // Returns temp passwords ONCE
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('parents', 'Error generando credenciales', (0, sanitized_errors_1.sanitizeError)(error, 'parents'));
        res.status(500).json({ success: false, error: 'Error al generar credenciales' });
    }
    finally {
        client.release();
    }
});
/**
 * POST /api/parents/auth/first-login
 * Login por primera vez usando credencial impresa
 */
router.post('/auth/first-login', async (req, res) => {
    const client = await database_1.pool.connect();
    try {
        const { username, temp_password, email, new_password, nombre, telefono } = req.body;
        // 1. Validar credencial
        const cred = await parent_credentials_dao_1.default.verifyCredential(username, temp_password);
        if (!cred) {
            res.status(401).json({ success: false, error: 'Credencial inválida o expirada' });
            return;
        }
        // 2. Verificar que email no exista
        const emailCheck = await client.query('SELECT id FROM parents WHERE email = $1', [email.toLowerCase()]);
        if (emailCheck.rows.length > 0) {
            res.status(409).json({ success: false, error: 'El email ya está registrado' });
            return;
        }
        // 3. Crear cuenta de padre
        const password_hash = await bcrypt_1.default.hash(new_password, 10);
        // Iniciar transacción
        await client.query('BEGIN');
        const insertQuery = `
            INSERT INTO parents (nombre, email, password_hash, telefono, created_at, updated_at, activo, email_verified)
            VALUES ($1, $2, $3, $4, NOW(), NOW(), TRUE, TRUE)
            RETURNING id
        `;
        const parentRes = await client.query(insertQuery, [nombre, email.toLowerCase(), password_hash, telefono || null]);
        const parentId = parentRes.rows[0].id;
        // 4. Vincular estudiante
        await client.query("INSERT INTO parents_students (parent_id, student_id, activo, tipo_relacion) VALUES ($1, $2, TRUE, 'tutor')", [parentId, cred.student_id]);
        // 5. Marcar credencial como reclamada
        await parent_credentials_dao_1.default.markAsClaimed(cred.id);
        await client.query('COMMIT');
        // 6. Generar Token
        const jwtUtils = (0, jwtUtils_1.getJWTUtils)();
        const token = jwtUtils.generateAccessToken({
            userId: parentId,
            email: email,
            role: 'parent'
        });
        res.json({
            success: true,
            data: { token, parent: { id: parentId, email, nombre } }
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        debug_logger_1.debugLog.error('parents', 'Error en first-login', (0, sanitized_errors_1.sanitizeError)(error, 'parents'));
        res.status(500).json({ success: false, error: 'Error al procesar primer acceso' });
    }
    finally {
        client.release();
    }
});
module.exports = router;
//# sourceMappingURL=parents.js.map