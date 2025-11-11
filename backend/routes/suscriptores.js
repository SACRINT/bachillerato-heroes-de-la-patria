/**
 * 📧 API CRUD PARA SUSCRIPTORES DE NOTIFICACIONES
 * Gestión completa de suscriptores
 * Fecha: 09 Octubre 2025
 * Actualización: 01 Noviembre 2025 - Convertido a PostgreSQL
 */

const express = require('express');
const devLogger = require('../utils/devLogger');
const router = express.Router();
const { pool } = require('../config/database');
const crypto = require('crypto');

// ============================================
// GET - Listar todos los suscriptores
// ============================================
router.get('/', async (req, res) => {
    try {
        devLogger.log('📧 [SUSCRIPTORES] Obteniendo lista de suscriptores...');

        const result = await pool.query(`
            SELECT
                id,
                email,
                nombre,
                notif_convocatorias,
                notif_becas,
                notif_eventos,
                notif_noticias,
                notif_todas,
                estado,
                verificado,
                fecha_verificacion,
                total_enviados,
                total_abiertos,
                ultimo_envio,
                fuente,
                fecha_registro,
                fecha_actualizacion
            FROM suscriptores_notificaciones
            ORDER BY fecha_registro DESC
        `);

        devLogger.log(`✅ [SUSCRIPTORES] ${result.rows.length} suscriptores encontrados`);

        res.json({
            success: true,
            total: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        devLogger.error('❌ Error al obtener suscriptores:', error);

        // Si la tabla/columna no existe, devolver datos vacíos en lugar de error
        if (error.code === '42P01' || error.code === '42703') {
            devLogger.warn('⚠️ Tabla/columna "suscriptores_notificaciones" no existe - devolviendo datos vacíos');
            return res.json({
                success: true,
                total: 0,
                data: []
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error al obtener lista de suscriptores',
            message: error.message
        });
    }
});

// ============================================
// GET - Filtrar suscriptores por estado
// ============================================
router.get('/estado/:estado', async (req, res) => {
    try {
        const { estado } = req.params;

        const result = await pool.query(
            'SELECT * FROM suscriptores_notificaciones WHERE estado = $1 ORDER BY fecha_registro DESC',
            [estado]
        );

        res.json({
            success: true,
            estado,
            total: result.rows.length,
            suscriptores: result.rows
        });

    } catch (error) {
        devLogger.error('❌ Error al filtrar por estado:', error);
        res.status(500).json({
            success: false,
            error: 'Error al filtrar suscriptores'
        });
    }
});

// ============================================
// GET - Suscriptores activos para envío masivo
// ============================================
router.get('/activos/email', async (req, res) => {
    try {
        const { tipo } = req.query; // convocatorias, becas, eventos, noticias

        let query = `
            SELECT email, nombre
            FROM suscriptores_notificaciones
            WHERE estado = 'activo' AND verificado = TRUE
        `;

        const params = [];

        // Filtrar por tipo de notificación
        if (tipo && tipo !== 'todas') {
            query += ` AND (notif_${tipo} = TRUE OR notif_todas = TRUE)`;
        } else {
            query += ` AND notif_todas = TRUE`;
        }

        const result = await pool.query(query, params);

        res.json({
            success: true,
            tipo: tipo || 'todas',
            total: result.rows.length,
            emails: result.rows.map(s => s.email),
            suscriptores: result.rows
        });

    } catch (error) {
        devLogger.error('❌ Error al obtener emails activos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener emails activos'
        });
    }
});

// ============================================
// GET - Estadísticas generales
// ============================================
router.get('/stats/general', async (req, res) => {
    try {
        devLogger.log('📊 [SUSCRIPTORES] Obteniendo estadísticas generales...');

        // Total de suscriptores
        const totalResult = await pool.query('SELECT COUNT(*) as total FROM suscriptores_notificaciones');
        const total = parseInt(totalResult.rows[0].total);

        // Por estado
        const porEstadoResult = await pool.query(`
            SELECT estado, COUNT(*) as cantidad
            FROM suscriptores_notificaciones
            GROUP BY estado
        `);
        const porEstado = porEstadoResult.rows;

        // Verificados vs no verificados
        const porVerificacionResult = await pool.query(`
            SELECT verificado, COUNT(*) as cantidad
            FROM suscriptores_notificaciones
            GROUP BY verificado
        `);
        const porVerificacion = porVerificacionResult.rows;

        // Por tipo de notificación
        const porTipoResult = await pool.query(`
            SELECT
                SUM(CASE WHEN notif_convocatorias = true THEN 1 ELSE 0 END) as convocatorias,
                SUM(CASE WHEN notif_becas = true THEN 1 ELSE 0 END) as becas,
                SUM(CASE WHEN notif_eventos = true THEN 1 ELSE 0 END) as eventos,
                SUM(CASE WHEN notif_noticias = true THEN 1 ELSE 0 END) as noticias,
                SUM(CASE WHEN notif_todas = true THEN 1 ELSE 0 END) as todas
            FROM suscriptores_notificaciones
        `);
        const porTipo = porTipoResult.rows[0];

        // Nuevos suscriptores (últimos 7 días)
        const nuevosResult = await pool.query(`
            SELECT COUNT(*) as total
            FROM suscriptores_notificaciones
            WHERE fecha_registro >= NOW() - INTERVAL '7 days'
        `);

        // Tasa de apertura promedio
        const tasaAperturaResult = await pool.query(`
            SELECT
                AVG(CASE WHEN total_enviados > 0 THEN (total_abiertos::float / total_enviados) * 100 ELSE 0 END) as tasa_promedio
            FROM suscriptores_notificaciones
            WHERE total_enviados > 0
        `);

        const stats = {
            total,
            porEstado,
            porVerificacion,
            porTipo,
            nuevosUltimos7Dias: parseInt(nuevosResult.rows[0].total),
            tasaAperturaPromedio: Math.round(parseFloat(tasaAperturaResult.rows[0].tasa_promedio) || 0)
        };

        devLogger.log('✅ [SUSCRIPTORES] Estadísticas obtenidas');

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        devLogger.error('❌ Error al obtener estadísticas:', error);

        // Si la tabla/columna no existe, devolver datos vacíos en lugar de error
        if (error.code === '42P01' || error.code === '42703') {
            devLogger.warn('⚠️ Tabla/columna "suscriptores_notificaciones" no existe - devolviendo datos vacíos');
            return res.json({
                success: true,
                data: {
                    total: 0,
                    porEstado: [],
                    porVerificacion: [],
                    porTipo: { convocatorias: 0, becas: 0, eventos: 0, noticias: 0, todas: 0 },
                    nuevosUltimos7Dias: 0,
                    tasaAperturaPromedio: 0
                }
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas',
            message: error.message
        });
    }
});

// ============================================
// GET - Obtener suscriptor por ID
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM suscriptores_notificaciones WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Suscriptor no encontrado'
            });
        }

        res.json({
            success: true,
            suscriptor: result.rows[0]
        });

    } catch (error) {
        devLogger.error('❌ Error al obtener suscriptor:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener datos del suscriptor'
        });
    }
});

