/**
 * IA Coins Economy Service
 * Sistema completo de economía virtual con tienda, subastas y premios
 */

import { executeQuery } from '../config/database';

// ============================================
// TIENDA DE AVATARES Y ITEMS
// ============================================

export interface StoreItem {
    id?: number;
    tipo: 'avatar' | 'accesorio' | 'tema' | 'efecto' | 'boost';
    nombre: string;
    descripcion: string;
    precio_coins: number;
    rareza: 'comun' | 'raro' | 'epico' | 'legendario';
    imagen_url: string;
    stock_limitado: boolean;
    stock_disponible?: number;
    activo: boolean;
}

class StoreService {
    async getItems(filters?: { tipo?: string; rareza?: string }): Promise<StoreItem[]> {
        let query = 'SELECT * FROM ia_coins_store WHERE activo = true';
        const params: any[] = [];
        let paramIndex = 1;

        if (filters?.tipo) {
            query += ` AND tipo = $${paramIndex}`;
            params.push(filters.tipo);
            paramIndex++;
        }
        if (filters?.rareza) {
            query += ` AND rareza = $${paramIndex}`;
            params.push(filters.rareza);
            paramIndex++;
        }

        query += ' ORDER BY rareza DESC, precio_coins ASC';
        return await executeQuery(query, params) as StoreItem[];
    }

    async purchaseItem(userId: number, itemId: number): Promise<any> {
        const item = await executeQuery('SELECT * FROM ia_coins_store WHERE id = $1', [itemId]) as any[];
        if (!item || item.length === 0) throw new Error('Item no encontrado');

        const userBalance = await executeQuery('SELECT ia_coins FROM usuarios WHERE id = $1', [userId]) as any[];
        if (userBalance[0].ia_coins < item[0].precio_coins) {
            throw new Error('Saldo insuficiente');
        }

        // Verificar stock
        if (item[0].stock_limitado && item[0].stock_disponible <= 0) {
            throw new Error('Item agotado');
        }

        // Deducir coins
        await executeQuery('UPDATE usuarios SET ia_coins = ia_coins - $1 WHERE id = $2',
            [item[0].precio_coins, userId]);

        // Agregar a inventario
        await executeQuery(`
            INSERT INTO user_inventory (user_id, item_id, fecha_adquisicion)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
        `, [userId, itemId]);

        // Reducir stock
        if (item[0].stock_limitado) {
            await executeQuery('UPDATE ia_coins_store SET stock_disponible = stock_disponible - 1 WHERE id = $1', [itemId]);
        }

        // Registrar transacción
        await executeQuery(`
            INSERT INTO ia_coins_transactions (user_id, tipo, cantidad, descripcion)
            VALUES ($1, 'gasto', $2, $3)
        `, [userId, item[0].precio_coins, `Compra: ${item[0].nombre}`]);

        return { success: true, item: item[0] };
    }

    async getUserInventory(userId: number): Promise<any[]> {
        return await executeQuery(`
            SELECT 
                ui.*,
                s.nombre,
                s.tipo,
                s.rareza,
                s.imagen_url
            FROM user_inventory ui
            JOIN ia_coins_store s ON ui.item_id = s.id
            WHERE ui.user_id = $1
            ORDER BY ui.fecha_adquisicion DESC
        `, [userId]) as any[];
    }
}

// ============================================
// SISTEMA DE PREMIOS REALES
// ============================================

export interface RealPrize {
    id?: number;
    nombre: string;
    descripcion: string;
    costo_coins: number;
    stock: number;
    tipo: 'fisico' | 'digital' | 'experiencia';
    imagen_url: string;
    instrucciones_canje: string;
}

class PrizesService {
    async getPrizes(): Promise<RealPrize[]> {
        return await executeQuery(`
            SELECT * FROM premios_reales
            WHERE activo = true AND stock > 0
            ORDER BY costo_coins ASC
        `, []) as RealPrize[];
    }

    async redeemPrize(userId: number, prizeId: number): Promise<any> {
        const prize = await executeQuery('SELECT * FROM premios_reales WHERE id = $1', [prizeId]) as any[];
        if (!prize || prize.length === 0 || prize[0].stock <= 0) {
            throw new Error('Premio no disponible');
        }

        const user = await executeQuery('SELECT ia_coins, nombre, email FROM usuarios WHERE id = $1', [userId]) as any[];
        if (user[0].ia_coins < prize[0].costo_coins) {
            throw new Error('Coins insuficientes');
        }

        // Deducir coins
        await executeQuery('UPDATE usuarios SET ia_coins = ia_coins - $1 WHERE id = $2',
            [prize[0].costo_coins, userId]);

        // Reducir stock
        await executeQuery('UPDATE premios_reales SET stock = stock - 1 WHERE id = $1', [prizeId]);

        // Registrar canje
        const result = await executeQuery(`
            INSERT INTO canjes_premios (
                user_id, premio_id, coins_gastados, status, fecha_canje
            ) VALUES ($1, $2, $3, 'pendiente', CURRENT_TIMESTAMP)
            RETURNING *
        `, [userId, prizeId, prize[0].costo_coins]) as any[];

        // Notificar admin
        await this.notifyPrizeRedemption(user[0], prize[0], result[0].id);

        return result[0];
    }

