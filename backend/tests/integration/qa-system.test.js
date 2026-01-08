/**
 * 🧪 INTEGRATION TESTS - QUALITY ASSURANCE
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
const qaRoutes = require('../../routes/quality-assurance');

const app = express();
app.use(bodyParser.json());
app.use('/api/qa', qaRoutes);

describe('Quality Assurance Integration Tests', () => {

    test('POST /api/qa/report should create user report', async () => {
        executeQuery.mockResolvedValueOnce([{ id: 1, issue_type: 'typo' }]);

        const response = await request(app)
            .post('/api/qa/report')
            .send({ contentType: 'video', contentId: 1, issueType: 'typo', description: 'Error' });

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(1);
    });

    test('POST /api/qa/reports/:id/resolve should resolve report (Admin)', async () => {
        executeQuery.mockResolvedValueOnce([{ id: 1, status: 'resolved' }]);

        const response = await request(app)
            .post('/api/qa/reports/1/resolve')
            .send({ note: 'Fixed' });

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe('resolved');
    });

    test('GET /api/qa/health should return system status', async () => {
        executeQuery.mockResolvedValueOnce([{ check_name: 'test', status: 'pass' }]);

        const response = await request(app).get('/api/qa/health');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
    });
});
