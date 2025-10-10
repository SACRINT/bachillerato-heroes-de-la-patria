/**
 * 🎓 API CRUD PARA EGRESADOS
 * Gestión completa de datos de egresados del bachillerato
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ============================================
// GET - Filtrar egresados por generación
// NOTA: Esta ruta debe estar ANTES de /:id para evitar conflictos
// ============================================
router.get('/generacion/:generacion', async (req, res) => {
    try {
        const { generacion } = req.params;

        const [egresados] = await db.query(
            'SELECT * FROM egresados WHERE generacion = ? ORDER BY nombre',
            [generacion]
        );

        res.json({
            success: true,
            generacion,
            total: egresados.length,
            egresados
        });

    } catch (error) {
        console.error('❌ Error al filtrar por generación:', error);
        res.status(500).json({
            success: false,
            error: 'Error al filtrar egresados'
        });
    }
});

// ============================================
// GET - Estadísticas de egresados
// NOTA: Esta ruta debe estar ANTES de /:id para evitar conflictos
// ============================================
router.get('/stats/general', async (req, res) => {
    try {
        // Total de egresados
        const [totalResult] = await db.query('SELECT COUNT(*) as total FROM egresados');
        const total = totalResult[0].total;

        // Por generación
        const [porGeneracion] = await db.query(`
            SELECT generacion, COUNT(*) as cantidad
            FROM egresados
            GROUP BY generacion
            ORDER BY generacion DESC
        `);

        // Por estatus de estudios
        const [porEstatus] = await db.query(`
            SELECT estatus_estudios, COUNT(*) as cantidad
            FROM egresados
            WHERE estatus_estudios IS NOT NULL
            GROUP BY estatus_estudios
        `);

        // Historias publicables
        const [historiasResult] = await db.query(`
            SELECT COUNT(*) as total
            FROM egresados
            WHERE autoriza_publicar = TRUE AND historia_exito IS NOT NULL
        `);

        res.json({
            success: true,
            stats: {
                total,
                porGeneracion,
                porEstatus,
                historiasPublicables: historiasResult[0].total
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

// ============================================
// GET - Listar todos los egresados
// ============================================
router.get('/', async (req, res) => {
    try {
        const [egresados] = await db.query(`
            SELECT
                id,
                nombre,
                email,
                generacion,
                telefono,
                ciudad,
                ocupacion_actual,
                universidad,
                carrera,
                estatus_estudios,
                anio_egreso,
                historia_exito,
                autoriza_publicar,
                verificado,
                fecha_registro,
                fecha_actualizacion
            FROM egresados
            ORDER BY fecha_registro DESC
        `);

        res.json({
            success: true,
            total: egresados.length,
            egresados
        });

    } catch (error) {
        console.error('❌ Error al obtener egresados:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener lista de egresados'
        });
    }
});

// ============================================
// GET - Obtener egresado por ID
// NOTA: Esta ruta debe estar DESPUÉS de rutas específicas
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [egresados] = await db.query(
            'SELECT * FROM egresados WHERE id = ?',
            [id]
        );

        if (egresados.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Egresado no encontrado'
            });
        }

        res.json({
            success: true,
            egresado: egresados[0]
        });

    } catch (error) {
        console.error('❌ Error al obtener egresado:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener datos del egresado'
        });
    }
});

// ============================================
// POST - Crear nuevo egresado
// ============================================
router.post('/', async (req, res) => {
    try {
        const {
            nombre,
            email,
            generacion,
            telefono,
            ciudad,
            ocupacion_actual,
            universidad,
            carrera,
            estatus_estudios,
            anio_egreso,
            historia_exito,
            autoriza_publicar,
            verificado = true,
            ip_registro
        } = req.body;

        // Validaciones básicas
        if (!nombre || !email || !generacion) {
            return res.status(400).json({
                success: false,
                error: 'Nombre, email y generación son obligatorios'
            });
        }

        // Verificar si el email ya existe
        const [existing] = await db.query(
            'SELECT id FROM egresados WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            // Actualizar registro existente
            const updateQuery = `
                UPDATE egresados SET
                    nombre = ?,
                    generacion = ?,
                    telefono = ?,
                    ciudad = ?,
                    ocupacion_actual = ?,
                    universidad = ?,
                    carrera = ?,
                    estatus_estudios = ?,
                    anio_egreso = ?,
                    historia_exito = ?,
                    autoriza_publicar = ?,
                    verificado = ?,
                    fecha_actualizacion = NOW(),
                    ip_registro = ?
                WHERE email = ?
            `;

            await db.query(updateQuery, [
                nombre,
                generacion,
                telefono || null,
                ciudad || null,
                ocupacion_actual || null,
                universidad || null,
                carrera || null,
                estatus_estudios || null,
                anio_egreso || null,
                historia_exito || null,
                autoriza_publicar || false,
                verificado,
                ip_registro || null,
                email
            ]);

            return res.json({
                success: true,
                message: 'Datos de egresado actualizados exitosamente',
                id: existing[0].id,
                updated: true
            });
        }

        // Insertar nuevo egresado
        const insertQuery = `
            INSERT INTO egresados (
                nombre,
                email,
                generacion,
                telefono,
                ciudad,
                ocupacion_actual,
                universidad,
                carrera,
                estatus_estudios,
                anio_egreso,
                historia_exito,
                autoriza_publicar,
                verificado,
                ip_registro
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(insertQuery, [
            nombre,
            email,
            generacion,
            telefono || null,
            ciudad || null,
            ocupacion_actual || null,
            universidad || null,
            carrera || null,
            estatus_estudios || null,
            anio_egreso || null,
            historia_exito || null,
            autoriza_publicar || false,
            verificado,
            ip_registro || null
        ]);

        res.status(201).json({
            success: true,
            message: 'Egresado registrado exitosamente',
            id: result.insertId,
            updated: false
        });

    } catch (error) {
        console.error('❌ Error al crear egresado:', error);
        res.status(500).json({
            success: false,
            error: 'Error al registrar egresado',
            details: error.message
        });
    }
});

// ============================================
// PUT - Actualizar egresado
// ============================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            email,
            generacion,
            telefono,
            ciudad,
            ocupacion_actual,
            universidad,
            carrera,
            estatus_estudios,
            anio_egreso,
            historia_exito,
            autoriza_publicar,
            verificado
        } = req.body;

        const updateQuery = `
            UPDATE egresados SET
                nombre = ?,
                email = ?,
                generacion = ?,
                telefono = ?,
                ciudad = ?,
                ocupacion_actual = ?,
                universidad = ?,
                carrera = ?,
                estatus_estudios = ?,
                anio_egreso = ?,
                historia_exito = ?,
                autoriza_publicar = ?,
                verificado = ?,
                fecha_actualizacion = NOW()
            WHERE id = ?
        `;

        const [result] = await db.query(updateQuery, [
            nombre,
            email,
            generacion,
            telefono || null,
            ciudad || null,
            ocupacion_actual || null,
            universidad || null,
            carrera || null,
            estatus_estudios || null,
            anio_egreso || null,
            historia_exito || null,
            autoriza_publicar || false,
            verificado !== undefined ? verificado : true,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Egresado no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Egresado actualizado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error al actualizar egresado:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar egresado'
        });
    }
});

// ============================================
// DELETE - Eliminar egresado
// ============================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            'DELETE FROM egresados WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Egresado no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Egresado eliminado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error al eliminar egresado:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar egresado'
        });
    }
});

module.exports = router;
