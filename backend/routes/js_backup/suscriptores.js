/**
 * 📧 API CRUD PARA SUSCRIPTORES DE NOTIFICACIONES
 * Gestión completa de suscriptores
 * Fecha: 09 Octubre 2025
 * Actualización: 01 Noviembre 2025 - Convertido a PostgreSQL
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
const router = express.Router();
// ✅ FASE 3: Using DAO layer instead of direct pool access
const SuscriptoresDAO = require('../data/suscriptores.dao');
const crypto = require('crypto');

// ============================================
// GET - Listar todos los suscriptores
// ============================================
router.get('/', async (req, res) => {
    try {
        debugLog.log('SUSCRIPTORES', '📧 [SUSCRIPTORES] Obteniendo lista de suscriptores...');

        // ✅ FASE 3: Using SuscriptoresDAO
        const suscriptores = await SuscriptoresDAO.getAll();

        debugLog.log('SUSCRIPTORES', `✅ [SUSCRIPTORES] ${suscriptores.length} suscriptores encontrados`);

        res.json({
            success: true,
            total: suscriptores.length,
            data: suscriptores
        });

    } catch (error) {
        debugLog.error('SUSCRIPTORES', '❌ Error al obtener suscriptores:', sanitizeError(error, 'suscriptores'));

        // Si la tabla/columna no existe, devolver datos vacíos en lugar de error
        if (error.code === '42P01' || error.code === '42703') {
            debugLog.log('SUSCRIPTORES', '⚠️ Tabla/columna "suscriptores_notificaciones" no existe - devolviendo datos vacíos');
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

        // ✅ FASE 3: Using SuscriptoresDAO
        const suscriptores = await SuscriptoresDAO.getByEstado(estado);

        res.json({
            success: true,
            estado,
            total: suscriptores.length,
            suscriptores
        });

    } catch (error) {
        debugLog.error('SUSCRIPTORES', '❌ Error al filtrar por estado:', sanitizeError(error, 'suscriptores'));
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
        const { tipo } = req.query;

        // ✅ FASE 3: Using SuscriptoresDAO
        const suscriptores = await SuscriptoresDAO.getActivosForEmail(tipo);

        res.json({
            success: true,
            tipo: tipo || 'todas',
            total: suscriptores.length,
            emails: suscriptores.map(s => s.email),
            suscriptores
        });

    } catch (error) {
        debugLog.error('SUSCRIPTORES', '❌ Error al obtener emails activos:', sanitizeError(error, 'suscriptores'));
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
        debugLog.log('SUSCRIPTORES', '📊 [SUSCRIPTORES] Obteniendo estadísticas generales...');

        // ✅ FASE 3: Using SuscriptoresDAO
        const stats = await SuscriptoresDAO.getStats();

        debugLog.log('SUSCRIPTORES', '✅ [SUSCRIPTORES] Estadísticas obtenidas');

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        debugLog.error('SUSCRIPTORES', '❌ Error al obtener estadísticas:', sanitizeError(error, 'suscriptores'));

        // Si la tabla/columna no existe, devolver datos vacíos en lugar de error
        if (error.code === '42P01' || error.code === '42703') {
            debugLog.log('SUSCRIPTORES', '⚠️ Tabla/columna "suscriptores_notificaciones" no existe - devolviendo datos vacíos');
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

        // ✅ FASE 3: Using SuscriptoresDAO
        const suscriptor = await SuscriptoresDAO.getById(id);

        if (!suscriptor) {
            return res.status(404).json({ success: false, error: 'Suscriptor no encontrado' });
        }

        res.json({ success: true, suscriptor });

    } catch (error) {
        debugLog.error('SUSCRIPTORES', '❌ Error al obtener suscriptor:', sanitizeError(error, 'suscriptores'));
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
        // ✅ FASE 3: Using SuscriptoresDAO
        const existing = await SuscriptoresDAO.getByEmail(email);

        if (existing) {
            // Si ya existe pero está cancelado, reactivar
            if (existing.estado === 'cancelado') {
                await SuscriptoresDAO.reactivate(email, {
                    notif_convocatorias, notif_becas, notif_eventos, notif_noticias, notif_todas
                });

                return res.json({
                    success: true,
                    message: 'Suscripción reactivada exitosamente',
                    id: existing.id,
                    reactivated: true
                });
            }

            // Si ya está activo, actualizar preferencias
            await SuscriptoresDAO.updatePreferences(email, {
                notif_convocatorias, notif_becas, notif_eventos, notif_noticias, notif_todas
            });

            return res.json({
                success: true,
                message: 'Preferencias actualizadas exitosamente',
                id: existing.id,
                updated: true
            });
        }

        // Generar token de verificación
        const token_verificacion = crypto.randomBytes(32).toString('hex');

        // ✅ FASE 3: Using SuscriptoresDAO
        const result = await SuscriptoresDAO.create({
            email, nombre, notif_convocatorias, notif_becas, notif_eventos,
            notif_noticias, notif_todas, token_verificacion,
            ip_registro, user_agent, fuente
        });

        res.status(201).json({
            success: true,
            message: 'Suscriptor registrado exitosamente',
            id: result.id,
            token_verificacion,
            updated: false
        });

    } catch (error) {
        debugLog.error('SUSCRIPTORES', '❌ Error al crear suscriptor:', sanitizeError(error, 'suscriptores'));
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

        // ✅ FASE 3: Using SuscriptoresDAO
        const result = await SuscriptoresDAO.update(id, {
            email, nombre, notif_convocatorias, notif_becas,
            notif_eventos, notif_noticias, notif_todas, estado, verificado
        });

        // Check if update affected rows
        if (!result || result.length === 0) {
            return res.status(404).json({ success: false, error: 'Suscriptor no encontrado' });
        }

        res.json({ success: true, message: 'Suscriptor actualizado exitosamente' });

    } catch (error) {
        debugLog.error('SUSCRIPTORES', '❌ Error al actualizar suscriptor:', sanitizeError(error, 'suscriptores'));
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

        // ✅ FASE 3: Using SuscriptoresDAO
        const result = await SuscriptoresDAO.verifyEmail(token);

        if (!result || result.length === 0) {
            return res.status(404).json({ success: false, error: 'Token de verificación inválido' });
        }

        res.json({ success: true, message: 'Email verificado exitosamente' });

    } catch (error) {
        debugLog.error('SUSCRIPTORES', '❌ Error al verificar email:', sanitizeError(error, 'suscriptores'));
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

        // ✅ FASE 3: Using SuscriptoresDAO
        const result = await SuscriptoresDAO.cancel(email);

        if (!result || result.length === 0) {
            return res.status(404).json({ success: false, error: 'Suscriptor no encontrado' });
        }

        res.json({ success: true, message: 'Suscripción cancelada exitosamente' });

    } catch (error) {
        debugLog.error('SUSCRIPTORES', '❌ Error al cancelar suscripción:', sanitizeError(error, 'suscriptores'));
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

        // ✅ FASE 3: Using SuscriptoresDAO
        const result = await SuscriptoresDAO.registerSend(id, abierto);

        if (!result || result.length === 0) {
            return res.status(404).json({ success: false, error: 'Suscriptor no encontrado' });
        }

        res.json({ success: true, message: 'Envío registrado exitosamente' });

    } catch (error) {
        debugLog.error('SUSCRIPTORES', '❌ Error al registrar envío:', sanitizeError(error, 'suscriptores'));
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

        // ✅ FASE 3: Using SuscriptoresDAO
        const result = await SuscriptoresDAO.delete(id);

        if (!result || result.length === 0) {
            return res.status(404).json({ success: false, error: 'Suscriptor no encontrado' });
        }

        res.json({ success: true, message: 'Suscriptor eliminado exitosamente' });

    } catch (error) {
        debugLog.error('SUSCRIPTORES', '❌ Error al eliminar suscriptor:', sanitizeError(error, 'suscriptores'));
        res.status(500).json({
            success: false,
            error: 'Error al eliminar suscriptor'
        });
    }
});

module.exports = router;
