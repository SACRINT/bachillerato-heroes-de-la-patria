/**
 * 🧪 SECURITY ADVANCED DAO - TESTS
 * Tests unitarios para security-advanced.dao.js
 */

// ============================================
// MOCK INLINE - Debe estar ANTES de cualquier import
// ============================================
const mockQuery = jest.fn();
const mockPool = {
    query: mockQuery,
    connect: jest.fn().mockResolvedValue({
        query: mockQuery,
        release: jest.fn()
    }),
    end: jest.fn().mockResolvedValue(undefined),
    on: jest.fn()
};

jest.mock('../../config/database', () => ({
    pool: mockPool,
    query: mockQuery
}));

// Ahora importamos el DAO (después del mock)
const securityDAO = require('../../data/security-advanced.dao');

describe('Security Advanced DAO', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset mock to return default response
        mockQuery.mockImplementation(async (query) => {
            const queryUpper = query.toUpperCase().trim();
            if (queryUpper.startsWith('SELECT')) {
                return { rows: [], rowCount: 0 };
            }
            if (queryUpper.startsWith('INSERT')) {
                return { rows: [{ id: 1 }], rowCount: 1 };
            }
            return { rows: [], rowCount: 0 };
        });
    });

    // ============================================
    // 2FA TESTS
    // ============================================
    describe('Two-Factor Authentication', () => {
        describe('upsert2FASetup', () => {
            it('debe insertar configuración 2FA nueva', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 });

                const result = await securityDAO.upsert2FASetup(
                    123,
                    'encrypted-secret',
                    '["code1","code2"]'
                );

                expect(result).toHaveProperty('id');
                expect(mockQuery).toHaveBeenCalled();
            });

            it('debe actualizar configuración 2FA existente (upsert)', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [{ id: 2 }], rowCount: 1 });

                const result = await securityDAO.upsert2FASetup(456, 'new-secret', '[]');

                expect(result.id).toBe(2);
            });
        });

        describe('enable2FA', () => {
            it('debe habilitar 2FA para usuario', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

                await securityDAO.enable2FA(123);

                expect(mockQuery).toHaveBeenCalled();
                const callArgs = mockQuery.mock.calls[0];
                expect(callArgs[0]).toContain('UPDATE user_2fa');
                expect(callArgs[0]).toContain('enabled = true');
            });
        });

        describe('disable2FA', () => {
            it('debe deshabilitar 2FA para usuario', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

                await securityDAO.disable2FA(456);

                expect(mockQuery).toHaveBeenCalled();
                const callArgs = mockQuery.mock.calls[0];
                expect(callArgs[0]).toContain('enabled = false');
            });
        });

        describe('get2FAConfig', () => {
            it('debe retornar config cuando existe', async () => {
                const mockConfig = { user_id: 123, enabled: true, totp_secret: 'secret' };
                mockQuery.mockResolvedValueOnce({ rows: [mockConfig], rowCount: 1 });

                const result = await securityDAO.get2FAConfig(123);

                expect(result).toEqual(mockConfig);
            });

            it('debe retornar null cuando no existe', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

                const result = await securityDAO.get2FAConfig(999);

                expect(result).toBeNull();
            });
        });

        describe('reset2FAAttempts', () => {
            it('debe resetear intentos fallidos', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

                await securityDAO.reset2FAAttempts(123);

                expect(mockQuery).toHaveBeenCalled();
                const callArgs = mockQuery.mock.calls[0];
                expect(callArgs[0]).toContain('failed_attempts = 0');
            });
        });

        describe('increment2FAFailedAttempts', () => {
            it('debe incrementar intentos fallidos', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

                await securityDAO.increment2FAFailedAttempts(123);

                expect(mockQuery).toHaveBeenCalled();
                const callArgs = mockQuery.mock.calls[0];
                expect(callArgs[0]).toContain('failed_attempts + 1');
            });
        });
    });

    // ============================================
    // SESSION TESTS
    // ============================================
    describe('Session Management', () => {
        describe('createSession', () => {
            it('debe crear sesión nueva', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [{ id: 'session-123' }], rowCount: 1 });

                const sessionData = {
                    userId: 1,
                    sessionId: 'session-123',
                    tokenHash: 'hash-abc',
                    deviceInfo: { browser: 'Chrome' },
                    ipAddress: '192.168.1.1',
                    expiresAt: new Date()
                };

                const result = await securityDAO.createSession(sessionData);

                expect(result.id).toBe('session-123');
            });
        });

        describe('validateSession', () => {
            it('debe retornar sesión válida', async () => {
                const mockSession = { id: 'session-123', user_id: 1, is_active: true };
                mockQuery.mockResolvedValueOnce({ rows: [mockSession], rowCount: 1 });

                const result = await securityDAO.validateSession('session-123', 'token');

                expect(result).toEqual(mockSession);
            });

            it('debe retornar null para sesión inválida', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

                const result = await securityDAO.validateSession('invalid', 'token');

                expect(result).toBeNull();
            });
        });

        describe('destroySession', () => {
            it('debe destruir sesión', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

                await securityDAO.destroySession('session-123');

                expect(mockQuery).toHaveBeenCalled();
                const callArgs = mockQuery.mock.calls[0];
                expect(callArgs[0]).toContain('is_active = false');
            });
        });

        describe('destroyAllUserSessions', () => {
            it('debe destruir todas las sesiones de un usuario', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

                await securityDAO.destroyAllUserSessions(123);

                expect(mockQuery).toHaveBeenCalled();
                expect(mockQuery.mock.calls[0][1]).toContain(123);
            });
        });

        describe('countActiveSessions', () => {
            it('debe contar sesiones activas', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [{ count: '3' }], rowCount: 1 });

                const result = await securityDAO.countActiveSessions(123);

                expect(result).toBe(3);
            });
        });

        describe('updateSessionActivity', () => {
            it('debe actualizar última actividad', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

                await securityDAO.updateSessionActivity('session-123');

                expect(mockQuery).toHaveBeenCalled();
                const callArgs = mockQuery.mock.calls[0];
                expect(callArgs[0]).toContain('last_activity = NOW()');
            });
        });
    });

    // ============================================
    // PASSWORD HISTORY TESTS
    // ============================================
    describe('Password History', () => {
        describe('getPasswordHistory', () => {
            it('debe obtener historial de contraseñas', async () => {
                const mockHistory = [
                    { password_hash: 'hash1' },
                    { password_hash: 'hash2' }
                ];
                mockQuery.mockResolvedValueOnce({ rows: mockHistory, rowCount: 2 });

                const result = await securityDAO.getPasswordHistory(123, 5);

                expect(result).toHaveLength(2);
            });
        });

        describe('savePasswordToHistory', () => {
            it('debe guardar contraseña en historial', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

                await securityDAO.savePasswordToHistory(123, 'new-hash');

                expect(mockQuery).toHaveBeenCalled();
                const callArgs = mockQuery.mock.calls[0];
                expect(callArgs[0]).toContain('INSERT INTO password_history');
            });
        });

        describe('checkPasswordAge', () => {
            it('debe verificar edad de contraseña', async () => {
                const mockDate = new Date();
                mockQuery.mockResolvedValueOnce({
                    rows: [{ password_changed_at: mockDate }],
                    rowCount: 1
                });

                const result = await securityDAO.checkPasswordAge(123);

                expect(result).toHaveProperty('needs_change');
                expect(result).toHaveProperty('last_changed');
            });

            it('debe indicar cambio necesario si no hay fecha', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

                const result = await securityDAO.checkPasswordAge(123);

                expect(result.needs_change).toBe(true);
                expect(result.last_changed).toBeNull();
            });
        });
    });

    // ============================================
    // INTRUSION DETECTION TESTS
    // ============================================
    describe('Intrusion Detection System', () => {
        describe('logSecurityThreat', () => {
            it('debe registrar amenaza de seguridad', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

                await securityDAO.logSecurityThreat('192.168.1.1', { type: 'brute_force' });

                expect(mockQuery).toHaveBeenCalled();
                const callArgs = mockQuery.mock.calls[0];
                expect(callArgs[0]).toContain('INSERT INTO security_threats');
            });
        });
    });
});
