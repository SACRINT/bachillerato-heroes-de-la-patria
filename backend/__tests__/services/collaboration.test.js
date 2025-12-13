
const mockCollabDAO = {
    createRoom: jest.fn(),
    getRoomById: jest.fn(),
    getUserRooms: jest.fn(),
    updateRoomStatus: jest.fn(),
    logParticipantJoin: jest.fn(),
    logParticipantLeave: jest.fn(),
    persistChatMessage: jest.fn(),
    getChatHistory: jest.fn(),
    editChatMessage: jest.fn(),
    deleteChatMessage: jest.fn(),
    loadDocument: jest.fn(),
    persistDocument: jest.fn()
};

jest.mock('../../data/collaboration.dao', () => mockCollabDAO);

const { collaborationService } = require('../../services/collaboration/index');

describe('RealTime Collaboration Service (Refactored)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset in-memory maps
        if (collaborationService.roomManager) {
            collaborationService.roomManager.activeRooms = new Map();
        }
    });

    test('should initialize correctly', async () => {
        await collaborationService.initialize();
        expect(collaborationService.roomManager).toBeDefined();
    });

    describe('Room Manager', () => {
        test('should create video room', async () => {
            mockCollabDAO.createRoom.mockResolvedValue({
                room_id: 'room_123',
                type: 'video',
                status: 'created',
                max_participants: 50,
                settings: {}
            });

            const result = await collaborationService.videoConference.createConference({
                name: 'Test Conf',
                hostId: 1
            });

            expect(result.roomId).toContain('room_');
            expect(mockCollabDAO.createRoom).toHaveBeenCalled();
            expect(collaborationService.roomManager.activeRooms.has(result.roomId)).toBe(true);
        });

        test('should allow user to join room', async () => {
            // Setup existing room in memory
            const roomId = 'room_existing';
            const roomData = {
                room_id: roomId,
                type: 'video',
                host_id: 1,
                max_participants: 10,
                access_code: 'ABC',
                settings: { requireAccessCode: true },
                status: 'created'
            };

            // Simular carga desde BD si no está en memoria (aunque aquí injectaremos en memoria)
            mockCollabDAO.getRoomById.mockResolvedValue(roomData);

            // Crear mock room en memoria para simplificar
            collaborationService.roomManager.activeRooms.set(roomId, {
                ...roomData,
                participants: new Map(),
                messages: []
            });

            const result = await collaborationService.roomManager.joinRoom(roomId, 2, { accessCode: 'ABC' });

            expect(result.participantId).toBeDefined();
            expect(result.role).toBe('participant');
            expect(mockCollabDAO.logParticipantJoin).toHaveBeenCalledWith(roomId, 2);
        });
    });

    describe('Chat Manager', () => {
        test('should send message', async () => {
            const roomId = 'room_chat';
            // Setup room and participant
            const participantId = 'p1';
            collaborationService.roomManager.activeRooms.set(roomId, {
                room_id: roomId,
                messages: [],
                participants: new Map([
                    [participantId, {
                        id: participantId,
                        odafiUserId: 1,
                        joinedAt: new Date()
                    }]
                ])
            });

            const msg = await collaborationService.chat.sendMessage(roomId, participantId, 'Hello World');

            expect(msg.content).toBe('Hello World');
            expect(mockCollabDAO.persistChatMessage).toHaveBeenCalled();

            const history = await collaborationService.chat.getChatHistory(roomId);
            expect(history.length).toBe(1);
        });
    });

    describe('Document Manager', () => {
        test('should apply OT operations', async () => {
            const roomId = 'room_doc';
            collaborationService.roomManager.activeRooms.set(roomId, {
                room_id: roomId,
                documentState: { content: 'Hello', version: 1 },
                participants: new Map()
            });

            // Insert ' World' at position 5
            const op = { type: 'insert', position: 5, content: ' World' };

            const result = await collaborationService.documentCollab.applyOperation(roomId, 'p1', op);

            expect(result.version).toBe(2);
            const state = collaborationService.documentCollab.getDocumentState(roomId);
            expect(state.content).toBe('Hello World');
        });
    });
});
