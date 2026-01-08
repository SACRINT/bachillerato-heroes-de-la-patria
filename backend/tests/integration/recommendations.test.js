/**
 * 🧪 INTEGRATION TESTS - RECOMMENDATION ENGINE
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
const recRoutes = require('../../routes/recommendations');

const app = express();
app.use(bodyParser.json());
app.use('/api/recommendations', recRoutes);

describe('Recommendation Engine Integration Tests', () => {

    test('GET /api/recommendations should return personalized list', async () => {
        // Mock get cached recommendations
        executeQuery.mockResolvedValueOnce([{
            recommended_content_id: 1,
            recommended_content_type: 'video',
            score: 95
        }]);

        // Mock fetch details
        executeQuery.mockResolvedValueOnce([{ title: 'Video Popular' }]);

        const response = await request(app).get('/api/recommendations');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].details.title).toBe('Video Popular');
    });

    test('POST /api/recommendations/track should log interaction', async () => {
        // Mock insert log
        executeQuery.mockResolvedValueOnce([]);

        const response = await request(app)
            .post('/api/recommendations/track')
            .send({ contentType: 'video', contentId: 1, interaction: 'view' });

        expect(response.status).toBe(200);
    });
});
