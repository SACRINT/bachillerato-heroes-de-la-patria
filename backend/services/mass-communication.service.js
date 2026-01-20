"use strict";
/**
 * Mass Communication Service
 * Sistema de comunicación masiva a padres y estudiantes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class MassCommunicationService {
    /**
     * Crear mensaje masivo
     */
    async createMassMessage(data) {
        const result = await (0, database_1.executeQuery)(`
            INSERT INTO mensajes_masivos (
                docente_id, materia_id, destinatarios_tipo, destinatarios_ids,
                asunto, mensaje, tipo, canales, programada, fecha_envio,
                archivos_adjuntos, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
            RETURNING *
        `, [
            data.docente_id,
            data.materia_id || null,
            data.destinatarios_tipo,
            JSON.stringify(data.destinatarios_ids || []),
            data.asunto,
            data.mensaje,
            data.tipo,
            JSON.stringify(data.canales),
            data.programada || false,
            data.fecha_envio || null,
            JSON.stringify(data.archivos_adjuntos || []),
            data.status || 'borrador'
        ]);
        return result[0];
    }
    /**
     * Obtener destinatarios según criterios
     */
    async getRecipients(data) {
        let estudiantes = [];
        let padres = [];
        // Si es grupo específico con IDs proporcionados
        if (data.destinatarios_tipo === 'grupo_especifico' && data.destinatarios_ids) {
            if (data.destinatarios_ids.length > 0) {
                estudiantes = await (0, database_1.executeQuery)(`
                    SELECT 
                        e.id,
                        e.nombre || ' ' || e.apellido_paterno as nombre_completo,
                        u.email,
                        u.telefono
                    FROM estudiantes e
                    JOIN usuarios u ON e.usuario_id = u.id
                    WHERE e.id = ANY($1::int[])
                `, [data.destinatarios_ids]);
            }
        }
        // Si es por materia
        else if (data.materia_id) {
            estudiantes = await (0, database_1.executeQuery)(`
                SELECT DISTINCT
                    e.id,
                    e.nombre || ' ' || e.apellido_paterno as nombre_completo,
                    u.email,
                    u.telefono
                FROM inscripciones_materias im
                JOIN estudiantes e ON im.estudiante_id = e.id
                JOIN usuarios u ON e.usuario_id = u.id
                WHERE im.materia_id = $1 AND im.status = 'activo'
            `, [data.materia_id]);
        }
        // Obtener padres de los estudiantes seleccionados
        if (estudiantes.length > 0 && ['padres', 'ambos'].includes(data.destinatarios_tipo)) {
            const estudiantesIds = estudiantes.map(e => e.id);
            padres = await (0, database_1.executeQuery)(`
                SELECT DISTINCT
                    g.id,
                    u.nombre || ' ' || u.apellido_paterno as nombre_completo,
                    u.email,
                    u.telefono,
                    sg.student_id as estudiante_id
                FROM student_guardians sg
                JOIN guardians g ON sg.guardian_id = g.id
                JOIN usuarios u ON g.usuario_id = u.id
                WHERE sg.student_id = ANY($1::int[])
            `, [estudiantesIds]);
        }
        return { estudiantes, padres };
    }
    /**
     * Enviar mensaje masivo
     */
    async sendMassMessage(mensajeId) {
        // Obtener mensaje
        const mensajeData = await (0, database_1.executeQuery)(`
            SELECT * FROM mensajes_masivos WHERE id = $1
        `, [mensajeId]);
        if (!mensajeData || mensajeData.length === 0) {
            throw new Error('Mensaje no encontrado');
        }
        const mensaje = mensajeData[0];
        // Actualizar status a 'enviando'
        await (0, database_1.executeQuery)(`
            UPDATE mensajes_masivos SET status = 'enviando' WHERE id = $1
        `, [mensajeId]);
        try {
            // Obtener destinatarios
            const { estudiantes, padres } = await this.getRecipients({
                materia_id: mensaje.materia_id,
                destinatarios_tipo: mensaje.destinatarios_tipo,
                destinatarios_ids: JSON.parse(mensaje.destinatarios_ids || '[]')
            });
            const canales = JSON.parse(mensaje.canales);
            let totalEnviados = 0;
            // Enviar a estudiantes
            if (['estudiantes', 'ambos'].includes(mensaje.destinatarios_tipo)) {
                for (const estudiante of estudiantes) {
                    for (const canal of canales) {
                        await this.sendToRecipient(mensajeId, estudiante.id, 'estudiante', canal, {
                            email: estudiante.email,
                            telefono: estudiante.telefono,
                            asunto: mensaje.asunto,
                            mensaje: mensaje.mensaje
                        });
                        totalEnviados++;
                    }
                }
            }
            // Enviar a padres
            if (['padres', 'ambos'].includes(mensaje.destinatarios_tipo)) {
                for (const padre of padres) {
                    for (const canal of canales) {
                        await this.sendToRecipient(mensajeId, padre.id, 'padre', canal, {
                            email: padre.email,
                            telefono: padre.telefono,
                            asunto: mensaje.asunto,
                            mensaje: mensaje.mensaje
                        });
                        totalEnviados++;
                    }
                }
            }
            // Actualizar status a 'enviada'
            await (0, database_1.executeQuery)(`
                UPDATE mensajes_masivos 
                SET status = 'enviada', fecha_envio_real = CURRENT_TIMESTAMP, total_enviados = $2
                WHERE id = $1
            `, [mensajeId, totalEnviados]);
            return {
                success: true,
                total_destinatarios: estudiantes.length + padres.length,
                total_envios: totalEnviados
            };
        }
        catch (error) {
            // Actualizar status a 'fallida'
            await (0, database_1.executeQuery)(`
                UPDATE mensajes_masivos SET status = 'fallida', error_mensaje = $2 WHERE id = $1
            `, [mensajeId, error.message]);
            throw error;
        }
    }
    /**
     * Enviar a un destinatario individual
     */
    async sendToRecipient(mensajeId, destinatarioId, destinatarioTipo, canal, data) {
        // Registrar intento de envío
        const delivery = await (0, database_1.executeQuery)(`
            INSERT INTO entregas_mensajes (
                mensaje_id, destinatario_id, destinatario_tipo, canal,
                status, created_at
            ) VALUES ($1, $2, $3, $4, 'pendiente', CURRENT_TIMESTAMP)
            RETURNING id
        `, [mensajeId, destinatarioId, destinatarioTipo, canal]);
        const deliveryId = delivery[0].id;
        try {
            // Enviar según canal
            switch (canal) {
                case 'email':
                    await this.sendEmail(data.email, data.asunto, data.mensaje);
                    break;
                case 'notificacion_app':
                    await this.sendAppNotification(destinatarioId, destinatarioTipo, data.asunto, data.mensaje);
                    break;
                case 'sms':
                    await this.sendSMS(data.telefono, data.mensaje);
                    break;
                case 'whatsapp':
                    await this.sendWhatsApp(data.telefono, data.mensaje);
                    break;
            }
            // Actualizar a enviado
            await (0, database_1.executeQuery)(`
                UPDATE entregas_mensajes 
                SET status = 'enviado', fecha_envio = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [deliveryId]);
        }
        catch (error) {
            // Registrar fallo
            await (0, database_1.executeQuery)(`
                UPDATE entregas_mensajes 
                SET status = 'fallido', error_mensaje = $2
                WHERE id = $1
            `, [deliveryId, error.message]);
        }
    }
    /**
     * Enviar email
     */
    async sendEmail(email, asunto, mensaje) {
        // TODO: Integrar con EmailService real
        // Por ahora, crear notificación interna
        await (0, database_1.executeQuery)(`
            INSERT INTO notificaciones (
                usuario_email, tipo, titulo, mensaje, prioridad, created_at
            ) VALUES ($1, 'comunicado_docente', $2, $3, 'alta', CURRENT_TIMESTAMP)
        `, [email, asunto, mensaje]);
    }
    /**
     * Enviar notificación app
     */
    async sendAppNotification(destinatarioId, destinatarioTipo, titulo, mensaje) {
        // Crear notificación interna
        const table = destinatarioTipo === 'padre' ? 'parent_notifications' : 'student_notifications';
        await (0, database_1.executeQuery)(`
            INSERT INTO ${table} (
                ${destinatarioTipo}_id, titulo, mensaje, tipo, prioridad, created_at
            ) VALUES ($1, $2, $3, 'comunicado', 'alta', CURRENT_TIMESTAMP)
        `, [destinatarioId, titulo, mensaje]);
    }
    /**
     * Enviar SMS
     */
    async sendSMS(telefono, mensaje) {
        // TODO: Integrar con servicio de SMS (Twilio, etc)
        console.log(`SMS a ${telefono}: ${mensaje}`);
    }
    /**
     * Enviar WhatsApp
     */
    async sendWhatsApp(telefono, mensaje) {
        // TODO: Integrar con WhatsApp Business API
        console.log(`WhatsApp a ${telefono}: ${mensaje}`);
    }
    /**
     * Obtener mensajes masivos de un docente
     */
    async getTeacherMessages(docenteId, filters) {
        let query = `
            SELECT 
                mm.*,
                m.nombre as materia_nombre,
                mm.total_enviados,
                (SELECT COUNT(*) FROM entregas_mensajes em WHERE em.mensaje_id = mm.id AND em.status = 'enviado') as enviados,
                (SELECT COUNT(*) FROM entregas_mensajes em WHERE em.mensaje_id = mm.id AND em.status = 'leido') as leidos
            FROM mensajes_masivos mm
            LEFT JOIN materias m ON mm.materia_id = m.id
            WHERE mm.docente_id = $1 AND mm.deleted_at IS NULL
        `;
        const params = [docenteId];
        let paramIndex = 2;
        if (filters === null || filters === void 0 ? void 0 : filters.materia_id) {
            query += ` AND mm.materia_id = $${paramIndex}`;
            params.push(filters.materia_id);
            paramIndex++;
        }
        if (filters === null || filters === void 0 ? void 0 : filters.status) {
            query += ` AND mm.status = $${paramIndex}`;
            params.push(filters.status);
            paramIndex++;
        }
        query += ` ORDER BY mm.created_at DESC`;
        return await (0, database_1.executeQuery)(query, params);
    }
    /**
     * Obtener estadísticas de entrega de un mensaje
     */
    async getMessageStats(mensajeId) {
        const stats = await (0, database_1.executeQuery)(`
            SELECT 
                COUNT(*) as total_entregas,
                COUNT(CASE WHEN status = 'enviado' THEN 1 END) as enviados,
                COUNT(CASE WHEN status = 'entregado' THEN 1 END) as entregados,
                COUNT(CASE WHEN status = 'leido' THEN 1 END) as leidos,
                COUNT(CASE WHEN status = 'fallido' THEN 1 END) as fallidos,
                COUNT(CASE WHEN destinatario_tipo = 'padre' THEN 1 END) as padres,
                COUNT(CASE WHEN destinatario_tipo = 'estudiante' THEN 1 END) as estudiantes
            FROM entregas_mensajes
            WHERE mensaje_id = $1
        `, [mensajeId]);
        return stats[0];
    }
    /**
     * Programar mensaje para envío posterior
     */
    async schedulemessage(mensajeId, fechaEnvio) {
        const result = await (0, database_1.executeQuery)(`
            UPDATE mensajes_masivos
            SET programada = true, fecha_envio = $2, status = 'programada'
            WHERE id = $1
            RETURNING *
        `, [mensajeId, fechaEnvio]);
        return result[0];
    }
    /**
     * Cancelar mensaje programado
     */
    async cancelScheduledMessage(mensajeId) {
        await (0, database_1.executeQuery)(`
            UPDATE mensajes_masivos
            SET status = 'borrador', programada = false, fecha_envio = NULL
            WHERE id = $1 AND status = 'programada'
        `, [mensajeId]);
    }
}
exports.default = new MassCommunicationService();
