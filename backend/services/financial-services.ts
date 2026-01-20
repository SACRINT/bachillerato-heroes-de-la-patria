/**
 * Financial Services - Consolidated
 * IA Coins, School Services, and Financial Dashboard
 */

import { executeQuery } from '../config/database';
import StripeIntegrationService from './stripe-integration.service';

// ============================================
// IA COINS SERVICE
// ============================================

export interface IACoinsPackage {
    coins: number;
    price: number;
    bonus?: number;
    name: string;
}

class IACoinsService {

    private packages: IACoinsPackage[] = [
        { coins: 100, price: 99, name: 'Starter Pack' },
        { coins: 500, price: 449, bonus: 50, name: 'Student Pack' },
        { coins: 1000, price: 849, bonus: 150, name: 'Pro Pack' },
        { coins: 5000, price: 3999, bonus: 1000, name: 'Premium Pack' }
    ];

    async getPackages(): Promise<IACoinsPackage[]> {
        return this.packages;
    }

    async purchaseCoins(userId: number, packageIndex: number, paymentMethod: 'card' | 'oxxo'): Promise<any> {
        const pkg = this.packages[packageIndex];
        if (!pkg) throw new Error('Paquete no válido');

        const totalCoins = pkg.coins + (pkg.bonus || 0);

        if (paymentMethod === 'card') {
            return await StripeIntegrationService.createCheckoutSession({
                type: 'ia_coins',
                amount: pkg.price,
                description: `IA Coins - ${pkg.name}`,
                metadata: {
                    user_id: userId,
                    coins: totalCoins,
                    tipo: 'ia_coins',
                    amount: pkg.price
                },
                success_url: `${process.env.FRONTEND_URL}/ia-coins/exito?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.FRONTEND_URL}/ia-coins/cancelado`
            });
        } else {
            const user = await executeQuery('SELECT email FROM usuarios WHERE id = $1', [userId]) as any[];
            return await StripeIntegrationService.createOxxoPayment(
                pkg.price,
                { user_id: userId, coins: totalCoins, tipo: 'ia_coins', amount: pkg.price },
                user[0].email
            );
        }
    }

    async getBalance(userId: number): Promise<number> {
        const result = await executeQuery(`
            SELECT ia_coins FROM usuarios WHERE id = $1
        `, [userId]) as any[];
        return result[0]?.ia_coins || 0;
    }

    async deductCoins(userId: number, amount: number, description: string): Promise<void> {
        await executeQuery(`
            UPDATE usuarios
            SET ia_coins = ia_coins - $1
            WHERE id = $2 AND ia_coins >= $1
        `, [amount, userId]);

        await executeQuery(`
            INSERT INTO ia_coins_transactions (
                user_id, tipo, cantidad, descripcion
            ) VALUES ($1, 'gasto', $2, $3)
        `, [userId, amount, description]);
    }

    async getTransactions(userId: number, limit: number = 50): Promise<any[]> {
        return await executeQuery(`
            SELECT * FROM ia_coins_transactions
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2
        `, [userId, limit]) as any[];
    }
}

// ============================================
// SCHOOL SERVICES SERVICE
// ============================================

export interface SchoolService {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    tipo: 'unico' | 'mensual' | 'anual';
    activo: boolean;
}

class SchoolServicesService {

    async getServices(): Promise<SchoolService[]> {
        return await executeQuery(`
            SELECT * FROM servicios_escolares
            WHERE activo = true
            ORDER BY orden, nombre
        `, []) as any[];
    }

    async purchaseService(estudianteId: number, servicioId: number, paymentMethod: 'card' | 'oxxo'): Promise<any> {
        const service = await executeQuery(`
            SELECT * FROM servicios_escolares WHERE id = $1
        `, [servicioId]) as any[];

        if (!service || service.length === 0) {
            throw new Error('Servicio no encontrado');
        }

        const svc = service[0];

        if (paymentMethod === 'card') {
            return await StripeIntegrationService.createCheckoutSession({
                type: 'servicio',
                amount: svc.precio,
                description: svc.nombre,
                metadata: {
                    student_id: estudianteId,
                    service_id: servicioId,
                    tipo: 'servicio'
                },
                success_url: `${process.env.FRONTEND_URL}/servicios/exito?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.FRONTEND_URL}/servicios/cancelado`
            });
        } else {
            const student = await executeQuery(`
                SELECT e.email FROM estudiantes e WHERE e.id = $1
            `, [estudianteId]) as any[];

            return await StripeIntegrationService.createOxxoPayment(
                svc.precio,
                { student_id: estudianteId, service_id: servicioId, tipo: 'servicio' },
                student[0].email
            );
        }
    }

    async getStudentServices(estudianteId: number): Promise<any[]> {
        return await executeQuery(`
            SELECT 
                ps.*,
                s.nombre as servicio_nombre,
                s.descripcion
            FROM pagos_servicios ps
            JOIN servicios_escolares s ON ps.servicio_id = s.id
            WHERE ps.estudiante_id = $1
            ORDER BY ps.fecha_pago DESC
        `, [estudianteId]) as any[];
    }
}

// ============================================
// FINANCIAL DASHBOARD SERVICE
// ============================================

class FinancialDashboardService {

