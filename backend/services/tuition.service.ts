/**
 * Tuition Service
 * Sistema de gestión de colegiaturas mensuales
 */

import { executeQuery } from '../config/database';
import StripeIntegrationService from './stripe-integration.service';

export interface Colegiatura {
    id?: number;
    estudiante_id: number;
    mes: number; // 1-12
    anio: number;
    monto: number;
    fecha_vencimiento: Date;
    status: 'pendiente' | 'pagado' | 'vencido' | 'parcial' | 'condonado';
    monto_pagado?: number;
    metodo_pago?: string;
    fecha_pago?: Date;
    recargo_mora?: number;
    descuento?: number;
    nota?: string;
}

class TuitionService {

    /**
     * Generar colegiaturas del ciclo escolar
     */
    async generateYearlyTuitions(estudianteId: number, cicloEscolar: string): Promise<any[]> {
        const currentYear = new Date().getFullYear();
        const tuitions: Colegiatura[] = [];

        // Configuración de montos
        const monthlyAmount = await this.getMonthlyAmount();

        // Generar colegiat uras de agosto a junio (10 meses)
        const months = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

        for (const month of months) {
            const year = month >= 8 ? currentYear : currentYear + 1;
            const dueDate = new Date(year, month - 1, 10); // Vencimiento día 10 de cada mes

            tuitions.push({
                estudiante_id: estudianteId,
                mes: month,
                anio: year,
                monto: monthlyAmount,
                fecha_vencimiento: dueDate,
                status: 'pendiente'
            });
        }

        // Insertar en BD
        const created = [];
        for (const tuition of tuitions) {
            const result = await executeQuery(`
                INSERT INTO colegiaturas (
                    estudiante_id, mes, anio, monto, fecha_vencimiento,
                    ciclo_escolar, status, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
                RETURNING *
            `, [
                tuition.estudiante_id,
                tuition.mes,
                tuition.anio,
                tuition.monto,
                tuition.fecha_vencimiento,
                cicloEscolar,
                'pendiente'
            ]) as any[];

            created.push(result[0]);
        }

        return created;
    }

    /**
     * Obtener monto mensual de colegiatura
     */
    private async getMonthlyAmount(): Promise<number> {
        const config = await executeQuery(`
            SELECT valor FROM configuracion_inscripciones
            WHERE clave = 'monto_colegiatura'
        `, []) as any[];

        if (config && config.length > 0) {
            return parseFloat(config[0].valor.valor);
        }

        return 2500; // Monto por defecto
    }

    /**
     * Obtener colegiaturas de un estudiante
     */
    async getStudentTuitions(estudianteId: number, filters?: {
        status?: string;
        anio?: number;
    }): Promise<any[]> {
        let query = `
            SELECT 
                c.*,
                e.nombre || ' ' || e.apellido_paterno as estudiante_nombre,
                e.matricula,
                CASE 
                    WHEN c.status = 'pendiente' AND c.fecha_vencimiento < CURRENT_DATE 
                    THEN 'vencido'
                    ELSE c.status
                END as status_actual
            FROM colegiaturas c
            JOIN estudiantes e ON c.estudiante_id = e.id
            WHERE c.estudiante_id = $1
        `;
        const params: any[] = [estudianteId];
        let paramIndex = 2;

        if (filters?.status) {
            query += ` AND c.status = $${paramIndex}`;
            params.push(filters.status);
            paramIndex++;
        }

        if (filters?.anio) {
            query += ` AND c.anio = $${paramIndex}`;
            params.push(filters.anio);
            paramIndex++;
        }

        query += ` ORDER BY c.anio, c.mes`;

        return await executeQuery(query, params) as any[];
    }

    /**
     * Iniciar pago de colegiatura
     */
    async initatePayment(colegiaturaId: number, paymentMethod: 'card' | 'oxxo'): Promise<any> {
        const colegiatura = await executeQuery(`
            SELECT c.*, e.email
            FROM colegiaturas c
            JOIN estudiantes e ON c.estudiante_id = e.id
            WHERE c.id = $1
        `, [colegiaturaId]) as any[];

        if (!colegiatura || colegiatura.length === 0) {
            throw new Error('Colegiatura no encontrada');
        }

        const col = colegiatura[0];

        // Calcular recargo por mora si aplica
        const totalAmount = this.calculateTotalWithLateFee(col);

        if (paymentMethod === 'card') {
            return await StripeIntegrationService.createCheckoutSession({
                type: 'colegiatura',
                amount: totalAmount,
                description: `Colegiatura ${this.getMonthName(col.mes)} ${col.anio}`,
                metadata: {
                    colegiatura_id: col.id,
                    student_id: col.estudiante_id,
                    tipo: 'colegiatura'
                },
                success_url: `${process.env.FRONTEND_URL}/pagos/exito?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.FRONTEND_URL}/pagos/cancelado`
            });
        } else {
            return await StripeIntegrationService.createOxxoPayment(
                totalAmount,
                {
                    colegiatura_id: col.id,
                    student_id: col.estudiante_id,
                    tipo: 'colegiatura'
                },
                col.email
            );
        }
    }

