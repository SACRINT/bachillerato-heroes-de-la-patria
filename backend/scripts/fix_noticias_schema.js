const { executeQuery } = require('../config/database');

async function runMigration() {
    console.log('🚀 Iniciando migración de tabla noticias...');

    const queries = [
        "ALTER TABLE noticias ADD COLUMN IF NOT EXISTS slug VARCHAR(300) UNIQUE",
        "ALTER TABLE noticias ADD COLUMN IF NOT EXISTS etiquetas JSON DEFAULT '[]'",
        "ALTER TABLE noticias ADD COLUMN IF NOT EXISTS meta_descripcion TEXT",
        "ALTER TABLE noticias ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45)",
        "ALTER TABLE noticias ADD COLUMN IF NOT EXISTS user_agent TEXT"
    ];

    for (const query of queries) {
        try {
            await executeQuery(query, []);
            console.log(`✅ Ejecutado: ${query}`);
        } catch (error) {
            console.error(`❌ Error en: ${query}`, error.message);
        }
    }

    console.log('🏁 Migración finalizada.');
    process.exit(0);
}

runMigration();
