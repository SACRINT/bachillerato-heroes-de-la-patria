
// Mock the module FIRST
const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockConnect = jest.fn(() => ({
    query: mockQuery,
    release: mockRelease
}));

jest.mock('../../config/database', () => ({
    pool: {
        query: mockQuery,
        connect: mockConnect,
        // Add fake properties that might be accessed
        options: { ssl: false }
    },
    query: mockQuery
}));

// Now require the DAO
const gradesDaoModule = require('../../data/grades.dao');
const GradesDAO = gradesDaoModule.default || gradesDaoModule;

// Get the mocked pool for assertions
const { pool } = require('../../config/database');

describe('GradesDAO', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('exists', () => {
        it('should return a grade row if it exists (numeric period)', async () => {
            const mockRow = { id: 1, estudiante_id: 1, materia_id: 101, periodo_academico: '1' };
            mockQuery.mockResolvedValueOnce({ rows: [mockRow] });

            const result = await GradesDAO.exists(1, 101, 1);

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM calificaciones'),
                expect.arrayContaining([1, 101, '1'])
            );
            expect(result).toEqual(mockRow);
        });

        it('should return a grade row if it exists (string period)', async () => {
            const mockRow = { id: 1, estudiante_id: 1, materia_id: 101, periodo_academico: 'Parcial 1' };
            mockQuery.mockResolvedValueOnce({ rows: [mockRow] });

            const result = await GradesDAO.exists(1, 101, 'Parcial 1');

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('periodo_academico = $3'),
                expect.arrayContaining([1, 101, 'Parcial 1'])
            );
            expect(result).toEqual(mockRow);
        });

        it('should return null if not found', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });

            const result = await GradesDAO.exists(1, 101, 'Parcial 1');

            expect(result).toBeNull();
        });
    });
});
