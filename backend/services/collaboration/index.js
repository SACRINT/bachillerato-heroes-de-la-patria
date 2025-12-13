"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceError = exports.collaborationService = exports.RealTimeCollaborationService = void 0;
const RoomManager_1 = require("./RoomManager");
const VideoConferenceManager_1 = require("./VideoConferenceManager");
const ChatManager_1 = require("./ChatManager");
const DocumentManager_1 = require("./DocumentManager");
const WhiteboardManager_1 = require("./WhiteboardManager");
const config_1 = require("./config");
Object.defineProperty(exports, "ServiceError", { enumerable: true, get: function () { return config_1.ServiceError; } });
class RealTimeCollaborationService {
    constructor() {
        this.initialized = false;
        this.roomManager = new RoomManager_1.RoomManager();
        this.videoConference = new VideoConferenceManager_1.VideoConferenceManager(this.roomManager);
        this.chat = new ChatManager_1.ChatManager(this.roomManager);
        this.documentCollab = new DocumentManager_1.DocumentManager(this.roomManager);
        this.whiteboard = new WhiteboardManager_1.WhiteboardManager(this.roomManager);
    }
    async initialize(pool) {
        if (this.initialized)
            return;
        this.initialized = true;
        console.log('[COLLAB] Real-Time Collaboration Service TS initialized');
    }
}
exports.RealTimeCollaborationService = RealTimeCollaborationService;
exports.collaborationService = new RealTimeCollaborationService();
