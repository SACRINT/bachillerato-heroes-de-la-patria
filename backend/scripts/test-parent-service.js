
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const ParentService = require('../services/parent.service');
const devLogger = require('../utils/devLogger');

async function testParentService() {
    devLogger.log('🧪 Iniciando pruebas de ParentService...');

    let parentId = null;
    const testEmail = `test.parent.${Date.now()}@example.com`;

    try {
        // 1. Crear Padre (Admin)
        devLogger.log('1️⃣ Probando createParentAdmin...');
        const newParent = await ParentService.createParentAdmin({
            nombre: 'Test',
            apellido_paterno: 'Parent',
            email: testEmail,
            password: 'password123',
            telefono: '5551234567',
            parentesco: 'padre'
        });
        parentId = newParent.id;
        devLogger.log('✅ Padre creado:', newParent.id, newParent.email);

        // 2. Login
        devLogger.log('2️⃣ Probando login...');
        const auth = await ParentService.login(testEmail, 'password123');
        devLogger.log('✅ Login exitoso. Token generado.');

        // 3. Actualizar Padre
        devLogger.log('3️⃣ Probando updateParent...');
        const updated = await ParentService.updateParent(parentId, {
            nombre: 'Test Updated'
        });
        devLogger.log('✅ Padre actualizado:', updated.nombre);

        // 4. Dashboard (Sin datos reales de estudiantes vinculados, pero probando la estructura)
        devLogger.log('4️⃣ Probando getDashboard...');
        const dashboard = await ParentService.getDashboard(parentId);
        devLogger.log('✅ Dashboard obtenido. Estudiantes:', dashboard.students.length);

        // 5. Eliminar Padre (Limpieza)
        devLogger.log('5️⃣ Probando deleteParent (Limpieza)...');
        const deleted = await ParentService.deleteParent(parentId);
        devLogger.log('✅ Padre eliminado:', deleted);

        devLogger.log('🎉 Todas las pruebas básicas pasaron exitosamente.');

    } catch (error) {
        devLogger.error('❌ Error en pruebas:', error.message);
        if (error.stack) devLogger.error(error.stack);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    // Forzar SSL false para pruebas locales si es necesario, igual que en AppointmentService
    if (!process.env.DB_SSL) process.env.DB_SSL = 'false';
    testParentService();
}

module.exports = testParentService;
