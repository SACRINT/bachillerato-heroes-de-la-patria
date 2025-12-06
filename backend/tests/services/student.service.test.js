/**
 * Student Service Tests
 * Suite de tests unitarios para StudentService
 */

const StudentService = require('../../services/student.service');
const StudentDAO = require('../../data/student.dao');
const EventBus = require('../../services/eventBus.service');

// Mock del DAO
jest.mock('../../data/student.dao');

// Mock de EventBus con instancia persistente
const mockEventBusInstance = { emit: jest.fn() };
jest.mock('../../services/eventBus.service', () => ({
    getInstance: () => mockEventBusInstance
}));

describe('StudentService', () => {
    // Test data
    const mockStudent = {
        id: 1,
        nombre: 'Juan',
        apellido_paterno: 'Pérez',
        apellido_materno: 'García',
        email: 'juan.perez@example.com',
        telefono: '2221234567',
        fecha_nacimiento: '2008-05-15',
        curp: 'PEGJ080515HPLRXN01',
        grado: '3',
        grupo: 'A',
        turno: 'matutino',
        status: 'activo',
        fecha_inscripcion: '2023-08-01',
        created_at: new Date(),
        updated_at: new Date()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ============================================
    // CRUD TESTS
    // ============================================

    describe('getStudent', () => {
        it('should get student by id', async () => {
            StudentDAO.get.mockResolvedValue(mockStudent);

            const result = await StudentService.getStudent(1);

            expect(result).toEqual(mockStudent);
            expect(StudentDAO.get).toHaveBeenCalledWith(1);
            expect(mockEventBusInstance.emit).toHaveBeenCalledWith('student:loaded', {
                id: 1,
                student: mockStudent
            });
        });

        it('should throw error if id is invalid', async () => {
            await expect(StudentService.getStudent(null)).rejects.toThrow('ID de estudiante inválido');
            await expect(StudentService.getStudent('abc')).rejects.toThrow('ID de estudiante inválido');
        });

        it('should throw error if student not found', async () => {
            StudentDAO.get.mockResolvedValue(null);

            await expect(StudentService.getStudent(999)).rejects.toThrow('Estudiante no encontrado: 999');
        });
    });

    describe('createStudent', () => {
        const newStudentData = {
            nombre: 'María',
            apellido_paterno: 'López',
            apellido_materno: 'Sánchez',
            email: 'maria.lopez@example.com',
            fecha_nacimiento: '2009-03-20',
            curp: 'LOSM090320MPLPNR05',
            grado: '2',
            grupo: 'B',
            turno: 'vespertino'
        };

        it('should create new student', async () => {
            StudentDAO.getByEmail.mockResolvedValue(null);
            StudentDAO.getByCURP.mockResolvedValue(null);
            StudentDAO.create.mockResolvedValue({ id: 2, ...newStudentData });

            const result = await StudentService.createStudent(newStudentData);

            expect(result.id).toBe(2);
            expect(result.nombre).toBe('María');
            expect(StudentDAO.create).toHaveBeenCalledWith(newStudentData);
            expect(mockEventBusInstance.emit).toHaveBeenCalledWith('student:created', {
                student: expect.objectContaining({ nombre: 'María' })
            });
        });

        it('should throw error if email already exists', async () => {
            StudentDAO.getByEmail.mockResolvedValue(mockStudent);

            await expect(StudentService.createStudent(newStudentData))
                .rejects.toThrow('Email ya registrado');
        });

        it('should throw error if CURP already exists', async () => {
            StudentDAO.getByEmail.mockResolvedValue(null);
            StudentDAO.getByCURP.mockResolvedValue(mockStudent);

            await expect(StudentService.createStudent(newStudentData))
                .rejects.toThrow('CURP ya registrado');
        });

        it('should throw error if validation fails - missing nombre', async () => {
            const invalidData = { ...newStudentData };
            delete invalidData.nombre;

            await expect(StudentService.createStudent(invalidData))
                .rejects.toThrow('Validación fallida');
        });

        it('should throw error if validation fails - invalid email', async () => {
            const invalidData = { ...newStudentData, email: 'invalid-email' };

            await expect(StudentService.createStudent(invalidData))
                .rejects.toThrow('Email inválido');
        });

        it('should throw error if age is invalid', async () => {
            const invalidData = { ...newStudentData, fecha_nacimiento: '2015-01-01' }; // Too young

            await expect(StudentService.createStudent(invalidData))
                .rejects.toThrow('Edad debe estar entre 12 y 25 años');
        });
    });

    describe('updateStudent', () => {
        it('should update student', async () => {
            const updateData = {
                ...mockStudent,
                telefono: '2229876543'
            };

            StudentDAO.get.mockResolvedValue(mockStudent);
            StudentDAO.getByEmail.mockResolvedValue(null);
            StudentDAO.getByCURP.mockResolvedValue(null);
            StudentDAO.update.mockResolvedValue(updateData);

            const result = await StudentService.updateStudent(1, updateData);

            expect(result.telefono).toBe('2229876543');
            expect(StudentDAO.update).toHaveBeenCalledWith(1, updateData);
            expect(mockEventBusInstance.emit).toHaveBeenCalledWith('student:updated', {
                id: 1,
                student: updateData,
                previousData: mockStudent
            });
        });

        it('should throw error if email is taken by another student', async () => {
            const anotherStudent = { ...mockStudent, id: 2 };
            StudentDAO.get.mockResolvedValue(mockStudent);
            StudentDAO.getByEmail.mockResolvedValue(anotherStudent);

            await expect(StudentService.updateStudent(1, { email: 'taken@example.com' }))
                .rejects.toThrow('Email ya registrado');
        });
    });

    describe('deleteStudent', () => {
        it('should soft delete student', async () => {
            StudentDAO.get.mockResolvedValue(mockStudent);
            StudentDAO.delete.mockResolvedValue(true);

            const result = await StudentService.deleteStudent(1);

            expect(result).toBe(true);
            expect(StudentDAO.delete).toHaveBeenCalledWith(1);
            expect(mockEventBusInstance.emit).toHaveBeenCalledWith('student:deleted', {
                id: 1,
                student: mockStudent
            });
        });
    });

    // ============================================
    // LIST TESTS
    // ============================================

    describe('listStudents', () => {
        it('should list students with pagination', async () => {
            const studentList = [mockStudent];
            StudentDAO.list.mockResolvedValue(studentList);
            StudentDAO.count.mockResolvedValue(1);

            const result = await StudentService.listStudents({}, { limit: 20, offset: 0 });

            expect(result.data).toEqual(studentList);
            expect(result.pagination.total).toBe(1);
            expect(result.pagination.totalPages).toBe(1);
            expect(result.pagination.currentPage).toBe(1);
        });

        it('should throw error if limit exceeds 100', async () => {
            await expect(StudentService.listStudents({}, { limit: 150 }))
                .rejects.toThrow('Límite máximo es 100 registros');
        });

        it('should apply filters correctly', async () => {
            const filters = { grado: '3', grupo: 'A' };
            StudentDAO.list.mockResolvedValue([mockStudent]);
            StudentDAO.count.mockResolvedValue(1);

            await StudentService.listStudents(filters);

            expect(StudentDAO.list).toHaveBeenCalledWith(filters, 20, 0);
        });
    });

    // ============================================
    // SPECIALIZED QUERIES
    // ============================================

    describe('getByGroup', () => {
        it('should get students by group', async () => {
            StudentDAO.getByGroup.mockResolvedValue([mockStudent]);

            const result = await StudentService.getByGroup('3', 'A');

            expect(result).toEqual([mockStudent]);
            expect(StudentDAO.getByGroup).toHaveBeenCalledWith('3', 'A');
        });

        it('should throw error if grado or grupo missing', async () => {
            await expect(StudentService.getByGroup(null, 'A'))
                .rejects.toThrow('Grado y grupo son requeridos');

            await expect(StudentService.getByGroup('3', null))
                .rejects.toThrow('Grado y grupo son requeridos');
        });
    });

    describe('getStudentProfile', () => {
        it('should get complete student profile', async () => {
            StudentDAO.get.mockResolvedValue(mockStudent);

            const result = await StudentService.getStudentProfile(1);

            expect(result.student).toEqual(mockStudent);
            expect(mockEventBusInstance.emit).toHaveBeenCalledWith('student:profile:loaded', {
                id: 1,
                profile: expect.any(Object)
            });
        });
    });

    // ============================================
    // VALIDATION TESTS
    // ============================================

    describe('Email Validation', () => {
        it('should validate correct emails', () => {
            expect(StudentService.isValidEmail('test@example.com')).toBe(true);
            expect(StudentService.isValidEmail('user.name@domain.co.mx')).toBe(true);
        });

        it('should reject invalid emails', () => {
            expect(StudentService.isValidEmail('invalid')).toBe(false);
            expect(StudentService.isValidEmail('no-at-sign.com')).toBe(false);
            expect(StudentService.isValidEmail('@nodomain.com')).toBe(false);
        });
    });
});
