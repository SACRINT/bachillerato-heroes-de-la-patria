const request = require('supertest');
const express = require('express');

// Mockear el DAO *antes* de cargar la ruta para controlar el comportamiento
jest.mock('../../data/avisos.dao', () => {
    return {
        getStats: jest.fn(),
        getAll: jest.fn(),
        create: jest.fn(),
        getById: jest.fn(),
        update: jest.fn(),
        incrementViews: jest.fn(),
        slugExists: jest.fn()
    };
});

const AvisosDAO = require('../../data/avisos.dao');
const avisosRoutesRaw = require('../../routes/avisos');

// Manejar default export de TS
const avisosRoutes = avisosRoutesRaw.default || avisosRoutesRaw;

const app = express();
app.use(express.json());
app.use('/api/avisos', avisosRoutes);

describe('GET /api/avisos/stats', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('debería retornar 200 y stats cuando DAO responde correctamente', async () => {
        const mockStats = {
            total: 10,
            publicadas: 5,
            borradores: 5,
            destacadas: 2,
            vistas_totales: 100
        };
        AvisosDAO.getStats.mockResolvedValue(mockStats);

        const res = await request(app).get('/api/avisos/stats');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual(mockStats);
    });

    it('debería retornar 500 si el DAO lanza un error no manejado', async () => {
        AvisosDAO.getStats.mockRejectedValue(new Error('CRITICAL DB ERROR'));

        const res = await request(app).get('/api/avisos/stats');

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
    });
});
