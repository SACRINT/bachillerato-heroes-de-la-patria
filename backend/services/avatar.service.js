const { pool } = require('../config/database.js');
const devLogger = require('../utils/devLogger.js');

const DEMO_CATALOG = [
    { id: 1, name: 'Estudiante Explorador', item_type: 'avatar_base', price_coins: 0, image_url: '/assets/avatars/default.webp', is_active: true, owned: true, is_equipped: true },
    { id: 2, name: 'Científico Loco', item_type: 'avatar_base', price_coins: 150, image_url: '/assets/avatars/scientist.webp', is_active: true, owned: false, is_equipped: false },
    { id: 3, name: 'Cibernauta', item_type: 'avatar_base', price_coins: 200, image_url: '/assets/avatars/cyber.webp', is_active: true, owned: false, is_equipped: false },
    { id: 4, name: 'Marco de Oro', item_type: 'frame', price_coins: 100, image_url: '/assets/avatars/frame-gold.webp', is_active: true, owned: false, is_equipped: false },
    { id: 5, name: 'Marco Neón', item_type: 'frame', price_coins: 120, image_url: '/assets/avatars/frame-neon.webp', is_active: true, owned: false, is_equipped: false },
    { id: 6, name: 'Fondo Galaxia', item_type: 'background', price_coins: 80, image_url: '/assets/avatars/bg-galaxy.webp', is_active: true, owned: false, is_equipped: false },
    { id: 7, name: 'Fondo Laboratorio', item_type: 'background', price_coins: 90, image_url: '/assets/avatars/bg-lab.webp', is_active: true, owned: false, is_equipped: false },
    { id: 8, name: 'Gafas VR', item_type: 'accessory', price_coins: 75, image_url: '/assets/avatars/acc-vr.webp', is_active: true, owned: false, is_equipped: false },
    { id: 9, name: 'Birrete de Graduación', item_type: 'accessory', price_coins: 110, image_url: '/assets/avatars/acc-cap.webp', is_active: true, owned: false, is_equipped: false }
];

class AvatarService {

    /**
     * Obtiene el catálogo de items disponibles para el usuario.
     * Marca cuáles ya tiene comprados.
     */
    async getCatalog(userId) {
        try {
            const query = `
                SELECT 
                    ai.*,
                    CASE WHEN uai.id IS NOT NULL THEN true ELSE false END as owned,
                    uai.is_equipped
                FROM avatar_items ai
                LEFT JOIN user_avatar_inventory uai ON ai.id = uai.item_id AND uai.user_id = $1
                WHERE ai.is_active = true
                ORDER BY ai.item_type, ai.price_coins ASC
            `;
            const res = await pool.query(query, [userId]);
            if (res.rows && res.rows.length > 0) return res.rows;
            return DEMO_CATALOG;
        } catch (e) {
            devLogger.warn('[AVATAR-SERVICE] Tabla avatar_items no disponible, usando catálogo demo');
            return DEMO_CATALOG;
        }
    }

    /**
     * Obtiene la configuración actual del avatar del usuario.
     */
    async getUserAvatar(userId) {
        try {
            let query = `
                SELECT 
                    uac.*,
                    base.image_url as base_url,
                    frame.image_url as frame_url,
                    bg.image_url as bg_url,
                    acc.image_url as acc_url
                FROM user_avatar_config uac
                LEFT JOIN avatar_items base ON uac.current_base_id = base.id
                LEFT JOIN avatar_items frame ON uac.current_frame_id = frame.id
                LEFT JOIN avatar_items bg ON uac.current_background_id = bg.id
                LEFT JOIN avatar_items acc ON uac.current_accessory_id = acc.id
                WHERE uac.user_id = $1
            `;
            let res = await pool.query(query, [userId]);

            if (res.rows.length === 0) {
                return await this.initializeDefaultAvatar(userId);
            }

            return res.rows[0];
        } catch (e) {
            devLogger.warn('[AVATAR-SERVICE] Tabla user_avatar_config no disponible, usando avatar demo');
            return {
                user_id: userId,
                base_url: '/assets/avatars/default.webp',
                frame_url: null,
                bg_url: null,
                acc_url: null
            };
        }
    }

