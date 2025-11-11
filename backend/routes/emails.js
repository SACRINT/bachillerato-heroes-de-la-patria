/**
 * 📧 API PARA ENVÍO DE EMAILS - Sistema de Notificaciones
 * Endpoints para enviar emails transaccionales y newsletters
 * Fecha: 18 de Octubre, 2025
 */

const express = require('express');
const devLogger = require('../utils/devLogger');
const router = express.Router();
const emailService = require('../services/emailService');

// =====================================================
// POST /api/emails/test - Enviar email de prueba
// =====================================================
router.post('/test', async (req, res) => {
    try {
        const { to, type = 'welcome' } = req.body;

        if (!to) {
            return res.status(400).json({
                success: false,
                error: 'Email destinatario es requerido'
            });
        }

        let result;

        switch (type) {
            case 'welcome':
                result = await emailService.sendWelcomeEmail({
                    email: to,
                    nombre: 'Usuario de Prueba'
                });
                break;

            case 'event':
                result = await emailService.sendEventNotification(
                    { email: to, nombre: 'Usuario de Prueba' },
                    {
                        titulo: 'Conferencia de Innovación Educativa',
                        descripcion: 'Únete a nuestra conferencia sobre las últimas tendencias en educación.',
                        fecha_inicio: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        fecha_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
                        ubicacion: 'Auditorio Principal',
                        modalidad: 'presencial',
                        slug: 'conferencia-innovacion-educativa'
                    }
                );
                break;

            case 'password-recovery':
                result = await emailService.sendPasswordRecovery(
                    { email: to, nombre: 'Usuario de Prueba' },
                    'test-token-123456789'
                );
                break;

            case 'inscription':
                result = await emailService.sendInscriptionConfirmation(
                    { email: to, nombre: 'Usuario de Prueba' },
                    {
                        nombre: 'Taller de Robótica Avanzada',
                        descripcion: 'Aprende a programar robots y crear proyectos innovadores',
                        fecha: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                        ubicacion: 'Laboratorio de Tecnología',
                        instrucciones: 'Lleva tu laptop y ganas de aprender. Se proporcionará el material necesario.'
                    }
                );
                break;

            case 'news':
                result = await emailService.sendNewsNotification(
                    { email: to, nombre: 'Usuario de Prueba' },
                    {
                        titulo: 'Estudiantes del BGE ganan competencia nacional',
                        resumen: 'Nuestros estudiantes obtuvieron el primer lugar en el torneo nacional de robótica.',
                        imagen_url: 'https://via.placeholder.com/600x300',
                        slug: 'estudiantes-ganan-competencia-nacional',
                        fecha_publicacion: new Date()
                    }
                );
                break;

            case 'newsletter':
                result = await emailService.sendNewsletter(
                    { email: to, nombre: 'Usuario de Prueba', id: 'test-user-id' },
                    {
                        asunto: 'Newsletter Mensual - Octubre 2025',
                        titulo: 'Bienvenido a nuestro Newsletter de Octubre',
                        contenido: '<p>Este mes tenemos muchas novedades emocionantes para compartir contigo.</p>',
                        noticias: [
                            {
                                titulo: 'Nueva biblioteca digital',
                                resumen: 'Accede a miles de libros en formato digital.',
                                slug: 'nueva-biblioteca-digital'
                            },
                            {
                                titulo: 'Día del Estudiante 2025',
                                resumen: 'Celebra con nosotros con actividades y sorpresas.',
                                slug: 'dia-del-estudiante-2025'
                            }
                        ],
                        eventos: [
                            {
                                titulo: 'Feria de Ciencias',
                                descripcion: 'Muestra tus proyectos científicos',
                                fecha_inicio: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
                                ubicacion: 'Campus Principal',
                                slug: 'feria-de-ciencias'
                            }
                        ]
                    }
                );
                break;

            default:
                return res.status(400).json({
                    success: false,
                    error: 'Tipo de email no válido. Usa: welcome, event, password-recovery, inscription, news, newsletter'
                });
        }

        res.json({
            success: true,
            message: `Email de prueba (${type}) enviado exitosamente`,
            data: result
        });

    } catch (error) {
        devLogger.error('❌ Error al enviar email de prueba:', error);
        res.status(500).json({
            success: false,
            error: 'Error al enviar email de prueba',
            details: error.message
        });
    }
});

