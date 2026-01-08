/**
 * 🆘 HELPDESK SERVICE
 * Propósito: Gestión de tickets de soporte (Fase 7 - Semana 54)
 */

const { executeQuery } = require('../config/database');

class HelpdeskService {

    async createTicket(userId, category, subject, initialMessage) {
        // 1. Create Ticket
        const tRes = await executeQuery(`
            INSERT INTO support_tickets (user_id, category, subject)
            VALUES ($1, $2, $3) RETURNING id
        `, [userId, category, subject]);
        const ticketId = tRes[0].id;

        // 2. Add First Message
        await executeQuery(`
            INSERT INTO ticket_messages (ticket_id, sender_id, message_body)
            VALUES ($1, $2, $3)
        `, [ticketId, userId, initialMessage]);

        return { ticketId, status: 'open' };
    }

    async addMessage(ticketId, senderId, message, isInternal = false) {
        // TODO: Validate user has access to this ticket
        const res = await executeQuery(`
            INSERT INTO ticket_messages (ticket_id, sender_id, message_body, is_internal_note)
            VALUES ($1, $2, $3, $4) RETURNING *
        `, [ticketId, senderId, message, isInternal]);

        // Update ticket updated_at
        await executeQuery('UPDATE support_tickets SET updated_at = NOW() WHERE id = $1', [ticketId]);

        return res[0];
    }

    async getMyTickets(userId) {
        return await executeQuery(`
            SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY updated_at DESC
        `, [userId]);
    }

    async getTicketDetails(ticketId, userId) {
        const ticket = await executeQuery('SELECT * FROM support_tickets WHERE id = $1 AND user_id = $2', [ticketId, userId]);
        if (ticket.length === 0) return null;

        const messages = await executeQuery('SELECT * FROM ticket_messages WHERE ticket_id = $1 ORDER BY created_at ASC', [ticketId]);

        return { ticket: ticket[0], messages };
    }
}

module.exports = new HelpdeskService();
