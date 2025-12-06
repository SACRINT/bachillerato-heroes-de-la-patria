/**
 * 🧪 COLLABORATION DAO - TESTS
 * Tests unitarios para collaboration.dao.js
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
const collabDAO = require('../../data/collaboration.dao');

describe('Collaboration DAO', () => {
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
    // ROOM TESTS
    // ============================================
    describe('Room Management', () => {
        describe('createRoom', () => {
            it('debe crear una sala nueva', async () => {
                const mockRoom = {
                    room_id: 'room_abc123',
                    type: 'video',
                    name: 'Test Room',
                    host_id: 1
                };
                mockQuery.mockResolvedValueOnce({ rows: [mockRoom], rowCount: 1 });

                const result = await collabDAO.createRoom({
                    roomId: 'room_abc123',
                    type: 'video',
                    name: 'Test Room',
                    hostId: 1,
                    accessCode: 'ABC123',
                    scheduledStart: new Date(),
                    duration: 3600000,
                    maxParticipants: 10,
                    settings: {}
                });

                expect(result.room_id).toBe('room_abc123');
                expect(mockQuery).toHaveBeenCalled();
            });
        });

        describe('getRoomById', () => {
            it('debe retornar sala cuando existe', async () => {
                const mockRoom = { room_id: 'room_abc', name: 'Test' };
                mockQuery.mockResolvedValueOnce({ rows: [mockRoom], rowCount: 1 });

                const result = await collabDAO.getRoomById('room_abc');

                expect(result).toEqual(mockRoom);
            });

            it('debe retornar null cuando no existe', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

                const result = await collabDAO.getRoomById('nonexistent');

                expect(result).toBeNull();
            });
        });

        describe('getUserRooms', () => {
            it('debe listar salas del usuario', async () => {
                const mockRooms = [
                    { room_id: 'room1', name: 'Room 1' },
                    { room_id: 'room2', name: 'Room 2' }
                ];
                mockQuery.mockResolvedValueOnce({ rows: mockRooms, rowCount: 2 });

                const result = await collabDAO.getUserRooms(123);

                expect(result).toHaveLength(2);
            });
        });

        describe('updateRoomStatus', () => {
            it('debe actualizar estado de sala', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

                await collabDAO.updateRoomStatus('room_abc', 'active');

                expect(mockQuery).toHaveBeenCalled();
                const callArgs = mockQuery.mock.calls[0];
                expect(callArgs[0]).toContain('UPDATE collaboration_rooms');
                expect(callArgs[1]).toContain('active');
            });
        });
    });

    // ============================================
    // PARTICIPANT TESTS
    // ============================================
    describe('Participant Management', () => {
        describe('logParticipantJoin', () => {
            it('debe registrar unión de participante', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

                await collabDAO.logParticipantJoin('room_abc', 123);

                expect(mockQuery).toHaveBeenCalled();
                const callArgs = mockQuery.mock.calls[0];
                expect(callArgs[0]).toContain('INSERT INTO room_participants');
            });
        });

        describe('logParticipantLeave', () => {
            it('debe registrar salida de participante', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

                await collabDAO.logParticipantLeave('room_abc', 123);

                expect(mockQuery).toHaveBeenCalled();
                const callArgs = mockQuery.mock.calls[0];
                expect(callArgs[0]).toContain('UPDATE room_participants');
                expect(callArgs[0]).toContain('left_at = NOW()');
            });
        });
    });

    // ============================================
    // CHAT TESTS
    // ============================================
    describe('Chat Management', () => {
        describe('persistChatMessage', () => {
            it('debe guardar mensaje de chat', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

                await collabDAO.persistChatMessage({
                    id: 'msg-123',
                    roomId: 'room_abc',
                    participantId: 'part-1',
                    userId: 123,
                    content: 'Hola mundo',
                    type: 'text',
                    replyTo: null,
                    timestamp: new Date()
                });

                expect(mockQuery).toHaveBeenCalled();
                const callArgs = mockQuery.mock.calls[0];
                expect(callArgs[0]).toContain('INSERT INTO chat_messages');
            });
        });

        describe('getChatHistory', () => {
            it('debe obtener historial de chat', async () => {
                const mockMessages = [
                    { id: 'msg1', content: 'Hello' },
                    { id: 'msg2', content: 'World' }
                ];
                mockQuery.mockResolvedValueOnce({ rows: mockMessages, rowCount: 2 });

                const result = await collabDAO.getChatHistory('room_abc', { limit: 50 });

                expect(result).toHaveLength(2);
            });
        });

        describe('editChatMessage', () => {
            it('debe editar mensaje', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

                await collabDAO.editChatMessage('room_abc', 'msg-123', 'Nuevo contenido');

                expect(mockQuery).toHaveBeenCalled();
                const callArgs = mockQuery.mock.calls[0];
                expect(callArgs[0]).toContain('UPDATE chat_messages');
            });
        });

        describe('deleteChatMessage', () => {
            it('debe eliminar mensaje', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

                await collabDAO.deleteChatMessage('room_abc', 'msg-123');

                expect(mockQuery).toHaveBeenCalled();
                const callArgs = mockQuery.mock.calls[0];
                expect(callArgs[0]).toContain('DELETE FROM chat_messages');
            });
        });
    });

    // ============================================
    // DOCUMENT TESTS
    // ============================================
    describe('Document Management', () => {
        describe('loadDocument', () => {
            it('debe cargar documento existente', async () => {
                mockQuery.mockResolvedValueOnce({
                    rows: [{ content: 'Test content', version: 5 }],
                    rowCount: 1
                });

                const result = await collabDAO.loadDocument('doc-123');

                expect(result.content).toBe('Test content');
                expect(result.version).toBe(5);
            });

            it('debe retornar documento vacío si no existe', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

                const result = await collabDAO.loadDocument('nonexistent');

                expect(result.content).toBe('');
                expect(result.version).toBe(0);
            });
        });

        describe('persistDocument', () => {
            it('debe guardar documento', async () => {
                mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

                await collabDAO.persistDocument('doc-123', {
                    content: 'Updated content',
                    version: 6
                });

                expect(mockQuery).toHaveBeenCalled();
                const callArgs = mockQuery.mock.calls[0];
                expect(callArgs[0]).toContain('INSERT INTO collaborative_documents');
            });
        });
    });
});