    async initializeDefaultAvatar(userId) {
        // Buscar items default
        const defaults = await pool.query(
            `SELECT id, item_type FROM avatar_items WHERE price_coins = 0`
        );

        const base = defaults.rows.find(i => i.item_type === 'avatar_base')?.id || null;
        const frame = defaults.rows.find(i => i.item_type === 'frame')?.id || null;
        const bg = defaults.rows.find(i => i.item_type === 'background')?.id || null;

        // Crear config
        await pool.query(
            `INSERT INTO user_avatar_config (user_id, current_base_id, current_frame_id, current_background_id)
             VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO NOTHING`,
            [userId, base, frame, bg]
        );

        // Dar items al inventario si no los tiene
        if (base) await this.grantItem(userId, base);
        if (frame) await this.grantItem(userId, frame);
        if (bg) await this.grantItem(userId, bg);

        return this.getUserAvatar(userId);
    }

    /**
     * Compra un item.
     */
    async purchaseItem(userId, itemId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Verificar Item
            const itemRes = await client.query(`SELECT * FROM avatar_items WHERE id = $1`, [itemId]);
            if (itemRes.rows.length === 0) throw new Error('Item no encontrado');
            const item = itemRes.rows[0];

            // 2. Verificar si ya lo tiene
            const check = await client.query(
                `SELECT 1 FROM user_avatar_inventory WHERE user_id = $1 AND item_id = $2`,
                [userId, itemId]
            );
            if (check.rows.length > 0) throw new Error('Ya tienes este item');

            // 3. Verificar Fondos
            const walletRes = await client.query(`SELECT balance FROM wallet WHERE user_id = $1 FOR UPDATE`, [userId]);
            if (walletRes.rows.length === 0) throw new Error('Wallet error'); // Should not happen
            const balance = walletRes.rows[0].balance;

            if (balance < item.price_coins) throw new Error('Fondos insuficientes');

            // 4. Cobrar
            if (item.price_coins > 0) {
                await client.query(
                    `UPDATE wallet SET balance = balance - $1, total_spent = total_spent + $1 WHERE user_id = $2`,
                    [item.price_coins, userId]
                );
                await client.query(
                    `INSERT INTO wallet_history (user_id, transaction_type, amount, balance_after, description)
                     VALUES ($1, 'spend', $2, $3, $4)`,
                    [userId, item.price_coins, balance - item.price_coins, `Compra Avatar: ${item.name}`]
                );
            }

            // 5. Entregar
            await client.query(
                `INSERT INTO user_avatar_inventory (user_id, item_id) VALUES ($1, $2)`,
                [userId, itemId]
            );

            await client.query('COMMIT');
            return { success: true, item, newBalance: balance - item.price_coins };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async grantItem(userId, itemId) {
        await pool.query(
            `INSERT INTO user_avatar_inventory (user_id, item_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [userId, itemId]
        );
    }

    /**
     * Equipa un item.
     */
    async equipItem(userId, itemId) {
        // Verificar propiedad
        const check = await pool.query(
            `SELECT uai.*, ai.item_type 
             FROM user_avatar_inventory uai
             JOIN avatar_items ai ON uai.item_id = ai.id
             WHERE uai.user_id = $1 AND uai.item_id = $2`,
            [userId, itemId]
        );

        if (check.rows.length === 0) throw new Error('No posees este item');
        const itemType = check.rows[0].item_type;

        // Actualizar config
        // Mapeo item_type -> columna
        const colMap = {
            'avatar_base': 'current_base_id',
            'frame': 'current_frame_id',
            'background': 'current_background_id',
            'accessory': 'current_accessory_id'
        };

        const col = colMap[itemType];
        if (!col) throw new Error('Tipo de item no equipable');

        // Upsert config
        await pool.query(
            `INSERT INTO user_avatar_config (user_id, ${col}, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (user_id) DO UPDATE SET ${col} = $2, updated_at = NOW()`,
            [userId, itemId]
        );

        return { success: true, equipped: itemId, type: itemType };
    }
}

module.exports = new AvatarService();
