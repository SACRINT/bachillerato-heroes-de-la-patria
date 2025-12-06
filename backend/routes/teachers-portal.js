/**
 * 👨‍🏫 API DEL PORTAL DE DOCENTES
 * BGE Héroes de la Patria
 * Fecha: 19 de Octubre, 2025
 *
 * Endpoints REST para que los docentes gestionen:
 * - Clases y grupos
 * - Calificaciones
 * - Asistencias
 * - Recursos educativos
 * - Tareas y entregas
 * - Mensajería y notificaciones
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { getJWTUtils } = require('../utils/jwtUtils');
const jwtUtils = getJWTUtils();
const router = express.Router();

// ============================================
// MIDDLEWARE: Verificar que el usuario es docente
// ============================================
const requireTeacher = async (req, res, next) => {
    try {
        // El middleware authenticateToken ya validó el token
        // Ahora verificamos que sea un docente

        const client = await pool.connect();
        try {
            debugLog.log('teachers-portal', `[TEACHER-AUTH] Verificando permisos para usuario ID: ${req.user.id}`);

            const result = await client.query(
                `SELECT d.id, d.numero_empleado, d.especialidad, u.nombre, u.apellido_paterno, u.apellido_materno, u.status
                 FROM docentes d
                 JOIN usuarios u ON d.usuario_id = u.id
                 WHERE u.id = $1`,
                [req.user.id]
            );

            debugLog.log('teachers-portal', `[TEACHER-AUTH] Resultado query: ${result.rows.length} filas found.`);
            if (result.rows.length > 0) {
                debugLog.log('teachers-portal', `[TEACHER-AUTH] Status usuario: ${result.rows[0].status}`);
            }

            // Filtrar por status activo en código para ver si es el problema
            // Aceptamos 'activo' (español) o 'active' (inglés)
            const teacher = result.rows.find(row => row.status === 'activo' || row.status === 'active');

            if (!teacher) {
                debugLog.warn('teachers-portal', '[TEACHER-AUTH] ❌ Usuario no encontrado o no activo en tabla docentes/usuarios');
                if (result.rows.length > 0) {
                    debugLog.warn('teachers-portal', `[TEACHER-AUTH] Status actual: ${result.rows[0].status}`);
                }
                return res.status(403).json({
                    success: false,
                    error: 'No tiene permisos de docente'
                });
            }

            // Agregar información del docente al request
            req.teacher = teacher;
            next();
        } finally {
            client.release();
        }
    } catch (error) {
        debugLog.error('teachers-portal', 'Error en requireTeacher', sanitizeError(error, 'teachers-portal'));
        res.status(500).json({
            success: false,
            error: 'Error verificando permisos de docente'
        });
    }
};

// ============================================
// AUTENTICACIÓN
// ============================================

/**
 * POST /api/teachers-portal/auth/login
 * Login de docentes
 */
router.post('/auth/login', async (req, res) => {
    const client = await pool.connect();

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email y contraseña son requeridos'
            });
        }

        // Buscar docente
        const docenteQuery = `
            SELECT
                u.id, u.email, u.password_hash, u.status as activo,
                d.id as docente_id, d.numero_empleado, d.especialidad,
                u.nombre, u.apellido_paterno, u.apellido_materno
            FROM usuarios u
            JOIN docentes d ON d.usuario_id = u.id
            WHERE u.email = $1
        `;

        const result = await client.query(docenteQuery, [email.toLowerCase()]);

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }

        const docente = result.rows[0];

        // Verificar estado activo
        if (!docente.activo) {
            return res.status(403).json({
                success: false,
                error: 'Cuenta desactivada. Contacte al administrador.'
            });
        }

        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, docente.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }

        // Actualizar last_login
        await client.query(
            'UPDATE usuarios SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [docente.id]
        );

        // Generar JWT
        // Generar JWT usando jwtUtils para consistencia (audience, issuer, type)
        const token = jwtUtils.generateAccessToken({
            userId: docente.id,
            email: docente.email,
            role: 'docente', // Normalizado a 'docente'
            teacher_id: docente.docente_id
        });

        res.json({
            success: true,
            token,
            teacher: {
                id: docente.docente_id,
                user_id: docente.id,
                nombre_completo: `${docente.nombre} ${docente.apellido_paterno} ${docente.apellido_materno}`,
                email: docente.email,
                numero_empleado: docente.numero_empleado,
                especialidad: docente.especialidad
            }
        });

    } catch (error) {
        debugLog.error('teachers-portal', 'Error en login de docente', sanitizeError(error, 'teachers-portal'));
        res.status(500).json({
            success: false,
            error: 'Error al iniciar sesión'
        });
    } finally {
        client.release();
    }
});

