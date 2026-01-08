/**
 * 🧪 INTEGRATION TESTS - CONTENT STUDIO
 */

const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// Mock database
jest.mock('../../config/database', () => ({
    executeQuery: jest.fn(),
    executeTransaction: jest.fn()
}));

// Mock auth
jest.mock('../../middleware/auth', () => ({
    authenticateToken: (req, res, next) => {
        req.user = { id: 1, role: 'teacher' };
        next();
    }
}));

const { executeQuery } = require('../../config/database');
const studioRoutes = require('../../routes/studio');

const app = express();
app.use(bodyParser.json());
app.use('/api/studio', studioRoutes);

describe('Content Studio Integration Tests', () => {

    test('POST /api/studio/content/create should create new content', async () => {
        const mockContent = { id: 10, title: 'Test Lesson', content_json: { elements: [] } };

        // 1. insert content
        executeQuery.mockResolvedValueOnce([mockContent]);
        // 2. get max version
        executeQuery.mockResolvedValueOnce([{ v: 0 }]);
        // 3. insert version
        executeQuery.mockResolvedValueOnce([{ id: 100 }]);
        // 4. log history
        executeQuery.mockResolvedValueOnce([]);

        const response = await request(app)
            .post('/api/studio/content/create')
            .send({
                title: 'Test Lesson',
                description: 'Description',
                content_json: { elements: [] }
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(10);
    });

    test('GET /api/studio/templates should return active templates', async () => {
        executeQuery.mockResolvedValueOnce([{ id: 1, name: 'Template 1' }]);

        const response = await request(app).get('/api/studio/templates');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].name).toBe('Template 1');
    });
});
