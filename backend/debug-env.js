const path = require('path');
const devLogger = require('../utils/devLogger');

devLogger.log('--- Debug de Entorno --- ');
devLogger.log(`Directorio actual (cwd): ${process.cwd()}`);
devLogger.log(`__dirname: ${__dirname}`);

const envPath = path.resolve(__dirname, '../.env');
devLogger.log(`Ruta calculada para .env: ${envPath}`);

devLogger.log('\nIntentando cargar .env con dotenv...');
const result = require('dotenv').config({
    path: envPath,
    debug: true // Habilita el log de depuración de dotenv
});

if (result.error) {
    devLogger.error('\n❌ ERROR DE DOTENV:', result.error);
}

devLogger.log('\n--- Contenido parseado por dotenv ---');
devLogger.log(result.parsed);

devLogger.log('\n--- Valor de process.env.DATABASE_URL ---');
devLogger.log(process.env.DATABASE_URL);

devLogger.log('\n--- Valor de process.env.JWT_EXPIRES_IN ---');
devLogger.log(process.env.JWT_EXPIRES_IN);

devLogger.log('\n--- Fin del Debug ---');
