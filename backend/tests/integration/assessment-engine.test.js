/**
 * 🧪 INTEGRATION TESTS - ASSESSMENT ENGINE
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
const assessmentRoutes = require('../../routes/assessment-engine');

const app = express();
app.use(bodyParser.json());
app.use('/api/assessments', assessmentRoutes);

describe('Assessment Engine Integration Tests', () => {

    test('POST /api/assessments/generate should create an assessment from blueprint', async () => {
        // Mock blueprint fetch
        executeQuery.mockResolvedValueOnce([{
            id: 1,
            structure_config_json: [{ topic: 'Math', count: 1, difficulty: 1 }]
        }]);

        // Mock question selection
        executeQuery.mockResolvedValueOnce([{ id: 10, content_json: { q: 'Content' } }]);

        // Mock insert assessment
        executeQuery.mockResolvedValueOnce([{ id: 100, status: 'assigned' }]);

        const response = await request(app)
            .post('/api/assessments/generate')
            .send({ blueprintId: 1 });

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(100);
        expect(response.body.data.questions).toHaveLength(1);
    });

    test('POST /api/assessments/:id/submit should auto-grade MCQs', async () => {
        // Mock get assessment
        executeQuery.mockResolvedValueOnce([{
            id: 100,
            status: 'assigned',
            questions_seed_json: [{ bank_id: 10, type: 'static' }]
        }]);

        // Mock fetch correct answer for grading
        executeQuery.mockResolvedValueOnce([{
            id: 10,
            question_type: 'multiple_choice',
            correct_answer_json: { index: 1 }
        }]);

        // Mock save answer
        executeQuery.mockResolvedValueOnce([]);

        // Mock update status
        executeQuery.mockResolvedValueOnce([]);

        const response = await request(app)
            .post('/api/assessments/100/submit')
            .send({ answers: [{ index: 0, answer: "1" }] });

        expect(response.status).toBe(200);
        expect(response.body.data.score).toBe(10);
    });
});
