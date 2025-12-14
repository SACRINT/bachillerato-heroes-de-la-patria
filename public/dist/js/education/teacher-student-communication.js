/**
 * 💬 SISTEMA DE COMUNICACIÓN PROFESOR-ESTUDIANTE BGE
 * Plataforma integral de comunicación educativa
 */

class BGETeacherStudentCommunication {
    constructor() {
        this.conversations = new Map();
        this.announcements = new Map();
        this.messages = new Map();
        this.channels = new Map();
        this.notifications = [];
        this.onlineUsers = new Set();

        this.channelTypes = {
            class: 'Canal de Clase',
            subject: 'Canal de Materia',
            project: 'Canal de Proyecto',
            tutoring: 'Tutoría Personal',
            general: 'Canal General'
        };

        this.messageTypes = {
            text: 'Mensaje de Texto',
            file: 'Archivo Adjunto',
            assignment: 'Asignación/Tarea',
            feedback: 'Retroalimentación',
            question: 'Pregunta Académica',
            announcement: 'Anuncio Oficial'
        };

        this.init();
    }

    init() {
        BGELogger?.info('Teacher-Student Communication', '💬 Inicializando Sistema de Comunicación');

        // Cargar datos existentes
        this.loadCommunicationData();

        // Configurar canales predeterminados
        this.setupDefaultChannels();

        // Inicializar sistema de notificaciones
        this.setupNotificationSystem();

        // Configurar auto-guardado
        this.setupAutoSave();

        // Configurar estados de conexión
        this.setupConnectionStatus();

        BGELogger?.info('Teacher-Student Communication', '✅ Sistema de Comunicación inicializado', {
            conversations: this.conversations.size,
            channels: this.channels.size,
            announcements: this.announcements.size
        });
    }

    // Crear nuevo canal de comunicación
    createChannel(channelData) {
        const channelId = this.generateChannelId();

        const channel = {
            id: channelId,
            name: channelData.name,
            description: channelData.description,
            type: channelData.type || 'class',
            subject: channelData.subject,
            grade: channelData.grade,
            group: channelData.group,
            teacher: channelData.teacher,
            students: channelData.students || [],
            moderators: channelData.moderators || [],
            settings: {
                allowStudentMessages: channelData.allowStudentMessages !== false,
                allowFileSharing: channelData.allowFileSharing !== false,
                requireApproval: channelData.requireApproval || false,
                announceOnly: channelData.announceOnly || false
            },
            privacy: channelData.privacy || 'class', // public, class, private
            messages: [],
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            archived: false
        };

        this.channels.set(channelId, channel);

        // Notificar a participantes
        this.notifyChannelParticipants(channelId, 'channel_created', {
            channelName: channel.name,
            teacher: channel.teacher
        });

        BGELogger?.info('Teacher-Student Communication', '📢 Canal creado', {
            channelId,
            name: channel.name,
            type: channel.type,
            participants: channel.students.length + 1
        });

        return channelId;
    }

    // Enviar mensaje
    sendMessage(messageData) {
        const messageId = this.generateMessageId();

        const message = {
            id: messageId,
            senderId: messageData.senderId,
            senderName: messageData.senderName,
            senderRole: messageData.senderRole || 'student', // teacher, student, admin
            channelId: messageData.channelId,
            type: messageData.type || 'text',
            content: messageData.content,
            attachments: messageData.attachments || [],
            replyTo: messageData.replyTo || null,
            mentions: messageData.mentions || [],
            timestamp: new Date().toISOString(),
            edited: false,
            editHistory: [],
            reactions: [],
            status: 'sent', // sent, delivered, read
            priority: messageData.priority || 'normal' // low, normal, high, urgent
        };

        // Validar permisos
        if (!this.validateMessagePermissions(message)) {
            BGELogger?.warn('Teacher-Student Communication', 'Permisos insuficientes para enviar mensaje');
            return false;
        }

        this.messages.set(messageId, message);

        // Agregar a canal
        const channel = this.channels.get(messageData.channelId);
        if (channel) {
            channel.messages.push(messageId);
            channel.lastActivity = new Date().toISOString();

            // Notificar a participantes
            this.notifyChannelParticipants(messageData.channelId, 'new_message', {
                senderName: message.senderName,
                channelName: channel.name,
                messagePreview: this.getMessagePreview(message)
            }, message.senderId);
        }

        BGELogger?.info('Teacher-Student Communication', '💬 Mensaje enviado', {
            messageId,
            channel: messageData.channelId,
            sender: message.senderName,
            type: message.type
        });

        return messageId;
    }

