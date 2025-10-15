import { query } from './database.js';

export default async function handler(req, res) {
  try {
    const { method, query: params, body } = req;

    switch (method) {
      case 'GET':
        if (params.generacion) {
          // Filtrar egresados por generación
          const egresados = await query(
            'SELECT * FROM egresados WHERE generacion = $1 ORDER BY nombre',
            [params.generacion]
          );
          res.status(200).json({
            success: true,
            generacion: params.generacion,
            total: egresados.rows.length,
            egresados: egresados.rows
          });
        } else if (params.stats === 'general') {
          // Estadísticas de egresados
          const totalResult = await query('SELECT COUNT(*) as total FROM egresados');
          const porGeneracion = await query(`
            SELECT generacion, COUNT(*) as cantidad
            FROM egresados
            GROUP BY generacion
            ORDER BY generacion DESC
          `);
          const porEstatus = await query(`
            SELECT estatus_estudios, COUNT(*) as cantidad
            FROM egresados
            WHERE estatus_estudios IS NOT NULL
            GROUP BY estatus_estudios
          `);
          const historiasResult = await query(`
            SELECT COUNT(*) as total
            FROM egresados
            WHERE autoriza_publicar = TRUE AND historia_exito IS NOT NULL
          `);

          res.status(200).json({
            success: true,
            stats: {
              total: parseInt(totalResult.rows[0].total),
              porGeneracion: porGeneracion.rows.map(g => ({
                generacion: g.generacion,
                cantidad: parseInt(g.cantidad)
              })),
              porEstatus: porEstatus.rows.map(e => ({
                estatus_estudios: e.estatus_estudios,
                cantidad: parseInt(e.cantidad)
              })),
              historiasPublicables: parseInt(historiasResult.rows[0].total)
            }
          });
        } else if (params.id) {
          // Obtener egresado por ID
          const egresados = await query(
            'SELECT * FROM egresados WHERE id = $1',
            [params.id]
          );
          if (egresados.rows.length === 0) {
            return res.status(404).json({
              success: false,
              error: 'Egresado no encontrado'
            });
          }
          res.status(200).json({
            success: true,
            egresado: egresados.rows[0]
          });
        } else {
          // Listar todos los egresados
          const egresados = await query(`
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
          res.status(200).json({
            success: true,
            total: egresados.rows.length,
            egresados: egresados.rows
          });
        }
        break;

      case 'POST':
        {
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
            verificado = true
          } = body;

          if (!nombre || !email || !generacion) {
            return res.status(400).json({
              success: false,
              error: 'Nombre, email y generación son obligatorios'
            });
          }

          const existing = await query(
            'SELECT id FROM egresados WHERE email = $1',
            [email]
          );

          if (existing.rows.length > 0) {
            const updateQuery = `
                UPDATE egresados SET
                    nombre = $1,
                    generacion = $2,
                    telefono = $3,
                    ciudad = $4,
                    ocupacion_actual = $5,
                    universidad = $6,
                    carrera = $7,
                    estatus_estudios = $8,
                    anio_egreso = $9,
                    historia_exito = $10,
                    autoriza_publicar = $11,
                    verificado = $12,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE email = $13
                RETURNING id
            `;

            const result = await query(updateQuery, [
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
              email
            ]);

            return res.status(200).json({
              success: true,
              message: 'Datos de egresado actualizados exitosamente',
              id: result.rows[0].id,
              updated: true
            });
          }

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
                verificado
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id
          `;

          const result = await query(insertQuery, [
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
            verificado
          ]);

          res.status(201).json({
            success: true,
            message: 'Egresado registrado exitosamente',
            id: result.rows[0].id,
            updated: false
          });
        }
        break;

      case 'PUT':
        {
          const { id } = params;
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
          } = body;

          const updateQuery = `
            UPDATE egresados SET
                nombre = $1,
                email = $2,
                generacion = $3,
                telefono = $4,
                ciudad = $5,
                ocupacion_actual = $6,
                universidad = $7,
                carrera = $8,
                estatus_estudios = $9,
                anio_egreso = $10,
                historia_exito = $11,
                autoriza_publicar = $12,
                verificado = $13,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = $14
          `;

          const result = await query(updateQuery, [
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

          if (result.rowCount === 0) {
            return res.status(404).json({
              success: false,
              error: 'Egresado no encontrado'
            });
          }

          res.status(200).json({
            success: true,
            message: 'Egresado actualizado exitosamente'
          });
        }
        break;

      case 'DELETE':
        {
          const { id } = params;

          const result = await query(
            'DELETE FROM egresados WHERE id = $1',
            [id]
          );

          if (result.rowCount === 0) {
            return res.status(404).json({
              success: false,
              error: 'Egresado no encontrado'
            });
          }

          res.status(200).json({
            success: true,
            message: 'Egresado eliminado exitosamente'
          });
        }
        break;

      default:
        res.status(405).send('Method Not Allowed');
        break;
    }
  } catch (error) {
    console.error('❌ Error en la función egresados:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}