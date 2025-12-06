const GradesDAO = require('../../data/grades.dao');
const { pool } = require('../../config/database');

// Mock dependencies
jest.mock('../../config/database', () => {
    const mockPool = {
        query: jest.fn(),
        connect: jest.fn()
    };
    return { pool: mockPool };
});

describe('GradesDAO', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a new grade', async () => {
            const gradeData = {
                estudianteId: 1,
                materiaId: 101,
                calificacion: 9.5,
                tipoEvaluacion: 'parcial',
                periodoAcademico: '2025-1',
                observaciones: 'Buen trabajo',
                docenteId: 5
            };

            const mockResult = { rows: [{ id: 1, ...gradeData, created_at: new Date() }] };
            pool.query.mockResolvedValue(mockResult);

            const result = await GradesDAO.create(gradeData);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO calificaciones'),
                expect.arrayContaining([gradeData.estudianteId, gradeData.calificacion])
            );
            expect(result).toEqual(mockResult.rows[0]);
        });
    });

    describe('getAll', () => {
        it('should return grades and total count', async () => {
            const mockGrades = { rows: [{ id: 1, calificacion: 9 }] };
            const mockCount = { rows: [{ count: '1' }] };

            pool.query
                .mockResolvedValueOnce(mockGrades) // First call for data
                .mockResolvedValueOnce(mockCount); // Second call for count

            const result = await GradesDAO.getAll({ limit: 10, offset: 0 });

            expect(pool.query).toHaveBeenCalledTimes(2);
            expect(result).toEqual({ rows: mockGrades.rows, total: 1 });
        });

        it('should apply filters', async () => {
            pool.query.mockResolvedValue({ rows: [] });
            pool.query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ count: '0' }] });

            await GradesDAO.getAll({ estudianteId: 1, materiaId: 101 });

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('AND c.estudiante_id = $1'),
                expect.arrayContaining([1])
            );
        });
    });

    describe('update', () => {
        it('should update grade fields', async () => {
            const updateData = { calificacion: 10, observaciones: 'Mejorado' };
            const mockResult = { rows: [{ id: 1, ...updateData }] };
            pool.query.mockResolvedValue(mockResult);

            const result = await GradesDAO.update(1, updateData);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE calificaciones SET'),
                expect.arrayContaining([updateData.calificacion, updateData.observaciones, 1])
            );
            expect(result).toEqual(mockResult.rows[0]);
        });
    });

    describe('bulkCreate', () => {
        it('should insert multiple grades in a transaction', async () => {
            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };
            pool.connect.mockResolvedValue(mockClient);
            mockClient.query.mockResolvedValue({ rows: [{ id: 1 }] }); // For inserts

            const grades = [
                { estudianteId: 1, calificacion: 8 },
                { estudianteId: 2, calificacion: 9 }
            ];

            const result = await GradesDAO.bulkCreate(grades);

            expect(pool.connect).toHaveBeenCalled();
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO calificaciones'), expect.any(Array));
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
            expect(mockClient.release).toHaveBeenCalled();
            expect(result).toHaveLength(2);
        });

        it('should rollback on error', async () => {
            const mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };
            pool.connect.mockResolvedValue(mockClient);
            mockClient.query.mockResolvedValueOnce(); // BEGIN
            mockClient.query.mockRejectedValueOnce(new Error('DB Error')); // Insert fails

            await expect(GradesDAO.bulkCreate([{ calificacion: 10 }])).rejects.toThrow('DB Error');

            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockClient.release).toHaveBeenCalled();
        });
    });

    describe('getStats', () => {
        it('should return statistics', async () => {
            const mockStats = { total: 10, promedio: 8.5, min: 7, max: 10 };
            pool.query.mockResolvedValue({ rows: [mockStats] });

            const result = await GradesDAO.getStats({ materiaId: 101 });

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT COUNT(*) as total'),
                expect.arrayContaining([101])
            );
            expect(result).toEqual(mockStats);
        });
    });
});
