/**
 * 🧪 INTEGRATION TESTS - VIRTUAL LABS
 */

const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// Mock database
jest.mock('../../config/database', () => ({
    executeQuery: jest.fn(),
}));

// Mock auth
jest.mock('../../middleware/auth', () => ({
    authenticateToken: (req, res, next) => {
        req.user = { id: 1, role: 'student' };
        next();
    }
}));

const { executeQuery } = require('../../config/database');
const labsRoutes = require('../../routes/virtual-labs');

const app = express();
app.use(bodyParser.json());
app.use('/api/labs', labsRoutes);

describe('Virtual Labs Integration Tests', () => {

    test('GET /api/labs should return active labs', async () => {
        executeQuery.mockResolvedValueOnce([{ id: 1, title: 'Física I' }]);

        const response = await request(app).get('/api/labs');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
    });

    test('POST /api/labs/:id/start should create a new session', async () => {
        executeQuery.mockResolvedValueOnce([{ id: 100, status: 'in_progress' }]);

        const response = await request(app).post('/api/labs/1/start');

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(100);
        expect(response.body.data.status).toBe('in_progress');
    });

    test('POST /api/labs/session/:id/log should save measurements', async () => {
        // Mock verify user ownership
        executeQuery.mockResolvedValueOnce([{ user_id: 1 }]);
        // Mock insert measurement
        executeQuery.mockResolvedValueOnce([{ id: 50, value: 9.81 }]);

        const response = await request(app)
            .post('/api/labs/session/100/log')
            .send({ variable: 'gravity', value: 9.81, timestamp: 1000 });

        expect(response.status).toBe(200);
        expect(response.body.data.value).toBe(9.81);
    });
});