// ============================================
// DASHBOARD
// ============================================

/**
 * GET /api/teachers-portal/dashboard
 * Dashboard principal del docente
 */
router.get('/dashboard', authenticateToken, requireTeacher, async (req, res) => {
    const client = await pool.connect();

    try {
        const teacherId = req.teacher.id;
        const userId = req.user.id;

        debugLog.log('teachers-portal', `Cargando dashboard para docente ID: ${teacherId}`);

        // Dashboard simplificado - devolver datos básicos del docente
        // Las tablas completas de clases, estudiantes, etc. se pueden agregar después

        res.json({
            success: true,
            data: {
                teacher: {
                    id: req.teacher.id,
                    nombre: req.teacher.nombre,
                    apellido_paterno: req.teacher.apellido_paterno,
                    apellido_materno: req.teacher.apellido_materno,
                    numero_empleado: req.teacher.numero_empleado,
                    especialidad: req.teacher.especialidad
                },
                stats: {
                    classes: 0, // Placeholder - implementar cuando las tablas existan
                    students: 0, // Placeholder
                    notifications: 0, // Placeholder
                    messages: 0 // Placeholder
                },
                upcomingClasses: [], // Placeholder
                recentActivity: [] // Placeholder
            }
        });

    } catch (error) {
        debugLog.error('teachers-portal', 'Error en dashboard de docente', sanitizeError(error, 'teachers-portal'));
        res.status(500).json({
            success: false,
            error: 'Error al cargar dashboard'
        });
    } finally {
        client.release();
    }
});

// ============================================
// GESTIÓN DE CLASES
// ============================================

/**
 * GET /api/teachers-portal/classes
 * Obtener todas las clases del docente
 */
router.get('/classes', authenticateToken, requireTeacher, async (req, res) => {
    const client = await pool.connect();

    try {
        const { ciclo_escolar } = req.query;
        const teacherId = req.teacher.id;

        let query = `
            SELECT
                tc.*,
                COUNT(DISTINCT tcs.student_id) as total_estudiantes
            FROM teacher_classes tc
            LEFT JOIN teacher_class_students tcs ON tc.id = tcs.class_id AND tcs.activo = TRUE
            WHERE tc.teacher_id = $1
        `;

        const params = [teacherId];

        if (ciclo_escolar) {
            query += ' AND tc.ciclo_escolar = $2';
            params.push(ciclo_escolar);
        }

        query += ' GROUP BY tc.id ORDER BY tc.materia, tc.grado, tc.grupo';

        const result = await client.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length
        });

    } catch (error) {
        debugLog.error('teachers-portal', 'Error obteniendo clases', sanitizeError(error, 'teachers-portal'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener clases'
        });
    } finally {
        client.release();
    }
});

/**
 * GET /api/teachers-portal/classes/:id
 * Obtener detalle de una clase específica
 */
