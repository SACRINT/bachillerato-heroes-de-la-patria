
// Mockear pg para controlar la DB
const mQuery = jest.fn();
const mClient = { query: mQuery, release: jest.fn() };
const mPool = {
    query: mQuery,
    connect: jest.fn().mockResolvedValue(mClient),
    on: jest.fn()
};

// Mockear pg ANTES de importar dependencias
jest.mock('pg', () => {
    return { Pool: jest.fn(() => mPool) };
});

const AvisosDAO = require('../../data/avisos.dao');

describe('AvisosDAO', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getStats', () => {
        it('debería retornar stats correctas cuando la query es exitosa', async () => {
            const mockRow = {
                total: 10,
                publicadas: 5,
                borradores: 5,
                destacadas: 2,
                vistas_totales: 100
            };
            mQuery.mockResolvedValueOnce({ rows: [mockRow] });

            // Detectar si es export default o module.exports
            const DAO = AvisosDAO.default || AvisosDAO;
            const stats = await DAO.getStats();

            expect(stats).toEqual(mockRow);
            expect(mQuery).toHaveBeenCalled();
        });

        it('debería retornar ceros cuando la DB falla (Catch block)', async () => {
            // Hacemos que la query falle
            mQuery.mockRejectedValueOnce(new Error('DB Connection Failed'));

            const DAO = AvisosDAO.default || AvisosDAO;
            const stats = await DAO.getStats();

            // Debe retornar ceros, NO lanzar error
            const expectedZeros = { total: 0, publicadas: 0, borradores: 0, destacadas: 0, vistas_totales: 0 };
            expect(stats).toEqual(expectedZeros);
        });
    });
});
