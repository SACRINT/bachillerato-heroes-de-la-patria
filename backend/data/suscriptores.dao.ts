/**
 * 📧 SUSCRIPTORES DAO - TypeScript
 * Capa de acceso a datos para suscriptores de notificaciones.
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { executeQuery } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface Suscriptor {
    id: number;
    email: string;
    nombre: string;
    notif_convocatorias: boolean;
    notif_becas: boolean;
    notif_eventos: boolean;
    notif_noticias: boolean;
    notif_todas: boolean;
    estado: string;
    verificado: boolean;
    fecha_verificacion?: Date;
    total_enviados: number;
    total_abiertos: number;
    ultimo_envio?: Date;
    fuente?: string;
    fecha_registro: Date;
    fecha_actualizacion?: Date;
}

export interface SuscriptorStats {
    total: number;
    porEstado: { estado: string; cantidad: number }[];
    porVerificacion: { verificado: boolean; cantidad: number }[];
    porTipo: {
        convocatorias: number;
        becas: number;
        eventos: number;
        noticias: number;
        todas: number;
    };
    nuevosUltimos7Dias: number;
    tasaAperturaPromedio: number;
}

export interface CreateSuscriptorInput {
    email: string;
    nombre?: string;
    notif_convocatorias: boolean;
    notif_becas: boolean;
    notif_eventos: boolean;
    notif_noticias: boolean;
    notif_todas: boolean;
    token_verificacion: string;
    ip_registro?: string;
    user_agent?: string;
    fuente?: string;
}

export interface SuscriptorPreferences {
    notif_convocatorias: boolean;
    notif_becas: boolean;
    notif_eventos: boolean;
    notif_noticias: boolean;
    notif_todas: boolean;
}

// =====================================================
// SUSCRIPTORES DAO CLASS
// =====================================================

class SuscriptoresDAO {

    static async getAll(): Promise<Suscriptor[]> {
        const query = `
            SELECT id, email, nombre, notif_convocatorias, notif_becas, notif_eventos,
                   notif_noticias, notif_todas, estado, verificado, fecha_verificacion,
                   total_enviados, total_abiertos, ultimo_envio, fuente, fecha_registro, fecha_actualizacion
            FROM suscriptores_notificaciones ORDER BY fecha_registro DESC
        `;
        return (await executeQuery(query, [])) as Suscriptor[];
    }

    static async getByEstado(estado: string): Promise<Suscriptor[]> {
        return (await executeQuery('SELECT * FROM suscriptores_notificaciones WHERE estado = $1 ORDER BY fecha_registro DESC', [estado])) as Suscriptor[];
    }

    static async getActivosForEmail(tipo?: string): Promise<{ email: string; nombre: string }[]> {
        let query = `SELECT email, nombre FROM suscriptores_notificaciones WHERE estado = 'activo' AND verificado = TRUE`;
        if (tipo && tipo !== 'todas') {
            query += ` AND (notif_${tipo} = TRUE OR notif_todas = TRUE)`;
        } else {
            query += ` AND notif_todas = TRUE`;
        }
        return await executeQuery(query, []);
    }

    static async getStats(): Promise<SuscriptorStats> {
        const total = await executeQuery('SELECT COUNT(*) as total FROM suscriptores_notificaciones', []);
        const porEstado = await executeQuery('SELECT estado, COUNT(*) as cantidad FROM suscriptores_notificaciones GROUP BY estado', []);
        const porVerificacion = await executeQuery('SELECT verificado, COUNT(*) as cantidad FROM suscriptores_notificaciones GROUP BY verificado', []);
        const porTipo = await executeQuery(`
            SELECT
                SUM(CASE WHEN notif_convocatorias = true THEN 1 ELSE 0 END) as convocatorias,
                SUM(CASE WHEN notif_becas = true THEN 1 ELSE 0 END) as becas,
                SUM(CASE WHEN notif_eventos = true THEN 1 ELSE 0 END) as eventos,
                SUM(CASE WHEN notif_noticias = true THEN 1 ELSE 0 END) as noticias,
                SUM(CASE WHEN notif_todas = true THEN 1 ELSE 0 END) as todas
            FROM suscriptores_notificaciones
        `, []);
        const nuevos = await executeQuery(`SELECT COUNT(*) as total FROM suscriptores_notificaciones WHERE fecha_registro >= NOW() - INTERVAL '7 days'`, []);
        const tasaApertura = await executeQuery(`
            SELECT AVG(CASE WHEN total_enviados > 0 THEN (total_abiertos::float / total_enviados) * 100 ELSE 0 END) as tasa_promedio
            FROM suscriptores_notificaciones WHERE total_enviados > 0
        `, []);

        return {
            total: parseInt(total[0].total),
            porEstado: porEstado.map((r: any) => ({ estado: r.estado, cantidad: parseInt(r.cantidad) })),
            porVerificacion: porVerificacion.map((r: any) => ({ verificado: r.verificado, cantidad: parseInt(r.cantidad) })),
            porTipo: {
                convocatorias: parseInt(porTipo[0].convocatorias),
                becas: parseInt(porTipo[0].becas),
                eventos: parseInt(porTipo[0].eventos),
                noticias: parseInt(porTipo[0].noticias),
                todas: parseInt(porTipo[0].todas)
            },
            nuevosUltimos7Dias: parseInt(nuevos[0].total),
            tasaAperturaPromedio: Math.round(parseFloat(tasaApertura[0].tasa_promedio) || 0)
        };
    }

    static async getById(id: number): Promise<Suscriptor | null> {
        const result = await executeQuery('SELECT * FROM suscriptores_notificaciones WHERE id = $1', [id]);
        return (result[0] as Suscriptor) || null;
    }

    static async getByEmail(email: string): Promise<{ id: number; estado: string } | null> {
        const result = await executeQuery('SELECT id, estado FROM suscriptores_notificaciones WHERE email = $1', [email]);
        return (result[0] as { id: number; estado: string }) || null;
    }

    static async create(data: CreateSuscriptorInput): Promise<{ id: number }> {
        const query = `
            INSERT INTO suscriptores_notificaciones (
                email, nombre, notif_convocatorias, notif_becas, notif_eventos,
                notif_noticias, notif_todas, token_verificacion, ip_registro, user_agent, fuente
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id
        `;
        const result = await executeQuery(query, [
            data.email, data.nombre || null, data.notif_convocatorias, data.notif_becas, data.notif_eventos,
            data.notif_noticias, data.notif_todas, data.token_verificacion, data.ip_registro || null, data.user_agent || null, data.fuente
        ]);
        return result[0];
    }

    static async reactivate(email: string, prefs: SuscriptorPreferences): Promise<void> {
        const query = `
            UPDATE suscriptores_notificaciones SET
                estado = 'activo', notif_convocatorias = $1, notif_becas = $2,
                notif_eventos = $3, notif_noticias = $4, notif_todas = $5,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE email = $6
        `;
        await executeQuery(query, [
            prefs.notif_convocatorias, prefs.notif_becas, prefs.notif_eventos,
            prefs.notif_noticias, prefs.notif_todas, email
        ]);
    }

    static async updatePreferences(email: string, prefs: SuscriptorPreferences): Promise<void> {
        const query = `
            UPDATE suscriptores_notificaciones SET
                notif_convocatorias = $1, notif_becas = $2, notif_eventos = $3,
                notif_noticias = $4, notif_todas = $5, fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE email = $6
        `;
        await executeQuery(query, [
            prefs.notif_convocatorias, prefs.notif_becas, prefs.notif_eventos,
            prefs.notif_noticias, prefs.notif_todas, email
        ]);
    }

    static async update(id: number, data: Partial<Suscriptor>): Promise<any> {
        const query = `
            UPDATE suscriptores_notificaciones SET
                email = $1, nombre = $2, notif_convocatorias = $3, notif_becas = $4,
                notif_eventos = $5, notif_noticias = $6, notif_todas = $7,
                estado = $8, verificado = $9, fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = $10
        `;
        const result = await executeQuery(query, [
            data.email,
            data.nombre || null,
            data.notif_convocatorias !== undefined ? data.notif_convocatorias : false,
            data.notif_becas !== undefined ? data.notif_becas : false,
            data.notif_eventos !== undefined ? data.notif_eventos : false,
            data.notif_noticias !== undefined ? data.notif_noticias : false,
            data.notif_todas !== undefined ? data.notif_todas : true,
            data.estado || 'activo',
            data.verificado !== undefined ? data.verificado : false,
            id
        ]);
        return result;
    }

    static async verifyEmail(token: string): Promise<any> {
        return await executeQuery(`
            UPDATE suscriptores_notificaciones SET verificado = TRUE, fecha_verificacion = CURRENT_TIMESTAMP
            WHERE token_verificacion = $1
        `, [token]);
    }

    static async cancel(email: string): Promise<any> {
        return await executeQuery(`
            UPDATE suscriptores_notificaciones SET estado = 'cancelado', fecha_cancelacion = CURRENT_TIMESTAMP
            WHERE email = $1
        `, [email]);
    }

    static async registerSend(id: number, abierto: boolean = false): Promise<any> {
        const updateFields = abierto
            ? 'total_enviados = total_enviados + 1, total_abiertos = total_abiertos + 1, ultimo_envio = CURRENT_TIMESTAMP'
            : 'total_enviados = total_enviados + 1, ultimo_envio = CURRENT_TIMESTAMP';
        return await executeQuery(`UPDATE suscriptores_notificaciones SET ${updateFields} WHERE id = $1`, [id]);
    }

    static async delete(id: number): Promise<any> {
        return await executeQuery('DELETE FROM suscriptores_notificaciones WHERE id = $1', [id]);
    }
}

export default SuscriptoresDAO;
module.exports = SuscriptoresDAO;
