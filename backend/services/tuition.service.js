"use strict";
/**
 * Tuition Service
 * Sistema de gestión de colegiaturas mensuales
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require('../config/database.js');
const stripe_integration_service_1 = __importDefault(require('./stripe-integration.service.js'));
class TuitionService {
    /**
     * Generar colegiaturas del ciclo escolar
     */
    async generateYearlyTuitions(estudianteId, cicloEscolar) {
        const currentYear = new Date().getFullYear();
        const tuitions = [];
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
            const result = await (0, database_1.executeQuery)(`
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
            ]);
            created.push(result[0]);
        }
        return created;
    }
    /**
     * Obtener monto mensual de colegiatura
     */
    async getMonthlyAmount() {
        const config = await (0, database_1.executeQuery)(`
            SELECT valor FROM configuracion_inscripciones
            WHERE clave = 'monto_colegiatura'
        `, []);
        if (config && config.length > 0) {
            return parseFloat(config[0].valor.valor);
        }
        return 2500; // Monto por defecto
    }
    /**
     * Obtener colegiaturas de un estudiante
     */
    async getStudentTuitions(estudianteId, filters) {
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
        const params = [estudianteId];
        let paramIndex = 2;
        if (filters === null || filters === void 0 ? void 0 : filters.status) {
            query += ` AND c.status = $${paramIndex}`;
            params.push(filters.status);
            paramIndex++;
        }
        if (filters === null || filters === void 0 ? void 0 : filters.anio) {
            query += ` AND c.anio = $${paramIndex}`;
            params.push(filters.anio);
            paramIndex++;
        }
        query += ` ORDER BY c.anio, c.mes`;
        return await (0, database_1.executeQuery)(query, params);
    }
    /**
     * Iniciar pago de colegiatura
     */
    async initatePayment(colegiaturaId, paymentMethod) {
        const colegiatura = await (0, database_1.executeQuery)(`
            SELECT c.*, e.email
            FROM colegiaturas c
            JOIN estudiantes e ON c.estudiante_id = e.id
            WHERE c.id = $1
        `, [colegiaturaId]);
        if (!colegiatura || colegiatura.length === 0) {
            throw new Error('Colegiatura no encontrada');
        }
        const col = colegiatura[0];
        // Calcular recargo por mora si aplica
        const totalAmount = this.calculateTotalWithLateFee(col);
        if (paymentMethod === 'card') {
            return await stripe_integration_service_1.default.createCheckoutSession({
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
        }
        else {
            return await stripe_integration_service_1.default.createOxxoPayment(totalAmount, {
                colegiatura_id: col.id,
                student_id: col.estudiante_id,
                tipo: 'colegiatura'
            }, col.email);
        }
    }
    /**
     * Registrar pago manual
     */
    async registerManualPayment(colegiaturaId, data) {
        const result = await (0, database_1.executeQuery)(`
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
        ]);
        return result[0];
    }
    /**
     * Aplicar descuento
     */
    async applyDiscount(colegiaturaId, descuento, motivo) {
        const result = await (0, database_1.executeQuery)(`
            UPDATE colegiaturas
            SET descuento = $2, motivo_descuento = $3
            WHERE id = $1
            RETURNING *
        `, [colegiaturaId, descuento, motivo]);
        return result[0];
    }
    /**
     * Condonar colegiatura
     */
    async forgiveTuition(colegiaturaId, motivo) {
        const result = await (0, database_1.executeQuery)(`
            UPDATE colegiaturas
            SET status = 'condonado', motivo_condonacion = $2
            WHERE id = $1
            RETURNING *
        `, [colegiaturaId, motivo]);
        return result[0];
    }
    /**
     * Actualizar colegiaturas vencidas
     */
    async updateOverdueTuitions() {
        const result = await (0, database_1.executeQuery)(`
            UPDATE colegiaturas
            SET 
                status = 'vencido',
                recargo_mora = monto * 0.05
            WHERE status = 'pendiente'
            AND fecha_vencimiento < CURRENT_DATE
        `, []);
        return result.rowCount || 0;
    }
    /**
     * Obtener estadísticas
     */
    async getStats(filters) {
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
        const params = [];
        let paramIndex = 1;
        if (filters === null || filters === void 0 ? void 0 : filters.mes) {
            query += ` AND mes = $${paramIndex}`;
            params.push(filters.mes);
            paramIndex++;
        }
        if (filters === null || filters === void 0 ? void 0 : filters.anio) {
            query += ` AND anio = $${paramIndex}`;
            params.push(filters.anio);
            paramIndex++;
        }
        const result = await (0, database_1.executeQuery)(query, params);
        return result[0];
    }
    /**
     * Obtener colegiaturas vencidas por estudiante
     */
    async getOverdueTuitionsByStudent() {
        return await (0, database_1.executeQuery)(`
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
        `, []);
    }
    /**
     * Calcular total con recargo por mora
     */
    calculateTotalWithLateFee(colegiatura) {
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
    getMonthName(month) {
        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return months[month - 1] || '';
    }
}
exports.default = new TuitionService();