// ============================================
// POST - Crear nuevo suscriptor
// ============================================
router.post('/', async (req, res) => {
    try {
        const {
            email,
            nombre,
            notif_convocatorias = false,
            notif_becas = false,
            notif_eventos = false,
            notif_noticias = false,
            notif_todas = true,
            ip_registro,
            user_agent,
            fuente = 'Formulario Web'
        } = req.body;

        // Validaciones básicas
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email es obligatorio'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Formato de email inválido'
            });
        }

        // Verificar si el email ya existe
        const existingResult = await pool.query(
            'SELECT id, estado FROM suscriptores_notificaciones WHERE email = $1',
            [email]
        );

        if (existingResult.rows.length > 0) {
            const existing = existingResult.rows[0];

            // Si ya existe pero está cancelado, reactivar
            if (existing.estado === 'cancelado') {
                await pool.query(
                    `UPDATE suscriptores_notificaciones SET
                        estado = 'activo',
                        notif_convocatorias = $1,
                        notif_becas = $2,
                        notif_eventos = $3,
                        notif_noticias = $4,
                        notif_todas = $5,
                        fecha_actualizacion = CURRENT_TIMESTAMP
                    WHERE email = $6`,
                    [notif_convocatorias, notif_becas, notif_eventos, notif_noticias, notif_todas, email]
                );

                return res.json({
                    success: true,
                    message: 'Suscripción reactivada exitosamente',
                    id: existing.id,
                    reactivated: true
                });
            }

            // Si ya está activo, actualizar preferencias
            await pool.query(
                `UPDATE suscriptores_notificaciones SET
                    notif_convocatorias = $1,
                    notif_becas = $2,
                    notif_eventos = $3,
                    notif_noticias = $4,
                    notif_todas = $5,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE email = $6`,
                [notif_convocatorias, notif_becas, notif_eventos, notif_noticias, notif_todas, email]
            );

            return res.json({
                success: true,
                message: 'Preferencias actualizadas exitosamente',
                id: existing.id,
                updated: true
            });
        }

        // Generar token de verificación
        const token_verificacion = crypto.randomBytes(32).toString('hex');

        // Insertar nuevo suscriptor
        const insertQuery = `
            INSERT INTO suscriptores_notificaciones (
                email,
                nombre,
                notif_convocatorias,
                notif_becas,
                notif_eventos,
                notif_noticias,
                notif_todas,
                token_verificacion,
                ip_registro,
                user_agent,
                fuente
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id
        `;

        const result = await pool.query(insertQuery, [
            email,
            nombre || null,
            notif_convocatorias,
            notif_becas,
            notif_eventos,
            notif_noticias,
            notif_todas,
            token_verificacion,
            ip_registro || null,
            user_agent || null,
            fuente
        ]);

        res.status(201).json({
            success: true,
            message: 'Suscriptor registrado exitosamente',
            id: result.rows[0].id,
            token_verificacion, // Para enviar email de verificación
            updated: false
        });

    } catch (error) {
        devLogger.error('❌ Error al crear suscriptor:', error);
        res.status(500).json({
            success: false,
            error: 'Error al registrar suscriptor',
            details: error.message
        });
    }
});

