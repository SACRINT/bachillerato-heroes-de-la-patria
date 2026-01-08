/**
 * 🧪 INTEGRATION TESTS - PRACTICE PROBLEMS
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
const problemsRoutes = require('../../routes/practice-problems');

const app = express();
app.use(bodyParser.json());
app.use('/api/problems', problemsRoutes);

describe('Practice Problems Integration Tests', () => {

    test('GET /api/problems/generate should return a generated problem', async () => {
        // Mock template return
        executeQuery.mockResolvedValueOnce([{
            id: 1,
            statement_template: 'Suma {{a}} + {{b}}',
            variable_ranges_json: { a: { min: 1, max: 10 }, b: { min: 1, max: 10 } },
            solution_logic_json: { formula: 'a + b' },
            hint_steps_json: []
        }]);

        // Mock insert of generated problem
        executeQuery.mockResolvedValueOnce([{
            id: 100,
            statement_rendered: 'Suma 5 + 3',
            variables_json: { a: 5, b: 3 }
        }]);

        const response = await request(app).get('/api/problems/generate?topic=math&difficulty=1');

        expect(response.status).toBe(200);
        expect(response.body.data.statement).toBe('Suma 5 + 3');
        expect(response.body.data.id).toBe(100);
    });

    test('POST /api/problems/:id/submit should validate answer', async () => {
        // Mock fetch problem
        executeQuery.mockResolvedValueOnce([{
            id: 100,
            template_id: 1,
            correct_answer: '8'
        }]);

        // Mock insert attempt
        executeQuery.mockResolvedValueOnce([]);

        // Mock update mastery (since it's correct)
        executeQuery.mockResolvedValueOnce([{ topic: 'math' }]); // fetch template topic
        executeQuery.mockResolvedValueOnce([]); // upsert mastery

        const response = await request(app)
            .post('/api/problems/100/submit')
            .send({ answer: '8', timeSpent: 10 });

        expect(response.status).toBe(200);
        expect(response.body.data.correct).toBe(true);
        expect(response.body.data.feedback).toContain('Excelente');
    });
});