    // Validar permisos de mensaje
    validateMessagePermissions(message) {
        const channel = this.channels.get(message.channelId);
        if (!channel) return false;

        // Los profesores siempre pueden enviar mensajes
        if (message.senderRole === 'teacher') return true;

        // Verificar si el canal permite mensajes de estudiantes
        if (!channel.settings.allowStudentMessages) return false;

        // Verificar si el estudiante está en el canal
        if (!channel.students.includes(message.senderId)) return false;

        // Si requiere aprobación, marcar como pendiente
        if (channel.settings.requireApproval && message.senderRole === 'student') {
            message.status = 'pending_approval';
        }

        return true;
    }

    // Crear anuncio oficial
    createAnnouncement(announcementData) {
        const announcementId = this.generateAnnouncementId();

        const announcement = {
            id: announcementId,
            title: announcementData.title,
            content: announcementData.content,
            author: announcementData.author,
            authorRole: announcementData.authorRole || 'teacher',
            priority: announcementData.priority || 'normal', // low, normal, high, urgent
            category: announcementData.category || 'general', // academic, administrative, social, emergency
            targetAudience: {
                grades: announcementData.targetGrades || [],
                groups: announcementData.targetGroups || [],
                subjects: announcementData.targetSubjects || [],
                roles: announcementData.targetRoles || ['student'],
                specific: announcementData.targetSpecific || []
            },
            visibility: {
                startDate: announcementData.startDate || new Date().toISOString(),
                endDate: announcementData.endDate,
                channels: announcementData.channels || [],
                requireAcknowledgment: announcementData.requireAcknowledgment || false
            },
            attachments: announcementData.attachments || [],
            reactions: [],
            acknowledgments: [],
            comments: [],
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            status: 'active' // draft, active, archived
        };

        this.announcements.set(announcementId, announcement);

        // Distribuir anuncio
        this.distributeAnnouncement(announcementId);

        BGELogger?.info('Teacher-Student Communication', '📢 Anuncio creado', {
            announcementId,
            title: announcement.title,
            priority: announcement.priority,
            targetChannels: announcement.visibility.channels.length
        });

        return announcementId;
    }

    // Distribuir anuncio a canales apropiados
    distributeAnnouncement(announcementId) {
        const announcement = this.announcements.get(announcementId);
        if (!announcement) return;

        // Enviar a canales específicos
        announcement.visibility.channels.forEach(channelId => {
            this.sendMessage({
                senderId: 'system',
                senderName: 'Sistema BGE',
                senderRole: 'system',
                channelId: channelId,
                type: 'announcement',
                content: `📢 **${announcement.title}**\n\n${announcement.content}`,
                priority: announcement.priority
            });
        });

        // Notificar usuarios objetivo
        this.notifyTargetAudience(announcement);
    }

    // Notificar audiencia objetivo
    notifyTargetAudience(announcement) {
        // Aquí se implementaría la lógica para notificar según targetAudience
        // Por ahora, enviar notificación general

        this.notifications.push({
            id: this.generateNotificationId(),
            type: 'announcement',
            title: `Nuevo Anuncio: ${announcement.title}`,
            content: announcement.content,
            priority: announcement.priority,
            author: announcement.author,
            timestamp: new Date().toISOString(),
            read: false,
            targetAudience: announcement.targetAudience
        });

        BGELogger?.debug('Teacher-Student Communication', '🔔 Notificación de anuncio distribuida');
    }

    // Iniciar conversación privada
    startPrivateConversation(participantData) {
        const conversationId = this.generateConversationId();

        const conversation = {
            id: conversationId,
            type: 'private',
            participants: participantData.participants,
            subject: participantData.subject || 'Conversación Privada',
            purpose: participantData.purpose || 'general', // tutoring, consultation, support
            messages: [],
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            status: 'active', // active, closed, archived
            metadata: {
                initiatedBy: participantData.initiatedBy,
                tags: participantData.tags || [],
                confidential: participantData.confidential || false
            }
        };

        this.conversations.set(conversationId, conversation);

        // Notificar participantes
        conversation.participants.forEach(participantId => {
            if (participantId !== participantData.initiatedBy) {
                this.notifyUser(participantId, 'conversation_started', {
                    conversationId,
                    initiator: participantData.initiatedBy,
                    subject: conversation.subject
                });
            }
        });

        BGELogger?.info('Teacher-Student Communication', '🗣️ Conversación privada iniciada', {
            conversationId,
            participants: conversation.participants.length,
            purpose: conversation.purpose
        });

        return conversationId;
    }