router.get('/classes/:id', authenticateToken, requireTeacher, async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;
        const teacherId = req.teacher.id;

        // Obtener información de la clase
        const classQuery = await client.query(
            `SELECT * FROM teacher_classes WHERE id = $1 AND teacher_id = $2`,
            [id, teacherId]
        );

        if (classQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Clase no encontrada'
            });
        }

        // Obtener estudiantes de la clase
        const studentsQuery = await client.query(
            `SELECT
                s.id, s.matricula, s.nombre, s.apellido_paterno, s.apellido_materno,
                s.grado, s.grupo, s.email,
                tcs.numero_lista, tcs.fecha_inscripcion
             FROM teacher_class_students tcs
             JOIN students s ON tcs.student_id = s.id
             WHERE tcs.class_id = $1 AND tcs.activo = TRUE
             ORDER BY tcs.numero_lista, s.apellido_paterno, s.apellido_materno, s.nombre`,
            [id]
        );

        res.json({
            success: true,
            data: {
                ...classQuery.rows[0],
                students: studentsQuery.rows,
                total_students: studentsQuery.rows.length
            }
        });

    } catch (error) {
        debugLog.error('teachers-portal', 'Error obteniendo detalle de clase', sanitizeError(error, 'teachers-portal'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener detalle de clase'
        });
    } finally {
        client.release();
    }
});

/**
 * POST /api/teachers-portal/classes
 * Crear una nueva clase
 */
router.post('/classes', authenticateToken, requireTeacher, async (req, res) => {
    const client = await pool.connect();

    try {
        const teacherId = req.teacher.id;
        const {
            materia,
            nivel,
            grado,
            grupo,
            ciclo_escolar,
            periodo,
            dia_semana,
            hora_inicio,
            hora_fin,
            salon,
            capacidad_maxima
        } = req.body;

        // Validaciones
        if (!materia || !grado || !grupo || !ciclo_escolar) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos'
            });
        }

        const result = await client.query(
            `INSERT INTO teacher_classes
             (teacher_id, materia, nivel, grado, grupo, ciclo_escolar, periodo, dia_semana, hora_inicio, hora_fin, salon, capacidad_maxima)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *`,
            [teacherId, materia, nivel, grado, grupo, ciclo_escolar, periodo, dia_semana, hora_inicio, hora_fin, salon, capacidad_maxima || 30]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Clase creada exitosamente'
        });

    } catch (error) {
        debugLog.error('teachers-portal', 'Error creando clase', sanitizeError(error, 'teachers-portal'));

        if (error.code === '23505') { // Duplicate key
            return res.status(409).json({
                success: false,
                error: 'Ya existe una clase con esta configuración'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error al crear clase'
        });
    } finally {
        client.release();
    }
});

/**
 * PUT /api/teachers-portal/classes/:id
 * Actualizar una clase
 */
