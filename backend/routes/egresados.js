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
router.post('/create', async (req, res) => {
    const client = await pool.connect();

    try {
        console.log('📝 Creando perfil profesional:', req.body);

        const {
            // Datos personales
            nombre_completo,
            email,
            telefono,
            fecha_nacimiento,

            // Educación
            anio_egreso,
            carrera_tecnica,
            generacion,

            // Experiencia
            experiencia_laboral,
            habilidades,
            idiomas,

            // Profesional
            cv_url,
            disponibilidad,
            pretension_salarial,

            // Ubicación
            ciudad,
            estado,

            // Adicionales
            linkedin_url,
            portafolio_url,
            referencias
        } = req.body;

        // Validaciones básicas
        if (!nombre_completo || !email || !anio_egreso || !carrera_tecnica) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios: nombre, email, año de egreso y carrera técnica'
            });
        }

        // Generar ID único y token de confirmación
        const egresadoId = `EGR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
        const confirmationToken = crypto.randomBytes(32).toString('hex');

        // Verificar si el email ya existe
        const existingCheck = await client.query(
            'SELECT id FROM egresados WHERE email = $1',
            [email]
        );

        if (existingCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Este email ya está registrado'
            });
        }

        // 📋 FLUJO MEJORADO: Insertar en tabla de pendientes de aprobación (no directamente en egresados)
        // Esto permite que el admin revise y apruebe la solicitud antes de que aparezca en la BD final

        // Preparar datos en formato JSON para almacenamiento flexible
        const datosJSON = {
            nombre_completo,
            email,
            telefono,
            fecha_nacimiento,
            anio_egreso,
            carrera_tecnica,
            generacion,
            experiencia_laboral,
            habilidades,
            idiomas,
            cv_url,
            disponibilidad,
            pretension_salarial,
            ciudad,
            estado,
            linkedin_url,
            portafolio_url,
            referencias
        };

        // Insertar en pendientes_aprobacion
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

        const result = await client.query(insertQuery, [
            'egresado',                     // tipo_solicitud
            email,                          // email_usuario
            JSON.stringify(datosJSON),      // datos_json
            'pendiente'                     // estado
        ]);

        console.log('✅ Perfil creado, enviando email de confirmación...');

        // Enviar email de confirmación al usuario
        const confirmationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/egresados/confirm/${confirmationToken}`;

        const mailOptions = {
            from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '✅ Confirma tu perfil profesional - BGE Héroes de la Patria',
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
                        .button { display: inline-block; background: #667eea; color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                        .button:hover { background: #764ba2; }
                        .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
                        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎓 Confirma tu Perfil Profesional</h1>
                        </div>
                        <div class="content">
                            <p>Hola <strong>${nombre_completo}</strong>,</p>

                            <p>¡Gracias por crear tu perfil profesional en BGE Héroes de la Patria!</p>

                            <div class="info-box">
                                <strong>Detalles de tu perfil:</strong><br>
                                📧 Email: ${email}<br>
                                🎓 Carrera: ${carrera_tecnica}<br>
                                📅 Año de egreso: ${anio_egreso}<br>
                                🆔 ID de perfil: ${egresadoId}
                            </div>

                            <p><strong>⚠️ Paso importante:</strong> Debes confirmar tu dirección de email haciendo clic en el botón de abajo:</p>

                            <div style="text-align: center;">
                                <a href="${confirmationUrl}" class="button">
                                    ✅ Confirmar mi perfil
                                </a>
                            </div>

                            <p style="font-size: 12px; color: #666;">
                                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                                <a href="${confirmationUrl}">${confirmationUrl}</a>
                            </p>

                            <div class="info-box">
                                <strong>¿Qué sigue después de confirmar?</strong><br>
                                1. Tu perfil será revisado por nuestro equipo administrativo<br>
                                2. Verificaremos que fuiste alumno de BGE Héroes de la Patria<br>
                                3. Una vez aprobado, tu perfil estará disponible para empresas<br>
                                4. Recibirás notificaciones de oportunidades laborales
                            </div>

                            <p>Si no creaste este perfil, puedes ignorar este mensaje.</p>

                            <p>¡Éxito en tu búsqueda laboral! 🚀</p>
                        </div>
                        <div class="footer">
                            <p>BGE Héroes de la Patria - Bolsa de Trabajo<br>
                            Este es un correo automático, por favor no respondas.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('📧 Email de confirmación enviado a:', email);

        res.json({
            success: true,
            message: '✅ Tu solicitud ha sido recibida y está pendiente de aprobación. Nuestro equipo administrativo la revisará en breve y te notificaremos por email cuando sea aprobada.',
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

    } catch (error) {
        console.error('❌ Error creando perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear el perfil profesional',
            error: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * GET /api/egresados/confirm/:token
 * Confirmar email del egresado
 */
router.get('/confirm/:token', async (req, res) => {
    const client = await pool.connect();

    try {
        const { token } = req.params;

        // Buscar perfil con este token
        const result = await client.query(
            'SELECT * FROM egresados WHERE token_confirmacion = $1 AND confirmado = false',
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Token inválido</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                        .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
                        .error { color: #e74c3c; font-size: 60px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="error">❌</div>
                        <h1>Token inválido o expirado</h1>
                        <p>Este enlace de confirmación no es válido o ya fue utilizado.</p>
                    </div>
                </body>
                </html>
            `);
        }

        const egresado = result.rows[0];

        // Marcar como confirmado
        await client.query(
            'UPDATE egresados SET confirmado = true, fecha_confirmacion = NOW() WHERE id = $1',
            [egresado.id]
        );

        console.log('✅ Email confirmado para:', egresado.email);

        // Enviar notificación al administrador
        const adminMailOptions = {
            from: `"BGE Sistema" <${process.env.EMAIL_USER}>`,
            to: '21ebh0200x.sep@gmail.com',
            subject: `🆕 Nuevo perfil profesional confirmado - ${egresado.nombre_completo}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #667eea; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
                        .info-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; }
                        .button { display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>🆕 Nuevo Perfil Profesional Confirmado</h2>
                        </div>
                        <div class="content">
                            <p><strong>Se ha confirmado un nuevo perfil profesional que requiere revisión:</strong></p>

                            <div class="info-box">
                                <strong>Datos del egresado:</strong><br>
                                👤 Nombre: ${egresado.nombre_completo}<br>
                                📧 Email: ${egresado.email}<br>
                                📞 Teléfono: ${egresado.telefono || 'No proporcionado'}<br>
                                🎓 Carrera: ${egresado.carrera_tecnica}<br>
                                📅 Año de egreso: ${egresado.anio_egreso}<br>
                                🆔 ID: ${egresado.egresado_id}<br>
                                📍 Ubicación: ${egresado.ciudad || 'N/A'}, ${egresado.estado || 'N/A'}
                            </div>

                            <div class="info-box">
                                <strong>Información profesional:</strong><br>
                                💼 Experiencia: ${egresado.experiencia_laboral || 'No especificada'}<br>
                                🎯 Disponibilidad: ${egresado.disponibilidad || 'No especificada'}<br>
                                💰 Pretensión salarial: ${egresado.pretension_salarial || 'No especificada'}<br>
                                🔗 LinkedIn: ${egresado.linkedin_url || 'No proporcionado'}
                            </div>

                            <p><strong>⚠️ Acción requerida:</strong> Ingresa al dashboard para revisar y aprobar este perfil.</p>

                            <div style="text-align: center;">
                                <a href="http://localhost:3000/admin-dashboard.html" class="button">
                                    🖥️ Ir al Dashboard
                                </a>
                            </div>

                            <p style="font-size: 11px; color: #666;">
                                Fecha de confirmación: ${new Date().toLocaleString('es-MX')}
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(adminMailOptions);
        console.log('📧 Notificación enviada al administrador');

        // Mostrar página de confirmación exitosa
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Email confirmado</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                        padding: 50px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    }
                    .container {
                        background: white;
                        padding: 40px;
                        border-radius: 10px;
                        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                        max-width: 500px;
                        margin: 0 auto;
                    }
                    .success { color: #27ae60; font-size: 80px; margin: 0; }
                    h1 { color: #333; margin: 20px 0; }
                    p { color: #666; line-height: 1.6; }
                    .info-box { background: #f0f0f0; padding: 15px; margin: 20px 0; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="success">✅</div>
                    <h1>¡Email confirmado exitosamente!</h1>
                    <p>Gracias por confirmar tu dirección de email, <strong>${egresado.nombre_completo}</strong>.</p>

                    <div class="info-box">
                        <strong>¿Qué sigue ahora?</strong><br><br>
                        1. Tu perfil será revisado por nuestro equipo administrativo<br>
                        2. Verificaremos que fuiste alumno de BGE Héroes de la Patria<br>
                        3. Recibirás un email cuando tu perfil sea aprobado<br>
                        4. Una vez aprobado, tu perfil estará visible para empresas
                    </div>

                    <p>Te notificaremos cuando tu perfil haya sido revisado.</p>
                    <p style="font-size: 12px; color: #999;">Puedes cerrar esta ventana.</p>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('❌ Error confirmando email:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Error</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                    .container { background: white; padding: 40px; border-radius: 10px; max-width: 500px; margin: 0 auto; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>❌ Error</h1>
                    <p>Hubo un problema al confirmar tu email. Por favor contacta al administrador.</p>
                </div>
            </body>
            </html>
        `);
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
 * Crear/Actualizar perfil de egresado (sin requerir confirmación por email)
 * Usado por el formulario de "Actualizar Información" en la página pública
 */
router.post('/', async (req, res) => {
    const client = await pool.connect();

    try {
        console.log('📝 [POST /api/egresados] Creando perfil de egresado:', req.body);

        const {
            nombre,
            email,
            generacion,
            telefono,
            ciudad,
            ocupacion_actual,
            universidad,
            carrera,
            estatus_estudios,
            anio_egreso,
            historia_exito,
            autoriza_publicar,
            verificado
        } = req.body;

        // Validaciones básicas
        if (!nombre || !email || !generacion) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos obligatorios: nombre, email, generación'
            });
        }

        // Verificar si el email ya existe
        const existingCheck = await client.query(
            'SELECT id FROM egresados WHERE email = $1',
            [email]
        );

        let result;

        if (existingCheck.rows.length > 0) {
            // Actualizar si ya existe
            const updateQuery = `
                UPDATE egresados
                SET nombre = $1,
                    generacion = $2,
                    telefono = $3,
                    ciudad = $4,
                    ocupacion_actual = $5,
                    universidad = $6,
                    carrera = $7,
                    estatus_estudios = $8,
                    anio_egreso = $9,
                    historia_exito = $10,
                    autoriza_publicar = $11,
                    verificado = $12,
                    fecha_actualizacion = NOW()
                WHERE email = $13
                RETURNING id
            `;

            result = await client.query(updateQuery, [
                nombre,
                generacion,
                telefono || null,
                ciudad || null,
                ocupacion_actual || null,
                universidad || null,
                carrera || null,
                estatus_estudios || null,
                anio_egreso ? parseInt(anio_egreso) : null,
                historia_exito || null,
                autoriza_publicar || false,
                verificado !== undefined ? verificado : true,
                email
            ]);

            console.log('✅ Egresado actualizado:', result.rows[0].id);

            return res.json({
                success: true,
                message: 'Datos actualizados exitosamente',
                id: result.rows[0].id,
                updated: true
            });
        } else {
            // Insertar nuevo
            const insertQuery = `
                INSERT INTO egresados (
                    nombre,
                    email,
                    generacion,
                    telefono,
                    ciudad,
                    ocupacion_actual,
                    universidad,
                    carrera,
                    estatus_estudios,
                    anio_egreso,
                    historia_exito,
                    autoriza_publicar,
                    verificado,
                    fecha_registro,
                    fecha_actualizacion
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
                RETURNING id
            `;

            result = await client.query(insertQuery, [
                nombre,
                email,
                generacion,
                telefono || null,
                ciudad || null,
                ocupacion_actual || null,
                universidad || null,
                carrera || null,
                estatus_estudios || null,
                anio_egreso ? parseInt(anio_egreso) : null,
                historia_exito || null,
                autoriza_publicar || false,
                verificado !== undefined ? verificado : true
            ]);

            console.log('✅ Egresado creado:', result.rows[0].id);

            return res.json({
                success: true,
                message: 'Datos registrados exitosamente',
                id: result.rows[0].id,
                updated: false
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