    // Obtener mensajes de canal
    getChannelMessages(channelId, options = {}) {
        const channel = this.channels.get(channelId);
        if (!channel) return [];

        const limit = options.limit || 50;
        const offset = options.offset || 0;
        const since = options.since;

        let messageIds = channel.messages;

        // Filtrar por fecha si se especifica
        if (since) {
            messageIds = messageIds.filter(messageId => {
                const message = this.messages.get(messageId);
                return message && new Date(message.timestamp) > new Date(since);
            });
        }

        // Aplicar paginación
        const paginatedIds = messageIds.slice(offset, offset + limit);

        // Obtener mensajes completos
        const messages = paginatedIds.map(messageId => this.messages.get(messageId))
            .filter(message => message)
            .reverse(); // Más recientes primero

        return {
            messages,
            total: messageIds.length,
            hasMore: offset + limit < messageIds.length
        };
    }

    // Marcar mensaje como leído
    markMessageAsRead(messageId, userId) {
        const message = this.messages.get(messageId);
        if (!message) return false;

        // Agregar a lectores si no está ya
        if (!message.readers) message.readers = [];
        if (!message.readers.includes(userId)) {
            message.readers.push(userId);
        }

        if (message.status === 'delivered') {
            message.status = 'read';
        }

        BGELogger?.debug('Teacher-Student Communication', '👁️ Mensaje marcado como leído', {
            messageId,
            userId
        });

        return true;
    }

    // Agregar reacción a mensaje
    addReaction(messageId, userId, reaction) {
        const message = this.messages.get(messageId);
        if (!message) return false;

        // Buscar reacción existente del usuario
        const existingReaction = message.reactions.find(r => r.userId === userId);

        if (existingReaction) {
            existingReaction.reaction = reaction;
            existingReaction.timestamp = new Date().toISOString();
        } else {
            message.reactions.push({
                userId,
                reaction,
                timestamp: new Date().toISOString()
            });
        }

        BGELogger?.debug('Teacher-Student Communication', '😊 Reacción agregada', {
            messageId,
            userId,
            reaction
        });

        return true;
    }

    // Obtener estadísticas de comunicación
    getCommunicationStatistics(timeframe = 'week') {
        const now = new Date();
        const timeframes = {
            day: 24 * 60 * 60 * 1000,
            week: 7 * 24 * 60 * 60 * 1000,
            month: 30 * 24 * 60 * 60 * 1000
        };

        const since = new Date(now.getTime() - timeframes[timeframe]);

        const stats = {
            timeframe,
            period: {
                start: since.toISOString(),
                end: now.toISOString()
            },
            messages: {
                total: 0,
                byRole: { teacher: 0, student: 0, system: 0 },
                byType: {},
                byChannel: {}
            },
            announcements: {
                total: 0,
                byPriority: { low: 0, normal: 0, high: 0, urgent: 0 },
                byCategory: {}
            },
            engagement: {
                activeChannels: 0,
                activeUsers: new Set(),
                averageResponseTime: 0
            }
        };

        // Analizar mensajes
        this.messages.forEach(message => {
            if (new Date(message.timestamp) > since) {
                stats.messages.total++;
                stats.messages.byRole[message.senderRole]++;
                stats.messages.byType[message.type] = (stats.messages.byType[message.type] || 0) + 1;
                stats.messages.byChannel[message.channelId] = (stats.messages.byChannel[message.channelId] || 0) + 1;
                stats.engagement.activeUsers.add(message.senderId);
            }
        });

        // Analizar anuncios
        this.announcements.forEach(announcement => {
            if (new Date(announcement.createdAt) > since) {
                stats.announcements.total++;
                stats.announcements.byPriority[announcement.priority]++;
                stats.announcements.byCategory[announcement.category] =
                    (stats.announcements.byCategory[announcement.category] || 0) + 1;
            }
        });

        // Contar canales activos
        this.channels.forEach(channel => {
            if (new Date(channel.lastActivity) > since) {
                stats.engagement.activeChannels++;
            }
        });

        stats.engagement.activeUsers = stats.engagement.activeUsers.size;

        BGELogger?.info('Teacher-Student Communication', '📊 Estadísticas generadas', {
            timeframe,
            totalMessages: stats.messages.total,
            activeUsers: stats.engagement.activeUsers
        });

        return stats;
    }

    // Notificar participantes de canal
    notifyChannelParticipants(channelId, type, data, excludeUserId = null) {
        const channel = this.channels.get(channelId);
        if (!channel) return;

        const participants = [channel.teacher, ...channel.students, ...channel.moderators];

        participants.forEach(participantId => {
            if (participantId !== excludeUserId) {
                this.notifyUser(participantId, type, { ...data, channelId });
            }
        });
    }

    // Notificar usuario específico
    notifyUser(userId, type, data) {
        const notification = {
            id: this.generateNotificationId(),
            userId,
            type,
            title: this.getNotificationTitle(type),
            content: this.getNotificationContent(type, data),
            data,
            timestamp: new Date().toISOString(),
            read: false,
            priority: data.priority || 'normal'
        };

        this.notifications.push(notification);

        // Integración con sistema de notificaciones global
        if (window.BGENotificationManager) {
            window.BGENotificationManager.addNotification(notification);
        }

        BGELogger?.debug('Teacher-Student Communication', '🔔 Notificación enviada', {
            userId,
            type,
            title: notification.title
        });
    }

