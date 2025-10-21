/**
 * ENDPOINT TEMPORAL PARA INSTALAR SISTEMA DE ENCUESTAS
 * Este endpoint ejecuta el SQL de creación de tablas
 * NOTA: Este archivo debe eliminarse después de la instalación
 */

const express = require('express');
const { pool } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// POST /api/install-polls - Ejecutar instalación
router.post('/install', async (req, res) => {
    const client = await pool.connect();

    try {
        console.log('\n🚀 Instalando Sistema de Encuestas desde endpoint...\n');

        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, '..', 'scripts', 'create-polls-tables.sql');
        const sql = await fs.readFile(sqlPath, 'utf-8');

        console.log('📄 Archivo SQL cargado, tamaño:', sql.length, 'caracteres');

        // Ejecutar el script
        await client.query(sql);

        // Verificar tablas creadas
        const tablesQuery = `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name LIKE 'poll%'
            ORDER BY table_name;
        `;

        const result = await client.query(tablesQuery);

        // Verificar categorías
        const categoriesQuery = 'SELECT COUNT(*) as count FROM poll_categories';
        const categoriesResult = await client.query(categoriesQuery);
        const categoriesCount = categoriesResult.rows[0].count;

        console.log('✅ Sistema de Encuestas instalado correctamente');

        res.json({
            success: true,
            message: 'Sistema de Encuestas instalado exitosamente',
            tables: result.rows.map(r => r.table_name),
            categories: parseInt(categoriesCount),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error durante instalación:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al instalar Sistema de Encuestas',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// POST /api/install-polls/add-options - Agregar opciones a una encuesta
router.post('/add-options', async (req, res) => {
    const client = await pool.connect();

    try {
        const { poll_id, options } = req.body;

        console.log(`\n🔧 Agregando ${options.length} opciones a la encuesta ${poll_id}...\n`);

        // Insertar opciones
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            await client.query(
                `INSERT INTO poll_options (poll_id, text, description, display_order)
                 VALUES ($1, $2, $3, $4)`,
                [poll_id, option.text, option.description || null, i + 1]
            );
        }

        // Verificar opciones insertadas
        const verifyQuery = `SELECT * FROM poll_options WHERE poll_id = $1`;
        const verifyResult = await client.query(verifyQuery, [poll_id]);

        console.log(`✅ ${verifyResult.rows.length} opciones agregadas correctamente`);

        res.json({
            success: true,
            message: `${verifyResult.rows.length} opciones agregadas exitosamente`,
            poll_id: parseInt(poll_id),
            options: verifyResult.rows
        });

    } catch (error) {
        console.error('❌ Error agregando opciones:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al agregar opciones',
            details: error.message
        });
    } finally {
        client.release();
    }
});

module.exports = router;
