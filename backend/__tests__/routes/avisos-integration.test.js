const request = require('supertest');
const express = require('express');

// Mockear pg para controlar la DB y forzar errores
const mQuery = jest.fn();
const mClient = { query: mQuery, release: jest.fn() };
const mPool = {
    query: mQuery,
    connect: jest.fn().mockResolvedValue(mClient),
    on: jest.fn()
};

// Mockear pg ANTES de importar cualquier cosa
jest.mock('pg', () => {
    return { Pool: jest.fn(() => mPool) };
});

const avisosRoutesRaw = require('../../routes/avisos');
const avisosRoutes = avisosRoutesRaw.default || avisosRoutesRaw;

const app = express();
app.use(express.json());
app.use('/api/avisos', avisosRoutes);

describe('Integration: GET /api/avisos/stats', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('debería manejar error de DB retornando ceros (Logica de DAO)', async () => {
        // Hacemos que la query falle.
        // Como AvisosDAO.getStats tiene un try/catch que devuelve ceros,
        // la ruta debería recibir ceros y devolver 200 OK.
        mQuery.mockRejectedValueOnce(new Error('DB Connection Failed'));

        const res = await request(app).get('/api/avisos/stats');

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual({
            total: 0,
            publicadas: 0,
            borradores: 0,
            destacadas: 0,
            vistas_totales: 0
        });
    });

    it('debería retornar datos reales si la DB responde bien', async () => {
        const mockRow = {
            total: 99,
            publicadas: 99,
            borradores: 0,
            destacadas: 0,
            vistas_totales: 999
        };
        mQuery.mockResolvedValueOnce({ rows: [mockRow] });

        const res = await request(app).get('/api/avisos/stats');

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual(mockRow);
    });
});