    private async notifyPrizeRedemption(user: any, prize: any, canjeId: number): Promise<void> {
        await executeQuery(`
            INSERT INTO notificaciones (
                usuario_email, tipo, titulo, mensaje, prioridad
            ) VALUES (
                'admin@heroespatria.edu.mx',
                'canje_premio',
                'Nuevo canje de premio',
                $1,
                'alta'
            )
        `, [`Usuario ${user.nombre} (${user.email}) canjeó: ${prize.nombre}. Canje ID: ${canjeId}`]);
    }

    async getUserRedemptions(userId: number): Promise<any[]> {
        return await executeQuery(`
            SELECT 
                c.*,
                p.nombre as premio_nombre,
                p.tipo,
                p.imagen_url,
                p.instrucciones_canje
            FROM canjes_premios c
            JOIN premios_reales p ON c.premio_id = p.id
            WHERE c.user_id = $1
            ORDER BY c.fecha_canje DESC
        `, [userId]) as any[];
    }
}

// ============================================
// SISTEMA DE SUBASTAS
// ============================================

export interface Auction {
    id?: number;
    item_nombre: string;
    descripcion: string;
    precio_inicial: number;
    precio_actual: number;
    incremento_minimo: number;
    fecha_inicio: Date;
    fecha_fin: Date;
    ganador_id?: number;
    status: 'activa' | 'finalizada' | 'cancelada';
}

class AuctionsService {
    async getActiveAuctions(): Promise<Auction[]> {
        return await executeQuery(`
            SELECT 
                a.*,
                u.nombre as ganador_nombre,
                (SELECT COUNT(*) FROM auction_bids WHERE auction_id = a.id) as total_pujas
            FROM auctions a
            LEFT JOIN usuarios u ON a.ganador_id = u.id
            WHERE a.status = 'activa' AND a.fecha_fin > CURRENT_TIMESTAMP
            ORDER BY a.fecha_fin ASC
        `, []) as Auction[];
    }

    async placeBid(userId: number, auctionId: number, amount: number): Promise<any> {
        const auction = await executeQuery('SELECT * FROM auctions WHERE id = $1', [auctionId]) as any[];
        if (!auction || auction.length === 0) throw new Error('Subasta no encontrada');

        if (auction[0].status !== 'activa' || new Date(auction[0].fecha_fin) < new Date()) {
            throw new Error('Subasta no activa');
        }

        if (amount < auction[0].precio_actual + auction[0].incremento_minimo) {
            throw new Error(`Puja mínima: ${auction[0].precio_actual + auction[0].incremento_minimo} coins`);
        }

        const user = await executeQuery('SELECT ia_coins FROM usuarios WHERE id = $1', [userId]) as any[];
        if (user[0].ia_coins < amount) throw new Error('Coins insuficientes');

        // Registrar puja
        await executeQuery(`
            INSERT INTO auction_bids (auction_id, user_id, amount, fecha_puja)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        `, [auctionId, userId, amount]);

        // Actualizar precio actual
        await executeQuery(`
            UPDATE auctions SET precio_actual = $1, ganador_id = $2 WHERE id = $3
        `, [amount, userId, auctionId]);

        return { success: true, newPrice: amount };
    }

    async finalizeAuction(auctionId: number): Promise<void> {
        const auction = await executeQuery('SELECT * FROM auctions WHERE id = $1', [auctionId]) as any[];
        if (!auction[0].ganador_id) {
            await executeQuery('UPDATE auctions SET status = $1 WHERE id = $2', ['cancelada', auctionId]);
            return;
        }

        // Deducir coins del ganador
        await executeQuery('UPDATE usuarios SET ia_coins = ia_coins - $1 WHERE id = $2',
            [auction[0].precio_actual, auction[0].ganador_id]);

        // Marcar como finalizada
        await executeQuery('UPDATE auctions SET status = $1 WHERE id = $2', ['finalizada', auctionId]);

        // Registrar en inventario del ganador
        // (Asumiendo que la subasta tiene un item_id asociado)
    }
}

// ============================================
// SISTEMA DE SUSCRIPCIÓN VIP
// ============================================

export interface VIPSubscription {
    tipo: 'mensual' | 'trimestral' | 'anual';
    precio_coins: number;
    precio_mxn: number;
    beneficios: string[];
}

