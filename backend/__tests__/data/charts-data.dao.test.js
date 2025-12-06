const ChartsDataDAO = require('../../data/charts-data.dao');
const { pool } = require('../../config/database');

// Mock pool
jest.mock('../../config/database', () => {
    const mPool = {
        query: jest.fn(),
        connect: jest.fn(),
        on: jest.fn(),
        end: jest.fn()
    };
    return { pool: mPool };
});

describe('ChartsDataDAO', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getSuscriptoresCrecimiento', () => {
        it('debería ejecutar query con fecha_registro en lugar de fecha_suscripcion', async () => {
            // Mock response
            pool.query.mockResolvedValueOnce({ rows: [] });

            await ChartsDataDAO.getSuscriptoresCrecimiento();

            // Verify query
            const call = pool.query.mock.calls[0][0];

            // Check if query uses the correct column name
            // If the code is buggy, it will use 'fecha_suscripcion'
            // If fixed, it should use 'fecha_registro'

            // We expect the CURRENT buggy code to use 'fecha_suscripcion'
            // So this test confirms the bug if it sees 'fecha_suscripcion'
            // But usually we write tests that FAIL when the bug is present (expecting the correct behavior)

            // So we expect the query to contain 'fecha_registro'
            expect(call).toContain('fecha_registro');
            expect(call).not.toContain('fecha_suscripcion');
        });
    });
});
