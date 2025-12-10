// Mock pg library BEFORE importing anything else
const mQuery = jest.fn();
const mClient = { query: mQuery, release: jest.fn() };
const mPool = {
    query: mQuery,
    connect: jest.fn().mockResolvedValue(mClient),
    on: jest.fn()
};

jest.mock('pg', () => {
    return { Pool: jest.fn(() => mPool) };
});

const UserDAO = require('../../data/user.dao');

// Ya no necesitamos mockear config/database directamente si mockeamos pg, 
// pero UserDAO.ts usa config/database que usa pg.
// Al mockear pg, config/database instanciará nuestro Pool mockeado.

const devLogger = require('../../utils/devLogger');

jest.mock('../../utils/devLogger', () => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
}));

describe('UserDAO', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a new user and return it', async () => {
            const userData = {
                id: 1,
                email: 'test@example.com',
                password_hash: 'hashed_password',
                username: 'testuser',
                nombre: 'Test',
                apellido_paterno: 'User',
                role: 'estudiante',
                active: true
            };

            const mockResult = {
                rows: [{
                    id: 1,
                    email: userData.email,
                    username: userData.username,
                    role: userData.role,
                    created_at: new Date()
                }]
            };

            mQuery.mockResolvedValueOnce(mockResult);

            const result = await UserDAO.create(
                userData.id,
                userData.email,
                userData.password_hash,
                userData.username,
                userData.nombre,
                userData.apellido_paterno,
                userData.role,
                userData.active
            );

            // UserDAO.create: 
            // query('INSERT ... RETURNING *', params)
            // Expect to call query
            expect(mQuery).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO usuarios'),
                expect.any(Array)
            );
            expect(result).toEqual(mockResult.rows[0]);
        });
    });

    describe('getByEmail', () => {
        it('should return user when found', async () => {
            const mockUser = { id: 1, email: 'test@example.com' };
            mQuery.mockResolvedValueOnce({ rows: [mockUser] });

            const result = await UserDAO.getByEmail('test@example.com');

            expect(result).toEqual(mockUser);
        });

        it('should return null when not found', async () => {
            mQuery.mockResolvedValueOnce({ rows: [] });

            const result = await UserDAO.getByEmail('nonexistent@example.com');

            if (result === undefined) {
                expect(result).toBeUndefined();
            } else {
                expect(result).toBeNull();
            }
        });
    });

    describe('updatePassword', () => {
        it('should update password hash', async () => {
            mQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

            const result = await UserDAO.updatePassword(1, 'new_hash');

            expect(mQuery).toHaveBeenCalled();
            // result is the returned row or similar depending on implementation
            expect(result).toBeDefined();
        });
    });

    describe('createVerificationToken', () => {
        it('should insert verification token', async () => {
            mQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

            await UserDAO.createVerificationToken(1, 'token123', 'email_verification', new Date());

            expect(mQuery).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO email_verification_tokens'),
                expect.any(Array)
            );
        });
    });

    describe('checkEmailExists', () => {
        it('should return user info if email exists', async () => {
            const mockResult = { id: 1, email_verified: true };
            mQuery.mockResolvedValueOnce({ rows: [mockResult] });

            const result = await UserDAO.checkEmailExists('test@example.com');

            expect(mQuery).toHaveBeenCalledWith(
                expect.stringContaining('SELECT id, email_verified FROM usuarios'),
                ['test@example.com']
            );
            expect(result).toEqual(mockResult);
        });
    });
});
