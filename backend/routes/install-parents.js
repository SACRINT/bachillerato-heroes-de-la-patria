"use strict";
/**
 * ENDPOINT TEMPORAL PARA INSTALAR PORTAL DE PADRES - TypeScript
 * Este endpoint ejecuta el SQL de creación de tablas
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
// @ts-ignore
const debug_logger_1 = require("../utils/debug-logger");
// @ts-ignore
const database_1 = require("../config/database");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
// POST /api/install-parents/install - Ejecutar instalación
router.post('/install', async (req, res) => {
    const client = await database_1.pool.connect();
    try {
        debug_logger_1.debugLog.log('INSTALL_PARENTS', '\n🚀 Instalando Portal de Padres desde endpoint...\n');
        // Leer el archivo SQL
        const sqlPath = path_1.default.join(__dirname, '..', 'scripts', 'create-parents-portal-tables.sql');
        const sql = await promises_1.default.readFile(sqlPath, 'utf-8');
        debug_logger_1.debugLog.log('INSTALL_PARENTS', '📄 Archivo SQL cargado, tamaño:', sql.length, 'caracteres');
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
        debug_logger_1.debugLog.log('INSTALL_PARENTS', '✅ Portal de Padres instalado correctamente');
        res.json({
            success: true,
            message: 'Portal de Padres instalado exitosamente',
            tables: result.rows.map((r) => r.table_name),
            views: viewsResult.rows.map((r) => r.table_name),
            data: {
                parents: parseInt(parentsCount.rows[0].count),
                students: parseInt(studentsCount.rows[0].count)
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('INSTALL_PARENTS', '❌ Error durante instalación:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al instalar Portal de Padres',
            details: error.message
        });
    }
    finally {
        client.release();
    }
});
module.exports = router;
//# sourceMappingURL=install-parents.js.map