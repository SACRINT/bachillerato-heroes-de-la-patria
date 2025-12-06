const StudentDAO = require('../../data/student.dao');
const { pool } = require('../../config/database');

// Mock dependencies
jest.mock('../../config/database', () => ({
    pool: {
        query: jest.fn()
    }
}));

describe('StudentDAO', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('get', () => {
        it('should return student when found', async () => {
            const mockStudent = { id: 1, nombre: 'Juan', apellido_paterno: 'Perez' };
            pool.query.mockResolvedValue({ rows: [mockStudent] });

            const result = await StudentDAO.get(1);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT'),
                [1]
            );
            expect(result).toEqual(mockStudent);
        });

        it('should return null when not found', async () => {
            pool.query.mockResolvedValue({ rows: [] });

            const result = await StudentDAO.get(999);

            expect(result).toBeNull();
        });
    });

    describe('list', () => {
        it('should return list of students without filters', async () => {
            const mockStudents = [{ id: 1, nombre: 'Juan' }, { id: 2, nombre: 'Maria' }];
            pool.query.mockResolvedValue({ rows: mockStudents });

            const result = await StudentDAO.list();

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT'),
                [20, 0] // Default limit and offset
            );
            expect(result).toEqual(mockStudents);
        });

        it('should apply filters correctly', async () => {
            pool.query.mockResolvedValue({ rows: [] });

            const filters = {
                grado: '1',
                grupo: 'A',
                turno: 'matutino',
                status: 'activo',
                search: 'Juan'
            };

            await StudentDAO.list(filters);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('AND grado = $1'),
                expect.arrayContaining(['1', 'A', 'matutino', 'activo', '%Juan%', 20, 0])
            );
        });

        it('should handle pagination', async () => {
            pool.query.mockResolvedValue({ rows: [] });

            await StudentDAO.list({}, 10, 20);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('LIMIT $1 OFFSET $2'),
                expect.arrayContaining([10, 20])
            );
        });
    });
});
