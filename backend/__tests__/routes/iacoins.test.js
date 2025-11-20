/**
 * 🧪 Tests para IACoins API
 * SEMANA 1 - Tarea 1.2: Testing Suite
 */

const request = require('supertest');

// Mock de la base de datos
jest.mock('../../data/database-access', () => ({
    executeQuery: jest.fn(),
    getPool: jest.fn()
}));

// Mock del middleware de autenticación
jest.mock('../../middleware/auth', () => ({
    authenticateToken: (req, res, next) => {
        req.user = { id: 1, email: 'test@bge.edu.mx', role: 'estudiante' };
        next();
    }
}));

const { executeQuery } = require('../../data/database-access');

// Importar el router después de los mocks
const express = require('express');
const iacoinsRoutes = require('../../routes/iacoins');

// Crear app de prueba
const app = express();
app.use(express.json());
app.use('/api/iacoins', iacoinsRoutes);

describe('IACoins API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =====================================
    // GET /api/iacoins/balance
    // =====================================
    describe('GET /balance', () => {
        it('debería retornar balance existente del usuario', async () => {
            const mockBalance = {
                id: 1,
                user_id: 1,
                balance: 500,
                total_earned: 1000,
                total_spent: 500,
                level: 5,
                experience_points: 2500
            };

            executeQuery.mockResolvedValueOnce([mockBalance]);

            const res = await request(app)
                .get('/api/iacoins/balance')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.balance).toBe(500);
            expect(res.body.data.level).toBe(5);
        });

        it('debería crear balance inicial para usuario nuevo', async () => {
            const mockNewBalance = {
                id: 1,
                user_id: 1,
                balance: 100,
                total_earned: 100,
                total_spent: 0,
                level: 1,
                experience_points: 0
            };

            executeQuery
                .mockResolvedValueOnce([]) // No existe balance
                .mockResolvedValueOnce([mockNewBalance]); // Crear nuevo

            const res = await request(app)
                .get('/api/iacoins/balance')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.balance).toBe(100);
        });

        it('debería manejar errores de base de datos', async () => {
            executeQuery.mockRejectedValueOnce(new Error('Database error'));

            const res = await request(app)
                .get('/api/iacoins/balance')
                .expect(500);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Error');
        });
    });

    // =====================================
    // GET /api/iacoins/transactions
    // =====================================
    describe('GET /transactions', () => {
        it('debería retornar historial de transacciones', async () => {
            const mockTransactions = [
                { id: 1, type: 'earn', amount: 50, description: 'Reto completado' },
                { id: 2, type: 'spend', amount: 10, description: 'Generación IA' }
            ];
            const mockCount = [{ total: '2' }];

            executeQuery
                .mockResolvedValueOnce(mockTransactions)
                .mockResolvedValueOnce(mockCount);

            const res = await request(app)
                .get('/api/iacoins/transactions')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(2);
            expect(res.body.pagination.total).toBe(2);
        });

        it('debería filtrar por tipo de transacción', async () => {
            executeQuery
                .mockResolvedValueOnce([{ id: 1, type: 'earn', amount: 50 }])
                .mockResolvedValueOnce([{ total: '1' }]);

            const res = await request(app)
                .get('/api/iacoins/transactions?type=earn')
                .expect(200);

            expect(res.body.success).toBe(true);
        });

        it('debería validar parámetros de paginación', async () => {
            const res = await request(app)
                .get('/api/iacoins/transactions?limit=invalid')
                .expect(400);

            expect(res.body.success).toBe(false);
        });
    });

    // =====================================
    // POST /api/iacoins/earn
    // =====================================
    describe('POST /earn', () => {
        it('debería agregar IACoins al balance', async () => {
            const mockCurrentBalance = [{ balance: 100 }];
            const mockTransaction = [{
                id: 1,
                user_id: 1,
                type: 'earn',
                amount: 50,
                balance_before: 100,
                balance_after: 150
            }];

            executeQuery
                .mockResolvedValueOnce(mockCurrentBalance) // Get current
                .mockResolvedValueOnce([]) // Update balance
                .mockResolvedValueOnce(mockTransaction); // Create transaction

            const res = await request(app)
                .post('/api/iacoins/earn')
                .send({
                    amount: 50,
                    description: 'Reto completado: Quiz de matemáticas'
                })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.newBalance).toBe(150);
        });

        it('debería validar cantidad mínima', async () => {
            const res = await request(app)
                .post('/api/iacoins/earn')
                .send({
                    amount: 0,
                    description: 'Test'
                })
                .expect(400);

            expect(res.body.success).toBe(false);
        });

        it('debería validar descripción requerida', async () => {
            const res = await request(app)
                .post('/api/iacoins/earn')
                .send({
                    amount: 50,
                    description: 'abc' // Menos de 5 caracteres
                })
                .expect(400);

            expect(res.body.success).toBe(false);
        });
    });

    // =====================================
    // POST /api/iacoins/spend
    // =====================================
    describe('POST /spend', () => {
        it('debería gastar IACoins correctamente', async () => {
            const mockBalance = [{ balance: 100 }];
            const mockTransaction = [{
                id: 1,
                type: 'spend',
                amount: 20,
                balance_before: 100,
                balance_after: 80
            }];

            executeQuery
                .mockResolvedValueOnce(mockBalance) // Get current
                .mockResolvedValueOnce([]) // Update balance
                .mockResolvedValueOnce(mockTransaction); // Create transaction

            const res = await request(app)
                .post('/api/iacoins/spend')
                .send({
                    amount: 20,
                    description: 'Generación de texto con GPT-4',
                    ai_provider: 'openai',
                    ai_model: 'gpt-4'
                })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.newBalance).toBe(80);
        });

        it('debería rechazar si saldo insuficiente', async () => {
            const mockBalance = [{ balance: 10 }];

            executeQuery.mockResolvedValueOnce(mockBalance);

            const res = await request(app)
                .post('/api/iacoins/spend')
                .send({
                    amount: 50,
                    description: 'Generación de imagen'
                })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('insuficiente');
            expect(res.body.currentBalance).toBe(10);
        });

        it('debería validar proveedor de IA', async () => {
            const res = await request(app)
                .post('/api/iacoins/spend')
                .send({
                    amount: 20,
                    description: 'Test generación',
                    ai_provider: 'invalid_provider'
                })
                .expect(400);

            expect(res.body.success).toBe(false);
        });
    });

    // =====================================
    // GET /api/iacoins/challenges
    // =====================================
    describe('GET /challenges', () => {
        it('debería retornar lista de retos disponibles', async () => {
            const mockChallenges = [
                {
                    id: 1,
                    title: 'Quiz Diario',
                    description: 'Completa el quiz de hoy',
                    reward_coins: 10,
                    difficulty: 'easy',
                    user_status: null
                },
                {
                    id: 2,
                    title: 'Participar en Foro',
                    description: 'Responde una pregunta',
                    reward_coins: 20,
                    difficulty: 'medium',
                    user_status: 'claimed'
                }
            ];

            executeQuery.mockResolvedValueOnce(mockChallenges);

            const res = await request(app)
                .get('/api/iacoins/challenges')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(2);
        });

        it('debería filtrar por categoría', async () => {
            executeQuery.mockResolvedValueOnce([]);

            const res = await request(app)
                .get('/api/iacoins/challenges?category=academic')
                .expect(200);

            expect(res.body.success).toBe(true);
        });

        it('debería filtrar por dificultad', async () => {
            executeQuery.mockResolvedValueOnce([]);

            const res = await request(app)
                .get('/api/iacoins/challenges?difficulty=hard')
                .expect(200);

            expect(res.body.success).toBe(true);
        });
    });

    // =====================================
    // POST /api/iacoins/challenges/:id/complete
    // =====================================
    describe('POST /challenges/:id/complete', () => {
        it('debería completar un reto y dar recompensa', async () => {
            const mockChallenge = [{
                id: 1,
                title: 'Quiz Diario',
                reward_coins: 50,
                reward_xp: 100,
                is_repeatable: false,
                max_completions: 1
            }];
            const mockProgress = [];
            const mockBalance = [{ balance: 100 }];

            executeQuery
                .mockResolvedValueOnce(mockChallenge) // Get challenge
                .mockResolvedValueOnce(mockProgress) // Get progress
                .mockResolvedValueOnce([]) // Update progress
                .mockResolvedValueOnce(mockBalance) // Get balance
                .mockResolvedValueOnce([]) // Update balance
                .mockResolvedValueOnce([]); // Create transaction

            const res = await request(app)
                .post('/api/iacoins/challenges/1/complete')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.coinsEarned).toBe(50);
            expect(res.body.data.newBalance).toBe(150);
        });

        it('debería rechazar reto ya completado (no repetible)', async () => {
            const mockChallenge = [{
                id: 1,
                is_repeatable: false
            }];
            const mockProgress = [{
                status: 'claimed',
                completion_count: 1
            }];

            executeQuery
                .mockResolvedValueOnce(mockChallenge)
                .mockResolvedValueOnce(mockProgress);

            const res = await request(app)
                .post('/api/iacoins/challenges/1/complete')
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('ya fue completado');
        });

        it('debería rechazar si alcanzó límite de completaciones', async () => {
            const mockChallenge = [{
                id: 1,
                max_completions: 3,
                is_repeatable: true
            }];
            const mockProgress = [{
                completion_count: 3
            }];

            executeQuery
                .mockResolvedValueOnce(mockChallenge)
                .mockResolvedValueOnce(mockProgress);

            const res = await request(app)
                .post('/api/iacoins/challenges/1/complete')
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('límite');
        });

        it('debería retornar 404 si reto no existe', async () => {
            executeQuery.mockResolvedValueOnce([]);

            const res = await request(app)
                .post('/api/iacoins/challenges/999/complete')
                .expect(404);

            expect(res.body.success).toBe(false);
        });
    });

    // =====================================
    // GET /api/iacoins/leaderboard
    // =====================================
    describe('GET /leaderboard', () => {
        it('debería retornar tabla de posiciones', async () => {
            const mockLeaderboard = [
                { user_id: 1, nombre: 'Juan', apellido_paterno: 'Pérez', total_earned: 1000, level: 10 },
                { user_id: 2, nombre: 'María', apellido_paterno: 'López', total_earned: 800, level: 8 }
            ];

            executeQuery.mockResolvedValueOnce(mockLeaderboard);

            const res = await request(app)
                .get('/api/iacoins/leaderboard')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(2);
            expect(res.body.data[0].rank).toBe(1);
        });

        it('debería respetar límite de resultados', async () => {
            executeQuery.mockResolvedValueOnce([]);

            const res = await request(app)
                .get('/api/iacoins/leaderboard?limit=5')
                .expect(200);

            expect(res.body.success).toBe(true);
        });
    });

    // =====================================
    // GET /api/iacoins/pricing
    // =====================================
    describe('GET /pricing', () => {
        it('debería retornar precios de generaciones IA', async () => {
            const mockPricing = [
                { ai_provider: 'openai', generation_type: 'text', coin_cost: 10 },
                { ai_provider: 'anthropic', generation_type: 'text', coin_cost: 15 }
            ];

            executeQuery.mockResolvedValueOnce(mockPricing);

            const res = await request(app)
                .get('/api/iacoins/pricing')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(2);
        });
    });

    // =====================================
    // GET /api/iacoins/achievements
    // =====================================
    describe('GET /achievements', () => {
        it('debería retornar logros del usuario', async () => {
            const mockAchievements = [
                { id: 1, name: 'Primer Login', unlocked: true },
                { id: 2, name: 'Maestro Quiz', unlocked: false }
            ];

            executeQuery.mockResolvedValueOnce(mockAchievements);

            const res = await request(app)
                .get('/api/iacoins/achievements')
                .expect(200);

            expect(res.body.success).toBe(true);
        });
    });
});
