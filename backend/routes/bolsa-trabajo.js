/**
 * 💼 API CRUD PARA BOLSA DE TRABAJO
 * Gestión completa de CVs y candidatos
 * Fecha: 09 Octubre 2025
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ============================================
// GET - Listar todos los candidatos
// ============================================
router.get('/', async (req, res) => {
    try {
        const [candidatos] = await db.query(`
            SELECT
                id,
                nombre,
                email,
                telefono,
                ciudad,
                generacion,
                area_interes,
                resumen_profesional,
                habilidades,
                cv_filename,
                cv_url,
                estado,
                notas_admin,
                empresas_compartido,
                fecha_registro,
                fecha_actualizacion,
                fecha_ultimo_contacto
            FROM bolsa_trabajo
            ORDER BY fecha_registro DESC
        `);

        res.json({
            success: true,
            total: candidatos.length,
            candidatos
        });

    } catch (error) {
        console.error('❌ Error al obtener candidatos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener lista de candidatos'
        });
    }
});

// ============================================
// GET - Filtrar candidatos por estado
// ============================================
router.get('/estado/:estado', async (req, res) => {
    try {
        const { estado } = req.params;

        const [candidatos] = await db.query(
            'SELECT * FROM bolsa_trabajo WHERE estado = ? ORDER BY fecha_registro DESC',
            [estado]
        );

        res.json({
            success: true,
            estado,
            total: candidatos.length,
            candidatos
        });

    } catch (error) {
        console.error('❌ Error al filtrar por estado:', error);
        res.status(500).json({
            success: false,
            error: 'Error al filtrar candidatos'
        });
    }
});

// ============================================
// GET - Filtrar candidatos por generación
// ============================================
router.get('/generacion/:generacion', async (req, res) => {
    try {
        const { generacion } = req.params;

        const [candidatos] = await db.query(
            'SELECT * FROM bolsa_trabajo WHERE generacion = ? ORDER BY fecha_registro DESC',
            [generacion]
        );

        res.json({
            success: true,
            generacion,
            total: candidatos.length,
            candidatos
        });

    } catch (error) {
        console.error('❌ Error al filtrar por generación:', error);
        res.status(500).json({
            success: false,
            error: 'Error al filtrar candidatos'
        });
    }
});

// ============================================
// GET - Estadísticas generales
// ============================================
router.get('/stats/general', async (req, res) => {
    try {
        // Total de candidatos
        const [totalResult] = await db.query('SELECT COUNT(*) as total FROM bolsa_trabajo');
        const total = totalResult[0].total;

        // Por estado
        const [porEstado] = await db.query(`
            SELECT estado, COUNT(*) as cantidad
            FROM bolsa_trabajo
            GROUP BY estado
        `);

        // Por generación
        const [porGeneracion] = await db.query(`
            SELECT generacion, COUNT(*) as cantidad
            FROM bolsa_trabajo
            WHERE generacion IS NOT NULL
            GROUP BY generacion
            ORDER BY generacion DESC
        `);

        // Candidatos nuevos (últimos 7 días)
        const [nuevosResult] = await db.query(`
            SELECT COUNT(*) as total
            FROM bolsa_trabajo
            WHERE fecha_registro >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `);

        // CVs con archivo adjunto
        const [conCVResult] = await db.query(`
            SELECT COUNT(*) as total
            FROM bolsa_trabajo
            WHERE cv_filename IS NOT NULL
        `);

        res.json({
            success: true,
            stats: {
                total,
                porEstado,
                porGeneracion,
                nuevosUltimos7Dias: nuevosResult[0].total,
                conCV: conCVResult[0].total
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
// GET - Obtener candidato por ID
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [candidatos] = await db.query(
            'SELECT * FROM bolsa_trabajo WHERE id = ?',
            [id]
        );

        if (candidatos.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Candidato no encontrado'
            });
        }

        res.json({
            success: true,
            candidato: candidatos[0]
        });

    } catch (error) {
        console.error('❌ Error al obtener candidato:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener datos del candidato'
        });
    }
});

// ============================================
// POST - Crear nuevo candidato
// ============================================
router.post('/', async (req, res) => {
    try {
        const {
            nombre,
            email,
            telefono,
            ciudad,
            generacion,
            area_interes,
            resumen_profesional,
            habilidades,
            cv_filename,
            cv_path,
            cv_url,
            estado = 'nuevo',
            ip_registro,
            user_agent,
            form_type = 'Registro Bolsa de Trabajo'
        } = req.body;

        // Validaciones básicas
        if (!nombre || !email) {
            return res.status(400).json({
                success: false,
                error: 'Nombre y email son obligatorios'
            });
        }

        // Verificar si el email ya existe
        const [existing] = await db.query(
            'SELECT id FROM bolsa_trabajo WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            // Actualizar registro existente
            const updateQuery = `
                UPDATE bolsa_trabajo SET
                    nombre = ?,
                    telefono = ?,
                    ciudad = ?,
                    generacion = ?,
                    area_interes = ?,
                    resumen_profesional = ?,
                    habilidades = ?,
                    cv_filename = COALESCE(?, cv_filename),
                    cv_path = COALESCE(?, cv_path),
                    cv_url = COALESCE(?, cv_url),
                    fecha_actualizacion = NOW()
                WHERE email = ?
            `;

            await db.query(updateQuery, [
                nombre,
                telefono || null,
                ciudad || null,
                generacion || null,
                area_interes || null,
                resumen_profesional || null,
                habilidades || null,
                cv_filename || null,
                cv_path || null,
                cv_url || null,
                email
            ]);

            return res.json({
                success: true,
                message: 'Datos actualizados exitosamente',
                id: existing[0].id,
                updated: true
            });
        }

        // Insertar nuevo candidato
        const insertQuery = `
            INSERT INTO bolsa_trabajo (
                nombre,
                email,
                telefono,
                ciudad,
                generacion,
                area_interes,
                resumen_profesional,
                habilidades,
                cv_filename,
                cv_path,
                cv_url,
                estado,
                ip_registro,
                user_agent,
                form_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(insertQuery, [
            nombre,
            email,
            telefono || null,
            ciudad || null,
            generacion || null,
            area_interes || null,
            resumen_profesional || null,
            habilidades || null,
            cv_filename || null,
            cv_path || null,
            cv_url || null,
            estado,
            ip_registro || null,
            user_agent || null,
            form_type
        ]);

        res.status(201).json({
            success: true,
            message: 'Candidato registrado exitosamente',
            id: result.insertId,
            updated: false
        });

    } catch (error) {
        console.error('❌ Error al crear candidato:', error);
        res.status(500).json({
            success: false,
            error: 'Error al registrar candidato',
            details: error.message
        });
    }
});

// ============================================
// PUT - Actualizar candidato
// ============================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            email,
            telefono,
            ciudad,
            generacion,
            area_interes,
            resumen_profesional,
            habilidades,
            cv_filename,
            cv_path,
            cv_url,
            estado,
            notas_admin,
            empresas_compartido
        } = req.body;

        const updateQuery = `
            UPDATE bolsa_trabajo SET
                nombre = ?,
                email = ?,
                telefono = ?,
                ciudad = ?,
                generacion = ?,
                area_interes = ?,
                resumen_profesional = ?,
                habilidades = ?,
                cv_filename = ?,
                cv_path = ?,
                cv_url = ?,
                estado = ?,
                notas_admin = ?,
                empresas_compartido = ?,
                fecha_actualizacion = NOW()
            WHERE id = ?
        `;

        const [result] = await db.query(updateQuery, [
            nombre,
            email,
            telefono || null,
            ciudad || null,
            generacion || null,
            area_interes || null,
            resumen_profesional || null,
            habilidades || null,
            cv_filename || null,
            cv_path || null,
            cv_url || null,
            estado || 'nuevo',
            notas_admin || null,
            empresas_compartido || null,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Candidato no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Candidato actualizado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error al actualizar candidato:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar candidato'
        });
    }
});

// ============================================
// PATCH - Actualizar estado del candidato
// ============================================
router.patch('/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const validEstados = ['nuevo', 'revisado', 'contactado', 'contratado', 'rechazado', 'archivado'];

        if (!validEstados.includes(estado)) {
            return res.status(400).json({
                success: false,
                error: `Estado inválido. Debe ser uno de: ${validEstados.join(', ')}`
            });
        }

        const [result] = await db.query(
            'UPDATE bolsa_trabajo SET estado = ?, fecha_actualizacion = NOW() WHERE id = ?',
            [estado, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Candidato no encontrado'
            });
        }

        res.json({
            success: true,
            message: `Estado actualizado a: ${estado}`
        });

    } catch (error) {
        console.error('❌ Error al actualizar estado:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar estado'
        });
    }
});

// ============================================
// PATCH - Agregar nota administrativa
// ============================================
router.patch('/:id/notas', async (req, res) => {
    try {
        const { id } = req.params;
        const { notas_admin } = req.body;

        const [result] = await db.query(
            'UPDATE bolsa_trabajo SET notas_admin = ?, fecha_actualizacion = NOW() WHERE id = ?',
            [notas_admin, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Candidato no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Notas actualizadas exitosamente'
        });

    } catch (error) {
        console.error('❌ Error al actualizar notas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar notas'
        });
    }
});

// ============================================
// DELETE - Eliminar candidato
// ============================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            'DELETE FROM bolsa_trabajo WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Candidato no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Candidato eliminado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error al eliminar candidato:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar candidato'
        });
    }
});

module.exports = router;
