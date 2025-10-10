/**
 * 👨‍👩‍👧‍👦 SERVICIO DE COMUNICACIÓN PADRES-DOCENTES
 * Sistema completo de mensajería, citas y seguimiento académico
 */

const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

class ParentTeacherCommunicationService {
    constructor() {
        this.conversationsFile = path.join(__dirname, '../data/parent_teacher_conversations.json');
        this.appointmentsFile = path.join(__dirname, '../data/appointments.json');
        this.messagesFile = path.join(__dirname, '../data/messages.json');
        this.reportsFile = path.join(__dirname, '../data/academic_reports.json');

        this.conversations = new Map();
        this.appointments = new Map();
        this.messages = new Map();
        this.academicReports = new Map();

        this.init();
    }

    async init() {
        try {
            await this.ensureDataDirectory();
            await this.loadData();
            console.log('👨‍👩‍👧‍👦 [PARENT-TEACHER] Servicio de comunicación inicializado');
        } catch (error) {
            console.error('❌ [PARENT-TEACHER] Error inicializando servicio:', error);
        }
    }

    async ensureDataDirectory() {
        const dataDir = path.join(__dirname, '../data');
        try {
            await fs.access(dataDir);
        } catch {
            await fs.mkdir(dataDir, { recursive: true });
        }
    }

    async loadData() {
        try {
            // Cargar conversaciones
            try {
                const conversationsData = await fs.readFile(this.conversationsFile, 'utf8');
                const conversations = JSON.parse(conversationsData);
                conversations.forEach(conv => {
                    this.conversations.set(conv.id, conv);
                });
            } catch {
                await this.saveConversations();
            }

            // Cargar citas
            try {
                const appointmentsData = await fs.readFile(this.appointmentsFile, 'utf8');
                const appointments = JSON.parse(appointmentsData);
                appointments.forEach(apt => {
                    this.appointments.set(apt.id, apt);
                });
            } catch {
                await this.saveAppointments();
            }

            // Cargar mensajes
            try {
                const messagesData = await fs.readFile(this.messagesFile, 'utf8');
                const messages = JSON.parse(messagesData);
                messages.forEach(msg => {
                    this.messages.set(msg.id, msg);
                });
            } catch {
                await this.saveMessages();
            }

            // Cargar reportes académicos
            try {
                const reportsData = await fs.readFile(this.reportsFile, 'utf8');
                const reports = JSON.parse(reportsData);
                reports.forEach(report => {
                    this.academicReports.set(report.id, report);
                });
            } catch {
                await this.saveReports();
            }

            // Datos de ejemplo si no existen
            if (this.conversations.size === 0) {
                this.createSampleData();
            }

        } catch (error) {
            console.error('❌ Error cargando datos:', error);
        }
    }

