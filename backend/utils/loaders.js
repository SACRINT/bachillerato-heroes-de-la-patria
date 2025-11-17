/**
 * 🎯 DATALOADERS ESPECÍFICOS PARA BGE - SEMANA 3
 * Loaders pre-configurados para resolver N+1 queries en el proyecto
 *
 * Uso:
 * const { calificacionesLoader } = require('./utils/loaders');
 * const calificaciones = await calificacionesLoader.load(estudiante_id);
 */

const DataLoader = require('./dataloader');
const { pool } = require('../config/database');

// ============================================
// CALIFICACIONES LOADER
// ============================================

/**
 * Batch load de calificaciones por estudiante_id
 * Resuelve: 1 + N queries → 2 queries
 */
function createCalificacionesLoader() {
    return new DataLoader(async (estudianteIds) => {
        console.log(`[DATALOADER] Cargando calificaciones para ${estudianteIds.length} estudiantes`);

        // 1 solo query para TODAS las calificaciones
        const query = `
            SELECT
                estudiante_id,
                jsonb_agg(
                    jsonb_build_object(
                        'id', id,
                        'materia_id', materia_id,
                        'periodo_academico', periodo_academico,
                        'calificacion_final', calificacion_final,
                        'fecha_registro', fecha_registro
                    ) ORDER BY periodo_academico DESC
                ) as calificaciones
            FROM calificaciones
            WHERE estudiante_id = ANY($1)
            GROUP BY estudiante_id;
        `;

        const result = await pool.query(query, [estudianteIds]);

        // Crear mapa de estudiante_id → calificaciones
        const calificacionesMap = new Map();
        result.rows.forEach(row => {
            calificacionesMap.set(row.estudiante_id, row.calificaciones);
        });

        // Retornar en el mismo orden que estudianteIds
        return estudianteIds.map(id => calificacionesMap.get(id) || []);
    });
}

// ============================================
// ASISTENCIA LOADER
// ============================================

/**
 * Batch load de asistencia por estudiante_id
 */
function createAsistenciaLoader() {
    return new DataLoader(async (estudianteIds) => {
        console.log(`[DATALOADER] Cargando asistencia para ${estudianteIds.length} estudiantes`);

        const query = `
            SELECT
                estudiante_id,
                jsonb_agg(
                    jsonb_build_object(
                        'id', id,
                        'fecha', fecha,
                        'status', status,
                        'justificacion', justificacion
                    ) ORDER BY fecha DESC
                ) as asistencias
            FROM asistencia
            WHERE estudiante_id = ANY($1)
            GROUP BY estudiante_id;
        `;

        const result = await pool.query(query, [estudianteIds]);

        const asistenciaMap = new Map();
        result.rows.forEach(row => {
            asistenciaMap.set(row.estudiante_id, row.asistencias);
        });

        return estudianteIds.map(id => asistenciaMap.get(id) || []);
    });
}

// ============================================
// PAGOS PENDIENTES LOADER
// ============================================

/**
 * Batch load de pagos pendientes por estudiante_id
 */
function createPagosPendientesLoader() {
    return new DataLoader(async (estudianteIds) => {
        console.log(`[DATALOADER] Cargando pagos pendientes para ${estudianteIds.length} estudiantes`);

        const query = `
            SELECT
                estudiante_id,
                jsonb_agg(
                    jsonb_build_object(
                        'id', id,
                        'concepto', concepto,
                        'monto', monto,
                        'fecha_vencimiento', fecha_vencimiento,
                        'estado', estado
                    ) ORDER BY fecha_vencimiento ASC
                ) as pagos
            FROM pagos_pendientes
            WHERE estudiante_id = ANY($1) AND estado = 'pendiente'
            GROUP BY estudiante_id;
        `;

        const result = await pool.query(query, [estudianteIds]);

        const pagosMap = new Map();
        result.rows.forEach(row => {
            pagosMap.set(row.estudiante_id, row.pagos);
        });

        return estudianteIds.map(id => pagosMap.get(id) || []);
    });
}

// ============================================
// INSCRIPCIONES LOADER
// ============================================

/**
 * Batch load de inscripciones (cursos) por estudiante_id
 */
