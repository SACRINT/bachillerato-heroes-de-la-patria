const path = require('path');

console.log('--- Debug de Entorno --- ');
console.log(`Directorio actual (cwd): ${process.cwd()}`);
console.log(`__dirname: ${__dirname}`);

const envPath = path.resolve(__dirname, '../.env');
console.log(`Ruta calculada para .env: ${envPath}`);

console.log('\nIntentando cargar .env con dotenv...');
const result = require('dotenv').config({
    path: envPath,
    debug: true // Habilita el log de depuración de dotenv
});

if (result.error) {
    console.error('\n❌ ERROR DE DOTENV:', result.error);
}

console.log('\n--- Contenido parseado por dotenv ---');
console.log(result.parsed);

console.log('\n--- Valor de process.env.DATABASE_URL ---');
console.log(process.env.DATABASE_URL);

console.log('\n--- Valor de process.env.JWT_EXPIRES_IN ---');
console.log(process.env.JWT_EXPIRES_IN);

console.log('\n--- Fin del Debug ---');
