/**
 * 🌱 SEEDER SEGURO DE WEBHOOKS INSTITUCIONALES
 * backend/seeds/seed-webhooks.js
 * 
 * Siembra o rota los webhooks oficiales para sincronización con sistemas
 * escolares (SIGPAD-EMS y SISAT-ATP) sin versionar secretos en texto plano.
 * Los secretos se toman de variables de entorno (SIGPAD_WEBHOOK_SECRET, SISAT_WEBHOOK_SECRET)
 * o se generan criptográficamente en tiempo de ejecución con crypto.randomBytes(32).
 */

const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { pool } = require('../config/database');

async function seedWebhooks() {
    console.log('🚀 Iniciando sembrado seguro de webhooks escolares...');

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const defaultTenantId = 1;

            // 1. Configuración de suscripciones oficiales
            const seedSubscriptions = [
                {
                    tenant_id: defaultTenantId,
                    url: 'https://sigpad.sep.gob.mx/api/v1/integrations/bge-sync',
                    events: [
                        'student.review.completed',
                        'student.deck.completed',
                        'student.streak.achieved',
                        'tutor.session.completed',
                        'alert.low.retention'
                    ],
                    secret: process.env.SIGPAD_WEBHOOK_SECRET || `whsec_${crypto.randomBytes(32).toString('hex')}`
                },
                {
                    tenant_id: defaultTenantId,
                    url: 'https://sisat-atp.puebla.gob.mx/webhooks/academic-alerts',
                    events: [
                        'alert.low.retention',
                        'student.streak.achieved',
                        'teacher.deck.created'
                    ],
                    secret: process.env.SISAT_WEBHOOK_SECRET || `whsec_${crypto.randomBytes(32).toString('hex')}`
                }
            ];

            for (const sub of seedSubscriptions) {
                // Verificar si ya existe por URL y tenant_id
                const existingRes = await client.query(
                    'SELECT id FROM webhook_subscriptions WHERE tenant_id = $1 AND url = $2',
                    [sub.tenant_id, sub.url]
                );

                if (existingRes.rows.length > 0) {
                    const subId = existingRes.rows[0].id;
                    // Rotar secreto e igualar eventos
                    await client.query(
                        `UPDATE webhook_subscriptions 
                         SET events = $1, secret = $2, active = true, updated_at = NOW() 
                         WHERE id = $3`,
                        [sub.events, sub.secret, subId]
                    );
                    console.log(`🔄 Webhook actualizado y rotado (ID: ${subId}, URL: ${sub.url})`);
                } else {
                    const insertRes = await client.query(
                        `INSERT INTO webhook_subscriptions (tenant_id, url, events, secret, active)
                         VALUES ($1, $2, $3, $4, true)
                         RETURNING id`,
                        [sub.tenant_id, sub.url, sub.events, sub.secret]
                    );
                    console.log(`✅ Webhook insertado (ID: ${insertRes.rows[0].id}, URL: ${sub.url})`);
                }
            }

            // 2. Sembrar un registro histórico de demostración si la bitácora está vacía
            const logsCountRes = await client.query('SELECT COUNT(*) FROM webhook_delivery_log');
            const logsCount = parseInt(logsCountRes.rows[0].count);

            if (logsCount === 0) {
                const firstSub = await client.query(
                    'SELECT id FROM webhook_subscriptions WHERE url LIKE $1 LIMIT 1',
                    ['%sigpad%']
                );

                if (firstSub.rows.length > 0) {
                    const samplePayload = {
                        event: 'student.streak.achieved',
                        tenant_id: defaultTenantId,
                        timestamp: new Date().toISOString(),
                        data: { student_id: '101', streak_days: 7, date: new Date().toISOString().split('T')[0] }
                    };

                    await client.query(
                        `INSERT INTO webhook_delivery_log 
                         (webhook_id, event, payload, status, response_code, response_body, attempts, delivered_at)
                         VALUES ($1, $2, $3, 'delivered', 200, $4, 1, NOW())`,
                        [
                            firstSub.rows[0].id,
                            samplePayload.event,
                            JSON.stringify(samplePayload),
                            JSON.stringify({ success: true, message: 'Sync handshake OK' })
                        ]
                    );
                    console.log('📜 Bitácora inicial de prueba sembrada correctamente.');
                }
            }

            await client.query('COMMIT');
            console.log('🎉 Sembrado y rotación de webhooks completado con éxito.');

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('❌ Error durante el sembrado de webhooks:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Ejecución directa
if (require.main === module) {
    seedWebhooks();
}

module.exports = { seedWebhooks };
