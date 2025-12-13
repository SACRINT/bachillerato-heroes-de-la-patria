const bcrypt = require('bcryptjs');

// Generar hash para contraseña "Test123!"
const password = 'Test123!';
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

console.log('=== CREAR USUARIO DE PRUEBA ===');
console.log('Username: docente_test');
console.log('Email: docente@test.com');
console.log('Password: Test123!');
console.log('Password Hash:', hash);
console.log('\nSQL INSERT:');
console.log(`INSERT INTO usuarios (username, email, password_hash, role, status, nombre, apellido_paterno, apellido_materno) VALUES ('docente_test', 'docente@test.com', '${hash}', 'docente', 'activo', 'Docente', 'Test', '');`);

// Generar admin
const adminHash = bcrypt.hashSync('Admin123!', bcrypt.genSaltSync(10));
console.log('\n=== CREAR USUARIO ADMIN ===');
console.log('Username: admin_test');
console.log('Email: admin@test.com');
console.log('Password: Admin123!');
console.log(`INSERT INTO usuarios (username, email, password_hash, role, status, nombre, apellido_paterno, apellido_materno) VALUES ('admin_test', 'admin@test.com', '${adminHash}', 'admin', 'activo', 'Admin', 'Test', '');`);
