/**
 * 🧪 SANITY TESTS - MOBILE ROUTES
 *
 * Propósito: Verificar que las rutas de mobile cargan correctamente y no tienen errores de importación.
 * Fecha: 07 Enero 2026
 */

const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// Mock del backend config/database
jest.mock('../../config/database', () => ({
    pool: { query: jest.fn(), connect: jest.fn() },
    executeQuery: jest.fn().mockResolvedValue([])
}));

// Mock de autenticación
jest.mock('../../middleware/auth', () => ({
    authenticateToken: (req, res, next) => {
        req.user = { id: 1, role: 'student' };
        next();
    }
}));

// Mock de servicios para evitar errores de lógica, solo queremos ver si cargan
jest.mock('../../services/mobile-social.service', () => ({
    getActiveStudyRooms: jest.fn().mockResolvedValue([])
}));
jest.mock('../../services/mobile-gamification.service', () => ({
    spinDailyWheel: jest.fn().mockResolvedValue({})
}));
jest.mock('../../services/offline-sync.service', () => ({
    getDataVersions: jest.fn().mockResolvedValue({})
}));
jest.mock('../../services/mobile-widget.service', () => ({
    getStreakWidgetData: jest.fn().mockResolvedValue({})
}));

const mobileSocialRoutes = require('../../routes/mobile/social');
const mobileGamificationRoutes = require('../../routes/mobile/gamification');
const mobileSyncRoutes = require('../../routes/mobile/sync');
const mobileWidgetRoutes = require('../../routes/mobile/widgets');

const app = express();
app.use(bodyParser.json());
app.use('/api/social', mobileSocialRoutes);
app.use('/api/gamification', mobileGamificationRoutes);
app.use('/api/sync', mobileSyncRoutes);
app.use('/api/widgets', mobileWidgetRoutes);

describe('Mobile Routes Sanity Check', () => {
    test('Social routes should load and respond', async () => {
        const response = await request(app).get('/api/social/rooms');
        expect(response.status).not.toBe(404);
        expect(response.status).not.toBe(500); // Si es 200, los imports están OK
    });

    test('Gamification routes should load and respond', async () => {
        const response = await request(app).post('/api/gamification/spin');
        expect(response.status).not.toBe(404);
        expect(response.status).not.toBe(500);
    });

    test('Sync routes should load and respond', async () => {
        const response = await request(app).get('/api/sync/versions');
        expect(response.status).not.toBe(404);
        expect(response.status).not.toBe(500);
    });

    test('Widget routes should load and respond', async () => {
        const response = await request(app).get('/api/widgets/streak');
        expect(response.status).not.toBe(404);
        expect(response.status).not.toBe(500);
    });
});