router.put('/classes/:id', authenticateToken, requireTeacher, async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;
        const teacherId = req.teacher.id;
        const updates = req.body;

        // Verificar que la clase pertenece al docente
        const checkQuery = await client.query(
            'SELECT * FROM teacher_classes WHERE id = $1 AND teacher_id = $2',
            [id, teacherId]
        );

        if (checkQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Clase no encontrada'
            });
        }

        // Construir query de actualización dinámica
        const allowedFields = ['materia', 'nivel', 'grado', 'grupo', 'ciclo_escolar', 'periodo', 'dia_semana', 'hora_inicio', 'hora_fin', 'salon', 'capacidad_maxima', 'activo', 'visible_estudiantes'];
        const updateFields = [];
        const values = [];
        let paramCounter = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = $${paramCounter}`);
                values.push(value);
                paramCounter++;
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No hay campos válidos para actualizar'
            });
        }

        values.push(id);
        values.push(teacherId);

        const result = await client.query(
            `UPDATE teacher_classes
             SET ${updateFields.join(', ')}
             WHERE id = $${paramCounter} AND teacher_id = $${paramCounter + 1}
             RETURNING *`,
            values
        );

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Clase actualizada exitosamente'
        });

    } catch (error) {
        debugLog.error('teachers-portal', 'Error actualizando clase', sanitizeError(error, 'teachers-portal'));
        res.status(500).json({
            success: false,
            error: 'Error al actualizar clase'
        });
    } finally {
        client.release();
    }
});

// ============================================
// GESTIÓN DE CALIFICACIONES
// ============================================

/**
 * GET /api/teachers-portal/classes/:id/grades
 * Obtener calificaciones de una clase
 */
router.get('/classes/:id/grades', authenticateToken, requireTeacher, async (req, res) => {
    const client = await pool.connect();

    try {
        const { id: classId } = req.params;
        const { periodo, ciclo_escolar } = req.query;
        const teacherId = req.teacher.id;

        // Verificar que la clase pertenece al docente
        const classCheck = await client.query(
            'SELECT * FROM teacher_classes WHERE id = $1 AND teacher_id = $2',
            [classId, teacherId]
        );

        if (classCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Clase no encontrada'
            });
        }

        const classInfo = classCheck.rows[0];

        // Obtener estudiantes y sus calificaciones
        let query = `
            SELECT
                s.id as student_id,
                s.matricula,
                s.nombre || ' ' || s.apellido_paterno || ' ' || s.apellido_materno as nombre_completo,
                g.id as grade_id,
                g.calificacion,
                g.calificacion_letra,
                g.faltas,
                g.retardos,
                g.observaciones,
                g.visible_padres,
                g.fecha_publicacion,
                g.periodo,
                g.ciclo_escolar
            FROM teacher_class_students tcs
            JOIN students s ON tcs.student_id = s.id
            LEFT JOIN grades g ON g.student_id = s.id
                AND g.materia = $3
        `;

        const params = [classId, teacherId, classInfo.materia];

        if (periodo) {
            query += ' AND g.periodo = $' + (params.length + 1);
            params.push(periodo);
        }

        if (ciclo_escolar) {
            query += ' AND g.ciclo_escolar = $' + (params.length + 1);
            params.push(ciclo_escolar);
        }

        query += ` WHERE tcs.class_id = $1 AND tcs.activo = TRUE
                   ORDER BY s.apellido_paterno, s.apellido_materno, s.nombre`;

        const result = await client.query(query, params);

        res.json({
            success: true,
            data: {
                class: classInfo,
                grades: result.rows
            }
        });

    } catch (error) {
        debugLog.error('teachers-portal', 'Error obteniendo calificaciones', sanitizeError(error, 'teachers-portal'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener calificaciones'
        });
    } finally {
        client.release();
    }
});

/**
 * POST /api/teachers-portal/grades
 * Capturar/actualizar calificación de un estudiante
 */
router.post('/grades', authenticateToken, requireTeacher, async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            student_id,
            class_id,
            periodo,
            ciclo_escolar,
            calificacion,
            calificacion_letra,
            faltas,
            retardos,
            observaciones,
            visible_padres
        } = req.body;

        const teacherId = req.teacher.id;

        // Validaciones
        if (!student_id || !class_id || !periodo || !ciclo_escolar || calificacion === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos'
            });
        }

        // Verificar que la clase pertenece al docente
        const classCheck = await client.query(
            'SELECT * FROM teacher_classes WHERE id = $1 AND teacher_id = $2',
            [class_id, teacherId]
        );

        if (classCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: 'No tiene permisos para esta clase'
            });
        }

        const classInfo = classCheck.rows[0];
        const materia = classInfo.materia;
        const profesor = `${req.teacher.nombre} ${req.teacher.apellido_paterno} ${req.teacher.apellido_materno}`;

        // Insertar o actualizar calificación
        const result = await client.query(
            `INSERT INTO grades
             (student_id, materia, profesor, periodo, ciclo_escolar, calificacion, calificacion_letra, faltas, retardos, observaciones, visible_padres, fecha_publicacion)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CASE WHEN $11 = TRUE THEN CURRENT_TIMESTAMP ELSE NULL END)
             ON CONFLICT (student_id, materia, periodo, ciclo_escolar)
             DO UPDATE SET
                calificacion = EXCLUDED.calificacion,
                calificacion_letra = EXCLUDED.calificacion_letra,
                faltas = EXCLUDED.faltas,
                retardos = EXCLUDED.retardos,
                observaciones = EXCLUDED.observaciones,
                visible_padres = EXCLUDED.visible_padres,
                fecha_publicacion = CASE WHEN EXCLUDED.visible_padres = TRUE THEN CURRENT_TIMESTAMP ELSE grades.fecha_publicacion END,
                updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [student_id, materia, profesor, periodo, ciclo_escolar, calificacion, calificacion_letra, faltas || 0, retardos || 0, observaciones, visible_padres !== false]
        );

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Calificación guardada exitosamente'
        });

    } catch (error) {
        debugLog.error('teachers-portal', 'Error guardando calificación', sanitizeError(error, 'teachers-portal'));
        res.status(500).json({
            success: false,
            error: 'Error al guardar calificación'
        });
    } finally {
        client.release();
    }
});

