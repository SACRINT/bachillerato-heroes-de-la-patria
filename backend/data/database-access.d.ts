/**
 * ============================================
 * FUNCIONES DE ACCESO A DATOS - ESTUDIANTES
 * ============================================
 */
/**
 * Obtener todos los estudiantes ordenados alfabéticamente (OPTIMIZADO v1.1.0)
 *
 * OPTIMIZACIONES APLICADAS:
 * - Proyección de columnas: 20 → 9 campos (-55% datos)
 * - Payload: ~1.2MB → ~450KB
 * - Performance esperada: 200ms → 120ms (con índice)
 * - Índice: idx_estudiantes_apellidos_nombre (LEVEL 1)
 *
 * @returns {Promise<Array>} Array de objetos estudiante (campos esenciales)
 * @throws {Error} Si ocurre un error en la consulta
 */
export function getAllStudents(): Promise<any[]>;
/**
 * Obtener un estudiante por ID
 * @param {number} studentId - ID del estudiante
 * @returns {Promise<Object|null>} Objeto estudiante o null si no existe
 * @throws {Error} Si ocurre un error en la consulta
 */
export function getStudentById(studentId: number): Promise<any | null>;
/**
 * Obtener estudiantes por grado/nivel
 * @param {string} grado - Grado del estudiante
 * @returns {Promise<Array>} Array de estudiantes del grado especificado
 * @throws {Error} Si ocurre un error en la consulta
 */
export function getStudentsByGrade(grado: string): Promise<any[]>;
/**
 * Crear un nuevo estudiante
 * @param {Object} studentData - Datos del estudiante
 * @returns {Promise<Object>} Objeto estudiante creado
 * @throws {Error} Si ocurre un error en la inserción
 */
export function createStudent(studentData: any): Promise<any>;
/**
 * Actualizar un estudiante
 * @param {number} studentId - ID del estudiante
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<Object>} Objeto estudiante actualizado
 * @throws {Error} Si ocurre un error en la actualización
 */
export function updateStudent(studentId: number, updateData: any): Promise<any>;
/**
 * Eliminar un estudiante
 * @param {number} studentId - ID del estudiante
 * @returns {Promise<boolean>} true si fue eliminado, false si no existía
 * @throws {Error} Si ocurre un error en la eliminación
 */
export function deleteStudent(studentId: number): Promise<boolean>;
/**
 * Obtener estadísticas de estudiantes
 * @returns {Promise<Object>} Objeto con estadísticas
 * @throws {Error} Si ocurre un error en la consulta
 */
export function getStudentStats(): Promise<any>;
/**
 * ============================================
 * FUNCIONES DE ACCESO A DATOS - DOCENTES
 * ============================================
 */
/**
 * Obtener todos los docentes ordenados alfabéticamente
 * @returns {Promise<Array>} Array de objetos docente
 * @throws {Error} Si ocurre un error en la consulta
 */
export function getAllTeachers(): Promise<any[]>;
/**
 * Obtener un docente por ID
 * @param {number} teacherId - ID del docente
 * @returns {Promise<Object|null>} Objeto docente o null si no existe
 * @throws {Error} Si ocurre un error en la consulta
 */
export function getTeacherById(teacherId: number): Promise<any | null>;
/**
 * Crear un nuevo docente
 * @param {Object} teacherData - Datos del docente
 * @returns {Promise<Object>} Objeto docente creado
 * @throws {Error} Si ocurre un error en la inserción
 */
export function createTeacher(teacherData: any): Promise<any>;
/**
 * Actualizar un docente
 * @param {number} teacherId - ID del docente
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<Object>} Objeto docente actualizado
 * @throws {Error} Si ocurre un error en la actualización
 */
export function updateTeacher(teacherId: number, updateData: any): Promise<any>;
/**
 * Eliminar un docente
 * @param {number} teacherId - ID del docente
 * @returns {Promise<boolean>} true si fue eliminado, false si no existía
 * @throws {Error} Si ocurre un error en la eliminación
 */
export function deleteTeacher(teacherId: number): Promise<boolean>;
/**
 * ============================================
 * FUNCIONES DE ACCESO A DATOS - EGRESADOS
 * ============================================
 */
/**
 * Obtener todos los egresados
 * @returns {Promise<Array>} Array de objetos egresado
 * @throws {Error} Si ocurre un error en la consulta
 */
export function getAllEgresados(): Promise<any[]>;
/**
 * Obtener un egresado por ID
 * @param {number} egresadoId - ID del egresado
 * @returns {Promise<Object|null>} Objeto egresado o null si no existe
 * @throws {Error} Si ocurre un error en la consulta
 */
