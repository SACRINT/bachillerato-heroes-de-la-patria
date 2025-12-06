const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');
const BolsaTrabajoDAO = require('../../data/bolsa-trabajo.dao');

// Mock dependencies
jest.mock('../../data/bolsa-trabajo.dao');
jest.mock('../../utils/debug-logger', () => ({
    debugLog: {
        log: jest.fn(),
        error: jest.fn()
    }
}));
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue(true)
    })
}));

// Setup Express App
const app = express();
app.use(express.json());
const bolsaTrabajoRoutes = require('../../routes/bolsa-trabajo');
app.use('/api/bolsa-trabajo', bolsaTrabajoRoutes);

describe('POST /api/bolsa-trabajo/cv - File Upload', () => {
    const uploadDir = path.join(__dirname, '../../../public/uploads/cvs');
    const testFilePath = path.join(__dirname, 'test-cv.pdf');

    beforeAll(() => {
        // Create dummy PDF file
        fs.writeFileSync(testFilePath, '%PDF-1.4 test content');
        // Ensure upload dir exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
    });

    afterAll(() => {
        // Cleanup test file
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should accept valid PDF upload and call DAO with cvPath', async () => {
        BolsaTrabajoDAO.createPendingConfirmation.mockResolvedValue({
            confirmation_token: 'mock-token-123'
        });

        const response = await request(app)
            .post('/api/bolsa-trabajo/cv')
            .field('name', 'Juan Perez')
            .field('email', 'juan@test.com')
            .field('phone', '1234567890')
            .field('graduationYear', '2020')
            .field('subject', 'Ingeniería')
            .field('message', 'Este es un resumen profesional de prueba con más de 20 caracteres.')
            .attach('additionalDocument', testFilePath);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);

        // Verify DAO was called with cvPath
        expect(BolsaTrabajoDAO.createPendingConfirmation).toHaveBeenCalled();
        const callArgs = BolsaTrabajoDAO.createPendingConfirmation.mock.calls[0];
        const formData = callArgs[1];

        expect(formData.cvPath).toBeDefined();
        expect(formData.cvPath).toMatch(/^\/uploads\/cvs\/cv-.*\.pdf$/);

        // Verify file was actually created in uploads dir
        const uploadedFileName = path.basename(formData.cvPath);
        const uploadedFilePath = path.join(uploadDir, uploadedFileName);
        expect(fs.existsSync(uploadedFilePath)).toBe(true);

        // Cleanup uploaded file
        if (fs.existsSync(uploadedFilePath)) {
            fs.unlinkSync(uploadedFilePath);
        }
    });

    it('should reject non-PDF files', async () => {
        const txtFilePath = path.join(__dirname, 'test.txt');
        fs.writeFileSync(txtFilePath, 'text content');

        const response = await request(app)
            .post('/api/bolsa-trabajo/cv')
            .field('name', 'Juan Perez')
            .field('email', 'juan@test.com')
            .field('phone', '1234567890')
            .field('graduationYear', '2020')
            .field('subject', 'Ingeniería')
            .field('message', 'Resumen profesional válido.')
            .attach('additionalDocument', txtFilePath);

        expect(response.status).toBe(500); // Multer error usually results in 500 unless handled specifically
        // Or 400 if we added error handling middleware for Multer, but the route currently lets it bubble up or handles it?
        // Let's check the route code again. The route doesn't have specific Multer error handling middleware attached *inside* the route file, 
        // but `app.js` might. In the test app setup, we didn't add error handling middleware.
        // However, `fileFilter` in `bolsa-trabajo.js` returns an Error. Express default error handler will catch it.

        fs.unlinkSync(txtFilePath);
    });
});
