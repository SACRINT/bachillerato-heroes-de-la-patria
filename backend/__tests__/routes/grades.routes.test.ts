
import request from 'supertest';
import express from 'express';
import gradesRouter from '../../routes/grades';
import GradesService from '../../services/grades.service';
import StudentDAO from '../../data/student.dao';
import { generateReportCardPDF } from '../../utils/pdfGenerator';
import { authenticateToken } from '../../middleware/auth';

// Mock dependencies
jest.mock('../../services/grades.service');
jest.mock('../../data/student.dao');
jest.mock('../../utils/pdfGenerator');
jest.mock('../../middleware/auth', () => ({
    authenticateToken: (req, res, next) => {
        req.user = { id: 1, role: 'admin', email: 'test@test.com' };
        next();
    },
    requireRole: (roles) => (req, res, next) => next()
}));

const app = express();
app.use(express.json());
app.use('/api/grades', gradesRouter);

describe('Grades Routes API', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/grades/student/:id/pdf', () => {
        it('should generate PDF when student and grades exist', async () => {
            const mockStudent = {
                id: 1,
                nombre: 'Juan',
                apellido_paterno: 'Perez',
                curp: 'ABC123456',
                grupo: '3A',
                turno: 'matutino'
            };

            const mockReportCard = {
                estudianteId: 1,
                cicloEscolar: '2024-2025',
                materias: [
                    {
                        materia: 'Matematicas',
                        parciales: { '1': 9, '2': 10, '3': 8 },
                        promedio_final: 9.0,
                        docente: 'Prof. Test'
                    }
                ]
            };

            (StudentDAO.get as jest.Mock).mockResolvedValue(mockStudent);
            (GradesService.getStudentReportCard as jest.Mock).mockResolvedValue(mockReportCard);
            (generateReportCardPDF as jest.Mock).mockImplementation((data, res) => {
                res.setHeader('Content-Type', 'application/pdf');
                res.send(Buffer.from('PDF_CONTENT'));
            });

            const response = await request(app)
                .get('/api/grades/student/1/pdf?cicloEscolar=2024-2025')
                .expect(200);

            expect(response.type).toBe('application/pdf');
            expect(StudentDAO.get).toHaveBeenCalledWith(1);
            expect(GradesService.getStudentReportCard).toHaveBeenCalledWith(1, '2024-2025');
            expect(generateReportCardPDF).toHaveBeenCalled();
        });

        it('should return 400 if cicloEscolar is missing', async () => {
            await request(app)
                .get('/api/grades/student/1/pdf')
                .expect(400);
        });

        it('should return 404 if student not found', async () => {
            (GradesService.getStudentReportCard as jest.Mock).mockResolvedValue({ materias: [] });
            (StudentDAO.get as jest.Mock).mockResolvedValue(null);

            await request(app)
                .get('/api/grades/student/999/pdf?cicloEscolar=2024-2025')
                .expect(404);
        });
    });
});
