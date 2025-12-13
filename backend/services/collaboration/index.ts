import { RoomManager } from './RoomManager';
import { VideoConferenceManager } from './VideoConferenceManager';
import { ChatManager } from './ChatManager';
import { DocumentManager } from './DocumentManager';
import { WhiteboardManager } from './WhiteboardManager';
import { ServiceError } from './config';

export class RealTimeCollaborationService {
    public roomManager: RoomManager;
    public videoConference: VideoConferenceManager;
    public chat: ChatManager;
    public documentCollab: DocumentManager;
    public whiteboard: WhiteboardManager;
    private initialized = false;

    constructor() {
        this.roomManager = new RoomManager();
        this.videoConference = new VideoConferenceManager(this.roomManager);
        this.chat = new ChatManager(this.roomManager);
        this.documentCollab = new DocumentManager(this.roomManager);
        this.whiteboard = new WhiteboardManager(this.roomManager);
    }

    async initialize(pool?: any): Promise<void> {
        if (this.initialized) return;
        this.initialized = true;
        console.log('[COLLAB] Real-Time Collaboration Service TS initialized');
    }
}

export const collaborationService = new RealTimeCollaborationService();
export { ServiceError };
