/**
 * 💾 BACKUP ALTERNATIVO DE POSTGRESQL SIN PG_DUMP
 * Backup usando queries SQL directas - Compatible con Windows sin PostgreSQL instalado
 * Fecha: 19 de Octubre, 2025
 */

const fs = require('fs').promises;
const path = require('path');
const { pool } = require('../config/database');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

class SQLDatabaseBackup {
    constructor() {
        this.backupDir = path.join(__dirname, '../../backups/database-sql');
        this.retentionDays = 7;
    }

    /**
     * Ejecutar backup SQL directo
     */
    async runBackup() {
        console.log('💾 Iniciando backup de base de datos (SQL directo)...\n');

        try {
            // Crear directorio de backups
            await fs.mkdir(this.backupDir, { recursive: true });
            console.log(`✅ Directorio de backups: ${this.backupDir}`);

            // Obtener todas las tablas
            const tables = await this.getAllTables();
            console.log(`📊 ${tables.length} tablas encontradas\n`);

            // Generar SQL de backup
            const backupSQL = await this.generateBackupSQL(tables);

            // Guardar archivo de backup
            const backupFile = await this.saveBackup(backupSQL);

            // Aplicar retención
            await this.applyRetentionPolicy();

            // Generar reporte
            await this.generateReport(backupFile, tables.length);

            return {
                success: true,
                backupFile,
                timestamp: new Date().toISOString(),
                tablesBackedUp: tables.length
            };

        } catch (error) {
            console.error('❌ Error en backup SQL:', error);
            throw error;
        }
    }

    /**
     * Obtener lista de todas las tablas
     */
    async getAllTables() {
        const query = `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `;

        const result = await pool.query(query);
        return result.rows.map(row => row.table_name);
    }

    /**
     * Generar SQL completo de backup
     */
    async generateBackupSQL(tables) {
        let sql = '';

        // Header del backup
        sql += `-- PostgreSQL Database Backup\n`;
        sql += `-- Generated: ${new Date().toISOString()}\n`;
        sql += `-- Database: ${process.env.DATABASE_URL ? 'Connected' : 'Unknown'}\n`;
        sql += `-- Tables: ${tables.length}\n\n`;

        sql += `-- ========================================\n`;
        sql += `-- DISABLE TRIGGERS (for faster restore)\n`;
        sql += `-- ========================================\n\n`;

        for (const table of tables) {
            console.log(`📥 Procesando tabla: ${table}...`);

            // Obtener estructura de la tabla
            const createTableSQL = await this.getCreateTableSQL(table);
            sql += createTableSQL + '\n\n';

            // Obtener datos de la tabla
            const insertSQL = await this.getInsertSQL(table);
            if (insertSQL) {
                sql += insertSQL + '\n\n';
            }

            sql += `-- ========================================\n\n`;
        }

        sql += `-- ========================================\n`;
        sql += `-- ENABLE TRIGGERS\n`;
        sql += `-- ========================================\n\n`;

        console.log('✅ SQL de backup generado\n');

        return sql;
    }

    /**
     * Obtener SQL de creación de tabla
     */
    async getCreateTableSQL(tableName) {
        let sql = `-- Table: ${tableName}\n`;
        sql += `DROP TABLE IF EXISTS ${tableName} CASCADE;\n\n`;

        // Obtener columnas
        const columnsQuery = `
            SELECT
                column_name,
                data_type,
                character_maximum_length,
                column_default,
                is_nullable
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position;
        `;

        const columns = await pool.query(columnsQuery, [tableName]);

        sql += `CREATE TABLE ${tableName} (\n`;

        const columnDefinitions = columns.rows.map(col => {
            let def = `  ${col.column_name} ${col.data_type}`;

            if (col.character_maximum_length) {
                def += `(${col.character_maximum_length})`;
            }

            if (col.column_default) {
                def += ` DEFAULT ${col.column_default}`;
            }

            if (col.is_nullable === 'NO') {
                def += ' NOT NULL';
            }

            return def;
        });

        sql += columnDefinitions.join(',\n');
        sql += '\n);\n';

        return sql;
    }