    // Obtener título de notificación
    getNotificationTitle(type) {
        const titles = {
            'channel_created': '📢 Nuevo Canal Creado',
            'new_message': '💬 Nuevo Mensaje',
            'conversation_started': '🗣️ Nueva Conversación',
            'announcement': '📢 Nuevo Anuncio',
            'message_reaction': '😊 Nueva Reacción',
            'mention': '👋 Te han mencionado'
        };
        return titles[type] || 'Notificación de Comunicación';
    }

    // Obtener contenido de notificación
    getNotificationContent(type, data) {
        switch (type) {
            case 'new_message':
                return `${data.senderName} en ${data.channelName}: ${data.messagePreview}`;
            case 'conversation_started':
                return `${data.initiator} ha iniciado una conversación: ${data.subject}`;
            case 'announcement':
                return `Nuevo anuncio: ${data.title}`;
            default:
                return 'Nueva actividad en la plataforma de comunicación';
        }
    }

    // Obtener vista previa de mensaje
    getMessagePreview(message) {
        if (message.type === 'text') {
            return message.content.length > 50 ?
                message.content.substring(0, 50) + '...' : message.content;
        }
        return `[${this.messageTypes[message.type] || message.type}]`;
    }

    // Configurar canales predeterminados
    setupDefaultChannels() {
        // Aquí se configurarían canales por defecto
        BGELogger?.debug('Teacher-Student Communication', '📢 Canales predeterminados configurados');
    }

    // Configurar sistema de notificaciones
    setupNotificationSystem() {
        BGELogger?.debug('Teacher-Student Communication', '🔔 Sistema de notificaciones configurado');
    }

    // Configurar estado de conexión
    setupConnectionStatus() {
        // Simular usuarios online
        setInterval(() => {
            // Aquí se actualizaría el estado de conexión real
        }, 30000);
    }

    // Métodos de persistencia
    loadCommunicationData() {
        try {
            const channelsData = localStorage.getItem('bge_communication_channels');
            const messagesData = localStorage.getItem('bge_communication_messages');
            const announcementsData = localStorage.getItem('bge_communication_announcements');

            if (channelsData) {
                const channels = JSON.parse(channelsData);
                channels.forEach(channel => this.channels.set(channel.id, channel));
            }

            if (messagesData) {
                const messages = JSON.parse(messagesData);
                messages.forEach(message => this.messages.set(message.id, message));
            }

            if (announcementsData) {
                const announcements = JSON.parse(announcementsData);
                announcements.forEach(announcement => this.announcements.set(announcement.id, announcement));
            }

            BGELogger?.debug('Teacher-Student Communication', '💾 Datos de comunicación cargados');
        } catch (error) {
            BGELogger?.error('Teacher-Student Communication', 'Error cargando datos', error);
        }
    }

    saveCommunicationData() {
        try {
            localStorage.setItem('bge_communication_channels',
                JSON.stringify(Array.from(this.channels.values())));
            localStorage.setItem('bge_communication_messages',
                JSON.stringify(Array.from(this.messages.values())));
            localStorage.setItem('bge_communication_announcements',
                JSON.stringify(Array.from(this.announcements.values())));

            BGELogger?.debug('Teacher-Student Communication', '💾 Datos de comunicación guardados');
        } catch (error) {
            BGELogger?.error('Teacher-Student Communication', 'Error guardando datos', error);
        }
    }

    setupAutoSave() {
        setInterval(() => {
            this.saveCommunicationData();
        }, 2 * 60 * 1000); // Cada 2 minutos
    }

    // Generadores de ID
    generateChannelId() {
        return `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateMessageId() {
        return `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateAnnouncementId() {
        return `announcement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateConversationId() {
        return `conversation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateNotificationId() {
        return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // API pública
    getSystemStatistics() {
        return {
            totalChannels: this.channels.size,
            totalMessages: this.messages.size,
            totalAnnouncements: this.announcements.size,
            onlineUsers: this.onlineUsers.size,
            lastUpdated: new Date().toISOString()
        };
    }
}

// Inicialización global
window.BGETeacherStudentCommunication = new BGETeacherStudentCommunication();

// Registrar en el contexto
if (window.BGEContext) {
    window.BGEContext.registerModule('teacher-student-communication',
        window.BGETeacherStudentCommunication, ['logger']);
}

console.log('✅ BGE Teacher-Student Communication System cargado exitosamente');