    /**
     * Registrar pago manual
     */
    async registerManualPayment(colegiaturaId: number, data: {
        monto: number;
        metodo: string;
        referencia?: string;
        nota?: string;
    }): Promise<any> {
        const result = await executeQuery(`
            UPDATE colegiaturas
            SET 
                status = 'pagado',
                monto_pagado = $2,
                metodo_pago = $3,
                referencia_pago = $4,
                nota = $5,
                fecha_pago = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [
            colegiaturaId,
            data.monto,
            data.metodo,
            data.referencia || null,
            data.nota || null
        ]) as any[];

        return result[0];
    }

    /**
     * Aplicar descuento
     */
    async applyDiscount(colegiaturaId: number, descuento: number, motivo: string): Promise<any> {
        const result = await executeQuery(`
            UPDATE colegiaturas
            SET descuento = $2, motivo_descuento = $3
            WHERE id = $1
            RETURNING *
        `, [colegiaturaId, descuento, motivo]) as any[];

        return result[0];
    }

    /**
     * Condonar colegiatura
     */
    async forgiveTuition(colegiaturaId: number, motivo: string): Promise<any> {
        const result = await executeQuery(`
            UPDATE colegiaturas
            SET status = 'condonado', motivo_condonacion = $2
            WHERE id = $1
            RETURNING *
        `, [colegiaturaId, motivo]) as any[];

        return result[0];
    }

    /**
     * Actualizar colegiaturas vencidas
     */
    async updateOverdueTuitions(): Promise<number> {
        const result = await executeQuery(`
            UPDATE colegiaturas
            SET 
                status = 'vencido',
                recargo_mora = monto * 0.05
            WHERE status = 'pendiente'
            AND fecha_vencimiento < CURRENT_DATE
        `, []);

        return (result as any).rowCount || 0;
    }

    /**
     * Obtener estadísticas
     */
    async getStats(filters?: { mes?: number; anio?: number }): Promise<any> {
        let query = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'pagado' THEN 1 END) as pagadas,
                COUNT(CASE WHEN status = 'pendiente' THEN 1 END) as pendientes,
                COUNT(CASE WHEN status = 'vencido' THEN 1 END) as vencidas,
                SUM(CASE WHEN status = 'pagado' THEN monto_pagado ELSE 0 END) as ingresos_totales,
                SUM(CASE WHEN status IN ('pendiente', 'vencido') THEN monto ELSE 0 END) as por_cobrar
            FROM colegiaturas
            WHERE 1=1
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (filters?.mes) {
            query += ` AND mes = $${paramIndex}`;
            params.push(filters.mes);
            paramIndex++;
        }

        if (filters?.anio) {
            query += ` AND anio = $${paramIndex}`;
            params.push(filters.anio);
            paramIndex++;
        }

        const result = await executeQuery(query, params) as any[];
        return result[0];
    }

    /**
     * Obtener colegiaturas vencidas por estudiante
     */
    async getOverdueTuitionsByStudent(): Promise<any[]> {
        return await executeQuery(`
            SELECT 
                e.id as estudiante_id,
                e.nombre || ' ' || e.apellido_paterno as estudiante_nombre,
                e.matricula,
                COUNT(*) as total_vencidas,
                SUM(c.monto + COALESCE(c.recargo_mora, 0)) as deuda_total
            FROM colegiaturas c
            JOIN estudiantes e ON c.estudiante_id = e.id
            WHERE c.status IN ('vencido', 'pendiente')
            AND c.fecha_vencimiento < CURRENT_DATE
            GROUP BY e.id, e.nombre, e.apellido_paterno, e.matricula
            ORDER BY deuda_total DESC
        `, []) as any[];
    }

    /**
     * Calcular total con recargo por mora
     */
    private calculateTotalWithLateFee(colegiatura: any): number {
        let total = colegiatura.monto;

        // Aplicar descuento si existe
        if (colegiatura.descuento) {
            total -= colegiatura.descuento;
        }

        // Aplicar recargo por mora si está vencido
        if (colegiatura.status === 'vencido' ||
            (colegiatura.status === 'pendiente' && new Date(colegiatura.fecha_vencimiento) < new Date())) {
            const lateFee = total * 0.05; // 5% de recargo
            total += lateFee;
        }

        return total;
    }

    /**
     * Obtener nombre del mes
     */
    private getMonthName(month: number): string {
        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return months[month - 1] || '';
    }
}

export default new TuitionService();
