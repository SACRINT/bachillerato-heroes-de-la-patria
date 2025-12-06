/**
 * 🧪 COLLABORATIVE EDITING DAO - TESTS
 * Tests unitarios para collaborative-editing.dao.js
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

// Ahora importamos el DAO
const collabEditDAO = require('../../data/collaborative-editing.dao');

describe('Collaborative Editing DAO', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default implementation
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
    // DOCUMENT TESTS
    // ============================================
    describe('Document Operations', () => {
        describe('createDocument', () => {
            it('debe crear documento nuevo', async () => {
                const mockDoc = {
                    id: 1,
                    tenant_id: 1,
                    title: 'Mi Documento',
                    version: 1
                };
                mockQuery.mockResolvedValueOnce({ rows: [mockDoc], rowCount: 1 });

                const result = await collabEditDAO.createDocument({
                    tenantId: 1,
                    creatorId: 123,
                    title: 'Mi Documento',
                    content: 'Contenido inicial',
                    type: 'text',
                    metadata: {}
                });

                expect(result.id).toBe(1);
                expect(result.title).toBe('Mi Documento');
            });
        });

        describe('getDocumentByIdAndTenant', () => {
            it('debe obtener documento por id y tenant', async () => {
                const mockDoc = { id: 1, tenant_id: 1, title: 'Test Doc' };
                mockQuery.mockResolvedValueOnce({ rows: [mockDoc], rowCount: 1 });

                const result = await collabEditDAO.getDocumentByIdAndTenant(1, 1);

                expect(result).toEqual(mockDoc);
            });

            it('debe retornar null si no existe', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

                const result = await collabEditDAO.getDocumentByIdAndTenant(999, 1);

                expect(result).toBeNull();
            });
        });

        describe('getDocumentContentAndVersion', () => {
            it('debe obtener contenido y versión', async () => {
                mockQuery.mockResolvedValueOnce({
                    rows: [{ content: 'Test content', version: 3 }],
                    rowCount: 1
                });

                const result = await collabEditDAO.getDocumentContentAndVersion(1, 1);

                expect(result.content).toBe('Test content');
                expect(result.version).toBe(3);
            });
        });

        describe('updateDocumentContent', () => {
            it('debe actualizar contenido e incrementar versión', async () => {
                const mockUpdated = { id: 1, content: 'New content', version: 4 };
                mockQuery.mockResolvedValueOnce({ rows: [mockUpdated], rowCount: 1 });

                const result = await collabEditDAO.updateDocumentContent(1, 1, 'New content');

                expect(result.version).toBe(4);
            });
        });

        describe('lockDocument', () => {
            it('debe bloquear documento', async () => {
                const mockDoc = { id: 1, locked: true, locked_by: 123 };
                mockQuery.mockResolvedValueOnce({ rows: [mockDoc], rowCount: 1 });

                const result = await collabEditDAO.lockDocument(1, 1, 123);

                expect(result.locked).toBe(true);
            });

            it('debe retornar null si ya está bloqueado', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

                const result = await collabEditDAO.lockDocument(1, 1, 456);

                expect(result).toBeNull();
            });
        });

        describe('unlockDocument', () => {
            it('debe desbloquear documento', async () => {
                const mockDoc = { id: 1, locked: false, locked_by: null };
                mockQuery.mockResolvedValueOnce({ rows: [mockDoc], rowCount: 1 });

                const result = await collabEditDAO.unlockDocument(1, 1, 123);

                expect(result.locked).toBe(false);
            });
        });

        describe('listDocuments', () => {
            it('debe listar documentos del tenant', async () => {
                const mockDocs = [
                    { id: 1, title: 'Doc 1' },
                    { id: 2, title: 'Doc 2' }
                ];
                mockQuery.mockResolvedValueOnce({ rows: mockDocs, rowCount: 2 });

                const result = await collabEditDAO.listDocuments(1, {});

                expect(result).toHaveLength(2);
            });
        });

        describe('deleteDocument', () => {
            it('debe eliminar documento', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 });

                const result = await collabEditDAO.deleteDocument(1, 1, 123);

                expect(result.id).toBe(1);
            });

            it('debe retornar null si no tiene permisos', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

                const result = await collabEditDAO.deleteDocument(1, 1, 456);

                expect(result).toBeNull();
            });
        });
    });

    // ============================================
    // ACTIVITY TESTS
    // ============================================
    describe('User Activity', () => {
        describe('getActiveUsers', () => {
            it('debe obtener usuarios activos', async () => {
                const mockUsers = [
                    { user_id: 123, last_activity: new Date() },
                    { user_id: 456, last_activity: new Date() }
                ];
                mockQuery.mockResolvedValueOnce({ rows: mockUsers, rowCount: 2 });

                const result = await collabEditDAO.getActiveUsers(1);

                expect(result).toHaveLength(2);
            });
        });

        describe('updateUserActivity', () => {
            it('debe actualizar actividad del usuario', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

                await collabEditDAO.updateUserActivity(1, 123);

                expect(mockQuery).toHaveBeenCalled();
                const callArgs = mockQuery.mock.calls[0];
                expect(callArgs[0]).toContain('INSERT INTO document_activity');
            });
        });
    });

    // ============================================
    // OPERATION TESTS
    // ============================================
    describe('Operation History', () => {
        describe('recordOperation', () => {
            it('debe registrar operación de edición', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

                await collabEditDAO.recordOperation({
                    documentId: 1,
                    userId: 123,
                    type: 'insert',
                    position: 0,
                    content: 'Hello',
                    versionBefore: 1,
                    versionAfter: 2
                });

                expect(mockQuery).toHaveBeenCalled();
                const callArgs = mockQuery.mock.calls[0];
                expect(callArgs[0]).toContain('INSERT INTO document_operations');
            });
        });

        describe('getOperationHistory', () => {
            it('debe obtener historial de operaciones', async () => {
                const mockOps = [
                    { id: 1, operation_type: 'insert' },
                    { id: 2, operation_type: 'delete' }
                ];
                mockQuery.mockResolvedValueOnce({ rows: mockOps, rowCount: 2 });

                const result = await collabEditDAO.getOperationHistory(1, 50);

                expect(result).toHaveLength(2);
            });
        });
    });
});