    async getDashboardStats(filters?: { fecha_inicio?: Date; fecha_fin?: Date }): Promise<any> {
        const params: any[] = [];
        let paramIndex = 1;

        let dateFilter = '';
        if (filters?.fecha_inicio) {
            dateFilter += ` AND created_at >= $${paramIndex}`;
            params.push(filters.fecha_inicio);
            paramIndex++;
        }
        if (filters?.fecha_fin) {
            dateFilter += ` AND created_at <= $${paramIndex}`;
            params.push(filters.fecha_fin);
            paramIndex++;
        }

        const [
            transacciones,
            colegiaturas,
            inscripciones,
            servicios,
            iaCoins
        ] = await Promise.all([
            // Transacciones totales
            executeQuery(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'completado' THEN monto ELSE 0 END) as ingresos,
                    AVG(CASE WHEN status = 'completado' THEN monto END) as ticket_promedio
                FROM transacciones_financieras
                WHERE 1=1 ${dateFilter}
            `, params),

            // Colegiaturas
            executeQuery(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'pagado' THEN 1 END) as pagadas,
                    SUM(CASE WHEN status = 'pagado' THEN monto_pagado ELSE 0 END) as ingresos,
                    SUM(CASE WHEN status IN ('pendiente', 'vencido') THEN monto ELSE 0 END) as por_cobrar
                FROM colegiaturas
            `, []),

            // Inscripciones
            executeQuery(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN pago_realizado THEN 1 END) as pagadas,
                    SUM(CASE WHEN pago_realizado THEN pago_monto ELSE 0 END) as ingresos
                FROM solicitudes_inscripcion
            `, []),

            // Servicios
            executeQuery(`
                SELECT 
                    COUNT(*) as total,
                    SUM(monto) as ingresos
                FROM pagos_servicios
                WHERE status = 'completado' ${dateFilter}
            `, params),

            // IA Coins
            executeQuery(`
                SELECT 
                    COUNT(*) as total_transacciones,
                    SUM(CASE WHEN tipo = 'compra' THEN monto_mxn ELSE 0 END) as ingresos
                FROM ia_coins_transactions
                WHERE 1=1 ${dateFilter}
            `, params)
        ]);

        return {
            resumen_general: {
                ingresos_totales:
                    ((transacciones as any[])[0]?.ingresos || 0) +
                    ((colegiaturas as any[])[0]?.ingresos || 0) +
                    ((inscripciones as any[])[0]?.ingresos || 0) +
                    ((servicios as any[])[0]?.ingresos || 0) +
                    ((iaCoins as any[])[0]?.ingresos || 0),
                transacciones_totales: (transacciones as any[])[0]?.total || 0,
                ticket_promedio: (transacciones as any[])[0]?.ticket_promedio || 0
            },
            colegiaturas: (colegiaturas as any[])[0],
            inscripciones: (inscripciones as any[])[0],
            servicios: (servicios as any[])[0],
            ia_coins: (iaCoins as any[])[0]
        };
    }

    async getRevenueByMonth(year: number): Promise<any[]> {
        return await executeQuery(`
            SELECT 
                EXTRACT(MONTH FROM created_at) as mes,
                SUM(monto) as ingresos,
                COUNT(*) as transacciones
            FROM transacciones_financieras
            WHERE EXTRACT(YEAR FROM created_at) = $1
            AND status = 'completado'
            GROUP BY EXTRACT(MONTH FROM created_at)
            ORDER BY mes
        `, [year]) as any[];
    }

    async getRevenueByType(filters?: { fecha_inicio?: Date; fecha_fin?: Date }): Promise<any[]> {
        const params: any[] = [];
        let paramIndex = 1;
        let dateFilter = '';

        if (filters?.fecha_inicio) {
            dateFilter += ` AND created_at >= $${paramIndex}`;
            params.push(filters.fecha_inicio);
            paramIndex++;
        }
        if (filters?.fecha_fin) {
            dateFilter += ` AND created_at <= $${paramIndex}`;
            params.push(filters.fecha_fin);
            paramIndex++;
        }

        return await executeQuery(`
            SELECT 
                tipo,
                COUNT(*) as cantidad,
                SUM(monto) as total
            FROM transacciones_financieras
            WHERE status = 'completado' ${dateFilter}
            GROUP BY tipo
            ORDER BY total DESC
        `, params) as any[];
    }

    async getTopPayingStudents(limit: number = 10): Promise<any[]> {
        return await executeQuery(`
            SELECT 
                e.id,
                e.matricula,
                e.nombre || ' ' || e.apellido_paterno as nombre_completo,
                SUM(c.monto_pagado) as total_pagado,
                COUNT(*) as pagos_realizados
            FROM colegiaturas c
            JOIN estudiantes e ON c.estudiante_id = e.id
            WHERE c.status = 'pagado'
            GROUP BY e.id, e.matricula, e.nombre, e.apellido_paterno
            ORDER BY total_pagado DESC
            LIMIT $1
        `, [limit]) as any[];
    }

    async getPaymentMethods(): Promise<any[]> {
        return await executeQuery(`
            SELECT 
                metodo_pago,
                COUNT(*) as cantidad,
                SUM(monto) as total
            FROM transacciones_financieras
            WHERE status = 'completado'
            GROUP BY metodo_pago
            ORDER BY total DESC
        `, []) as any[];
    }
}

// Export instances
export const iaCoinsService = new IACoinsService();
export const schoolServicesService = new SchoolServicesService();
export const financialDashboardService = new FinancialDashboardService();
