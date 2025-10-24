/**
 * 📧 API CRUD PARA SUSCRIPTORES DE NOTIFICACIONES
 * Gestión completa de suscriptores
 * Fecha: 09 Octubre 2025
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const crypto = require('crypto');

// ============================================
// GET - Listar todos los suscriptores
// ============================================
router.get('/', async (req, res) => {
    try {
        const [suscriptores] = await db.query(`
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

        res.json({
            success: true,
            total: suscriptores.length,
            suscriptores
        });

    } catch (error) {
        console.error('❌ Error al obtener suscriptores:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener lista de suscriptores'
        });
    }
});

// ============================================
// GET - Filtrar suscriptores por estado
// ============================================
router.get('/estado/:estado', async (req, res) => {
    try {
        const { estado } = req.params;

        const [suscriptores] = await db.query(
            'SELECT * FROM suscriptores_notificaciones WHERE estado = ? ORDER BY fecha_registro DESC',
            [estado]
        );

        res.json({
            success: true,
            estado,
            total: suscriptores.length,
            suscriptores
        });

    } catch (error) {
        console.error('❌ Error al filtrar por estado:', error);
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

        // Filtrar por tipo de notificación
        if (tipo && tipo !== 'todas') {
            query += ` AND (notif_${tipo} = TRUE OR notif_todas = TRUE)`;
        } else {
            query += ` AND notif_todas = TRUE`;
        }

        const [suscriptores] = await db.query(query);

        res.json({
            success: true,
            tipo: tipo || 'todas',
            total: suscriptores.length,
            emails: suscriptores.map(s => s.email),
            suscriptores
        });

    } catch (error) {
        console.error('❌ Error al obtener emails activos:', error);
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
        // Total de suscriptores
        const [totalResult] = await db.query('SELECT COUNT(*) as total FROM suscriptores_notificaciones');
        const total = totalResult[0].total;

        // Por estado
        const [porEstado] = await db.query(`
            SELECT estado, COUNT(*) as cantidad
            FROM suscriptores_notificaciones
            GROUP BY estado
        `);

        // Verificados vs no verificados
        const [porVerificacion] = await db.query(`
            SELECT verificado, COUNT(*) as cantidad
            FROM suscriptores_notificaciones
            GROUP BY verificado
        `);

        // Por tipo de notificación
        const [porTipo] = await db.query(`
            SELECT
                SUM(notif_convocatorias) as convocatorias,
                SUM(notif_becas) as becas,
                SUM(notif_eventos) as eventos,
                SUM(notif_noticias) as noticias,
                SUM(notif_todas) as todas
            FROM suscriptores_notificaciones
        `);

        // Nuevos suscriptores (últimos 7 días)
        const [nuevosResult] = await db.query(`
            SELECT COUNT(*) as total
            FROM suscriptores_notificaciones
            WHERE fecha_registro >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `);

        // Tasa de apertura promedio
        const [tasaAperturaResult] = await db.query(`
            SELECT
                AVG(CASE WHEN total_enviados > 0 THEN (total_abiertos / total_enviados) * 100 ELSE 0 END) as tasa_promedio
            FROM suscriptores_notificaciones
            WHERE total_enviados > 0
        `);

        res.json({
            success: true,
            stats: {
                total,
                porEstado,
                porVerificacion,
                porTipo: porTipo[0],
                nuevosUltimos7Dias: nuevosResult[0].total,
                tasaAperturaPromedio: Math.round(tasaAperturaResult[0].tasa_promedio || 0)
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

// ============================================
// GET - Obtener suscriptor por ID
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [suscriptores] = await db.query(
            'SELECT * FROM suscriptores_notificaciones WHERE id = ?',
            [id]
        );

        if (suscriptores.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Suscriptor no encontrado'
            });
        }

        res.json({
            success: true,
            suscriptor: suscriptores[0]
        });

    } catch (error) {
        console.error('❌ Error al obtener suscriptor:', error);
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
        const [existing] = await db.query(
            'SELECT id, estado FROM suscriptores_notificaciones WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            // Si ya existe pero está cancelado, reactivar
            if (existing[0].estado === 'cancelado') {
                await db.query(
                    `UPDATE suscriptores_notificaciones SET
                        estado = 'activo',
                        notif_convocatorias = ?,
                        notif_becas = ?,
                        notif_eventos = ?,
                        notif_noticias = ?,
                        notif_todas = ?,
                        fecha_actualizacion = NOW()
                    WHERE email = ?`,
                    [notif_convocatorias, notif_becas, notif_eventos, notif_noticias, notif_todas, email]
                );

                return res.json({
                    success: true,
                    message: 'Suscripción reactivada exitosamente',
                    id: existing[0].id,
                    reactivated: true
                });
            }

            // Si ya está activo, actualizar preferencias
            await db.query(
                `UPDATE suscriptores_notificaciones SET
                    notif_convocatorias = ?,
                    notif_becas = ?,
                    notif_eventos = ?,
                    notif_noticias = ?,
                    notif_todas = ?,
                    fecha_actualizacion = NOW()
                WHERE email = ?`,
                [notif_convocatorias, notif_becas, notif_eventos, notif_noticias, notif_todas, email]
            );

            return res.json({
                success: true,
                message: 'Preferencias actualizadas exitosamente',
                id: existing[0].id,
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
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(insertQuery, [
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
            id: result.insertId,
            token_verificacion, // Para enviar email de verificación
            updated: false
        });

    } catch (error) {
        console.error('❌ Error al crear suscriptor:', error);
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
            estado
        } = req.body;

        const updateQuery = `
            UPDATE suscriptores_notificaciones SET
                email = ?,
                nombre = ?,
                notif_convocatorias = ?,
                notif_becas = ?,
                notif_eventos = ?,
                notif_noticias = ?,
                notif_todas = ?,
                estado = ?,
                fecha_actualizacion = NOW()
            WHERE id = ?
        `;

        const [result] = await db.query(updateQuery, [
            email,
            nombre || null,
            notif_convocatorias !== undefined ? notif_convocatorias : false,
            notif_becas !== undefined ? notif_becas : false,
            notif_eventos !== undefined ? notif_eventos : false,
            notif_noticias !== undefined ? notif_noticias : false,
            notif_todas !== undefined ? notif_todas : true,
            estado || 'activo',
            id
        ]);

        if (result.affectedRows === 0) {
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
        console.error('❌ Error al actualizar suscriptor:', error);
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

        const [result] = await db.query(
            `UPDATE suscriptores_notificaciones SET
                verificado = TRUE,
                fecha_verificacion = NOW()
            WHERE token_verificacion = ?`,
            [token]
        );

        if (result.affectedRows === 0) {
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
        console.error('❌ Error al verificar email:', error);
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

        const [result] = await db.query(
            `UPDATE suscriptores_notificaciones SET
                estado = 'cancelado',
                fecha_cancelacion = NOW()
            WHERE email = ?`,
            [email]
        );

        if (result.affectedRows === 0) {
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
        console.error('❌ Error al cancelar suscripción:', error);
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
            ? 'total_enviados = total_enviados + 1, total_abiertos = total_abiertos + 1, ultimo_envio = NOW()'
            : 'total_enviados = total_enviados + 1, ultimo_envio = NOW()';

        const [result] = await db.query(
            `UPDATE suscriptores_notificaciones SET ${updateFields} WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
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
        console.error('❌ Error al registrar envío:', error);
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

        const [result] = await db.query(
            'DELETE FROM suscriptores_notificaciones WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
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
        console.error('❌ Error al eliminar suscriptor:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar suscriptor'
        });
    }
});

module.exports = router;