export function getEgresadoById(egresadoId: number): Promise<any | null>;
/**
 * Crear un nuevo egresado
 * @param {Object} egresadoData - Datos del egresado
 * @returns {Promise<Object>} Objeto egresado creado
 * @throws {Error} Si ocurre un error en la inserción
 */
export function createEgresado(egresadoData: any): Promise<any>;
/**
 * Actualizar un egresado
 * @param {number} egresadoId - ID del egresado
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<Object>} Objeto egresado actualizado
 * @throws {Error} Si ocurre un error en la actualización
 */
export function updateEgresado(egresadoId: number, updateData: any): Promise<any>;
/**
 * Eliminar un egresado
 * @param {number} egresadoId - ID del egresado
 * @returns {Promise<boolean>} true si fue eliminado, false si no existía
 * @throws {Error} Si ocurre un error en la eliminación
 */
export function deleteEgresado(egresadoId: number): Promise<boolean>;
/**
 * Obtener estadísticas de egresados
 * @returns {Promise<Object>} Objeto con estadísticas
 * @throws {Error} Si ocurre un error en la consulta
 */
export function getEgresadoStats(): Promise<any>;
/**
 * ============================================
 * FUNCIONES DE ACCESO A DATOS - PADRES
 * ============================================
 */
/**
 * Obtener todos los padres
 * @returns {Promise<Array>} Array de objetos padre
 * @throws {Error} Si ocurre un error en la consulta
 */
export function getAllParents(): Promise<any[]>;
/**
 * Obtener un padre por ID
 * @param {number} parentId - ID del padre
 * @returns {Promise<Object|null>} Objeto padre o null si no existe
 * @throws {Error} Si ocurre un error en la consulta
 */
export function getParentById(parentId: number): Promise<any | null>;
/**
 * Crear un nuevo padre
 * @param {Object} parentData - Datos del padre (nombre, email, password_hash, student_id)
 * @returns {Promise<Object>} Objeto padre creado
 * @throws {Error} Si ocurre un error en la inserción
 */
export function createParent(parentData: any): Promise<any>;
/**
 * Actualizar un padre
 * @param {number} parentId - ID del padre
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<Object>} Objeto padre actualizado
 * @throws {Error} Si ocurre un error en la actualización
 */
export function updateParent(parentId: number, updateData: any): Promise<any>;
/**
 * Eliminar un padre
 * @param {number} parentId - ID del padre
 * @returns {Promise<boolean>} true si fue eliminado, false si no existía
 * @throws {Error} Si ocurre un error en la eliminación
 */
export function deleteParent(parentId: number): Promise<boolean>;
/**
 * ============================================
 * FUNCIONES DE ACCESO A DATOS - NOTICIAS
 * ============================================
 */
/**
 * Obtener todas las noticias con filtros opcionales
 * @param {Object} filters - Filtros opcionales (estado, categoria, destacada, limit, offset)
 * @returns {Promise<Array>} Array de objetos noticia
 * @throws {Error} Si ocurre un error en la consulta
 */
export function getAllNews(filters?: any): Promise<any[]>;
/**
 * Obtener una noticia por ID
 * @param {number} newsId - ID de la noticia
 * @returns {Promise<Object|null>} Objeto noticia o null si no existe
 * @throws {Error} Si ocurre un error en la consulta
 */
export function getNewsById(newsId: number): Promise<any | null>;
/**
 * Crear una nueva noticia
 * @param {Object} newsData - Datos de la noticia
 * @returns {Promise<Object>} Objeto noticia creado
 * @throws {Error} Si ocurre un error en la inserción
 */
export function createNews(newsData: any): Promise<any>;
/**
 * Actualizar una noticia
 * @param {number} newsId - ID de la noticia
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<Object>} Objeto noticia actualizado
 * @throws {Error} Si ocurre un error en la actualización
 */
export function updateNews(newsId: number, updateData: any): Promise<any>;
/**
 * Eliminar una noticia
 * @param {number} newsId - ID de la noticia
 * @returns {Promise<boolean>} true si fue eliminada, false si no existía
 * @throws {Error} Si ocurre un error en la eliminación
 */
export function deleteNews(newsId: number): Promise<boolean>;
/**
 * ============================================
 * FUNCIONES PARA CURSOS/MATERIAS
 * ============================================
 */
/**
 * Obtiene todos los cursos/materias
 * @returns {Promise<Array>} Array de cursos
 * @throws {Error} Si ocurre un error en la consulta
 */
export function getAllCourses(): Promise<any[]>;
/**
 * Obtiene un curso específico por ID
 * @param {number} courseId - ID del curso
 * @returns {Promise<Object|null>} Objeto del curso o null si no existe
 * @throws {Error} Si ocurre un error en la consulta
 */