function createInscripcionesLoader() {
    return new DataLoader(async (estudianteIds) => {
        console.log(`[DATALOADER] Cargando inscripciones para ${estudianteIds.length} estudiantes`);

        const query = `
            SELECT
                i.estudiante_id,
                jsonb_agg(
                    jsonb_build_object(
                        'id', i.id,
                        'curso_id', i.curso_id,
                        'periodo_academico', i.periodo_academico,
                        'curso_nombre', c.nombre,
                        'creditos', c.creditos
                    ) ORDER BY i.periodo_academico DESC
                ) as inscripciones
            FROM inscripciones i
            LEFT JOIN cursos c ON i.curso_id = c.id
            WHERE i.estudiante_id = ANY($1)
            GROUP BY i.estudiante_id;
        `;

        const result = await pool.query(query, [estudianteIds]);

        const inscripcionesMap = new Map();
        result.rows.forEach(row => {
            inscripcionesMap.set(row.estudiante_id, row.inscripciones);
        });

        return estudianteIds.map(id => inscripcionesMap.get(id) || []);
    });
}

// ============================================
// DOCENTES LOADER (para cursos)
// ============================================

/**
 * Batch load de docentes por curso_id
 */
function createDocentesLoader() {
    return new DataLoader(async (cursoIds) => {
        console.log(`[DATALOADER] Cargando docentes para ${cursoIds.length} cursos`);

        const query = `
            SELECT
                cd.curso_id,
                jsonb_agg(
                    jsonb_build_object(
                        'id', d.id,
                        'nombre', d.nombre,
                        'apellido_paterno', d.apellido_paterno,
                        'email', d.email,
                        'especialidad', d.especialidad
                    )
                ) as docentes
            FROM cursos_docentes cd
            LEFT JOIN docentes d ON cd.docente_id = d.id
            WHERE cd.curso_id = ANY($1)
            GROUP BY cd.curso_id;
        `;

        const result = await pool.query(query, [cursoIds]);

        const docentesMap = new Map();
        result.rows.forEach(row => {
            docentesMap.set(row.curso_id, row.docentes);
        });

        return cursoIds.map(id => docentesMap.get(id) || []);
    });
}

// ============================================
// USUARIOS LOADER (por ID)
// ============================================

/**
 * Batch load de usuarios por ID
 */
function createUsuariosLoader() {
    return new DataLoader(async (userIds) => {
        console.log(`[DATALOADER] Cargando usuarios para ${userIds.length} IDs`);

        const query = `
            SELECT
                id,
                uuid,
                email,
                username,
                role,
                status,
                nombre,
                apellido_paterno,
                apellido_materno
            FROM usuarios
            WHERE id = ANY($1);
        `;

        const result = await pool.query(query, [userIds]);

        const usuariosMap = new Map();
        result.rows.forEach(row => {
            usuariosMap.set(row.id, row);
        });

        // Retornar en el mismo orden que userIds
        return userIds.map(id => {
            const user = usuariosMap.get(id);
            if (!user) {
                return new Error(`Usuario con ID ${id} no encontrado`);
            }
            return user;
        });
    });
}

// ============================================
// FACTORY FUNCTION PARA CREAR LOADERS
// ============================================

/**
 * Crear todos los loaders para una request
 * (Cada request debe tener su propio set de loaders para evitar leaks de caché)
 */
function createLoaders() {
    return {
        calificaciones: createCalificacionesLoader(),
        asistencia: createAsistenciaLoader(),
        pagosPendientes: createPagosPendientesLoader(),
        inscripciones: createInscripcionesLoader(),
        docentes: createDocentesLoader(),
        usuarios: createUsuariosLoader()
    };
}

// ============================================
// MIDDLEWARE PARA AGREGAR LOADERS A REQ
// ============================================

/**
 * Middleware que agrega loaders a cada request
 * Usar en app.js: app.use(loadersMiddleware);
 */
function loadersMiddleware(req, res, next) {
    req.loaders = createLoaders();
    next();
}

module.exports = {
    // Individual loaders (para uso directo)
    createCalificacionesLoader,
    createAsistenciaLoader,
    createPagosPendientesLoader,
    createInscripcionesLoader,
    createDocentesLoader,
    createUsuariosLoader,

    // Factory function
    createLoaders,

    // Middleware
    loadersMiddleware
};