// ============================================
// PUT - Actualizar suscriptor
// ============================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            email,
            nombre,
            notif_convocatorias,
            notif_becas,
            notif_eventos,
            notif_noticias,
            notif_todas,
            estado,
            verificado
        } = req.body;

        const updateQuery = `
            UPDATE suscriptores_notificaciones SET
                email = $1,
                nombre = $2,
                notif_convocatorias = $3,
                notif_becas = $4,
                notif_eventos = $5,
                notif_noticias = $6,
                notif_todas = $7,
                estado = $8,
                verificado = $9,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = $10
        `;

        const result = await pool.query(updateQuery, [
            email,
            nombre || null,
            notif_convocatorias !== undefined ? notif_convocatorias : false,
            notif_becas !== undefined ? notif_becas : false,
            notif_eventos !== undefined ? notif_eventos : false,
            notif_noticias !== undefined ? notif_noticias : false,
            notif_todas !== undefined ? notif_todas : true,
            estado || 'activo',
            verificado !== undefined ? verificado : false,
            id
        ]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Suscriptor no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Suscriptor actualizado exitosamente'
        });

    } catch (error) {
        devLogger.error('❌ Error al actualizar suscriptor:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar suscriptor'
        });
    }
});

// ============================================
// PATCH - Verificar email de suscriptor
// ============================================
router.patch('/verificar/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const result = await pool.query(
            `UPDATE suscriptores_notificaciones SET
                verificado = TRUE,
                fecha_verificacion = CURRENT_TIMESTAMP
            WHERE token_verificacion = $1`,
            [token]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Token de verificación inválido'
            });
        }

        res.json({
            success: true,
            message: 'Email verificado exitosamente'
        });

    } catch (error) {
        devLogger.error('❌ Error al verificar email:', error);
        res.status(500).json({
            success: false,
            error: 'Error al verificar email'
        });
    }
});

// ============================================
// PATCH - Cancelar suscripción
// ============================================
router.patch('/cancelar/:email', async (req, res) => {
    try {
        const { email } = req.params;

        const result = await pool.query(
            `UPDATE suscriptores_notificaciones SET
                estado = 'cancelado',
                fecha_cancelacion = CURRENT_TIMESTAMP
            WHERE email = $1`,
            [email]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Suscriptor no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Suscripción cancelada exitosamente'
        });

    } catch (error) {
        devLogger.error('❌ Error al cancelar suscripción:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cancelar suscripción'
        });
    }
});

// ============================================
// POST - Registrar envío de notificación
// ============================================
router.post('/:id/envio', async (req, res) => {
    try {
        const { id } = req.params;
        const { abierto = false } = req.body;

        const updateFields = abierto
            ? 'total_enviados = total_enviados + 1, total_abiertos = total_abiertos + 1, ultimo_envio = CURRENT_TIMESTAMP'
            : 'total_enviados = total_enviados + 1, ultimo_envio = CURRENT_TIMESTAMP';

        const result = await pool.query(
            `UPDATE suscriptores_notificaciones SET ${updateFields} WHERE id = $1`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Suscriptor no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Envío registrado exitosamente'
        });

    } catch (error) {
        devLogger.error('❌ Error al registrar envío:', error);
        res.status(500).json({
            success: false,
            error: 'Error al registrar envío'
        });
    }
});

// ============================================
// DELETE - Eliminar suscriptor
// ============================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM suscriptores_notificaciones WHERE id = $1',
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Suscriptor no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Suscriptor eliminado exitosamente'
        });

    } catch (error) {
        devLogger.error('❌ Error al eliminar suscriptor:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar suscriptor'
        });
    }
});

module.exports = router;