    createSampleData() {
        // Crear conversación de ejemplo
        const sampleConversation = {
            id: uuidv4(),
            student_id: 'est-001',
            student_name: 'Juan Pérez García',
            parent_id: 'padre-001',
            parent_name: 'María García',
            teacher_id: 'prof-001',
            teacher_name: 'Prof. Ana López',
            subject: 'Matemáticas',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_message: {
                content: 'Buenos días, me gustaría hablar sobre el progreso de Juan en matemáticas.',
                sender_type: 'parent',
                timestamp: new Date().toISOString()
            }
        };

        this.conversations.set(sampleConversation.id, sampleConversation);

        // Crear mensaje de ejemplo
        const sampleMessage = {
            id: uuidv4(),
            conversation_id: sampleConversation.id,
            sender_id: 'padre-001',
            sender_type: 'parent',
            sender_name: 'María García',
            recipient_id: 'prof-001',
            recipient_type: 'teacher',
            content: 'Buenos días, me gustaría hablar sobre el progreso de Juan en matemáticas.',
            message_type: 'text',
            read: false,
            timestamp: new Date().toISOString(),
            attachments: []
        };

        this.messages.set(sampleMessage.id, sampleMessage);

        // Crear cita de ejemplo
        const sampleAppointment = {
            id: uuidv4(),
            student_id: 'est-001',
            student_name: 'Juan Pérez García',
            parent_id: 'padre-001',
            parent_name: 'María García',
            teacher_id: 'prof-001',
            teacher_name: 'Prof. Ana López',
            subject: 'Matemáticas',
            appointment_date: new Date(Date.now() + 86400000 * 3).toISOString(), // En 3 días
            duration_minutes: 30,
            meeting_type: 'virtual',
            meeting_link: 'https://meet.google.com/abc-defg-hij',
            status: 'scheduled',
            agenda: 'Revisar progreso académico y estrategias de estudio',
            created_at: new Date().toISOString(),
            notes: ''
        };

        this.appointments.set(sampleAppointment.id, sampleAppointment);

        // Crear reporte académico de ejemplo
        const sampleReport = {
            id: uuidv4(),
            student_id: 'est-001',
            student_name: 'Juan Pérez García',
            teacher_id: 'prof-001',
            teacher_name: 'Prof. Ana López',
            subject: 'Matemáticas',
            period: '2024-2025A',
            report_type: 'progress',
            content: {
                current_grade: 8.5,
                attendance: '95%',
                behavior: 'Excelente',
                strengths: ['Comprensión de conceptos', 'Participación en clase'],
                areas_improvement: ['Resolver problemas complejos', 'Organización de tareas'],
                recommendations: 'Continuar con el buen trabajo, dedicar más tiempo a práctica extra'
            },
            created_at: new Date().toISOString(),
            shared_with_parent: true,
            parent_feedback: null
        };

        this.academicReports.set(sampleReport.id, sampleReport);

        this.saveAllData();
    }

    // ============================================
    // GESTIÓN DE CONVERSACIONES
    // ============================================

    async createConversation(data) {
        const conversation = {
            id: uuidv4(),
            student_id: data.student_id,
            student_name: data.student_name,
            parent_id: data.parent_id,
            parent_name: data.parent_name,
            teacher_id: data.teacher_id,
            teacher_name: data.teacher_name,
            subject: data.subject || 'General',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_message: null
        };

        this.conversations.set(conversation.id, conversation);
        await this.saveConversations();

        return conversation;
    }

    async getConversations(userId, userType) {
        const userConversations = Array.from(this.conversations.values()).filter(conv => {
            if (userType === 'parent') {
                return conv.parent_id === userId;
            } else if (userType === 'teacher') {
                return conv.teacher_id === userId;
            } else if (userType === 'student') {
                return conv.student_id === userId;
            }
            return false;
        });

        return userConversations.sort((a, b) =>
            new Date(b.updated_at) - new Date(a.updated_at)
        );
    }

    async getConversationById(conversationId) {
        return this.conversations.get(conversationId);
    }

