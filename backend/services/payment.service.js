"use strict";
/**
 * Payment Service
 * Integración con Stripe y OXXO Pay para pagos de inscripción
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class PaymentService {
    /**
     * Crear intención de pago con Stripe
     */
    async createPaymentIntent(data) {
        try {
            // TODO: Integrar con  Stripe SDK real
            // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
            // const paymentIntent = await stripe.paymentIntents.create({
            //     amount: data.amount * 100, // Convertir a centavos
            //     currency: data.currency,
            //     description: data.description,
            //     metadata: data.metadata
            // });
            // Por ahora, simulamos la respuesta
            const mockPaymentIntent = {
                id: `pi_mock_${Date.now()}`,
                amount: data.amount * 100,
                currency: data.currency,
                status: 'requires_payment_method',
                client_secret: `pi_mock_${Date.now()}_secret_mock`,
                metadata: data.metadata
            };
            // Registrar en BD
            const record = await this.createPaymentRecord({
                solicitud_id: data.metadata.solicitud_id,
                monto: data.amount,
                moneda: data.currency,
                metodo_pago: 'tarjeta',
                status: 'pendiente',
                stripe_payment_intent_id: mockPaymentIntent.id
            });
            return {
                paymentIntent: mockPaymentIntent,
                record
            };
        }
        catch (error) {
            console.error('Error creando payment intent:', error);
            throw error;
        }
    }
    /**
     * Crear pago con OXXO
     */
    async createOxxoPayment(data) {
        try {
            // TODO: Integrar con Stripe OXXO
            // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
            // const paymentIntent = await stripe.paymentIntents.create({
            //     amount: data.amount * 100,
            //     currency: data.currency,
            //     payment_method_types: ['oxxo'],
            //     description: data.description,
            //     metadata: data.metadata
            // });
            // Mock de respuesta OXXO
            const mockOxxoPayment = {
                id: `pi_oxxo_mock_${Date.now()}`,
                amount: data.amount * 100,
                currency: data.currency,
                status: 'requires_action',
                next_action: {
                    type: 'oxxo_display_details',
                    oxxo_display_details: {
                        number: `${Date.now()}`.slice(-10),
                        expires_after: 259200, // 3 días
                        hosted_voucher_url: 'https://mockurl.com/voucher'
                    }
                }
            };
            const record = await this.createPaymentRecord({
                solicitud_id: data.metadata.solicitud_id,
                monto: data.amount,
                moneda: data.currency,
                metodo_pago: 'oxxo',
                status: 'pendiente',
                stripe_payment_intent_id: mockOxxoPayment.id,
                oxxo_referencia: mockOxxoPayment.next_action.oxxo_display_details.number,
                fecha_expiracion: new Date(Date.now() + 259200000) // 3 días
            });
            return {
                payment: mockOxxoPayment,
                record,
                referencia: mockOxxoPayment.next_action.oxxo_display_details.number,
                voucher_url: mockOxxoPayment.next_action.oxxo_display_details.hosted_voucher_url
            };
        }
        catch (error) {
            console.error('Error creando pago OXXO:', error);
            throw error;
        }
    }
    /**
     * Confirmar pago (webhook de Stripe)
     */
    async confirmPayment(paymentIntentId) {
        // Buscar registro de pago
        const payment = await (0, database_1.executeQuery)(`
            SELECT * FROM pagos_inscripcion
            WHERE stripe_payment_intent_id = $1
        `, [paymentIntentId]);
        if (!payment || payment.length === 0) {
            throw new Error('Pago no encontrado');
        }
        const paymentData = payment[0];
        // Actualizar status
        await (0, database_1.executeQuery)(`
            UPDATE pagos_inscripcion
            SET 
                status = 'completado',
                fecha_pago = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [paymentData.id]);
        // Actualizar solicitud de inscripción
        const EnrollmentService = require('./enrollment.service').default;
        await EnrollmentService.registerPayment(paymentData.solicitud_id, {
            monto: paymentData.monto,
            referencia: paymentIntentId,
            metodo: paymentData.metodo_pago
        });
        // Generar recibo
        await this.generateReceipt(paymentData.id);
        return paymentData;
    }
    /**
     * Cancelar pago
     */
    async cancelPayment(paymentId) {
        const payment = await (0, database_1.executeQuery)(`
            SELECT * FROM pagos_inscripcion WHERE id = $1
        `, [paymentId]);
        if (!payment || payment.length === 0) {
            throw new Error('Pago no encontrado');
        }
        // Si tiene Stripe intent, cancelar
        if (payment[0].stripe_payment_intent_id) {
            // TODO: Cancelar en Stripe
            // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
            // await stripe.paymentIntents.cancel(payment[0].stripe_payment_intent_id);
        }
        await (0, database_1.executeQuery)(`
            UPDATE pagos_inscripcion
            SET status = 'fallido', updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [paymentId]);
    }
    /**
     * Crear registro de pago
     */
    async createPaymentRecord(data) {
        const result = await (0, database_1.executeQuery)(`
            INSERT INTO pagos_inscripcion (
                solicitud_id, monto, moneda, metodo_pago, status,
                stripe_payment_intent_id, stripe_charge_id, oxxo_referencia,
                fecha_expiracion, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
            RETURNING *
        `, [
            data.solicitud_id,
            data.monto,
            data.moneda || 'MXN',
            data.metodo_pago,
            data.status || 'pendiente',
            data.stripe_payment_intent_id || null,
            data.stripe_charge_id || null,
            data.oxxo_referencia || null,
            data.fecha_expiracion || null
        ]);
        return result[0];
    }
    /**
     * Obtener pago por ID
     */
    async getPayment(id) {
        const result = await (0, database_1.executeQuery)(`
            SELECT 
                p.*,
                s.nombres,
                s.apellido_paterno,
                s.matricula
            FROM pagos_inscripcion p
            JOIN solicitudes_inscripcion s ON p.solicitud_id = s.id
            WHERE p.id = $1
        `, [id]);
        return result[0];
    }
    /**
     * Obtener pagos por solicitud
     */
    async getPaymentsBySolicitud(solicitudId) {
        return await (0, database_1.executeQuery)(`
            SELECT * FROM pagos_inscripcion
            WHERE solicitud_id = $1
            ORDER BY created_at DESC
        `, [solicitudId]);
    }
    /**
     * Generar recibo de pago
     */
    async generateReceipt(paymentId) {
        const payment = await this.getPayment(paymentId);
        if (!payment) {
            throw new Error('Pago no encontrado');
        }
        // TODO: Generar PDF real de recibo
        const reciboUrl = `/recibos/${payment.id}_recibo.pdf`;
        await (0, database_1.executeQuery)(`
            UPDATE pagos_inscripcion
            SET recibo_url = $1, recibo_generado = true
            WHERE id = $2
        `, [reciboUrl, paymentId]);
        return reciboUrl;
    }
    /**
     * Obtener estadísticas de pagos
     */
    async getPaymentStats(filters) {
        let query = `
            SELECT 
                COUNT(*) as total_pagos,
                COUNT(CASE WHEN status = 'completado' THEN 1 END) as pagos_completados,
                COUNT(CASE WHEN status = 'pendiente' THEN 1 END) as pagos_pendientes,
                SUM(CASE WHEN status = 'completado' THEN monto ELSE 0 END) as ingresos_totales,
                AVG(CASE WHEN status = 'completado' THEN monto END) as ticket_promedio,
                COUNT(CASE WHEN metodo_pago = 'tarjeta' THEN 1 END) as pagos_tarjeta,
                COUNT(CASE WHEN metodo_pago = 'oxxo' THEN 1 END) as pagos_oxxo
            FROM pagos_inscripcion
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;
        if (filters === null || filters === void 0 ? void 0 : filters.fecha_desde) {
            query += ` AND created_at >= $${paramIndex}`;
            params.push(filters.fecha_desde);
            paramIndex++;
        }
        if (filters === null || filters === void 0 ? void 0 : filters.fecha_hasta) {
            query += ` AND created_at <= $${paramIndex}`;
            params.push(filters.fecha_hasta);
            paramIndex++;
        }
        const result = await (0, database_1.executeQuery)(query, params);
        return result[0];
    }
    /**
     * Verificar pago OXXO expirado
     */
    async checkExpiredOxxoPayments() {
        const expired = await (0, database_1.executeQuery)(`
            UPDATE pagos_inscripcion
            SET status = 'fallido', motivo_fallo = 'Pago OXXO expirado'
            WHERE metodo_pago = 'oxxo'
            AND status = 'pendiente'
            AND fecha_expiracion < CURRENT_TIMESTAMP
            RETURNING id
        `, []);
        return expired.length;
    }
    /**
     * Reembolsar pago
     */
    async refundPayment(paymentId, motivo) {
        const payment = await (0, database_1.executeQuery)(`
            SELECT * FROM pagos_inscripcion WHERE id = $1
        `, [paymentId]);
        if (!payment || payment.length === 0) {
            throw new Error('Pago no encontrado');
        }
        if (payment[0].status !== 'completado') {
            throw new Error('Solo se pueden reembolsar pagos completados');
        }
        // TODO: Reembolsar en Stripe
        // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        // const refund = await stripe.refunds.create({
        //     payment_intent: payment[0].stripe_payment_intent_id,
        //     reason: 'requested_by_customer'
        // });
        await (0, database_1.executeQuery)(`
            UPDATE pagos_inscripcion
            SET 
                status = 'reembolsado',
                motivo_reembolso = $2,
                fecha_reembolso = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [paymentId, motivo]);
        return payment[0];
    }
}
exports.default = new PaymentService();
