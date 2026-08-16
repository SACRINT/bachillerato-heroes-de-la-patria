"use strict";
/**
 * Financial Services - Consolidated
 * IA Coins, School Services, and Financial Dashboard
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.financialDashboardService = exports.schoolServicesService = exports.iaCoinsService = void 0;
const database_1 = require('../config/database.js');
const stripe_integration_service_1 = __importDefault(require('./stripe-integration.service.js'));
class IACoinsService {
    constructor() {
        this.packages = [
            { coins: 100, price: 99, name: 'Starter Pack' },
            { coins: 500, price: 449, bonus: 50, name: 'Student Pack' },
            { coins: 1000, price: 849, bonus: 150, name: 'Pro Pack' },
            { coins: 5000, price: 3999, bonus: 1000, name: 'Premium Pack' }
        ];
    }
    async getPackages() {
        return this.packages;
    }
    async purchaseCoins(userId, packageIndex, paymentMethod) {
        const pkg = this.packages[packageIndex];
        if (!pkg)
            throw new Error('Paquete no válido');
        const totalCoins = pkg.coins + (pkg.bonus || 0);
        if (paymentMethod === 'card') {
            return await stripe_integration_service_1.default.createCheckoutSession({
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
        }
        else {
            const user = await (0, database_1.executeQuery)('SELECT email FROM usuarios WHERE id = $1', [userId]);
            return await stripe_integration_service_1.default.createOxxoPayment(pkg.price, { user_id: userId, coins: totalCoins, tipo: 'ia_coins', amount: pkg.price }, user[0].email);
        }
    }
    async getBalance(userId) {
        var _a;
        const result = await (0, database_1.executeQuery)(`
            SELECT ia_coins FROM usuarios WHERE id = $1
        `, [userId]);
        return ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.ia_coins) || 0;
    }
    async deductCoins(userId, amount, description) {
        await (0, database_1.executeQuery)(`
            UPDATE usuarios
            SET ia_coins = ia_coins - $1
            WHERE id = $2 AND ia_coins >= $1
        `, [amount, userId]);
        await (0, database_1.executeQuery)(`
            INSERT INTO ia_coins_transactions (
                user_id, tipo, cantidad, descripcion
            ) VALUES ($1, 'gasto', $2, $3)
        `, [userId, amount, description]);
    }
    async getTransactions(userId, limit = 50) {
        return await (0, database_1.executeQuery)(`
            SELECT * FROM ia_coins_transactions
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2
        `, [userId, limit]);
    }
}
class SchoolServicesService {
    async getServices() {
        return await (0, database_1.executeQuery)(`
            SELECT * FROM servicios_escolares
            WHERE activo = true
            ORDER BY orden, nombre
        `, []);
    }
    async purchaseService(estudianteId, servicioId, paymentMethod) {
        const service = await (0, database_1.executeQuery)(`
            SELECT * FROM servicios_escolares WHERE id = $1
        `, [servicioId]);
        if (!service || service.length === 0) {
            throw new Error('Servicio no encontrado');
        }
        const svc = service[0];
        if (paymentMethod === 'card') {
            return await stripe_integration_service_1.default.createCheckoutSession({
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
        }
        else {
            const student = await (0, database_1.executeQuery)(`
                SELECT e.email FROM estudiantes e WHERE e.id = $1
            `, [estudianteId]);
            return await stripe_integration_service_1.default.createOxxoPayment(svc.precio, { student_id: estudianteId, service_id: servicioId, tipo: 'servicio' }, student[0].email);
        }
    }
    async getStudentServices(estudianteId) {
        return await (0, database_1.executeQuery)(`
            SELECT 
                ps.*,
                s.nombre as servicio_nombre,
                s.descripcion
            FROM pagos_servicios ps
            JOIN servicios_escolares s ON ps.servicio_id = s.id
            WHERE ps.estudiante_id = $1
            ORDER BY ps.fecha_pago DESC
        `, [estudianteId]);
    }
}
// ============================================
// FINANCIAL DASHBOARD SERVICE
// ============================================
class FinancialDashboardService {
    async getDashboardStats(filters) {
        var _a, _b, _c, _d, _e, _f, _g;
        const params = [];
        let paramIndex = 1;
        let dateFilter = '';
        if (filters === null || filters === void 0 ? void 0 : filters.fecha_inicio) {
            dateFilter += ` AND created_at >= $${paramIndex}`;
            params.push(filters.fecha_inicio);
            paramIndex++;
        }
        if (filters === null || filters === void 0 ? void 0 : filters.fecha_fin) {
            dateFilter += ` AND created_at <= $${paramIndex}`;
            params.push(filters.fecha_fin);
            paramIndex++;
        }
        const [transacciones, colegiaturas, inscripciones, servicios, iaCoins] = await Promise.all([
            // Transacciones totales
            (0, database_1.executeQuery)(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'completado' THEN monto ELSE 0 END) as ingresos,
                    AVG(CASE WHEN status = 'completado' THEN monto END) as ticket_promedio
                FROM transacciones_financieras
                WHERE 1=1 ${dateFilter}
            `, params),
            // Colegiaturas
            (0, database_1.executeQuery)(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'pagado' THEN 1 END) as pagadas,
                    SUM(CASE WHEN status = 'pagado' THEN monto_pagado ELSE 0 END) as ingresos,
                    SUM(CASE WHEN status IN ('pendiente', 'vencido') THEN monto ELSE 0 END) as por_cobrar
                FROM colegiaturas
            `, []),
            // Inscripciones
            (0, database_1.executeQuery)(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN pago_realizado THEN 1 END) as pagadas,
                    SUM(CASE WHEN pago_realizado THEN pago_monto ELSE 0 END) as ingresos
                FROM solicitudes_inscripcion
            `, []),
            // Servicios
            (0, database_1.executeQuery)(`
                SELECT 
                    COUNT(*) as total,
                    SUM(monto) as ingresos
                FROM pagos_servicios
                WHERE status = 'completado' ${dateFilter}
            `, params),
            // IA Coins
            (0, database_1.executeQuery)(`
                SELECT 
                    COUNT(*) as total_transacciones,
                    SUM(CASE WHEN tipo = 'compra' THEN monto_mxn ELSE 0 END) as ingresos
                FROM ia_coins_transactions
                WHERE 1=1 ${dateFilter}
            `, params)
        ]);
        return {
            resumen_general: {
                ingresos_totales: (((_a = transacciones[0]) === null || _a === void 0 ? void 0 : _a.ingresos) || 0) +
                    (((_b = colegiaturas[0]) === null || _b === void 0 ? void 0 : _b.ingresos) || 0) +
                    (((_c = inscripciones[0]) === null || _c === void 0 ? void 0 : _c.ingresos) || 0) +
                    (((_d = servicios[0]) === null || _d === void 0 ? void 0 : _d.ingresos) || 0) +
                    (((_e = iaCoins[0]) === null || _e === void 0 ? void 0 : _e.ingresos) || 0),
                transacciones_totales: ((_f = transacciones[0]) === null || _f === void 0 ? void 0 : _f.total) || 0,
                ticket_promedio: ((_g = transacciones[0]) === null || _g === void 0 ? void 0 : _g.ticket_promedio) || 0
            },
            colegiaturas: colegiaturas[0],
            inscripciones: inscripciones[0],
            servicios: servicios[0],
            ia_coins: iaCoins[0]
        };
    }
    async getRevenueByMonth(year) {
        return await (0, database_1.executeQuery)(`
            SELECT 
                EXTRACT(MONTH FROM created_at) as mes,
                SUM(monto) as ingresos,
                COUNT(*) as transacciones
            FROM transacciones_financieras
            WHERE EXTRACT(YEAR FROM created_at) = $1
            AND status = 'completado'
            GROUP BY EXTRACT(MONTH FROM created_at)
            ORDER BY mes
        `, [year]);
    }
    async getRevenueByType(filters) {
        const params = [];
        let paramIndex = 1;
        let dateFilter = '';
        if (filters === null || filters === void 0 ? void 0 : filters.fecha_inicio) {
            dateFilter += ` AND created_at >= $${paramIndex}`;
            params.push(filters.fecha_inicio);
            paramIndex++;
        }
        if (filters === null || filters === void 0 ? void 0 : filters.fecha_fin) {
            dateFilter += ` AND created_at <= $${paramIndex}`;
            params.push(filters.fecha_fin);
            paramIndex++;
        }
        return await (0, database_1.executeQuery)(`
            SELECT 
                tipo,
                COUNT(*) as cantidad,
                SUM(monto) as total
            FROM transacciones_financieras
            WHERE status = 'completado' ${dateFilter}
            GROUP BY tipo
            ORDER BY total DESC
        `, params);
    }
    async getTopPayingStudents(limit = 10) {
        return await (0, database_1.executeQuery)(`
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
        `, [limit]);
    }
    async getPaymentMethods() {
        return await (0, database_1.executeQuery)(`
            SELECT 
                metodo_pago,
                COUNT(*) as cantidad,
                SUM(monto) as total
            FROM transacciones_financieras
            WHERE status = 'completado'
            GROUP BY metodo_pago
            ORDER BY total DESC
        `, []);
    }
}
// Export instances
exports.iaCoinsService = new IACoinsService();
exports.schoolServicesService = new SchoolServicesService();
exports.financialDashboardService = new FinancialDashboardService();
