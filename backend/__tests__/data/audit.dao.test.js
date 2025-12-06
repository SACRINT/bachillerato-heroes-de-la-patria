const AuditDAO = require('../../data/audit.dao');
const { pool } = require('../../config/database');

// Mock dependencies
jest.mock('../../config/database', () => ({
    pool: {
        query: jest.fn()
    }
}));

describe('AuditDAO', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('log', () => {
        it('should insert log entry and return id', async () => {
            const logData = {
                userId: 1,
                action: 'LOGIN',
                entity: 'USER',
                entityId: 1,
                oldData: null,
                newData: { status: 'active' },
                ipAddress: '127.0.0.1',
                userAgent: 'Mozilla',
                metadata: { device: 'desktop' }
            };

            pool.query.mockResolvedValue({ rows: [{ id: 100 }] });

            const result = await AuditDAO.log(
                logData.userId,
                logData.action,
                logData.entity,
                logData.entityId,
                logData.oldData,
                logData.newData,
                logData.ipAddress,
                logData.userAgent,
                logData.metadata
            );

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO audit_logs'),
                expect.arrayContaining([
                    logData.userId,
                    logData.action,
                    JSON.stringify(logData.newData),
                    logData.ipAddress
                ])
            );
            expect(result).toBe(100);
        });

        it('should return null on error', async () => {
            pool.query.mockRejectedValue(new Error('DB Error'));

            const result = await AuditDAO.log(1, 'TEST', 'TEST', 1);

            expect(result).toBeNull();
        });
    });

    describe('getByUser', () => {
        it('should return logs for user with filters', async () => {
            const mockLogs = [{ id: 1, action: 'LOGIN' }];
            pool.query.mockResolvedValue({ rows: mockLogs });

            const result = await AuditDAO.getByUser(1, 'LOGIN', '2025-01-01', '2025-12-31', 10, 0);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM audit_logs WHERE user_id = $1'),
                expect.arrayContaining([1, 'LOGIN', '2025-01-01', '2025-12-31', 10, 0])
            );
            expect(result).toEqual(mockLogs);
        });
    });

    describe('getByEntity', () => {
        it('should return logs for entity', async () => {
            const mockLogs = [{ id: 1, entity: 'USER' }];
            pool.query.mockResolvedValue({ rows: mockLogs });

            const result = await AuditDAO.getByEntity('USER', 1, 10, 0);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM audit_logs WHERE entity = $1'),
                expect.arrayContaining(['USER', 1, 10, 0])
            );
            expect(result).toEqual(mockLogs);
        });
    });

    describe('getStats', () => {
        it('should return stats', async () => {
            const mockStats = [{ action: 'LOGIN', count: '10' }];
            pool.query.mockResolvedValue({ rows: mockStats });

            const result = await AuditDAO.getStats('2025-01-01', '2025-12-31');

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT action, entity, COUNT(*)'),
                expect.arrayContaining(['2025-01-01', '2025-12-31'])
            );
            expect(result).toEqual(mockStats);
        });
    });

    describe('cleanup', () => {
        it('should delete old logs', async () => {
            pool.query.mockResolvedValue({ rowCount: 50 });

            const result = await AuditDAO.cleanup(30);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining("DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '30 days'")
            );
            expect(result).toBe(50);
        });
    });
});
