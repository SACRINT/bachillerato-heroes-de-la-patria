/**
 * 🧪 INTEGRATION TESTS - NOTIFICATIONS SYSTEM (REFIXED)
 *
 * Propósito: Validar el flujo completo de notificaciones (Rutas + Servicio)
 * Fecha: 07 Enero 2026
 */

const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// Mock del backend config/database
jest.mock('../../config/database', () => ({
    pool: {
        query: jest.fn(),
        connect: jest.fn()
    },
    // executeQuery en el código real retorna result.rows
    executeQuery: jest.fn(),
    query: jest.fn()
}));

// Mock de autenticación
jest.mock('../../middleware/auth', () => ({
    authenticateToken: (req, res, next) => {
        req.user = { id: 1, role: 'student' };
        next();
    }
}));

const { executeQuery } = require('../../config/database');
const notificationService = require('../../services/notification.service');
const notificationRoutes = require('../../routes/notifications');

const app = express();
app.use(bodyParser.json());
app.use('/api/notifications', notificationRoutes);

describe('Notifications Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/notifications', () => {
        test('debe obtener las notificaciones del usuario autenticado', async () => {
            const mockNotifications = [
                { id: 1, type: 'info', title: 'Test 1', message: 'Message 1', is_read: false },
                { id: 2, type: 'alert', title: 'Test 2', message: 'Message 2', is_read: true }
            ];

            // Mock de executeQuery (usado por el servicio)
            // Primera llamada: listado
            executeQuery.mockResolvedValueOnce(mockNotifications);
            // Segunda llamada: conteo unread
            executeQuery.mockResolvedValueOnce([{ c: '1' }]);

            const response = await request(app).get('/api/notifications');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.items).toHaveLength(2);
            expect(response.body.data.unreadCount).toBe(1);
        });

        test('debe manejar errores de la base de datos', async () => {
            executeQuery.mockRejectedValue(new Error('DB Error'));

            const response = await request(app).get('/api/notifications');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('DB Error');
        });
    });

    describe('POST /api/notifications/:id/read', () => {
        test('debe marcar una notificación como leída', async () => {
            executeQuery.mockResolvedValue({ rowCount: 1 });

            const response = await request(app).post('/api/notifications/1/read');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(executeQuery).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE notifications SET is_read = TRUE'),
                [expect.any(String), 1] // notificationId, userId
            );
        });
    });

    describe('POST /api/notifications/read-all', () => {
        test('debe marcar todas las notificaciones como leídas', async () => {
            executeQuery.mockResolvedValue({ rowCount: 5 });

            const response = await request(app).post('/api/notifications/read-all');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(executeQuery).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE notifications SET is_read = TRUE'),
                [1]
            );
        });
    });

    describe('Notification Service', () => {
        test('createNotification debe insertar una nueva notificación', async () => {
            executeQuery.mockResolvedValue([{ id: 100 }]);

            const result = await notificationService.createNotification(
                1, 'achievement', 'Nuevo Achievement', 'Has ganado una medalla'
            );

            expect(result[0].id).toBe(100);
            expect(executeQuery).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO notifications'),
                expect.arrayContaining([1, 'achievement', 'Nuevo Achievement', 'Has ganado una medalla'])
            );
        });
    });
});
