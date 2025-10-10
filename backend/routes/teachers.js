/**
 * 👨‍🏫 RUTAS DE DOCENTES
 * Gestión completa del personal docente
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../config/database');
const { authenticateToken, requireAdmin, requireTeacher } = require('../middleware/auth');
const { logger } = require('../middleware/logger');
const router = express.Router();

// ============================================
// RUTAS PÚBLICAS (información básica)
// ============================================

/**
 * GET /api/teachers/directory
 * Directorio público de docentes
 */
router.get('/directory', async (req, res, next) => {
    try {
        const { especialidad } = req.query;
        
        let query = `
            SELECT 
                u.nombre,
                u.apellido_paterno,
                u.apellido_materno,
                d.especialidad,
                d.anos_experiencia,
                d.grado_academico,
                d.telefono_oficina,
                d.horario_atencion
            FROM docentes d
            JOIN usuarios u ON d.usuario_id = u.id
            WHERE u.activo = TRUE AND d.visible_directorio = TRUE
        `;
        
        const params = [];
        
        if (especialidad) {
            query += ' AND d.especialidad = ?';
            params.push(especialidad);
        }
        
        query += ' ORDER BY u.apellido_paterno, u.apellido_materno, u.nombre';
        
        const teachers = await executeQuery(query, params);
        
        res.json({
            success: true,
            data: teachers,
            total: teachers.length
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/teachers/specialties
 * Obtener especialidades de docentes
 */
router.get('/specialties', async (req, res, next) => {
    try {
        const specialties = await executeQuery(`
            SELECT 
                especialidad,
                COUNT(*) as total_docentes,
                COUNT(CASE WHEN visible_directorio = TRUE THEN 1 END) as docentes_publicos
            FROM docentes d
            JOIN usuarios u ON d.usuario_id = u.id
            WHERE u.activo = TRUE
            GROUP BY especialidad
            ORDER BY especialidad
        `);
        
        res.json({
            success: true,
            data: specialties
        });
        
    } catch (error) {
        next(error);
    }
});

// ============================================
// RUTAS PROTEGIDAS (docentes y administradores)
// ============================================

/**
 * GET /api/teachers
 * Obtener lista completa de docentes (con filtros y paginación)
 */
router.get('/', authenticateToken, requireTeacher, async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            especialidad, 
            tipo_contrato,
            search 
        } = req.query;
        
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT 
                d.id,
                d.numero_empleado,
                u.nombre,
                u.apellido_paterno,
                u.apellido_materno,
                u.email,
                d.especialidad,
                d.anos_experiencia,
                d.grado_academico,
                d.tipo_contrato,
                d.fecha_ingreso,
                d.telefono_oficina,
                d.horario_atencion,
                d.visible_directorio
            FROM docentes d
            JOIN usuarios u ON d.usuario_id = u.id
            WHERE u.activo = TRUE
        `;
        
        const params = [];
        
        if (especialidad) {
            query += ' AND d.especialidad = ?';
            params.push(especialidad);
        }
        
        if (tipo_contrato) {
            query += ' AND d.tipo_contrato = ?';
            params.push(tipo_contrato);
        }
        
        if (search) {
            query += ` AND (
                u.nombre LIKE ? OR 
                u.apellido_paterno LIKE ? OR 
                u.apellido_materno LIKE ? OR 
                d.numero_empleado LIKE ?
            )`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        query += ' ORDER BY u.apellido_paterno, u.apellido_materno, u.nombre';
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const teachers = await executeQuery(query, params);
        
        // Contar total para paginación
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM docentes d
            JOIN usuarios u ON d.usuario_id = u.id
            WHERE u.activo = TRUE
        `;
        
        const countParams = [];
        let paramIndex = 0;
        
        if (especialidad) {
            countQuery += ' AND d.especialidad = ?';
            countParams.push(params[paramIndex++]);
        }
        
        if (tipo_contrato) {
            countQuery += ' AND d.tipo_contrato = ?';
            countParams.push(params[paramIndex++]);
        }
        
        if (search) {
            countQuery += ` AND (
                u.nombre LIKE ? OR 
                u.apellido_paterno LIKE ? OR 
                u.apellido_materno LIKE ? OR 
                d.numero_empleado LIKE ?
            )`;
            for (let i = 0; i < 4; i++) {
                countParams.push(params[paramIndex++]);
            }
        }
        
        const countResult = await executeQuery(countQuery, countParams);
        const total = countResult[0].total;
        
        res.json({
            success: true,
            data: teachers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                pages: Math.ceil(total / limit)
            },
            filters: {
                especialidad: especialidad || null,
                tipo_contrato: tipo_contrato || null,
                search: search || null
            }
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/teachers/:id
 * Obtener información detallada de un docente
 */
router.get('/:id', authenticateToken, requireTeacher, async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Información básica del docente
        const teacherInfo = await executeQuery(`
            SELECT 
                d.*,
                u.nombre,
                u.apellido_paterno,
                u.apellido_materno,
                u.email,
                u.fecha_creacion,
                u.ultimo_acceso
            FROM docentes d
            JOIN usuarios u ON d.usuario_id = u.id
            WHERE d.id = ? AND u.activo = TRUE
        `, [id]);
        
        if (teacherInfo.length === 0) {
            return res.status(404).json({
                error: 'Docente no encontrado',
                message: 'El docente no existe o no está activo'
            });
        }
        
        const teacher = teacherInfo[0];
        
        // Obtener materias que imparte
        const subjects = await executeQuery(`
            SELECT 
                c.id as curso_id,
                c.nombre as curso_nombre,
                c.tipo,
                c.creditos,
                m.id as materia_id,
                m.grupo,
                m.semestre,
                m.horario,
                COUNT(DISTINCT im.estudiante_id) as total_estudiantes
            FROM materias m
            JOIN cursos c ON m.curso_id = c.id
            LEFT JOIN inscripciones_materias im ON m.id = im.materia_id
            WHERE m.docente_id = ? AND m.activa = TRUE
            GROUP BY m.id
            ORDER BY c.nombre, m.grupo
        `, [id]);
        
        // Obtener estadísticas de calificaciones
        const gradeStats = await executeQuery(`
            SELECT 
                COUNT(*) as total_calificaciones,
                AVG(calificacion_final) as promedio_general,
                COUNT(CASE WHEN calificacion_final >= 7.0 THEN 1 END) as aprobados,
                COUNT(CASE WHEN calificacion_final < 7.0 THEN 1 END) as reprobados
            FROM calificaciones cal
            JOIN materias m ON cal.materia_id = m.id
            WHERE m.docente_id = ? 
            AND cal.periodo = (
                SELECT MAX(periodo) FROM calificaciones cal2 
                JOIN materias m2 ON cal2.materia_id = m2.id 
                WHERE m2.docente_id = ?
            )
        `, [id, id]);
        
        res.json({
            success: true,
            data: {
                teacher: teacher,
                subjects: subjects,
                statistics: gradeStats[0] || {
                    total_calificaciones: 0,
                    promedio_general: 0,
                    aprobados: 0,
                    reprobados: 0
                }
            }
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/teachers
 * Crear nuevo docente (solo administradores)
 */
router.post('/', authenticateToken, requireAdmin, [
    body('email').isEmail().normalizeEmail().withMessage('Email válido requerido'),
    body('password').isLength({ min: 8 }).withMessage('Contraseña mínimo 8 caracteres'),
    body('nombre').isLength({ min: 2, max: 100 }).withMessage('Nombre entre 2 y 100 caracteres'),
    body('apellido_paterno').isLength({ min: 2, max: 100 }).withMessage('Apellido paterno requerido'),
    body('numero_empleado').isLength({ min: 1, max: 50 }).withMessage('Número de empleado requerido'),
    body('especialidad').notEmpty().withMessage('Especialidad requerida'),
    body('anos_experiencia').isInt({ min: 0 }).withMessage('Años de experiencia debe ser un número positivo'),
    body('tipo_contrato').isIn(['base', 'contrato', 'honorarios']).withMessage('Tipo de contrato inválido')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos de entrada inválidos',
                details: errors.array()
            });
        }
        
        const {
            email,
            password,
            nombre,
            apellido_paterno,
            apellido_materno,
            numero_empleado,
            especialidad,
            anos_experiencia,
            grado_academico,
            tipo_contrato,
            fecha_ingreso,
            telefono_oficina,
            horario_atencion
        } = req.body;
        
        // Verificar que email no exista
        const existingUser = await executeQuery(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );
        
        if (existingUser.length > 0) {
            return res.status(409).json({
                error: 'Email ya registrado',
                message: 'Ya existe un usuario con este email'
            });
        }
        
        // Verificar que número de empleado no exista
        const existingTeacher = await executeQuery(
            'SELECT id FROM docentes WHERE numero_empleado = ?',
            [numero_empleado]
        );
        
        if (existingTeacher.length > 0) {
            return res.status(409).json({
                error: 'Número de empleado duplicado',
                message: 'Ya existe un docente con este número de empleado'
            });
        }
        
        // Crear usuario
        const bcrypt = require('bcryptjs');
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        const userResult = await executeQuery(
            `INSERT INTO usuarios (email, password_hash, nombre, apellido_paterno, apellido_materno, tipo_usuario) 
             VALUES (?, ?, ?, ?, ?, 'docente')`,
            [email, passwordHash, nombre, apellido_paterno, apellido_materno || null]
        );
        
        const userId = userResult.insertId;
        
        // Crear registro de docente
        const teacherResult = await executeQuery(
            `INSERT INTO docentes (usuario_id, numero_empleado, especialidad, anos_experiencia, grado_academico, 
                                  tipo_contrato, fecha_ingreso, telefono_oficina, horario_atencion) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId, 
                numero_empleado, 
                especialidad, 
                anos_experiencia, 
                grado_academico || null, 
                tipo_contrato, 
                fecha_ingreso || new Date(),
                telefono_oficina || null,
                horario_atencion || null
            ]
        );
        
        const teacherId = teacherResult.insertId;
        
        await logger.info('Docente creado exitosamente', {
            teacherId: teacherId,
            userId: userId,
            numero_empleado: numero_empleado,
            creadoPor: req.user.id
        });
        
        res.status(201).json({
            success: true,
            message: 'Docente creado exitosamente',
            data: {
                id: teacherId,
                usuario_id: userId,
                numero_empleado: numero_empleado,
                email: email,
                nombre: nombre,
                apellido_paterno: apellido_paterno,
                apellido_materno: apellido_materno,
                especialidad: especialidad,
                tipo_contrato: tipo_contrato
            }
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/teachers/:id
 * Actualizar información de docente
 */
router.put('/:id', authenticateToken, requireAdmin, [
    body('especialidad').optional().notEmpty(),
    body('anos_experiencia').optional().isInt({ min: 0 }),
    body('tipo_contrato').optional().isIn(['base', 'contrato', 'honorarios']),
    body('visible_directorio').optional().isBoolean()
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos de entrada inválidos',
                details: errors.array()
            });
        }
        
        const { id } = req.params;
        const updateFields = {};
        const updateValues = [];
        
        const allowedFields = [
            'especialidad', 'anos_experiencia', 'grado_academico', 
            'tipo_contrato', 'telefono_oficina', 'horario_atencion', 'visible_directorio'
        ];
        
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateFields[field] = '?';
                updateValues.push(req.body[field]);
            }
        });
        
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({
                error: 'Sin cambios',
                message: 'No se proporcionaron campos para actualizar'
            });
        }
        
        updateValues.push(id);
        
        const setClause = Object.keys(updateFields)
            .map(field => `${field} = ${updateFields[field]}`)
            .join(', ');
        
        const result = await executeQuery(
            `UPDATE docentes SET ${setClause} WHERE id = ?`,
            updateValues
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Docente no encontrado',
                message: 'El docente no existe'
            });
        }
        
        await logger.info('Docente actualizado', {
            teacherId: id,
            camposActualizados: Object.keys(updateFields),
            actualizadoPor: req.user.id
        });
        
        res.json({
            success: true,
            message: 'Docente actualizado exitosamente'
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/teachers/:id
 * Desactivar docente (soft delete)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Desactivar usuario asociado
        const result = await executeQuery(`
            UPDATE usuarios u
            JOIN docentes d ON u.id = d.usuario_id
            SET u.activo = FALSE
            WHERE d.id = ?
        `, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Docente no encontrado',
                message: 'El docente no existe'
            });
        }
        
        await logger.info('Docente desactivado', {
            teacherId: id,
            desactivadoPor: req.user.id
        });
        
        res.json({
            success: true,
            message: 'Docente desactivado exitosamente'
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/teachers/:id/schedule
 * Obtener horario de un docente
 */
router.get('/:id/schedule', authenticateToken, requireTeacher, async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const schedule = await executeQuery(`
            SELECT 
                m.id as materia_id,
                c.nombre as curso,
                m.grupo,
                m.semestre,
                m.horario,
                m.aula,
                COUNT(im.estudiante_id) as total_estudiantes
            FROM materias m
            JOIN cursos c ON m.curso_id = c.id
            LEFT JOIN inscripciones_materias im ON m.id = im.materia_id
            WHERE m.docente_id = ? AND m.activa = TRUE
            GROUP BY m.id
            ORDER BY m.horario
        `, [id]);
        
        res.json({
            success: true,
            data: schedule
        });
        
    } catch (error) {
        next(error);
    }
});

module.exports = router;