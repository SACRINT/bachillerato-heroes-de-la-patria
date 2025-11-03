/**
 * 🔗 WebRTC COMMUNICATION SYSTEM - FASE 4
 * Sistema de comunicación en tiempo real para videollamadas y chat
 */

class WebRTCCommunication {
    constructor() {
        this.isSupported = this.checkWebRTCSupport();
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        this.dataChannel = null;
        
        this.configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ],
            iceCandidatePoolSize: 10
        };
        
        this.connectionState = 'disconnected';
        this.callState = 'idle'; // idle, calling, connected, ended
        this.mediaConstraints = {
            video: { width: 640, height: 480 },
            audio: true
        };
        
        this.messageHandlers = new Map();
        this.chatHistory = [];
        
        this.init();
    }

    init() {
        //console.log('🔗 Inicializando WebRTC Communication...');
        
        if (!this.isSupported) {
            console.warn('WebRTC not supported');
            this.showUnsupportedMessage();
            return;
        }
        
        this.setupUI();
        this.setupMessageHandlers();
        this.setupEventListeners();
        
        //console.log('✅ WebRTC Communication inicializado');
    }

    checkWebRTCSupport() {
        return !!(window.RTCPeerConnection && 
                  navigator.mediaDevices && 
                  navigator.mediaDevices.getUserMedia);
    }

    // === PEER CONNECTION SETUP ===
    createPeerConnection() {
        if (this.peerConnection) {
            this.peerConnection.close();
        }

        this.peerConnection = new RTCPeerConnection(this.configuration);

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignalingMessage({
                    type: 'ice-candidate',
                    candidate: event.candidate
                });
            }
        };

        // Handle remote stream
        this.peerConnection.ontrack = (event) => {
            //console.log('🎥 Remote stream received');
            this.remoteStream = event.streams[0];
            this.displayRemoteVideo(this.remoteStream);
        };

        // Handle connection state changes
        this.peerConnection.onconnectionstatechange = () => {
            this.connectionState = this.peerConnection.connectionState;
            //console.log('🔗 Connection state:', this.connectionState);
            this.updateConnectionUI();
            
            if (this.connectionState === 'connected') {
                this.callState = 'connected';
            } else if (this.connectionState === 'disconnected' || 
                       this.connectionState === 'failed') {
                this.callState = 'ended';
                this.endCall();
            }
        };

        // Create data channel for chat
        this.dataChannel = this.peerConnection.createDataChannel('chat', {
            ordered: true
        });
        
        this.setupDataChannel(this.dataChannel);

        // Handle incoming data channels
        this.peerConnection.ondatachannel = (event) => {
            const channel = event.channel;
            this.setupDataChannel(channel);
        };

        return this.peerConnection;
    }

    setupDataChannel(channel) {
        channel.onopen = () => {
            //console.log('💬 Data channel opened');
        };

        channel.onclose = () => {
            //console.log('💬 Data channel closed');
        };

        channel.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleDataChannelMessage(message);
        };
    }

    // === MEDIA HANDLING ===
    async getUserMedia(constraints = this.mediaConstraints) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.localStream = stream;
            this.displayLocalVideo(stream);
            
            // Add tracks to peer connection
            if (this.peerConnection) {
                stream.getTracks().forEach(track => {
                    this.peerConnection.addTrack(track, stream);
                });
            }
            
            //console.log('🎥 Local media stream acquired');
            return stream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            this.showMediaError(error);
            throw error;
        }
    }

    async startScreenShare() {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });

            // Replace video track
            if (this.peerConnection && this.localStream) {
                const videoTrack = screenStream.getVideoTracks()[0];
                const sender = this.peerConnection.getSenders().find(s => 
                    s.track && s.track.kind === 'video'
                );
                
                if (sender) {
                    await sender.replaceTrack(videoTrack);
                }
            }

            this.displayLocalVideo(screenStream);
            
            // Handle screen share end
            screenStream.getVideoTracks()[0].onended = () => {
                this.stopScreenShare();
            };

            //console.log('🖥️ Screen sharing started');
            return screenStream;
        } catch (error) {
            console.error('Error starting screen share:', error);
            throw error;
        }
    }

    async stopScreenShare() {
        try {
            // Get camera stream again
            const cameraStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            // Replace screen track with camera track
            if (this.peerConnection) {
                const videoTrack = cameraStream.getVideoTracks()[0];
                const sender = this.peerConnection.getSenders().find(s => 
                    s.track && s.track.kind === 'video'
                );
                
                if (sender) {
                    await sender.replaceTrack(videoTrack);
                }
            }

            this.displayLocalVideo(cameraStream);
            //console.log('📹 Returned to camera');
        } catch (error) {
            console.error('Error stopping screen share:', error);
        }
    }

    // === CALL MANAGEMENT ===
    async makeCall() {
        try {
            this.callState = 'calling';
            this.createPeerConnection();
            
            // Get user media
            await this.getUserMedia();

            // Create offer
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);

            // Send offer through signaling
            this.sendSignalingMessage({
                type: 'offer',
                offer: offer
            });

            //console.log('📞 Call initiated');
            this.updateCallUI();

        } catch (error) {
            console.error('Error making call:', error);
            this.callState = 'idle';
            this.updateCallUI();
        }
    }

    async answerCall(offer) {
        try {
            this.callState = 'connected';
            this.createPeerConnection();
            
            // Get user media
            await this.getUserMedia();

            // Set remote description
            await this.peerConnection.setRemoteDescription(offer);

            // Create answer
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);

            // Send answer through signaling
            this.sendSignalingMessage({
                type: 'answer',
                answer: answer
            });

            //console.log('📞 Call answered');
            this.updateCallUI();

        } catch (error) {
            console.error('Error answering call:', error);
            this.endCall();
        }
    }

    endCall() {
        //console.log('📞 Ending call');
        
        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        // Stop local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        // Clear remote stream
        this.remoteStream = null;

        // Update state
        this.callState = 'idle';
        this.connectionState = 'disconnected';
        
        // Update UI
        this.updateCallUI();
        this.clearVideoElements();

        // Send signaling message
        this.sendSignalingMessage({ type: 'end-call' });
    }

    // === SIGNALING ===
    sendSignalingMessage(message) {
        // In a real application, this would send through WebSocket or other signaling server
        //console.log('📡 Sending signaling message:', message.type);
        
        // For demo purposes, we'll simulate signaling
        if (window.signalingChannel) {
            window.signalingChannel.send(JSON.stringify(message));
        } else {
            console.warn('No signaling channel available');
        }
    }

    handleSignalingMessage(message) {
        //console.log('📡 Received signaling message:', message.type);

        switch (message.type) {
            case 'offer':
                this.handleOffer(message.offer);
                break;
            case 'answer':
                this.handleAnswer(message.answer);
                break;
            case 'ice-candidate':
                this.handleIceCandidate(message.candidate);
                break;
            case 'end-call':
                this.endCall();
                break;
        }
    }

    async handleOffer(offer) {
        if (this.callState !== 'idle') return;

        const accept = await this.showIncomingCallDialog();
        if (accept) {
            await this.answerCall(offer);
        } else {
            this.sendSignalingMessage({ type: 'call-rejected' });
        }
    }

    async handleAnswer(answer) {
        if (this.peerConnection && this.callState === 'calling') {
            await this.peerConnection.setRemoteDescription(answer);
            this.callState = 'connected';
            this.updateCallUI();
        }
    }

    async handleIceCandidate(candidate) {
        if (this.peerConnection) {
            await this.peerConnection.addIceCandidate(candidate);
        }
    }

    // === CHAT FUNCTIONALITY ===
    sendChatMessage(text) {
        if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
            console.warn('Data channel not available for chat');
            return;
        }

        const message = {
            type: 'chat',
            text: text,
            timestamp: Date.now(),
            sender: 'local'
        };

        this.dataChannel.send(JSON.stringify(message));
        this.addChatMessage(message);
    }

    handleDataChannelMessage(message) {
        switch (message.type) {
            case 'chat':
                message.sender = 'remote';
                this.addChatMessage(message);
                break;
        }
    }

    addChatMessage(message) {
        this.chatHistory.push(message);
        this.displayChatMessage(message);
    }

    // === UI MANAGEMENT ===
    setupUI() {
        const webrtcContainer = document.createElement('div');
        webrtcContainer.className = 'webrtc-container';
        webrtcContainer.innerHTML = `
            <div class="webrtc-panel">
                <h4>🔗 Comunicación WebRTC</h4>
                
                <div class="call-controls">
                    <button id="start-call" onclick="webrtcComm.makeCall()">📞 Iniciar Llamada</button>
                    <button id="end-call" onclick="webrtcComm.endCall()" disabled>📴 Colgar</button>
                    <button id="screen-share" onclick="webrtcComm.startScreenShare()" disabled>🖥️ Compartir Pantalla</button>
                    <button id="toggle-video" onclick="webrtcComm.toggleVideo()" disabled>📹 Video</button>
                    <button id="toggle-audio" onclick="webrtcComm.toggleAudio()" disabled>🎤 Audio</button>
                </div>
                
                <div class="connection-status">
                    <span class="status-indicator" id="connection-status">Desconectado</span>
                </div>
                
                <div class="video-container">
                    <video id="local-video" autoplay muted playsinline></video>
                    <video id="remote-video" autoplay playsinline></video>
                </div>
                
                <div class="chat-container">
                    <div class="chat-messages" id="chat-messages"></div>
                    <div class="chat-input">
                        <input type="text" id="chat-input" placeholder="Escribe un mensaje..." maxlength="500">
                        <button onclick="webrtcComm.sendChatFromInput()">📤</button>
                    </div>
                </div>
            </div>
        `;

        this.injectWebRTCStyles();
        document.body.appendChild(webrtcContainer);
        
        // Setup chat input
        const chatInput = document.getElementById('chat-input');
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatFromInput();
            }
        });
    }

    sendChatFromInput() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        
        if (text) {
            this.sendChatMessage(text);
            input.value = '';
        }
    }

    displayLocalVideo(stream) {
        const video = document.getElementById('local-video');
        if (video) {
            video.srcObject = stream;
        }
    }

    displayRemoteVideo(stream) {
        const video = document.getElementById('remote-video');
        if (video) {
            video.srcObject = stream;
        }
    }

    clearVideoElements() {
        const localVideo = document.getElementById('local-video');
        const remoteVideo = document.getElementById('remote-video');
        
        if (localVideo) localVideo.srcObject = null;
        if (remoteVideo) remoteVideo.srcObject = null;
    }

    displayChatMessage(message) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${message.sender}`;
        
        const time = new Date(message.timestamp).toLocaleTimeString();
        messageEl.innerHTML = `
            <div class="message-content">${message.text}</div>
            <div class="message-time">${time}</div>
        `;
        
        chatMessages.appendChild(messageEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    updateCallUI() {
        const startCallBtn = document.getElementById('start-call');
        const endCallBtn = document.getElementById('end-call');
        const screenShareBtn = document.getElementById('screen-share');
        const toggleVideoBtn = document.getElementById('toggle-video');
        const toggleAudioBtn = document.getElementById('toggle-audio');
        
        const isConnected = this.callState === 'connected' || this.callState === 'calling';
        
        if (startCallBtn) startCallBtn.disabled = isConnected;
        if (endCallBtn) endCallBtn.disabled = !isConnected;
        if (screenShareBtn) screenShareBtn.disabled = !isConnected;
        if (toggleVideoBtn) toggleVideoBtn.disabled = !isConnected;
        if (toggleAudioBtn) toggleAudioBtn.disabled = !isConnected;
    }

    updateConnectionUI() {
        const statusEl = document.getElementById('connection-status');
        if (statusEl) {
            statusEl.textContent = this.getConnectionStatusText();
            statusEl.className = `status-indicator ${this.connectionState}`;
        }
    }

    getConnectionStatusText() {
        switch (this.connectionState) {
            case 'connecting': return 'Conectando...';
            case 'connected': return 'Conectado';
            case 'disconnected': return 'Desconectado';
            case 'failed': return 'Conexión fallida';
            default: return 'Desconocido';
        }
    }

    async showIncomingCallDialog() {
        return new Promise((resolve) => {
            const modal = this.createModal('Llamada Entrante', `
                <div class="incoming-call">
                    <p>📞 Tienes una llamada entrante</p>
                    <div class="call-actions">
                        <button onclick="this.closest('.modal').remove(); resolve(true)" class="accept-btn">
                            ✅ Aceptar
                        </button>
                        <button onclick="this.closest('.modal').remove(); resolve(false)" class="reject-btn">
                            ❌ Rechazar
                        </button>
                    </div>
                </div>
            `);
            
            // Add event listeners to buttons
            modal.querySelector('.accept-btn').onclick = () => {
                modal.remove();
                resolve(true);
            };
            modal.querySelector('.reject-btn').onclick = () => {
                modal.remove();
                resolve(false);
            };
        });
    }

    // === MEDIA CONTROLS ===
    toggleVideo() {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                //console.log('📹 Video:', videoTrack.enabled ? 'ON' : 'OFF');
            }
        }
    }

    toggleAudio() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                //console.log('🎤 Audio:', audioTrack.enabled ? 'ON' : 'OFF');
            }
        }
    }

    // === ERROR HANDLING ===
    showUnsupportedMessage() {
        const message = document.createElement('div');
        message.className = 'webrtc-unsupported';
        message.innerHTML = `
            <div class="warning-message">
                ⚠️ WebRTC no está soportado en este navegador
                <p>Para usar las funciones de videollamada, actualiza tu navegador o usa Chrome/Firefox/Safari.</p>
            </div>
        `;
        document.body.appendChild(message);
    }

    showMediaError(error) {
        let message = 'Error accediendo a cámara/micrófono';
        
        if (error.name === 'NotAllowedError') {
            message = 'Permisos de cámara/micrófono denegados';
        } else if (error.name === 'NotFoundError') {
            message = 'No se encontró cámara o micrófono';
        }
        
        this.createModal('Error de Media', `
            <div class="media-error">
                <p>❌ ${message}</p>
                <p>Verifica los permisos del navegador y que los dispositivos estén conectados.</p>
            </div>
        `);
    }

    // === UTILITIES ===
    setupMessageHandlers() {
        // Handle window messages for signaling (demo)
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'webrtc-signaling') {
                this.handleSignalingMessage(event.data.message);
            }
        });
    }

    setupEventListeners() {
        // Handle page unload
        window.addEventListener('beforeunload', () => {
            this.endCall();
        });
    }

    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal webrtc-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">${content}</div>
            </div>
        `;
        
        document.body.appendChild(modal);
        return modal;
    }

    injectWebRTCStyles() {
        if (document.querySelector('#webrtc-styles')) return;

        const style = document.createElement('style');
        style.id = 'webrtc-styles';
        style.textContent = `
            .webrtc-container {
                position: fixed;
                bottom: 20px;
                left: 20px;
                width: 400px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                overflow: hidden;
                z-index: 9998;
            }
            
            .webrtc-panel h4 {
                background: #007bff;
                color: white;
                margin: 0;
                padding: 10px 15px;
                font-size: 16px;
            }
            
            .call-controls {
                padding: 10px;
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
            }
            
            .call-controls button {
                padding: 5px 8px;
                border: 1px solid #007bff;
                background: white;
                color: #007bff;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
                flex: 1;
                min-width: 70px;
            }
            
            .call-controls button:hover {
                background: #007bff;
                color: white;
            }
            
            .call-controls button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .connection-status {
                padding: 5px 15px;
                background: #f8f9fa;
                border-top: 1px solid #dee2e6;
                font-size: 12px;
            }
            
            .status-indicator.connected { color: #28a745; }
            .status-indicator.connecting { color: #ffc107; }
            .status-indicator.disconnected { color: #6c757d; }
            .status-indicator.failed { color: #dc3545; }
            
            .video-container {
                position: relative;
                height: 200px;
                background: #000;
            }
            
            .video-container video {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            #local-video {
                position: absolute;
                top: 10px;
                right: 10px;
                width: 80px;
                height: 60px;
                border: 2px solid white;
                border-radius: 4px;
                z-index: 2;
            }
            
            .chat-container {
                height: 150px;
                display: flex;
                flex-direction: column;
            }
            
            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 10px;
                background: #f8f9fa;
            }
            
            .chat-message {
                margin-bottom: 8px;
                padding: 5px 8px;
                border-radius: 8px;
                max-width: 80%;
            }
            
            .chat-message.local {
                background: #007bff;
                color: white;
                margin-left: auto;
            }
            
            .chat-message.remote {
                background: #e9ecef;
                color: #333;
            }
            
            .message-content {
                font-size: 13px;
            }
            
            .message-time {
                font-size: 10px;
                opacity: 0.7;
                margin-top: 2px;
            }
            
            .chat-input {
                display: flex;
                border-top: 1px solid #dee2e6;
            }
            
            .chat-input input {
                flex: 1;
                border: none;
                padding: 8px 10px;
                font-size: 12px;
            }
            
            .chat-input button {
                background: #007bff;
                color: white;
                border: none;
                padding: 8px 12px;
                cursor: pointer;
            }
            
            .webrtc-modal .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 10000;
            }
            
            .webrtc-modal .modal-content {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 12px;
                max-width: 400px;
                width: 90vw;
                z-index: 10001;
            }
            
            .incoming-call {
                text-align: center;
                padding: 20px;
            }
            
            .call-actions {
                display: flex;
                gap: 10px;
                justify-content: center;
                margin-top: 15px;
            }
            
            .accept-btn {
                background: #28a745;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
            }
            
            .reject-btn {
                background: #dc3545;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
            }
        `;
        
        document.head.appendChild(style);
    }

    // === PUBLIC API ===
    getStatus() {
        return {
            isSupported: this.isSupported,
            connectionState: this.connectionState,
            callState: this.callState,
            hasLocalStream: !!this.localStream,
            hasRemoteStream: !!this.remoteStream,
            chatMessages: this.chatHistory.length
        };
    }
}

// Initialize
let webrtcComm;

document.addEventListener('DOMContentLoaded', () => {
    webrtcComm = new WebRTCCommunication();
    
    // Make globally accessible
    window.webrtcComm = webrtcComm;
});

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebRTCCommunication;
}