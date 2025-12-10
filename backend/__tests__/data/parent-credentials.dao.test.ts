
import ParentCredentialsDAO from '../../data/parent-credentials.dao';
import { executeQuery } from '../../config/database'; // We will mock this

// Mocks
jest.mock('../../config/database', () => ({
    executeQuery: jest.fn()
}));

jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('hashed_password'),
    compare: jest.fn().mockResolvedValue(true)
}));

// Access mock for assertions
const mockExecuteQuery = executeQuery as jest.Mock;

describe('ParentCredentialsDAO', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generateBatch', () => {
        it('debe generar credenciales para estudiantes dados', async () => {
            // Mock responses for the sequential queries in generateBatch
            mockExecuteQuery
                .mockResolvedValueOnce([]) // initTable
                .mockResolvedValueOnce([]) // check existing (none)
                .mockResolvedValueOnce([{ matricula: '2023001' }]) // get student details
                .mockResolvedValueOnce([]); // insert

            const result = await ParentCredentialsDAO.generateBatch([1]);

            expect(result).toHaveLength(1);
            expect(result[0].username).toBe('P-2023001');
            expect(result[0].temp_pass).toBeDefined();
            expect(mockExecuteQuery).toHaveBeenCalledTimes(4);
        });
    });

    describe('verifyCredential', () => {
        it('debe retornar credencial si password coincide', async () => {
            mockExecuteQuery.mockResolvedValueOnce([
                { id: 1, username: 'P-123', password_hash: 'hashed_password', status: 'active', student_id: 99 }
            ]);

            const cred = await ParentCredentialsDAO.verifyCredential('P-123', 'anyResultBecauseMocked');

            expect(cred).not.toBeNull();
            expect(cred?.id).toBe(1);
        });
    });
});