    /**
     * Obtener SQL de inserción de datos
     */
    async getInsertSQL(tableName) {
        try {
            const dataQuery = `SELECT * FROM ${tableName}`;
            const result = await pool.query(dataQuery);

            if (result.rows.length === 0) {
                return `-- No data in ${tableName}\n`;
            }

            let sql = `-- Data for ${tableName} (${result.rows.length} rows)\n`;

            const columns = Object.keys(result.rows[0]);

            for (const row of result.rows) {
                const values = columns.map(col => {
                    const value = row[col];

                    if (value === null) {
                        return 'NULL';
                    } else if (typeof value === 'string') {
                        // Escapar comillas simples
                        return `'${value.replace(/'/g, "''")}'`;
                    } else if (typeof value === 'boolean') {
                        return value ? 'true' : 'false';
                    } else if (value instanceof Date) {
                        return `'${value.toISOString()}'`;
                    } else if (typeof value === 'object') {
                        return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
                    } else {
                        return value;
                    }
                });

                sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
            }

            return sql;

        } catch (error) {
            console.warn(`⚠️ Error al obtener datos de ${tableName}:`, error.message);
            return `-- Error backing up data for ${tableName}\n`;
        }
    }

    /**
     * Guardar backup en archivo
     */
    async saveBackup(sql) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(this.backupDir, `backup-sql-${timestamp}.sql`);

        await fs.writeFile(backupFile, sql, 'utf-8');

        console.log(`✅ Backup guardado: ${path.basename(backupFile)}`);

        return backupFile;
    }

    /**
     * Aplicar política de retención
     */
    async applyRetentionPolicy() {
        console.log('\n🗑️ Aplicando política de retención...');

        try {
            const files = await fs.readdir(this.backupDir);
            const now = Date.now();

            let deleted = 0;

            for (const file of files) {
                if (!file.endsWith('.sql')) continue;

                const filePath = path.join(this.backupDir, file);
                const stats = await fs.stat(filePath);
                const ageInDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);

                if (ageInDays > this.retentionDays) {
                    await fs.unlink(filePath);
                    deleted++;
                    console.log(`  🗑️ Eliminado: ${file} (${Math.floor(ageInDays)} días)`);
                }
            }

            console.log(`✅ ${deleted} backup(s) antiguos eliminados\n`);

        } catch (error) {
            console.error('❌ Error al aplicar retención:', error);
        }
    }

    /**
     * Generar reporte
     */
    async generateReport(backupFile, tablesCount) {
        try {
            const stats = await fs.stat(backupFile);
            const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

            const report = {
                timestamp: new Date().toISOString(),
                backupFile: path.basename(backupFile),
                sizeMB: sizeMB,
                tablesBackedUp: tablesCount,
                method: 'SQL Direct (No pg_dump)',
                retentionDays: this.retentionDays
            };

            console.log('\n' + '='.repeat(60));
            console.log('📊 REPORTE DE BACKUP SQL');
            console.log('='.repeat(60));
            console.log(`Archivo: ${report.backupFile}`);
            console.log(`Tamaño: ${report.sizeMB} MB`);
            console.log(`Tablas: ${report.tablesBackedUp}`);
            console.log(`Método: ${report.method}`);
            console.log(`Timestamp: ${report.timestamp}`);
            console.log('='.repeat(60) + '\n');

            // Guardar reporte
            const reportPath = path.join(this.backupDir, 'last-backup-report.json');
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        } catch (error) {
            console.error('Error al generar reporte:', error);
        }
    }
}

// Ejecutar backup si se llama directamente
if (require.main === module) {
    (async () => {
        try {
            const backup = new SQLDatabaseBackup();
            await backup.runBackup();

            console.log('✅ Backup SQL completado exitosamente\n');
            process.exit(0);

        } catch (error) {
            console.error('❌ Error fatal en backup SQL:', error);
            process.exit(1);
        }
    })();
}

module.exports = SQLDatabaseBackup;
