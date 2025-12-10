/**
 * ENDPOINT TEMPORAL PARA INSTALAR PORTAL DE PADRES - TypeScript
 * Este endpoint ejecuta el SQL de creación de tablas
 */

import express, { Request, Response } from 'express';
// @ts-ignore
import { debugLog } from '../utils/debug-logger';
// @ts-ignore
import { pool } from '../config/database';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// POST /api/install-parents/install - Ejecutar instalación
router.post('/install', async (req: Request, res: Response): Promise<void> => {
    const client = await pool.connect();

    try {
        debugLog.log('INSTALL_PARENTS', '\n🚀 Instalando Portal de Padres desde endpoint...\n');

        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, '..', 'scripts', 'create-parents-portal-tables.sql');
        const sql = await fs.readFile(sqlPath, 'utf-8');

        debugLog.log('INSTALL_PARENTS', '📄 Archivo SQL cargado, tamaño:', sql.length, 'caracteres');

        // Ejecutar el script
        await client.query(sql);

        // Verificar tablas creadas
        const tablesQuery = `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND (
                table_name LIKE 'parent%'
                OR table_name = 'students'
                OR table_name = 'grades'
                OR table_name = 'attendance'
                OR table_name = 'payments'
            )
            ORDER BY table_name;
        `;

        const result = await client.query(tablesQuery);

        // Verificar vistas
        const viewsQuery = `
            SELECT table_name
            FROM information_schema.views
            WHERE table_schema = 'public'
            AND table_name LIKE 'v_%parent%'
            ORDER BY table_name;
        `;
        const viewsResult = await client.query(viewsQuery);

        // Contar registros
        const parentsCount = await client.query('SELECT COUNT(*) as count FROM parents');
        const studentsCount = await client.query('SELECT COUNT(*) as count FROM students');

        debugLog.log('INSTALL_PARENTS', '✅ Portal de Padres instalado correctamente');

        res.json({
            success: true,
            message: 'Portal de Padres instalado exitosamente',
            tables: result.rows.map((r: any) => r.table_name),
            views: viewsResult.rows.map((r: any) => r.table_name),
            data: {
                parents: parseInt(parentsCount.rows[0].count),
                students: parseInt(studentsCount.rows[0].count)
            },
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        debugLog.error('INSTALL_PARENTS', '❌ Error durante instalación:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al instalar Portal de Padres',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// @ts-ignore
export = router;
