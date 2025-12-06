const UserDAO = require('../../data/user.dao');
const { executeQuery } = require('../../config/database');
const devLogger = require('../../utils/devLogger');

// Mock dependencies
jest.mock('../../config/database', () => ({
    executeQuery: jest.fn()
}));

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
                email: 'test@example.com',
                password_hash: 'hashed_password',
                username: 'testuser',
                nombre: 'Test',
                apellido_paterno: 'User',
                role: 'estudiante',
                active: true
            };

            const mockResult = [{
                id: 1,
                email: userData.email,
                username: userData.username,
                role: userData.role,
                created_at: new Date()
            }];

            executeQuery.mockResolvedValue(mockResult);

            const result = await UserDAO.create(userData);

            expect(executeQuery).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO usuarios'),
                expect.arrayContaining([userData.email, userData.password_hash, userData.username])
            );
            expect(result).toEqual(mockResult[0]);
        });
    });

    describe('getByEmail', () => {
        it('should return user when found', async () => {
            const mockUser = { id: 1, email: 'test@example.com' };
            executeQuery.mockResolvedValue([mockUser]);

            const result = await UserDAO.getByEmail('test@example.com');

            expect(executeQuery).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM usuarios WHERE email = $1'),
                ['test@example.com']
            );
            expect(result).toEqual(mockUser);
        });

        it('should return null when not found', async () => {
            executeQuery.mockResolvedValue([]);

            const result = await UserDAO.getByEmail('nonexistent@example.com');

            expect(result).toBeNull();
        });
    });

    describe('updatePassword', () => {
        it('should update password hash', async () => {
            executeQuery.mockResolvedValue([]);

            const result = await UserDAO.updatePassword(1, 'new_hash');

            expect(executeQuery).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE usuarios SET password_hash = $1'),
                ['new_hash', 1]
            );
            expect(result).toBe(true);
        });
    });

    describe('createVerificationToken', () => {
        it('should insert verification token', async () => {
            executeQuery.mockResolvedValue([]);

            await UserDAO.createVerificationToken(1, 'token123', 'email_verification', new Date());

            expect(executeQuery).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO email_verification_tokens'),
                expect.arrayContaining([1, 'token123', 'email_verification'])
            );
        });
    });

    describe('checkEmailExists', () => {
        it('should return user info if email exists', async () => {
            const mockResult = { id: 1, email_verified: true };
            executeQuery.mockResolvedValue([mockResult]);

            const result = await UserDAO.checkEmailExists('test@example.com');

            expect(executeQuery).toHaveBeenCalledWith(
                expect.stringContaining('SELECT id, email_verified FROM usuarios'),
                ['test@example.com']
            );
            expect(result).toEqual(mockResult);
        });
    });
});
