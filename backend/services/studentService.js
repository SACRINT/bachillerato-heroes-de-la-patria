/**
 * 🎓 SERVICIO DE ESTUDIANTES - Dashboard Estudiantil
 * Maneja la lógica de negocio para el dashboard estudiantil
 */

const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');

class StudentService {
    constructor() {
        this.dbAvailable = false;
        this.dataPath = path.join(__dirname, '../data');
        this.studentsFile = path.join(this.dataPath, 'students.json');
        this.gradesFile = path.join(this.dataPath, 'grades.json');
        this.assignmentsFile = path.join(this.dataPath, 'assignments.json');
        this.notificationsFile = path.join(this.dataPath, 'notifications.json');
        this.scheduleFile = path.join(this.dataPath, 'schedule.json');

        console.log('🎓 [STUDENT SERVICE] Inicializando servicio de estudiantes...');
        this.ensureDataDirectory();
        this.initializeSampleData();
    }

    async ensureDataDirectory() {
        try {
            await fs.mkdir(this.dataPath, { recursive: true });
        } catch (error) {
            console.error('❌ Error creando directorio de datos:', error);
        }
    }

    async testDatabaseConnection() {
        try {
            const db = require('../config/database');
            const result = await db.testConnection();
            this.dbAvailable = result;
            return result;
        } catch (error) {
            console.log('⚠️ Student Service: Fallback a JSON');
            this.dbAvailable = false;
            return false;
        }
    }

    async initializeSampleData() {
        console.log('📊 [STUDENT SERVICE] Inicializando datos de ejemplo...');

        // Datos de estudiantes de ejemplo
        const sampleStudents = {
            students: [
                {
                    id: "est-001",
                    matricula: "2025-0001",
                    password: await bcrypt.hash("student123", 12),
                    nombre: "Ana María",
                    apellido_paterno: "García",
                    apellido_materno: "López",
                    email: "ana.garcia@estudiantes.bge.edu.mx",
                    grupo: "5A",
                    semestre: 5,
                    especialidad: "Programación",
                    promedio_general: 8.7,
                    foto_perfil: "images/students/ana-garcia.jpg",
                    fecha_ingreso: "2023-08-15",
                    estatus: "activo"
                },
                {
                    id: "est-002",
                    matricula: "2025-0002",
                    password: await bcrypt.hash("student456", 12),
                    nombre: "Carlos",
                    apellido_paterno: "Rodríguez",
                    apellido_materno: "Martínez",
                    email: "carlos.rodriguez@estudiantes.bge.edu.mx",
                    grupo: "5B",
                    semestre: 5,
                    especialidad: "Contabilidad",
                    promedio_general: 9.2,
                    foto_perfil: "images/students/carlos-rodriguez.jpg",
                    fecha_ingreso: "2023-08-15",
                    estatus: "activo"
                }
            ]
        };

        // Calificaciones de ejemplo
        const sampleGrades = {
            grades: [
                {
                    id: "cal-001",
                    student_id: "est-001",
                    materia: "Matemáticas V",
                    unidad_1: 8.5,
                    unidad_2: 9.0,
                    unidad_3: 8.8,
                    promedio: 8.8,
                    semestre: 5,
                    periodo: "2024-2025A"
                },
                {
                    id: "cal-002",
                    student_id: "est-001",
                    materia: "Programación Web",
                    unidad_1: 9.5,
                    unidad_2: 9.8,
                    unidad_3: 9.2,
                    promedio: 9.5,
                    semestre: 5,
                    periodo: "2024-2025A"
                },
                {
                    id: "cal-003",
                    student_id: "est-001",
                    materia: "Inglés V",
                    unidad_1: 8.0,
                    unidad_2: 8.5,
                    unidad_3: 8.2,
                    promedio: 8.2,
                    semestre: 5,
                    periodo: "2024-2025A"
                }
            ]
        };

        // Tareas de ejemplo
        const sampleAssignments = {
            assignments: [
                {
                    id: "tarea-001",
                    student_id: "est-001",
                    materia: "Matemáticas V",
                    titulo: "Resolver ejercicios de derivadas",
                    descripcion: "Completar los ejercicios 1-20 del capítulo 8",
                    fecha_asignacion: "2025-01-20",
                    fecha_entrega: "2025-01-27",
                    status: "pending",
                    prioridad: "alta"
                },
                {
                    id: "tarea-002",
                    student_id: "est-001",
                    materia: "Programación Web",
                    titulo: "Proyecto: Página web responsiva",
                    descripcion: "Crear una página web usando HTML5, CSS3 y JavaScript",
                    fecha_asignacion: "2025-01-18",
                    fecha_entrega: "2025-02-01",
                    status: "in_progress",
                    prioridad: "alta"
                },
                {
                    id: "tarea-003",
                    student_id: "est-001",
                    materia: "Inglés V",
                    titulo: "Essay: My Future Career",
                    descripcion: "Write a 500-word essay about your future career plans",
                    fecha_asignacion: "2025-01-22",
                    fecha_entrega: "2025-01-29",
                    status: "completed",
                    prioridad: "media"
                }
            ]
        };

        // Notificaciones de ejemplo
        const sampleNotifications = {
            notifications: [
                {
                    id: "notif-001",
                    student_id: "est-001",
                    titulo: "Nueva calificación disponible",
                    mensaje: "Se ha registrado tu calificación de Matemáticas V - Unidad 3",
                    tipo: "grade",
                    fecha: "2025-01-23T10:30:00Z",
                    leido: false,
                    prioridad: "normal"
                },
                {
                    id: "notif-002",
                    student_id: "est-001",
                    titulo: "Tarea próxima a vencer",
                    mensaje: "La tarea 'Resolver ejercicios de derivadas' vence en 3 días",
                    tipo: "assignment",
                    fecha: "2025-01-24T09:00:00Z",
                    leido: false,
                    prioridad: "alta"
                },
                {
                    id: "notif-003",
                    student_id: "est-001",
                    titulo: "Evento: Feria de Ciencias",
                    mensaje: "Se acerca la Feria de Ciencias 2025. ¡Inscríbete!",
                    tipo: "event",
                    fecha: "2025-01-22T14:15:00Z",
                    leido: true,
                    prioridad: "normal"
                }
            ]
        };

        // Horario de ejemplo
        const sampleSchedule = {
            schedule: [
                {
                    id: "hor-001",
                    student_id: "est-001",
                    dia: "Lunes",
                    hora_inicio: "08:00",
                    hora_fin: "08:50",
                    materia: "Matemáticas V",
                    profesor: "Prof. García Hernández",
                    aula: "Aula 201"
                },
                {
                    id: "hor-002",
                    student_id: "est-001",
                    dia: "Lunes",
                    hora_inicio: "08:50",
                    hora_fin: "09:40",
                    materia: "Programación Web",
                    profesor: "Prof. López Martínez",
                    aula: "Lab. Informática 1"
                },
                {
                    id: "hor-003",
                    student_id: "est-001",
                    dia: "Martes",
                    hora_inicio: "08:00",
                    hora_fin: "08:50",
                    materia: "Inglés V",
                    profesor: "Prof. Johnson Smith",
                    aula: "Aula 105"
                }
            ]
        };

        try {
            await this.writeJsonFile(this.studentsFile, sampleStudents);
            await this.writeJsonFile(this.gradesFile, sampleGrades);
            await this.writeJsonFile(this.assignmentsFile, sampleAssignments);
            await this.writeJsonFile(this.notificationsFile, sampleNotifications);
            await this.writeJsonFile(this.scheduleFile, sampleSchedule);
            console.log('✅ [STUDENT SERVICE] Datos de ejemplo inicializados');
        } catch (error) {
            console.error('❌ Error inicializando datos de ejemplo:', error);
        }
    }

