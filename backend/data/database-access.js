/**
 * 🗄️ MÓDULO DE ACCESO A DATOS (DAL - Data Access Layer)
 *
 * Propósito: Centralizar todas las consultas a la base de datos en funciones reutilizables
 * Ventajas:
 * - Desacoplamiento de las rutas respecto a la lógica de BD
 * - Mantenimiento centralizado de queries SQL
 * - Manejo consistente de errores
 * - Facilita testing y reutilización de código
 *
 * Fecha: 7 de Noviembre de 2025
 * Versión: 1.0.0
 */

const { pool } = require('../config/database');

/**
 * ============================================
 * FUNCIONES DE ACCESO A DATOS - ESTUDIANTES
 * ============================================
 */

/**
 * Obtener todos los estudiantes ordenados alfabéticamente
 * @returns {Promise<Array>} Array de objetos estudiante
 * @throws {Error} Si ocurre un error en la consulta
 */
async function getAllStudents() {
    try {
        console.log('[DAL] Ejecutando: getAllStudents');
        const result = await pool.query(
            'SELECT * FROM estudiantes ORDER BY apellido_paterno, apellido_materno, nombre ASC'
        );

        const students = result.rows || [];
        console.log(`[DAL] ✅ getAllStudents: ${students.length} estudiantes encontrados`);

        return students;
    } catch (error) {
        console.error('[DAL] ❌ Error en getAllStudents:', error);
        throw error; // Relanzar el error para que el controlador de la ruta lo maneje
    }
}

/**
 * Obtener un estudiante por ID
 * @param {number} studentId - ID del estudiante
 * @returns {Promise<Object|null>} Objeto estudiante o null si no existe
 * @throws {Error} Si ocurre un error en la consulta
 */
async function getStudentById(studentId) {
    try {
        console.log('[DAL] Ejecutando: getStudentById', { studentId });
        const result = await pool.query(
            'SELECT * FROM estudiantes WHERE id = $1',
            [studentId]
        );

        const student = result.rows[0] || null;
        console.log(`[DAL] ✅ getStudentById: ${student ? 'encontrado' : 'no encontrado'}`);

        return student;
    } catch (error) {
        console.error('[DAL] ❌ Error en getStudentById:', error);
        throw error;
    }
}

/**
 * Obtener estudiantes por grado/nivel
 * @param {string} grado - Grado del estudiante
 * @returns {Promise<Array>} Array de estudiantes del grado especificado
 * @throws {Error} Si ocurre un error en la consulta
 */
async function getStudentsByGrade(grado) {
    try {
        console.log('[DAL] Ejecutando: getStudentsByGrade', { grado });
        const result = await pool.query(
            'SELECT * FROM estudiantes WHERE grado = $1 ORDER BY apellido_paterno, apellido_materno, nombre ASC',
            [grado]
        );

        const students = result.rows || [];
        console.log(`[DAL] ✅ getStudentsByGrade: ${students.length} estudiantes encontrados`);

        return students;
    } catch (error) {
        console.error('[DAL] ❌ Error en getStudentsByGrade:', error);
        throw error;
    }
}

/**
 * Crear un nuevo estudiante
 * @param {Object} studentData - Datos del estudiante
 * @returns {Promise<Object>} Objeto estudiante creado
 * @throws {Error} Si ocurre un error en la inserción
 */
async function createStudent(studentData) {
    try {
        const {
            nombre, apellido_paterno, apellido_materno, email,
            numero_telefono, grado, seccion
        } = studentData;

        console.log('[DAL] Ejecutando: createStudent', { email });

        const result = await pool.query(
            `INSERT INTO estudiantes
            (nombre, apellido_paterno, apellido_materno, email, numero_telefono, grado, seccion, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            RETURNING *`,
            [nombre, apellido_paterno, apellido_materno, email, numero_telefono, grado, seccion]
        );

        const newStudent = result.rows[0];
        console.log(`[DAL] ✅ createStudent: estudiante creado con ID ${newStudent.id}`);

        return newStudent;
    } catch (error) {
        console.error('[DAL] ❌ Error en createStudent:', error);
        throw error;
    }
}

/**
 * Actualizar un estudiante
 * @param {number} studentId - ID del estudiante
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<Object>} Objeto estudiante actualizado
 * @throws {Error} Si ocurre un error en la actualización
 */