export function getCourseById(courseId: number): Promise<any | null>;
/**
 * Crea un nuevo curso
 * @param {Object} courseData - Datos del curso (nombre, codigo, descripcion, creditos, etc.)
 * @returns {Promise<Object>} Curso creado con ID
 * @throws {Error} Si ocurre un error en la inserción
 */
export function createCourse(courseData: any): Promise<any>;
/**
 * Actualiza un curso existente
 * @param {number} courseId - ID del curso
 * @param {Object} updateData - Campos a actualizar
 * @returns {Promise<Object|null>} Curso actualizado o null si no existía
 * @throws {Error} Si ocurre un error en la actualización
 */
export function updateCourse(courseId: number, updateData: any): Promise<any | null>;
/**
 * Elimina un curso
 * @param {number} courseId - ID del curso
 * @returns {Promise<boolean>} true si fue eliminado, false si no existía
 * @throws {Error} Si ocurre un error en la eliminación
 */
export function deleteCourse(courseId: number): Promise<boolean>;
/**
 * ============================================
 * FUNCIONES DE ACCESO A DATOS - USUARIOS
 * ============================================
 */
/**
 * Obtener usuario por email (para Google OAuth)
 * @param {string} email - Email del usuario
 * @returns {Promise<Object|null>} Usuario encontrado o null
 */
export function getUserByEmail(email: string): Promise<any | null>;
/**
 * Crear usuario desde Google OAuth
 * @param {Object} googleData - Datos del usuario de Google
 * @param {string} googleData.email - Email del usuario
 * @param {string} googleData.name - Nombre del usuario
 * @param {string} googleData.picture - URL de foto de perfil (opcional)
 * @param {string} googleData.sub - ID único de Google
 * @returns {Promise<Object>} Usuario creado
 */
export function createUserFromGoogle(googleData: {
    email: string;
    name: string;
    picture: string;
    sub: string;
}): Promise<any>;
/**
 * ============================================
 * FUNCIONES DE ACCESO A DATOS - TENANTS
 * ============================================
 */
/**
 * Obtener tenant por dominio (CRÍTICO para routing multi-tenant)
 * @param {string} domain - Dominio del tenant (ej: 'localhost:3000')
 * @returns {Promise<Object|null>} Objeto tenant o null si no existe
 * @throws {Error} Si ocurre un error en la consulta
 */
export function getTenantByDomain(domain: string): Promise<any | null>;
/**
 * Obtener tenant por ID
 * @param {number} tenantId - ID del tenant
 * @returns {Promise<Object|null>} Objeto tenant o null
 * @throws {Error} Si ocurre un error en la consulta
 */
export function getTenantById(tenantId: number): Promise<any | null>;
/**
 * Obtener todos los tenants
 * @returns {Promise<Array>} Array de tenants
 * @throws {Error} Si ocurre un error en la consulta
 */
export function getAllTenants(): Promise<any[]>;
/**
 * Crear nuevo tenant
 * @param {Object} tenantData - Datos del tenant {school_name, domain, schema_name, config_json, admin_email}
 * @returns {Promise<Object>} Tenant creado
 * @throws {Error} Si ocurre un error en la consulta
 */
export function createTenant(tenantData: any): Promise<any>;
/**
 * Actualizar tenant
 * @param {number} tenantId - ID del tenant
 * @param {Object} updateData - Datos a actualizar {school_name, status, admin_email, config_json}
 * @returns {Promise<Object>} Tenant actualizado
 * @throws {Error} Si ocurre un error en la consulta
 */
export function updateTenant(tenantId: number, updateData: any): Promise<any>;
/**
 * ============================================
 * FUNCIONES DE ACCESO A DATOS - APROBACIONES
 * ============================================
 */
/**
 * Obtener solicitudes pendientes de aprobación
 * @param {Object} filters - Filtros opcionales (form_type, limit, offset, status)
 * @returns {Promise<Array>} Array de solicitudes pendientes
 */
export function getPendingApprovals(filters?: any): Promise<any[]>;
/**
 * Obtener solicitud de aprobación por ID
 * @param {number} id - ID de la solicitud
 * @returns {Promise<Object>} Solicitud encontrada o null
 */
export function getApprovalById(id: number): Promise<any>;
/**
 * Obtener estadísticas de aprobaciones
 * @returns {Promise<Object>} Objeto con estadísticas
 */
export function getApprovalStatistics(): Promise<any>;
/**
 * Actualizar estado de solicitud de aprobación
 * @param {number} id - ID de la solicitud
 * @param {string} status - Nuevo estado
 * @param {string} notes - Notas de revisión
 * @param {number} reviewedBy - ID de quien revisa
 * @returns {Promise<Object>} Solicitud actualizada
 */
export function updateRequestStatus(id: number, status: string, notes?: string, reviewedBy?: number): Promise<any>;
//# sourceMappingURL=database-access.d.ts.map