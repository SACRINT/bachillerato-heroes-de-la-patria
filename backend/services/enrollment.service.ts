/**
 * Enrollment Service
 * Sistema completo de inscripciones y registro de estudiantes
 */

import { executeQuery } from '../config/database';

export interface EnrollmentApplication {
    id?: number;
    tipo_inscripcion: 'nuevo_ingreso' | 'reingreso' | 'cambio_escuela';
    ciclo_escolar: string;

    // Datos del aspirante
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
    fecha_nacimiento: Date;
    curp: string;
    genero: 'masculino' | 'femenino' | 'otro';
    nacionalidad: string;

    // Contacto
    email: string;
    telefono: string;
    telefono_emergencia?: string;

    // Dirección
    calle: string;
    numero_exterior: string;
    numero_interior?: string;
    colonia: string;
    municipio: string;
    estado: string;
    codigo_postal: string;

    // Datos académicos
    escuela_procedencia: string;
    promedio_previo: number;
    semestre_solicita: number;

    // Datos del tutor
    tutor_nombre: string;
    tutor_apellido_paterno: string;
    tutor_apellido_materno?: string;
    tutor_parentesco: string;
    tutor_telefono: string;
    tutor_email: string;
    tutor_curp: string;

    // Documentos
    documentos: {
        acta_nacimiento?: string;
        curp_archivo?: string;
        certificado_secundaria?: string;
        comprobante_domicilio?: string;
        ine_tutor?: string;
        fotos?: string;
    };

    // Status del proceso
    status: 'borrador' | 'pendiente_revision' | 'documentos_incompletos' | 'aprobado' | 'rechazado' | 'inscrito';
    motivo_rechazo?: string;

    // Pago
    pago_realizado: boolean;
    pago_monto?: number;
    pago_referencia?: string;
    pago_fecha?: Date;

    // Cita
    cita_id?: number;
    cita_fecha?: Date;
    cita_completada: boolean;

    // Matrícula asignada
    matricula?: string;
    fecha_asignacion_matricula?: Date;

    // Carta de aceptación
    carta_generada: boolean;
    carta_url?: string;
    carta_fecha?: Date;
}

export interface DocumentUpload {
    solicitud_id: number;
    tipo_documento: string;
    nombre_archivo: string;
    url: string;
    mime_type: string;
    tamano_bytes: number;
}

class EnrollmentService {

    /**
     * Crear nueva solicitud de inscripción
     */
    async createApplication(data: Partial<EnrollmentApplication>): Promise<any> {
        const result = await executeQuery(`
            INSERT INTO solicitudes_inscripcion (
                tipo_inscripcion, ciclo_escolar,
                nombres, apellido_paterno, apellido_materno,
                fecha_nacimiento, curp, genero, nacionalidad,
                email, telefono, telefono_emergencia,
                calle, numero_exterior, numero_interior, colonia,
                municipio, estado, codigo_postal,
                escuela_procedencia, promedio_previo, semestre_solicita,
                tutor_nombre, tutor_apellido_paterno, tutor_apellido_materno,
                tutor_parentesco, tutor_telefono, tutor_email, tutor_curp,
                documentos, status, pago_realizado, cita_completada, carta_generada,
                created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
                $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34,
                CURRENT_TIMESTAMP
            ) RETURNING *
        `, [
            data.tipo_inscripcion || 'nuevo_ingreso',
            data.ciclo_escolar,
            data.nombres,
            data.apellido_paterno,
            data.apellido_materno,
            data.fecha_nacimiento,
            data.curp,
            data.genero,
            data.nacionalidad || 'Mexicana',
            data.email,
            data.telefono,
            data.telefono_emergencia || null,
            data.calle,
            data.numero_exterior,
            data.numero_interior || null,
            data.colonia,
            data.municipio,
            data.estado,
            data.codigo_postal,
            data.escuela_procedencia,
            data.promedio_previo,
            data.semestre_solicita || 1,
            data.tutor_nombre,
            data.tutor_apellido_paterno,
            data.tutor_apellido_materno || null,
            data.tutor_parentesco,
            data.tutor_telefono,
            data.tutor_email,
            data.tutor_curp,
            JSON.stringify(data.documentos || {}),
            'borrador',
            false,
            false,
            false
        ]) as any[];

        return result[0];
    }

