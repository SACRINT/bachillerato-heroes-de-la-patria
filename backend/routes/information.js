/**
 * ℹ️ RUTAS DE INFORMACIÓN DINÁMICA
 * Gestión de contenido para el chatbot y sitio web
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../config/database');
const { requireAdmin, authenticateToken } = require('../middleware/auth');
const { logger } = require('../middleware/logger');
const router = express.Router();

// ============================================
// RUTAS PÚBLICAS
// ============================================

/**
 * GET /api/information
 * Obtener toda la información pública disponible
 */
router.get('/', async (req, res, next) => {
    try {
        const { category, active_only = 'true', limit = 50 } = req.query;
        
        let query = `
            SELECT id, clave, categoria, titulo, contenido, prioridad, updated_at
            FROM informacion_dinamica 
            WHERE 1=1
        `;
        
        const params = [];
        
        if (active_only === 'true') {
            query += ' AND is_active = TRUE';
        }
        
        if (category) {
            query += ' AND categoria = ?';
            params.push(category);
        }
        
        // Solo información pública para usuarios no autenticados
        query += ' AND (es_confidencial = FALSE OR es_confidencial IS NULL)';
        query += ' AND (requiere_autenticacion = FALSE OR requiere_autenticacion IS NULL)';
        
        query += ' ORDER BY prioridad DESC, updated_at DESC';
        query += ' LIMIT ?';
        params.push(parseInt(limit));
        
        const information = await executeQuery(query, params);
        
        res.json({
            success: true,
            data: information,
            total: information.length,
            filters: {
                category: category || 'all',
                active_only: active_only === 'true'
            }
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/information/categories
 * Obtener lista de categorías disponibles
 */
router.get('/categories', async (req, res, next) => {
    try {
        const categories = await executeQuery(`
            SELECT 
                categoria,
                COUNT(*) as total_items,
                MAX(updated_at) as last_updated
            FROM informacion_dinamica 
            WHERE is_active = TRUE
            AND (es_confidencial = FALSE OR es_confidencial IS NULL)
            AND (requiere_autenticacion = FALSE OR requiere_autenticacion IS NULL)
            GROUP BY categoria
            ORDER BY total_items DESC
        `);
        
        res.json({
            success: true,
            categories: categories,
            total: categories.length
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/information/:id
 * Obtener información específica por ID
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const information = await executeQuery(`
            SELECT id, clave, categoria, titulo, contenido, prioridad, 
                   es_confidencial, requiere_autenticacion, updated_at
            FROM informacion_dinamica 
            WHERE id = ? AND is_active = TRUE
        `, [id]);
        
        if (information.length === 0) {
            return res.status(404).json({
                error: 'Información no encontrada',
                message: 'El elemento solicitado no existe o no está disponible'
            });
        }
        
        const item = information[0];
        
        // Verificar si requiere autenticación
        if (item.requiere_autenticacion || item.es_confidencial) {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: 'Esta información requiere autenticación'
            });
        }
        
        res.json({
            success: true,
            data: item
        });
        
    } catch (error) {
        next(error);
    }
});

// ============================================
// RUTAS PROTEGIDAS (ADMINISTRACIÓN)
// ============================================

/**
 * POST /api/information
 * Crear nueva información (solo administradores)
 */
router.post('/', authenticateToken, requireAdmin, [
    body('clave').isLength({ min: 1, max: 100 }).withMessage('Clave requerida'),
    body('categoria').isLength({ min: 1, max: 50 }).withMessage('Categoría requerida'),
    body('titulo').isLength({ min: 1, max: 200 }).withMessage('Título requerido'),
    body('contenido').notEmpty().withMessage('Contenido requerido'),
    body('prioridad').optional().isInt({ min: 1, max: 10 }),
    body('es_confidencial').optional().isBoolean(),
    body('requiere_autenticacion').optional().isBoolean()
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
            clave,
            categoria,
            titulo,
            contenido,
            prioridad = 5,
            es_confidencial = false,
            requiere_autenticacion = false,
            tipos_usuario_permitidos = null,
            fecha_inicio = null,
            fecha_fin = null
        } = req.body;
        
        // Verificar que la clave sea única
        const existing = await executeQuery(
            'SELECT id FROM informacion_dinamica WHERE clave = ?',
            [clave]
        );
        
        if (existing.length > 0) {
            return res.status(409).json({
                error: 'Clave duplicada',
                message: 'Ya existe información con esta clave'
            });
        }
        
        // Validar JSON del contenido
        let contenidoJson;
        try {
            contenidoJson = typeof contenido === 'string' ? contenido : JSON.stringify(contenido);
            JSON.parse(contenidoJson); // Validar que sea JSON válido
        } catch (jsonError) {
            return res.status(400).json({
                error: 'Contenido inválido',
                message: 'El contenido debe ser un JSON válido'
            });
        }
        
        const result = await executeQuery(`
            INSERT INTO informacion_dinamica 
            (clave, categoria, titulo, contenido, prioridad, es_confidencial, 
             requiere_autenticacion, tipos_usuario_permitidos, fecha_inicio, fecha_fin) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            clave,
            categoria,
            titulo,
            contenidoJson,
            prioridad,
            es_confidencial,
            requiere_autenticacion,
            tipos_usuario_permitidos ? JSON.stringify(tipos_usuario_permitidos) : null,
            fecha_inicio,
            fecha_fin
        ]);
        
        await logger.info('Nueva información creada', {
            informacionId: result.insertId,
            clave: clave,
            categoria: categoria,
            creadoPor: req.user.id
        });
        
        res.status(201).json({
            success: true,
            message: 'Información creada exitosamente',
            data: {
                id: result.insertId,
                clave: clave,
                categoria: categoria,
                titulo: titulo
            }
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/information/:id
 * Actualizar información existente (solo administradores)
 */
router.put('/:id', authenticateToken, requireAdmin, [
    body('titulo').optional().isLength({ min: 1, max: 200 }),
    body('contenido').optional().notEmpty(),
    body('prioridad').optional().isInt({ min: 1, max: 10 }),
    body('es_confidencial').optional().isBoolean(),
    body('requiere_autenticacion').optional().isBoolean()
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
        
        // Construir query dinámicamente
        const allowedFields = [
            'titulo', 'contenido', 'prioridad', 'es_confidencial', 
            'requiere_autenticacion', 'fecha_inicio', 'fecha_fin'
        ];
        
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                if (field === 'contenido') {
                    // Validar JSON
                    try {
                        const contenidoJson = typeof req.body[field] === 'string' 
                            ? req.body[field] 
                            : JSON.stringify(req.body[field]);
                        JSON.parse(contenidoJson);
                        updateFields[field] = '?';
                        updateValues.push(contenidoJson);
                    } catch (jsonError) {
                        throw new Error('El contenido debe ser un JSON válido');
                    }
                } else {
                    updateFields[field] = '?';
                    updateValues.push(req.body[field]);
                }
            }
        });
        
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({
                error: 'Sin cambios',
                message: 'No se proporcionaron campos para actualizar'
            });
        }
        
        // Agregar timestamp de actualización
        updateFields['updated_at'] = 'CURRENT_TIMESTAMP';
        updateValues.push(id);
        
        const setClause = Object.keys(updateFields)
            .map(field => `${field} = ${updateFields[field]}`)
            .join(', ');
        
        const result = await executeQuery(
            `UPDATE informacion_dinamica SET ${setClause} WHERE id = ? AND is_active = TRUE`,
            updateValues
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Información no encontrada',
                message: 'El elemento no existe o no se puede actualizar'
            });
        }
        
        await logger.info('Información actualizada', {
            informacionId: id,
            camposActualizados: Object.keys(updateFields),
            actualizadoPor: req.user.id
        });
        
        res.json({
            success: true,
            message: 'Información actualizada exitosamente'
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/information/:id
 * Eliminar información (soft delete)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const result = await executeQuery(
            'UPDATE informacion_dinamica SET is_active = FALSE WHERE id = ?',
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Información no encontrada',
                message: 'El elemento no existe'
            });
        }
        
        await logger.info('Información eliminada', {
            informacionId: id,
            eliminadoPor: req.user.id
        });
        
        res.json({
            success: true,
            message: 'Información eliminada exitosamente'
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/information/admin/all
 * Obtener toda la información (incluyendo inactiva) para administradores
 */
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const { category, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT id, clave, categoria, titulo, contenido, prioridad, 
                   es_confidencial, requiere_autenticacion, is_active,
                   created_at, updated_at
            FROM informacion_dinamica 
            WHERE 1=1
        `;
        
        const params = [];
        
        if (category) {
            query += ' AND categoria = ?';
            params.push(category);
        }
        
        query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const information = await executeQuery(query, params);
        
        // Contar total para paginación
        let countQuery = 'SELECT COUNT(*) as total FROM informacion_dinamica WHERE 1=1';
        const countParams = [];
        
        if (category) {
            countQuery += ' AND categoria = ?';
            countParams.push(category);
        }
        
        const countResult = await executeQuery(countQuery, countParams);
        const total = countResult[0].total;
        
        res.json({
            success: true,
            data: information,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        next(error);
    }
});

module.exports = router;