class VIPService {
    private plans: VIPSubscription[] = [
        {
            tipo: 'mensual',
            precio_coins: 500,
            precio_mxn: 99,
            beneficios: [
                '2x velocidad de ganancia de coins',
                'Acceso a avatares exclusivos',
                'Prioridad en subastas',
                'Descuento 10% en tienda',
                'Badge VIP en perfil'
            ]
        },
        {
            tipo: 'trimestral',
            precio_coins: 1200,
            precio_mxn: 249,
            beneficios: [
                'Todos los beneficios mensuales',
                '1 item legendario gratis',
                'Descuento 15% en tienda'
            ]
        },
        {
            tipo: 'anual',
            precio_coins: 4000,
            precio_mxn: 799,
            beneficios: [
                'Todos los beneficios trimestrales',
                '3x velocidad de ganancia',
                'Descuento 20% en tienda',
                'Avatar exclusivo anual'
            ]
        }
    ];

    getPlans(): VIPSubscription[] { return this.plans; }

    async subscribe(userId: number, plan: 'mensual' | 'trimestral' | 'anual', paymentMethod: 'coins' | 'mxn'): Promise<any> {
        const selectedPlan = this.plans.find(p => p.tipo === plan);
        if (!selectedPlan) throw new Error('Plan no válido');

        let endDate = new Date();
        if (plan === 'mensual') endDate.setMonth(endDate.getMonth() + 1);
        else if (plan === 'trimestral') endDate.setMonth(endDate.getMonth() + 3);
        else endDate.setFullYear(endDate.getFullYear() + 1);

        if (paymentMethod === 'coins') {
            const user = await executeQuery('SELECT ia_coins FROM usuarios WHERE id = $1', [userId]) as any[];
            if (user[0].ia_coins < selectedPlan.precio_coins) throw new Error('Coins insuficientes');

            await executeQuery('UPDATE usuarios SET ia_coins = ia_coins - $1 WHERE id = $2',
                [selectedPlan.precio_coins, userId]);
        }

        // Activar VIP
        await executeQuery(`
            INSERT INTO vip_subscriptions (
                user_id, plan_tipo, fecha_inicio, fecha_fin, metodo_pago, activo
            ) VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, true)
            ON CONFLICT (user_id) DO UPDATE
            SET plan_tipo = $2, fecha_fin = $3, activo = true
        `, [userId, plan, endDate, paymentMethod]);

        return { success: true, vip_until: endDate };
    }

    async checkVIPStatus(userId: number): Promise<any> {
        const result = await executeQuery(`
            SELECT * FROM vip_subscriptions
            WHERE user_id = $1 AND activo = true AND fecha_fin > CURRENT_TIMESTAMP
        `, [userId]) as any[];

        return result.length > 0 ? result[0] : null;
    }
}

// ============================================
// REPORTES Y ECONOMÍA
// ============================================

class EconomyService {
    async getEconomyStats(): Promise<any> {
        const [circulation, transactions, topEarners, topSpenders] = await Promise.all([
            executeQuery('SELECT SUM(ia_coins) as total FROM usuarios', []),
            executeQuery(`
                SELECT 
                    tipo,
                    COUNT(*) as cantidad,
                    SUM(cantidad) as total_coins
                FROM ia_coins_transactions
                GROUP BY tipo
            `, []),
            executeQuery(`
                SELECT 
                    u.id,
                    u.nombre,
                    u.ia_coins,
                    (SELECT SUM(cantidad) FROM ia_coins_transactions WHERE user_id = u.id AND tipo = 'compra') as total_comprado
                FROM usuarios u
                ORDER BY u.ia_coins DESC
                LIMIT 10
            `, []),
            executeQuery(`
                SELECT 
                    u.id,
                    u.nombre,
                    SUM(t.cantidad) as total_gastado
                FROM usuarios u
                JOIN ia_coins_transactions t ON u.id = t.user_id
                WHERE t.tipo = 'gasto'
                GROUP BY u.id, u.nombre
                ORDER BY total_gastado DESC
                LIMIT 10
            `, [])
        ]);

        return {
            coins_en_circulacion: (circulation as any[])[0]?.total || 0,
            transacciones_por_tipo: transactions,
            top_holders: topEarners,
            top_spenders: topSpenders
        };
    }

    async getUserEconomyReport(userId: number): Promise<any> {
        const [balance, transactions, inventory, vip] = await Promise.all([
            executeQuery('SELECT ia_coins FROM usuarios WHERE id = $1', [userId]),
            executeQuery(`
                SELECT * FROM ia_coins_transactions
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT 50
            `, [userId]),
            executeQuery('SELECT COUNT(*) as total FROM user_inventory WHERE user_id = $1', [userId]),
            executeQuery('SELECT * FROM vip_subscriptions WHERE user_id = $1 AND activo = true', [userId])
        ]);

        return {
            balance: (balance as any[])[0]?.ia_coins || 0,
            historial: transactions,
            items_total: (inventory as any[])[0]?.total || 0,
            es_vip: (vip as any[]).length > 0,
            vip_info: (vip as any[])[0] || null
        };
    }
}

// Export instances
export const storeService = new StoreService();
export const prizesService = new PrizesService();
export const auctionsService = new AuctionsService();
export const vipService = new VIPService();
export const economyService = new EconomyService();