async function updateStudent(studentId, updateData) {
    try {
        console.log('[DAL] Ejecutando: updateStudent', { studentId });

        // Construir dinámicamente la query según los campos proporcionados
        const fields = [];
        const values = [];
        let paramCount = 1;

        Object.entries(updateData).forEach(([key, value]) => {
            if (value !== undefined) {
                fields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        });

        // Agregar updated_at
        fields.push(`updated_at = $${paramCount}`);
        values.push(new Date());
        paramCount++;

        // Agregar el ID al final
        values.push(studentId);

        const query = `
            UPDATE estudiantes
            SET ${fields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            console.log('[DAL] ⚠️ updateStudent: estudiante no encontrado');
            return null;
        }

        const updatedStudent = result.rows[0];
        console.log(`[DAL] ✅ updateStudent: estudiante ${studentId} actualizado`);

        return updatedStudent;
    } catch (error) {
        console.error('[DAL] ❌ Error en updateStudent:', error);
        throw error;
    }
}

/**
 * Eliminar un estudiante
 * @param {number} studentId - ID del estudiante
 * @returns {Promise<boolean>} true si fue eliminado, false si no existía
 * @throws {Error} Si ocurre un error en la eliminación
 */
async function deleteStudent(studentId) {
    try {
        console.log('[DAL] Ejecutando: deleteStudent', { studentId });

        const result = await pool.query(
            'DELETE FROM estudiantes WHERE id = $1 RETURNING id',
            [studentId]
        );

        const deleted = result.rows.length > 0;
        console.log(`[DAL] ✅ deleteStudent: ${deleted ? 'eliminado' : 'no encontrado'}`);

        return deleted;
    } catch (error) {
        console.error('[DAL] ❌ Error en deleteStudent:', error);
        throw error;
    }
}

/**
 * Obtener estadísticas de estudiantes
 * @returns {Promise<Object>} Objeto con estadísticas
 * @throws {Error} Si ocurre un error en la consulta
 */
async function getStudentStats() {
    try {
        console.log('[DAL] Ejecutando: getStudentStats');

        const result = await pool.query(`
            SELECT
                COUNT(*) as total,
                COUNT(DISTINCT grado) as total_grados,
                COUNT(DISTINCT CASE WHEN active = true THEN id END) as activos,
                COUNT(DISTINCT CASE WHEN active = false THEN id END) as inactivos
            FROM estudiantes
        `);

        const stats = result.rows[0];
        console.log(`[DAL] ✅ getStudentStats:`, stats);

        return stats;
    } catch (error) {
        console.error('[DAL] ❌ Error en getStudentStats:', error);
        throw error;
    }
}

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
async function getAllTeachers() {
    try {
        console.log('[DAL] Ejecutando: getAllTeachers');
        const result = await pool.query(
            'SELECT * FROM docentes ORDER BY apellido_paterno, apellido_materno, nombre ASC'
        );

        const teachers = result.rows || [];
        console.log(`[DAL] ✅ getAllTeachers: ${teachers.length} docentes encontrados`);

        return teachers;
    } catch (error) {
        console.error('[DAL] ❌ Error en getAllTeachers:', error);
        throw error;
    }
}

/**
 * Obtener un docente por ID
 * @param {number} teacherId - ID del docente
 * @returns {Promise<Object|null>} Objeto docente o null si no existe
 * @throws {Error} Si ocurre un error en la consulta
 */
async function getTeacherById(teacherId) {
    try {
        console.log('[DAL] Ejecutando: getTeacherById', { teacherId });
        const result = await pool.query(
            'SELECT * FROM docentes WHERE id = $1',
            [teacherId]
        );

        const teacher = result.rows[0] || null;
        console.log(`[DAL] ✅ getTeacherById: ${teacher ? 'encontrado' : 'no encontrado'}`);

        return teacher;
    } catch (error) {
        console.error('[DAL] ❌ Error en getTeacherById:', error);
        throw error;
    }
}

/**
 * Crear un nuevo docente
 * @param {Object} teacherData - Datos del docente
 * @returns {Promise<Object>} Objeto docente creado
 * @throws {Error} Si ocurre un error en la inserción
 */
async function createTeacher(teacherData) {
    try {
        const {
            nombre, apellido_paterno, apellido_materno, email,
            numero_telefono, especialidad, departamento
        } = teacherData;

        console.log('[DAL] Ejecutando: createTeacher', { email });

        const result = await pool.query(
            `INSERT INTO docentes
            (nombre, apellido_paterno, apellido_materno, email, numero_telefono, especialidad, departamento, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            RETURNING *`,
            [nombre, apellido_paterno, apellido_materno, email, numero_telefono, especialidad, departamento]
        );

        const newTeacher = result.rows[0];
        console.log(`[DAL] ✅ createTeacher: docente creado con ID ${newTeacher.id}`);

        return newTeacher;
    } catch (error) {
        console.error('[DAL] ❌ Error en createTeacher:', error);
        throw error;
    }
}

/**
 * Actualizar un docente
 * @param {number} teacherId - ID del docente
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<Object>} Objeto docente actualizado
 * @throws {Error} Si ocurre un error en la actualización
 */
async function updateTeacher(teacherId, updateData) {
    try {
        console.log('[DAL] Ejecutando: updateTeacher', { teacherId });

        const fields = [];
        const values = [];
        let paramCount = 1;

        Object.entries(updateData).forEach(([key, value]) => {
            if (value !== undefined) {
                fields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        });

        fields.push(`updated_at = $${paramCount}`);
        values.push(new Date());
        paramCount++;
        values.push(teacherId);

        const query = `
            UPDATE docentes
            SET ${fields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            console.log('[DAL] ⚠️ updateTeacher: docente no encontrado');
            return null;
        }

        const updatedTeacher = result.rows[0];
        console.log(`[DAL] ✅ updateTeacher: docente ${teacherId} actualizado`);

        return updatedTeacher;
    } catch (error) {
        console.error('[DAL] ❌ Error en updateTeacher:', error);
        throw error;
    }
}

/**
 * Eliminar un docente
 * @param {number} teacherId - ID del docente
 * @returns {Promise<boolean>} true si fue eliminado, false si no existía
 * @throws {Error} Si ocurre un error en la eliminación
 */
async function deleteTeacher(teacherId) {
    try {
        console.log('[DAL] Ejecutando: deleteTeacher', { teacherId });

        const result = await pool.query(
            'DELETE FROM docentes WHERE id = $1 RETURNING id',
            [teacherId]
        );

        const deleted = result.rows.length > 0;
        console.log(`[DAL] ✅ deleteTeacher: ${deleted ? 'eliminado' : 'no encontrado'}`);

        return deleted;
    } catch (error) {
        console.error('[DAL] ❌ Error en deleteTeacher:', error);
        throw error;
    }
}

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
async function getAllEgresados() {
    try {
        console.log('[DAL] Ejecutando: getAllEgresados');
        const result = await pool.query(
            'SELECT * FROM egresados ORDER BY created_at DESC'
        );

        const egresados = result.rows || [];
        console.log(`[DAL] ✅ getAllEgresados: ${egresados.length} egresados encontrados`);

        return egresados;
    } catch (error) {
        console.error('[DAL] ❌ Error en getAllEgresados:', error);
        throw error;
    }
}

/**
 * Obtener un egresado por ID
 * @param {number} egresadoId - ID del egresado
 * @returns {Promise<Object|null>} Objeto egresado o null si no existe
 * @throws {Error} Si ocurre un error en la consulta
 */
async function getEgresadoById(egresadoId) {
    try {
        console.log('[DAL] Ejecutando: getEgresadoById', { egresadoId });
        const result = await pool.query(
            'SELECT * FROM egresados WHERE id = $1',
            [egresadoId]
        );

        const egresado = result.rows[0] || null;
        console.log(`[DAL] ✅ getEgresadoById: ${egresado ? 'encontrado' : 'no encontrado'}`);

        return egresado;
    } catch (error) {
        console.error('[DAL] ❌ Error en getEgresadoById:', error);
        throw error;
    }
}

/**
 * Crear un nuevo egresado
 * @param {Object} egresadoData - Datos del egresado
 * @returns {Promise<Object>} Objeto egresado creado
 * @throws {Error} Si ocurre un error en la inserción
 */
async function createEgresado(egresadoData) {
    try {
        console.log('[DAL] Ejecutando: createEgresado', { email: egresadoData.email });

        const {
            nombre_completo, email, empresa, puesto, anio_graduacion, datos_json
        } = egresadoData;

        const result = await pool.query(
            `INSERT INTO egresados
            (nombre_completo, email, empresa, puesto, anio_graduacion, datos_json, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            RETURNING *`,
            [nombre_completo, email, empresa, puesto, anio_graduacion, datos_json ? JSON.stringify(datos_json) : null]
        );

        const newEgresado = result.rows[0];
        console.log(`[DAL] ✅ createEgresado: egresado creado con ID ${newEgresado.id}`);

        return newEgresado;
    } catch (error) {
        console.error('[DAL] ❌ Error en createEgresado:', error);
        throw error;
    }
}

/**
 * Actualizar un egresado
 * @param {number} egresadoId - ID del egresado
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<Object>} Objeto egresado actualizado
 * @throws {Error} Si ocurre un error en la actualización
 */
async function updateEgresado(egresadoId, updateData) {
    try {
        console.log('[DAL] Ejecutando: updateEgresado', { egresadoId });

        const fields = [];
        const values = [];
        let paramCount = 1;

        Object.entries(updateData).forEach(([key, value]) => {
            if (value !== undefined) {
                // Manejar JSON especialmente
                if (key === 'datos_json' && typeof value === 'object') {
                    fields.push(`${key} = $${paramCount}`);
                    values.push(JSON.stringify(value));
                } else {
                    fields.push(`${key} = $${paramCount}`);
                    values.push(value);
                }
                paramCount++;
            }
        });

        fields.push(`updated_at = $${paramCount}`);
        values.push(new Date());
        paramCount++;
        values.push(egresadoId);

        const query = `
            UPDATE egresados
            SET ${fields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            console.log('[DAL] ⚠️ updateEgresado: egresado no encontrado');
            return null;
        }

        const updatedEgresado = result.rows[0];
        console.log(`[DAL] ✅ updateEgresado: egresado ${egresadoId} actualizado`);

        return updatedEgresado;
    } catch (error) {
        console.error('[DAL] ❌ Error en updateEgresado:', error);
        throw error;
    }
}

/**
 * Eliminar un egresado
 * @param {number} egresadoId - ID del egresado
 * @returns {Promise<boolean>} true si fue eliminado, false si no existía
 * @throws {Error} Si ocurre un error en la eliminación
 */
async function deleteEgresado(egresadoId) {
    try {
        console.log('[DAL] Ejecutando: deleteEgresado', { egresadoId });

        const result = await pool.query(
            'DELETE FROM egresados WHERE id = $1 RETURNING id',
            [egresadoId]
        );

        const deleted = result.rows.length > 0;
        console.log(`[DAL] ✅ deleteEgresado: ${deleted ? 'eliminado' : 'no encontrado'}`);

        return deleted;
    } catch (error) {
        console.error('[DAL] ❌ Error en deleteEgresado:', error);
        throw error;
    }
}

/**
 * Obtener estadísticas de egresados
 * @returns {Promise<Object>} Objeto con estadísticas
 * @throws {Error} Si ocurre un error en la consulta
 */
async function getEgresadoStats() {
    try {
        console.log('[DAL] Ejecutando: getEgresadoStats');

        const result = await pool.query(`
            SELECT
                COUNT(*) as total,
                COUNT(DISTINCT EXTRACT(YEAR FROM created_at)) as anos_representados,
                COUNT(DISTINCT empresa) as empresas_unicas,
                COUNT(DISTINCT EXTRACT(YEAR FROM created_at)::integer ORDER BY EXTRACT(YEAR FROM created_at)) as anno_con_mas_egresados
            FROM egresados
        `);

        const stats = result.rows[0];
        console.log(`[DAL] ✅ getEgresadoStats:`, stats);

        return stats;
    } catch (error) {
        console.error('[DAL] ❌ Error en getEgresadoStats:', error);
        throw error;
    }
}

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
async function getAllParents() {
    try {
        console.log('[DAL] Ejecutando: getAllParents');
        const result = await pool.query(
            'SELECT id, nombre, email, student_id, created_at, updated_at FROM parents ORDER BY created_at DESC'
        );

        const parents = result.rows || [];
        console.log(`[DAL] ✅ getAllParents: ${parents.length} padres encontrados`);

        return parents;
    } catch (error) {
        console.error('[DAL] ❌ Error en getAllParents:', error);
        throw error;
    }
}

/**
 * Obtener un padre por ID
 * @param {number} parentId - ID del padre
 * @returns {Promise<Object|null>} Objeto padre o null si no existe
 * @throws {Error} Si ocurre un error en la consulta
 */
async function getParentById(parentId) {
    try {
        console.log('[DAL] Ejecutando: getParentById', { parentId });
        const result = await pool.query(
            'SELECT id, nombre, email, student_id, created_at, updated_at FROM parents WHERE id = $1',
            [parentId]
        );

        const parent = result.rows[0] || null;
        console.log(`[DAL] ✅ getParentById: ${parent ? 'encontrado' : 'no encontrado'}`);

        return parent;
    } catch (error) {
        console.error('[DAL] ❌ Error en getParentById:', error);
        throw error;
    }
}

/**
 * Crear un nuevo padre
 * @param {Object} parentData - Datos del padre (nombre, email, password_hash, student_id)
 * @returns {Promise<Object>} Objeto padre creado
 * @throws {Error} Si ocurre un error en la inserción
 */
async function createParent(parentData) {
    try {
        const { nombre, email, password_hash, student_id } = parentData;

        console.log('[DAL] Ejecutando: createParent', { email });

        const result = await pool.query(
            `INSERT INTO parents (nombre, email, password_hash, student_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            RETURNING id, nombre, email, student_id, created_at`,
            [nombre, email.toLowerCase(), password_hash, student_id || null]
        );

        const newParent = result.rows[0];
        console.log(`[DAL] ✅ createParent: padre creado con ID ${newParent.id}`);

        return newParent;
    } catch (error) {
        console.error('[DAL] ❌ Error en createParent:', error);
        throw error;
    }
}

/**
 * Actualizar un padre
 * @param {number} parentId - ID del padre
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<Object>} Objeto padre actualizado
 * @throws {Error} Si ocurre un error en la actualización
 */
async function updateParent(parentId, updateData) {
    try {
        console.log('[DAL] Ejecutando: updateParent', { parentId });

        const fields = [];
        const values = [];
        let paramCount = 1;

        Object.entries(updateData).forEach(([key, value]) => {
            if (value !== undefined) {
                fields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        });

        fields.push(`updated_at = $${paramCount}`);
        values.push(new Date());
        paramCount++;
        values.push(parentId);

        const query = `
            UPDATE parents
            SET ${fields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING id, nombre, email, student_id, created_at, updated_at
        `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            console.log('[DAL] ⚠️ updateParent: padre no encontrado');
            return null;
        }

        const updatedParent = result.rows[0];
        console.log(`[DAL] ✅ updateParent: padre ${parentId} actualizado`);

        return updatedParent;
    } catch (error) {
        console.error('[DAL] ❌ Error en updateParent:', error);
        throw error;
    }
}

/**
 * Eliminar un padre
 * @param {number} parentId - ID del padre
 * @returns {Promise<boolean>} true si fue eliminado, false si no existía
 * @throws {Error} Si ocurre un error en la eliminación
 */
async function deleteParent(parentId) {
    try {
        console.log('[DAL] Ejecutando: deleteParent', { parentId });

        const result = await pool.query(
            'DELETE FROM parents WHERE id = $1 RETURNING id',
            [parentId]
        );

        const deleted = result.rows.length > 0;
        console.log(`[DAL] ✅ deleteParent: ${deleted ? 'eliminado' : 'no encontrado'}`);

        return deleted;
    } catch (error) {
        console.error('[DAL] ❌ Error en deleteParent:', error);
        throw error;
    }
}

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
async function getAllNews(filters = {}) {
    try {
        const { estado, categoria, destacada, limit = 50, offset = 0 } = filters;

        console.log('[DAL] Ejecutando: getAllNews', filters);

        let query = 'SELECT * FROM noticias WHERE 1=1';
        const params = [];
        let paramCount = 0;

        if (estado) {
            paramCount++;
            query += ` AND estado = $${paramCount}`;
            params.push(estado);
        }

        if (categoria) {
            paramCount++;
            query += ` AND categoria = $${paramCount}`;
            params.push(categoria);
        }

        if (destacada !== undefined) {
            paramCount++;
            query += ` AND destacada = $${paramCount}`;
            params.push(destacada === 'true' || destacada === true);
        }

        query += ` ORDER BY fecha_creacion DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);
        const news = result.rows || [];

        console.log(`[DAL] ✅ getAllNews: ${news.length} noticias encontradas`);

        return news;
    } catch (error) {
        console.error('[DAL] ❌ Error en getAllNews:', error);
        throw error;
    }
}

/**
 * Obtener una noticia por ID
 * @param {number} newsId - ID de la noticia
 * @returns {Promise<Object|null>} Objeto noticia o null si no existe
 * @throws {Error} Si ocurre un error en la consulta
 */
async function getNewsById(newsId) {
    try {
        console.log('[DAL] Ejecutando: getNewsById', { newsId });
        const result = await pool.query(
            'SELECT * FROM noticias WHERE id = $1',
            [newsId]
        );

        const news = result.rows[0] || null;
        console.log(`[DAL] ✅ getNewsById: ${news ? 'encontrada' : 'no encontrada'}`);

        return news;
    } catch (error) {
        console.error('[DAL] ❌ Error en getNewsById:', error);
        throw error;
    }
}

/**
 * Crear una nueva noticia
 * @param {Object} newsData - Datos de la noticia
 * @returns {Promise<Object>} Objeto noticia creado
 * @throws {Error} Si ocurre un error en la inserción
 */
async function createNews(newsData) {
    try {
        const {
            titulo, contenido, resumen, imagen_url, categoria, etiquetas,
            estado, autor, autor_id, slug, meta_descripcion, destacada,
            ip_address, user_agent
        } = newsData;

        console.log('[DAL] Ejecutando: createNews', { titulo });

        const fecha_pub = estado === 'publicada' ? new Date() : null;

        const result = await pool.query(
            `INSERT INTO noticias (
                titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado,
                autor, autor_id, slug, meta_descripcion, destacada, ip_address, user_agent,
                fecha_publicacion, fecha_creacion
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
            RETURNING *`,
            [
                titulo, contenido, resumen || null, imagen_url || null,
                categoria || 'General', etiquetas || [], estado || 'borrador',
                autor, autor_id || null, slug, meta_descripcion || resumen || contenido.substring(0, 160),
                destacada || false, ip_address || null, user_agent || null, fecha_pub
            ]
        );

        const newNews = result.rows[0];
        console.log(`[DAL] ✅ createNews: noticia creada con ID ${newNews.id}`);

        return newNews;
    } catch (error) {
        console.error('[DAL] ❌ Error en createNews:', error);
        throw error;
    }
}

/**
 * Actualizar una noticia
 * @param {number} newsId - ID de la noticia
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<Object>} Objeto noticia actualizado
 * @throws {Error} Si ocurre un error en la actualización
 */
async function updateNews(newsId, updateData) {
    try {
        console.log('[DAL] Ejecutando: updateNews', { newsId });

        const fields = [];
        const values = [];
        let paramCount = 1;

        Object.entries(updateData).forEach(([key, value]) => {
            if (value !== undefined) {
                fields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        });

        // Si se actualiza el estado a 'publicada', actualizar fecha_publicacion
        if (updateData.estado === 'publicada' && !updateData.fecha_publicacion) {
            fields.push(`fecha_publicacion = $${paramCount}`);
            values.push(new Date());
            paramCount++;
        }

        values.push(newsId);

        const query = `
            UPDATE noticias
            SET ${fields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            console.log('[DAL] ⚠️ updateNews: noticia no encontrada');
            return null;
        }

        const updatedNews = result.rows[0];
        console.log(`[DAL] ✅ updateNews: noticia ${newsId} actualizada`);

        return updatedNews;
    } catch (error) {
        console.error('[DAL] ❌ Error en updateNews:', error);
        throw error;
    }
}

/**
 * Eliminar una noticia
 * @param {number} newsId - ID de la noticia
 * @returns {Promise<boolean>} true si fue eliminada, false si no existía
 * @throws {Error} Si ocurre un error en la eliminación
 */
async function deleteNews(newsId) {
    try {
        console.log('[DAL] Ejecutando: deleteNews', { newsId });

        const result = await pool.query(
            'DELETE FROM noticias WHERE id = $1 RETURNING id',
            [newsId]
        );

        const deleted = result.rows.length > 0;
        console.log(`[DAL] ✅ deleteNews: ${deleted ? 'eliminada' : 'no encontrada'}`);

        return deleted;
    } catch (error) {
        console.error('[DAL] ❌ Error en deleteNews:', error);
        throw error;
    }
}

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
async function getAllCourses() {
    try {
        console.log('[DAL] Ejecutando: getAllCourses');

        const result = await pool.query(
            'SELECT * FROM cursos ORDER BY nombre ASC'
        );

        console.log(`[DAL] ✅ getAllCourses: ${result.rows.length} cursos obtenidos`);
        return result.rows || [];
    } catch (error) {
        console.error('[DAL] ❌ Error en getAllCourses:', error);
        throw error;
    }
}

/**
 * Obtiene un curso específico por ID
 * @param {number} courseId - ID del curso
 * @returns {Promise<Object|null>} Objeto del curso o null si no existe
 * @throws {Error} Si ocurre un error en la consulta
 */
async function getCourseById(courseId) {
    try {
        console.log('[DAL] Ejecutando: getCourseById', { courseId });

        const result = await pool.query(
            'SELECT * FROM cursos WHERE id = $1',
            [courseId]
        );

        const curso = result.rows[0] || null;
        console.log(`[DAL] ✅ getCourseById: ${curso ? 'encontrado' : 'no encontrado'}`);

        return curso;
    } catch (error) {
        console.error('[DAL] ❌ Error en getCourseById:', error);
        throw error;
    }
}

/**
 * Crea un nuevo curso
 * @param {Object} courseData - Datos del curso (nombre, codigo, descripcion, creditos, etc.)
 * @returns {Promise<Object>} Curso creado con ID
 * @throws {Error} Si ocurre un error en la inserción
 */
async function createCourse(courseData) {
    try {
        console.log('[DAL] Ejecutando: createCourse', { courseData });

        const {
            nombre,
            codigo,
            descripcion,
            creditos,
            horas_totales,
            grado_minimo,
            grado_maximo,
            activo
        } = courseData;

        const result = await pool.query(
            `INSERT INTO cursos (
                nombre, codigo, descripcion, creditos, horas_totales,
                grado_minimo, grado_maximo, activo, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            RETURNING *`,
            [
                nombre,
                codigo || null,
                descripcion || null,
                creditos || 0,
                horas_totales || 0,
                grado_minimo || 1,
                grado_maximo || 6,
                activo !== false // true by default
            ]
        );

        const curso = result.rows[0];
        console.log(`[DAL] ✅ createCourse: curso creado con ID ${curso.id}`);

        return curso;
    } catch (error) {
        console.error('[DAL] ❌ Error en createCourse:', error);
        throw error;
    }
}

/**
 * Actualiza un curso existente
 * @param {number} courseId - ID del curso
 * @param {Object} updateData - Campos a actualizar
 * @returns {Promise<Object|null>} Curso actualizado o null si no existía
 * @throws {Error} Si ocurre un error en la actualización
 */
async function updateCourse(courseId, updateData) {
    try {
        console.log('[DAL] Ejecutando: updateCourse', { courseId, updateData });

        // Construcción dinámica de SET
        const fields = [];
        const values = [];
        let paramCount = 1;

        Object.entries(updateData).forEach(([key, value]) => {
            if (value !== undefined) {
                fields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        });

        // Agregar updated_at siempre
        fields.push(`updated_at = $${paramCount}`);
        values.push(new Date());
        paramCount++;

        // Agregar el ID como último parámetro
        values.push(courseId);

        if (fields.length === 1) {
            // Solo updated_at, no hay cambios
            console.log('[DAL] ⚠️ updateCourse: sin cambios para aplicar');
            return await getCourseById(courseId);
        }

        const query = `
            UPDATE cursos
            SET ${fields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await pool.query(query, values);
        const curso = result.rows[0] || null;

        if (curso) {
            console.log(`[DAL] ✅ updateCourse: curso ${courseId} actualizado`);
        } else {
            console.log(`[DAL] ⚠️ updateCourse: curso ${courseId} no encontrado`);
        }

        return curso;
    } catch (error) {
        console.error('[DAL] ❌ Error en updateCourse:', error);
        throw error;
    }
}

/**
 * Elimina un curso
 * @param {number} courseId - ID del curso
 * @returns {Promise<boolean>} true si fue eliminado, false si no existía
 * @throws {Error} Si ocurre un error en la eliminación
 */
async function deleteCourse(courseId) {
    try {
        console.log('[DAL] Ejecutando: deleteCourse', { courseId });

        const result = await pool.query(
            'DELETE FROM cursos WHERE id = $1 RETURNING id',
            [courseId]
        );

        const deleted = result.rows.length > 0;
        console.log(`[DAL] ✅ deleteCourse: ${deleted ? 'eliminado' : 'no encontrado'}`);

        return deleted;
    } catch (error) {
        console.error('[DAL] ❌ Error en deleteCourse:', error);
        throw error;
    }
}

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
async function getTenantByDomain(domain) {
    try {
        console.log('[DAL] Ejecutando: getTenantByDomain', { domain });
        const result = await pool.query(
            'SELECT * FROM tenants WHERE domain = $1 LIMIT 1',
            [domain]
        );

        const tenant = result.rows[0] || null;
        console.log(`[DAL] ✅ getTenantByDomain: ${tenant ? 'encontrado' : 'no encontrado'}`);

        return tenant;
    } catch (error) {
        console.error('[DAL] ❌ Error en getTenantByDomain:', error);
        throw error;
    }
}

/**
 * Obtener tenant por ID
 * @param {number} tenantId - ID del tenant
 * @returns {Promise<Object|null>} Objeto tenant o null
 * @throws {Error} Si ocurre un error en la consulta
 */
async function getTenantById(tenantId) {
    try {
        console.log('[DAL] Ejecutando: getTenantById', { tenantId });
        const result = await pool.query(
            'SELECT * FROM tenants WHERE id = $1 LIMIT 1',
            [tenantId]
        );

        const tenant = result.rows[0] || null;
        console.log(`[DAL] ✅ getTenantById: ${tenant ? 'encontrado' : 'no encontrado'}`);

        return tenant;
    } catch (error) {
        console.error('[DAL] ❌ Error en getTenantById:', error);
        throw error;
    }
}

/**
 * Obtener todos los tenants
 * @returns {Promise<Array>} Array de tenants
 * @throws {Error} Si ocurre un error en la consulta
 */
async function getAllTenants() {
    try {
        console.log('[DAL] Ejecutando: getAllTenants');
        const result = await pool.query(
            'SELECT id, uuid, schema_name, school_name, domain, status, created_at FROM tenants ORDER BY school_name ASC'
        );

        const tenants = result.rows || [];
        console.log(`[DAL] ✅ getAllTenants: ${tenants.length} tenants encontrados`);

        return tenants;
    } catch (error) {
        console.error('[DAL] ❌ Error en getAllTenants:', error);
        throw error;
    }
}

/**
 * Crear nuevo tenant
 * @param {Object} tenantData - Datos del tenant {school_name, domain, schema_name, config_json, admin_email}
 * @returns {Promise<Object>} Tenant creado
 * @throws {Error} Si ocurre un error en la consulta
 */
async function createTenant(tenantData) {
    try {
        console.log('[DAL] Ejecutando: createTenant', { domain: tenantData.domain });
        const {
            school_name,
            domain,
            schema_name,
            config_json,
            admin_email,
            admin_phone,
            status = 'activo'
        } = tenantData;

        const result = await pool.query(
            `INSERT INTO tenants (school_name, domain, schema_name, config_json, admin_email, admin_phone, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, uuid, schema_name, school_name, domain, status, created_at`,
            [school_name, domain, schema_name, config_json, admin_email, admin_phone, status]
        );

        const tenant = result.rows[0];
        console.log(`[DAL] ✅ createTenant: tenant creado con ID ${tenant.id}`);

        return tenant;
    } catch (error) {
        console.error('[DAL] ❌ Error en createTenant:', error);
        throw error;
    }
}

/**
 * Actualizar tenant
 * @param {number} tenantId - ID del tenant
 * @param {Object} updateData - Datos a actualizar {school_name, status, admin_email, config_json}
 * @returns {Promise<Object>} Tenant actualizado
 * @throws {Error} Si ocurre un error en la consulta
 */
async function updateTenant(tenantId, updateData) {
    try {
        console.log('[DAL] Ejecutando: updateTenant', { tenantId });

        const { school_name, status, admin_email, admin_phone, config_json } = updateData;

        // Construir query dinámica (solo actualizar campos proporcionados)
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (school_name !== undefined) {
            updates.push(`school_name = $${paramCount++}`);
            values.push(school_name);
        }
        if (status !== undefined) {
            updates.push(`status = $${paramCount++}`);
            values.push(status);
        }
        if (admin_email !== undefined) {
            updates.push(`admin_email = $${paramCount++}`);
            values.push(admin_email);
        }
        if (admin_phone !== undefined) {
            updates.push(`admin_phone = $${paramCount++}`);
            values.push(admin_phone);
        }
        if (config_json !== undefined) {
            updates.push(`config_json = $${paramCount++}`);
            values.push(config_json);
        }

        if (updates.length === 0) {
            return null; // No hay campos para actualizar
        }

        values.push(tenantId);

        const result = await pool.query(
            `UPDATE tenants SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );

        const tenant = result.rows[0] || null;
        console.log(`[DAL] ✅ updateTenant: tenant actualizado`);

        return tenant;
    } catch (error) {
        console.error('[DAL] ❌ Error en updateTenant:', error);
        throw error;
    }
}

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
async function getUserByEmail(email) {
    try {
        console.log('[DAL] Ejecutando: getUserByEmail', { email });

        const result = await pool.query(
            'SELECT * FROM usuarios WHERE email = $1 LIMIT 1',
            [email]
        );

        const user = result.rows[0] || null;
        console.log(`[DAL] ✅ getUserByEmail: ${user ? 'encontrado' : 'no encontrado'}`);

        return user;
    } catch (error) {
        console.error('[DAL] ❌ Error en getUserByEmail:', error);
        throw error;
    }
}

/**
 * Crear usuario desde Google OAuth
 * @param {Object} googleData - Datos del usuario de Google
 * @param {string} googleData.email - Email del usuario
 * @param {string} googleData.name - Nombre del usuario
 * @param {string} googleData.picture - URL de foto de perfil (opcional)
 * @param {string} googleData.sub - ID único de Google
 * @returns {Promise<Object>} Usuario creado
 */
async function createUserFromGoogle(googleData) {
    try {
        console.log('[DAL] Ejecutando: createUserFromGoogle', { email: googleData.email });

        const { email, name, picture = null, sub } = googleData;

        // Parsear nombre para obtener nombre y apellidos
        const nameParts = (name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        const apellidoPaterno = nameParts[1] || '';
        const apellidoMaterno = nameParts.slice(2).join(' ') || '';

        // Generar UUID para el usuario (PostgreSQL)
        const userUUID = require('crypto').randomUUID();

        const result = await pool.query(
            `INSERT INTO usuarios
             (uuid, email, username, password_hash, role, status, nombre, apellido_paterno, apellido_materno, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
             RETURNING id, uuid, email, username, role, nombre, apellido_paterno, apellido_materno`,
            [
                userUUID,                           // uuid
                email,                              // email
                email.split('@')[0],                // username (parte antes de @)
                null,                               // password_hash (NULL para Google OAuth)
                'estudiante',                       // role (por defecto)
                'activo',                           // status (activo por defecto)
                firstName,                          // nombre
                apellidoPaterno,                    // apellido_paterno
                apellidoMaterno                     // apellido_materno
            ]
        );

        const user = result.rows[0];
        console.log(`[DAL] ✅ createUserFromGoogle: usuario creado con ID ${user.id}`);

        return user;
    } catch (error) {
        console.error('[DAL] ❌ Error en createUserFromGoogle:', error);
        throw error;
    }
}

/**
 * ============================================
 * EXPORTACIÓN DE FUNCIONES DAL
 * ============================================
 */

module.exports = {
    // Estudiantes
    getAllStudents,
    getStudentById,
    getStudentsByGrade,
    createStudent,
    updateStudent,
    deleteStudent,
    getStudentStats,

    // Docentes
    getAllTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeacher,

    // Egresados
    getAllEgresados,
    getEgresadoById,
    createEgresado,
    updateEgresado,
    deleteEgresado,
    getEgresadoStats,

    // Padres
    getAllParents,
    getParentById,
    createParent,
    updateParent,
    deleteParent,

    // Noticias
    getAllNews,
    getNewsById,
    createNews,
    updateNews,
    deleteNews,

    // Cursos
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,

    // Usuarios
    getUserByEmail,
    createUserFromGoogle,

    // Tenants (Multi-Tenant)
    getTenantByDomain,
    getTenantById,
    getAllTenants,
    createTenant,
    updateTenant,
};
