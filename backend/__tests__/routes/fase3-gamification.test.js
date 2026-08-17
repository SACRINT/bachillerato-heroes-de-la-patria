/**
 * 🧪 Tests para Endpoints de FASE 3: Gamificación e IA Gemini Flash
 * Bachillerato General Estatal "Héroes de la Patria"
 */

const request = require('supertest');
const express = require('express');

// Mock database access
jest.mock('../../data/database-access', () => ({
    executeQuery: jest.fn(),
    getPool: () => ({
        connect: jest.fn().mockResolvedValue({
            query: jest.fn().mockResolvedValue({ rows: [{ balance: 500 }] }),
            release: jest.fn()
        }),
        query: jest.fn().mockResolvedValue({ rows: [{ balance: 500 }] })
    })
}));

// Mock auth middleware
jest.mock('../../middleware/auth', () => ({
    authenticateToken: (req, res, next) => {
        req.user = { id: 1, email: 'estudiante@bge.edu.mx', role: 'estudiante' };
        next();
    }
}));

const { executeQuery, getPool } = require('../../data/database-access');
const gamificationFase3Routes = require('../../routes/gamification-fase3');
const iaGeminiRoutes = require('../../routes/ia-gemini');

// Setup test app
const app = express();
app.use(express.json());
app.use('/api/gamification', gamificationFase3Routes);
app.use('/api/ia', iaGeminiRoutes);

describe('🎮 FASE 3: Gamificación Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/gamification/streak/check-in', () => {
        it('debería registrar o actualizar racha diaria', async () => {
            const res = await request(app)
                .post('/api/gamification/streak/check-in')
                .send({ streak_type: 'daily_login' })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('current_streak');
            expect(res.body.data).toHaveProperty('league');
        });
    });

    describe('GET /api/gamification/league/:userId', () => {
        it('debería retornar información de la liga del usuario', async () => {
            const res = await request(app)
                .get('/api/gamification/league/1')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('current_league');
            expect(res.body.data.current_league).toHaveProperty('name');
        });
    });

    describe('GET /api/gamification/leaderboard-real', () => {
        it('debería retornar leaderboard', async () => {
            const res = await request(app)
                .get('/api/gamification/leaderboard-real?limit=5')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('leaderboard');
        });
    });

    describe('GET /api/gamification/xp/profile/:userId', () => {
        it('debería retornar perfil de nivel y XP', async () => {
            const res = await request(app)
                .get('/api/gamification/xp/profile/1')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('level');
            expect(res.body.data).toHaveProperty('league');
            expect(res.body.data).toHaveProperty('progress');
        });
    });
});

describe('🤖 FASE 3: IA Gemini + Deducción IACoins Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/ia/costs', () => {
        it('debería retornar tabla de costos vigentes sin requerir autenticación', async () => {
            const res = await request(app)
                .get('/api/ia/costs')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.costs).toHaveProperty('ai_short');
            expect(res.body.costs).toHaveProperty('ai_exam');
            expect(res.body.costs.ai_short).toBeGreaterThan(0);
        });
    });

    describe('GET /api/ia/health', () => {
        it('debería retornar el estado de la integración con Gemini', async () => {
            const res = await request(app)
                .get('/api/ia/health')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body).toHaveProperty('status');
            expect(res.body).toHaveProperty('provider', 'Google Gemini Flash');
        });
    });

    describe('POST /api/ia/generate (Deducción + Demo mode)', () => {
        it('debería rechazar si prompt no es proporcionado', async () => {
            const res = await request(app)
                .post('/api/ia/generate')
                .send({})
                .expect(400);

            expect(res.body.success).toBe(false);
        });

        it('debería procesar generación corta en modo demo cuando no hay key y deducir coins', async () => {
            const res = await request(app)
                .post('/api/ia/generate')
                .send({
                    prompt: 'Explica el ciclo de Krebs de manera sencilla',
                    type: 'short'
                })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('text');
            expect(res.body.data).toHaveProperty('coins_spent');
        });
    });

    describe('POST /api/ia/generate-hint', () => {
        it('debería generar una pista para un reto', async () => {
            const res = await request(app)
                .post('/api/ia/generate-hint')
                .send({
                    challenge_id: 1,
                    challenge_title: 'Derivadas trigonométricas',
                    user_progress: 'Paso 1 completado'
                })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('hint');
            expect(res.body.data).toHaveProperty('coins_spent');
        });
    });
});