    /**
     * Actualizar solicitud
     */
    async updateApplication(id: number, data: Partial<EnrollmentApplication>): Promise<any> {
        const updates: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        const allowedFields = [
            'nombres', 'apellido_paterno', 'apellido_materno', 'fecha_nacimiento',
            'curp', 'genero', 'nacionalidad', 'email', 'telefono', 'telefono_emergencia',
            'calle', 'numero_exterior', 'numero_interior', 'colonia', 'municipio',
            'estado', 'codigo_postal', 'escuela_procedencia', 'promedio_previo',
            'semestre_solicita', 'tutor_nombre', 'tutor_apellido_paterno',
            'tutor_apellido_materno', 'tutor_parentesco', 'tutor_telefono',
            'tutor_email', 'tutor_curp', 'documentos', 'status', 'motivo_rechazo'
        ];

        for (const field of allowedFields) {
            if (data[field as keyof EnrollmentApplication] !== undefined) {
                updates.push(`${field} = $${paramIndex}`);

                if (field === 'documentos') {
                    params.push(JSON.stringify(data[field as keyof EnrollmentApplication]));
                } else {
                    params.push(data[field as keyof EnrollmentApplication]);
                }
                paramIndex++;
            }
        }

        if (updates.length === 0) {
            throw new Error('No hay campos para actualizar');
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);

        const result = await executeQuery(`
            UPDATE solicitudes_inscripcion
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `, params) as any[];

        return result[0];
    }

    /**
     * Subir documento
     */
    async uploadDocument(upload: DocumentUpload): Promise<any> {
        // Guardar registro del documento
        const result = await executeQuery(`
            INSERT INTO documentos_inscripcion (
                solicitud_id, tipo_documento, nombre_archivo,
                url, mime_type, tamano_bytes, uploaded_at
            ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
            RETURNING *
        `, [
            upload.solicitud_id,
            upload.tipo_documento,
            upload.nombre_archivo,
            upload.url,
            upload.mime_type,
            upload.tamano_bytes
        ]) as any[];

        // Actualizar campo documentos en la solicitud
        const solicitud = await executeQuery(`
            SELECT documentos FROM solicitudes_inscripcion WHERE id = $1
        `, [upload.solicitud_id]) as any[];

        const documentos = JSON.parse(solicitud[0].documentos || '{}');
        documentos[upload.tipo_documento] = upload.url;

        await executeQuery(`
            UPDATE solicitudes_inscripcion
            SET documentos = $1
            WHERE id = $2
        `, [JSON.stringify(documentos), upload.solicitud_id]);

        return result[0];
    }

    /**
     * Enviar solicitud para revisión
     */
    async submitApplication(id: number): Promise<any> {
        // Verificar que estén todos los documentos requeridos
        const solicitud = await executeQuery(`
            SELECT * FROM solicitudes_inscripcion WHERE id = $1
        `, [id]) as any[];

        if (!solicitud || solicitud.length === 0) {
            throw new Error('Solicitud no encontrada');
        }

        const app = solicitud[0];
        const docs = JSON.parse(app.documentos || '{}');

        const requiredDocs = ['acta_nacimiento', 'curp_archivo', 'certificado_secundaria', 'comprobante_domicilio', 'ine_tutor'];
        const missingDocs = requiredDocs.filter(doc => !docs[doc]);

        if (missingDocs.length > 0) {
            throw new Error(`Documentos faltantes: ${missingDocs.join(', ')}`);
        }

        // Cambiar status a pendiente_revision
        const result = await executeQuery(`
            UPDATE solicitudes_inscripcion
            SET status = 'pendiente_revision', fecha_envio = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [id]) as any[];

        // Enviar notificación al admin
        await this.notifyAdmin(result[0]);

        return result[0];
    }

    /**
     * Aprobar solicitud
     */
    async approveApplication(id: number, adminId: number): Promise<any> {
        const result = await executeQuery(`
            UPDATE solicitudes_inscripcion
            SET 
                status = 'aprobado',
                aprobado_por = $2,
                fecha_aprobacion = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [id, adminId]) as any[];

        // Generar matrícula
        await this.generateMatricula(id);

        // Generar carta de aceptación
        await this.generateAcceptanceLetter(id);

        // Notificar al aspirante
        await this.notifyApplicant(result[0], 'aprobado');

        return result[0];
    }