// ============================================
// GESTIÓN DE ASISTENCIAS
// ============================================

/**
 * POST /api/teachers-portal/attendance/sessions
 * Crear sesión de asistencia para una clase
 */
router.post('/attendance/sessions', authenticateToken, requireTeacher, async (req, res) => {
    const client = await pool.connect();

    try {
        const { class_id, fecha, hora_inicio, hora_fin, tema, observaciones } = req.body;
        const teacherId = req.teacher.id;

        // Verificar que la clase pertenece al docente
        const classCheck = await client.query(
            'SELECT * FROM teacher_classes WHERE id = $1 AND teacher_id = $2',
            [class_id, teacherId]
        );

        if (classCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: 'No tiene permisos para esta clase'
            });
        }

        // Contar estudiantes de la clase
        const studentsCount = await client.query(
            'SELECT COUNT(*) as total FROM teacher_class_students WHERE class_id = $1 AND activo = TRUE',
            [class_id]
        );

        const result = await client.query(
            `INSERT INTO teacher_attendance_sessions
             (class_id, teacher_id, fecha, hora_inicio, hora_fin, tema, observaciones, total_estudiantes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [class_id, teacherId, fecha, hora_inicio, hora_fin, tema, observaciones, studentsCount.rows[0].total]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Sesión de asistencia creada'
        });

    } catch (error) {
        debugLog.error('teachers-portal', 'Error creando sesión de asistencia', sanitizeError(error, 'teachers-portal'));

        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                error: 'Ya existe una sesión para esta clase en esta fecha'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error al crear sesión'
        });
    } finally {
        client.release();
    }
});

/**
 * POST /api/teachers-portal/attendance
 * Registrar asistencia de estudiantes
 */
router.post('/attendance', authenticateToken, requireTeacher, async (req, res) => {
    const client = await pool.connect();

    try {
        const { session_id, attendances } = req.body;
        const teacherId = req.teacher.id;

        // Verificar que la sesión pertenece al docente
        const sessionCheck = await client.query(
            'SELECT * FROM teacher_attendance_sessions WHERE id = $1 AND teacher_id = $2',
            [session_id, teacherId]
        );

        if (sessionCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: 'No tiene permisos para esta sesión'
            });
        }

        const session = sessionCheck.rows[0];

        if (session.cerrada) {
            return res.status(400).json({
                success: false,
                error: 'La sesión ya está cerrada'
            });
        }

        await client.query('BEGIN');

        const results = [];

        // Registrar asistencia de cada estudiante
        for (const att of attendances) {
            const { student_id, tipo, justificada, observaciones } = att;

            const result = await client.query(
                `INSERT INTO attendance
                 (student_id, fecha, tipo, justificada, observaciones, materia)
                 VALUES ($1, $2, $3, $4, $5, (SELECT materia FROM teacher_classes tc JOIN teacher_attendance_sessions tas ON tc.id = tas.class_id WHERE tas.id = $6))
                 ON CONFLICT (student_id, fecha, materia)
                 DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    justificada = EXCLUDED.justificada,
                    observaciones = EXCLUDED.observaciones
                 RETURNING *`,
                [student_id, session.fecha, tipo, justificada || false, observaciones, session_id]
            );

            results.push(result.rows[0]);
        }

        // Actualizar estadísticas de la sesión
        const stats = attendances.reduce((acc, att) => {
            if (att.tipo === 'asistencia') acc.asistencias++;
            else if (att.tipo === 'falta') acc.faltas++;
            else if (att.tipo === 'retardo') acc.retardos++;
            return acc;
        }, { asistencias: 0, faltas: 0, retardos: 0 });

        await client.query(
            `UPDATE teacher_attendance_sessions
             SET total_asistencias = $1, total_faltas = $2, total_retardos = $3
             WHERE id = $4`,
            [stats.asistencias, stats.faltas, stats.retardos, session_id]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            data: results,
            stats,
            message: 'Asistencias registradas exitosamente'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        debugLog.error('teachers-portal', 'Error registrando asistencias', sanitizeError(error, 'teachers-portal'));
        res.status(500).json({
            success: false,
            error: 'Error al registrar asistencias'
        });
    } finally {
        client.release();
    }
});

/**
 * PUT /api/teachers-portal/attendance/sessions/:id/close
 * Cerrar sesión de asistencia
 */
router.put('/attendance/sessions/:id/close', authenticateToken, requireTeacher, async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;
        const teacherId = req.teacher.id;

        const result = await client.query(
            `UPDATE teacher_attendance_sessions
             SET cerrada = TRUE, fecha_cierre = CURRENT_TIMESTAMP
             WHERE id = $1 AND teacher_id = $2 AND cerrada = FALSE
             RETURNING *`,
            [id, teacherId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Sesión no encontrada o ya cerrada'
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Sesión cerrada exitosamente'
        });

    } catch (error) {
        debugLog.error('teachers-portal', 'Error cerrando sesión', sanitizeError(error, 'teachers-portal'));
        res.status(500).json({
            success: false,
            error: 'Error al cerrar sesión'
        });
    } finally {
        client.release();
    }
});

// ============================================
// RECURSOS EDUCATIVOS
// ============================================

/**
 * GET /api/teachers-portal/resources
 * Obtener recursos del docente
 */
router.get('/resources', authenticateToken, requireTeacher, async (req, res) => {
    const client = await pool.connect();

    try {
        const { class_id, tipo, categoria } = req.query;
        const teacherId = req.teacher.id;

        let query = 'SELECT * FROM teacher_resources WHERE teacher_id = $1';
        const params = [teacherId];

        if (class_id) {
            query += ' AND class_id = $2';
            params.push(class_id);
        }

        if (tipo) {
            query += ` AND tipo = $${params.length + 1}`;
            params.push(tipo);
        }

        if (categoria) {
            query += ` AND categoria = $${params.length + 1}`;
            params.push(categoria);
        }

        query += ' ORDER BY created_at DESC';

        const result = await client.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length
        });

    } catch (error) {
        debugLog.error('teachers-portal', 'Error obteniendo recursos', sanitizeError(error, 'teachers-portal'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener recursos'
        });
    } finally {
        client.release();
    }
});

/**
 * POST /api/teachers-portal/resources
 * Subir/crear un recurso educativo
 */
router.post('/resources', authenticateToken, requireTeacher, async (req, res) => {
    const client = await pool.connect();

    try {
        const teacherId = req.teacher.id;
        const {
            class_id,
            titulo,
            descripcion,
            tipo,
            categoria,
            archivo_nombre,
            archivo_url,
            archivo_tamano,
            archivo_tipo_mime,
            enlace_externo,
            visible_estudiantes,
            visible_padres,
            fecha_publicacion,
            fecha_expiracion
        } = req.body;

        if (!titulo || !tipo) {
            return res.status(400).json({
                success: false,
                error: 'Título y tipo son requeridos'
            });
        }

        const result = await client.query(
            `INSERT INTO teacher_resources
             (teacher_id, class_id, titulo, descripcion, tipo, categoria, archivo_nombre, archivo_url, archivo_tamano, archivo_tipo_mime, enlace_externo, visible_estudiantes, visible_padres, fecha_publicacion, fecha_expiracion)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             RETURNING *`,
            [teacherId, class_id, titulo, descripcion, tipo, categoria, archivo_nombre, archivo_url, archivo_tamano, archivo_tipo_mime, enlace_externo, visible_estudiantes !== false, visible_padres || false, fecha_publicacion, fecha_expiracion]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Recurso creado exitosamente'
        });

    } catch (error) {
        debugLog.error('teachers-portal', 'Error creando recurso', sanitizeError(error, 'teachers-portal'));
        res.status(500).json({
            success: false,
            error: 'Error al crear recurso'
        });
    } finally {
        client.release();
    }
});

// ============================================
// NOTIFICACIONES
// ============================================

/**
 * GET /api/teachers-portal/notifications
 * Obtener notificaciones del docente
 */
router.get('/notifications', authenticateToken, requireTeacher, async (req, res) => {
    const client = await pool.connect();

    try {
        const { unread_only, limit = 20 } = req.query;
        const teacherId = req.teacher.id;

        let query = `
            SELECT * FROM teacher_notifications
            WHERE teacher_id = $1 AND archivada = FALSE
        `;

        if (unread_only === 'true') {
            query += ' AND leida = FALSE';
        }

        query += ' ORDER BY created_at DESC LIMIT $2';

        const result = await client.query(query, [teacherId, limit]);

        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length
        });

    } catch (error) {
        debugLog.error('teachers-portal', 'Error obteniendo notificaciones', sanitizeError(error, 'teachers-portal'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener notificaciones'
        });
    } finally {
        client.release();
    }
});

/**
 * PUT /api/teachers-portal/notifications/:id/read
 * Marcar notificación como leída
 */
router.put('/notifications/:id/read', authenticateToken, requireTeacher, async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;
        const teacherId = req.teacher.id;

        const result = await client.query(
            `UPDATE teacher_notifications
             SET leida = TRUE, fecha_lectura = CURRENT_TIMESTAMP
             WHERE id = $1 AND teacher_id = $2
             RETURNING *`,
            [id, teacherId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Notificación no encontrada'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        debugLog.error('teachers-portal', 'Error marcando notificación', sanitizeError(error, 'teachers-portal'));
        res.status(500).json({
            success: false,
            error: 'Error al marcar notificación'
        });
    } finally {
        client.release();
    }
});

// ============================================
// MENSAJERÍA
// ============================================

/**
 * GET /api/teachers-portal/messages
 * Obtener mensajes del docente
 */
router.get('/messages', authenticateToken, requireTeacher, async (req, res) => {
    const client = await pool.connect();

    try {
        const { recipient_type, unread_only } = req.query;
        const teacherId = req.teacher.id;

        let query = `
            SELECT * FROM teacher_messages
            WHERE teacher_id = $1 AND archivado = FALSE
        `;

        const params = [teacherId];

        if (recipient_type) {
            query += ` AND recipient_type = $2`;
            params.push(recipient_type);
        }

        if (unread_only === 'true') {
            query += ` AND leido = FALSE`;
        }

        query += ' ORDER BY created_at DESC LIMIT 50';

        const result = await client.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length
        });

    } catch (error) {
        debugLog.error('teachers-portal', 'Error obteniendo mensajes', sanitizeError(error, 'teachers-portal'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener mensajes'
        });
    } finally {
        client.release();
    }
});

/**
 * POST /api/teachers-portal/messages
 * Enviar mensaje
 */
router.post('/messages', authenticateToken, requireTeacher, async (req, res) => {
    const client = await pool.connect();

    try {
        const teacherId = req.teacher.id;
        const {
            recipient_type,
            recipient_id,
            related_student_id,
            asunto,
            mensaje,
            parent_message_id,
            importante
        } = req.body;

        if (!recipient_type || !recipient_id || !asunto || !mensaje) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos'
            });
        }

        const result = await client.query(
            `INSERT INTO teacher_messages
             (teacher_id, recipient_type, recipient_id, related_student_id, asunto, mensaje, parent_message_id, es_respuesta, importante)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [teacherId, recipient_type, recipient_id, related_student_id, asunto, mensaje, parent_message_id, !!parent_message_id, importante || false]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Mensaje enviado exitosamente'
        });

    } catch (error) {
        debugLog.error('teachers-portal', 'Error enviando mensaje', sanitizeError(error, 'teachers-portal'));
        res.status(500).json({
            success: false,
            error: 'Error al enviar mensaje'
        });
    } finally {
        client.release();
    }
});

// Export router
module.exports = router;
