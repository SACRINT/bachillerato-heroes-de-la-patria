/**
 * 🧪 INTEGRATION TESTS - MULTI-FORMAT
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
const multiFormatRoutes = require('../../routes/multi-format');

const app = express();
app.use(bodyParser.json());
app.use('/api/content', multiFormatRoutes);

describe('Multi-Format Content Integration Tests', () => {

    test('GET /api/content/:type/:id should return content with progress', async () => {
        // Mock content fetch
        executeQuery.mockResolvedValueOnce([{ id: 1, title: 'Test PDF', type: 'document' }]);

        // Mock progress fetch
        executeQuery.mockResolvedValueOnce([{ percent_complete: 50 }]);

        const response = await request(app).get('/api/content/document/1');

        expect(response.status).toBe(200);
        expect(response.body.data.title).toBe('Test PDF');
        expect(response.body.data.userProgress.percent_complete).toBe(50);
    });

    test('POST /api/content/:type/:id/progress should update progress', async () => {
        // Mock upsert
        executeQuery.mockResolvedValueOnce([{ is_completed: true, percent_complete: 100 }]);

        const response = await request(app)
            .post('/api/content/document/1/progress')
            .send({ progressData: { page: 15 }, percentComplete: 100 });

        expect(response.status).toBe(200);
        expect(response.body.data.is_completed).toBe(true);
    });
});