    /**
     * Rechazar solicitud
     */
    async rejectApplication(id: number, motivo: string, adminId: number): Promise<any> {
        const result = await executeQuery(`
            UPDATE solicitudes_inscripcion
            SET 
                status = 'rechazado',
                motivo_rechazo = $2,
                rechazado_por = $3,
                fecha_rechazo = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [id, motivo, adminId]) as any[];

        // Notificar al aspirante
        await this.notifyApplicant(result[0], 'rechazado');

        return result[0];
    }

    /**
     * Generar número de matrícula
     */
    async generateMatricula(solicitudId: number): Promise<string> {
        const solicitud = await executeQuery(`
            SELECT * FROM solicitudes_inscripcion WHERE id = $1
        `, [solicitudId]) as any[];

        if (!solicitud || solicitud.length === 0) {
            throw new Error('Solicitud no encontrada');
        }

        const app = solicitud[0];

        // Formato: AÑO + TIPO + CONSECUTIVO
        // Ejemplo: 2026N0001 (2026 = año, N = Nuevo ingreso, 0001 = consecutivo)
        const year = new Date().getFullYear();
        const tipo = app.tipo_inscripcion === 'nuevo_ingreso' ? 'N' :
            app.tipo_inscripcion === 'reingreso' ? 'R' : 'C';

        // Obtener último consecutivo
        const lastMatricula = await executeQuery(`
            SELECT matricula FROM solicitudes_inscripcion
            WHERE matricula LIKE $1
            ORDER BY matricula DESC
            LIMIT 1
        `, [`${year}${tipo}%`]) as any[];

        let consecutivo = 1;
        if (lastMatricula && lastMatricula.length > 0) {
            const lastNumber = parseInt(lastMatricula[0].matricula.slice(-4));
            consecutivo = lastNumber + 1;
        }

        const matricula = `${year}${tipo}${consecutivo.toString().padStart(4, '0')}`;

        // Actualizar solicitud
        await executeQuery(`
            UPDATE solicitudes_inscripcion
            SET matricula = $1, fecha_asignacion_matricula = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [matricula, solicitudId]);

        return matricula;
    }

    /**
     * Generar carta de aceptación
     */
    async generateAcceptanceLetter(solicitudId: number): Promise<string> {
        const solicitud = await executeQuery(`
            SELECT * FROM solicitudes_inscripcion WHERE id = $1
        `, [solicitudId]) as any[];

        if (!solicitud || solicitud.length === 0) {
            throw new Error('Solicitud no encontrada');
        }

        const app = solicitud[0];

        // TODO: Generar PDF real con template
        const cartaUrl = `/cartas-aceptacion/${app.matricula}_carta.pdf`;

        await executeQuery(`
            UPDATE solicitudes_inscripcion
            SET 
                carta_generada = true,
                carta_url = $1,
                carta_fecha = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [cartaUrl, solicitudId]);

        return cartaUrl;
    }

    /**
     * Registrar pago
     */
    async registerPayment(solicitudId: number, payment: {
        monto: number;
        referencia: string;
        metodo: string;
    }): Promise<any> {
        const result = await executeQuery(`
            UPDATE solicitudes_inscripcion
            SET 
                pago_realizado = true,
                pago_monto = $2,
                pago_referencia = $3,
                pago_metodo = $4,
                pago_fecha = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [solicitudId, payment.monto, payment.referencia, payment.metodo]) as any[];

        // Si ya está aprobado y tiene pago, puede proceder a inscribirse
        if (result[0].status === 'aprobado') {
            await this.notifyApplicant(result[0], 'pago_confirmado');
        }

        return result[0];
    }

    /**
     * Agendar cita
     */
    async scheduleCita(solicitudId: number, citaId: number, fecha: Date): Promise<any> {
        const result = await executeQuery(`
            UPDATE solicitudes_inscripcion
            SET cita_id = $2, cita_fecha = $3
            WHERE id = $1
            RETURNING *
        `, [solicitudId, citaId, fecha]) as any[];

        return result[0];
    }