// =====================================================
// POST /api/emails/welcome - Enviar email de bienvenida
// =====================================================
router.post('/welcome', async (req, res) => {
    try {
        const { email, nombre } = req.body;

        if (!email || !nombre) {
            return res.status(400).json({
                success: false,
                error: 'Email y nombre son requeridos'
            });
        }

        const result = await emailService.sendWelcomeEmail({ email, nombre });

        res.json({
            success: true,
            message: 'Email de bienvenida enviado',
            data: result
        });

    } catch (error) {
        devLogger.error('❌ Error al enviar email de bienvenida:', error);
        res.status(500).json({
            success: false,
            error: 'Error al enviar email de bienvenida'
        });
    }
});

// =====================================================
// POST /api/emails/event-notification - Notificación de evento
// =====================================================
router.post('/event-notification', async (req, res) => {
    try {
        const { user, event } = req.body;

        if (!user?.email || !event?.titulo) {
            return res.status(400).json({
                success: false,
                error: 'Datos de usuario y evento son requeridos'
            });
        }

        const result = await emailService.sendEventNotification(user, event);

        res.json({
            success: true,
            message: 'Notificación de evento enviada',
            data: result
        });

    } catch (error) {
        devLogger.error('❌ Error al enviar notificación de evento:', error);
        res.status(500).json({
            success: false,
            error: 'Error al enviar notificación de evento'
        });
    }
});

// =====================================================
// POST /api/emails/password-recovery - Recuperación de contraseña
// =====================================================
router.post('/password-recovery', async (req, res) => {
    try {
        const { email, nombre, resetToken } = req.body;

        if (!email || !resetToken) {
            return res.status(400).json({
                success: false,
                error: 'Email y token son requeridos'
            });
        }

        const result = await emailService.sendPasswordRecovery(
            { email, nombre: nombre || 'Usuario' },
            resetToken
        );

        res.json({
            success: true,
            message: 'Email de recuperación enviado',
            data: result
        });

    } catch (error) {
        devLogger.error('❌ Error al enviar email de recuperación:', error);
        res.status(500).json({
            success: false,
            error: 'Error al enviar email de recuperación'
        });
    }
});

// =====================================================
// POST /api/emails/bulk - Envío masivo de emails
// =====================================================
router.post('/bulk', async (req, res) => {
    try {
        const { emails, delayMs = 100 } = req.body;

        if (!Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere un array de emails'
            });
        }

        const result = await emailService.sendBulkEmails(emails, delayMs);

        res.json({
            success: true,
            message: 'Envío masivo completado',
            data: result
        });

    } catch (error) {
        devLogger.error('❌ Error en envío masivo:', error);
        res.status(500).json({
            success: false,
            error: 'Error en envío masivo de emails'
        });
    }
});

// =====================================================
// POST /api/emails/clear-cache - Limpiar caché de plantillas
// =====================================================
router.post('/clear-cache', async (req, res) => {
    try {
        emailService.clearTemplateCache();

        res.json({
            success: true,
            message: 'Caché de plantillas limpiado'
        });

    } catch (error) {
        devLogger.error('❌ Error al limpiar caché:', error);
        res.status(500).json({
            success: false,
            error: 'Error al limpiar caché'
        });
    }
});

// =====================================================
// GET /api/emails/status - Estado del servicio de email
// =====================================================
router.get('/status', async (req, res) => {
    try {
        await emailService.init();

        res.json({
            success: true,
            data: {
                initialized: emailService.initialized,
                environment: process.env.NODE_ENV || 'development',
                from: emailService.from
            }
        });

    } catch (error) {
        devLogger.error('❌ Error al verificar estado:', error);
        res.status(500).json({
            success: false,
            error: 'Error al verificar estado del servicio'
        });
    }
});

module.exports = router;
