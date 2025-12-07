/**
 * 📅 EVENTOS DAO - TypeScript
 * Capa de acceso a datos para eventos.
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { executeQuery } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface Evento {
    id: number;
    titulo: string;
    descripcion: string;
    imagen_url?: string;
    fecha_inicio: Date;
    fecha_fin?: Date;
    ubicacion?: string;
    modalidad: string;
    link_virtual?: string;
    categoria: string;
    tipo?: string;
    etiquetas?: string[];
    estado: string;
    organizador?: string;
    organizador_id?: number;
    contacto_email?: string;
    contacto_telefono?: string;
    capacidad_maxima?: number;
    inscripciones_abiertas: boolean;
    requiere_inscripcion: boolean;
    slug: string;
    destacado: boolean;
    ip_address?: string;
    user_agent?: string;
    fecha_modificacion?: Date;
    created_at?: Date;
    // Calculated fields
    cupo_maximo?: number;
    inscripciones_actuales?: number;
    color_hex?: string;
    title?: string; // Alias for calendar
    start?: Date; // Alias for calendar
    end?: Date; // Alias for calendar
}

export interface CreateEventoInput {
    titulo: string;
    descripcion: string;
    imagen_url?: string;
    fecha_inicio: Date | string;
    fecha_fin?: Date | string;
    ubicacion?: string;
    modalidad?: string;
    link_virtual?: string;
    categoria?: string;
    tipo?: string;
    etiquetas?: string[];
    estado?: string;
    organizador?: string;
    organizador_id?: number;
    contacto_email?: string;
    contacto_telefono?: string;
    capacidad_maxima?: number;
    inscripciones_abiertas?: boolean;
    requiere_inscripcion?: boolean;
    slug: string;
    destacado?: boolean;
    ip_address?: string;
    user_agent?: string;
}

export interface UpdateEventoInput extends Partial<CreateEventoInput> { }

export interface EventoStats {
    total: number;
    publicadas: number;
    borradores: number;
    cancelados: number;
    finalizados: number;
    destacados: number;
    presenciales: number;
    virtuales: number;
    hibridos: number;
}

export interface GetEventsOptions {
    estado?: string;
    categoria?: string;
    modalidad?: string;
    destacado?: boolean | string;
    limit?: number;
    offset?: number;
}

export interface GetCalendarOptions {
    start?: string;
    end?: string;
    categoria?: string;
    modalidad?: string;
}

// =====================================================
// EVENTOS DAO CLASS
// =====================================================

class EventosDAO {

    static async slugExists(slug: string): Promise<boolean> {
        const result = await executeQuery('SELECT id FROM eventos WHERE slug = $1', [slug]);
        return result.length > 0;
    }

    static async create(data: CreateEventoInput): Promise<Evento> {
        const query = `
            INSERT INTO eventos (
                titulo, descripcion, imagen_url, fecha_inicio, fecha_fin, ubicacion,
                modalidad, link_virtual, categoria, tipo, etiquetas, estado,
                organizador, organizador_id, contacto_email, contacto_telefono,
                capacidad_maxima, inscripciones_abiertas, requiere_inscripcion,
                slug, destacado, ip_address, user_agent
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
            RETURNING *;
        `;
        const result = await executeQuery(query, [
            data.titulo, data.descripcion, data.imagen_url || null,
            data.fecha_inicio, data.fecha_fin || null, data.ubicacion || null,
            data.modalidad || 'presencial', data.link_virtual || null,
            data.categoria || 'General', data.tipo || null, data.etiquetas || [],
            data.estado || 'borrador', data.organizador || null, data.organizador_id || null,
            data.contacto_email || null, data.contacto_telefono || null,
            data.capacidad_maxima || null, data.inscripciones_abiertas !== undefined ? data.inscripciones_abiertas : true,
            data.requiere_inscripcion !== undefined ? data.requiere_inscripcion : false,
            data.slug, data.destacado || false, data.ip_address, data.user_agent
        ]);
        return result[0];
    }

    static async getAll(options: GetEventsOptions): Promise<{ eventos: Evento[]; total: number }> {
        const { estado, categoria, modalidad, destacado, limit = 50, offset = 0 } = options;

        let query = 'SELECT * FROM eventos WHERE 1=1';
        const params: any[] = [];
        let pc = 0;

        if (estado) { pc++; query += ` AND estado = $${pc}`; params.push(estado); }
        if (categoria) { pc++; query += ` AND categoria = $${pc}`; params.push(categoria); }
        if (modalidad) { pc++; query += ` AND modalidad = $${pc}`; params.push(modalidad); }
        if (destacado !== undefined) { pc++; query += ` AND destacado = $${pc}`; params.push(destacado === 'true' || destacado === true); }

        query += ` ORDER BY fecha_inicio DESC LIMIT $${pc + 1} OFFSET $${pc + 2}`;
        params.push(limit, offset); // Pass as numbers directly as executeQuery expects any[]
        const data = await executeQuery(query, params);

        // Count
        let cq = 'SELECT COUNT(*) FROM eventos WHERE 1=1';
        const cp: any[] = [];
        let cpc = 0;
        if (estado) { cpc++; cq += ` AND estado = $${cpc}`; cp.push(estado); }
        if (categoria) { cpc++; cq += ` AND categoria = $${cpc}`; cp.push(categoria); }
        if (modalidad) { cpc++; cq += ` AND modalidad = $${cpc}`; cp.push(modalidad); }
        if (destacado !== undefined) { cpc++; cq += ` AND destacado = $${cpc}`; cp.push(destacado === 'true' || destacado === true); }

        const countResult = await executeQuery(cq, cp);
        return { eventos: data, total: parseInt(countResult[0].count) };
    }

    static async getStats(): Promise<EventoStats> {
        const query = `
            SELECT COUNT(*) as total,
                COUNT(*) FILTER (WHERE estado = 'publicado') as publicadas,
                COUNT(*) FILTER (WHERE estado = 'borrador') as borradores,
                COUNT(*) FILTER (WHERE estado = 'cancelado') as cancelados,
                COUNT(*) FILTER (WHERE estado = 'finalizado') as finalizados,
                COUNT(*) FILTER (WHERE destacado = true) as destacados,
                COUNT(*) FILTER (WHERE modalidad = 'presencial') as presenciales,
                COUNT(*) FILTER (WHERE modalidad = 'virtual') as virtuales,
                COUNT(*) FILTER (WHERE modalidad = 'híbrido') as hibridos
            FROM eventos;
        `;
        const result = await executeQuery(query, []);
        const row = result[0];
        return {
            total: parseInt(row.total),
            publicadas: parseInt(row.publicadas),
            borradores: parseInt(row.borradores),
            cancelados: parseInt(row.cancelados),
            finalizados: parseInt(row.finalizados),
            destacados: parseInt(row.destacados),
            presenciales: parseInt(row.presenciales),
            virtuales: parseInt(row.virtuales),
            hibridos: parseInt(row.hibridos)
        };
    }

    static async getById(id: number | string): Promise<Evento | null> {
        const result = await executeQuery('SELECT * FROM eventos WHERE id = $1', [id]);
        return result[0] || null;
    }

    static async getBySlug(slug: string): Promise<Evento | null> {
        const result = await executeQuery('SELECT * FROM eventos WHERE slug = $1', [slug]);
        return result[0] || null;
    }

    static async update(id: number | string, data: UpdateEventoInput): Promise<Evento | null> {
        const query = `
            UPDATE eventos SET
                titulo = COALESCE($1, titulo), descripcion = COALESCE($2, descripcion),
                imagen_url = COALESCE($3, imagen_url), fecha_inicio = COALESCE($4, fecha_inicio),
                fecha_fin = COALESCE($5, fecha_fin), ubicacion = COALESCE($6, ubicacion),
                modalidad = COALESCE($7, modalidad), link_virtual = COALESCE($8, link_virtual),
                categoria = COALESCE($9, categoria), tipo = COALESCE($10, tipo),
                etiquetas = COALESCE($11, etiquetas), estado = COALESCE($12, estado),
                organizador = COALESCE($13, organizador), contacto_email = COALESCE($14, contacto_email),
                contacto_telefono = COALESCE($15, contacto_telefono), capacidad_maxima = COALESCE($16, capacidad_maxima),
                inscripciones_abiertas = COALESCE($17, inscripciones_abiertas), requiere_inscripcion = COALESCE($18, requiere_inscripcion),
                destacado = COALESCE($19, destacado), fecha_modificacion = NOW()
            WHERE id = $20 RETURNING *;
        `;
        // Pass values carefully, executeQuery handles nulls generally
        const result = await executeQuery(query, [
            data.titulo, data.descripcion, data.imagen_url, data.fecha_inicio,
            data.fecha_fin, data.ubicacion, data.modalidad, data.link_virtual,
            data.categoria, data.tipo, data.etiquetas, data.estado,
            data.organizador, data.contacto_email, data.contacto_telefono, data.capacidad_maxima,
            data.inscripciones_abiertas, data.requiere_inscripcion, data.destacado, id
        ]);
        return result[0] || null;
    }

    static async getCalendarEvents(options: GetCalendarOptions): Promise<Evento[]> {
        const { start, end, categoria, modalidad } = options;
        let query = `
            SELECT id, slug, titulo as title, descripcion, fecha_inicio as start, fecha_fin as end,
                categoria, modalidad, ubicacion, cupo_maximo, inscripciones_actuales, destacado, color_hex
            FROM eventos WHERE estado = 'publicado'
        `;
        const params: any[] = [];
        let pc = 1;

        if (start) { query += ` AND fecha_inicio >= $${pc}`; params.push(start); pc++; }
        if (end) { query += ` AND fecha_fin <= $${pc}`; params.push(end); pc++; }
        if (categoria && categoria !== 'todas') { query += ` AND categoria = $${pc}`; params.push(categoria); pc++; }
        if (modalidad && modalidad !== 'todas') { query += ` AND modalidad = $${pc}`; params.push(modalidad); pc++; }

        query += ` ORDER BY fecha_inicio ASC`;
        return await executeQuery(query, params);
    }
}

export default EventosDAO;
module.exports = EventosDAO;