    async readJsonFile(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.log(`📄 Archivo no encontrado, creando: ${path.basename(filePath)}`);
            return null;
        }
    }

    async writeJsonFile(filePath, data) {
        try {
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error(`❌ Error escribiendo archivo ${filePath}:`, error);
            return false;
        }
    }

    async authenticateStudent(matricula, password) {
        try {
            console.log(`🔐 [STUDENT SERVICE] Autenticando estudiante: ${matricula}`);

            const studentsData = await this.readJsonFile(this.studentsFile);
            if (!studentsData || !studentsData.students) {
                return { success: false, message: 'No hay datos de estudiantes' };
            }

            const student = studentsData.students.find(s => s.matricula === matricula);
            if (!student) {
                return { success: false, message: 'Estudiante no encontrado' };
            }

            const passwordMatch = await bcrypt.compare(password, student.password);
            if (!passwordMatch) {
                return { success: false, message: 'Contraseña incorrecta' };
            }

            // No devolver la contraseña
            const { password: _, ...studentData } = student;

            return {
                success: true,
                student: studentData
            };
        } catch (error) {
            console.error('❌ Error en autenticación:', error);
            return { success: false, message: 'Error interno' };
        }
    }

    async getStudentProfile(studentId) {
        try {
            const studentsData = await this.readJsonFile(this.studentsFile);
            if (!studentsData || !studentsData.students) {
                return null; // No student data available
            }

            const student = studentsData.students.find(s => s.id === studentId);
            if (!student) {
                return null; // Student not found
            }

            // No devolver la contraseña
            const { password: _, ...profile } = student;
            return profile;
        } catch (error) {
            console.error('❌ Error obteniendo perfil:', error);
            throw error;
        }
    }

    async getDashboardData(studentId) {
        try {
            console.log(`📊 [STUDENT SERVICE] Obteniendo dashboard para: ${studentId}`);

            const [profile, grades, assignments, notifications] = await Promise.all([
                this.getStudentProfile(studentId),
                this.getStudentGrades(studentId),
                this.getStudentAssignments(studentId, { limit: 5 }),
                this.getStudentNotifications(studentId, { unread_only: true, limit: 5 })
            ]);

            if (!profile) {
                return {
                    profile: null,
                    statistics: {
                        promedio_general: 0,
                        tareas_pendientes: 0,
                        notificaciones_nuevas: 0,
                        materias_cursando: 0
                    },
                    recent_grades: [],
                    pending_assignments: [],
                    recent_notifications: []
                };
            }

            // Calcular estadísticas
            const pendingAssignments = assignments.filter(a => a.status === 'pending').length;
            const unreadNotifications = notifications.length;
            const averageGrade = grades.length > 0
                ? grades.reduce((sum, g) => sum + g.promedio, 0) / grades.length
                : 0;

            return {
                profile,
                statistics: {
                    promedio_general: profile.promedio_general || averageGrade,
                    tareas_pendientes: pendingAssignments,
                    notificaciones_nuevas: unreadNotifications,
                    materias_cursando: grades.length
                },
                recent_grades: grades.slice(0, 3),
                pending_assignments: assignments.filter(a => a.status === 'pending').slice(0, 3),
                recent_notifications: notifications.slice(0, 3)
            };
        } catch (error) {
            console.error('❌ Error obteniendo dashboard:', error);
            throw error;
        }
    }

    async getStudentGrades(studentId, filters = {}) {
        try {
            const gradesData = await this.readJsonFile(this.gradesFile);
            if (!gradesData || !gradesData.grades) {
                return [];
            }

            let grades = gradesData.grades.filter(g => g.student_id === studentId);

            if (filters.semestre) {
                grades = grades.filter(g => g.semestre === parseInt(filters.semestre));
            }

            if (filters.materia) {
                grades = grades.filter(g => g.materia.toLowerCase().includes(filters.materia.toLowerCase()));
            }

            return grades;
        } catch (error) {
            console.error('❌ Error obteniendo calificaciones:', error);
            return [];
        }
    }

    async getStudentSchedule(studentId) {
        try {
            const scheduleData = await this.readJsonFile(this.scheduleFile);
            if (!scheduleData || !scheduleData.schedule) {
                return [];
            }

            return scheduleData.schedule.filter(s => s.student_id === studentId);
        } catch (error) {
            console.error('❌ Error obteniendo horario:', error);
            return [];
        }
    }

    async getStudentAssignments(studentId, filters = {}) {
        try {
            const assignmentsData = await this.readJsonFile(this.assignmentsFile);
            if (!assignmentsData || !assignmentsData.assignments) {
                return [];
            }

            let assignments = assignmentsData.assignments.filter(a => a.student_id === studentId);

            if (filters.status) {
                assignments = assignments.filter(a => a.status === filters.status);
            }

            if (filters.limit) {
                assignments = assignments.slice(0, filters.limit);
            }

            return assignments;
        } catch (error) {
            console.error('❌ Error obteniendo tareas:', error);
            return [];
        }
    }

    async getStudentNotifications(studentId, filters = {}) {
        try {
            const notificationsData = await this.readJsonFile(this.notificationsFile);
            if (!notificationsData || !notificationsData.notifications) {
                return [];
            }

            let notifications = notificationsData.notifications.filter(n => n.student_id === studentId);

            if (filters.unread_only) {
                notifications = notifications.filter(n => !n.leido);
            }

            if (filters.limit) {
                notifications = notifications.slice(0, filters.limit);
            }

            // Ordenar por fecha (más recientes primero)
            notifications.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

            return notifications;
        } catch (error) {
            console.error('❌ Error obteniendo notificaciones:', error);
            return [];
        }
    }

    async markNotificationAsRead(studentId, notificationId) {
        try {
            const notificationsData = await this.readJsonFile(this.notificationsFile);
            if (!notificationsData || !notificationsData.notifications) {
                return false; // No notification data available
            }

            const notification = notificationsData.notifications.find(
                n => n.id === notificationId && n.student_id === studentId
            );

            if (!notification) {
                return false; // Notification not found
            }

            notification.leido = true;
            await this.writeJsonFile(this.notificationsFile, notificationsData);

            return true;
        } catch (error) {
            console.error('❌ Error marcando notificación:', error);
            throw error;
        }
    }
}

// Singleton pattern
let studentServiceInstance = null;

function getStudentService() {
    if (!studentServiceInstance) {
        studentServiceInstance = new StudentService();
    }
    return studentServiceInstance;
}

module.exports = {
    StudentService,
    getStudentService
};