    /**
     * Completar cita
     */
    async completeCita(solicitudId: number): Promise<any> {
        const result = await executeQuery(`
            UPDATE solicitudes_inscripcion
            SET cita_completada = true, fecha_cita_completada = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [solicitudId]) as any[];

        // Si tiene pago y cita completada, cambiar a inscrito
        if (result[0].pago_realizado && result[0].status === 'aprobado') {
            await executeQuery(`
                UPDATE solicitudes_inscripcion
                SET status = 'inscrito'
                WHERE id = $1
            `, [solicitudId]);
        }

        return result[0];
    }

    /**
     * Obtener solicitudes con filtros
     */
    async getApplications(filters?: {
        status?: string;
        ciclo_escolar?: string;
        tipo_inscripcion?: string;
        fecha_desde?: Date;
        fecha_hasta?: Date;
    }): Promise<any[]> {
        let query = `
            SELECT 
                s.*,
                CASE 
                    WHEN s.pago_realizado AND s.cita_completada AND s.status = 'aprobado' THEN 'completo'
                    WHEN s.pago_realizado THEN 'pago_realizado'
                    WHEN s.status = 'aprobado' THEN 'pendiente_pago'
                    ELSE s.status
                END as status_proceso
            FROM solicitudes_inscripcion s
            WHERE 1=1
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (filters?.status) {
            query += ` AND s.status = $${paramIndex}`;
            params.push(filters.status);
            paramIndex++;
        }

        if (filters?.ciclo_escolar) {
            query += ` AND s.ciclo_escolar = $${paramIndex}`;
            params.push(filters.ciclo_escolar);
            paramIndex++;
        }

        if (filters?.tipo_inscripcion) {
            query += ` AND s.tipo_inscripcion = $${paramIndex}`;
            params.push(filters.tipo_inscripcion);
            paramIndex++;
        }

        if (filters?.fecha_desde) {
            query += ` AND s.created_at >= $${paramIndex}`;
            params.push(filters.fecha_desde);
            paramIndex++;
        }

        if (filters?.fecha_hasta) {
            query += ` AND s.created_at <= $${paramIndex}`;
            params.push(filters.fecha_hasta);
            paramIndex++;
        }

        query += ` ORDER BY s.created_at DESC`;

        return await executeQuery(query, params) as any[];
    }

    /**
     * Obtener estadísticas
     */
    async getStats(): Promise<any> {
        const stats = await executeQuery(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'borrador' THEN 1 END) as borradores,
                COUNT(CASE WHEN status = 'pendiente_revision' THEN 1 END) as pendientes,
                COUNT(CASE WHEN status = 'aprobado' THEN 1 END) as aprobados,
                COUNT(CASE WHEN status = 'rechazado' THEN 1 END) as rechazados,
                COUNT(CASE WHEN status = 'inscrito' THEN 1 END) as inscritos,
                COUNT(CASE WHEN pago_realizado THEN 1 END) as con_pago,
                COUNT(CASE WHEN cita_completada THEN 1 END) as citas_completadas,
                SUM(CASE WHEN pago_realizado THEN pago_monto ELSE 0 END) as ingresos_totales
            FROM solicitudes_inscripcion
        `, []) as any[];

        return stats[0];
    }

    /**
     * Notificar al admin
     */
    private async notifyAdmin(solicitud: any): Promise<void> {
        await executeQuery(`
            INSERT INTO notificaciones (
                usuario_email, tipo, titulo, mensaje, prioridad, created_at
            ) VALUES (
                'admin@heroespatria.edu.mx',
                'nueva_solicitud',
                'Nueva Solicitud de Inscripción',
                $1,
                'alta',
                CURRENT_TIMESTAMP
            )
        `, [`Nueva solicitud de ${solicitud.nombres} ${solicitud.apellido_paterno} para revisión.`]);
    }

    /**
     * Notificar al aspirante
     */
    private async notifyApplicant(solicitud: any, tipo: string): Promise<void> {
        let mensaje = '';
        let titulo = '';

        switch (tipo) {
            case 'aprobado':
                titulo = '¡Felicitaciones! Solicitud Aprobada';
                mensaje = `Tu solicitud ha sido aprobada. Matrícula: ${solicitud.matricula}. Procede con el pago para completar tu inscripción.`;
                break;
            case 'rechazado':
                titulo = 'Solicitud No Aprobada';
                mensaje = `Lamentamos informarte que tu solicitud no ha sido aprobada. Motivo: ${solicitud.motivo_rechazo}`;
                break;
            case 'pago_confirmado':
                titulo = 'Pago Confirmado';
                mensaje = 'Tu pago ha sido confirmado. Ahora puedes agendar tu cita para entrega de documentos.';
                break;
        }

        await executeQuery(`
            INSERT INTO notificaciones (
                usuario_email, tipo, titulo, mensaje, prioridad, created_at
            ) VALUES ($1, $2, $3, $4, 'alta', CURRENT_TIMESTAMP)
        `, [solicitud.email, tipo, titulo, mensaje]);
    }
}

export default new EnrollmentService();
