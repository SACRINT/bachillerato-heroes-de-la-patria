/**
 * 🎓 RUTAS DE EGRESADOS CON POSTGRESQL
 * Sistema completo de gestión de perfiles profesionales
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Configuración de nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * POST /api/egresados/create
 * Crear nuevo perfil profesional (requiere confirmación por email)
 */
// 🎓 ALMACENAMIENTO EN MEMORIA (temporal mientras se espera confirmación de email)
// Esto es seguro porque los tokens expiran en 24 horas
/**
 * POST /api/egresados/create
 * Crea una solicitud de perfil profesional, la guarda en la tabla de pendientes de confirmación por email
 * y envía un correo de confirmación.
 *
 * @author BGE
 * @version 2.0.0
 * @since 6-NOV-2025
 */
router.post('/create', async (req, res) => {
    const client = await pool.connect();
    try {
        console.log('📝 [EGRESADOS CREATE v2] Recibido formulario de egresado para confirmación en BD.');

        const {
            nombre_completo, email, telefono, fecha_nacimiento, anio_egreso,
            carrera_tecnica, generacion, experiencia_laboral, habilidades, idiomas,
            cv_url, disponibilidad, pretension_salarial, ciudad, estado,
            linkedin_url, portafolio_url, referencias
        } = req.body;

        // Validaciones básicas
        if (!nombre_completo || !email || !anio_egreso || !carrera_tecnica) {
            return res.status(400).json({
                success: false,
                message: '⚠️ Campos obligatorios faltantes: Nombre, Email, Año de Egreso y Carrera.'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: '❌ El email que ingresaste no es válido.'
            });
        }

        // Generar token de confirmación
        const confirmationToken = crypto.randomBytes(32).toString('hex');

        const datosJSON = {
            nombre_completo, email, telefono, fecha_nacimiento, anio_egreso,
            carrera_tecnica, generacion, experiencia_laboral, habilidades, idiomas,
            cv_url, disponibilidad, pretension_salarial, ciudad, estado,
            linkedin_url, portafolio_url, referencias
        };

        // Insertar en la tabla de pendientes de confirmación
        const insertQuery = `
            INSERT INTO egresados_pending_confirmation
            (email_usuario, datos_json, confirmation_token)
            VALUES ($1, $2, $3)
            ON CONFLICT (email_usuario) DO UPDATE SET
                datos_json = EXCLUDED.datos_json,
                confirmation_token = EXCLUDED.confirmation_token,
                token_expires_at = (now() + '24 hours'::interval),
                fecha_actualizacion = now()
            RETURNING confirmation_token;
        `;

        const result = await client.query(insertQuery, [email, JSON.stringify(datosJSON), confirmationToken]);
        const finalToken = result.rows[0].confirmation_token;

        console.log(`✅ [EGRESADOS CREATE v2] Solicitud guardada en 'egresados_pending_confirmation' para ${email}.`);

        // Enviar email de confirmación
        const confirmationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/egresados.html#confirm-email?token=${finalToken}`;

        const mailOptions = {
            from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '📧 Confirma tu dirección de email - BGE Héroes de la Patria',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .button { display: inline-block; background: #27ae60; color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                        .button:hover { background: #229954; }
                        .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
                        .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0; color: #856404; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>📧 Confirmación de Email Requerida</h1>
                        </div>
                        <div class="content">
                            <p>Hola <strong>${nombre_completo}</strong>,</p>
                            <p>Hemos recibido tu solicitud para crear un perfil profesional en BGE Héroes de la Patria.</p>
                            <div class="warning">
                                <strong>⚠️ IMPORTANTE:</strong> Para continuar, debes confirmar que este email te pertenece haciendo clic en el botón de abajo.
                            </div>
                            <div class="info-box">
                                <strong>Información de tu perfil:</strong><br>
                                👤 Nombre: ${nombre_completo}<br>
                                📧 Email: ${email}<br>
                                🎓 Carrera: ${carrera_tecnica}<br>
                                📅 Año de egreso: ${anio_egreso}
                            </div>
                            <div style="text-align: center;">
                                <a href="${confirmationUrl}" class="button">
                                    ✅ Confirmar mi Email
                                </a>
                            </div>
                            <p style="font-size: 12px; color: #666;">
                                Este enlace expira en 24 horas.<br>
                                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                                <code>${confirmationUrl}</code>
                            </p>
                            <div class="info-box">
                                <strong>¿Qué sucede después?</strong><br>
                                1. ✅ Confirmas tu email (ESTE PASO)<br>
                                2. 📋 Tu solicitud va a revisión del equipo administrativo<br>
                                3. ✅ Se valida que fuiste alumno de BGE<br>
                                4. 📬 Recibirás email cuando sea aprobado<br>
                                5. 🌐 Tu perfil estará visible para empresas
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ [EGRESADOS CREATE v2] Email de confirmación enviado a:', email);

        res.json({
            success: true,
            message: `✅ REGISTRO EXITOSO: Te hemos enviado un email de confirmación a ${email}. Por favor revisa tu bandeja de entrada (incluyendo carpeta SPAM) y haz clic en el enlace para confirmar tu email.`
        });

    } catch (error) {
        console.error('❌ [EGRESADOS CREATE v2] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar la solicitud de perfil.',
            error: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * POST /api/egresados/confirm/:token
 * Confirma el email del egresado usando el token de la tabla `egresados_pending_confirmation`,
 * mueve los datos a `pendientes_aprobacion` y limpia el registro temporal.
 *
 * @author BGE
 * @version 2.0.0
 * @since 6-NOV-2025
 */
router.post('/confirm/:token', async (req, res) => {
    const { token } = req.params;
    const client = await pool.connect();

    try {
        console.log(`📧 [DEBUG] Iniciando confirmación con token: ${token ? token.substring(0, 8) : 'N/A'}...`);

        // 1. Buscar el token en la tabla de pendientes
        const selectQuery = `
            SELECT id, email_usuario, datos_json, token_expires_at
            FROM egresados_pending_confirmation
            WHERE confirmation_token = $1;
        `;
        const pendingResult = await client.query(selectQuery, [token]);

        if (pendingResult.rows.length === 0) {
            console.warn(`❌ [DEBUG] Token no encontrado en la BD.`);
            return res.status(404).json({
                success: false,
                error: 'DEBUG: El token proporcionado no fue encontrado en la base de datos. Puede que ya haya sido utilizado.'
            });
        }

        const pendingData = pendingResult.rows[0];

        // 2. Validar que no haya expirado
        if (new Date() > new Date(pendingData.token_expires_at)) {
            console.warn(`❌ [DEBUG] Token expirado.`);
            // Limpiar el token expirado
            await client.query('DELETE FROM egresados_pending_confirmation WHERE id = $1', [pendingData.id]);
            return res.status(404).json({
                success: false,
                error: 'DEBUG: El token ha expirado. La solicitud de limpieza se ha ejecutado.'
            });
        }

        const datosJSON = pendingData.datos_json;
        const email = pendingData.email_usuario;

        // 3. Iniciar transacción para mover los datos (UPSERT)
        await client.query('BEGIN');

        try {
            // UPSERT Logic: Check if a pending approval for this user already exists
            const existingApproval = await client.query(
                'SELECT id FROM pendientes_aprobacion WHERE email_usuario = $1 AND tipo_solicitud = $2',
                [email, 'egresados']
            );

            if (existingApproval.rows.length > 0) {
                // UPDATE existing pending approval
                const existingId = existingApproval.rows[0].id;
                console.log(`[DEBUG] Found existing pending approval with ID: ${existingId}. Updating it.`);
                const updateQuery = `
                    UPDATE pendientes_aprobacion
                    SET datos_json = $1, fecha_solicitud = NOW(), email_confirmado = $2, estado = $3
                    WHERE id = $4;
                `;
                await client.query(updateQuery, [JSON.stringify(datosJSON), true, 'pendiente', existingId]);
            } else {
                // INSERT new pending approval
                console.log(`[DEBUG] No existing pending approval found. Inserting new one.`);
                const insertFinalQuery = `
                    INSERT INTO pendientes_aprobacion
                    (tipo_solicitud, email_usuario, datos_json, estado, email_confirmado, fecha_solicitud)
                    VALUES ($1, $2, $3, $4, $5, NOW());
                `;
                await client.query(insertFinalQuery, ['egresados', email, JSON.stringify(datosJSON), 'pendiente', true]);
            }

            // Delete from the temporary table
            await client.query('DELETE FROM egresados_pending_confirmation WHERE id = $1', [pendingData.id]);

            await client.query('COMMIT');

            // 4. Enviar notificación al admin (opcional, pero buena práctica)
            const adminMailOptions = {
                from: `"BGE Sistema" <${process.env.EMAIL_USER}>`,
                to: '21ebh0200x.sep@gmail.com',
                subject: `🆕 Nuevo perfil de egresado confirmado - ${datosJSON.nombre_completo}`,
                html: `<p>Se ha confirmado un nuevo perfil profesional de egresado que requiere revisión para: <strong>${datosJSON.nombre_completo}</strong> (${email}).</p>`
            };
            await transporter.sendMail(adminMailOptions);
            console.log('📧 [EGRESADOS CONFIRM v2] Notificación enviada al admin.');

            // 5. Respuesta exitosa
            res.json({
                success: true,
                message: `✅ ¡Email confirmado exitosamente, ${datosJSON.nombre_completo}! Tu solicitud ha sido enviada a revisión del equipo administrativo.`
            });

        } catch (innerError) {
            await client.query('ROLLBACK');
            console.error('❌ [DEBUG] Error en transacción UPSERT:', innerError);
            return res.status(500).json({
                success: false,
                error: 'DEBUG: Ocurrió un error durante la transacción UPSERT en la base de datos.',
                detail: innerError.message
            });
        }

    } catch (error) {
        console.error('❌ [DEBUG] Error general en /confirm:', error);
        res.status(500).json({
            success: false,
            error: 'DEBUG: Ocurrió un error inesperado en el servidor.',
            detail: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * GET /api/egresados/list
 * Listar todos los egresados (con filtros)
 */
router.get('/list', async (req, res) => {
    try {
        const { estado_perfil, confirmado, anio_egreso } = req.query;

        let query = 'SELECT * FROM egresados WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (estado_perfil) {
            query += ` AND estado_perfil = $${paramCount}`;
            params.push(estado_perfil);
            paramCount++;
        }

        if (confirmado !== undefined) {
            query += ` AND confirmado = $${paramCount}`;
            params.push(confirmado === 'true');
            paramCount++;
        }

        if (anio_egreso) {
            query += ` AND anio_egreso = $${paramCount}`;
            params.push(anio_egreso);
            paramCount++;
        }

        // ORDER BY usando ID (siempre existe y da orden cronológico)
        query += ' ORDER BY id DESC';

        const result = await pool.query(query, params);

        res.json({
            success: true,
            total: result.rows.length,
            egresados: result.rows.map(row => ({
                ...row,
                habilidades: row.habilidades ? JSON.parse(row.habilidades) : [],
                idiomas: row.idiomas ? JSON.parse(row.idiomas) : [],
                referencias: row.referencias ? JSON.parse(row.referencias) : []
            }))
        });

    } catch (error) {
        console.error('❌ Error listando egresados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la lista de egresados',
            error: error.message
        });
    }
});

/**
 * GET /api/egresados/stats
 * Estadísticas de egresados
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT
                COUNT(*) as total,
                COUNT(CASE WHEN confirmado = true THEN 1 END) as confirmados,
                COUNT(CASE WHEN confirmado = false THEN 1 END) as sin_confirmar,
                COUNT(CASE WHEN estado_perfil = 'pendiente' THEN 1 END) as pendientes,
                COUNT(CASE WHEN estado_perfil = 'aprobado' THEN 1 END) as aprobados,
                COUNT(CASE WHEN estado_perfil = 'rechazado' THEN 1 END) as rechazados
            FROM egresados
        `);

        res.json({
            success: true,
            stats: stats.rows[0]
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
});

/**
 * GET /api/egresados/stats/general - Alias de /stats
 * Para compatibilidad con frontend que llama a /stats/general
 */
router.get('/stats/general', async (req, res) => {
    try {
        console.log('📊 [EGRESADOS] Obteniendo estadísticas generales...');

        const stats = await pool.query(`
            SELECT
                COUNT(*) as total,
                COUNT(CASE WHEN verificado = true THEN 1 END) as verificados,
                COUNT(CASE WHEN verificado = false THEN 1 END) as sin_verificar,
                COUNT(CASE WHEN estatus_estudios = 'estudiando' THEN 1 END) as estudiando,
                COUNT(CASE WHEN estatus_estudios = 'trabajando' THEN 1 END) as trabajando,
                COUNT(CASE WHEN estatus_estudios = 'ambos' THEN 1 END) as estudiando_trabajando,
                COUNT(CASE WHEN autoriza_publicar = true THEN 1 END) as autorizan_publicar
            FROM egresados
        `);

        // Estadísticas por generación
        const porGeneracion = await pool.query(`
            SELECT generacion, COUNT(*) as cantidad
            FROM egresados
            WHERE generacion IS NOT NULL
            GROUP BY generacion
            ORDER BY generacion DESC
        `);

        const statsData = {
            ...stats.rows[0],
            porGeneracion: porGeneracion.rows
        };

        console.log('✅ [EGRESADOS] Estadísticas obtenidas');

        res.json({
            success: true,
            data: statsData
        });

    } catch (error) {
        console.error('❌ [EGRESADOS] Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
});

/**
 * GET /api/egresados - Alias de /list
 * Para compatibilidad con frontend que llama directamente a /api/egresados
 */
router.get('/', async (req, res) => {
    try {
        console.log('🎓 [EGRESADOS] Obteniendo lista de egresados...');

        const { estado_perfil, confirmado, anio_egreso } = req.query;

        let query = 'SELECT * FROM egresados WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (estado_perfil) {
            query += ` AND estado_perfil = $${paramCount}`;
            params.push(estado_perfil);
            paramCount++;
        }

        if (confirmado !== undefined) {
            query += ` AND confirmado = $${paramCount}`;
            params.push(confirmado === 'true');
            paramCount++;
        }

        if (anio_egreso) {
            query += ` AND anio_egreso = $${paramCount}`;
            params.push(anio_egreso);
            paramCount++;
        }

        query += ' ORDER BY id DESC';

        const result = await pool.query(query, params);

        console.log(`✅ [EGRESADOS] ${result.rows.length} egresados encontrados`);

        res.json({
            success: true,
            total: result.rows.length,
            data: result.rows.map(row => ({
                ...row,
                habilidades: row.habilidades ? JSON.parse(row.habilidades) : [],
                idiomas: row.idiomas ? JSON.parse(row.idiomas) : [],
                referencias: row.referencias ? JSON.parse(row.referencias) : []
            }))
        });

    } catch (error) {
        console.error('❌ [EGRESADOS] Error listando egresados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la lista de egresados',
            error: error.message
        });
    }
});

/**
 * PUT /api/egresados/:id/approve
 * Aprobar perfil de egresado
 */
router.put('/:id/approve', async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;
        const { notas_admin } = req.body;

        // Actualizar estado
        const result = await client.query(
            `UPDATE egresados
             SET estado_perfil = 'aprobado',
                 fecha_aprobacion = NOW(),
                 notas_admin = $1
             WHERE id = $2
             RETURNING *`,
            [notas_admin || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Perfil no encontrado'
            });
        }

        const egresado = result.rows[0];

        // Enviar email de aprobación
        const mailOptions = {
            from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
            to: egresado.email,
            subject: '✅ Tu perfil profesional ha sido aprobado',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #27ae60; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 ¡Perfil Aprobado!</h1>
                        </div>
                        <div class="content">
                            <p>Hola <strong>${egresado.nombre_completo}</strong>,</p>
                            <p>¡Excelentes noticias! Tu perfil profesional ha sido aprobado por nuestro equipo.</p>
                            <p><strong>Tu perfil ahora está visible para empresas que buscan talento.</strong></p>
                            <p>Te notificaremos cuando haya oportunidades laborales que coincidan con tu perfil.</p>
                            <p>¡Mucho éxito en tu búsqueda laboral! 🚀</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: 'Perfil aprobado exitosamente',
            egresado: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error aprobando perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al aprobar el perfil',
            error: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * PUT /api/egresados/:id/reject
 * Rechazar perfil de egresado
 */
router.put('/:id/reject', async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;
        const { motivo_rechazo } = req.body;

        if (!motivo_rechazo) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere un motivo de rechazo'
            });
        }

        const result = await client.query(
            `UPDATE egresados
             SET estado_perfil = 'rechazado',
                 fecha_rechazo = NOW(),
                 motivo_rechazo = $1
             WHERE id = $2
             RETURNING *`,
            [motivo_rechazo, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Perfil no encontrado'
            });
        }

        const egresado = result.rows[0];

        // Enviar email de rechazo
        const mailOptions = {
            from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
            to: egresado.email,
            subject: 'Actualización sobre tu perfil profesional',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #e74c3c; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Actualización de tu perfil</h1>
                        </div>
                        <div class="content">
                            <p>Hola <strong>${egresado.nombre_completo}</strong>,</p>
                            <p>Hemos revisado tu perfil profesional.</p>
                            <p><strong>Motivo:</strong> ${motivo_rechazo}</p>
                            <p>Si tienes dudas, por favor contacta con nosotros.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: 'Perfil rechazado',
            egresado: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error rechazando perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al rechazar el perfil',
            error: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * DELETE /api/egresados/:id
 * Eliminar perfil de egresado
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM egresados WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Perfil no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Perfil eliminado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error eliminando perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el perfil',
            error: error.message
        });
    }
});

/**
 * POST /api/egresados
 * Crear/Actualizar perfil de egresado a través del flujo de aprobación
 * Mapea los campos del formulario HTML a la tabla de pendientes_aprobacion
 */
router.post('/', async (req, res) => {
    const client = await pool.connect();

    try {
        console.log('📝 [POST /api/egresados] Creando perfil de egresado:', req.body);

        // Mapeo flexible de campos que pueden venir con diferentes nombres
        const {
            // Campos con alias posibles
            nombre_completo = req.body.nombre_completo || req.body.nombre,
            email,
            generacion,
            telefono,
            ciudad,
            carrera_tecnica = req.body.carrera_tecnica || req.body.carrera,
            anio_egreso,
            experiencia_laboral,
            habilidades,
            idiomas,
            cv_url,
            disponibilidad,
            pretension_salarial,
            estado,
            linkedin_url,
            portafolio_url,
            referencias,
            fecha_nacimiento
        } = req.body;

        // Validaciones básicas
        if (!nombre_completo || !email || !anio_egreso || !carrera_tecnica) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos obligatorios: nombre completo, email, año de egreso, carrera técnica'
            });
        }

        // Verificar si hay una solicitud pendiente para este email
        const existingPending = await client.query(
            `SELECT id FROM pendientes_aprobacion
             WHERE tipo_solicitud = 'egresados' AND email_usuario = $1 AND estado = 'pendiente'`,
            [email]
        );

        // Preparar datos en formato JSON para almacenamiento flexible
        const datosJSON = {
            nombre_completo,
            email,
            telefono,
            fecha_nacimiento,
            anio_egreso: anio_egreso ? parseInt(anio_egreso) : null,
            carrera_tecnica,
            generacion,
            experiencia_laboral,
            habilidades: typeof habilidades === 'string' ? JSON.parse(habilidades) : habilidades,
            idiomas: typeof idiomas === 'string' ? JSON.parse(idiomas) : idiomas,
            cv_url,
            disponibilidad,
            pretension_salarial,
            ciudad,
            estado,
            linkedin_url,
            portafolio_url,
            referencias: typeof referencias === 'string' ? JSON.parse(referencias) : referencias
        };

        let result;

        if (existingPending.rows.length > 0) {
            // Actualizar solicitud pendiente existente
            const updateQuery = `
                UPDATE pendientes_aprobacion
                SET datos_json = $1,
                    fecha_solicitud = NOW()
                WHERE id = $2
                RETURNING id, uuid, fecha_solicitud
            `;

            result = await client.query(updateQuery, [
                JSON.stringify(datosJSON),
                existingPending.rows[0].id
            ]);

            console.log('✅ Solicitud de egresado actualizada:', result.rows[0].id);

            return res.json({
                success: true,
                message: '✅ Tu solicitud ha sido actualizada y está pendiente de aprobación.',
                data: {
                    solicitud_id: result.rows[0].id,
                    uuid: result.rows[0].uuid,
                    nombre: nombre_completo,
                    email: email,
                    estado: 'pendiente_aprobacion',
                    fecha_solicitud: result.rows[0].fecha_solicitud,
                    nota: 'Tu perfil está pendiente de aprobación por el administrador.'
                }
            });
        } else {
            // Insertar nueva solicitud
            const insertQuery = `
                INSERT INTO pendientes_aprobacion (
                    tipo_solicitud,
                    email_usuario,
                    datos_json,
                    estado,
                    fecha_solicitud
                )
                VALUES ($1, $2, $3, $4, NOW())
                RETURNING id, uuid, fecha_solicitud
            `;

            result = await client.query(insertQuery, [
                'egresados',                    // tipo_solicitud (CORREGIDO: usar 'egresados' consistente con frontend)
                email,                          // email_usuario
                JSON.stringify(datosJSON),      // datos_json
                'pendiente'                     // estado
            ]);

            console.log('✅ Solicitud de egresado creada:', result.rows[0].id);

            // Enviar email de confirmación (opcional)
            try {
                const mailOptions = {
                    from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: '✅ Tu solicitud ha sido recibida - BGE Héroes de la Patria',
                    html: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <style>
                                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                                .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <h1>✅ Solicitud Recibida</h1>
                                </div>
                                <div class="content">
                                    <p>Hola <strong>${nombre_completo}</strong>,</p>
                                    <p>¡Gracias por compartir tu información profesional con BGE Héroes de la Patria!</p>
                                    <div class="info-box">
                                        <strong>Datos registrados:</strong><br>
                                        📧 Email: ${email}<br>
                                        🎓 Carrera: ${carrera_tecnica}<br>
                                        📅 Año de egreso: ${anio_egreso}
                                    </div>
                                    <p><strong>¿Qué sigue?</strong></p>
                                    <p>Nuestro equipo administrativo revisará tu solicitud en breve y te notificaremos por email una vez que sea aprobada.</p>
                                    <p>¡Gracias por tu paciencia! 🚀</p>
                                </div>
                            </div>
                        </body>
                        </html>
                    `
                };
                await transporter.sendMail(mailOptions);
            } catch (emailError) {
                console.warn('⚠️ Error enviando email de confirmación:', emailError.message);
                // No fallar la solicitud por error de email
            }

            return res.json({
                success: true,
                message: '✅ Tu solicitud ha sido recibida y está pendiente de aprobación. Te notificaremos cuando sea revisada.',
                data: {
                    solicitud_id: result.rows[0].id,
                    uuid: result.rows[0].uuid,
                    nombre: nombre_completo,
                    email: email,
                    estado: 'pendiente_aprobacion',
                    fecha_solicitud: result.rows[0].fecha_solicitud,
                    nota: 'Tu perfil está pendiente de aprobación por el administrador. Una vez aprobado, aparecerá en el directorio de egresados.'
                }
            });
        }

    } catch (error) {
        console.error('❌ Error en POST /api/egresados:', error);
        res.status(500).json({
            success: false,
            error: 'Error al procesar la solicitud',
            message: error.message
        });
    } finally {
        client.release();
    }
});

module.exports = router;