    async updateConversation(conversationId, updates) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) return null;

        Object.assign(conversation, updates, {
            updated_at: new Date().toISOString()
        });

        this.conversations.set(conversationId, conversation);
        await this.saveConversations();

        return conversation;
    }

    // ============================================
    // GESTIÓN DE MENSAJES
    // ============================================

    async sendMessage(data) {
        const message = {
            id: uuidv4(),
            conversation_id: data.conversation_id,
            sender_id: data.sender_id,
            sender_type: data.sender_type,
            sender_name: data.sender_name,
            recipient_id: data.recipient_id,
            recipient_type: data.recipient_type,
            content: data.content,
            message_type: data.message_type || 'text',
            read: false,
            timestamp: new Date().toISOString(),
            attachments: data.attachments || []
        };

        this.messages.set(message.id, message);

        // Actualizar última mensaje en conversación
        const conversation = this.conversations.get(data.conversation_id);
        if (conversation) {
            conversation.last_message = {
                content: message.content,
                sender_type: message.sender_type,
                timestamp: message.timestamp
            };
            conversation.updated_at = message.timestamp;
            this.conversations.set(conversation.id, conversation);
            await this.saveConversations();
        }

        await this.saveMessages();
        return message;
    }

    async getMessages(conversationId, limit = 50, offset = 0) {
        const conversationMessages = Array.from(this.messages.values())
            .filter(msg => msg.conversation_id === conversationId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(offset, offset + limit);

        return conversationMessages;
    }

    async markMessageAsRead(messageId, userId) {
        const message = this.messages.get(messageId);
        if (!message || message.recipient_id !== userId) return false;

        message.read = true;
        this.messages.set(messageId, message);
        await this.saveMessages();

        return true;
    }

    async markConversationAsRead(conversationId, userId) {
        const conversationMessages = Array.from(this.messages.values())
            .filter(msg => msg.conversation_id === conversationId && msg.recipient_id === userId);

        conversationMessages.forEach(msg => {
            msg.read = true;
            this.messages.set(msg.id, msg);
        });

        await this.saveMessages();
        return conversationMessages.length;
    }

    // ============================================
    // GESTIÓN DE CITAS
    // ============================================

    async scheduleAppointment(data) {
        const appointment = {
            id: uuidv4(),
            student_id: data.student_id,
            student_name: data.student_name,
            parent_id: data.parent_id,
            parent_name: data.parent_name,
            teacher_id: data.teacher_id,
            teacher_name: data.teacher_name,
            subject: data.subject,
            appointment_date: data.appointment_date,
            duration_minutes: data.duration_minutes || 30,
            meeting_type: data.meeting_type || 'virtual',
            meeting_link: data.meeting_link || null,
            status: 'scheduled',
            agenda: data.agenda || '',
            created_at: new Date().toISOString(),
            notes: ''
        };

        this.appointments.set(appointment.id, appointment);
        await this.saveAppointments();

        return appointment;
    }

    async getAppointments(userId, userType, filters = {}) {
        let userAppointments = Array.from(this.appointments.values()).filter(apt => {
            if (userType === 'parent') {
                return apt.parent_id === userId;
            } else if (userType === 'teacher') {
                return apt.teacher_id === userId;
            } else if (userType === 'student') {
                return apt.student_id === userId;
            }
            return false;
        });

        // Aplicar filtros
        if (filters.status) {
            userAppointments = userAppointments.filter(apt => apt.status === filters.status);
        }

        if (filters.date_from) {
            userAppointments = userAppointments.filter(apt =>
                new Date(apt.appointment_date) >= new Date(filters.date_from)
            );
        }

        if (filters.date_to) {
            userAppointments = userAppointments.filter(apt =>
                new Date(apt.appointment_date) <= new Date(filters.date_to)
            );
        }

        return userAppointments.sort((a, b) =>
            new Date(a.appointment_date) - new Date(b.appointment_date)
        );
    }

    async updateAppointment(appointmentId, updates) {
        const appointment = this.appointments.get(appointmentId);
        if (!appointment) return null;

        Object.assign(appointment, updates);
        this.appointments.set(appointmentId, appointment);
        await this.saveAppointments();

        return appointment;
    }

    async cancelAppointment(appointmentId, cancelledBy) {
        const appointment = this.appointments.get(appointmentId);
        if (!appointment) return null;

        appointment.status = 'cancelled';
        appointment.cancelled_by = cancelledBy;
        appointment.cancelled_at = new Date().toISOString();

        this.appointments.set(appointmentId, appointment);
        await this.saveAppointments();

        return appointment;
    }

    // ============================================
    // GESTIÓN DE REPORTES ACADÉMICOS
    // ============================================

    async createAcademicReport(data) {
        const report = {
            id: uuidv4(),
            student_id: data.student_id,
            student_name: data.student_name,
            teacher_id: data.teacher_id,
            teacher_name: data.teacher_name,
            subject: data.subject,
            period: data.period,
            report_type: data.report_type || 'progress',
            content: data.content,
            created_at: new Date().toISOString(),
            shared_with_parent: data.shared_with_parent || false,
            parent_feedback: null
        };

        this.academicReports.set(report.id, report);
        await this.saveReports();

        return report;
    }

    async getAcademicReports(userId, userType, filters = {}) {
        let userReports = Array.from(this.academicReports.values()).filter(report => {
            if (userType === 'parent') {
                return report.shared_with_parent &&
                       this.isParentOfStudent(userId, report.student_id);
            } else if (userType === 'teacher') {
                return report.teacher_id === userId;
            } else if (userType === 'student') {
                return report.student_id === userId;
            }
            return false;
        });

        // Aplicar filtros
        if (filters.subject) {
            userReports = userReports.filter(report => report.subject === filters.subject);
        }

        if (filters.period) {
            userReports = userReports.filter(report => report.period === filters.period);
        }

        if (filters.report_type) {
            userReports = userReports.filter(report => report.report_type === filters.report_type);
        }

        return userReports.sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        );
    }

    async addParentFeedback(reportId, parentId, feedback) {
        const report = this.academicReports.get(reportId);
        if (!report || !this.isParentOfStudent(parentId, report.student_id)) {
            return null;
        }

        report.parent_feedback = {
            content: feedback,
            parent_id: parentId,
            submitted_at: new Date().toISOString()
        };

        this.academicReports.set(reportId, report);
        await this.saveReports();

        return report;
    }

    // ============================================
    // UTILIDADES
    // ============================================

    isParentOfStudent(parentId, studentId) {
        // En un sistema real, esto se verificaría contra la base de datos
        // Por ahora, asumimos que padre-001 es padre de est-001
        const parentStudentMap = {
            'padre-001': ['est-001'],
            'padre-002': ['est-002']
        };

        return parentStudentMap[parentId]?.includes(studentId) || false;
    }

    async getUnreadMessagesCount(userId) {
        const unreadMessages = Array.from(this.messages.values())
            .filter(msg => msg.recipient_id === userId && !msg.read);

        return unreadMessages.length;
    }

    async getUpcomingAppointments(userId, userType, days = 7) {
        const now = new Date();
        const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));

        const appointments = await this.getAppointments(userId, userType, {
            status: 'scheduled'
        });

        return appointments.filter(apt => {
            const aptDate = new Date(apt.appointment_date);
            return aptDate >= now && aptDate <= futureDate;
        });
    }

    async getCommunicationStats(userId, userType) {
        const conversations = await this.getConversations(userId, userType);
        const unreadCount = await this.getUnreadMessagesCount(userId);
        const upcomingAppointments = await this.getUpcomingAppointments(userId, userType);

        return {
            total_conversations: conversations.length,
            active_conversations: conversations.filter(c => c.status === 'active').length,
            unread_messages: unreadCount,
            upcoming_appointments: upcomingAppointments.length,
            last_activity: conversations.length > 0 ? conversations[0].updated_at : null
        };
    }

    // ============================================
    // PERSISTENCIA DE DATOS
    // ============================================

    async saveConversations() {
        const data = Array.from(this.conversations.values());
        await fs.writeFile(this.conversationsFile, JSON.stringify(data, null, 2));
    }

    async saveAppointments() {
        const data = Array.from(this.appointments.values());
        await fs.writeFile(this.appointmentsFile, JSON.stringify(data, null, 2));
    }

    async saveMessages() {
        const data = Array.from(this.messages.values());
        await fs.writeFile(this.messagesFile, JSON.stringify(data, null, 2));
    }

    async saveReports() {
        const data = Array.from(this.academicReports.values());
        await fs.writeFile(this.reportsFile, JSON.stringify(data, null, 2));
    }

    async saveAllData() {
        await Promise.all([
            this.saveConversations(),
            this.saveAppointments(),
            this.saveMessages(),
            this.saveReports()
        ]);
    }
}

// Singleton
let parentTeacherServiceInstance = null;

function getParentTeacherCommunicationService() {
    if (!parentTeacherServiceInstance) {
        parentTeacherServiceInstance = new ParentTeacherCommunicationService();
    }
    return parentTeacherServiceInstance;
}

module.exports = {
    ParentTeacherCommunicationService,
    getParentTeacherCommunicationService
};