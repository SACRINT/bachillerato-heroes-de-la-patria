/**
 * 🧪 INTEGRATION TESTS - PREDICTIVE ANALYTICS
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
        req.user = { id: 1, role: 'admin' };
        next();
    }
}));

const { executeQuery } = require('../../config/database');
const predictiveRoutes = require('../../routes/predictive-analytics');

const app = express();
app.use(bodyParser.json());
app.use('/api/analytics/predictive', predictiveRoutes);

describe('Predictive Analytics Integration Tests', () => {

    test('POST /api/analytics/predictive/recalculate/:userId should calculate risk', async () => {
        // Mock save score
        executeQuery.mockResolvedValueOnce([{ id: 10 }]);
        // Mock save factors
        executeQuery.mockResolvedValueOnce([]);
        // Mock save history
        executeQuery.mockResolvedValueOnce([]);

        const response = await request(app)
            .post('/api/analytics/predictive/recalculate/1')
            .send();

        expect(response.status).toBe(200);
        expect(response.body.data.score).toBeDefined();
        expect(response.body.data.level).toBeDefined();
    });

    test('GET /api/analytics/predictive/at-risk should return high risk users', async () => {
        executeQuery.mockResolvedValueOnce([
            { user_id: 2, full_name: 'John Doe', risk_score: 85 }
        ]);

        const response = await request(app).get('/api/analytics/predictive/at-risk?threshold=80');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].risk_score).toBe(85);
    });
});
