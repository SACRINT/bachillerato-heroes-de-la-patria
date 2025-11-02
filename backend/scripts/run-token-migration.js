/**
 * 🔧 SCRIPT DE MIGRACIÓN: Agregar columna token_verificacion
 * Ejecuta la migración para agregar la columna token_verificacion a suscriptores_notificaciones
 */

const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigration() {
    try {
        console.log('🚀 [MIGRATION] Iniciando migración de token_verificacion...\n');

        // Leer el archivo SQL simplificado (sin bloques PL/pgSQL)
        const sqlFilePath = path.join(__dirname, '../seeds/add_token_verificacion_column_simple.sql');

        if (!fs.existsSync(sqlFilePath)) {
            throw new Error(`Archivo SQL no encontrado: ${sqlFilePath}`);
        }

        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        console.log('📄 [MIGRATION] Archivo SQL cargado exitosamente\n');

        // Separar las sentencias SQL por punto y coma
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`📊 [MIGRATION] Se ejecutarán ${statements.length} sentencias SQL\n`);

        // Ejecutar cada sentencia
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];

            // Saltar comentarios y líneas vacías
            if (!statement || statement.startsWith('--')) continue;

            console.log(`⚙️ [MIGRATION] Ejecutando sentencia ${i + 1}/${statements.length}...`);

            try {
                const result = await db.executeQuery(statement);
                console.log(`✅ [MIGRATION] Sentencia ${i + 1} ejecutada exitosamente`);

                // Mostrar resultados si existen
                if (result && result.length > 0) {
                    console.log(`   📋 Resultados:`, result);
                }
            } catch (error) {
                // Algunos errores son esperados (como que la columna ya exista)
                if (error.message.includes('already exists') || error.code === '42701') {
                    console.log(`⚠️ [MIGRATION] Advertencia en sentencia ${i + 1}: ${error.message}`);
                } else {
                    throw error;
                }
            }
        }

        console.log('\n✅ [MIGRATION] Migración completada exitosamente\n');

        // Verificar la estructura final de la tabla
        console.log('🔍 [MIGRATION] Verificando estructura de la tabla...\n');

        const verifyQuery = `
            SELECT column_name, data_type, is_nullable, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'suscriptores_notificaciones'
            AND column_name IN ('token_verificacion', 'verificado', 'fecha_verificacion', 'estado')
            ORDER BY ordinal_position;
        `;

        const columns = await db.executeQuery(verifyQuery);

        console.log('📋 [MIGRATION] Columnas relevantes en suscriptores_notificaciones:');
        console.table(columns);

        console.log('\n🎉 [MIGRATION] ¡Todo listo! El sistema de verificación está completamente configurado.\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ [MIGRATION] Error durante la migración:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Ejecutar migración
runMigration();
