/**
 * 🧪 INTEGRATION TESTS - VIDEO LEARNING
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
const videoRoutes = require('../../routes/video-learning');

const app = express();
app.use(bodyParser.json());
app.use('/api/videos', videoRoutes);

describe('Video Learning Integration Tests', () => {

    test('GET /api/videos should return list of videos', async () => {
        executeQuery.mockResolvedValueOnce([{ id: 1, title: 'Video 1' }]);

        const response = await request(app).get('/api/videos');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
    });

    test('GET /api/videos/:id/interactive should return full video structure', async () => {
        // Must handle multiple executeQuery calls in order
        executeQuery
            .mockResolvedValueOnce([{ id: 1, title: 'Video 1' }])    // video metadata
            .mockResolvedValueOnce([])                               // interactions
            .mockResolvedValueOnce([])                               // captions
            .mockResolvedValueOnce([])                               // user progress
            .mockResolvedValueOnce([]);                              // bookmarks

        const response = await request(app).get('/api/videos/1/interactive');

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(1);
    });

    test('POST /api/videos/:id/progress should update user progress', async () => {
        executeQuery.mockResolvedValueOnce([{ user_id: 1, video_id: 1, last_position_seconds: 50 }]);

        const response = await request(app)
            .post('/api/videos/1/progress')
            .send({ position: 50, completed: false });

        expect(response.status).toBe(200);
        expect(response.body.data.last_position_seconds).toBe(50);
    });
});
